import { useEffect, useState } from 'react';
import { ArrowLeft, Package, MapPin, Phone, IndianRupee, Edit, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminOrderManagementProps {
  admin: any;
  onBack: () => void;
  onViewOrder?: (orderId: string) => void;
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

interface User {
  id: string;
  full_name: string;
  wheel_type: string;
  vehicle_type: string;
  mobile_number: string;
}

export default function AdminOrderManagement({ admin, onBack, onViewOrder }: AdminOrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersResult, usersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, full_name, wheel_type, vehicle_type, mobile_number')
          .eq('approval_status', 'approved')
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (usersResult.error) throw usersResult.error;

      setOrders(ordersResult.data || []);
      setUsers(usersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
      setShowStatusModal(false);
      setSelectedOrder(null);
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
      alert('Order deleted successfully!');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handleReassignDriver = async (orderId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          assigned_to: driverId || null,
          status: driverId ? 'assigned' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
      alert('Driver assignment updated!');
    } catch (error) {
      console.error('Error reassigning driver:', error);
      alert('Failed to reassign driver');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

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
              <h1 className="text-xl font-bold text-slate-900">Order Management</h1>
              <p className="text-sm text-slate-500">Manage and track all orders</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active ({orders.filter(o => o.status === 'assigned').length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Completed ({orders.filter(o => o.status === 'completed').length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium mb-2">No orders found</p>
            <p className="text-slate-500 text-sm">
              {filter === 'all'
                ? 'No orders in the system yet'
                : `No ${filter} orders at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Order ID</p>
                        <p className="text-sm font-mono font-medium text-slate-900">
                          {order.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Update Status"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Pickup</p>
                          <p className="text-sm font-medium text-slate-900">{order.pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Delivery</p>
                          <p className="text-sm font-medium text-slate-900">{order.delivery_location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Material:</span>
                        <span className="font-medium text-slate-900">{order.material_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Weight:</span>
                        <span className="font-medium text-slate-900">{order.weight}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Vehicle:</span>
                        <span className="font-medium text-slate-900">{order.vehicle_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-900">₹{order.amount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-slate-600">{order.contact_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {onViewOrder && (
                        <button
                          onClick={() => onViewOrder(order.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details
                        </button>
                      )}
                      <span className="text-sm text-slate-600">Assigned to:</span>
                      <select
                        value={order.assigned_to || ''}
                        onChange={(e) => handleReassignDriver(order.id, e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.wheel_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Update Order Status</h3>
            <p className="text-sm text-slate-600 mb-6">
              Order ID: <span className="font-mono font-medium">{selectedOrder.id.substring(0, 8).toUpperCase()}</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <p className="font-medium text-yellow-900">Pending</p>
                <p className="text-xs text-yellow-700">Order awaiting assignment</p>
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'assigned')}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <p className="font-medium text-blue-900">Assigned</p>
                <p className="text-xs text-blue-700">Order assigned to driver</p>
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <p className="font-medium text-green-900">Completed</p>
                <p className="text-xs text-green-700">Order delivered successfully</p>
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <p className="font-medium text-red-900">Cancelled</p>
                <p className="text-xs text-red-700">Order cancelled</p>
              </button>
            </div>
            <button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedOrder(null);
              }}
              className="w-full mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
