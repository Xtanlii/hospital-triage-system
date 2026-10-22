import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileHeart, 
  Stethoscope, 
  ClipboardList, 
  Building2, 
  Activity, 
  Bot, 
  History, 
  CheckCircle2, 
  Settings, 
  LogOut,
  UserCheck,
  Shield,
  Layers,
  HeartPulse,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  const navItemsByRole = {
    Nurse: [
      { name: 'Dashboard', path: '/nurse', icon: LayoutDashboard, exact: true },
      { name: 'Patient Queue', path: '/nurse/queue', icon: ClipboardList },
      { name: 'New Triage Assessment', path: '/nurse/triage/new', icon: FileHeart, highlight: true },
      { name: 'Triage Assessments', path: '/nurse/assessments', icon: History },
      { name: 'Departments', path: '/nurse/departments', icon: Building2 },
    ],
    Doctor: [
      { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard, exact: true },
      { name: 'Incoming Patients', path: '/doctor/incoming', icon: Stethoscope, highlight: true },
      { name: 'Patient History', path: '/doctor/history', icon: History },
      { name: 'Completed Encounters', path: '/doctor/completed', icon: CheckCircle2 },
    ],
    Admin: [
      { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard, exact: true },
      { name: 'Queue Analytics', path: '/admin/analytics', icon: Activity },
      { name: 'Hospital Staff', path: '/admin/users', icon: Users },
      { name: 'Department Mgmt', path: '/admin/departments', icon: Building2 },
      { name: 'Triage Predictor AI', path: '/admin/triage-predictor', icon: Bot },
      { name: 'Audit & System Log', path: '/admin/activity', icon: Layers },
      { name: 'System Settings', path: '/admin/settings', icon: Settings },
    ]
  };

  const navItems = navItemsByRole[role] || navItemsByRole.Nurse;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Hospital Branding Header */}
        <div className={`relative flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-clinical-600 flex items-center justify-center text-white shadow-xs">
              <HeartPulse size={22} className="stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  ApexCare
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-clinical-600 dark:text-clinical-400">
                  Triage & Queue MS
                </p>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 lg:hidden cursor-pointer"
            >
              <span className="sr-only">Close sidebar</span>
              ✕
            </button>
          )}

          {/* Desktop toggle button */}
          <button 
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${
              isCollapsed 
                ? 'absolute -right-3 top-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full p-1' 
                : 'p-1.5'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Current Active User Profile Banner in Sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-clinical-100 text-clinical-800 dark:bg-clinical-950 dark:text-clinical-300 border border-clinical-200 dark:border-clinical-800 flex items-center justify-center font-bold text-sm">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                currentUser?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.name || 'Staff User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-clinical-600 text-white">
                    <Shield size={10} />
                    {role}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.departmentName || 'ED'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation ({role})
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => onClose && onClose()}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-clinical-600 text-white shadow-xs font-bold' 
                  : item.highlight
                    ? 'text-clinical-700 bg-clinical-50 hover:bg-clinical-100 dark:bg-clinical-950/40 dark:text-clinical-300 dark:hover:bg-clinical-950/70 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              {!isCollapsed && <span className="flex-1">{item.name}</span>}
            </NavLink>
          ))}
        </div>

        {/* Footer & Quick Sign Out */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/30">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out ({currentUser?.name?.split(' ')[0]})</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
