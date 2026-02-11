import React, { useState, FormEvent } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

// Simple demo credentials – adjust as needed
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'healthcore123';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // In a real app this would call an auth API.
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem('healthcore_is_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Invalid username or password');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-wa-text">
      <div className="w-full max-w-md mx-4 bg-wa-surface/90 border border-wa-border/60 rounded-3xl shadow-2xl backdrop-blur-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-wa-accent flex items-center justify-center shadow-lg shadow-wa-accent/30">
            <span className="text-wa-bg font-black text-lg">HC</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">HealthCore Console</h1>
            <p className="text-xs text-wa-muted font-medium uppercase tracking-[0.18em]">
              Secure Access
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-[11px] font-black text-wa-muted uppercase tracking-[0.18em] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-wa-bg/80 border border-wa-border/70 text-sm outline-none focus:border-wa-accent focus:ring-1 focus:ring-wa-accent/60 transition-all"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-wa-muted uppercase tracking-[0.18em] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-wa-bg/80 border border-wa-border/70 text-sm outline-none focus:border-wa-accent focus:ring-1 focus:ring-wa-accent/60 transition-all"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !username || !password}
            className="w-full mt-2 bg-wa-accent text-wa-bg py-3 rounded-2xl font-black uppercase text-[11px] tracking-[0.22em] shadow-lg shadow-wa-accent/40 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-4 text-[10px] text-wa-muted text-center font-medium">
            Demo login: <span className="font-semibold">admin</span> /{' '}
            <span className="font-semibold">healthcore123</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

