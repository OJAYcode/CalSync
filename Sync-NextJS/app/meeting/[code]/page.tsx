"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { meetingService } from "@/lib/services";
import {
  getSocket,
  ensureConnected,
  destroySocket,
  MeetingEvents,
} from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/utils";
import type { Meeting, ChatMessage } from "@/lib/types";
import {
  Mic,
  MicOff,
  Video,
  VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Phone,
  MessageSquare,
  Users,
  X,
  Send,
  SmilePlus,
  Hand,
  ThumbsUp,
  Heart,
  Laugh,
  ChevronRight,
} from "lucide-react";

// ─── Types ───
interface Participant {
  id: string;
  peer_id: string;
  name: string;
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  peerId: string;
}

// ─── ICE Servers ───
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ─── Reactions ───
const REACTIONS = [
  { emoji: "👍", icon: ThumbsUp, label: "Thumbs up" },
  { emoji: "❤️", icon: Heart, label: "Heart" },
  { emoji: "😂", icon: Laugh, label: "Laugh" },
  { emoji: "✋", icon: Hand, label: "Raise hand" },
];

export default function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Meeting state
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  // Media state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Participants
  const [participants, setParticipants] = useState<Map<string, Participant>>(
    new Map(),
  );
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [myPeerId] = useState(
    () => `peer-${Math.random().toString(36).substr(2, 9)}`,
  );
  const [isConnected, setIsConnected] = useState(false);
  const joinedRef = useRef(false);

  // UI panels
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string }[]
  >([]);
  const reactionIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Join meeting via API ───
  // ─── Fetch meeting info (don't join yet) ───
  useEffect(() => {
    if (!code) return;
    meetingService
      .getById(code)
      .then((res) => {
        const m = res.data.meeting || res.data;
        setMeeting(m as Meeting);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [code]);

  // ─── Auto-scroll chat ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Create peer connection ───
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      // Don't create duplicate connections
      const existing = peerConnections.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket.emit(MeetingEvents.ICE_CANDIDATE, {
            meeting_code: code,
            target_peer_id: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Remote stream
      pc.ontrack = (event) => {
        console.log("[WebRTC] Got remote track from:", peerId);
        setParticipants((prev) => {
          const next = new Map(prev);
          const p = next.get(peerId);
          if (p) {
            next.set(peerId, { ...p, stream: event.streams[0] });
          }
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC] Connection state (${peerId}):`,
          pc.connectionState,
        );
      };

      peerConnections.current.set(peerId, pc);
      return pc;
    },
    [code],
  );

  // ─── Socket setup (listeners only, does NOT connect) ───
  const setupSocket = useCallback(() => {
    const socket = getSocket();

    // ── Meeting event handlers ──

    const onExistingParticipants = (data: {
      participants: Array<{
        peer_id: string;
        user_id: string;
        display_name: string;
      }>;
    }) => {
      console.log("[Meeting] Existing participants:", data.participants);
      data.participants.forEach((p) => {
        setParticipants((prev) => {
          const next = new Map(prev);
          next.set(p.peer_id, {
            id: p.user_id || p.peer_id,
            peer_id: p.peer_id,
            name: p.display_name || "Participant",
            audioEnabled: true,
            videoEnabled: true,
            isScreenSharing: false,
          });
          return next;
        });

        // Create WebRTC peer connection for each existing participant
        const pc = createPeerConnection(p.peer_id);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            console.log("[WebRTC] Sending offer to:", p.peer_id);
            socket.emit(MeetingEvents.OFFER, {
              meeting_code: code,
              target_peer_id: p.peer_id,
              offer,
            });
          })
          .catch((err) => console.error("[WebRTC] Offer error:", err));
      });
    };

    const onUserJoined = async (data: {
      peer_id: string;
      user_id: string;
      display_name: string;
    }) => {
      console.log("[Meeting] User joined:", data.display_name, data.peer_id);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(data.peer_id, {
          id: data.user_id || data.peer_id,
          peer_id: data.peer_id,
          name: data.display_name || "Participant",
          audioEnabled: true,
          videoEnabled: true,
          isScreenSharing: false,
        });
        return next;
      });

      // Create offer for new participant
      const pc = createPeerConnection(data.peer_id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[WebRTC] Sending offer to:", data.peer_id);
      socket.emit(MeetingEvents.OFFER, {
        meeting_code: code,
        target_peer_id: data.peer_id,
        offer,
      });
    };

    const onUserLeft = (data: { peer_id: string }) => {
      console.log("[Meeting] User left:", data.peer_id);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.peer_id);
        return next;
      });
      peerConnections.current.get(data.peer_id)?.close();
      peerConnections.current.delete(data.peer_id);
    };

    const onOffer = async (data: {
      sender_peer_id: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log("[WebRTC] Received offer from:", data.sender_peer_id);
      const pc = createPeerConnection(data.sender_peer_id);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(MeetingEvents.ANSWER, {
        meeting_code: code,
        target_peer_id: data.sender_peer_id,
        answer,
      });
    };

    const onAnswer = async (data: {
      sender_peer_id: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log("[WebRTC] Received answer from:", data.sender_peer_id);
      const pc = peerConnections.current.get(data.sender_peer_id);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const onIceCandidate = async (data: {
      sender_peer_id: string;
      candidate: RTCIceCandidateInit;
    }) => {
      console.log("[WebRTC] Received ICE candidate from:", data.sender_peer_id);
      const pc = peerConnections.current.get(data.sender_peer_id);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const onToggleAudio = (data: { peer_id: string; enabled: boolean }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(data.peer_id);
        if (p) next.set(data.peer_id, { ...p, audioEnabled: data.enabled });
        return next;
      });
    };

    const onToggleVideo = (data: { peer_id: string; enabled: boolean }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(data.peer_id);
        if (p) next.set(data.peer_id, { ...p, videoEnabled: data.enabled });
        return next;
      });
    };

    const onReaction = (data: { emoji: string }) => {
      showFloatingReaction(data.emoji);
    };

    const onMeetingEnded = () => {
      cleanup();
      router.push("/meetings");
    };

    // ── Attach all listeners ──
    socket.on(MeetingEvents.EXISTING_PARTICIPANTS, onExistingParticipants);
    socket.on(MeetingEvents.USER_JOINED, onUserJoined);
    socket.on(MeetingEvents.USER_LEFT, onUserLeft);
    socket.on(MeetingEvents.OFFER, onOffer);
    socket.on(MeetingEvents.ANSWER, onAnswer);
    socket.on(MeetingEvents.ICE_CANDIDATE, onIceCandidate);
    socket.on(MeetingEvents.CHAT_MESSAGE, onChatMessage);
    socket.on(MeetingEvents.TOGGLE_AUDIO, onToggleAudio);
    socket.on(MeetingEvents.TOGGLE_VIDEO, onToggleVideo);
    socket.on(MeetingEvents.REACTION, onReaction);
    socket.on(MeetingEvents.MEETING_ENDED, onMeetingEnded);

    // Return teardown function that removes ONLY our listeners
    return () => {
      socket.off(MeetingEvents.EXISTING_PARTICIPANTS, onExistingParticipants);
      socket.off(MeetingEvents.USER_JOINED, onUserJoined);
      socket.off(MeetingEvents.USER_LEFT, onUserLeft);
      socket.off(MeetingEvents.OFFER, onOffer);
      socket.off(MeetingEvents.ANSWER, onAnswer);
      socket.off(MeetingEvents.ICE_CANDIDATE, onIceCandidate);
      socket.off(MeetingEvents.CHAT_MESSAGE, onChatMessage);
      socket.off(MeetingEvents.TOGGLE_AUDIO, onToggleAudio);
      socket.off(MeetingEvents.TOGGLE_VIDEO, onToggleVideo);
      socket.off(MeetingEvents.REACTION, onReaction);
      socket.off(MeetingEvents.MEETING_ENDED, onMeetingEnded);
    };
  }, [code, createPeerConnection, router]);

  // ─── Bind local stream to video element after join renders it ───
  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [joined]);

  // ─── Ref to hold the teardown function from setupSocket ───
  const teardownRef = useRef<(() => void) | null>(null);

  // ─── Join the meeting ───
  async function joinMeeting() {
    try {
      // Join via API (ignore failures — backend may not require it)
      await meetingService.join(code).catch(() => {});

      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;

      // Get the shared socket and attach meeting listeners FIRST
      // ensureConnected() will recreate a stale socket if needed
      const socket = ensureConnected();

      // Remove any stale meeting listeners from a previous join
      if (teardownRef.current) {
        teardownRef.current();
        teardownRef.current = null;
      }

      // Attach all meeting event listeners
      const teardown = setupSocket();
      teardownRef.current = teardown;

      // Function to emit join-meeting
      const emitJoin = () => {
        console.log("[Meeting] Emitting join-meeting:", {
          meeting_code: code,
          peer_id: myPeerId,
          user_id: user?.id,
          display_name: user?.full_name || user?.first_name || "User",
        });
        socket.emit(MeetingEvents.JOIN, {
          meeting_code: code,
          peer_id: myPeerId,
          user_id: user?.id || null,
          display_name: user?.full_name || user?.first_name || "User",
        });
      };

      // Track connection state
      const onConnect = () => {
        console.log("[Meeting] Socket connected, id:", socket.id);
        setIsConnected(true);
        // Emit join-meeting whenever we (re)connect so the server
        // knows we're in the room even after a reconnection.
        emitJoin();
      };

      const onDisconnect = (reason: string) => {
        console.warn("[Meeting] Socket disconnected:", reason);
        setIsConnected(false);

        // If the server forcefully disconnected us and the socket module
        // already handles reconnection, we still want to ensure it's trying.
        // For "transport close" / "ping timeout", Socket.IO auto-reconnects.
        if (reason === "io server disconnect" || reason === "transport close") {
          console.log("[Meeting] Ensuring reconnection after:", reason);
          setTimeout(() => {
            // ensureConnected will recreate a stale socket if needed
            ensureConnected();
          }, 1000);
        }
      };

      const onConnectError = (err: Error) => {
        console.error("[Meeting] Connection error:", err.message);
        setIsConnected(false);
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);

      // Store these for cleanup too
      const prevTeardown = teardownRef.current;
      teardownRef.current = () => {
        prevTeardown?.();
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
      };

      // Now connect (or if already connected, just emit join)
      if (socket.connected) {
        console.log("[Meeting] Socket already connected, joining immediately");
        setIsConnected(true);
        emitJoin();
      } else {
        console.log("[Meeting] Connecting socket...");
        // socket is already being connected by ensureConnected() above
      }

      joinedRef.current = true;
      setJoined(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError(
          "Camera/microphone access denied. Please allow access and try again.",
        );
      } else {
        setError("Failed to access camera/microphone: " + err.message);
      }
    }
  }

  // ─── Toggle audio ───
  function toggleAudio() {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
        const socket = getSocket();
        socket.emit(MeetingEvents.TOGGLE_AUDIO, {
          meeting_code: code,
          enabled: track.enabled,
        });
      }
    }
  }

  // ─── Toggle video ───
  function toggleVideo() {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
        const socket = getSocket();
        socket.emit(MeetingEvents.TOGGLE_VIDEO, {
          meeting_code: code,
          enabled: track.enabled,
        });
      }
    }
  }

  // ─── Screen sharing ───
  async function toggleScreenShare() {
    const socket = getSocket();
    if (isScreenSharing) {
      // Stop screen share
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      socket.emit(MeetingEvents.SCREEN_SHARE_STOP, { meeting_code: code });

      // Replace tracks back to camera
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          sender?.replaceTrack(videoTrack);
        });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        socket.emit(MeetingEvents.SCREEN_SHARE_START, { meeting_code: code });

        const screenTrack = screenStream.getVideoTracks()[0];
        // Replace video track in all peers
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          sender?.replaceTrack(screenTrack);
        });

        // When user stops via browser UI
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          socket.emit(MeetingEvents.SCREEN_SHARE_STOP, { meeting_code: code });
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            peerConnections.current.forEach((pc) => {
              const sender = pc
                .getSenders()
                .find((s) => s.track?.kind === "video");
              sender?.replaceTrack(camTrack);
            });
          }
        };
      } catch (err) {
        console.log("Screen share cancelled or failed");
      }
    }
  }

  // ─── Send chat ───
  function sendChat() {
    if (!chatInput.trim()) return;
    const socket = getSocket();
    socket.emit(MeetingEvents.CHAT_MESSAGE, {
      meeting_code: code,
      message: chatInput.trim(),
    });
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user_id: user?.id || "",
        user_name: user?.full_name || user?.first_name || "You",
        sender_name: user?.full_name || user?.first_name || "You",
        message: chatInput.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatInput("");
  }

  // ─── Reactions ───
  function sendReaction(emoji: string) {
    const socket = getSocket();
    socket.emit(MeetingEvents.REACTION, { meeting_code: code, emoji });
    showFloatingReaction(emoji);
  }

  function showFloatingReaction(emoji: string) {
    const id = reactionIdRef.current++;
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }

  // ─── Leave / Cleanup ───
  function cleanup(shouldDestroy = false) {
    // Emit leave if socket is connected
    try {
      const s = getSocket();
      if (s?.connected) {
        s.emit(MeetingEvents.LEAVE, {
          meeting_code: code,
          peer_id: myPeerId,
        });
      }
    } catch {}

    // Remove meeting-specific listeners
    if (teardownRef.current) {
      teardownRef.current();
      teardownRef.current = null;
    }

    // Stop media tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Close peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    // Only destroy the socket instance when truly leaving
    if (shouldDestroy) {
      destroySocket();
    }
  }

  function leaveMeeting() {
    cleanup(true);
    router.push("/meetings");
  }

  // Cleanup on unmount — only if actually joined
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        cleanup(true);
        joinedRef.current = false;
      }
    };
  }, []);

  // ─── Pre-join lobby ───
  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <Video className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {meeting?.title || "Meeting"}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Code: <span className="font-mono text-gray-300">{code}</span>
          </p>

          {error ? (
            <div className="bg-red-900/30 text-red-300 text-sm rounded-lg p-4 mb-4">
              {error}
            </div>
          ) : null}

          <button
            onClick={joinMeeting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Join Now
          </button>
          <button
            onClick={() => router.push("/meetings")}
            className="mt-3 text-sm text-gray-400 hover:text-gray-300"
          >
            Back to meetings
          </button>
        </div>
      </div>
    );
  }

  // ─── Video grid ───
  const participantArray = Array.from(participants.values());
  const totalTiles = participantArray.length + 1; // +1 for self
  const gridCols =
    totalTiles <= 1
      ? "grid-cols-1 max-w-2xl mx-auto"
      : totalTiles <= 4
        ? "grid-cols-2"
        : totalTiles <= 9
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-600/90 text-white text-xs text-center py-1 px-2 flex-shrink-0">
          Connecting to server...
        </div>
      )}

      {/* Floating Reactions */}
      <div className="absolute bottom-24 left-8 z-50 pointer-events-none">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="text-4xl animate-bounce"
            style={{ animation: "floatUp 3s ease-out forwards" }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0">
        {/* Video Grid */}
        <div
          className={`flex-1 p-3 sm:p-4 grid ${gridCols} gap-2 sm:gap-3 auto-rows-fr overflow-hidden`}
        >
          {/* Self */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[120px] max-h-[calc(100vh-10rem)]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {user?.first_name?.charAt(0) || "Y"}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-md px-2 py-1">
              {!audioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
              <span className="text-xs text-white">You</span>
            </div>
          </div>

          {/* Remote Participants */}
          {participantArray.map((p) => (
            <div
              key={p.id}
              className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[120px] max-h-[calc(100vh-10rem)]"
            >
              {p.stream ? (
                <VideoTile stream={p.stream} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {p.name?.charAt(0) || "?"}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-md px-2 py-1">
                {!p.audioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                <span className="text-xs text-white">{p.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={msg.id || i}>
                  <p className="text-xs text-blue-400 font-medium">
                    {msg.sender_name}
                  </p>
                  <p className="text-sm text-gray-200">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
                <button
                  onClick={sendChat}
                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">
                Participants ({totalTiles})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Self */}
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.first_name?.charAt(0) || "Y"}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">You</p>
                </div>
                <div className="flex gap-1">
                  {!audioEnabled && (
                    <MicOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {!videoEnabled && (
                    <VideoOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
              </div>
              {/* Others */}
              {participantArray.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {p.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{p.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {!p.audioEnabled && (
                      <MicOff className="h-3.5 w-3.5 text-red-400" />
                    )}
                    {!p.videoEnabled && (
                      <VideoOff className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-16 sm:h-20 bg-gray-800/90 border-t border-gray-700 flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 flex-shrink-0">
        {/* Audio */}
        <button
          onClick={toggleAudio}
          className={`p-2 sm:p-3 rounded-full transition ${audioEnabled ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}
        >
          {audioEnabled ? (
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Video */}
        <button
          onClick={toggleVideo}
          className={`p-2 sm:p-3 rounded-full transition ${videoEnabled ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}
        >
          {videoEnabled ? (
            <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`hidden sm:block p-2 sm:p-3 rounded-full transition ${isScreenSharing ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"}`}
        >
          {isScreenSharing ? (
            <MonitorOff className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Reactions */}
        <div className="hidden sm:flex gap-1.5">
          {REACTIONS.map((r) => (
            <button
              key={r.emoji}
              onClick={() => sendReaction(r.emoji)}
              className="p-1.5 sm:p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition text-sm sm:text-lg"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>

        {/* Chat */}
        <button
          onClick={() => {
            setShowChat(!showChat);
            setShowParticipants(false);
          }}
          className={`p-2 sm:p-3 rounded-full transition ${showChat ? "bg-blue-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"}`}
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Participants */}
        <button
          onClick={() => {
            setShowParticipants(!showParticipants);
            setShowChat(false);
          }}
          className={`p-2 sm:p-3 rounded-full transition ${showParticipants ? "bg-blue-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"}`}
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Leave */}
        <button
          onClick={leaveMeeting}
          className="p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition ml-2 sm:ml-4"
        >
          <Phone className="h-4 w-4 sm:h-5 sm:w-5 rotate-[135deg]" />
        </button>
      </div>

      {/* Float-up CSS animation */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px);
          }
        }
      `}</style>

      {/* Debug Panel — REMOVE AFTER DEBUGGING */}
      <DebugPanel
        meetingCode={code}
        peerId={myPeerId}
        isConnected={isConnected}
      />
    </div>
  );
}

// ─── Debug Panel (temporary) ───
function DebugPanel({
  meetingCode,
  peerId,
  isConnected,
}: {
  meetingCode: string;
  peerId: string;
  isConnected: boolean;
}) {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  // Update socket ID whenever connection state changes
  useEffect(() => {
    try {
      const s = getSocket();
      setSocketId(s?.id);
    } catch {}
  }, [isConnected]);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://calsync-backend-nmxe.onrender.com/meetings/${meetingCode}/debug/active-peers`,
      );
      const data = await res.json();
      setDebugData(data);
      console.log("[Debug] Active peers:", data);
    } catch (err) {
      console.error("[Debug] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 3 seconds when enabled
  useEffect(() => {
    if (!open || !autoRefresh) return;
    fetchDebugInfo();
    const interval = setInterval(fetchDebugInfo, 3000);
    return () => clearInterval(interval);
  }, [open, autoRefresh, meetingCode]);

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          fetchDebugInfo();
        }}
        className="fixed bottom-4 right-4 z-[9999] bg-gray-800 text-green-400 text-xs font-mono px-3 py-2 rounded-lg border border-green-500/30 hover:bg-gray-700"
      >
        🔍 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-green-400 font-mono text-xs rounded-xl border border-green-500/30 shadow-2xl p-4 max-w-sm w-80 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">🔍 Debug Panel</span>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-white text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="space-y-1 mb-3 text-[11px]">
        <div>
          Socket:{" "}
          {isConnected ? "🟢 " + (socketId || "connected") : "🔴 disconnected"}
        </div>
        <div>
          My Peer: <span className="text-white">{peerId}</span>
        </div>
        <div>
          Meeting: <span className="text-white">{meetingCode}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={fetchDebugInfo}
          disabled={loading}
          className="flex-1 bg-green-500 text-black font-bold text-xs py-1.5 rounded-md hover:bg-green-400 disabled:opacity-50"
        >
          {loading ? "..." : "Refresh"}
        </button>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-3 py-1.5 text-xs rounded-md font-bold ${autoRefresh ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-300"}`}
        >
          {autoRefresh ? "Auto ●" : "Auto ○"}
        </button>
      </div>

      {debugData && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Active Peers:</span>
            <span
              className={`font-bold ${debugData.active_peer_count > 0 ? "text-green-300" : "text-red-400"}`}
            >
              {debugData.active_peer_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Meetings:</span>
            <span className="text-white">
              {debugData.total_meetings_with_peers}
            </span>
          </div>
          {debugData.peers?.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {debugData.peers.map((p: any) => (
                <div
                  key={p.peer_id}
                  className={`rounded-md p-2 ${p.peer_id === peerId ? "bg-blue-900/50 border border-blue-500/30" : "bg-gray-800"}`}
                >
                  <div className="text-white">
                    👤 {p.display_name} {p.peer_id === peerId ? "(you)" : ""}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    peer: {p.peer_id}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    socket: {p.socket_id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-yellow-400 text-[11px]">
              No peers found — backend may not have received join-meeting event
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VideoTile component ───
function VideoTile({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
