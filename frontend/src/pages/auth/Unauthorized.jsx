import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
              className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6"
            >
              <Shield className="h-8 w-8 text-red-600" />
            </motion.div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Access Denied
            </h2>

            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Role:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {userProfile?.role || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-green-600 capitalize">
                    {userProfile?.approvalStatus || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;