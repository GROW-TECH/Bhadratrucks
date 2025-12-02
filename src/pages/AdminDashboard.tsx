import { useEffect, useState } from 'react';
import { Users, Package, UserCheck, LogOut, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
  onNavigateToCreateOrder?: () => void;
  onNavigateToOrderManagement?: () => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  district: string;
  vehicle_type: string;
  wheel_type: string;
  referral_code: string;
  approval_status: string;
  reward_wallet: number;
  diesel_wallet: number;
  created_at: string;
}

interface Order {
  id: string;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  wheel_type: string | null;
  amount: number;
  advance: number;
  contact_number: string;
  assigned_to: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboard({ admin, onLogout, onNavigateToCreateOrder, onNavigateToOrderManagement }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'orders' | 'create-order'>('pending');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const [orderForm, setOrderForm] = useState({
    pickup_location: '',
    delivery_location: '',
    weight: '',
    material_type: '',
    vehicle_type: '',
    wheel_type: '',
    amount: '',
    advance: '',
    contact_number: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(allUsers || []);
      setPendingUsers((allUsers || []).filter(u => u.approval_status === 'pending'));
      setApprovedUsers((allUsers || []).filter(u => u.approval_status === 'approved'));
      setOrders(allOrders || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      const user = users.find(u => u.id === userId);
      if (user?.referred_by) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id, reward_wallet')
          .eq('referral_code', user.referred_by)
          .maybeSingle();

        if (referrer) {
          await supabase
            .from('users')
            .update({ reward_wallet: referrer.reward_wallet + 50 })
            .eq('id', referrer.id);
        }
      }

      fetchData();
      alert('User approved successfully!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchData();
      alert('User rejected and removed');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          pickup_location: orderForm.pickup_location,
          delivery_location: orderForm.delivery_location,
          weight: orderForm.weight,
          material_type: orderForm.material_type,
          vehicle_type: orderForm.vehicle_type,
          wheel_type: orderForm.wheel_type || null,
          amount: parseFloat(orderForm.amount),
          advance: parseFloat(orderForm.advance) || 0,
          contact_number: orderForm.contact_number,
          assigned_to: orderForm.assigned_to || null,
          status: orderForm.assigned_to ? 'assigned' : 'pending',
        });

      if (error) throw error;

      setOrderForm({
        pickup_location: '',
        delivery_location: '',
        weight: '',
        material_type: '',
        vehicle_type: '',
        wheel_type: '',
        amount: '',
        advance: '',
        contact_number: '',
        assigned_to: '',
      });

      setShowCreateOrder(false);
      fetchData();
      alert('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const filterUsersByWheelType = (wheelType: string) => {
    return approvedUsers.filter(u => u.wheel_type === wheelType);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">GoTruck Management</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{users.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Pending Approval</p>
            <p className="text-3xl font-bold text-slate-900">{pendingUsers.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Approved Users</p>
            <p className="text-3xl font-bold text-slate-900">{approvedUsers.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Users ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Orders ({orders.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">User Approval</h3>
                {pendingUsers.length === 0 ? (
                  <p className="text-slate-600 text-center py-12">No pending users</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Name</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Email</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Mobile</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Vehicle</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Wheel Type</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pendingUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-900">{user.full_name}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.email}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.mobile_number}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_type}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.wheel_type}</td>
                            <td className="px-4 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveUser(user.id)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">All Members</h3>
                <div className="mb-6 grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">4 Wheel</p>
                    <p className="text-2xl font-bold text-blue-600">{filterUsersByWheelType('4-wheel').length}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900 mb-1">6 Wheel</p>
                    <p className="text-2xl font-bold text-green-600">{filterUsersByWheelType('6-wheel').length}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-orange-900 mb-1">10-14 Wheel</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {filterUsersByWheelType('10-wheel').length +
                       filterUsersByWheelType('12-wheel').length +
                       filterUsersByWheelType('14-wheel').length}
                    </p>
                  </div>
                </div>
                {users.length === 0 ? (
                  <p className="text-slate-600 text-center py-12">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Name</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Mobile</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">District</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Vehicle</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Wheel</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Referral</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-900">{user.full_name}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.mobile_number}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.district}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_type}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{user.wheel_type}</td>
                            <td className="px-4 py-4 text-sm font-mono text-slate-600">{user.referral_code}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                                user.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.approval_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">All Orders</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={onNavigateToCreateOrder}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Order</span>
                    </button>
                    {orders.length > 0 && (
                      <button
                        onClick={onNavigateToOrderManagement}
                        className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Package className="w-5 h-5" />
                        <span>Manage Orders</span>
                      </button>
                    )}
                  </div>
                </div>
                {orders.length === 0 ? (
                  <p className="text-slate-600 text-center py-12">No orders found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Pickup</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Delivery</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Material</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Weight</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Vehicle</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Amount</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Advance</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-900">{order.pickup_location}</td>
                            <td className="px-4 py-4 text-sm text-slate-900">{order.delivery_location}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{order.material_type}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{order.weight}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{order.vehicle_type}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">₹{order.amount}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">₹{order.advance}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Location *</label>
                  <input
                    type="text"
                    value={orderForm.pickup_location}
                    onChange={(e) => setOrderForm({ ...orderForm, pickup_location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Location *</label>
                  <input
                    type="text"
                    value={orderForm.delivery_location}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg/ton) *</label>
                  <input
                    type="text"
                    value={orderForm.weight}
                    onChange={(e) => setOrderForm({ ...orderForm, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Material Type *</label>
                  <input
                    type="text"
                    value={orderForm.material_type}
                    onChange={(e) => setOrderForm({ ...orderForm, material_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type *</label>
                  <select
                    value={orderForm.vehicle_type}
                    onChange={(e) => setOrderForm({ ...orderForm, vehicle_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select vehicle type</option>
                    <option value="truck">Truck</option>
                    <option value="lorry">Lorry</option>
                    <option value="trailer">Trailer</option>
                    <option value="mini-truck">Mini Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Wheel Type</label>
                  <select
                    value={orderForm.wheel_type}
                    onChange={(e) => setOrderForm({ ...orderForm, wheel_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="4-wheel">4 Wheel</option>
                    <option value="6-wheel">6 Wheel</option>
                    <option value="10-wheel">10 Wheel</option>
                    <option value="12-wheel">12 Wheel</option>
                    <option value="14-wheel">14 Wheel</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    value={orderForm.amount}
                    onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Advance (₹)</label>
                  <input
                    type="number"
                    value={orderForm.advance}
                    onChange={(e) => setOrderForm({ ...orderForm, advance: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={orderForm.contact_number}
                  onChange={(e) => setOrderForm({ ...orderForm, contact_number: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Driver (Optional)</label>
                <select
                  value={orderForm.assigned_to}
                  onChange={(e) => setOrderForm({ ...orderForm, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {approvedUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} - {user.wheel_type} ({user.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateOrder(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
