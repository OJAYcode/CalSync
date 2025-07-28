import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Bell,
  Save,
  X,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import BackButton from "./BackButton";

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

console.log("CreateEvent component rendering");

const CreateEvent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    is_all_day: false,
    is_organization_wide: true,
    departments: [],
    notification_minutes: [15, 60], // Default: 15 min and 1 hour before
    recurrence_rule: "",
  });

  const [errors, setErrors] = useState({});

  // Available departments (in a real app, this would come from an API)
  const availableDepartments = [
    "HR",
    "IT",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "Legal",
    "R&D",
  ];

  // Notification options
  const notificationOptions = [
    { value: 5, label: "5 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 120, label: "2 hours before" },
    { value: 1440, label: "1 day before" },
    { value: 10080, label: "1 week before" },
  ];

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDepartmentChange = (department) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.includes(department)
        ? prev.departments.filter((d) => d !== department)
        : [...prev.departments, department],
    }));
  };

  const handleNotificationChange = (minutes) => {
    setFormData((prev) => ({
      ...prev,
      notification_minutes: prev.notification_minutes.includes(minutes)
        ? prev.notification_minutes.filter((m) => m !== minutes)
        : [...prev.notification_minutes, minutes].sort((a, b) => a - b),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }

    if (!formData.is_all_day && !formData.start_time) {
      newErrors.start_time = "Start time is required";
    }

    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    }

    if (!formData.is_all_day && !formData.end_time) {
      newErrors.end_time = "End time is required";
    }

    // Check if end datetime is after start datetime
    if (formData.start_date && formData.end_date) {
      const startDateTime = new Date(
        `${formData.start_date}T${formData.start_time || "00:00"}`
      );
      const endDateTime = new Date(
        `${formData.end_date}T${formData.end_time || "23:59"}`
      );

      if (endDateTime <= startDateTime) {
        newErrors.end_date = "End date/time must be after start date/time";
      }
    }

    if (!formData.is_organization_wide && formData.departments.length === 0) {
      newErrors.departments = "Please select at least one department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare event data
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_datetime: formData.is_all_day
          ? `${formData.start_date}T00:00:00.000Z`
          : `${formData.start_date}T${formData.start_time}:00.000Z`,
        end_datetime: formData.is_all_day
          ? `${formData.end_date}T23:59:59.000Z`
          : `${formData.end_date}T${formData.end_time}:00.000Z`,
        location: formData.location.trim(),
        is_all_day: formData.is_all_day,
        is_organization_wide: formData.is_organization_wide,
        departments: formData.is_organization_wide ? [] : formData.departments,
        reminders: formData.notification_minutes, // <-- send as reminders
        recurrence_rule: formData.recurrence_rule,
      };

      // Make API call to create event

      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Event created successfully:", responseData);
        
        setCreatedEvent(responseData);
        setShowSuccess(true);

        console.log("🎉 Success modal should show now");

        // Auto-navigate after 4 seconds to give time for the modal
        setTimeout(() => {
          setShowSuccess(false);
          navigate("/calendar", {
            state: {
              message: "Event created successfully and shared with all users!",
              eventId: eventData.id,
            },
          });
        }, 4000);
      } else {
        const errorData = await response.json();
        console.error("Failed to create event:", errorData);
        setErrors({ submit: errorData.error || "Failed to create event" });
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to create events
  if (!user?.is_admin && !user?.can_create_events) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to create events. Please contact your
            administrator to request event creation access.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success Modal
  if (showSuccess && createdEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center transform animate-pulse">
          {/* Celebration Icons */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce delay-100">
              <Sparkles className="h-5 w-5 text-yellow-600" />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h2>
          <h3 className="text-lg font-semibold text-green-600 mb-4">
            Event Created Successfully!
          </h3>

          {/* Event Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-left space-y-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">
                  {createdEvent.title}
                </span>
              </div>
              {createdEvent.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-gray-700">{createdEvent.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-700">
                  {new Date(createdEvent.start_datetime).toLocaleDateString()}{" "}
                  at{" "}
                  {createdEvent.is_all_day
                    ? "All Day"
                    : new Date(createdEvent.start_datetime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-700">
                  {createdEvent.is_organization_wide
                    ? "All Employees"
                    : `${createdEvent.departments?.join(", ")} Department(s)`}
                </span>
              </div>
            </div>
          </div>

          {/* Success Messages */}
          <div className="space-y-2 mb-6">
            <p className="text-gray-700">
              ✅ Your event has been saved and is now visible to all users!
            </p>
            <p className="text-gray-700">
              📧 Notifications have been scheduled and will be sent to all
              attendees.
            </p>
            <p className="text-green-600 font-medium">
              🚀 Automatically redirecting to calendar...
            </p>
          </div>

          {/* Manual Navigation */}
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/calendar")}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-150 ease-in-out font-medium"
            >
              View Calendar
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Create New Event
              </h1>
            </div>

            <button
              onClick={() => navigate("/calendar")}
              className="text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4"><BackButton /></div>
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* General Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{errors.submit}</div>
              </div>
            )}

            {/* Event Title */}
            <div>
              <label
                htmlFor="title"
                className="flex items-center text-sm font-medium text-gray-700 mb-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Event Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event description (optional)"
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_all_day"
                name="is_all_day"
                checked={formData.is_all_day}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_all_day"
                className="ml-2 text-sm text-gray-700"
              >
                All day event
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date/Time */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Date/Time *
                </label>
                <div className="space-y-3">
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {!formData.is_all_day && (
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.start_time ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                </div>
                {(errors.start_date || errors.start_time) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.start_date || errors.start_time}
                  </p>
                )}
              </div>

              {/* End Date/Time */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  End Date/Time *
                </label>
                <div className="space-y-3">
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.end_date ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {!formData.is_all_day && (
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.end_time ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                </div>
                {(errors.end_date || errors.end_time) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.end_date || errors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="flex items-center text-sm font-medium text-gray-700 mb-2"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event location (optional)"
              />
            </div>

            {/* Audience Selection */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Users className="h-4 w-4 mr-2" />
                Event Audience *
              </label>

              <div className="space-y-4">
                {/* Organization Wide */}
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="organization_wide"
                    name="is_organization_wide"
                    checked={formData.is_organization_wide}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_organization_wide: true,
                        departments: [],
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor="organization_wide"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Organization-wide (all employees)
                  </label>
                </div>

                {/* Department Specific */}
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="department_specific"
                    name="is_organization_wide"
                    checked={!formData.is_organization_wide}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_organization_wide: false,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                  />
                  <div className="ml-2 flex-1">
                    <label
                      htmlFor="department_specific"
                      className="text-sm text-gray-700"
                    >
                      Specific departments
                    </label>

                    {!formData.is_organization_wide && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableDepartments.map((dept) => (
                          <label key={dept} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.departments.includes(dept)}
                              onChange={() => handleDepartmentChange(dept)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {dept}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {errors.departments && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.departments}
                </p>
              )}
            </div>

            {/* Notifications */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Bell className="h-4 w-4 mr-2" />
                Send Reminders
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notificationOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notification_minutes.includes(
                        option.value
                      )}
                      onChange={() => handleNotificationChange(option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Selected reminders will be sent as in-app notifications to all attendees.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
