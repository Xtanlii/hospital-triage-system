import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  User, 
  LogOut, 
  Clock, 
  ChevronDown,
  RotateCw,
  Shield,
  Moon,
  Sun,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Topbar = ({ onToggleSidebar }) => {
  const { currentUser, logout, role } = useAuth();
  const { activities, resetDemoData, showToast, isOnline, checkServerConnection } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [readActivityIds, setReadActivityIds] = useState(new Set());

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = activities.filter(a => !readActivityIds.has(a.id)).length;

  const handleMarkAllRead = () => {
    setReadActivityIds(new Set(activities.map(a => a.id)));
    showToast('Notifications Cleared', 'All activity stream notifications marked as read.', 'info');
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 sm:px-8 transition-colors duration-200">
      {/* Left: Mobile Toggle & Subtle Clock */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Clock size={13} className="text-slate-400 dark:text-slate-500" />
          <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
            {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
        </div>

        {/* Network Online / Offline Status Pill */}
        <button
          onClick={checkServerConnection}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
            isOnline 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/70' 
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/70'
          }`}
          title={isOnline ? 'System is online and connected to server (Click to refresh)' : 'System is running offline with cached local storage (Click to reconnect)'}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            isOnline 
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse' 
              : 'bg-amber-500'
          }`} />
          <span className="hidden sm:inline">
            {isOnline ? 'System Online' : 'Offline (Cached)'}
          </span>
          <span className="sm:hidden">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </button>
      </div>

      {/* Right: Theme Toggle, Role Switcher, Alerts & User Menu */}
      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
        </button>


        {/* Notifications with Mark-As-Read */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 flex flex-col max-h-[26rem]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Hospital Activity Stream</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-clinical-600 dark:text-clinical-400 hover:text-clinical-700 dark:hover:text-clinical-300 hover:underline cursor-pointer"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                {activities.slice(0, 6).map(act => {
                  const isRead = readActivityIds.has(act.id);
                  return (
                    <div 
                      key={act.id} 
                      onClick={() => setReadActivityIds(prev => new Set([...prev, act.id]))}
                      className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        !isRead ? 'bg-clinical-50/30 dark:bg-clinical-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-bold text-clinical-700 dark:text-clinical-400 bg-clinical-50 dark:bg-clinical-950/80 px-1.5 py-0.5 rounded">
                          {act.badge}
                        </span>
                        <span>{act.timestamp}</span>
                      </div>
                      <p className={`text-xs leading-snug ${!isRead ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {act.message}
                      </p>
                    </div>
                  );
                })}
              </div>
              {unreadCount > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2.5 shrink-0">
                  <button
                    onClick={() => {
                      handleMarkAllRead();
                      setShowNotifications(false);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-clinical-700 dark:text-clinical-300 bg-clinical-50 dark:bg-clinical-950/60 hover:bg-clinical-100 dark:hover:bg-clinical-950 rounded-xl transition-colors cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    <span>Clear All Notifications</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-clinical-600 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'
              )}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1] || ''}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                {currentUser?.role}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 bg-clinical-50 dark:bg-clinical-950 text-clinical-700 dark:text-clinical-300 rounded-full border border-clinical-200 dark:border-clinical-800">
                  {currentUser?.role} • {currentUser?.departmentName}
                </span>
              </div>
              

              <div className="p-1">
                <button
                  onClick={() => {
                    navigate(`/${role.toLowerCase()}/profile`);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Account Profile</span>
                </button>
                <button
                  onClick={() => {
                    resetDemoData();
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw size={14} className="text-slate-400" />
                  <span>Reset Demo Data</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

