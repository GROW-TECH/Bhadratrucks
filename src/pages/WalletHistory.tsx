import { useState } from 'react';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Gift, Fuel } from 'lucide-react';

interface WalletHistoryProps {
  user: any;
  onBack: () => void;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  wallet: 'reward' | 'diesel';
  amount: number;
  description: string;
  date: string;
}

export default function WalletHistory({ user, onBack }: WalletHistoryProps) {
  const [activeWallet, setActiveWallet] = useState<'reward' | 'diesel'>('reward');

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'credit',
      wallet: 'reward',
      amount: 250,
      description: 'Welcome bonus',
      date: new Date().toISOString()
    },
    {
      id: '2',
      type: 'credit',
      wallet: 'reward',
      amount: 50,
      description: 'Referral reward from new user',
      date: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      type: 'credit',
      wallet: 'reward',
      amount: 50,
      description: 'Referral reward from new user',
      date: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '4',
      type: 'credit',
      wallet: 'diesel',
      amount: 300,
      description: 'Initial diesel wallet credit',
      date: new Date().toISOString()
    },
  ];

  const filteredTransactions = mockTransactions.filter(t => t.wallet === activeWallet);

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
              <h1 className="text-xl font-bold text-slate-900">Wallet History</h1>
              <p className="text-sm text-slate-500">View your transaction history</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <Wallet className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-green-100 text-sm mb-1">Reward Wallet</p>
            <p className="text-3xl font-bold mb-2">₹{user.reward_wallet}</p>
            <p className="text-xs text-green-100">Earn ₹50 for each referral</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Fuel className="w-6 h-6" />
              </div>
              <Wallet className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Diesel Wallet</p>
            <p className="text-3xl font-bold mb-2">₹{user.diesel_wallet}</p>
            <p className="text-xs text-blue-100">For fuel expenses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveWallet('reward')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeWallet === 'reward'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Reward Wallet
              </button>
              <button
                onClick={() => setActiveWallet('diesel')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeWallet === 'diesel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Diesel Wallet
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Transaction History
            </h3>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No transactions yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'credit'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className={`w-5 h-5 ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(transaction.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{transaction.wallet}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Earn More Rewards!
              </h4>
              <p className="text-sm text-blue-700">
                Share your referral code with friends and earn ₹50 for every successful referral.
                Your friends also get ₹250 welcome bonus!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
