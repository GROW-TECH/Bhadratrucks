import { useState } from 'react';
import { Truck, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons
import logo from '../assets/newlogo.jpeg';

interface UserLoginProps {
  onLogin: (user: any) => void;
  onNavigateToSignup: () => void;
}

export default function UserLogin({ onLogin, onNavigateToSignup }: UserLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('https://projects.growtechnologies.in/bhadra/api/user_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: email.trim(), password })  // Use mobile_number instead of email
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('Login HTTP error', resp.status, text);
        setError('Login failed (server error)');
        setLoading(false);
        return;
      }

      const body = await resp.json().catch(() => null);
      if (!body) {
        setError('Invalid server response');
        setLoading(false);
        return;
      }

      if (body.success) {
        const user = body.user;
        onLogin(user);
      } else {
        setError(body.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error', err);
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
            Driver Login
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Sign in to access your dashboard
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
    type={showPassword ? 'text' : 'password'} // Toggle between text and password
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
      <EyeOff className="w-5 h-5 mt-6" />
    ) : (
      <Eye className="w-5 h-5 mt-6" />
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
          <div className="mt-6 text-center">
            {/* Signup Link */}
            <button
              onClick={onNavigateToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Don't have an account? Driver Sign up
            </button>

            {/* Buttons Wrapper with spacing */}
            <div className="flex flex-col items-center gap-3 mt-4">
              {/* AGENT LOGIN BUTTON */}
              <button
                type="button"
                onClick={() => (window.location.href = '/bhadra/agent')}
                className="w-full py-2 text-sm font-medium rounded-full text-white bg-purple-500 hover:bg-purple-600 transition-colors"
              >
                Agent Login
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/bhadra/admin')}
                className="w-full py-2 text-sm font-medium rounded-full text-white bg-orange-500 hover:bg-orange-600 transition-colors"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
