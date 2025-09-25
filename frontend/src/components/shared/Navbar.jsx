import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import eduniteFavLogo from '../../assets/eduniteFavLogo.png';
import eduniteTextLogo from '../../assets/eduniteTextLogo.png';

const Navbar = () => {
  const { login, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 relative z-50"
    >
      {/* Sophisticated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95"></div>

      {/* Subtle ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl"></div>
        <div className="absolute -top-40 right-1/4 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Enhanced Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 group cursor-pointer"
            >
              {/* Icon Logo with subtle glow, no border, larger */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-300"></div>
                <div className="relative p-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl">
                  <img
                    src={eduniteFavLogo}
                    alt="Edunite"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </div>

              {/* Text Logo, larger, no white bg, fits height and aligns with icon */}
              <div className="relative flex flex-col justify-center">
                <img
                  src={eduniteTextLogo}
                  alt="Edunite"
                  className="h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.12))' }}
                />
              </div>
            </motion.div>
          </div>

          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignIn}
              disabled={loading}
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-white text-slate-900 font-semibold text-lg rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
    </motion.nav>
  );
};

export default Navbar;