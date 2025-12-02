import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Truck, LogOut, Share2, Package, FileText, History } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToWallet?: () => void;
}

interface Order {
  id: string;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  amount: number;
  advance: number;
  status: string;
  created_at: string;
}

export default function UserDashboard({ user, onLogout, onNavigateToOrders, onNavigateToWallet }: UserDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referral_code);
    alert('Referral code copied to clipboard!');
  };

  const shareReferralCode = () => {
    setShowShareModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GoTruck</h1>
                <p className="text-sm text-slate-500">Driver Dashboard</p>
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
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <h2 className="text-2xl font-bold">{user.full_name}</h2>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Referral ID</p>
              <p className="text-xl font-mono font-bold">{user.referral_code}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={onNavigateToWallet}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Reward Wallet</p>
            <p className="text-3xl font-bold text-slate-900">₹{user.reward_wallet}</p>
            <p className="text-xs text-slate-500 mt-2">₹50 per referral</p>
          </button>

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
            <p className="text-3xl font-bold text-slate-900">₹{user.diesel_wallet}</p>
            <p className="text-xs text-slate-500 mt-2">For fuel expenses</p>
          </button>

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
            <p className="text-xs text-slate-500 mt-2">Assigned to you</p>
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Share & Earn</h3>
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Invite friends and earn ₹50 for every successful referral. New members get ₹250 welcome bonus!
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Assigned Orders</h3>
              <p className="text-sm text-slate-600 mt-1">List of orders assigned to you</p>
            </div>
            {orders.length > 0 && (
              <button
                onClick={onNavigateToOrders}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>View All</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No orders assigned yet</p>
              <p className="text-sm text-slate-500 mt-2">New orders will appear here when assigned by admin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Pickup</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Delivery</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Material</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Weight</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Advance</th>
                    <th className="text-left text-xs font-medium text-slate-600 uppercase px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{order.pickup_location}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{order.delivery_location}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.material_type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.weight}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">₹{order.amount}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">₹{order.advance}</td>
                      <td className="px-6 py-4">
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
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Share Referral Code</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Your Referral Code:</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{user.referral_code}</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Share this code with your friends. They'll get ₹250 welcome bonus and you'll earn ₹50 for each successful referral!
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
