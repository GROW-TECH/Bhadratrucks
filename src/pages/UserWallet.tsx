// src/pages/UserWallet.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Send } from 'lucide-react';

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
// Reward wallet: elite min 500, premium min 1000
// Diesel wallet: min 3000
const MIN_REWARD_ELITE = 500;
const MIN_REWARD_PREMIUM = 1000;
const MIN_DIESEL_WITHDRAW = 3000;

export default function UserWallet({ user, onBack }: UserWalletProps) {
  const [rewardWallet, setRewardWallet] = useState<number | null>(null);
  const [dieselWallet, setDieselWallet] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<'reward' | 'diesel' | null>(
    null
  );

  const membershipType =
    (user?.membership_type || '').toLowerCase() === 'elite'
      ? 'elite'
      : 'premium';

  const effectiveRewardMin =
    membershipType === 'elite' ? MIN_REWARD_ELITE : MIN_REWARD_PREMIUM;

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

      const r =
        typeof json.reward_wallet !== 'undefined'
          ? Number(json.reward_wallet)
          : null;
      const d =
        typeof json.diesel_wallet !== 'undefined'
          ? Number(json.diesel_wallet)
          : null;
      const txs = Array.isArray(json.transactions)
        ? json.transactions
        : json.data && Array.isArray(json.data)
        ? json.data
        : [];

      setRewardWallet(Number.isFinite(r) ? r : 0);
      setDieselWallet(Number.isFinite(d) ? d : 0);

      setTransactions(
        txs.map((t: any) => ({
          id: t.id ?? t.tx_id ?? t.transaction_id ?? '',
          type: t.type ?? '',
          wallet: t.wallet ?? '',
          amount:
            typeof t.amount === 'string'
              ? parseFloat(t.amount)
              : t.amount ?? 0,
          description: t.description ?? t.note ?? null,
          date: t.date ?? t.date_created ?? t.created_at ?? '',
        }))
      );
    } catch (err: any) {
      console.error('fetchWalletHistory error', err);
      setError(err?.message ?? 'Failed to fetch wallet history');
      setRewardWallet(null);
      setDieselWallet(null);
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

    if (walletType === 'reward') {
      if (balance < effectiveRewardMin) {
        alert(
          `You need at least ₹${effectiveRewardMin} in your Reward wallet to withdraw.`
        );
        return;
      }
    } else {
      if (balance < MIN_DIESEL_WITHDRAW) {
        alert(
          `You need at least ₹${MIN_DIESEL_WITHDRAW} in your Diesel wallet to place a withdrawal request.`
        );
        return;
      }
    }

    if (
      !confirm(
        `Withdraw ₹${balance} from ${
          walletType === 'reward' ? 'Reward wallet' : 'Diesel wallet'
        }?`
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
            amount: balance,
          }),
        }
      );

      const json = await safeJson(resp);

      if (!resp.ok || json?.error) {
        console.error('wallet_withdraw error', resp.status, json);
        alert(json?.error || 'Withdraw failed');
        return;
      }

      alert('Withdraw request submitted successfully');
      fetchWalletHistory();
    } catch (err) {
      console.error('handleWithdraw error', err);
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

  const reward = Number(rewardWallet ?? 0);
  const diesel = Number(dieselWallet ?? 0);

  const canWithdrawReward =
    reward >= effectiveRewardMin && withdrawing !== 'reward';
  const canWithdrawDiesel =
    diesel >= MIN_DIESEL_WITHDRAW && withdrawing !== 'diesel';

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
                  <p className="text-sm text-slate-600 mb-2">Reward Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{reward.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    For Elite Premium referrals & rewards
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Elite Premium: min withdraw ₹{MIN_REWARD_ELITE}
                    <br />
                    Premium: min withdraw ₹{MIN_REWARD_PREMIUM}
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleWithdraw('reward')}
                    disabled={!canWithdrawReward}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      canWithdrawReward
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {withdrawing === 'reward' ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>

              {/* Diesel Wallet */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Diesel Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{diesel.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    For fuel & reimbursements
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum diesel withdraw:{' '}
                    <span className="font-semibold">₹{MIN_DIESEL_WITHDRAW}</span>
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleWithdraw('diesel')}
                    disabled={!canWithdrawDiesel}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      canWithdrawDiesel
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {withdrawing === 'diesel' ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>

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
                            {tx.wallet}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700 capitalize">
                            {tx.type}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-right">
                            ₹{Number(tx.amount).toFixed(2)}
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
