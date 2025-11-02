import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';
import { Github, LogOut, User, Settings, Map, Mic, LayoutDashboard, Moon, Sun, Wrench, ChevronDown, Video, FileText, Sparkles } from 'lucide-react';
import TokenBalanceEnhanced from './tokens/TokenBalanceEnhanced';
import TokenRechargeModal from './tokens/TokenRechargeModal';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-50 transition-colors duration-200 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/chartly_logo.png" 
                  alt="SmartLearn.io Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className={`text-2xl font-bold transition-colors duration-200 ${
                darkMode
                  ? 'text-white'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'
              }`}>
                SmartLearn.io
              </h1>
            </Link>

            {/* Navigation Menu - Only show when logged in */}
            {user && (
              <nav className="hidden md:flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : darkMode
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                
                {/* Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      location.pathname === '/create' || location.pathname === '/roadmap' || location.pathname === '/mock-interview'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : darkMode
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Tools</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      showToolsMenu ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {showToolsMenu && (
                    <>
                      {/* Backdrop to close menu when clicking outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowToolsMenu(false)}
                      />
                      <div className={`absolute left-0 mt-2 w-64 rounded-xl shadow-lg border py-2 z-50 ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            Available Tools
                          </p>
                        </div>
                        
                        <Link
                          to="/create"
                          onClick={() => setShowToolsMenu(false)}
                          className={`flex items-center space-x-3 px-4 py-3 transition-colors duration-200 ${
                            darkMode
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              darkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              Roadmap Generator
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Create learning paths
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/mock-interview"
                          onClick={() => setShowToolsMenu(false)}
                          className={`flex items-center space-x-3 px-4 py-3 transition-colors duration-200 ${
                            darkMode
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              darkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              Mock Interview
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              AI-powered practice
                            </p>
                          </div>
                        </Link>

                        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            Coming Soon
                          </p>
                        </div>

                        <div
                          className={`flex items-center space-x-3 px-4 py-3 opacity-60 cursor-not-allowed ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm flex items-center space-x-2`}>
                              <span>Video to PDF</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full">Soon</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Convert videos to text
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </nav>
            )}

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Token Balance - only show when logged in and not on home page */}
              {user && location.pathname !== '/' && (
                <TokenBalanceEnhanced 
                  size="small" 
                  onRechargeClick={() => setShowRecharge(true)}
                />
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  darkMode
                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* GitHub Link */}
              <a
                href="https://github.com/anuragpatki/Flowniq-AI"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-2 transition-colors duration-200 hover:scale-105 transform ${
                  darkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub</span>
              </a>

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 ${
                      darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {profile.displayName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border py-2 z-50 ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-slate-200'
                    }`}>
                      <div className={`px-4 py-2 border-b ${
                        darkMode ? 'border-slate-700' : 'border-slate-100'
                      }`}>
                        <p className={`text-sm font-medium ${
                          darkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {profile.displayName}
                        </p>
                        <p className={`text-xs ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {user.email}
                        </p>
                      </div>
                      
                      {/* Mobile Navigation Links */}
                      <div className={`md:hidden border-b ${
                        darkMode ? 'border-slate-700' : 'border-slate-100'
                      }`}>
                        <Link
                          to="/dashboard"
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 ${
                            darkMode
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/create"
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 ${
                            darkMode
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Map className="w-4 h-4" />
                          <span>Create Roadmap</span>
                        </Link>
                        <Link
                          to="/mock-interview"
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 ${
                            darkMode
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Mic className="w-4 h-4" />
                          <span>Mock Interview</span>
                        </Link>
                      </div>

                      <Link
                        to="/profile"
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 ${
                          darkMode
                            ? 'text-slate-300 hover:bg-slate-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleSignOut();
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Token Recharge Modal */}
      <TokenRechargeModal 
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={(tokens) => {
          console.log(`Successfully recharged ${tokens} tokens`);
          // You could show a success notification here
        }}
      />
    </>
  );
};

export default Navbar;