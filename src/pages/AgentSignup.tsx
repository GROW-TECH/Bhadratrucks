// src/pages/AgentSignup.tsx
import { useState, useRef } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import logo from '../assets/newlogo.jpeg';

interface AgentSignupProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

interface FormDataState {
  full_name: string;
  mobile_number: string;
  district: string;
  password: string;
  referred_by: string; // ⭐ new
}


export default function AgentSignup({
  onSignupSuccess,
  onNavigateToLogin,
}: AgentSignupProps) {
  const [formData, setFormData] = useState<FormDataState>({
  full_name: '',
  mobile_number: '',
  district: '',
  password: '',
  referred_by: '', // ⭐ new
});


  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'mobile_number') {
      if (value === '' || /^\d+$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value.slice(0, 10),
        }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 
  const validateForm = () => {
    if (
      !formData.full_name.trim() ||
      !formData.mobile_number.trim() ||
      !formData.district.trim() ||
      !formData.password.trim()
    ) {
      setError('Please fill all fields.');
      return false;
    }

    if (formData.mobile_number.length !== 10) {
      setError('Mobile number must be 10 digits.');
      return false;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return false;
    }

    

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const form = new FormData();
form.append('full_name', formData.full_name.trim());
form.append('mobile_number', formData.mobile_number.trim());
form.append('district', formData.district.trim());
form.append('password', formData.password.trim());

if (formData.referred_by.trim()) {
  form.append('referred_by', formData.referred_by.trim());
}



      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/agent_register.php',
        {
          method: 'POST',
          body: form,
        }
      );

      const text = await resp.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Invalid server response');
      }

      if (!resp.ok) {
        setError(body?.error || `Server error (${resp.status})`);
        return;
      }

      if (body?.success) {
        setReferralCode(body?.referral_code || null);
        setSuccess(true);
        setTimeout(() => onSignupSuccess(), 2500);
      } else {
        setError(body?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Signup error', err);
      setError(err.message || 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Signup Successful 🎉
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Your details have been submitted. You can now login.
          </p>

          {referralCode && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">
                Your agent referral code:
              </p>
              <p className="text-xl font-mono font-bold text-blue-800">
                {referralCode}
              </p>
              <p className="text-xs text-slate-500 mt-2">
  Share this code with other agents to use during signup.
</p>

            </div>
          )}

          <button
            onClick={onNavigateToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Top row: back + logo */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="flex items-center text-slate-600 hover:text-slate-900 text-sm transition-colors"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Login
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-800">
                Bhadra Truck
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-2">
            Agent Signup
          </h1>
          <p className="text-center text-slate-600 mb-8 text-sm">
            Register as an agent with basic details and Aadhaar proof.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm flex items-center">
                <X className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name + Mobile */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="Full name"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mobile Number * 
                </label>
                <input
                  name="mobile_number"
                  type="tel"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="10-digit mobile"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                District *
              </label>
              <input
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                placeholder="District"
                disabled={loading}
                required
              />
            </div>
{/* Referral Code (Optional) */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">
    Referral Code (Optional)
  </label>
  <input
    name="referred_by"
    value={formData.referred_by}
    onChange={handleChange}
    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
    placeholder="Enter agent referral code"
    disabled={loading}
  />
  <p className="text-xs text-slate-500 mt-1">
    Referrer gets ₹10 reward when you register.
  </p>
</div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password *
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                placeholder="Enter password"
                disabled={loading}
                required
              />
            </div>

            

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
