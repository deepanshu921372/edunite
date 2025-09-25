import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Calendar, BarChart3, Shield, Zap, Star, CheckCircle, Play, Sparkles, Award, TrendingUp, Globe, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';

const LandingPage = () => {
  const { login, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Smart User Management',
      description: 'AI-powered user management with role-based access control and automated workflows.',
      color: 'from-blue-500 to-cyan-400',
      stats: '10K+ Users'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Intelligent Scheduling',
      description: 'Advanced timetable management with conflict resolution and optimization algorithms.',
      color: 'from-purple-500 to-pink-400',
      stats: '99.9% Accuracy'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Real-time insights with predictive analytics and performance forecasting.',
      color: 'from-green-500 to-emerald-400',
      stats: '50+ Reports'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Resource Hub',
      description: 'Cloud-based resource management with smart categorization and search.',
      color: 'from-orange-500 to-red-400',
      stats: '1M+ Resources'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with multi-factor authentication and data encryption.',
      color: 'from-indigo-500 to-purple-400',
      stats: '100% Secure'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Blazing fast performance with real-time synchronization across all devices.',
      color: 'from-yellow-500 to-orange-400',
      stats: '<0.3s Response'
    }
  ];


  const stats = [
    { value: '50K+', label: 'Active Students', icon: <Users className="w-6 h-6" /> },
    { value: '2K+', label: 'Educational Institutions', icon: <Globe className="w-6 h-6" /> },
    { value: '99.9%', label: 'Uptime Guarantee', icon: <Shield className="w-6 h-6" /> },
    { value: '4.9/5', label: 'User Rating', icon: <Star className="w-6 h-6" /> }
  ];

  const handleGoogleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full opacity-30"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{
                  y: [null, Math.random() * -100 - 20],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-300/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-purple-100 text-sm font-medium">Trusted by 2K+ Educational Institutions</span>
                  <Award className="w-4 h-4 text-yellow-400 ml-2" />
                </div>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Educational Journey
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-purple-100 mb-12 max-w-4xl mx-auto leading-relaxed">
                The most powerful, intuitive, and comprehensive tuition management platform.
                <span className="text-cyan-300"> Boost engagement by 85%</span> and
                <span className="text-pink-300"> streamline operations</span> with AI-powered insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <motion.button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="cursor-pointer inline-flex items-center px-8 py-4 bg-white text-slate-900 font-semibold text-lg rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Start Free Today
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="cursor-pointer inline-flex items-center px-6 py-4 text-slate-300 font-medium text-lg border border-slate-600/50 rounded-xl hover:bg-slate-800/50 hover:text-white hover:border-slate-500/50 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-5 h-5 mr-3" />
                  Watch Demo
                </motion.button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-2 text-cyan-400">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-purple-200">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-300/20 backdrop-blur-sm mb-8">
                <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-cyan-100 text-sm font-medium">Powered by Advanced AI</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Revolutionary Features That
                <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Change Everything
                </span>
              </h2>

              <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                Experience the future of educational management with our cutting-edge features designed to transform how you operate.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="cursor-pointer group relative h-full"
                >
                  <div className="relative h-full min-h-[320px] p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 group-hover:scale-105 flex flex-col">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>

                    <div className="relative flex flex-col h-full">
                      <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg w-fit`}>
                        {feature.icon}
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors flex-1 pr-2">
                          {feature.title}
                        </h3>
                        <span className="text-xs text-cyan-400 font-semibold bg-cyan-400/10 px-2 py-1 rounded-full whitespace-nowrap">
                          {feature.stats}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed flex-1 mb-6">
                        {feature.description}
                      </p>

                      <div className="mt-auto flex items-center text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-sm font-medium">Learn More</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Sophisticated Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl"></div>
            </div>
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
                Ready to Transform Your
                <span className="block">Educational Institution?</span>
              </h2>

              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join over 2,000 institutions already using Edunite to streamline operations and boost student engagement.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="cursor-pointer inline-flex items-center px-8 py-4 bg-white text-slate-900 font-semibold text-lg rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Start Free Today
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="cursor-pointer inline-flex items-center px-6 py-4 text-slate-300 font-medium text-lg border border-slate-600/50 rounded-xl hover:bg-slate-800/50 hover:text-white hover:border-slate-500/50 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingUp className="w-5 h-5 mr-3" />
                  View Pricing
                </motion.button>
              </div>

              <p className="text-slate-400 text-sm mt-8">
                No credit card required • 30-day free trial • Cancel anytime
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;