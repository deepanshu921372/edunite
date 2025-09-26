import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ApprovalPending = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(2);

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  // Auto-redirect after 2 seconds
  useEffect(() => {
    let hasRedirected = false;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1 && !hasRedirected) {
          hasRedirected = true;
          // Logout and redirect without showing additional toast
          handleSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6"
            >
              <Clock className="h-8 w-8 text-yellow-600" />
            </motion.div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Approval Pending
            </h2>

            <p className="text-gray-600 mb-4">
              Your account is currently under review. An administrator will approve your access soon.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                {countdown > 0 ? (
                  <>Automatically signing you out in <span className="font-bold text-lg">{countdown}</span> second{countdown !== 1 ? 's' : ''}...</>
                ) : (
                  'Signing out...'
                )}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Account Details</span>
              </div>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-medium text-gray-900">{currentUser?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-yellow-600 capitalize">
                    {userProfile?.approvalStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-green-800 mb-1">What's next?</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• An administrator will review your request</li>
                    <li>• You'll receive email notification upon approval</li>
                    <li>• Your role will be assigned based on your profile</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign out
              </button>

              <p className="text-xs text-gray-500">
                If you have questions, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApprovalPending;