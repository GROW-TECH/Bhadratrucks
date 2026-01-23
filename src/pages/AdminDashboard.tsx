// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { Package, LogOut, Plus } from 'lucide-react';
import logo from '../assets/newlogo.jpeg';

interface AdminDashboardProps {
  _admin?: any;
  onLogout: () => void;
  onNavigateToCreateOrder?: () => void;
  onNavigateToOrderManagement?: () => void;
  onNavigateToCommonOrderCreate?: () => void;
  onNavigateToAddCallNumber?: () => void;
  onNavigateToAddCustomerNumber?: () => void;
  onNavigateToPaymentScreenshotPage?: () => void; // Add this line
}



type UserId = string | number;

interface User {
  id: UserId;
  full_name: string;
  email?: string;
  mobile_number: string;
  district?: string;
  vehicle_type?: string;
  vehicle_feet?: string;
  vehicle_body?: string;
  wheel_type?: string;
  referral_code?: string;
  approval_status: string; // 'pending' | 'approved' (lowercase)
  reward_wallet?: number;
  diesel_wallet?: number;
  created_at?: string;
  referred_by?: string | null;
  vehicle_location?: string;  
  document?: string; // Ensure `document` is typed
}

interface Order {
  id: number | string;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  ft: string;
  vehicle_body: string;
  wheel_type: string | null;
  amount: number;
  advance: number;
  contact_number: string;
  assigned_to: string | null;
  status: string;
  created_at?: string;
}

