import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '@/services/api';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user?: { username: string; email: string; _id: string }) => void;
  message?: string;
  initialMode?: 'login' | 'signup';
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  message,
  initialMode = 'login',
}) => {
  const [mode, setMode]             = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [name, setName]             = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setUsername(''); setEmail(''); setName('');
      setError(''); setUsernameAvail(null);
    }
  }, [isOpen, initialMode]);

  // Debounced username availability check
  useEffect(() => {
    if (mode !== 'signup' || username.length < 3) { setUsernameAvail(null); return; }
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(username);
        setUsernameAvail(res.available);
      } catch { setUsernameAvail(null); }
    }, 500);
    return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); };
  }, [username, mode]);

  const persistUser = (user: { _id: string; username: string; email: string; name: string; role: string }) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', user._id);
    localStorage.setItem('username', user.username);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userRole', user.role);
    // Notify other components (Header) via storage event
    window.dispatchEvent(new Event('storage'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!username.trim()) { setError('Please enter your username.'); return; }
        const res = await authApi.login(username.trim());
        persistUser(res.data);
        onSuccess({ username: res.data.username, email: res.data.email, _id: res.data._id });
      } else {
        if (!username.trim()) { setError('Please enter a username.'); return; }
        if (!email.trim())    { setError('Please enter your email address.'); return; }
        if (usernameAvail === false) { setError('That username is already taken. Please choose another.'); return; }
        const res = await authApi.signup(username.trim(), email.trim(), name.trim() || undefined);
        persistUser(res.data);
        onSuccess({ username: res.data.username, email: res.data.email, _id: res.data._id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-6 pt-8 pb-10 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back!' : 'Create account'}</h2>
          <p className="mt-1 text-white/75 text-sm">
            {message || (mode === 'login' ? 'Sign in with your username to continue.' : 'Sign up to access all features.')}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-gray-100">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === m ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {/* Name — signup only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
              />
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => { setUsername(e.target.value.toLowerCase()); setError(''); }}
                placeholder={mode === 'login' ? 'your_username' : 'choose_a_username'}
                required
                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 pr-10 ${
                  error && !username ? 'border-red-300 focus:ring-red-200' :
                  mode === 'signup' && usernameAvail === false ? 'border-red-300 focus:ring-red-200' :
                  mode === 'signup' && usernameAvail === true  ? 'border-green-300 focus:ring-green-200' :
                  'border-gray-200 focus:ring-indigo-300 focus:border-indigo-400'
                }`}
              />
              {mode === 'signup' && username.length >= 3 && usernameAvail !== null && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${usernameAvail ? 'text-green-500' : 'text-red-500'}`}>
                  {usernameAvail ? '✓' : '✗'}
                </span>
              )}
            </div>
            {mode === 'signup' && usernameAvail === false && (
              <p className="mt-1 text-xs text-red-500">Username is already taken</p>
            )}
            {mode === 'signup' && usernameAvail === true && (
              <p className="mt-1 text-xs text-green-600">Username is available!</p>
            )}
          </div>

          {/* Email — signup only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email Address <span className="text-red-500">*</span></label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-indigo-600 font-semibold hover:underline">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-indigo-600 font-semibold hover:underline">Log in</button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};
