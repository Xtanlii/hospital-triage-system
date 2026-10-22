import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleGoHome = () => {
    if (role === 'Nurse') navigate('/nurse');
    else if (role === 'Doctor') navigate('/doctor');
    else if (role === 'Admin') navigate('/admin');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-clinical-600 flex items-center justify-center text-white mb-4 shadow-md">
        <HeartPulse size={30} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">404</h1>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">Clinical Route Not Found</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
        The requested clinical station or route does not exist in the hospital registry.
      </p>
      <button
        onClick={handleGoHome}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Active Station</span>
      </button>
    </div>
  );
};