export default function AdminDashboard({
  onLogout,
  onNavigateToCreateOrder,
  onNavigateToOrderManagement,
  onNavigateToCommonOrderCreate,
  onNavigateToAddCallNumber,
  onNavigateToAddCustomerNumber,
   onNavigateToPaymentScreenshotPage,// ✅ ADD THIS
}: AdminDashboardProps)

 {
const [activeTab, setActiveTab] = useState<
  'users' | 'pending' | 'orders' | 'agents' | 'withdraws' | 'wallet' | 'agent-withdraw' // ADD THIS
>('pending');

  const [userDocuments, setUserDocuments] = useState<User[]>([]); // Store user documents
  const [menuOpen, setMenuOpen] = useState(false);
  const ITEMS_PER_PAGE = 5;
const [currentPage, setCurrentPage] = useState(1);
const [orderSearch, setOrderSearch] = useState('');
const [paymentFiles, setPaymentFiles] = useState<any[]>([]);
const [selectedWheelType, setSelectedWheelType] = useState<string | null>(null);
const [agents, setAgents] = useState<any[]>([]); // State to store agents' data
const [agentWithdrawRequests, setAgentWithdrawRequests] = useState<any[]>([]);
const [agentWithdrawLoading, setAgentWithdrawLoading] = useState(false);
  // now we keep them SEPARATE
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const totalUsers = allUsers.length;
  


  const [orders, setOrders] = useState<Order[]>([]);
const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
const [walletUsers, setWalletUsers] = useState<any[]>([]);
const paidWalletUsers = walletUsers.filter(
  (u) => !!u.payment_screenshot
);
const handleWheelTypeClick = (wheelType: string) => {
  setSelectedWheelType(wheelType);
};
const renderUsersForWheelType = (wheelType: string) => {
  // Filter unique users by wheel type
  const filteredUsers = Array.from(
    new Set(allUsers.filter(user => user.wheel_type === wheelType).map(user => user.id))
  ).map(id => allUsers.find(user => user.id === id));  // Retrieve unique users by their id

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full table-auto border-collapse">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Mobile</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Vehicle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
  {filteredUsers.map((user) => (
    <tr key={user?.id}> {/* Use optional chaining to avoid undefined error */}
      <td className="px-4 py-4 text-sm text-slate-900">{user?.full_name || '—'}</td> {/* Safe access */}
      <td className="px-4 py-4 text-sm text-slate-600">{user?.mobile_number || '—'}</td> {/* Safe access */}
      <td className="px-4 py-4 text-sm text-slate-600">{user?.vehicle_type || '—'}</td> {/* Safe access */}
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
};


  const [orderForm, setOrderForm] = useState({
    pickup_location: '',
    delivery_location: '',
    weight: '',
    material_type: '',
    vehicle_type: '',
    ft: '',
    vehicle_body: '',
    wheel_type: '',
    amount: '',
    advance: '',
    contact_number: '',
    assigned_to: '',
  });
const [searchResults, setSearchResults] = useState<User[]>([]); // Store filtered results
const [locationSearch, setLocationSearch] = useState<string>(''); // For search input
const [userSearch, setUserSearch] = useState('');
const AGENTS_URL = 'https://projects.growtechnologies.in/bhadra/api/agents.php';

  // API endpoints
  const USERS_URL = 'https://projects.growtechnologies.in/bhadra/api/users.php'; // APPROVED
  const PENDING_USERS_URL =
    'https://projects.growtechnologies.in/bhadra/api/pendingusers.php'; // PENDING
  const ORDERS_URL = 'https://projects.growtechnologies.in/bhadra/api/orders.php';

  const WITHDRAW_REQUESTS_URL =
  'https://projects.growtechnologies.in/bhadra/api/withdraw_requests.php';

const APPROVE_WITHDRAW_URL =
  'https://projects.growtechnologies.in/bhadra/api/approve_withdraw.php';

  const APPROVE_USER_URL =
    'https://projects.growtechnologies.in/bhadra/api/approve_user.php';
  const DELETE_USER_URL =
    'https://projects.growtechnologies.in/bhadra/api/delete_user.php';
// TO:
  const AGENT_WITHDRAW_REQUESTS_URL = 'https://projects.growtechnologies.in/bhadra/api/agent_wallet_withdraw_request.php';
  const APPROVE_AGENT_WITHDRAW_URL = 'https://projects.growtechnologies.in/bhadra/api/agent_wallet_approve.php';
const SEARCH_USERS_URL = 'https://projects.growtechnologies.in/bhadra/api/search_users.php'; // New endpoint for search

 const fetchAgentWithdrawRequests = async () => {
  setAgentWithdrawLoading(true);
  try {
    // Use the new endpoint specifically for agent withdrawal requests
    const resp = await fetch(AGENT_WITHDRAW_REQUESTS_URL, {
      method: 'GET',
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('API Response:', errorText);
      throw new Error(`Failed to fetch agent withdrawals: ${resp.status} ${resp.statusText}`);
    }

    const json = await resp.json();
    console.log('Agent withdrawals API response:', json); // For debugging
    
    // Adjust based on the new API response structure
    if (json.success) {
      setAgentWithdrawRequests(json.data || []);
    } else {
      console.warn('Unexpected response format:', json);
      setAgentWithdrawRequests([]);
    }
  } catch (error) {
    console.error('Error fetching agent withdraw requests:', error);
    setAgentWithdrawRequests([]);
  } finally {
    setAgentWithdrawLoading(false);
  }
};


  
 const handleApproveAgentWithdraw = async (transactionId: number | string) => {
  if (!confirm('Approve this agent withdrawal request?')) return;

  try {
    const resp = await fetch(APPROVE_AGENT_WITHDRAW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transaction_id: transactionId
        // Remove 'action' and 'admin_note' as they're not used in the new API
      })
    });
    
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || 'Failed to approve');
    
    // Show more detailed success message
    alert(`✅ Agent withdrawal approved!
Amount: ₹${json.amount}
Wallet: ${json.wallet}
Agent ID: ${json.agent_id}
Transaction ID: ${json.transaction_id}`);
    
    fetchAgentWithdrawRequests();  // Re-fetch requests to update the UI
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    alert('Failed to approve withdrawal: ' + error);
  }
};



  //location search
const handleSearchLocation = async () => {
  if (!locationSearch) {
    setSearchResults([]);  // Clear search results if search query is empty
    return;
  }

  // Clear previous search results before starting a new search
  setSearchResults([]);
  
  try {
    const resp = await fetch(`${SEARCH_USERS_URL}?location=${locationSearch}`);
    const data = await resp.json();
    
    if (data && data.length > 0) {
      setSearchResults(data);  // Update the search results with new data
    } else {
      setSearchResults([]);  // No matching results, keep search results empty
    }
  } catch (error) {
    console.error('Search failed:', error);
    setSearchResults([]);  // In case of an error, clear the search results
  }
};
const handleApproveWallet = async (userId: number | string) => {
  if (!confirm('Approve 1200 reward wallet?')) return;

  try {
    const resp = await fetch(
      'https://projects.growtechnologies.in/bhadra/api/approve_wallet.php',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    const json = await resp.json();
    if (!json.success) throw new Error(json.error);

    alert('Wallet approved');
    fetchData();
  } catch (err) {
    alert('Wallet approval failed');
  }
};

const filteredUsers = allUsers.filter((u) => {
  if (!userSearch.trim()) return true;

  const q = userSearch.toLowerCase();

  return (
    u.full_name?.toLowerCase().includes(q) ||
    u.mobile_number?.toLowerCase().includes(q) ||
    u.district?.toLowerCase().includes(q) ||
    u.vehicle_type?.toLowerCase().includes(q) ||
    u.vehicle_feet?.toLowerCase().includes(q) ||
    u.vehicle_body?.toLowerCase().includes(q) ||
    u.wheel_type?.toLowerCase().includes(q) ||
    u.referral_code?.toLowerCase().includes(q)
  );
});
useEffect(() => {
  setCurrentPage(1);
}, [orderSearch]);
useEffect(() => {
  if (activeTab === 'agents') {
    fetchAgentsData();
  } else if (activeTab === 'agent-withdraw') { // ADD THIS
    fetchAgentWithdrawRequests();
  }
}, [activeTab]);
useEffect(() => {
  setCurrentPage(1);
}, [activeTab]);
const paginate = <T,>(data: T[]) => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return data.slice(start, start + ITEMS_PER_PAGE);
};

const totalPages = (dataLength: number) =>
  Math.ceil(dataLength / ITEMS_PER_PAGE);

// Add this effect to reset search results when `locationSearch` changes:
useEffect(() => {
  if (!locationSearch) {
    setSearchResults([]);  // Clear search results if the search query is cleared
  }
  
}, [locationSearch]);
useEffect(() => {
  console.log(userDocuments); // Check if the documents are populated correctly
  
}, [userDocuments]);


  

  const mapUser = (u: any, defaultStatus: 'pending' | 'approved'): User => ({
  id: u.id,
  full_name: u.full_name ?? '',
  email: u.email ?? '',
  mobile_number: u.mobile_number ?? '',
  district: u.district ?? '',
  vehicle_type: u.vehicle_type ?? '',
  vehicle_feet: u.vehicle_feet ?? '',
  vehicle_body: u.vehicle_body ?? '',
  wheel_type: u.wheel_type ?? '',
  referral_code: u.referral_code ?? '',
  approval_status: (u.approval_status || defaultStatus).toLowerCase(),
  reward_wallet: u.reward_wallet ? Number(u.reward_wallet) : 0,
  diesel_wallet: u.diesel_wallet ? Number(u.diesel_wallet) : 0,
  created_at: u.created_at,
  referred_by: u.referred_by ?? null,
  document: u.document || '',  // Make sure this is populated
});


  const mapOrder = (o: any): Order => ({
    id: o.id,
    pickup_location: o.pickup_location ?? '',
    delivery_location: o.delivery_location ?? '',
    weight: o.weight ?? '',
    material_type: o.material_type ?? '',
    vehicle_type: o.vehicle_type ?? '',
    ft: o.ft ?? '',
    vehicle_body: o.vehicle_body ?? '',
    wheel_type: o.wheel_type ?? null,
    amount: Number(o.amount ?? 0),
    advance: Number(o.advance ?? 0),
    contact_number: o.contact_number ?? '',
    assigned_to:
      o.assigned_to !== null && o.assigned_to !== undefined
        ? String(o.assigned_to)
        : null,
    status: o.status ?? 'pending',
    created_at: o.created_at,
  });
useEffect(() => {
  if (activeTab === 'agents') {
    fetchAgentsData();  // Fetch agent details when the 'agents' tab is active
  }
}, [activeTab]);

const fetchAgentsData = async () => {
  try {
    const resp = await fetch(AGENTS_URL);
    const data = await resp.json();
    if (data.success) {
      setAgents(data.agents);  // Update state with agent data
    } else {
      alert('Failed to fetch agent data');
    }
  } catch (error) {
    console.error('Error fetching agent data:', error);
  }
};

  useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
const documentUsers = userDocuments
  .filter(user => user.document) // keep only users with documents
  .filter(
    (user, index, self) =>
      index === self.findIndex(u => u.id === user.id) // remove duplicates
  );

const fetchData = async () => {
  setLoading(true);
  try {
    const ts = Date.now();

const [
  approvedResp,
  pendingResp,
  ordersResp,
  withdrawResp,
  walletResp,
  filesResp
] = await Promise.all([
  fetch(`${USERS_URL}?_=${ts}`),
  fetch(`${PENDING_USERS_URL}?_=${ts}`),
  fetch(`${ORDERS_URL}?_=${ts}`),
  fetch(`${WITHDRAW_REQUESTS_URL}?_=${ts}`),
  fetch('https://projects.growtechnologies.in/bhadra/api/wallet_pending_users.php'),
  fetch('https://projects.growtechnologies.in/bhadra/api/fetchFiles.php'),
]);


const filesJson = await filesResp.json().catch(() => ({ files: [] }));
setPaymentFiles(Array.isArray(filesJson.files) ? filesJson.files : []);


    if (!approvedResp.ok) console.warn('approved users fetch status', approvedResp.status);
    if (!pendingResp.ok) console.warn('pending users fetch status', pendingResp.status);
    if (!ordersResp.ok) console.warn('orders fetch status', ordersResp.status);

    const approvedJson = await approvedResp.json().catch(() => []);
    const pendingJson = await pendingResp.json().catch(() => []);
    const ordersJson = await ordersResp.json().catch(() => []);
const withdrawJson = await withdrawResp.json().catch(() => []);
const walletJson = await walletResp.json().catch(() => []);
const walletArr = Array.isArray(walletJson) ? walletJson : [];

const eliteFiles = (filesJson.files || []).filter(
  (f: any) => f.membership_type === 'elite'
);

const mergedWalletUsers = walletArr.map((u: any) => {
  const file = eliteFiles.find(
    (f: any) => String(f.user_id) === String(u.id)
  );

  return {
    ...u,
    payment_screenshot: file ? file.file_name : null,
    file_approved: file ? Number(file.approval_status) : 0,
  };
});

setWalletUsers(mergedWalletUsers);

    const rawApproved: any[] = Array.isArray(approvedJson)
      ? approvedJson
      : Array.isArray((approvedJson as any).users)
      ? (approvedJson as any).users
      : Array.isArray((approvedJson as any).data)
      ? (approvedJson as any).data
      : [];

    const rawPending: any[] = Array.isArray(pendingJson)
      ? pendingJson
      : Array.isArray((pendingJson as any).users)
      ? (pendingJson as any).users
      : Array.isArray((pendingJson as any).data)
      ? (pendingJson as any).data
      : [];

    const rawOrders: any[] = Array.isArray(ordersJson)
      ? ordersJson
      : Array.isArray((ordersJson as any).orders)
      ? (ordersJson as any).orders
      : Array.isArray((ordersJson as any).data)
      ? (ordersJson as any).data
      : [];
const rawWithdraws: any[] = Array.isArray(withdrawJson.data)
  ? withdrawJson.data
  : [];

    // Fetch documents for users
    const fetchDocuments = async (userId: number) => {
      try {
        const docResp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/getUserDocuments.php?user_id=${userId}`
        );
        const docData = await docResp.json();
        if (docData.success) {
          return docData.user.document;
        } else {
          return ''; // No document
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        return ''; // No document in case of error
      }
    };

    // Get documents for each user and update the users with their document
    const getUserWithDocuments = async (users: any[]) => {
      const updatedUsers = await Promise.all(
        users.map(async (user) => {
          const document = await fetchDocuments(user.id);
          return {
            ...user,
            document,
          };
        })
      );
      return updatedUsers;
    };

   const approvedArr = await getUserWithDocuments(rawApproved);
const pendingArr = await getUserWithDocuments(rawPending);

const mergedUsers = [...approvedArr, ...pendingArr];
setAllUsers(mergedUsers);

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours
const now = Date.now();

const ordersArr = rawOrders
  .map(mapOrder)
  .filter((o) => {
    if (!o.created_at) return true;
    const createdTime = new Date(o.created_at).getTime();
    return now - createdTime <= TWENTY_FOUR_HOURS;
  });

    setApprovedUsers(approvedArr);
    setPendingUsers(pendingArr);
    setOrders(ordersArr);
setWithdrawRequests(rawWithdraws);

    const allUsersWithDocuments = [...approvedArr, ...pendingArr];
    setUserDocuments(allUsersWithDocuments); // Update state with user documents

    setLastSynced(new Date().toLocaleString());
  } catch (err) {
    console.error('fetchData error', err);
    setApprovedUsers([]);
    setPendingUsers([]);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};




  
const filteredOrders = orders.filter((o) => {
  if (!orderSearch.trim()) return true;

  const q = orderSearch.toLowerCase();

  return (
    o.pickup_location?.toLowerCase().includes(q) ||
    o.delivery_location?.toLowerCase().includes(q) ||
    o.material_type?.toLowerCase().includes(q) ||
    o.vehicle_type?.toLowerCase().includes(q) ||
String(o.ft ?? '').toLowerCase().includes(q) ||
    o.vehicle_body?.toLowerCase().includes(q) ||
    o.status?.toLowerCase().includes(q) ||
    String(o.amount).includes(q)
  );
});
const paginatedOrders =
  filteredOrders.length > 0 ? paginate(filteredOrders) : [];

  // for stats “4 wheel / 6 wheel / 10-14 wheel” – only approved users
  const filterUsersByWheelType = (wheelType: string) =>
    approvedUsers.filter((u) => (u.wheel_type || '') === wheelType);
const handleRejectWallet = async (userId: number | string) => {
  if (!confirm('Are you sure you want to reject this user and delete them?')) return;

  try {
    const resp = await fetch('https://projects.growtechnologies.in/bhadra/api/delete_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const json = await resp.json();
    if (!json.success) throw new Error(json.error);

    alert('User rejected and deleted');
    fetchData(); // Refresh data
  } catch (err) {
    console.error('Reject wallet failed', err);
    alert('Failed to reject and delete user');
  }
};

  // ✅ APPROVE: move from PENDING → APPROVED in UI + hit API
  const handleApproveUser = async (userId: UserId) => {
    if (!confirm('Approve this user?')) return;

    const backupPending = [...pendingUsers];
    const backupApproved = [...approvedUsers];

    const userToMove = pendingUsers.find((u) => String(u.id) === String(userId));
    if (!userToMove) return;

    // optimistic UI
    setPendingUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
    setApprovedUsers((prev) => [
      ...prev,
      { ...userToMove, approval_status: 'approved' },
    ]);

    try {
      const resp = await fetch(APPROVE_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `Server ${resp.status}`);
      }

      setLastSynced(new Date().toLocaleString());
      alert('User approved');
      // optional: re-sync to be 100% sure DB + UI same
      // await fetchData();
    } catch (err) {
      console.error('approve error', err);
      // rollback
      setPendingUsers(backupPending);
      setApprovedUsers(backupApproved);
      alert('Failed to approve user');
    }
  };

const handleApproveWithdraw = async (txId: number | string) => {
  if (!confirm('Approve this withdraw request?')) return;

  const backup = [...withdrawRequests];
  setWithdrawRequests(prev => prev.filter(w => w.id !== txId));

  try {
    const resp = await fetch(APPROVE_WITHDRAW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: txId })
    });

    const json = await resp.json().catch(() => null);

    if (!resp.ok || json?.success === false) {
      throw new Error(json?.error || 'Server error');
    }

    alert("Withdraw approved");
  } catch (err) {
    console.error(err);
    setWithdrawRequests(backup);
    alert("Failed to approve");
  }
};

  // ❌ REJECT: remove from pending & delete via API
  const handleRejectUser = async (userId: UserId) => {
    if (!confirm('Reject and delete this user?')) return;

    const backupPending = [...pendingUsers];

    setPendingUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));

    try {
      const resp = await fetch(DELETE_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `Server ${resp.status}`);
      }

      setLastSynced(new Date().toLocaleString());
      alert('User deleted');
    } catch (err) {
      console.error('delete error', err);
      setPendingUsers(backupPending); // rollback
      alert('Failed to delete user');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = `tmp-${Date.now()}`;
    const newOrder: Order = {
      id: tempId,
      pickup_location: orderForm.pickup_location,
      delivery_location: orderForm.delivery_location,
      weight: orderForm.weight,
      material_type: orderForm.material_type,
      vehicle_type: orderForm.vehicle_type,
      ft: orderForm.ft,
      vehicle_body: orderForm.vehicle_body,
      wheel_type: orderForm.wheel_type || null,
      amount: parseFloat(orderForm.amount) || 0,
      advance: parseFloat(orderForm.advance) || 0,
      contact_number: orderForm.contact_number,
      assigned_to: orderForm.assigned_to || null,
      status: orderForm.assigned_to ? 'assigned' : 'pending',
      created_at: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    try {
      const resp = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_location: newOrder.pickup_location,
          delivery_location: newOrder.delivery_location,
          weight: newOrder.weight,
          material_type: newOrder.material_type,
          vehicle_type: newOrder.vehicle_type,
          ft: newOrder.ft,
          vehicle_body: newOrder.vehicle_body,
          wheel_type: newOrder.wheel_type,
          amount: newOrder.amount,
          advance: newOrder.advance,
          contact_number: newOrder.contact_number,
          assigned_to: newOrder.assigned_to,
          status: newOrder.status,
        }),
      });
      if (!resp.ok) {
        const b = await resp.json().catch(() => ({}));
        throw new Error(b?.error || `Server ${resp.status}`);
      }
      setOrderForm({
        pickup_location: '',
        delivery_location: '',
        weight: '',
        material_type: '',
        vehicle_type: '',
        ft: '',
        vehicle_body: '',
        wheel_type: '',
        amount: '',
        advance: '',
        contact_number: '',
        assigned_to: '',
      });
      setShowCreateOrder(false);
      setLastSynced(new Date().toLocaleString());
      await fetchData();
      alert('Order created');
    } catch (err) {
      console.error('create order error', err);
      await fetchData();
      alert('Failed to create order');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Admin Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Overview & management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                Last synced:{' '}
                <span className="font-medium text-slate-700">
                  {lastSynced ?? '—'}
                </span>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm"
              >
                Refresh
              </button>
<button
  onClick={() => onNavigateToAddCallNumber?.()}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
>
  + Add Attachment Number
</button>
<button
  onClick={() => setMenuOpen(true)}
  className="px-3 py-2 bg-slate-100 rounded-lg"
>
  ☰
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

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-24">Loading...</div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-slate-900">{totalUsers}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-slate-900">
                  {pendingUsers.length}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Approved Users</p>
                <p className="text-3xl font-bold text-slate-900">
                  {approvedUsers.length}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
              </div>
              </div>
              
{/* <div className="flex justify-end">
  <button
    onClick={() => onNavigateToPaymentScreenshotPage?.()} // Using optional chaining
    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
  >
    View Payment Screenshot
  </button>
</div> */}



            {/* TABS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="border-b border-slate-200">
                <div className="flex space-x-8 px-6">
                  {/* <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'pending'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                  </button> */}
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'users'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Users
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
                    <button
    onClick={() => setActiveTab('agents')}
    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
      activeTab === 'agents'
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-slate-600 hover:text-slate-900'
    }`}
  >
    Agent Details
  </button>
                      {/* Add the new User Documents tab */}
     {/* <button
  onClick={() => setActiveTab('documents')}
  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
>
  User Documents ({userDocuments.filter(user => user.document).filter((value, index, self) => self.findIndex(t => t.id === value.id) === index).length})
</button> */}
<button
  onClick={() => setActiveTab('agent-withdraw')}
  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
    activeTab === 'agent-withdraw'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-slate-600 hover:text-slate-900'
  }`}
>
  Agent Withdrawals ({agentWithdrawRequests.length})
</button>
<button
  onClick={() => setActiveTab('withdraws')}
  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
    activeTab === 'withdraws'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-slate-600 hover:text-slate-900'
  }`}
>
 User Withdraw Requests ({withdrawRequests.length})
</button>
<button
  onClick={() => setActiveTab('wallet')}
  className={`py-4 px-2 border-b-2 font-medium text-sm ${
    activeTab === 'wallet'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-slate-600 hover:text-slate-900'
  }`}
>
  Wallet Approvals (Elite)
</button>
<button
  onClick={() => {
    console.log("Customer Calls button clicked");
    onNavigateToAddCustomerNumber?.();
  }}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-900 text-white rounded-lg text-sm"
  style={{ marginLeft: "auto" }}
>
  + Customer calls
</button>
                  </div>
                  
                </div>
                
{activeTab === 'users' && (
  <div className="mb-6 mt-6">
    <div className="flex justify-end">
      <input
        type="text"
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        className="px-4 py-2 border border-slate-300 rounded-lg w-80"
        placeholder="Search users (name, mobile, district, vehicle...)"
      />
    </div>
  </div>
)}


{/* Displaying search results */}
{searchResults.length > 0 ? (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Users in {locationSearch}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Mobile
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Vehicle Type
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Vehicle Location
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {searchResults.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-sm text-slate-900">{user.full_name}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.mobile_number}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_type}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
) : (
  // Display "No location found" only when searchResults is empty and locationSearch is not empty
  locationSearch && (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
      <p className="text-center text-slate-600">No location found for "{locationSearch}"</p>
    </div>
  )
)}



              <div className="p-6">
                {/* PENDING USERS TAB */}
                {/* {activeTab === 'pending' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      User Approval
                    </h3>
                    {pendingUsers.length === 0 ? (
                      <p className="text-slate-600 text-center py-12">
                        No pending users
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Name
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Email
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Mobile
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Vehicle
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Feet
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Body
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Wheel Type
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {pendingUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-sm text-slate-900">
                                  {user.full_name}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.email || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.mobile_number}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.vehicle_type || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.vehicle_feet || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.vehicle_body || '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {user.wheel_type || '—'}
                                </td>
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
                )} */}

                {/* ALL USERS TAB */}
               {activeTab === 'users' && (
  <div>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      All Members
    </h3>

   <div className="mb-6 grid md:grid-cols-3 gap-4">
  <div
    className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer"
    onClick={() => handleWheelTypeClick('4-wheel')}
  >
    <p className="text-sm font-medium text-blue-900 mb-1">4 Wheel Users</p>
    <p className="text-2xl font-bold text-blue-600">
      {filterUsersByWheelType('4-wheel').length}
    </p>
  </div>
  <div
    className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer"
    onClick={() => handleWheelTypeClick('6-wheel')}
  >
    <p className="text-sm font-medium text-green-900 mb-1">6 Wheel Users</p>
    <p className="text-2xl font-bold text-green-600">
      {filterUsersByWheelType('6-wheel').length}
    </p>
  </div>
  <div
    className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer"
    onClick={() => handleWheelTypeClick('10-wheel')}
  >
    <p className="text-sm font-medium text-orange-900 mb-1">
      10–16 Wheel Users
    </p>
    <p className="text-2xl font-bold text-orange-600">
      {filterUsersByWheelType('10-wheel').length +
        filterUsersByWheelType('12-wheel').length +
        filterUsersByWheelType('16-wheel').length}
    </p>
  </div>
</div>

{selectedWheelType && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
      <h3 className="text-2xl font-bold mb-4">{selectedWheelType} Users</h3>
      
      {/* Render Users Table */}
      {renderUsersForWheelType(selectedWheelType)}
      
      <button
        onClick={() => setSelectedWheelType(null)}
        className="px-4 py-2 bg-red-500 text-white rounded mt-4 w-full"
      >
        Close
      </button>
    </div>
  </div>
)}




    {/* Approved Users Section */}
    <h4 className="text-lg font-semibold text-slate-900 mb-4">
      Approved Users
    </h4>
    {approvedUsers.length === 0 ? (
      <p className="text-slate-600 text-center py-12">No approved users found</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Mobile
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                District
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Vehicle
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Vehicle feet
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Vehicle body
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Wheel
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Referral
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                RC / License
              </th>
              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                Joining Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {approvedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-sm text-slate-900">{user.full_name}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.mobile_number}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.district || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_type || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_feet || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.vehicle_body || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{user.wheel_type || '—'}</td>
                <td className="px-4 py-4 text-sm font-mono text-slate-600">{user.referral_code || '—'}</td>
                <td className="px-4 py-4 text-sm">
                  {user.document ? (
                    <a
                      href={`https://projects.growtechnologies.in/bhadra/uploads/${user.document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
                            </table>
                          

<div className="flex justify-end items-center gap-3 mt-4">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((prev) => prev - 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm">
    Page {currentPage} / {totalPages(filteredUsers.length)}
  </span>

  <button
    disabled={currentPage === totalPages(filteredUsers.length)}
    onClick={() => setCurrentPage((prev) => prev + 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

      </div>
    )}

   
  </div>
)}


                {/* ORDERS TAB */}
             

                {activeTab === 'orders' && (
                  <div>
                   <div className="flex justify-between items-center mb-4">
  {/* LEFT */}
  <h3 className="text-lg font-semibold text-slate-900">
    All Orders
  </h3>

  {/* RIGHT */}
  <div className="flex items-center gap-2">
    {/* SEARCH */}
    <input
      type="text"
      value={orderSearch}
      onChange={(e) => setOrderSearch(e.target.value)}
      className="px-4 py-2 border border-slate-300 rounded-lg w-80"
      placeholder="Search orders (pickup, delivery, vehicle, status...)"
    />

    {/* CREATE ORDER */}
    <button
      onClick={() => {
        setShowCreateOrder(true);
        onNavigateToCreateOrder?.();
      }}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span>Create Order</span>
    </button>

    {/* MANAGE ORDERS */}
    {orders.length > 0 && (
      <button
        onClick={onNavigateToOrderManagement}
        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Package className="w-5 h-5" />
        <span>Manage Orders</span>
      </button>
    )}
  </div>
</div>


                {filteredOrders.length === 0 && orderSearch.trim() ? (
  <p className="text-slate-600 text-center py-12">
    No orders found for "{orderSearch}"
  </p>
) : filteredOrders.length === 0 ? (
  <p className="text-slate-600 text-center py-12">
    No orders found
  </p>
) : (

  <div className="overflow-x-auto">

                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Pickup
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Delivery
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Material
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Weight
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Vehicle
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Vehicle feet
                              </th>
                              
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Amount
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Advance
                              </th>
                              <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
{paginatedOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-sm text-slate-900">
                                  {order.pickup_location}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-900">
                                  {order.delivery_location}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {order.material_type}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {order.weight}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {order.vehicle_type}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  {order.ft}
                                </td>
                               
                                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                                  ₹{order.amount}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                  ₹{order.advance}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      order.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : order.status === 'assigned'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex justify-end items-center gap-3 mt-4">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(p => p - 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm">
Page {currentPage} / {totalPages(filteredOrders.length)}
  </span>

  <button
    disabled={currentPage === totalPages(allUsers.length)}
    onClick={() => setCurrentPage(p => p + 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

                      </div>
                    )}
                  </div>
                  )}
                 {activeTab === 'agents' && (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">Agent Details</h3>
    {agents.length === 0 ? (
      <p className="text-center text-slate-600">No agents found</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Full Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Mobile Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                District
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Membership Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Referral Code
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Paginate the agents list */}
            {paginate(agents).map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-sm text-slate-900">{agent.full_name}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{agent.mobile_number}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{agent.district}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{agent.membership_type}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{agent.referral_code}</td>
              </tr>
            ))}
          </tbody>
                            </table>
                            <div className="flex justify-end items-center gap-3 mt-4">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((prev) => prev - 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm">
    Page {currentPage} / {totalPages(agents.length)}
  </span>

  <button
    disabled={currentPage === totalPages(agents.length)}
    onClick={() => setCurrentPage((prev) => prev + 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

      </div>
    )}
  </div>
)}


            
{activeTab === 'withdraws' && (
  <div>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Withdraw Requests
    </h3>

    {withdrawRequests.length === 0 ? (
      <p className="text-slate-600 text-center py-12">
        No pending withdraw requests
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Mobile Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Wallet</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
{paginate(withdrawRequests).map((w) => (
              <tr key={w.id} className="hover:bg-slate-50">
    <td className="px-4 py-4">{w.full_name}</td>
    <td className="px-4 py-4">{w.mobile_number}</td>
                <td className="px-4 py-4 capitalize">{w.wallet}</td>
                <td className="px-4 py-4 font-medium">₹{w.amount}</td>
                <td className="px-4 py-4">{w.date_created}</td>
                <td className="px-4 py-4">
                  <button
                    className="px-3 py-1.5 bg-green-600 text-white rounded"
                    onClick={() => handleApproveWithdraw(w.id)}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end items-center gap-3 mt-4">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(p => p - 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm">
Page {currentPage} / {totalPages(withdrawRequests.length)}
  </span>

  <button
disabled={currentPage === totalPages(withdrawRequests.length)}
    onClick={() => setCurrentPage(p => p + 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

      </div>
    )}
  </div>
)}

{activeTab === 'agent-withdraw' && (
  <div>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Agent Withdrawal Requests ({agentWithdrawRequests.length})
    </h3>

    {agentWithdrawLoading ? (
      <div className="text-center py-12">Loading...</div>
    ) : agentWithdrawRequests.length === 0 ? (
      <p className="text-slate-600 text-center py-12">No pending agent withdrawal requests</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium">Agent Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Mobile</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Wallet Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Date Requested</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginate(agentWithdrawRequests).map((request) => (
              <tr key={request.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <div className="font-medium">{request.agent_name}</div>
                  <div className="text-xs text-slate-500">ID: {request.agent_id}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {request.mobile_number || 'N/A'}
                </td>
                <td className="px-4 py-4 capitalize">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.wallet === 'reward' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {request.wallet}
                  </span>
                </td>
                <td className="px-4 py-4 font-medium">₹{request.amount.toFixed(2)}</td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {request.date_created_formatted || request.date_created}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {request.description || 'Withdrawal request'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveAgentWithdraw(request.id)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded"
                    >
                      Approve
                    </button>
                  
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end items-center gap-3 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {currentPage} / {totalPages(agentWithdrawRequests.length)}
          </span>
          <button
            disabled={currentPage === totalPages(agentWithdrawRequests.length)}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    )}
  </div>
)}
{activeTab === 'wallet' && (
  <div>
    <h3 className="text-lg font-semibold text-slate-900 mb-4">
      Wallet Approval (Elite)
    </h3>

    {paidWalletUsers.length === 0 ? (
      <p className="text-center text-slate-600 py-12">
        No pending wallet approvals
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 rounded-lg">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Mobile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                Wheel Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">
                Payment Screenshot
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">
                Payment Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {paginate(paidWalletUsers).map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">
                  {u.full_name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {u.mobile_number}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {u.wheel_type}
                </td>

                {/* PAYMENT SCREENSHOT */}
                <td className="px-4 py-3 text-center">
                  {u.payment_screenshot ? (
                    <a
                      href={`https://projects.growtechnologies.in/bhadra/uploads/${encodeURIComponent(
                        u.payment_screenshot
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>

                {/* PAYMENT STATUS */}
                <td className="px-4 py-3 text-center">
                  {u.payment_screenshot ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Not Paid
                    </span>
                  )}
                </td>

                {/* APPROVE ACTION */}
                <td className="px-4 py-3 text-center">
                  {u.file_approved === 1 ? (
                    <button
                      disabled
                      className="px-3 py-1 text-xs bg-gray-400 text-white rounded cursor-not-allowed"
                    >
                      Approved
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproveWallet(u.id)}
                        disabled={!u.payment_screenshot}
                        className="px-3 py-1 text-xs text-white rounded
                          bg-green-600 hover:bg-green-700
                          disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Approve ₹1200
                      </button>

                      {/* Reject button */}
                      <button
                        onClick={() => handleRejectWallet(u.id)}
                        className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded ml-2"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-end items-center gap-3 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {currentPage} / {totalPages(paidWalletUsers.length)}
          </span>

          <button
            disabled={currentPage === totalPages(paidWalletUsers.length)}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    )}
  </div>
)}






              </div>
            </div>
          </>
        )}
      </div>

      {/* QUICK CREATE ORDER MODAL */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Create New Order
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pickup Location *
                  </label>
                  <input
                    type="text"
                    value={orderForm.pickup_location}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        pickup_location: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Delivery Location *
                  </label>
                  <input
                    type="text"
                    value={orderForm.delivery_location}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        delivery_location: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
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
      {menuOpen && (
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black bg-opacity-40"
      onClick={() => setMenuOpen(false)}
    />

    {/* Sidebar */}
    <div className="relative w-72 bg-white h-full shadow-xl p-4">
      <h3 className="text-lg font-semibold mb-4">Menu</h3>

      {[
        // { key: 'pending', label: `Pending Users (${pendingUsers.length})` },
        { key: 'users', label: `All Users (${totalUsers})` },
              { key: 'orders', label: `Orders (${orders.length})` },
        { key: 'agent-withdraw', label: `Agent Withdrawals (${agentWithdrawRequests.length})` },
        { key: 'withdraws', label: `User Withdraw Requests (${withdrawRequests.length})` },
        { key: 'wallet', label: `Wallet Approvals (Elite)` },
      ].map(item => (
        <button
          key={item.key}
          onClick={() => {
            setActiveTab(item.key as any);
            setMenuOpen(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-lg mb-2 text-sm font-medium
            ${
              activeTab === item.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
)}

    </div>
  );
}
