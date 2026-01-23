// src/pages/AdminOrderManagement.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Package, MapPin, Phone, IndianRupee, Edit, Trash2 } from 'lucide-react';

interface AdminOrderManagementProps {
  admin?: any;
  onBack: () => void;
  onViewOrder?: (orderId: string | number) => void;
}

interface Order {
  id: string | number;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  wheel_type?: string | null;
  amount: number;
  advance?: number;
  contact_number?: string;
  assigned_to?: string | number | null;
  status?: string;
  created_at?: string;
  trip_date?: string;
  truck_type?: string;
  ft?: string | number;
  agent_id: number;
}
interface Agent {
  id: string | number;
  full_name?: string;
  mobile_number?: string;
  district?: string;
  membership_type?: string;
  reward_wallet?: number;
  diesel_wallet?: number;
  referred_by?: string;
  password?: string;
  referral_code?: string; // This is what we need
  aadhar_file?: string;
  created_at?: string;
}
interface User {
  id: string | number;
  full_name?: string;
  name?: string;
  username?: string;
  wheel_type?: string;
  vehicle_type?: string;
  mobile_number?: string;
  approval_status?: string;
  referral_code?: string;
  [k: string]: any;
}

const API_BASE = 'https://projects.growtechnologies.in/bhadra/api';
const COMMON_CONFIRM_URL = 'https://projects.growtechnologies.in/bhadra/common_order_confirm.php';

export default function AdminOrderManagement({ onBack, onViewOrder }: AdminOrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed' | 'common'>('all');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]); // ADD THIS LINE
  // modal for common-order detail view
  const [showCommonModal, setShowCommonModal] = useState(false);
  const [commonOrder, setCommonOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
  setLoading(true);
  try {
    // Add agents API call
    const [ordersResp, usersResp, agentsResp] = await Promise.all([
      fetch(`${API_BASE}/orders.php`),
      fetch(`${API_BASE}/users.php`),
      fetch(`${API_BASE}/agents.php`), // ADD THIS LINE
    ]);

    if (!ordersResp.ok) throw new Error('Failed to fetch orders');
    if (!usersResp.ok) throw new Error('Failed to fetch users');

    const ordersData = (await ordersResp.json()) as any;
    const usersData = (await usersResp.json()) as any;
    const agentsData = (await agentsResp.json()) as any; // ADD THIS LINE

    setOrders(Array.isArray(ordersData) ? ordersData : []);

    const usersArray = Array.isArray(usersData)
      ? usersData
      : Array.isArray(usersData?.users)
      ? usersData.users
      : [];

    setUsers(usersArray);
    
    // Handle agents data
    const agentsArray = Array.isArray(agentsData)
      ? agentsData
      : Array.isArray(agentsData?.agents)
      ? agentsData.agents
      : [];
    setAgents(agentsArray);
    
  } catch (err) {
    console.error('Error fetching data:', err);
    setOrders([]);
    setUsers([]);
    setAgents([]); // ADD THIS
  } finally {
    setLoading(false);
  }
    // Add these helper functions after fetchData

};
const getAgentById = (agentId: string | number) => {
  return agents.find(agent => String(agent.id) === String(agentId));
};

const getAgentReferralCode = (agentId: string | number) => {
  const agent = getAgentById(agentId);
  return agent?.referral_code || null;
};
  const callUpdateOrder = async (payload: any) => {
    const resp = await fetch(`${API_BASE}/update_order.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body?.error || 'Update failed');
    }
    return resp.json().catch(() => ({}));
  };

  const handleUpdateStatus = async (orderId: string | number, newStatus: string) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;
    setUpdating(true);
    try {
      await callUpdateOrder({
        orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      await fetchData();
      setShowStatusModal(false);
      setSelectedOrder(null);
      alert('Order status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string | number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      const resp = await fetch(`${API_BASE}/delete_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || 'Delete failed');
      }
      await fetchData();
      alert('Order deleted successfully!');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  const handleReassignDriver = async (orderId: string | number, driverId: string) => {
    setUpdating(true);
    try {
      const status = driverId ? 'assigned' : 'pending';
      await callUpdateOrder({
        orderId,
        assigned_to: driverId || null,
        status,
        updated_at: new Date().toISOString(),
      });
      await fetchData();
      alert('Driver assignment updated!');
    } catch (err) {
      console.error('Error reassigning driver:', err);
      alert('Failed to reassign driver');
    } finally {
      setUpdating(false);
    }
  };

  // filter logic (includes 'common' where assigned_to === 'commom' or 'common')
  const filteredOrders = orders.filter((order) => {
  // existing filter logic
  if (filter !== 'all') {
    if (filter === 'common') {
      const a = String(order.assigned_to || '').toLowerCase();
      if (!(a === 'commom' || a === 'common')) return false;
    } else {
      const status = (order.status || '').toLowerCase();
      if (status !== filter) return false;
    }
  }

  // search logic
  if (!search.trim()) return true;

  const searchableText = Object.values(order)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(search.toLowerCase());
});


  const getStatusColor = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    switch (s) {
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

  const getUserLabel = (user: User | undefined, fallbackId?: string) => {
    if (!user) {
      return fallbackId ? `Driver #${fallbackId}` : 'Unassigned';
    }

    const parts: string[] = [];

    const main =
      user.full_name ||
      user.name ||
      user.username ||
      (fallbackId ? `Driver #${fallbackId}` : `Driver #${user.id}`);
    parts.push(main);

    if (user.mobile_number) parts.push(user.mobile_number);
    if (user.vehicle_type) parts.push(user.vehicle_type);
    if (user.wheel_type) parts.push(user.wheel_type);

    return parts.join(' | ');
  };

  // open the common-order detailed UI modal (like your screenshot)
  const openCommonModal = (order: Order) => {
    setCommonOrder(order);
    setShowCommonModal(true);
  };

  // Open the PHP confirmation page in a new tab (mobile-friendly UI)
  const confirmCommonOrder = async (orderId: string | number) => {
    const url = `${COMMON_CONFIRM_URL}?order_id=${encodeURIComponent(String(orderId))}`;
    // open in new tab to show the mobile-friendly PHP UI
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // counts
  const countBy = (predicate: (o: Order) => boolean) => orders.filter(predicate).length;
  const commonCount = countBy(o => {
    const a = String(o.assigned_to || '').toLowerCase();
    return a === 'commom' || a === 'common';
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
        {/* Search Box */}
<div className="mb-4">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search orders..."
    className="w-full md:w-1/3 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  />
</div>

        {/* Filter Buttons */}
        
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
                Pending ({orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length})
              </button>

              <button
                onClick={() => setFilter('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active ({orders.filter((o) => (o.status || '').toLowerCase() === 'assigned').length})
              </button>

              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Completed ({orders.filter((o) => (o.status || '').toLowerCase() === 'completed').length})
              </button>

              {/* NEW: Common Orders Tab */}
              <button
                onClick={() => setFilter('common')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'common'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Common Orders ({commonCount})
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium mb-2">No orders found</p>
            <p className="text-slate-500 text-sm">
              {filter === 'all' ? 'No orders in system yet' : `No ${filter} orders currently`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const normStatus = (order.status || '').toLowerCase();

              const assignedId =
                order.assigned_to !== null &&
                order.assigned_to !== undefined &&
                String(order.assigned_to).trim() !== ''
                  ? String(order.assigned_to).trim()
                  : '';

              const assignedUser = assignedId
                ? users.find((u) => String(u.id).trim() === assignedId)
                : undefined;

              const assignedLabel = assignedId ? getUserLabel(assignedUser, assignedId) : 'Unassigned';

              const assignedValue = assignedId;

              return (
                <div key={String(order.id)} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Order ID</p>
                          <p className="text-sm font-mono font-medium text-slate-900">
                            {String(order.id).substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(normStatus)}`}>
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
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

                    {/* Locations + Order Info */}
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

                    {/* Footer */}
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
                          <button onClick={() => onViewOrder(order.id)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View Details
                          </button>
                        )}

                        <span className="text-sm text-slate-600">
                          Assigned to: <span className="font-medium">{assignedLabel}</span>
                        </span>

                        <select
                          value={assignedValue}
                          onChange={(e) => handleReassignDriver(order.id, e.target.value)}
                          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          disabled={updating}
                        >
                          <option value="">Unassigned</option>
                          {users
                            .filter(user => user.approval_status === 'approved')
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {getUserLabel(user, String(user.id))}
                              </option>
                            ))}
                        </select>

                        {/* If this is a common order, show a quick button to open common UI */}
                        {(() => {
                          const a = String(order.assigned_to || '').toLowerCase();
                          if (a === 'commom' || a === 'common') {
                            return (
                              <button
                                onClick={() => openCommonModal(order)}
                                className="ml-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-sm hover:bg-indigo-100"
                              >
                                Open Common View
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Update Order Status</h3>

            <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Order ID:</span>
                <span className="font-mono font-medium text-slate-900">{String(selectedOrder.id).substring(0, 8).toUpperCase()}</span>
              </div>

            {selectedOrder.agent_id && (
  <>
    <div className="pt-3 border-t border-slate-200">
      {(() => {
        const agentReferralCode = getAgentReferralCode(selectedOrder.agent_id);
        const agent = getAgentById(selectedOrder.agent_id);
        
        if (agentReferralCode) {
          return (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Agent ID:</span>
               
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Referral Code:</span>
                <span className="font-mono font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
                  {agentReferralCode}
                </span>
              </div>
            
            </>
          );
        } else {
          // If agent exists but no referral code
          return (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Agent ID:</span>
              <span className="font-medium text-slate-900">Agent #{selectedOrder.agent_id} (No referral code)</span>
            </div>
          );
        }
      })()}
    </div>
  </>
)}
            </div>

            <div className="space-y-3">
              <button onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')} className="w-full text-left px-4 py-3 rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors disabled:opacity-50" disabled={updating}>
                <p className="font-medium text-yellow-900">Pending</p>
                <p className="text-xs text-yellow-700">Order awaiting assignment</p>
              </button>

              <button onClick={() => handleUpdateStatus(selectedOrder.id, 'assigned')} className="w-full text-left px-4 py-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50" disabled={updating}>
                <p className="font-medium text-blue-900">Assigned</p>
                <p className="text-xs text-blue-700">Order assigned to driver</p>
              </button>

              <button onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')} className="w-full text-left px-4 py-3 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50" disabled={updating}>
                <p className="font-medium text-green-900">Completed</p>
                <p className="text-xs text-green-700">Order delivered successfully</p>
              </button>

              <button onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')} className="w-full text-left px-4 py-3 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50" disabled={updating}>
                <p className="font-medium text-red-900">Cancelled </p>
                <p className="text-xs text-red-700">Order cancelled</p>
              </button>
            </div>

            <button onClick={() => { setShowStatusModal(false); setSelectedOrder(null); }} className="w-full mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition-colors disabled:opacity-50" disabled={updating}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Common Order Detail Modal (matches screenshot) */}
      {showCommonModal && commonOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 p-8 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold">B</div>
                  <div>
                    <div className="text-sm font-medium">BHADRA TRUCKS</div>
                    <div className="text-xs text-slate-300">Order confirmation</div>
                  </div>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-slate-800 font-medium text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-2" /> {commonOrder.status || 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl p-6 text-slate-900">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-sm text-slate-500 mb-4">Review and confirm this booking.</p>

              <div className="rounded-xl border border-slate-100 p-4 mb-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">ORDER</p>

                    <div className="mt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-green-600">PICKUP</span>
                          <span className="font-medium text-slate-900">{commonOrder.pickup_location}</span>
                        </div>
                        <div className="flex-1 border-l h-10" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-red-600">DROP</span>
                          <span className="font-medium text-slate-900">{commonOrder.delivery_location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-medium">ORDER{String(commonOrder.id)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 mb-6 bg-slate-50 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">PRICE</p>
                  <div className="text-xl font-bold">₹{typeof commonOrder.amount === 'number' ? commonOrder.amount.toFixed(2) : commonOrder.amount}</div>

                  <p className="mt-4 text-xs text-slate-500">WHEEL TYPE</p>
                  <div className="font-medium">{commonOrder.wheel_type || '—'}</div>

                  <p className="mt-4 text-xs text-slate-500">CONTACT</p>
                  <div className="font-medium">{commonOrder.contact_number}</div>
                </div>

                <div>
                  <p className="text-xs text-slate-500">VEHICLE TYPE</p>
                  <div className="font-medium">{commonOrder.vehicle_type}</div>

                  <p className="mt-4 text-xs text-slate-500">MATERIAL</p>
                  <div className="font-medium">{commonOrder.material_type}</div>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={() => confirmCommonOrder(commonOrder.id)} disabled={updating} className="w-full max-w-md py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:opacity-95">
                  Open secure confirmation page
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-3 text-center">You can confirm this Order only once. After confirmation, this secure link will no longer be active.</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowCommonModal(false); setCommonOrder(null); }} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
