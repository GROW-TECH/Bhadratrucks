import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons
import logo from '../assets/newlogo.jpeg';

interface AdminLoginProps {
  onLogin: (admin: any) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('https://projects.growtechnologies.in/bhadra/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (resp.status === 401) {
        setError('Invalid username or password');
        return;
      }

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.error || 'Login failed');
        return;
      }

      const admin = await resp.json();
      // call parent handler with admin object
      onLogin(admin);
    } catch (err) {
      console.error('Auth error', err);
      setError('Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-red-500/30">
                  <img src={logo} alt="Admin Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-center text-slate-600 mb-8">Sign in to access admin dashboard</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">Admin Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all pr-10" // Add padding-right for the icon
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)} // Toggle showPassword state
                className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 mt-5" />
                ) : (
                  <Eye className="w-5 h-5 mt-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 text-center">Only for Admin.</p>
          </div>

          {/* Admin Login Buttons */}
          <div className="flex gap-3 mt-3">
            {/* Driver Login */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/bhadra/';
              }}
              className="flex-1 py-2 text-sm font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              Driver Login
            </button>

            {/* Agent Login */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/bhadra/agent';
              }}
              className="flex-1 py-2 text-sm font-medium rounded-full text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              Agent Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
