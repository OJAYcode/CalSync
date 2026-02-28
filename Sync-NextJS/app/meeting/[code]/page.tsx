"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { meetingService } from "@/lib/services";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
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
          const socket = connectSocket();
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

    // Existing participants already in the room
    socket.on(
      MeetingEvents.EXISTING_PARTICIPANTS,
      (data: {
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
      },
    );

    // New participant joined
    socket.on(
      MeetingEvents.USER_JOINED,
      async (data: {
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
      },
    );

    // Participant left
    socket.on(MeetingEvents.USER_LEFT, (data: { peer_id: string }) => {
      console.log("[Meeting] User left:", data.peer_id);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.peer_id);
        return next;
      });
      peerConnections.current.get(data.peer_id)?.close();
      peerConnections.current.delete(data.peer_id);
    });

    // Receive WebRTC offer
    socket.on(
      MeetingEvents.OFFER,
      async (data: {
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
      },
    );

    // Receive WebRTC answer
    socket.on(
      MeetingEvents.ANSWER,
      async (data: {
        sender_peer_id: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        console.log("[WebRTC] Received answer from:", data.sender_peer_id);
        const pc = peerConnections.current.get(data.sender_peer_id);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      },
    );

    // ICE candidate
    socket.on(
      MeetingEvents.ICE_CANDIDATE,
      async (data: {
        sender_peer_id: string;
        candidate: RTCIceCandidateInit;
      }) => {
        console.log(
          "[WebRTC] Received ICE candidate from:",
          data.sender_peer_id,
        );
        const pc = peerConnections.current.get(data.sender_peer_id);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      },
    );

    // Chat
    socket.on(MeetingEvents.CHAT_MESSAGE, (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Audio/Video toggles from others
    socket.on(
      MeetingEvents.TOGGLE_AUDIO,
      (data: { peer_id: string; enabled: boolean }) => {
        setParticipants((prev) => {
          const next = new Map(prev);
          const p = next.get(data.peer_id);
          if (p) next.set(data.peer_id, { ...p, audioEnabled: data.enabled });
          return next;
        });
      },
    );

    socket.on(
      MeetingEvents.TOGGLE_VIDEO,
      (data: { peer_id: string; enabled: boolean }) => {
        setParticipants((prev) => {
          const next = new Map(prev);
          const p = next.get(data.peer_id);
          if (p) next.set(data.peer_id, { ...p, videoEnabled: data.enabled });
          return next;
        });
      },
    );

    // Reactions
    socket.on(MeetingEvents.REACTION, (data: { emoji: string }) => {
      showFloatingReaction(data.emoji);
    });

    // Meeting ended
    socket.on(MeetingEvents.MEETING_ENDED, () => {
      cleanup();
      router.push("/meetings");
    });

    return socket;
  }, [code, createPeerConnection, router]);

  // ─── Bind local stream to video element after join renders it ───
  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [joined]);

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

      // Ensure any previous socket is fully cleaned up
      disconnectSocket();

      // Set up all meeting event listeners BEFORE connecting
      const socket = setupSocket();

      const emitJoin = () => {
        console.log("[Meeting] Emitting join-meeting with peer_id:", myPeerId);
        socket.emit(MeetingEvents.JOIN, {
          meeting_code: code,
          peer_id: myPeerId,
          user_id: user?.id || null,
          display_name: user?.full_name || user?.first_name || "User",
        });
      };

      // Listen for connection events
      socket.on("connect", () => {
        console.log("[Meeting] Socket connected, id:", socket.id);
        setIsConnected(true);
        // Join meeting room AFTER socket is connected
        emitJoin();
      });

      socket.on("disconnect", (reason) => {
        console.log("[Meeting] Socket disconnected, reason:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("[Meeting] Socket connection error:", err.message);
        setIsConnected(false);
      });

      // Now connect — listeners are already in place
      const token = localStorage.getItem("session_token");
      socket.auth = { token };
      socket.connect();

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
        const socket = connectSocket();
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
        const socket = connectSocket();
        socket.emit(MeetingEvents.TOGGLE_VIDEO, {
          meeting_code: code,
          enabled: track.enabled,
        });
      }
    }
  }

  // ─── Screen sharing ───
  async function toggleScreenShare() {
    const socket = connectSocket();
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
    const socket = connectSocket();
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
    const socket = connectSocket();
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
  function cleanup(shouldDisconnectSocket = true) {
    // Emit leave if socket is currently connected
    try {
      const s = getSocket();
      if (s.connected) {
        s.emit(MeetingEvents.LEAVE, {
          meeting_code: code,
          peer_id: myPeerId,
        });
      }
    } catch {}
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    if (shouldDisconnectSocket) {
      disconnectSocket();
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
