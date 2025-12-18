import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Send } from 'lucide-react';

interface AgentWalletProps {
  agent: {
    id: string | number;
    full_name?: string;
    membership_type?: string; // 'premium' or others
  };
  onBack: () => void;
}

interface Transaction {
  id: string | number;
  type: string; // e.g. credit/debit
  wallet: string; // 'reward' or 'diesel'
  amount: number;
  description: string | null;
  date: string; // date string from API
}

const MIN_REWARD_AGENT = 1500; // Minimum reward withdrawal for agents
const MIN_DIESEL_WITHDRAW = 3000; // Minimum diesel withdrawal

export default function AgentWallet({ agent, onBack }: AgentWalletProps) {
  const [rewardWallet, setRewardWallet] = useState<number | null>(null);
  const [dieselWallet, setDieselWallet] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<'reward' | 'diesel' | null>(null);

  useEffect(() => {
    if (!agent?.id) {
      setError('Missing agent id');
      setLoading(false);
      return;
    }
    fetchWalletHistory();
  }, [agent?.id]);

  const fetchWalletHistory = async () => {
    setLoading(true);
    setError(null);
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
      setTransactions(json.transactions || []);
    } catch (err: any) {
      console.error('fetchWalletHistory error', err);
      setError(err?.message ?? 'Failed to fetch wallet history');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (walletType: 'reward' | 'diesel') => {
    const balance = walletType === 'reward' ? (rewardWallet ?? 0) : (dieselWallet ?? 0); // Ensure balance is a number
    const withdrawAmount = walletType === 'reward' ? MIN_REWARD_AGENT : balance;

    if (walletType === 'reward' && balance < MIN_REWARD_AGENT) {
      alert(`You need at least ₹${MIN_REWARD_AGENT} in your Reward wallet to withdraw.`);
      return;
    }
    if (walletType === 'diesel' && balance < MIN_DIESEL_WITHDRAW) {
      alert(`You need at least ₹${MIN_DIESEL_WITHDRAW} in your Bonus wallet to withdraw.`);
      return;
    }

    if (!confirm(`Withdraw ₹${withdrawAmount} from ${walletType === 'reward' ? 'Reward' : 'Diesel'} wallet?`)) {
      return;
    }

    try {
      setWithdrawing(walletType);

      const resp = await fetch('https://projects.growtechnologies.in/bhadra/api/agent_wallet_withdraw.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: String(agent.id),
          wallet: walletType,
          amount: withdrawAmount,
        }),
      });

      const json = await resp.json();

      if (!json.success) {
        alert(json.error || 'Withdraw failed');
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
    a.download = `wallet-history-${agent.id}-${new Date().toISOString().slice(0, 10)}.csv`;
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
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Agent Wallet</h1>
                <p className="text-sm text-slate-500">{agent?.full_name ?? 'Agent'}</p>
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
              <button onClick={fetchWalletHistory} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm">
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Wallet and transactions UI */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Reward Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">₹{(rewardWallet ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Minimum withdrawal: ₹{MIN_REWARD_AGENT}
                  </p>
                </div>
                <div className="mt-4">
                <button
  onClick={() => handleWithdraw('reward')}
  disabled={rewardWallet === null || (rewardWallet ?? 0) < MIN_REWARD_AGENT} // Check for null or insufficient balance
  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    (rewardWallet ?? 0) >= MIN_REWARD_AGENT
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
  }`}
>
  <Send className="w-4 h-4 mr-2" />
  {withdrawing === 'reward' ? 'Processing...' : 'Withdraw'}
</button>

                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Bonus Wallet</p>
                  <p className="text-3xl font-bold text-slate-900">₹{(dieselWallet ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-2">Minimum withdrawal: ₹{MIN_DIESEL_WITHDRAW}</p>
                </div>
                <div className="mt-4">
                 <button
  onClick={() => handleWithdraw('diesel')}
  disabled={dieselWallet ?? 0 < MIN_DIESEL_WITHDRAW ? true : false}
  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dieselWallet ?? 0 >= MIN_DIESEL_WITHDRAW ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
>
  <Send className="w-4 h-4 mr-2" />
  {withdrawing === 'diesel' ? 'Processing...' : 'Withdraw'}
</button>

                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Transactions</h3>
                <div className="text-sm text-slate-500">{transactions.length} records</div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-600">No transactions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Wallet</th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Type</th>
                        <th className="text-right text-xs font-medium text-slate-600 uppercase px-4 py-3">Amount</th>
                        <th className="text-left text-xs font-medium text-slate-600 uppercase px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.map((tx) => (
                        <tr key={String(tx.id)} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm text-slate-700">{new Date(tx.date).toLocaleString()}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 capitalize">{tx.wallet}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 capitalize">{tx.type}</td>
                          <td className="px-4 py-4 text-sm font-medium text-right">₹{Number(tx.amount).toFixed(2)}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">{tx.description ?? '-'}</td>
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
