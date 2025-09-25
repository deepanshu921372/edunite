import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900 border-t border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center text-white text-sm">
            <span>© {currentYear} Edunite. All rights reserved.</span>
            <span className="mx-3">•</span>
            <span className="flex items-center">
              Made with <Heart className="w-3 h-3 mx-1 text-red-400" /> for education
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;