import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, Truck, IndianRupee, Phone, Weight, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminOrderCreateProps {
  admin: any;
  onBack: () => void;
  onSuccess: () => void;
}

interface User {
  id: string;
  full_name: string;
  vehicle_type: string;
  wheel_type: string;
  mobile_number: string;
}

export default function AdminOrderCreate({ admin, onBack, onSuccess }: AdminOrderCreateProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup_location: '',
    delivery_location: '',
    weight: '',
    material_type: '',
    vehicle_type: '',
    wheel_type: '',
    amount: '',
    advance: '',
    contact_number: '',
    assigned_to: ''
  });

  const vehicleTypes = ['truck', 'tempo', 'mini-truck'];
  const wheelTypes = ['4-wheel', '6-wheel', '10-wheel', '12-wheel', '14-wheel'];
  const materialTypes = ['Electronics', 'Furniture', 'Construction Materials', 'Food Items', 'Clothing', 'Machinery', 'Raw Materials', 'Other'];

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  const fetchApprovedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, vehicle_type, wheel_type, mobile_number')
        .eq('approval_status', 'approved')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pickup_location || !formData.delivery_location || !formData.weight ||
        !formData.material_type || !formData.vehicle_type || !formData.amount ||
        !formData.advance || !formData.contact_number) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.advance) > parseFloat(formData.amount)) {
      alert('Advance amount cannot be greater than total amount');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        pickup_location: formData.pickup_location,
        delivery_location: formData.delivery_location,
        weight: formData.weight,
        material_type: formData.material_type,
        vehicle_type: formData.vehicle_type,
        wheel_type: formData.wheel_type || null,
        amount: parseFloat(formData.amount),
        advance: parseFloat(formData.advance),
        contact_number: formData.contact_number,
        assigned_to: formData.assigned_to || null,
        status: formData.assigned_to ? 'assigned' : 'pending',
        created_by: admin.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      alert('Order created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!formData.vehicle_type) return true;
    return user.vehicle_type === formData.vehicle_type;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create New Order</h1>
              <p className="text-sm text-slate-500">Submit order details for logistics</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Location Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  From Location (Pickup) *
                </label>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleInputChange}
                  placeholder="Enter pickup location"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delivery Location *
                </label>
                <input
                  type="text"
                  name="delivery_location"
                  value={formData.delivery_location}
                  onChange={handleInputChange}
                  placeholder="Enter delivery location"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Material Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Weight (Kg/Ton) *
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 Ton, 500 Kg"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Material Type *
                </label>
                <select
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select material type</option>
                  {materialTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Vehicle Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wheel Type (Optional)
                </label>
                <select
                  name="wheel_type"
                  value={formData.wheel_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select wheel type</option>
                  {wheelTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter total amount"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Advance (₹) *
                </label>
                <input
                  type="number"
                  name="advance"
                  value={formData.advance}
                  onChange={handleInputChange}
                  placeholder="Enter advance amount"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {formData.amount && formData.advance && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Balance Amount:</span> ₹
                  {(parseFloat(formData.amount) - parseFloat(formData.advance)).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                pattern="[0-9]{10}"
                maxLength={10}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Enter 10-digit mobile number</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Driver Assignment (Optional)</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign to Driver
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Leave Unassigned</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} - {user.vehicle_type} ({user.wheel_type}) - {user.mobile_number}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.vehicle_type
                  ? `Showing drivers with ${formData.vehicle_type} vehicles`
                  : 'Select vehicle type to filter drivers'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating Order...
                </span>
              ) : (
                'Create Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
