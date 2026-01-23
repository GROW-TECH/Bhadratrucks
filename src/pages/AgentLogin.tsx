import { useState } from 'react';
import logo from '../assets/newlogo.jpeg';
import { Eye, EyeOff } from 'lucide-react'; // Import the icons

interface AgentLoginProps {
  onNavigateToSignup: () => void;
  onLogin: (agent: any) => void;
}

export default function AgentLogin({ onNavigateToSignup, onLogin }: AgentLoginProps) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile.trim() || !password) {
      setError('Please enter mobile number and password');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/agent_login.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile_number: mobile.trim(), password }),
        }
      );

      const body = await resp.json().catch(() => null);

      if (body?.success && body.agent) {
        onLogin(body.agent);
      } else {
        setError(body?.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg shadow-red-500/30 flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Book Now
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Sign in to manage your deliveries
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter your mobile number"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10" // Add padding-right for the icon
                placeholder="Enter your password"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center flex flex-col items-center gap-3">
            {/* Go to Agent Signup */}
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Don't have an account? Agent Signup
            </button>

            {/* Admin Login */}
            <button
              type="button"
              onClick={() => (window.location.href = '/bhadra/admin')}
              className="py-2 text-sm font-medium rounded-full text-white bg-green-500 hover:bg-green-600 transition-colors w-full"
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/bhadra/')}
              className="py-2 text-sm font-medium rounded-full text-white bg-red-500 hover:bg-red-600 transition-colors w-full"
            >
              Driver Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
