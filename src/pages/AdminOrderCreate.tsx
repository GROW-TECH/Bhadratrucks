// src/pages/AdminOrderCreate.tsx
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, MapPin, Package, Truck, IndianRupee, Phone } from 'lucide-react';
import LocationSearchInput from '../components/LocationSearchInput';

interface AdminOrderCreateProps {
  admin: any;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdminOrderCreate({ admin, onBack, onSuccess }: AdminOrderCreateProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    pickup_location: "",
    delivery_location: "",
    weight: "",
    material_type: "",
    vehicle_type: "",
    ft:"",
    wheel_type: "",
    amount: "",
    advance: "",
    contact_number: "",
  });

  const vehicleTypes = ['truck', 'tempo', 'mini-truck'];
  const wheelTypes = ['4-wheel', '6-wheel', '10-wheel', '12-wheel', '14-wheel'];
  const materialTypes = [
    'Electronics',
    'Furniture',
    'Construction Materials',
    'Food Items',
    'Clothing',
    'Machinery',
    'Raw Materials',
    'Other'
  ];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.pickup_location ||
      !formData.delivery_location ||
      !formData.weight ||
      !formData.material_type ||
      !formData.vehicle_type ||
      !formData.amount ||
      !formData.contact_number
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.advance && parseFloat(formData.advance) > parseFloat(formData.amount)) {
      alert("Advance cannot be more than total amount");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickup_location: formData.pickup_location,
        delivery_location: formData.delivery_location,
        weight: formData.weight,
        material_type: formData.material_type,
        vehicle_type: formData.vehicle_type,
        ft: formData.ft,
        wheel_type: formData.wheel_type || null,
        amount: parseFloat(formData.amount),
        advance: formData.advance ? parseFloat(formData.advance) : 0,
        contact_number: formData.contact_number,
        status: "pending"
      };

      const resp = await fetch("https://projects.growtechnologies.in/bhadra/api/orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result?.error || "Failed to create order");

      alert("Order created successfully!");

      setFormData({
        pickup_location: "",
        delivery_location: "",
        weight: "",
        material_type: "",
        vehicle_type: "",
        ft:"",
        wheel_type: "",
        amount: "",
        advance: "",
        contact_number: ""
      });

      onSuccess();
    } catch (err) {
      console.error("Create order error:", err);
      alert("Failed to create order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create New Order</h1>
            <p className="text-sm text-slate-500">Submit order details</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Location */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 flex items-center justify-center rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Location Details</h2>
            </div>

            <div className="space-y-4">
              <LocationSearchInput
                label="From Location (Pickup) *"
                value={formData.pickup_location}
                onChange={(v) => setFormData(prev => ({ ...prev, pickup_location: v }))}
                placeholder="Search pickup location"
              />

              <LocationSearchInput
                label="Delivery Location *"
                value={formData.delivery_location}
                onChange={(v) => setFormData(prev => ({ ...prev, delivery_location: v }))}
                placeholder="Search delivery location"
              />
            </div>
          </div>

          {/* Material */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Material Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Weight *</label>
                <input
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Eg: 1 Ton"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Material Type *</label>
                <select
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select material type</option>
                  {materialTypes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Vehicle Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Vehicle Type *</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select vehicle</option>
                  {vehicleTypes.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Wheel Type</label>
                <select
                  name="wheel_type"
                  value={formData.wheel_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select wheels</option>
                  {wheelTypes.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
<div>
  <label className="block text-sm mb-2">Vehicle Feet (ft)</label>
  <input
    name="ft"
    value={formData.ft}
    onChange={handleInputChange}
    className="w-full px-4 py-3 border rounded-lg"
    placeholder="Eg: 14 ft"
  />
</div>

          {/* Payment */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Advance</label>
                <input
                  type="number"
                  name="advance"
                  value={formData.advance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
            </div>

            <label className="block text-sm mb-2">Contact Number *</label>
            <input
              name="contact_number"
              value={formData.contact_number}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-lg"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="10-digit mobile number"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-200 py-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-4 rounded-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
