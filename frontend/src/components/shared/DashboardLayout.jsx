import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import eduniteTextLogo from '../../assets/eduniteTextLogo.png';
import eduniteFavLogo from '../../assets/eduniteFavLogo.png';

const DashboardLayout = ({ children, navigation, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, userProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <motion.div
          initial={{ x: -320 }}
          animate={{ x: sidebarOpen ? 0 : -320 }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="fixed inset-y-0 left-0 flex w-80 bg-white shadow-xl"
        >
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 h-16 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={eduniteFavLogo}
                  alt="Edunite Logo"
                  className="w-10 h-10"
                />
                <img
                  src={eduniteTextLogo}
                  alt="Edunite"
                  className="h-8"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-blue-200 hover:text-white cursor-pointer transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    item.onClick();
                    setSidebarOpen(false);
                  }}
                  className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                    item.active
                      ? 'bg-blue-100 text-blue-900 shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      item.active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </button>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <LogOut className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                Sign out
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center px-4 h-16 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <img
                src={eduniteFavLogo}
                alt="Edunite Logo"
                className="w-11 h-11"
              />
              <img
                src={eduniteTextLogo}
                alt="Edunite"
                className="h-10"
              />
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                  item.active
                    ? 'bg-blue-100 text-blue-900 shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    item.active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer hover:scale-105"
            >
              <LogOut className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <div className="text-base font-medium leading-none text-gray-900">
                    {currentUser?.displayName}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-500 capitalize">
                    {userProfile?.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;