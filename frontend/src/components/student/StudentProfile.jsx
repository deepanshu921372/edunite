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
  School,
  BookOpen,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { currentUser, userProfile, updateUserProfile, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    grade: '',
    stream: '',
    schoolName: '',
    parentName: '',
    parentPhoneNumber: '',
    admissionNumber: '',
    subjects: [],
    previousTuitionExperience: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  // Grade options for tuition students
  const gradeOptions = [
    'Nursery', 'LKG', 'UKG',
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    '11th', '12th'
  ];

  // Stream options for 11th and 12th grade
  const streamOptions = [
    'Science', 'Commerce', 'Arts'
  ];

  // Common subjects for tuition
  const subjectOptions = [
    'Mathematics', 'English', 'Hindi', 'Science',
    'Social Studies', 'Physics', 'Chemistry', 'Biology',
    'Accountancy', 'Business Studies', 'Economics',
    'Computer Science', 'History', 'Geography', 'Political Science'
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (currentUser) {
          console.log('Fetching fresh profile data for user:', currentUser.uid);

          const freshProfile = await studentAPI.getProfile();
          console.log('Fresh profile data received:', freshProfile);

          setProfileData({
            displayName: freshProfile.name || currentUser.displayName || '',
            email: freshProfile.email || currentUser.email || '',
            phoneNumber: freshProfile.profile?.phoneNumber || freshProfile.phoneNumber || '',
            address: freshProfile.profile?.address || freshProfile.address || '',
            dateOfBirth: freshProfile.profile?.dateOfBirth ? new Date(freshProfile.profile.dateOfBirth).toISOString().split('T')[0] : (freshProfile.dateOfBirth ? new Date(freshProfile.dateOfBirth).toISOString().split('T')[0] : ''),
            grade: freshProfile.profile?.grade || '',
            stream: freshProfile.profile?.stream || '',
            schoolName: freshProfile.profile?.schoolName || freshProfile.schoolName || '',
            parentName: freshProfile.profile?.parentName || '',
            parentPhoneNumber: freshProfile.profile?.parentPhoneNumber || freshProfile.parentPhoneNumber || '',
            admissionNumber: freshProfile.admissionNumber || '',
            subjects: freshProfile.subjects || [],
            previousTuitionExperience: freshProfile.profile?.previousTuitionExperience || '',
            emergencyContact: {
              name: freshProfile.emergencyContact?.name || '',
              phone: freshProfile.emergencyContact?.phone || '',
              relation: freshProfile.emergencyContact?.relation || ''
            }
          });

          localStorage.setItem('userProfile', JSON.stringify(freshProfile));
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);

        if (currentUser && userProfile) {
          console.log('Using fallback userProfile data:', userProfile);
          setProfileData({
            displayName: userProfile.name || currentUser.displayName || '',
            email: userProfile.email || currentUser.email || '',
            phoneNumber: userProfile.profile?.phoneNumber || userProfile.phoneNumber || '',
            address: userProfile.profile?.address || userProfile.address || '',
            dateOfBirth: userProfile.profile?.dateOfBirth ? new Date(userProfile.profile.dateOfBirth).toISOString().split('T')[0] : (userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0] : ''),
            grade: userProfile.profile?.grade || '',
            stream: userProfile.profile?.stream || '',
            schoolName: userProfile.profile?.schoolName || userProfile.schoolName || '',
            parentName: userProfile.profile?.parentName || '',
            parentPhoneNumber: userProfile.profile?.parentPhoneNumber || userProfile.parentPhoneNumber || '',
            admissionNumber: userProfile.admissionNumber || '',
            subjects: userProfile.subjects || [],
            previousTuitionExperience: userProfile.profile?.previousTuitionExperience || '',
            emergencyContact: {
              name: userProfile.emergencyContact?.name || '',
              phone: userProfile.emergencyContact?.phone || '',
              relation: userProfile.emergencyContact?.relation || ''
            }
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
        profile: {
          phoneNumber: profileData.phoneNumber,
          address: profileData.address,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
          grade: profileData.grade,
          stream: profileData.stream,
          schoolName: profileData.schoolName,
          parentName: profileData.parentName,
          parentPhoneNumber: profileData.parentPhoneNumber,
          previousTuitionExperience: profileData.previousTuitionExperience
        },
        admissionNumber: profileData.admissionNumber,
        subjects: profileData.subjects,
        emergencyContact: profileData.emergencyContact
      };

      await studentAPI.updateProfile(backendData);

      const freshProfile = await studentAPI.getProfile();

      localStorage.setItem('userProfile', JSON.stringify(freshProfile));

      try {
        await refreshUserProfile();
      } catch (error) {
        console.log('AuthContext refresh failed (expected for students):', error.message);
      }

      setProfileData({
        displayName: freshProfile.name || currentUser.displayName || '',
        email: freshProfile.email || currentUser.email || '',
        phoneNumber: freshProfile.profile?.phoneNumber || freshProfile.phoneNumber || '',
        address: freshProfile.profile?.address || freshProfile.address || '',
        dateOfBirth: freshProfile.profile?.dateOfBirth ? new Date(freshProfile.profile.dateOfBirth).toISOString().split('T')[0] : (freshProfile.dateOfBirth ? new Date(freshProfile.dateOfBirth).toISOString().split('T')[0] : ''),
        grade: freshProfile.profile?.grade || '',
        stream: freshProfile.profile?.stream || '',
        schoolName: freshProfile.profile?.schoolName || freshProfile.schoolName || '',
        parentName: freshProfile.profile?.parentName || '',
        parentPhoneNumber: freshProfile.profile?.parentPhoneNumber || freshProfile.parentPhoneNumber || '',
        admissionNumber: freshProfile.admissionNumber || '',
        subjects: freshProfile.subjects || [],
        previousTuitionExperience: freshProfile.profile?.previousTuitionExperience || '',
        emergencyContact: {
          name: freshProfile.emergencyContact?.name || '',
          phone: freshProfile.emergencyContact?.phone || '',
          relation: freshProfile.emergencyContact?.relation || ''
        }
      });

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
    if (currentUser && userProfile) {
      setProfileData({
        displayName: userProfile.name || currentUser.displayName || '',
        email: userProfile.email || currentUser.email || '',
        phoneNumber: userProfile.profile?.phoneNumber || userProfile.phoneNumber || '',
        address: userProfile.profile?.address || userProfile.address || '',
        dateOfBirth: userProfile.profile?.dateOfBirth ? new Date(userProfile.profile.dateOfBirth).toISOString().split('T')[0] : (userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0] : ''),
        grade: userProfile.profile?.grade || '',
        stream: userProfile.profile?.stream || '',
        schoolName: userProfile.profile?.schoolName || userProfile.schoolName || '',
        parentName: userProfile.profile?.parentName || '',
        parentPhoneNumber: userProfile.profile?.parentPhoneNumber || userProfile.parentPhoneNumber || '',
        admissionNumber: userProfile.admissionNumber || '',
        subjects: userProfile.subjects || [],
        previousTuitionExperience: userProfile.profile?.previousTuitionExperience || '',
        emergencyContact: {
          name: userProfile.emergencyContact?.name || '',
          phone: userProfile.emergencyContact?.phone || '',
          relation: userProfile.emergencyContact?.relation || ''
        }
      });
    }
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    const updatedData = { ...profileData };

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedData[parent] = {
        ...updatedData[parent],
        [child]: value
      };
    } else {
      updatedData[field] = value;
    }

    setProfileData(updatedData);
  };

  const handleSubjectsChange = (subject) => {
    const updatedSubjects = profileData.subjects.includes(subject)
      ? profileData.subjects.filter(s => s !== subject)
      : [...profileData.subjects, subject];

    setProfileData({ ...profileData, subjects: updatedSubjects });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="mt-2 text-gray-600">
            Manage your personal information and tuition details.
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
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="text-white">
              <h3 className="text-2xl font-bold">{profileData.displayName}</h3>
              <p className="text-blue-100 mt-1">{profileData.email}</p>
              <div className="flex items-center mt-3">
                <School className="w-4 h-4 mr-2" />
                <span className="text-blue-200">
                  {profileData.grade && profileData.stream
                    ? `${profileData.grade} Grade • ${profileData.stream} Stream`
                    : profileData.grade
                      ? `${profileData.grade} Grade`
                      : 'Grade not set'
                  }
                </span>
              </div>
              {profileData.admissionNumber && (
                <div className="flex items-center mt-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="text-blue-200">Admission No: {profileData.admissionNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-8">
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

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admission Number
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.admissionNumber}
                        onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., TU2024001"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.admissionNumber || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade
                    </label>
                    {editing ? (
                      <select
                        value={profileData.grade}
                        onChange={(e) => handleInputChange('grade', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Grade</option>
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.grade || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stream {(profileData.grade === '11th' || profileData.grade === '12th') && <span className="text-red-500">*</span>}
                    </label>
                    {editing ? (
                      <select
                        value={profileData.stream}
                        onChange={(e) => handleInputChange('stream', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!(profileData.grade === '11th' || profileData.grade === '12th')}
                      >
                        <option value="">Select Stream</option>
                        {streamOptions.map(stream => (
                          <option key={stream} value={stream}>{stream}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.stream || 'Not applicable'}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.schoolName}
                        onChange={(e) => handleInputChange('schoolName', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your school name"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.schoolName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subjects Enrolled
                    </label>
                    {editing ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {subjectOptions.map(subject => (
                          <label key={subject} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={profileData.subjects.includes(subject)}
                              onChange={() => handleSubjectsChange(subject)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{subject}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">
                          {profileData.subjects.length > 0 ? profileData.subjects.join(', ') : 'No subjects selected'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent/Guardian Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.parentName}
                        onChange={(e) => handleInputChange('parentName', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter parent/guardian name"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.parentName || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent/Guardian Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={profileData.parentPhoneNumber}
                        onChange={(e) => handleInputChange('parentPhoneNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profileData.parentPhoneNumber || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Tuition Experience
                    </label>
                    {editing ? (
                      <textarea
                        rows={2}
                        value={profileData.previousTuitionExperience}
                        onChange={(e) => handleInputChange('previousTuitionExperience', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of previous tuition experience (optional)"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.previousTuitionExperience || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                        value={profileData.emergencyContact.name}
                        onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., John Smith"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContact.name || 'Not set'}</span>
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
                        value={profileData.emergencyContact.phone}
                        onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContact.phone || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    {editing ? (
                      <select
                        value={profileData.emergencyContact.relation}
                        onChange={(e) => handleInputChange('emergencyContact.relation', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Relative">Relative</option>
                        <option value="Family Friend">Family Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{profileData.emergencyContact.relation || 'Not set'}</span>
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

export default StudentProfile;