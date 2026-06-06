import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, CheckSquare, ArrowRight, Sun, Moon, AlertTriangle } from 'lucide-react';

const Register = ({ onSwitchToLogin, isDarkMode, setIsDarkMode }) => {
  const { register, loginWithGoogle, error, setError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleGoogleSignIn = async () => {
    setValidationError('');
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    // Form validation checks
    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      console.error('Registration error details:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen relative flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Floating Premium Glowing Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Dark/Light mode toggle floating on top right */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105 transition-all shadow-sm z-50"
      >
        {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-800" />}
      </button>

      {/* Register Card Panel */}
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-slate-850 animate-slide glow-accent relative z-10">
        
        {/* App Logo & Branding */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-550/20 animate-pulse-subtle">
            <CheckSquare size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Create Account</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              Sign up today and optimize your workflow.
            </p>
          </div>
        </div>

        {/* Continue with Google button */}
        <div className="space-y-4 mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all duration-200 shadow-sm active:scale-98 disabled:opacity-50"
          >
            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div className="flex items-center space-x-2 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/60" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or email access</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/60" />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Error alerts */}
          {(error || validationError) && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle size={15} />
              <span className="leading-tight">{validationError || error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError('');
                  setError(null);
                }}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError('');
                  setError(null);
                }}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password fields row split on desktop */}
          <div className="grid grid-cols-1 gap-3.5">
            
            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationError('');
                    setError(null);
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationError('');
                    setError(null);
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
                />
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-primary-550/25 active:scale-98 disabled:opacity-50 disabled:pointer-events-none mt-6"
          >
            <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
            {!submitting && <ArrowRight size={15} className="stroke-[2.5]" />}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-850">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-500 dark:text-primary-400 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>

    </div>
  );
};

export default Register;
