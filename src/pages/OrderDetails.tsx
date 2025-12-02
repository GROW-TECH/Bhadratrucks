import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, IndianRupee, Phone, Calendar, CheckCircle, User, Truck, CreditCard, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderDetailsProps {
  orderId: string;
  isAdmin: boolean;
  onBack: () => void;
}

interface Order {
  id: string;
  pickup_location: string;
  delivery_location: string;
  weight: string;
  material_type: string;
  vehicle_type: string;
  wheel_type: string | null;
  amount: number;
  advance: number;
  balance_paid: number;
  contact_number: string;
  status: string;
  payment_status: string;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export default function OrderDetails({ orderId, isAdmin, onBack }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [driverName, setDriverName] = useState<string>('Unassigned');
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        alert('Order not found');
        onBack();
        return;
      }

      setOrder(orderData);

      if (orderData.assigned_to) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', orderData.assigned_to)
          .maybeSingle();

        if (userData) setDriverName(userData.full_name);
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) return;

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const totalPaid = order.advance + order.balance_paid + paymentAmount;
    if (totalPaid > order.amount) {
      alert('Payment amount exceeds order total');
      return;
    }

    try {
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .limit(1)
        .maybeSingle();

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          order_id: orderId,
          amount: paymentAmount,
          payment_type: 'balance',
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes,
          recorded_by: adminData?.id || null
        }]);

      if (paymentError) throw paymentError;

      const newBalancePaid = order.balance_paid + paymentAmount;
      const newPaymentStatus = (order.advance + newBalancePaid) >= order.amount ? 'completed' : 'partial';

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          balance_paid: newBalancePaid,
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      setPaymentForm({ amount: '', payment_method: 'cash', notes: '' });
      setShowPaymentModal(false);
      fetchOrderDetails();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;

    const totalPaid = order.advance + order.balance_paid;
    if (totalPaid < order.amount) {
      alert('Cannot complete order: Payment not fully received');
      return;
    }

    if (!confirm('Mark this order as completed?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      fetchOrderDetails();
      alert('Order marked as completed!');
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!order) return null;

  const totalPaid = order.advance + order.balance_paid;
  const remainingBalance = order.amount - totalPaid;
  const paymentProgress = (totalPaid / order.amount) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Order Details</h1>
                <p className="text-sm text-slate-500">Order ID: {order.id.substring(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {order.status === 'completed' ? (
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </span>
              ) : (
                isAdmin && order.payment_status === 'completed' && (
                  <button
                    onClick={handleCompleteOrder}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete Order</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Locations</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pickup Location</p>
                    <p className="text-sm font-medium text-slate-900">{order.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Delivery Location</p>
                    <p className="text-sm font-medium text-slate-900">{order.delivery_location}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Material</span>
                  <span className="text-sm font-medium text-slate-900">{order.material_type}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Weight</span>
                  <span className="text-sm font-medium text-slate-900">{order.weight}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Vehicle Type</span>
                  <span className="text-sm font-medium text-slate-900">{order.vehicle_type}</span>
                </div>
                {order.wheel_type && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Wheel Type</span>
                    <span className="text-sm font-medium text-slate-900">{order.wheel_type}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Contact</span>
                  <span className="text-sm font-medium text-slate-900">{order.contact_number}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Driver</span>
                  <span className="text-sm font-medium text-slate-900">{driverName}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
                {isAdmin && remainingBalance > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Add Payment</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-green-900">Advance Payment</p>
                      <p className="text-xs text-green-700">Initial payment</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">₹{order.advance}</p>
                  </div>
                </div>

                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Balance Payment</p>
                        <p className="text-xs text-slate-500">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">₹{payment.amount}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="capitalize">{payment.payment_method}</span>
                      {payment.notes && <span className="italic">{payment.notes}</span>}
                    </div>
                  </div>
                ))}

                {payments.length === 0 && order.balance_paid === 0 && (
                  <p className="text-center text-slate-500 py-4 text-sm">No balance payments yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">₹{order.amount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Paid</span>
                  <span className="text-lg font-semibold text-green-600">₹{totalPaid}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Balance Due</span>
                  <span className="text-lg font-semibold text-orange-600">₹{remainingBalance}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Payment Progress</span>
                  <span>{paymentProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      paymentProgress === 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${paymentProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className={`mt-4 p-3 rounded-lg ${
                order.payment_status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : order.payment_status === 'partial'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <p className={`text-sm font-medium ${
                  order.payment_status === 'completed'
                    ? 'text-green-800'
                    : order.payment_status === 'partial'
                    ? 'text-yellow-800'
                    : 'text-orange-800'
                }`}>
                  Status: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Order Created</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {order.completed_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Order Completed</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.completed_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Payment</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  max={remainingBalance}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Maximum: ₹{remainingBalance}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Add any notes"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
