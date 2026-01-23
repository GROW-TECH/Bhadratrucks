// src/pages/UserOrders.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Package, Phone, Truck, Calendar, IndianRupee } from 'lucide-react';

interface UserOrdersProps {
  user: any;
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
  status: string;
  created_at: string;
  assigned_to?: string | number | null; // added
  driver_id?: string | number | null;   // added
  user_id?: string | number | null;     // added
}

export default function UserOrders({ user, onBack, onViewOrder }: UserOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed' | 'confirmed'>('all');

  useEffect(() => {
    if (!user?.id) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders from backend (safer if assigned_to param behavior is inconsistent)
      const resp = await fetch(`https://projects.growtechnologies.in/bhadra/api/orders.php`);
      if (!resp.ok) {
        console.error('Failed to fetch orders', resp.status, await resp.text());
        setOrders([]);
        return;
      }

      const data = await resp.json().catch(() => []);
      const arr: Order[] = Array.isArray(data) ? data : [];

      console.debug('[UserOrders] fetched orders count:', arr.length);

      // Normalize user id for comparison (string trimmed)
      const uid = user?.id !== undefined && user?.id !== null ? String(user.id).trim() : '';

      // Client-side filter:
      // - keep only rows where assigned_to/driver_id/user_id matches the user id (normalized)
      // - and status is 'confirmed' (case-insensitive)
      const confirmedOnly = arr.filter((o) => {
        const assignedVal = o.assigned_to ?? o.driver_id ?? o.user_id ?? null;

        // Normalize assignedVal to string trimmed for comparison (handle numbers and strings)
        const assignedStr = assignedVal === null || assignedVal === undefined
          ? ''
          : String(assignedVal).trim();

        const statusStr = (o.status ?? '').toString().trim().toLowerCase();

        const matchesUser = uid !== '' && (assignedStr === uid || assignedStr === `\"${uid}\"`);
        const isConfirmed = statusStr === 'confirmed';

        if (matchesUser && isConfirmed) return true;
        return false;
      });

      console.debug('[UserOrders] after client filter confirmedOnly count:', confirmedOnly.length);
      // Save filtered list (confirmed by this user)
      setOrders(confirmedOnly);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    assigned: orders.filter(o => o.status === 'assigned').length,
    completed: orders.filter(o => o.status === 'completed').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

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
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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
              <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
              <p className="text-sm text-slate-500">Orders you confirmed</p>
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
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pending ({counts.pending})
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active ({counts.assigned})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Completed ({counts.completed})
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'confirmed' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Confirmed ({counts.confirmed})
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
                ? 'You have not confirmed any orders yet'
                : `No ${filter} orders at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Order ID</p>
                        <p className="text-sm font-mono font-medium text-slate-900">
                          {(order.id ?? '').toString().substring(0, 8).toUpperCase() || '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Pickup Location</p>
                          <p className="text-sm font-medium text-slate-900">{order.pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Delivery Location</p>
                          <p className="text-sm font-medium text-slate-900">{order.delivery_location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Material</span>
                        <span className="text-sm font-medium text-slate-900">{order.material_type}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Weight</span>
                        <span className="text-sm font-medium text-slate-900">{order.weight}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Vehicle Type</span>
                        <span className="text-sm font-medium text-slate-900">{order.vehicle_type}</span>
                      </div>
                      {order.wheel_type && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-600">Wheel Type</span>
                          <span className="text-sm font-medium text-slate-900">{order.wheel_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Amount</p>
                        <p className="text-lg font-bold text-slate-900">₹{order.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Advance Paid</p>
                        <p className="text-lg font-bold text-green-600">₹{order.advance}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact</p>
                        <p className="text-sm font-medium text-slate-900">{order.contact_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-slate-700">
                        Balance: ₹{order.amount - order.advance}
                      </div>
                      {onViewOrder && (
                        <button
                          onClick={() => onViewOrder(order.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
