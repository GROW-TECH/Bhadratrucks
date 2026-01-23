// src/pages/UserDashboard.tsx
import OrderShareCard from "../components/OrderShareCard";
import { useEffect, useState, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  Package,
  LogOut,
  Share2,
  FileText,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';
import logo from '../assets/newlogo.jpeg';

interface UserDashboardProps {
  user: any;
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
  wheel_type?: string | null;
  amount: number;
  payment_status?: string | null;
  advance: number;
  status: string;
  created_at?: string;
  contact_number?: string;
  assigned_to?: string | number | null;
  driver_id?: string | number | null;
  user_id?: string | number | null;
}

export default function UserDashboard({
  user,
  onLogout,
  onNavigateToOrders,
  onNavigateToWallet,
}: UserDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [profile, setProfile] = useState<any>(user ?? null);
  const userId = user?.id ?? profile?.id;

  // NEW: order modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
const [newLocation, setNewLocation] = useState('');
const locationRef = useRef<HTMLInputElement | null>(null);

  const paymentNumber = '8428045020';

  const parseResponse = async (resp: Response) => {
    const text = await resp.text().catch(() => '');
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('parseResponse JSON parse failed, raw text:', text);
      return null;
    }
  };
// FETCH CUSTOMER NUMBER (NO USER ID)
useEffect(() => {
  const fetchCustomerNumber = async () => {
    try {
      const res = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/customer_number.php'
      );

      const json = await res.json();

      if (json.success && json.data?.customernumber) {
        setProfile((prev: any) => ({
          ...(prev || {}),
          customernumber: json.data.customernumber,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch customer number', err);
    }
  };

  fetchCustomerNumber();
}, []);


  const handleLocationSubmit = async () => {
    if (!newLocation.trim()) {
      alert('Location cannot be empty');
      return;
    }

    try {
      const response = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/users.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
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
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files ? event.target.files[0] : null;
  if (file) {
    setSelectedFile(file);  // Ensure the selected file is set properly
    console.log("Selected file:", file);  // Optionally log the file for debugging
  }
};

const uploadFile = async () => {
  if (!selectedFile) {
    alert("Please select a file before uploading.");
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('user_id', userId);  // Ensure the user_id is included

  try {
    const response = await fetch('https://projects.growtechnologies.in/bhadra/api/upload.php', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      alert('Screenshot uploaded successfully');
    } else {
      alert(data.error || 'File upload failed');
    }
  } catch (error) {
    console.error('Error during file upload:', error);
    alert('File upload failed');
  }
};



useEffect(() => {
  if (!showLocationModal) return;
  if (!window.google || !locationRef.current) return;

  const autocomplete = new window.google.maps.places.Autocomplete(
    locationRef.current,
    {
      types: ['(cities)'],
      componentRestrictions: { country: 'in' },
    }
  );

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    setNewLocation(place.formatted_address || place.name || '');
  });
}, [showLocationModal]);

  // fetch full user (has referral_code, vehicle_number etc.)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(
          'https://projects.growtechnologies.in/bhadra/api/users.php'
        );
        const json = await parseResponse(resp);
        const arr =
          Array.isArray(json)
            ? json
            : Array.isArray(json?.users)
            ? json.users
            : Array.isArray(json?.data)
            ? json.data
            : [];

        const uid = String(userId).trim();
        const full =
          arr.find((u: any) => String(u.id).trim() === uid) ?? null;

        if (!cancelled) {
          if (full) {
            setProfile((prev: any) => ({
              ...(prev || {}),
              ...(user || {}),
              ...full,
            }));
          } else {
            setProfile((prev: any) => ({
              ...(prev || {}),
              ...(user || {}),
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch full profile:', err);
        if (!cancelled) {
          setProfile((prev: any) => ({
            ...(prev || {}),
            ...(user || {}),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, user]);

  // keep in sync with parent
  useEffect(() => {
    if (user) {
      setProfile((prev: any) => ({ ...(prev || {}), ...user }));
    }
  }, [user]);

  // WALLET SUMMARY
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/wallet_history.php?user_id=${encodeURIComponent(
            String(userId)
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
  }, [userId]);

  // Fetch ALL orders (no filtering by assigned_to)
  useEffect(() => {
    fetchOrders();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


const fetchOrders = async () => {
  setLoading(true);
  try {
    const resp = await fetch(`https://projects.growtechnologies.in/bhadra/api/orders.php?timestamp=${new Date().getTime()}`);
    const text = await resp.text().catch(() => '');
    console.log('Response Text:', text);  // Log the full response for debugging

    if (!resp.ok || !text) {
      setOrders([]);
      return;
    }

    // Check if the response contains an error message, and remove it if necessary
    if (text.includes('error')) {
      console.error('Error in API response:', text);
      setOrders([]);
      return;
    }

    let data: any = [];
    try {
      // Try to parse the response as JSON
      data = JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse orders data:', error, 'Response text:', text);
      data = [];
    }

    // Log the parsed data
    console.log("Parsed Data:", data);

    // If data is wrapped in an 'orders' property, use it, otherwise use the raw data
    const arr = Array.isArray(data.orders) ? data.orders : data;
    console.log('API Response:', arr);
    console.log('Total orders from API:', arr.length);

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
const handleShareOrderLink = (order: Order) => {
  const orderLink =
    `https://projects.growtechnologies.in/bhadra/common_order_confirm.php?order_id=${order.id}`;

  const message = `
🚚 Bhadra Truck Order

Pickup: ${order.pickup_location}
Delivery: ${order.delivery_location}
Material: ${order.material_type}
Weight: ${order.weight}
Amount: ₹${order.amount}

Confirm Order:
${orderLink}
`;

  if (navigator.share) {
    navigator.share({
      title: 'Bhadra Truck Order Confirmation',
      text: message,
      url: orderLink,
    });
  } else {
    navigator.clipboard.writeText(orderLink);
    alert('Order confirmation link copied');
  }
};


  const vehicleNumber = profile?.vehicle_number ?? '';
const wheel_type = profile?.wheel_type ?? '';
  // NEW: row click only for pending
  const handleRowClick = (order: Order) => {
    if (order.status !== 'pending') return;
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
const handleRefreshPage = () => {
  window.location.reload();
};

  // NEW: confirm order (POST action: confirm)
  

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
          {/* Back Button with Icon */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-sm font-medium text-slate-600 rounded-md hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" /> {/* Left arrow icon */}
          
          </button>
          <h1 className="text-xl font-bold text-slate-900">Bhadra truck</h1>
          <p className="text-sm text-slate-500">Driver Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleRefreshPage}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm"
        >
          Refresh
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
        {/* TOP CARD */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <h2 className="text-2xl font-bold">
                {profile?.full_name ?? 'Driver'}
              </h2>
              <p className="text-sm text-blue-100 mt-2">
                Vehicle No:{' '}
                <span className="font-semibold text-white">
                  {vehicleNumber || '—'}
                </span>
              </p>
              <p className="text-sm text-blue-100 mt-2">
                 Wheel Type:{' '}
                <span className="font-semibold text-white">
                  {wheel_type || '—'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Referral ID</p>
              <p className="text-xl font-mono font-bold">
                {profile?.referral_code ?? '—'}
              </p>
            </div>
            
          </div>
          

           <div

>
  <p className="text-blue-100 text-sm">Customer Care no:</p>
  <p className="text-xl font-mono font-bold mt-2">
    {profile?.customernumber ?? "—"}
  </p>
</div>

          <div className="flex justify-end">
            
  <button
    onClick={() => setShowLocationModal(true)}
    className="inline-flex px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
  >
    Update Location
  </button>
</div>

        </div>

  
        {/* WALLET CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
        
          {/* Reward Wallet */}
         <button
  onClick={() => {
    if (profile?.membership_type === 'elite' && profile?.admin_approval === 0) {
      alert('Wallet will be available after admin approval');
      return;
    }
    onNavigateToWallet?.();
  }}
  className="bg-white rounded-xl p-6 ..."
>
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
      <Wallet className="w-6 h-6 text-green-600" />
    </div>
    <TrendingUp className="w-5 h-5 text-green-500" />
  </div>
  <p className="text-sm text-slate-600 mb-1">Reward Wallet</p>
  <p className="text-3xl font-bold text-slate-900">
    ₹{profile?.reward_wallet ?? 0}
  </p>

  {profile?.membership_type === 'elite' && profile?.admin_approval === 0 && (
    <button
      type="button"
      className="inline-flex items-center justify-center px-6 py-3 mt-4 rounded-lg text-lg font-bold text-white w-full sm:w-auto animate-green-orange"
    >
      Activate Elite Premium Rs.1200/-
    </button>
  )}

  <p className="text-xs text-slate-500 mt-2 font-semibold">
    {profile?.wheel_type === '4-wheel'
      ? 'Elite Member (4-wheel)'
      : 'Premium Member (6–14 wheel)'}
  </p>

  <p className="text-[11px] text-slate-500 mt-1">
    Referral Reward: ₹
    {profile?.membership_type === 'elite' ? '500 per direct' : '10 per direct'}
  </p>
  <p className="text-[11px] text-slate-500 mt-1">
    Minimum Reward Withdrawal: ₹
    {profile?.membership_type === 'elite' ? '500' : '1500'}
  </p>
</button>


          {/* Diesel Wallet */}
          <button
            onClick={onNavigateToWallet}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Diesel Wallet</p>
            <p className="text-3xl font-bold text-slate-900">
              ₹{profile?.diesel_wallet ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Opening joining amount: ₹1000
            </p>
            <p className="text-[11px] text-slate-500">
              Minimum diesel withdrawal: ₹3000
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Every booking order closing with referral code submitted:
              <br />
              <span className="font-semibold">₹100 added to diesel wallet</span>
            </p>
          </button>

          {/* Orders card */}
          <button
            onClick={onNavigateToOrders}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-500 mt-2">All orders</p>
          </button>
        </div>

       {/* PAYMENT SECTION */}
<div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-8">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
        <Smartphone className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Payment Details</h3>
        <p className="text-sm text-slate-600">Use this number for PhonePe &amp; Google Pay payments.</p>
      </div>
            </div>
            {/* <button
  type="button"
  className="inline-flex items-center justify-center px-6 py-3 mt-4
             rounded-lg text-lg font-bold text-white
             w-full sm:w-auto animate-green-orange"
>
  Activate Elite Premium Rs.4999/-
</button> */}

  </div>

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-4">
    <div>
      <p className="text-xs text-slate-500 uppercase mb-1">Vehicle Location</p>
      <p className="text-lg font-semibold text-slate-700">{profile?.vehicle_location || '—'}</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-slate-500 uppercase mb-1">PhonePe / Google Pay Number</p>
      <p className="text-xl font-mono font-bold text-slate-900">{paymentNumber}</p>
      <button
        type="button"
        onClick={copyPaymentNumber}
        className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        Copy Number
      </button>
    </div>
  </div>

  {/* File Upload Section */}
  <div className="bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-200 mt-6">
    <h4 className="text-lg font-semibold text-slate-900 mb-4">Upload Your Payment Screenshot</h4>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div className="w-full sm:w-3/4">
        <label className="text-xs text-slate-500 uppercase mb-1 block" htmlFor="file-upload">
          Choose File
        </label>
        <input
          type="file"
          id="file-upload"
          accept="*/*"
          onChange={handleFileUpload} // Trigger the file selection handler
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>

    <button
      type="button"
      onClick={uploadFile} // Trigger the file upload handler
      className="inline-flex items-center justify-center px-6 py-3 mt-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
    >
      Buy now
            </button>
            
          </div>
        



         
</div>



        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Update Location
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="location"
                  className="text-sm text-slate-600"
                >
                  Enter New Location
                </label>
                <input
  ref={locationRef}
  type="text"
  id="location"
  value={newLocation}
  onChange={(e) => setNewLocation(e.target.value)}
  className="w-full p-2 border border-slate-300 rounded-md"
  placeholder="Search city (eg: Salem)"
/>

              </div>
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-1/2 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLocationSubmit}
                  className="w-1/2 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SHARE & EARN SECTION */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Share & Earn</h3>
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>

          <p className="text-sm text-slate-600 mb-3">
            {profile?.membership_type === 'elite' ? (
              <>
                You are an <span className="font-semibold">Elite Member (4-wheel)</span>.  
                Your referral reward is <span className="font-semibold">₹500 per direct</span>  
                with <span className="font-semibold">instant reward withdrawal</span>.
              </>
            ) : (
              <>
                You are a <span className="font-semibold">Premium Member (6–14 wheel)</span>.  
                Your referral reward is <span className="font-semibold">₹10 per direct</span>.
              </>
            )}
          </p>

          <p className="text-sm text-slate-600 mb-4">
            On every completed booking where your referral code is used,  
            <span className="font-semibold">₹100</span> will be added to your diesel wallet.
          </p>

          <div className="flex gap-3">
            <button
              onClick={copyReferralCode}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Copy Referral Code
            </button>
            <button
              onClick={shareReferralCode}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Share Link
            </button>
          </div>
        </div>
<div className="flex items-center justify-between mb-4 px-6">
  <h3 className="text-lg font-semibold text-slate-900">
    Available Orders
  </h3>
  <p className="text-sm text-slate-500">
    Tap pending order to confirm
  </p>
</div>

        {/* ORDERS TABLE */}
     <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {orders.map((order) => (
  <OrderShareCard
    key={`order-${order.id}`}   // ✅ FORCE UNIQUE STRING KEY
    order={order}
    vehicleNumber={vehicleNumber}
    onClick={() => handleRowClick(order)}
  />
))}



</div>


      </div>

      {/* ORDER DETAIL MODAL for pending orders */}
      

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Share Referral Code
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Your Referral Code:</p>
              <p className="text-2xl font-mono font-bold text-blue-600">
                {profile?.referral_code ?? '—'}
              </p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Share this code with your friends. According to your plan, you&apos;ll
              earn in your reward wallet and also get diesel wallet benefits on
              completed bookings.
            </p>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
