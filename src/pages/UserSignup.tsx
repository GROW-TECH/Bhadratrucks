import { useState, useRef } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import logo from '../assets/newlogo.jpeg';

interface UserSignupProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

interface FormData {
  email: string;
  password: string;
  full_name: string;
  mobile_number: string;
  district: string;
  vehicle_type: string;
  wheel_type: string;
  vehicle_feet: string;
  vehicle_body: string;
  vehicle_number: string;
  referred_by: string;
}

export default function UserSignup({
  onSignupSuccess,
  onNavigateToLogin,
}: UserSignupProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    full_name: '',
    mobile_number: '',
    district: '',
    vehicle_type: '',
    wheel_type: '',
    vehicle_feet: '',
    vehicle_body: '',
    vehicle_number: '',
    referred_by: '',
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vehicleFeetOptions = [
    '9 ft',
    '10 ft',
    '14 ft',
    '15 ft',
    '16 ft',
    '17 ft',
    '18 ft',
    '19 ft',
    '20 ft',
    '21 ft',
    '22 ft',
    '32 ft',
    '33 ft',
    'Other',
  ];

  const vehicleBodyTypes = ['Open', 'Container'];
  const vehicleTypes = ['truck', 'lorry', 'trailer', 'mini-truck'];
  const wheelTypes = ['4-wheel', '6-wheel', '10-wheel', '12-wheel', '16-wheel'];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Validate mobile number for digits only
    if (name === 'mobile_number') {
      if (value === '' || /^\d+$/.test(value)) {
        setFormData({ ...formData, [name]: value.slice(0, 10) });
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JPG, PNG, GIF, or PDF files.');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }
      
      setDocumentFile(file);
      setError('');
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    // Check required fields
    if (
      !formData.full_name.trim() ||
      !formData.mobile_number.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.district ||
      !formData.vehicle_type ||
      !formData.wheel_type ||
      !formData.vehicle_feet ||
      !formData.vehicle_body ||
      !formData.vehicle_number.trim()
    ) {
      setError('Please fill all required fields.');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Validate mobile number
    if (formData.mobile_number.length !== 10) {
      setError('Mobile number must be 10 digits.');
      return false;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    // Check document
    if (!documentFile) {
      setError('Please upload the required document (RC/License).');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          form.append(key, value);
        }
      });

      // Append the document file
      if (documentFile) {
        form.append('document', documentFile);
      }

      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/register_user.php',
        {
          method: 'POST',
          body: form,
          // Don't set Content-Type header - let browser set it automatically
        }
      );

      const text = await resp.text();
      let body: any = null;
      
      try {
        body = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response:', text);
        throw new Error('Invalid server response');
      }

      if (!resp.ok) {
        setError(body?.error || `Server error (${resp.status})`);
        return;
      }

      if (body?.success) {
        setSuccess(true);
        setTimeout(() => onSignupSuccess(), 3000);
      } else {
        setError(body?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Signup error', err);
      setError(err.message || 'Network error — please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
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
            Registration Successfull! 🎉
          </h2>
         
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Please wait for admin approval to start receiving loads.
            </p>
          </div>
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
      <div className="w-full max-w-2xl">
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
            Driver Signup
          </h1>
          <p className="text-center text-slate-600 mb-8 text-sm">
            Create your driver account to start receiving loads and rewards.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <p className="text-red-700 text-sm flex items-center">
                <X className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name + Mobile */}
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
                  placeholder="Driver name"
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

            {/* Email + Password */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="name@example.com"
                  disabled={loading}
                  required
                />
              </div>
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
                  placeholder="Min 6 characters"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* District + Mail ID */}
            <div className="grid sm:grid-cols-2 gap-4">
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
            

            {/* Vehicle Type + Wheel Type */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Vehicle Type *
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  disabled={loading}
                  required
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
             <div>
  <label className="block text-sm font-medium text-slate-700 mb-1.5">
    Wheel Type *
  </label>
  <select
    name="wheel_type"
    value={formData.wheel_type}
    onChange={handleChange}
    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
    disabled={loading}
    required
  >
    <option value="">Select wheel type</option>
    {wheelTypes.map((wheel) => (
      <option key={wheel} value={wheel}>
        {wheel}
      </option>
    ))}
  </select>

  {formData.wheel_type === '4-wheel' && (
    <p className="mt-2 text-xs font-semibold text-emerald-600">
      ⭐ Elite Premium: 4-wheel vehicle.
    </p>
  )}
</div>

            </div>
            </div>

            {/* Vehicle Feet + Body + Number */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Vehicle Feet *
                </label>
                <select
                  name="vehicle_feet"
                  value={formData.vehicle_feet}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  disabled={loading}
                  required
                >
                  <option value="">Select vehicle feet</option>
                  {vehicleFeetOptions.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Vehicle Body *
                </label>
                <select
                  name="vehicle_body"
                  value={formData.vehicle_body}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  disabled={loading}
                  required
                >
                  <option value="">Select body type</option>
                  {vehicleBodyTypes.map((body) => (
                    <option key={body} value={body}>
                      {body}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Vehicle Number *
                </label>
                <input
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="e.g. KA01AB1234"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Referral Code (Optional)
              </label>
              <input
                name="referred_by"
                value={formData.referred_by}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                placeholder="Enter referral code if any"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
  Enter the referral code of the driver who invited you (if any).
  Referrer gets {formData.wheel_type === '4-wheel' ? '₹500' : '₹10'} reward when you register.
</p>

            </div>

            {/* Document Upload */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-slate-700 mb-3 flex items-center gap-2 font-medium">
                <Upload className="w-4 h-4" />
                Upload Documents (RC / License) *
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,image/*"
                    onChange={handleDocumentChange}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Accepted formats: JPG, PNG, GIF, PDF (Max 5MB)
                  </p>
                </div>
                
                {documentFile && (
                  <button
                    type="button"
                    onClick={removeDocument}
                    className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Preview:</p>
                  <div className="relative w-32 h-32 border border-slate-300 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              {documentFile && !previewUrl && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📄 {documentFile.name} ({(documentFile.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Registration...
                  </span>
                ) : (
                  'Submit Registration'
                )}
              </button>
              
              <p className="text-center text-xs text-slate-500 mt-4">
                By registering, you agree to our Terms of Service and Privacy Policy.
                You'll receive ₹1000 diesel wallet bonus upon approval.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}