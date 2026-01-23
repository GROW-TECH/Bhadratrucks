// src/pages/AgentWallet.tsx
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

interface AgentWalletProps {
  agent: {
    id: string | number;
    full_name?: string;
    membership_type?: string;
  };
  onBack: () => void;
}

interface Transaction {
  id: string | number;
  agent_id: string | number;
  type: 'credit' | 'debit';
  wallet: 'reward' | 'diesel';
  amount: number;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date_created: string;
  date_created_formatted?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface Filters {
  wallet: 'all' | 'reward' | 'diesel';
  status: 'all' | 'pending' | 'approved' | 'rejected';
  type: 'all' | 'credit' | 'debit';
}

const MIN_REWARD_AGENT = 1500;
const MIN_DIESEL_WITHDRAW = 3000;

export default function AgentWallet({ agent, onBack }: AgentWalletProps) {
  const [rewardWallet, setRewardWallet] = useState<number>(0);
  const [dieselWallet, setDieselWallet] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<'reward' | 'diesel' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    wallet: 'all',
    status: 'all',
    type: 'all'
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    try {
      const resp = await fetch(
        `https://projects.growtechnologies.in/bhadra/api/agent_wallet_history.php?agent_id=${encodeURIComponent(
          String(agent.id)
        )}`
      );

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Server ${resp.status} ${txt ? '- ' + txt : ''}`);
      }

      const json = await resp.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to load wallet history');
      }

      setRewardWallet(json.reward_wallet || 0);
      setDieselWallet(json.diesel_wallet || 0);
      
      setLastUpdated(new Date().toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (err: any) {
      console.error('fetchWalletBalances error', err);
      setError(err?.message ?? 'Failed to fetch wallet balances');
    }
  };

  // Fetch transactions with filters
  const fetchTransactions = async (resetOffset = true) => {
    if (!agent?.id) return;
    
    setTransactionsLoading(true);
    try {
      const params = new URLSearchParams({
        agent_id: String(agent.id),
        limit: '20',
        offset: resetOffset ? '0' : String(pagination?.offset || 0),
      });
      
      // Add filters if not 'all'
      if (filters.wallet !== 'all') {
        params.append('wallet', filters.wallet);
      }
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      
      const resp = await fetch(
        `https://projects.growtechnologies.in/bhadra/api/agent_transactions.php?${params}`
      );
      
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Server ${resp.status} ${txt ? '- ' + txt : ''}`);
      }
      
      const json = await resp.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to load transactions');
      }
      
      setTransactions(json.data.transactions);
      setPagination(json.data.pagination);
    } catch (err) {
      console.error('fetchTransactions error', err);
      // Don't show transaction errors in main error state
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!agent?.id) {
      setError('Missing agent id');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchWalletBalances(),
        fetchTransactions(true)
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [agent?.id]);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions(true);
  }, [filters]);

  const handleWithdraw = async (walletType: 'reward' | 'diesel') => {
    const balance = walletType === 'reward' ? rewardWallet : dieselWallet;
    const withdrawAmount = walletType === 'reward' ? MIN_REWARD_AGENT : MIN_DIESEL_WITHDRAW;
    
    // Validation
    if (balance < withdrawAmount) {
      alert(`Insufficient balance. Minimum withdrawal is ₹${withdrawAmount}`);
      return;
    }

    try {
      setWithdrawing(walletType);
      
      const requestBody = {
        agent_id: String(agent.id),
        wallet: walletType,
        amount: withdrawAmount,
      };
      
      console.log('Sending withdrawal request:', requestBody);
      
      const resp = await fetch('https://projects.growtechnologies.in/bhadra/api/agent_wallet_withdraw.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const text = await resp.text();
      
      try {
        const json = JSON.parse(text);
        
        if (!resp.ok || json?.error) {
          alert(json?.error || 'Withdraw failed');
          return;
        }
        
        alert(`Withdraw request for ₹${withdrawAmount} submitted successfully.\nTransaction ID: ${json.transaction_id}\nStatus: Pending Admin Approval`);
        
        // Refresh data
        await fetchWalletBalances();
        await fetchTransactions(true);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        alert('Invalid response from server');
      }
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      alert('Network error: ' + err.message);
    } finally {
      setWithdrawing(null);
    }
  };

  const downloadCSV = () => {
    const rows = [
      ['Transaction ID', 'Date', 'Wallet', 'Type', 'Amount', 'Status', 'Description'],
      ...transactions.map((t) => [
        String(t.id),
        t.date_created_formatted || t.date_created,
        String(t.wallet).toUpperCase(),
        String(t.type).toUpperCase(),
        String(t.amount),
        String(t.status).toUpperCase(),
        `"${String(t.description ?? 'N/A')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-transactions-${agent.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Refresh all data
  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWalletBalances(),
      fetchTransactions(true)
    ]);
    setLoading(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination?.has_next) {
      const newOffset = pagination.offset + pagination.limit;
      setPagination(prev => prev ? {...prev, offset: newOffset} : null);
      fetchTransactions(false);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      setPagination(prev => prev ? {...prev, offset: newOffset} : null);
      fetchTransactions(false);
    }
  };

  // Get pending withdrawal count
  const pendingWithdrawals = transactions.filter(tx => 
    tx.type === 'debit' && tx.status === 'pending'
  ).length;

  // Calculate if can withdraw (balance >= minimum)
  const canWithdrawReward = rewardWallet >= MIN_REWARD_AGENT;
  const canWithdrawDiesel = dieselWallet >= MIN_DIESEL_WITHDRAW;

  // Calculate available balance (excluding pending withdrawals)
  const rewardBalance = rewardWallet;
  const dieselBalance = dieselWallet;

  // Reset filters
  const resetFilters = () => {
    setFilters({
      wallet: 'all',
      status: 'all',
      type: 'all'
    });
  };

  // Check if any filter is active
  const isFilterActive = filters.wallet !== 'all' || filters.status !== 'all' || filters.type !== 'all';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Agent Wallet</h1>
                <p className="text-sm text-slate-500">
                  {agent?.full_name ?? 'Agent'}
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Agent Account
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="text-xs text-slate-500 hidden md:block">
                  Updated: {lastUpdated}
                </div>
              )}
              <button
                onClick={refreshAllData}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-sm disabled:opacity-50 transition-colors"
                title="Refresh all data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-sm transition-colors"
                title="Download transactions CSV"
                disabled={transactions.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading wallet data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-3">
              <button onClick={refreshAllData} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm">
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Pending withdrawals notification */}
          
            {/* Wallet cards row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Reward Wallet Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Reward Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{rewardBalance.toFixed(2)}
                  </p>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Available to withdraw:</span>
                      <span className={`font-medium ${canWithdrawReward ? 'text-green-600' : 'text-slate-500'}`}>
                        ₹{rewardBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Minimum withdrawal:</span>
                      <span className="font-medium">₹{MIN_REWARD_AGENT}</span>
                    </div>
                    {!canWithdrawReward && rewardBalance > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        Need ₹{MIN_REWARD_AGENT} minimum to withdraw
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleWithdraw('reward')}
                    disabled={!canWithdrawReward || withdrawing === 'reward'}
                    className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      canWithdrawReward
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {withdrawing === 'reward' ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Withdrawal (₹{MIN_REWARD_AGENT})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bonus Wallet Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Bonus Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{dieselBalance.toFixed(2)}
                  </p>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Available to withdraw:</span>
                      <span className={`font-medium ${canWithdrawDiesel ? 'text-green-600' : 'text-slate-500'}`}>
                        ₹{dieselBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Minimum withdrawal:</span>
                      <span className="font-medium">₹{MIN_DIESEL_WITHDRAW}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      For bonuses and commissions
                    </p>
                    {!canWithdrawDiesel && dieselBalance > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        Need ₹{MIN_DIESEL_WITHDRAW} minimum to withdraw
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleWithdraw('diesel')}
                    disabled={!canWithdrawDiesel || withdrawing === 'diesel'}
                    className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      canWithdrawDiesel
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {withdrawing === 'diesel' ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Withdrawal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Information */}
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-medium text-slate-800 mb-2">Agent Withdrawal Rules</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Minimum reward withdrawal: ₹{MIN_REWARD_AGENT}</li>
                <li>• Minimum bonus withdrawal: ₹{MIN_DIESEL_WITHDRAW}</li>
                <li>• All withdrawals require admin approval</li>
                <li>• Balance will be deducted only after approval</li>
                <li>• Check transaction status for updates</li>
              </ul>
            </div>

            {/* Transactions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Transactions</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Recent activity - {pendingWithdrawals} pending
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Filter toggle button */}
                  
                    
                    {isFilterActive && (
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filters panel */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Wallet
                        </label>
                        <select
                          value={filters.wallet}
                          onChange={(e) => setFilters({...filters, wallet: e.target.value as any})}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Wallets</option>
                          <option value="reward">Reward Wallet</option>
                          <option value="diesel">Bonus Wallet</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Types</option>
                          <option value="credit">Credits</option>
                          <option value="debit">Withdrawals</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {transactionsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-slate-600 mt-3">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-600">
                  <p>No transactions found</p>
                  {isFilterActive && (
                    <button 
                      onClick={resetFilters}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Clear filters to see all transactions
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Date</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Wallet</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Type</th>
                          <th className="text-right text-xs font-medium text-slate-600 uppercase px-4 py-3">Amount</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Status</th>
                          <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transactions.map((tx) => (
                          <tr key={String(tx.id)} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {tx.date_created_formatted || (
                                new Date(tx.date_created).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700 capitalize">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                tx.wallet === 'reward' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {tx.wallet}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700 capitalize">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                tx.type === 'credit' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-right">
                              <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {tx.status === 'pending' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              ) : tx.status === 'approved' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </span>
                              ) : tx.status === 'rejected' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate">
                              {tx.description ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        Showing {Math.min(pagination.offset + 1, pagination.total)} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} transactions
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={!pagination.has_prev}
                          className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-slate-700 px-3">
                          Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={!pagination.has_next}
                          className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}