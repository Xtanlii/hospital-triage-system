import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartPulse, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast, refreshAllData } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState('nurse.sarah');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await login(username, password);
      if (res.success && res.user) {
        showToast('Welcome back', `Logged in as ${res.user.name} (${res.user.role})`, 'success');
        if (typeof refreshAllData === 'function') {
          await refreshAllData();
        }
        if (res.user.role === 'Nurse') navigate('/nurse');
        else if (res.user.role === 'Doctor') navigate('/doctor');
        else if (res.user.role === 'Admin') navigate('/admin');
        else navigate('/');
      } else {
        setError('Invalid credentials. Please verify your hospital username and password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors relative">
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Hospital Branding */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-clinical-600 flex items-center justify-center text-white shadow-md">
            <HeartPulse size={28} className="stroke-[2.2]" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          ApexCare Health System
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-clinical-600 dark:text-clinical-400">
          Patient Triage & Queue Management System
        </p>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Authorized Clinical & Administrative Staff Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Hospital Username / Staff ID
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. nurse.sarah, doctor.wilson, admin"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-clinical-500 focus:outline-none focus:ring-2 focus:ring-clinical-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-clinical-500 focus:outline-none focus:ring-2 focus:ring-clinical-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-clinical-600 focus:ring-clinical-500 w-3.5 h-3.5"
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Remember terminal</span>
              </label>

              <button
                type="button"
                onClick={() => showToast('Password Recovery', 'Please contact the IT Security Helpdesk at ext. 4400 to reset your hospital active directory credentials.', 'info')}
                className="font-semibold text-clinical-600 dark:text-clinical-400 hover:text-clinical-700 dark:hover:text-clinical-300 cursor-pointer"
              >
                Forgot credentials?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-clinical-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-clinical-700 active:scale-98 transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Clinical Terminal</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Seeded Credentials Reference */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Seeded Clinical Credentials
            </p>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 font-mono">
              <div className="flex justify-between items-center">
                <span><strong className="text-slate-700 dark:text-slate-300">Nurse:</strong> nurse.sarah</span>
                <span className="text-slate-400">password123</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong className="text-slate-700 dark:text-slate-300">Doctor:</strong> doctor.wilson</span>
                <span className="text-slate-400">password123</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong className="text-slate-700 dark:text-slate-300">Admin:</strong> admin</span>
                <span className="text-slate-400">admin123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical System Compliance Notice */}
        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
          Protected Health Information (PHI) Security Compliant. Unauthorized access is prohibited and audited.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
