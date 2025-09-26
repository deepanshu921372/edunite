import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  BookOpen,
  Award,
  Clock,
  Users,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const TeacherProfile = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    qualifications: '',
    experience: '',
    specialization: '',
    teachingGrades: [],
    teachingSubjects: [],
    joinedDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  // Grade options for teaching
  const gradeOptions = [
    'Nursery', 'LKG', 'UKG',
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    '11th', '12th'
  ];

  // Subject options for teaching
  const subjectOptions = [
    'Mathematics', 'English', 'Hindi', 'Science',
    'Social Studies', 'Physics', 'Chemistry', 'Biology',
    'Accountancy', 'Business Studies', 'Economics',
    'Computer Science', 'History', 'Geography', 'Political Science',
    'Art & Craft', 'Physical Education', 'Music'
  ];

  // Specialization options
  const specializationOptions = [
    'Mathematics', 'Science', 'English Literature', 'Physics',
    'Chemistry', 'Biology', 'Commerce', 'Social Studies',
    'Computer Science', 'Arts & Humanities', 'Physical Education'
  ];

  // Relationship options for emergency contact
  const relationshipOptions = [
    'Spouse', 'Parent', 'Sibling', 'Friend', 'Relative', 'Other'
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (currentUser) {
          const response = await teacherAPI.getProfile();
          const freshProfile = response?.data || response;

          setProfileData({
            displayName: freshProfile.name || currentUser.displayName || '',
            email: freshProfile.email || currentUser.email || '',
            phoneNumber: freshProfile.profile?.phoneNumber || '',
            address: freshProfile.profile?.address || '',
            dateOfBirth: freshProfile.profile?.dateOfBirth ? new Date(freshProfile.profile.dateOfBirth).toISOString().split('T')[0] : '',
            qualifications: freshProfile.profile?.qualifications || '',
            experience: freshProfile.profile?.experience || '',
            specialization: freshProfile.profile?.specialization || '',
            teachingGrades: Array.isArray(freshProfile.profile?.teachingGrades) ? freshProfile.profile.teachingGrades : [],
            teachingSubjects: Array.isArray(freshProfile.profile?.teachingSubjects) ? freshProfile.profile.teachingSubjects : [],
            joinedDate: freshProfile.profile?.joinedDate ? new Date(freshProfile.profile.joinedDate).toISOString().split('T')[0] : '',
            emergencyContactName: freshProfile.profile?.emergencyContactName || '',
            emergencyContactPhone: freshProfile.profile?.emergencyContactPhone || '',
            emergencyContactRelation: freshProfile.profile?.emergencyContactRelation || ''
          });

          localStorage.setItem('userProfile', JSON.stringify(freshProfile));
        }
      } catch (error) {
        console.error('Error fetching teacher profile:', error);

        if (currentUser && userProfile) {
          setProfileData({
            displayName: userProfile.name || currentUser.displayName || '',
            email: userProfile.email || currentUser.email || '',
            phoneNumber: userProfile.profile?.phoneNumber || '',
            address: userProfile.profile?.address || '',
            dateOfBirth: userProfile.profile?.dateOfBirth ? new Date(userProfile.profile.dateOfBirth).toISOString().split('T')[0] : '',
            qualifications: userProfile.profile?.qualifications || '',
            experience: userProfile.profile?.experience || '',
            specialization: userProfile.profile?.specialization || '',
            teachingGrades: userProfile.profile?.teachingGrades || [],
            teachingSubjects: userProfile.profile?.teachingSubjects || [],
            joinedDate: userProfile.profile?.joinedDate ? new Date(userProfile.profile.joinedDate).toISOString().split('T')[0] : '',
            emergencyContactName: userProfile.profile?.emergencyContactName || '',
            emergencyContactPhone: userProfile.profile?.emergencyContactPhone || '',
            emergencyContactRelation: userProfile.profile?.emergencyContactRelation || ''
          });
        }
      }
    };

    fetchProfileData();
  }, [currentUser?.uid, userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendData = {
        name: profileData.displayName,
        qualifications: profileData.qualifications,
        experience: profileData.experience,
        specialization: profileData.specialization,
        teachingGrades: profileData.teachingGrades,
        teachingSubjects: profileData.teachingSubjects,
        emergencyContactName: profileData.emergencyContactName,
        emergencyContactPhone: profileData.emergencyContactPhone,
        emergencyContactRelation: profileData.emergencyContactRelation,
        profile: {
          phoneNumber: profileData.phoneNumber,
          address: profileData.address,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
          joinedDate: profileData.joinedDate ? new Date(profileData.joinedDate) : null
        }
      };

      await teacherAPI.updateProfile(backendData);
      const response = await teacherAPI.getProfile();
      const freshProfile = response.data;

      localStorage.setItem('userProfile', JSON.stringify(freshProfile));

      try {
        await refreshUserProfile();
      } catch (error) {
        console.log('AuthContext refresh failed:', error.message);
      }

      setEditing(false);
      toast.success('Profile updated successfully');

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (currentUser && userProfile) {
      setProfileData({
        displayName: userProfile.name || currentUser.displayName || '',
        email: userProfile.email || currentUser.email || '',
        phoneNumber: userProfile.profile?.phoneNumber || '',
        address: userProfile.profile?.address || '',
        dateOfBirth: userProfile.profile?.dateOfBirth ? new Date(userProfile.profile.dateOfBirth).toISOString().split('T')[0] : '',
        qualifications: userProfile.profile?.qualifications || '',
        experience: userProfile.profile?.experience || '',
        specialization: userProfile.profile?.specialization || '',
        teachingGrades: userProfile.profile?.teachingGrades || [],
        teachingSubjects: userProfile.profile?.teachingSubjects || [],
        joinedDate: userProfile.profile?.joinedDate ? new Date(userProfile.profile.joinedDate).toISOString().split('T')[0] : '',
        emergencyContactName: userProfile.profile?.emergencyContactName || '',
        emergencyContactPhone: userProfile.profile?.emergencyContactPhone || '',
        emergencyContactRelation: userProfile.profile?.emergencyContactRelation || ''
      });
    }
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field, option) => {
    const currentValues = profileData[field] || [];
    const updatedValues = currentValues.includes(option)
      ? currentValues.filter(item => item !== option)
      : [...currentValues, option];

    setProfileData(prev => ({
      ...prev,
      [field]: updatedValues
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="mt-2 text-gray-600">
            Manage your teaching profile, qualifications, and specializations.
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-md rounded-lg overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-8">
            <div className="text-white">
              <h3 className="text-2xl font-bold">{profileData.displayName}</h3>
              <p className="text-green-100 mt-1">{profileData.email}</p>
              <div className="flex items-center mt-3">
                <GraduationCap className="w-4 h-4 mr-2" />
                <span className="text-green-200">
                  {profileData.specialization || 'Specialization not set'}
                </span>
              </div>
              {profileData.experience && (
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-green-200">
                    {profileData.experience} years experience
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        required
                        value={profileData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <User className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.displayName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-600">{profileData.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.phoneNumber || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {editing ? (
                      <textarea
                        rows={3}
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full address"
                      />
                    ) : (
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                        <span className="text-gray-900">{profileData.address || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualifications
                    </label>
                    {editing ? (
                      <textarea
                        rows={3}
                        value={profileData.qualifications}
                        onChange={(e) => handleInputChange('qualifications', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., M.Sc Mathematics, B.Ed"
                      />
                    ) : (
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <Award className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                        <span className="text-gray-900">{profileData.qualifications || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years)
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 5 years"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.experience || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    {editing ? (
                      <select
                        value={profileData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Specialization</option>
                        {specializationOptions.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <BookOpen className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.specialization || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={profileData.joinedDate}
                        onChange={(e) => handleInputChange('joinedDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {profileData.joinedDate ? new Date(profileData.joinedDate).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Teaching Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Teaching Information</h4>

                {/* Teaching Grades */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grades I Can Teach (Multiple Selection)
                  </label>
                  {editing ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {gradeOptions.map(grade => (
                        <label key={grade} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={profileData.teachingGrades.includes(grade)}
                            onChange={() => handleMultiSelectChange('teachingGrades', grade)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{grade}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <Users className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                      <span className="text-gray-900">
                        {profileData.teachingGrades.length > 0
                          ? profileData.teachingGrades.join(', ')
                          : 'No grades selected'
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Teaching Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects I Can Teach (Multiple Selection)
                  </label>
                  {editing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {subjectOptions.map(subject => (
                        <label key={subject} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={profileData.teachingSubjects.includes(subject)}
                            onChange={() => handleMultiSelectChange('teachingSubjects', subject)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                      <span className="text-gray-900">
                        {profileData.teachingSubjects.length > 0
                          ? profileData.teachingSubjects.join(', ')
                          : 'No subjects selected'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.emergencyContactName}
                        onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Emergency contact name"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContactName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={profileData.emergencyContactPhone}
                        onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContactPhone || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    {editing ? (
                      <select
                        value={profileData.emergencyContactRelation}
                        onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Relationship</option>
                        {relationshipOptions.map(relation => (
                          <option key={relation} value={relation}>{relation}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContactRelation || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TeacherProfile;