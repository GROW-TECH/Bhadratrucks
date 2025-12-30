// src/pages/OrderDetails.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, CheckCircle, CreditCard } from 'lucide-react';

interface OrderDetailsProps {
  orderId: string;
  isAdmin: boolean;
  onBack: () => void;
}

interface Order {
  id: string | number;
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
  payment_status?: string;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string | number;
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
  const [driverReferralBy, setDriverReferralBy] = useState<string | null>(null); // 👈 add this
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const safeJson = async (resp: Response) => {
    const text = await resp.text().catch(() => '');
    try {
      return text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn('safeJson parse failed, raw text:', text);
      return null;
    }
  };

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const ts = Date.now();

      // ---------- ORDER FETCH (fixed) ----------
      const orderResp = await fetch(
        `https://projects.growtechnologies.in/bhadra/api/orders.php?orderId=${encodeURIComponent(
          orderId
        )}&_=${ts}`
      );

      if (!orderResp.ok) {
        const txt = await orderResp.text().catch(() => '');
        console.error('orders.php returned non-OK:', orderResp.status, txt);
        throw new Error(`Order fetch failed: ${orderResp.status}`);
      }

      const json = await safeJson(orderResp);
      let orderData: any = json;

      // if PHP returns array, find the correct order by id instead of taking [0]
      if (Array.isArray(orderData)) {
        orderData =
          orderData.find((o: any) => String(o.id) === String(orderId)) ?? null;
      }

      if (!orderData || !('id' in orderData)) {
        console.error('Order not found in response:', orderData);
        alert('Order not found');
        onBack();
        return;
      }

      // ensure numeric fields are numbers
      const normalizedOrder: Order = {
        ...orderData,
        id: orderData.id,
        amount: Number(orderData.amount) || 0,
        advance: Number(orderData.advance) || 0,
        balance_paid: Number(orderData.balance_paid) || 0,
        created_at: orderData.created_at || new Date().toISOString(),
        updated_at: orderData.updated_at || new Date().toISOString(),
        completed_at: orderData.completed_at ?? null,
        assigned_to: orderData.assigned_to ?? null
      };

      setOrder(normalizedOrder);

      // ---------- DRIVER FETCH (safer) ----------
      if (normalizedOrder.assigned_to) {
        const userTs = Date.now();
        try {
          const allUsersResp = await fetch(
            `https://projects.growtechnologies.in/bhadra/api/users.php?_=${userTs}`
          );
          const allUsersJson = await safeJson(allUsersResp);

          const usersArray = Array.isArray(allUsersJson)
            ? allUsersJson
            : Array.isArray(allUsersJson?.users)
            ? allUsersJson.users
            : [];

          const found = usersArray.find(
            (u: any) =>
              String(u.id).trim() ===
              String(normalizedOrder.assigned_to).trim()
          );

          const driver =
            found?.full_name || found?.name || found?.username || 'Unassigned';

          setDriverName(driver);
        } catch (err) {
          console.warn('Driver fetch failed', err);
          setDriverName('Unassigned');
        }
      } else {
        setDriverName('Unassigned');
      }
      // get driver referred_by code (like 74C52518)
      if (normalizedOrder.assigned_to) {
        try {
          const refResp = await fetch(
            `https://projects.growtechnologies.in/bhadra/api/user_referral.php?userId=${encodeURIComponent(
              normalizedOrder.assigned_to
            )}&_=${Date.now()}`
          );

          if (refResp.ok) {
            const refJson: any = await safeJson(refResp);
            setDriverReferralBy(refJson?.referred_by ?? null);
          } else {
            setDriverReferralBy(null);
          }
        } catch (err) {
          console.warn('user_referral.php fetch failed', err);
          setDriverReferralBy(null);
        }
      } else {
        setDriverReferralBy(null);
      }

