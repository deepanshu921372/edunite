import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { teacherAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import toast from "react-hot-toast";

const TimetableManagement = () => {
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [processingId, setProcessingId] = useState(null);
  const [formData, setFormData] = useState({
    grade: "",
    subject: "",
    daysOfWeek: [],
    startTime: "",
    endTime: "",
    location: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showModal) {
        handleCloseModal();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener("keydown", handleEscKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showModal]);

  const fetchData = async () => {
    try {
      const [timetableResponse, classesResponse, profileResponse] = await Promise.all([
        teacherAPI.getTimetable(),
        teacherAPI.getMyClasses(),
        teacherAPI.getProfile(),
      ]);

      // Handle different response structures from backend
      const timetableData = Array.isArray(timetableResponse)
        ? timetableResponse
        : timetableResponse?.data || [];
      const classesData = Array.isArray(classesResponse)
        ? classesResponse
        : classesResponse?.data || [];
      const profileData = profileResponse?.data || profileResponse;

      setTimetable(timetableData);
      setClasses(classesData);
      setTeacherProfile(profileData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.grade ||
      !formData.subject ||
      formData.daysOfWeek.length === 0 ||
      !formData.startTime ||
      !formData.endTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setProcessingId("form");
    try {
      // Find or create a class for this grade-subject combination
      let targetClass = classes.find(cls =>
        cls.grade === formData.grade &&
        cls.subject === formData.subject
      );

      if (!targetClass) {
        toast.error(`No class found for ${formData.grade} - ${formData.subject}. Please contact admin to create this class.`);
        return;
      }

      // Create schedule array for the timetable API
      const scheduleData = formData.daysOfWeek.map(day => ({
        day: day,
        timeSlots: [{
          startTime: formData.startTime,
          endTime: formData.endTime,
          subject: formData.subject
        }]
      }));

      const submissionData = {
        classId: targetClass._id || targetClass.id,
        schedule: scheduleData
      };

      await teacherAPI.createTimetableEntry(submissionData);
      toast.success("Timetable entries created successfully");

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving timetable entry:", error);
      toast.error("Failed to save timetable entry");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (entryId) => {
    if (
      !window.confirm("Are you sure you want to delete this timetable entry?")
    ) {
      return;
    }

    setProcessingId(entryId);
    try {
      // For now, we'll just show a message since the backend doesn't support individual entry deletion
      toast.error("Individual entry deletion not supported yet. Please contact admin.");
    } catch (error) {
      console.error("Error deleting timetable entry:", error);
      toast.error("Failed to delete timetable entry");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    const classInfo = classes.find((c) => c._id === entry.class || c.id === entry.class);

    setFormData({
      grade: classInfo?.grade || "",
      subject: classInfo?.subject || entry.subject || "",
      daysOfWeek: entry.day ? [entry.day] : [],
      startTime: entry.startTime,
      endTime: entry.endTime,
      location: entry.location || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      grade: "",
      subject: "",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      location: "",
    });
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClassesForDay = (dayName) => {
    const dayClasses = [];

    timetable.forEach(timetableEntry => {
      if (timetableEntry.schedule) {
        timetableEntry.schedule.forEach(scheduleItem => {
          if (scheduleItem.day === dayName) {
            scheduleItem.timeSlots.forEach(timeSlot => {
              dayClasses.push({
                id: `${timetableEntry._id}-${scheduleItem.day}-${timeSlot.startTime}`,
                timetableId: timetableEntry._id,
                class: timetableEntry.class,
                day: scheduleItem.day,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                subject: timeSlot.subject,
                location: timetableEntry.location || ''
              });
            });
          }
        });
      }
    });

    return dayClasses;
  };

  const weekDates = getWeekDates(currentWeek);

  if (loading) {
    return <LoadingSpinner message="Loading timetable..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Timetable Management
          </h2>
          <p className="mt-2 text-gray-600">
            Manage your class schedule and organize your teaching timetable.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const prevWeek = new Date(currentWeek);
              prevWeek.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(prevWeek);
            }}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Week
          </button>

          <h3 className="text-lg font-medium text-gray-900">
            Week of {weekDates[0].toLocaleDateString()} -{" "}
            {weekDates[6].toLocaleDateString()}
          </h3>

          <button
            onClick={() => {
              const nextWeek = new Date(currentWeek);
              nextWeek.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(nextWeek);
            }}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Next Week
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {daysOfWeek.map((day, dayIndex) => (
            <div key={day} className="p-4">
              <div className="text-center mb-4">
                <h3 className="font-medium text-gray-900">{day}</h3>
                <p className="text-sm text-gray-500">
                  {weekDates[dayIndex].toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>

              <div className="space-y-2">
                {getClassesForDay(day).map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg hover:bg-blue-100 transition-colors duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-blue-900 truncate">
                          {(() => {
                            const classInfo = classes.find((c) => c._id === entry.class || c.id === entry.class);
                            if (classInfo) {
                              return `${classInfo.grade} - ${classInfo.subject}`;
                            }
                            return entry.subject ? `${entry.subject}` : "Unknown Class";
                          })()}
                        </h4>
                        <div className="flex items-center mt-1 text-xs text-blue-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(entry.startTime)} -{" "}
                          {formatTime(entry.endTime)}
                        </div>
                        {entry.location && (
                          <div className="flex items-center mt-1 text-xs text-blue-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            {entry.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={processingId === entry.id}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {processingId === entry.id ? (
                            <LoadingSpinner size="sm" message="" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {getClassesForDay(day).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No classes scheduled</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <motion.div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
              />

              {/* Center modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                &#8203;
              </span>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 pr-8">
                          {editingEntry ? "Edit Class Schedule" : "Add Class Schedule"}
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Grade *
                            </label>
                            <select
                              required
                              value={formData.grade}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  grade: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a grade</option>
                              {teacherProfile?.profile?.teachingGrades?.map((grade) => (
                                <option key={grade} value={grade}>
                                  {grade}
                                </option>
                              )) || (
                                <option disabled>No grades available</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject *
                            </label>
                            <select
                              required
                              value={formData.subject}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  subject: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a subject</option>
                              {teacherProfile?.profile?.teachingSubjects?.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              )) || (
                                <option disabled>No subjects available</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Days of Week * (Multiple Selection)
                            </label>
                            <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-lg p-3">
                              {daysOfWeek.map((day) => (
                                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.daysOfWeek.includes(day)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          daysOfWeek: [...formData.daysOfWeek, day],
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          daysOfWeek: formData.daysOfWeek.filter((d) => d !== day),
                                        });
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{day}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time *
                              </label>
                              <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    startTime: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time *
                              </label>
                              <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    endTime: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  location: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Room A-101, Lab B-202"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={processingId === "form"}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {processingId === "form" ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : editingEntry ? (
                        "Update Schedule"
                      ) : (
                        "Add Schedule"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetableManagement;