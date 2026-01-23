// src/pages/AgentDashboard.tsx
import { useEffect, useState, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  Package,
  LogOut,
  Share2,
  FileText,
  Smartphone,
  Plus,
} from 'lucide-react';
import logo from '../assets/newlogo.jpeg';

interface AgentDashboardProps {
  agent: any;
  onLogout: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToWallet?: () => void;
}

interface Order {
  id: string | number;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  truck_type: string;
  amount: number;
  payment_status?: string | null;
  advance: number;
  status: string;
  created_at: string;
  assigned_to?: string | number | null;
  driver_id?: string | number | null;
  user_id?: string | number | null;
  wheel_type?: string;
  contact_number?: string;
  [k: string]: any;
}

export default function AgentDashboard({
  agent,
  onLogout,
  onNavigateToOrders,
  onNavigateToWallet,
}: AgentDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createOrderSuccess, setCreateOrderSuccess] = useState(false);

  const [profile, setProfile] = useState<any>(agent ?? null);
const agentId = profile?.id;
const pickupRef = useRef<HTMLInputElement | null>(null);
const deliveryRef = useRef<HTMLInputElement | null>(null);

  // Create Order Form State (no assign driver)
 const [orderForm, setOrderForm] = useState({
  pickup_location: '',
  delivery_location: '',
  weight: '',
  material_type: '',
  vehicle_type: '',
  truck_type: '',
  wheel_type: '',
  ft: '',
  amount: '',
  advance: '',
  contact_number: '',
});


  const paymentNumber = '8428045020';
useEffect(() => {
  if (!showCreateOrderModal) return;
  if (!window.google) return;

  if (pickupRef.current) {
    const pickupAuto = new window.google.maps.places.Autocomplete(
      pickupRef.current,
      {
        types: ['(cities)'],
        componentRestrictions: { country: 'in' },
      }
    );

    pickupAuto.addListener('place_changed', () => {
      const place = pickupAuto.getPlace();
      handleOrderFormChange(
        'pickup_location',
        place.formatted_address || place.name || ''
      );
    });
  }

  if (deliveryRef.current) {
    const deliveryAuto = new window.google.maps.places.Autocomplete(
      deliveryRef.current,
      {
        types: ['(cities)'],
        componentRestrictions: { country: 'in' },
      }
    );

    deliveryAuto.addListener('place_changed', () => {
      const place = deliveryAuto.getPlace();
      handleOrderFormChange(
        'delivery_location',
        place.formatted_address || place.name || ''
      );
    });
  }
}, [showCreateOrderModal]);
useEffect(() => {
  // fallback: restore agent from localStorage/session if page refreshed
  if (!profile && agent) {
    setProfile(agent);
  }
  console.log('agent:', agent);
console.log('profile:', profile);
console.log('agentId:', agentId);

}, [agent, profile]);

  useEffect(() => {
    if (!showCreateOrderModal) {
      setOrderForm({
        pickup_location: '',
        delivery_location: '',
        weight: '',
        material_type: '',
        vehicle_type: '',
        truck_type: '',
        wheel_type: '',
        ft:'',
        amount: '',
        advance: '',
        contact_number: '',
      });
      setCreateOrderSuccess(false);
    }
  }, [showCreateOrderModal]);

  const handleCreateOrderSubmit = async () => {
    if (!orderForm.pickup_location.trim() || !orderForm.delivery_location.trim()) {
      alert('Please fill in pickup and delivery locations');
      return;
    }

    if (!orderForm.contact_number.trim() || orderForm.contact_number.length < 10) {
      alert('Please enter a valid 10-digit contact number');
      return;
    }

    

    setCreatingOrder(true);
    try {
      // Include user_id so the order is associated with this agent as creator
      const response = await fetch('https://projects.growtechnologies.in/bhadra/api/AgentOrderCreate.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({
  pickup_location: orderForm.pickup_location,
  delivery_location: orderForm.delivery_location,
  weight: orderForm.weight,
  material_type: orderForm.material_type,
  vehicle_type: orderForm.vehicle_type,
  truck_type: orderForm.truck_type,
  ft: orderForm.ft || null,
  wheel_type: orderForm.wheel_type || null,
  amount: parseFloat(orderForm.amount),
  advance: parseFloat(orderForm.advance),
  contact_number: orderForm.contact_number,
  agent_id: agentId,         // <-- use agent_id
  status: 'pending',
}),

      });

      const data = await response.json().catch(() => ({}));

      // after const data = await response.json().catch(() => ({}));
if (data && data.id) {
  setCreateOrderSuccess(true);

  // — instant UI update without waiting for refetch
  if (data.order) {
    // normalize numeric fields just in case
    const newOrder = {
      ...data.order,
      amount: data.order.amount ? Number(data.order.amount) : 0,
      advance: data.order.advance ? Number(data.order.advance) : 0,
    };
    setOrders(prev => [newOrder, ...(prev || [])]);
  } else {
    // fallback: refetch if server didn't return full row
    await fetchOrders();
  }

  setTimeout(() => {
    setShowCreateOrderModal(false);
    setCreateOrderSuccess(false);
  }, 1200);
}
 else {
        alert(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleOrderFormChange = (field: string, value: string) => {
    setOrderForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSubmit = async () => {
    if (!newLocation.trim()) {
      alert('Location cannot be empty');
      return;
    }

    try {
      const response = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/agents.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agentId,
            new_location: newLocation,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setProfile((prev: any) => ({
          ...prev,
          vehicle_location: newLocation,
        }));
        setNewLocation('');
        setShowLocationModal(false);
        alert('Location updated successfully');
      } else {
        alert('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Error updating location');
    }
  };

  // Load full agent profile from API
  useEffect(() => {
    if (!agentId) return;
    (async () => {
      try {
        const resp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/agents.php?id=${agentId}`
        );
        const json = await resp.json().catch(() => null);
        if (json && json.success && json.agent) {
          setProfile((prev: any) => ({ ...(prev || {}), ...json.agent }));
        }
      } catch (err) {
        console.error('Failed to load agent profile', err);
      }
    })();
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      setProfile((prev: any) => ({ ...(prev || {}), ...agent }));
    }
  }, [agent]);

  // Wallet summary
  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/agent_wallet_history.php?agent_id=${encodeURIComponent(
            String(agentId)
          )}`
        );
        if (!resp.ok) return;
        const json = await resp.json().catch(() => null);
        if (!json || json.success === false || cancelled) return;
        const reward = Number(json.reward_wallet ?? 0);
        const diesel = Number(json.diesel_wallet ?? 0);
        setProfile((prev: any) => ({
          ...(prev || {}),
          reward_wallet: isNaN(reward) ? prev?.reward_wallet ?? 0 : reward,
          diesel_wallet: isNaN(diesel) ? prev?.diesel_wallet ?? 0 : diesel,
        }));
      } catch (err) {
        console.error('Failed to fetch wallet summary:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  // Orders — only fetch/show orders created by this agent (user_id / created_by)
  useEffect(() => {
  if (!agentId) return; // ⛔ wait until agentId exists

  fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [agentId]);


  const fetchOrders = async () => {
  if (!agentId) return;
  setLoading(true);
  try {
    // ask server to return only orders created by this agent
    const resp = await fetch(`https://projects.growtechnologies.in/bhadra/api/orders.php?agent_id=${encodeURIComponent(String(agentId))}`);
    if (!resp.ok) {
      setOrders([]);
      return;
    }

    const data = await resp.json().catch(() => []);
    // server returns an array of orders (or { orders: [...] })
    const arr = Array.isArray(data) ? data : Array.isArray(data.orders) ? data.orders : Array.isArray(data.data) ? data.data : [];

    setOrders(arr);
  } catch (err) {
    console.error('Error fetching orders:', err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};


  const copyReferralCode = async () => {
    const code = profile?.referral_code ?? '';
    if (!code) {
      alert('Referral code not available yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      alert('Referral code copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error', err);
      alert('Failed to copy referral code');
    }
  };

  const shareReferralCode = () => {
    const code = profile?.referral_code ?? '';
    if (!code) {
      alert('Referral code not available yet');
      return;
    }
    setShowShareModal(true);
  };

  const copyPaymentNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber);
      alert('Payment number copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error', err);
      alert('Failed to copy payment number');
    }
  };
const handleRefreshPage = () => {
  window.location.reload();
};

  const vehicleNumber = profile?.vehicle_number ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Bhadra Truck</h1>
                <p className="text-sm text-slate-500">Agent Dashboard</p>
              </div>
            </div>
           <div className="flex items-center space-x-4">
  <button
    onClick={handleRefreshPage}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm"
  >
    Refresh
  </button>

  <button
    onClick={() => setShowCreateOrderModal(true)}
    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
  >
    <Plus className="w-4 h-4" />
    <span className="text-sm font-medium">Create Order</span>
  </button>

  <button
    onClick={onLogout}
    className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
  >
    <LogOut className="w-5 h-5" />
    <span className="text-sm font-medium">Logout</span>
  </button>
</div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Top cards */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <h2 className="text-2xl font-bold">{profile?.full_name ?? 'Agent'}</h2>
              <p className="text-sm text-blue-100 mt-2">
                Vehicle No: <span className="font-semibold text-white">{vehicleNumber || '—'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Referral ID</p>
              <p className="text-xl font-mono font-bold">{profile?.referral_code ?? '—'}</p>
            </div>
            {/* <button
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Update Location
            </button> */}
          </div>
        </div>

        {/* Wallet / Orders cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button onClick={onNavigateToWallet} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Reward Wallet</p>
            <p className="text-3xl font-bold text-slate-900">₹{profile?.reward_wallet ?? 0}</p>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Agent Premium Plan – Referral Earnings</p>
          </button>

          <button onClick={onNavigateToWallet} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Bonus Wallet</p>
            <p className="text-3xl font-bold text-slate-900">₹{profile?.diesel_wallet ?? 0}</p>
            <p className="text-[11px] text-slate-500">Minimum bonus withdrawal: ₹3000.</p>
          </button>

          <button onClick={onNavigateToOrders} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Your Orders</p>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-500 mt-2">Created by you</p>
          </button>
        </div>

        {/* Payment + Share sections */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8"> 
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Payment Details</h3>
              <p className="text-sm text-slate-600">Use this number for PhonePe & Google Pay payments.</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 mt-2">Agent Location: <span className="font-semibold">{profile?.vehicle_location || '—'}</span></p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">PhonePe / Google Pay Number</p>
              <p className="text-xl font-mono font-bold text-slate-900">{paymentNumber}</p>
            </div>
            <button type="button" onClick={copyPaymentNumber} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white">Copy Number</button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Share & Earn</h3>
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600 mb-3">As an agent, for every new agent who signs up using your referral code, you earn <span className="font-semibold">₹10</span> in your reward wallet.</p>
          <div className="flex gap-3">
            <button onClick={copyReferralCode} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg">Copy Referral Code</button>
            <button onClick={shareReferralCode} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg">Share Link</button>
          </div>
        </div>

        {/* ORDERS TABLE (ONLY orders created by this agent) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Your Orders</h3>
              <p className="text-sm text-slate-600 mt-1">List of orders you created</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowCreateOrderModal(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create Order</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-600 mt-4">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No orders found — you haven't created any orders yet</p>
              <p className="text-sm text-slate-500 mt-2">Create your first order using the button above</p>
              <button onClick={() => setShowCreateOrderModal(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">Create Your First Order</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
  {orders.map(order => (
    <div
      key={order.id}
      className="border border-yellow-300 bg-yellow-50 rounded-xl p-4 shadow-sm"
    >
      {/* Amount + Status */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-lg font-bold text-slate-900">₹{order.amount}</p>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
          {order.status}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-2">
        Advance: ₹{order.advance}
      </p>

      <div className="text-sm space-y-1 text-slate-700">
        <p><b>Pickup:</b> {order.pickup_location}</p>
        <p><b>Delivery:</b> {order.delivery_location}</p>
        <p><b>Material:</b> {order.material_type}</p>
        <p><b>Weight:</b> {order.weight}</p>
        <p><b>Vehicle No:</b> {order.vehicle_type || '—'}</p>
        <p><b>vehicle type:</b> {order.truck_type || '—'}</p>
        <p><b>Wheel:</b> {order.wheel_type || '—'}</p>
        <p><b>Ft:</b> {order.ft || '—'}</p>
        <p><b>Call:</b> {order.contact_number}</p>
      </div>

      
    </div>
  ))}
</div>

            </div>
          )}
        </div>
      </div>

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Update Location</h3>
            <div className="mb-4">
              <label htmlFor="location" className="text-sm text-slate-600">Enter New Location</label>
              <input type="text" id="location" value={newLocation || profile?.vehicle_location || ''} onChange={(e) => setNewLocation(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" placeholder="New location" />
            </div>
            <div className="flex justify-between gap-4">
              <button onClick={() => setShowLocationModal(false)} className="w-1/2 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleLocationSubmit} className="w-1/2 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Create New Order</h3>
              <button onClick={() => setShowCreateOrderModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {createOrderSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Order Created Successfully!</h4>
                <p className="text-slate-600">The order has been created.</p>
                <p className="text-sm text-slate-500 mt-2">Closing in a moment...</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location *</label>
<input
  ref={pickupRef}
  type="text"
  value={orderForm.pickup_location}
  onChange={(e) => handleOrderFormChange('pickup_location', e.target.value)}
  className="w-full p-3 border border-slate-300 rounded-lg"
  placeholder="Search pickup city (eg: Salem)"
  required
/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Location *</label>
<input
  ref={deliveryRef}
  type="text"
  value={orderForm.delivery_location}
  onChange={(e) => handleOrderFormChange('delivery_location', e.target.value)}
  className="w-full p-3 border border-slate-300 rounded-lg"
  placeholder="Search delivery city (eg: Chennai)"
  required
/>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name</label>
                    <select value={orderForm.vehicle_type} onChange={(e) => handleOrderFormChange('vehicle_type', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg">
                      <option value="">Select Vehicle Name</option>
                      <option value="Truck">Truck</option>
                      <option value="Tempo">Tempo</option>
                      <option value="Mini-truck">Mini-truck</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Weight *</label>
                    <input type="text" value={orderForm.weight} onChange={(e) => handleOrderFormChange('weight', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg" placeholder="Enter weight" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Wheel Type</label>
                    <select value={orderForm.wheel_type} onChange={(e) => handleOrderFormChange('wheel_type', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg">
                      <option value="">Select wheel type</option>
                      <option value="4-wheel">4-wheel</option>
                      <option value="6-wheel">6-wheel</option>
                      <option value="10-wheel">10-wheel</option>
                      <option value="12-wheel">12-wheel</option>
                      <option value="14-wheel">14-wheel</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                    <select value={orderForm.truck_type} onChange={(e) => handleOrderFormChange('truck_type', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg">
                      <option value="">Select Vehicle type</option>
                      <option value="Open">Open</option>
                      <option value="Container">Container</option>
                     
                    </select>
                  </div>
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Vehicle Feet
  </label>
  <input
    type="text"
    value={orderForm.ft}
    onChange={(e) =>
      handleOrderFormChange('ft', e.target.value)
    }
    className="w-full p-3 border border-slate-300 rounded-lg"
    placeholder="Eg: 14 ft / 17 ft"
  />
</div>



                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Material Type</label>
                    <select value={orderForm.material_type} onChange={(e) => handleOrderFormChange('material_type', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg">
                      <option value="">Select material type</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Construction Materials">Construction Materials</option>
                      <option value="Food Items">Food Items</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Machinery">Machinery</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹) *</label>
                    <input type="number" value={orderForm.amount} onChange={(e) => handleOrderFormChange('amount', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg" placeholder="Enter total amount" min="0" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Advance Amount (₹) *</label>
                    <input type="number" value={orderForm.advance} onChange={(e) => handleOrderFormChange('advance', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg" placeholder="Enter advance amount" min="0"  />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                  <input type="tel" value={orderForm.contact_number} onChange={(e) => handleOrderFormChange('contact_number', e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg" placeholder="Enter 10-digit contact number" maxLength={10} pattern="[0-9]{10}" required />
                  <p className="text-xs text-slate-500 mt-1">Customer or pickup point contact number</p>
                </div>

                <div className="flex justify-between gap-4 pt-4 border-t border-slate-200">
                  <button onClick={() => setShowCreateOrderModal(false)} className="w-1/2 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200" disabled={creatingOrder}>Cancel</button>
                  <button onClick={handleCreateOrderSubmit} disabled={creatingOrder} className="w-1/2 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {creatingOrder ? <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Creating...</span> : 'Create Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Referral Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Share Referral Code</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Your Referral Code:</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{profile?.referral_code ?? '—'}</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">Share this code with other agents. You&apos;ll earn in your reward wallet for every successful registration.</p>
            <button onClick={() => setShowShareModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