      // ---------- PAYMENTS ----------
      try {
        const paymentsResp = await fetch(
          `https://projects.growtechnologies.in/bhadra/api/payments.php?orderId=${encodeURIComponent(
            orderId
          )}&_=${Date.now()}`
        );
        const paymentsJson = await safeJson(paymentsResp);
        if (Array.isArray(paymentsJson)) setPayments(paymentsJson);
        else if (paymentsJson && Array.isArray(paymentsJson.data))
          setPayments(paymentsJson.data);
        else setPayments([]);
      } catch (err) {
        console.warn('Payments fetch failed', err);
        setPayments([]);
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      alert(`Failed to load order details: ${error?.message ?? error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const paymentAmount = parseFloat(paymentForm.amount as string);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const totalPaid =
      (order.advance || 0) + (order.balance_paid || 0) + paymentAmount;
    if (totalPaid > (order.amount || 0)) {
      alert('Payment amount exceeds order total');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/payments.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: paymentAmount,
            payment_method: paymentForm.payment_method,
            notes: paymentForm.notes,
            payment_type: 'balance'
          })
        }
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to add payment');
      }

      const newBalancePaid = (order.balance_paid || 0) + paymentAmount;
      const newPaymentStatus =
        ((order.advance || 0) + newBalancePaid) >= (order.amount || 0)
          ? 'completed'
          : 'partial';

      const updateResp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/update_order.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            balance_paid: newBalancePaid,
            payment_status: newPaymentStatus,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!updateResp.ok) {
        const body = await updateResp.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to update order after payment');
      }

      // If payment is now completed, credit diesel wallet to referrer
      if (newPaymentStatus === 'completed') {
        try {
          await fetch(
            'https://projects.growtechnologies.in/bhadra/api/referral_diesel_reward.php',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id })
            }
          );
        } catch (err) {
          console.warn('Referral diesel reward failed', err);
          // we ignore failure here so payment flow still works
        }
      }


      setPaymentForm({ amount: '', payment_method: 'cash', notes: '' });
      setShowPaymentModal(false);
      await fetchOrderDetails();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;

    const totalPaid = (order.advance || 0) + (order.balance_paid || 0);
    if (totalPaid < (order.amount || 0)) {
      alert('Cannot complete order: Payment not fully received');
      return;
    }

    if (!confirm('Mark this order as completed?')) return;

    setSubmitting(true);
    try {
      const resp = await fetch(
        'https://projects.growtechnologies.in/bhadra/api/update_order.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to complete order');
      }

      await fetchOrderDetails();
      alert('Order marked as completed!');
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order');
    } finally {
      setSubmitting(false);
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

  const totalPaid = (order.advance || 0) + (order.balance_paid || 0);
  const remainingBalance = Math.max(
    0,
    (order.amount || 0) - totalPaid
  );
  const paymentProgress =
    order.amount && order.amount > 0
      ? (totalPaid / order.amount) * 100
      : 0;

  const displayStatus = String(order.payment_status ?? 'pending').toLowerCase();

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
                <h1 className="text-xl font-bold text-slate-900">
                  Order Details
                </h1>
                <p className="text-sm text-slate-500">
                  Order ID: {String(order.id).substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {order.status === 'completed' ? (
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </span>
              ) : (
                isAdmin &&
                displayStatus === 'completed' && (
                  <button
                    onClick={handleCompleteOrder}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    disabled={submitting}
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Locations
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Pickup Location
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {order.pickup_location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Delivery Location
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {order.delivery_location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Order Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Material</span>
                  <span className="text-sm font-medium text-slate-900">
                    {order.material_type}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Weight</span>
                  <span className="text-sm font-medium text-slate-900">
                    {order.weight}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Vehicle Type</span>
                  <span className="text-sm font-medium text-slate-900">
                    {order.vehicle_type}
                  </span>
                </div>
                {order.wheel_type && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Wheel Type</span>
                    <span className="text-sm font-medium text-slate-900">
                      {order.wheel_type}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Contact</span>
                  <span className="text-sm font-medium text-slate-900">
                    {order.contact_number}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Driver</span>
                  <span className="text-sm font-medium text-slate-900">
                    {driverName}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment History
                </h2>
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
                      <p className="text-sm font-medium text-green-900">
                        Advance Payment
                      </p>
                      <p className="text-xs text-green-700">Initial payment</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      ₹{order.advance}
                    </p>
                  </div>
                </div>

                {payments.map((payment) => (
                  <div
                    key={String(payment.id)}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Balance Payment
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(
                            payment.payment_date
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        ₹{payment.amount}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="capitalize">
                        {payment.payment_method}
                      </span>
                      {payment.notes && (
                        <span className="italic">{payment.notes}</span>
                      )}
                    </div>
                  </div>
                ))}

                {payments.length === 0 && order.balance_paid === 0 && (
                  <p className="text-center text-slate-500 py-4 text-sm">
                    No balance payments yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Payment Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{order.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Paid</span>
                  <span className="text-lg font-semibold text-green-600">
                    ₹{totalPaid}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Balance Due</span>
                  <span className="text-lg font-semibold text-orange-600">
                    ₹{remainingBalance}
                  </span>
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

              <div
                className={`mt-4 p-3 rounded-lg ${
                  displayStatus === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : displayStatus === 'partial'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    displayStatus === 'completed'
                      ? 'text-green-800'
                      : displayStatus === 'partial'
                      ? 'text-yellow-800'
                      : 'text-orange-800'
                  }`}
                >
                  Status:{' '}
                  {displayStatus.charAt(0).toUpperCase() +
                    displayStatus.slice(1)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Timeline
              </h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Order Created
                    </p>
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
                      <p className="text-sm font-medium text-slate-900">
                        Order Completed
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(
                          order.completed_at
                        ).toLocaleDateString('en-IN', {
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
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Add Payment
            </h3>
            {driverReferralBy && (
        <p className="text-sm text-slate-500 mb-3">
          Referred by:{' '}
          <span className="font-mono font-medium">{driverReferralBy}</span>
        </p>
      )}
            <form onSubmit={handleAddPayment} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  max={remainingBalance}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Maximum: ₹{remainingBalance}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value
                    })
                  }
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
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
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
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
