import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";

// API URL configuration - using Railway backend
const API_URL = "https://calsync-production.up.railway.app";

const Calendar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month"); // month, week, day
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setShowSuccessModal(true);
      // Clear the state to prevent showing on refresh
      window.history.replaceState({}, document.title);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 5000);
    }
  }, [location.state]);

  // Get calendar data for current month
  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform events for calendar display
        const transformedEvents = data.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime,
          location: event.location,
          is_all_day: event.is_all_day,
          is_organization_wide: event.is_organization_wide,
          departments: event.departments,
          creator_name: event.created_by.name,
          creator_email: event.created_by.email,
          created_at: event.created_at,
        }));

        setEvents(transformedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      // Fallback to empty array on error
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get days in month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];

    const dayDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return events.filter((event) => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Filtered events by department
  const filteredEvents = departmentFilter === 'all'
    ? events
    : events.filter(event =>
        event.is_organization_wide ||
        (event.departments && event.departments.includes(departmentFilter))
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Success!</h3>
                <p className="text-xs sm:text-sm text-gray-600">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-xs sm:text-sm text-green-700">
                🎉 Your event is now live and visible to all users!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Organization Calendar
              </h1>
            </div>

            {/* Create Event Button (admin only) */}
            {user?.is_admin && (
              <Link
                to="/events/create"
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Department Filter (for employees) */}
      {user && !user.is_admin && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <label htmlFor="departmentFilter" className="text-sm text-gray-700">Filter by Department:</label>
            <select
              id="departmentFilter"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="border px-2 py-1 rounded text-sm w-full sm:w-auto"
            >
              <option value="all">All</option>
              {user.department && <option value={user.department}>{user.department}</option>}
              {/* Add more departments as needed */}
            </select>
          </div>
        </div>
      )}

      {/* Calendar Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="mb-4"><BackButton /></div>
        <div className="bg-white rounded-lg shadow">
          {/* Calendar Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-1 sm:p-2 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>

                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>

                <button
                  onClick={() => navigateMonth("next")}
                  className="p-1 sm:p-2 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>

                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                >
                  Today
                </button>
              </div>

              {/* View Selector */}
              <div className="flex space-x-1 sm:space-x-2">
                {["month", "week", "day"].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition duration-150 ease-in-out ${
                      view === viewType
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-4 lg:p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-1 sm:mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="py-1 sm:py-2 text-center text-xs sm:text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {getDaysInMonth().map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  day &&
                  new Date().toDateString() ===
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] bg-white p-1 sm:p-2 ${
                      !day ? "bg-gray-50" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                            isToday ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          <span
                            className={
                              isToday
                                ? "bg-blue-600 text-white rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm"
                                : ""
                            }
                          >
                            {day}
                          </span>
                        </div>

                        {/* Events for this day */}
                        <div className="space-y-0.5 sm:space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-0.5 sm:p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition duration-150 ease-in-out"
                              title={`${event.title}\n${formatTime(
                                event.start_datetime
                              )} - ${formatTime(event.end_datetime)}\n${
                                event.location || ""
                              }`}
                            >
                              <div className="font-medium truncate text-xs">
                                {event.title}
                              </div>
                              <div className="text-blue-600 flex items-center text-xs">
                                <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                {formatTime(event.start_datetime)}
                              </div>
                            </div>
                          ))}

                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 p-0.5 sm:p-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Upcoming Events
            </h3>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  No events scheduled
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {user?.is_admin
                    ? "Create your first event to get started."
                    : "No events have been scheduled yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition duration-150 ease-in-out"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          {event.title}
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="break-words">
                              {new Date(event.start_datetime).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )} {" "}
                              at {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-start">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-start">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 mt-0.5 flex-shrink-0" />
                            <span className="break-words">
                              {event.is_organization_wide
                                ? "Organization-wide"
                                : `Departments: ${event.departments?.join(", ") || "Specific groups"}`}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Created by: {event.creator_name}
                          </div>
                        </div>
                        {event.description && (
                          <p className="mt-3 text-xs sm:text-sm text-gray-700 break-words">
                            {event.description}
                          </p>
                        )}
                      </div>
                      {/* Event Badge */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${
                          event.is_organization_wide
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.is_organization_wide
                          ? "Organization"
                          : "Department"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
