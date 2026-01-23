// src/pages/UserWallet.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Send, Info } from 'lucide-react';

interface UserWalletProps {
  user: {
    id: string | number;
    full_name?: string;
    membership_type?: string; // 'elite' | 'premium'
  };
  onBack: () => void;
}

interface Transaction {
  id: string | number;
  type: string; // e.g. credit/debit or custom
  wallet: string; // 'reward' or 'diesel' or similar
  amount: number;
  description: string | null;
  date: string; // date string from API
}

// business rules:
// 4-wheel (Elite): min 500, must keep 4999
// 6–14 wheel (Premium): min 1500
// Diesel wallet: min 3000
const MIN_REWARD_ELITE = 500;
const MIN_REWARD_PREMIUM = 1500;
const MIN_DIESEL_WITHDRAW = 3000;
const ELITE_MINIMUM_KEEP = 1999; // Minimum balance elite users must keep

export default function UserWallet({ user, onBack }: UserWalletProps) {
  const [rewardWallet, setRewardWallet] = useState<number | null>(null);
  const [dieselWallet, setDieselWallet] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<'reward' | 'diesel' | null>(
    null
  );

  // Decide elite/premium from wheel_type: 4-wheel => elite, others => premium
  const rawWheel = ((user as any)?.wheel_type || '').toString().toLowerCase();
  const membershipType = rawWheel === '4-wheel' ? 'elite' : 'premium';

  const effectiveRewardMin =
    membershipType === 'elite' ? MIN_REWARD_ELITE : MIN_REWARD_PREMIUM;

  // Calculate available balance for withdrawal
  const rewardBalance = Number(rewardWallet ?? 0);
  const dieselBalance = Number(dieselWallet ?? 0);

  // For elite users, calculate available reward balance (balance - 4999)
  const availableRewardForWithdrawal = membershipType === 'elite'
    ? Math.max(0, rewardBalance - ELITE_MINIMUM_KEEP)
    : rewardBalance;

  // Can withdraw reward? For elite: need at least 4999 + 500 = 5499
  // For premium: need at least 1500
  const canWithdrawReward = membershipType === 'elite'
    ? rewardBalance >= (ELITE_MINIMUM_KEEP + MIN_REWARD_ELITE)
    : rewardBalance >= MIN_REWARD_PREMIUM;

  const canWithdrawDiesel = dieselBalance >= MIN_DIESEL_WITHDRAW;

  // Add this useEffect right after the existing useEffect
  useEffect(() => {
    const testAPI = async () => {
      try {
        const resp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/wallet_history.php?user_id=${encodeURIComponent(
            String(user.id)
          )}`
        );
        const text = await resp.text();
        console.log('RAW API RESPONSE TEXT:', text); // Debugging the raw response
      } catch (err) {
        console.error('Test API error:', err);
      }
    };
    testAPI();
  }, [user.id]);

  useEffect(() => {
    if (!user?.id) {
      setError('Missing user id');
      setLoading(false);
      return;
    }
    fetchWalletHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const safeJson = async (resp: Response) => {
    const text = await resp.text().catch(() => '');
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      console.warn('safeJson parse failed, raw text:', text);
      return null;
    }
  };

  const fetchWalletHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `https://projects.growtechnologies.in/bhadra/api/wallet_history.php?user_id=${encodeURIComponent(
          String(user.id)
        )}`
      );

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Server ${resp.status} ${txt ? '- ' + txt : ''}`);
      }

      const json = await safeJson(resp);
      if (!json) throw new Error('Invalid JSON from server');

      if (json.success === false) {
        throw new Error(json.error || 'Failed to load wallet history');
      }

      console.log('Wallet Page API Response:', json); // Debug log

      // Extract wallet amounts
      const reward = Number(json.reward_wallet ?? 0); // Ensure this is the correct path
      const diesel = Number(json.diesel_wallet ?? 0);

      console.log(`Extracted amounts - Reward: ₹${reward}, Diesel: ₹${diesel}`);

      setRewardWallet(reward); // Update state
      setDieselWallet(diesel); // Update state

      // Get transactions - handle all possible locations in the response
      let txs = [];

      if (Array.isArray(json.transactions)) {
        txs = json.transactions;
      } else if (Array.isArray(json.data)) {
        txs = json.data;
      } else if (json.data && Array.isArray(json.data.transactions)) {
        txs = json.data.transactions;
      }

      setTransactions(
        txs.map((t: any) => ({
          id: t.id ?? t.tx_id ?? t.transaction_id ?? Math.random().toString(),
          type: t.type ?? t.transaction_type ?? '',
          wallet: t.wallet ?? t.wallet_type ?? '',
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount ?? 0,
          description: t.description ?? t.note ?? t.remarks ?? t.details ?? null,
          date: t.date ?? t.date_created ?? t.created_at ?? t.transaction_date ?? t.timestamp ?? '',
        }))
      );
    } catch (err: any) {
      console.error('fetchWalletHistory error', err);
      setError(err?.message ?? 'Failed to fetch wallet history');
      setRewardWallet(0); // Set default value in case of error
      setDieselWallet(0); // Set default value in case of error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (walletType: 'reward' | 'diesel') => {
    const balance =
      walletType === 'reward'
        ? Number(rewardWallet ?? 0)
        : Number(dieselWallet ?? 0);

    // For Reward Wallet: Fixed withdrawal amount of ₹500 if the balance is ₹4999 or more
    let withdrawAmount = walletType === 'reward' ? 500 : balance; // Always ₹500 for Reward wallet

    if (walletType === 'reward') {
      if (balance < 1999) {
        alert(
          `You need at least ₹1999 in your Reward wallet to withdraw ₹500.`
        );
        return;
      }
    } else {
      if (balance < MIN_DIESEL_WITHDRAW) {
        alert(
          `You need at least ₹${MIN_DIESEL_WITHDRAW} in your Diesel wallet to withdraw.`
        );
        return;
      }
    }

    // Confirmation step
    if (
      !confirm(
        `Withdraw ₹${withdrawAmount} from ${walletType === 'reward' ? 'Reward' : 'Diesel'} wallet?`
      )
    ) {
      return;
    }

    try {
      setWithdrawing(walletType);

      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/wallet_withdraw.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: String(user.id),
            wallet: walletType,
            amount: withdrawAmount,
          }),
        }
      );

      const json = await safeJson(resp);

      if (!resp.ok || json?.error) {
        alert(json?.error || 'Withdraw failed');
        return;
      }

      alert(`Withdraw request for ₹${withdrawAmount} submitted successfully.`);
      fetchWalletHistory();
    } catch (err) {
      alert('Withdraw failed');
    } finally {
      setWithdrawing(null);
    }
  };

  const downloadCSV = () => {
    const rows = [
      ['ID', 'Wallet', 'Type', 'Amount', 'Description', 'Date'],
      ...transactions.map((t) => [
        String(t.id),
        String(t.wallet),
        String(t.type),
        String(t.amount),
        `"${String(t.description ?? '')}"`,
        String(t.date),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-history-${user.id}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Wallet</h1>
                <p className="text-sm text-slate-500">
                  {user?.full_name ?? 'Member'}
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {membershipType === 'elite' ? 'Elite (4-Wheel)' : 'Premium'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-sm"
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
            <p className="text-slate-600 mt-4">Loading wallet history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-3">
              <button
                onClick={fetchWalletHistory}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Wallet cards row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Reward Wallet */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-600">Reward Wallet</p>
                    {membershipType === 'elite' && (
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded text-xs">
                        <Info className="w-3 h-3" />
                        <span>4-Wheel Elite</span>
                      </div>
                    )}
                  </div>

                  <p className="text-3xl font-bold text-slate-900">
                    ₹{rewardBalance.toFixed(2)}
                  </p>

                  {/* Dynamic information based on membership */}
                  {membershipType === 'elite' ? (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Available to withdraw:</span>
                        <span className="font-medium text-green-600">
                          ₹{availableRewardForWithdrawal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Must keep in wallet:</span>
                        <span className="font-medium">₹{ELITE_MINIMUM_KEEP}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Per withdrawal:</span>
                        <span className="font-medium">₹{MIN_REWARD_ELITE}</span>
                      </div>
                      {!canWithdrawReward && rewardBalance > 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          Need ₹{(ELITE_MINIMUM_KEEP + MIN_REWARD_ELITE).toFixed(0)} total to withdraw ₹{MIN_REWARD_ELITE}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Available to withdraw:</span>
                        <span className="font-medium text-green-600">
                          ₹{availableRewardForWithdrawal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Minimum withdrawal:</span>
                        <span className="font-medium">₹{MIN_REWARD_PREMIUM}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Earn ₹10 per referral
                      </p>
                    </div>
                  )}
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
                    <Send className="w-4 h-4 mr-2" />
                    {withdrawing === 'reward'
                      ? 'Processing...'
                      : `Withdraw ₹${MIN_REWARD_ELITE}`}
                  </button>
                </div>
              </div>

              {/* Diesel Wallet */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Diesel Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{dieselBalance.toFixed(2)}
                  </p>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Available to withdraw:</span>
                      <span className="font-medium text-green-600">
                        ₹{dieselBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Minimum withdrawal:</span>
                      <span className="font-medium">₹{MIN_DIESEL_WITHDRAW}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      For fuel purchases & reimbursements
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
                    <Send className="w-4 h-4 mr-2" />
                    {withdrawing === 'diesel'
                      ? 'Processing...'
                      : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Info Card */}
            {membershipType === 'elite' && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      4-Wheel Elite Member Rules
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Must maintain minimum ₹{ELITE_MINIMUM_KEEP} in Reward Wallet</li>
                      <li>• Can withdraw ₹{MIN_REWARD_ELITE} when balance exceeds ₹{ELITE_MINIMUM_KEEP + MIN_REWARD_ELITE}</li>
                      <li>• Earn ₹500 per successful referral</li>
                      <li>• Diesel wallet has separate ₹{MIN_DIESEL_WITHDRAW} minimum</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Transactions
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Recent activity (latest first)
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  {transactions.length} records
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-600">
                  No transactions yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                          Wallet
                        </th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                          Type
                        </th>
                        <th className="text-right text-xs font-medium text-slate-600 uppercase px-4 py-3">
                          Amount
                        </th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.map((tx) => (
                        <tr key={String(tx.id)} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {tx.date
                              ? new Date(tx.date).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 capitalize">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.wallet === 'reward' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {tx.wallet}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 capitalize">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-right">
                            <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {tx.description ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}