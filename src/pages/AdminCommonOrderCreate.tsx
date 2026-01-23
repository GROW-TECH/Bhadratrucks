import { useState, FormEvent, ChangeEvent } from "react";
import { ArrowLeft, MapPin, Package, Truck, IndianRupee, Phone, Copy } from "lucide-react";
import LocationSearchInput from "../components/LocationSearchInput";

interface AdminCommonOrderCreateProps {
  admin: any;
  onBack: () => void;
}

export default function AdminCommonOrderCreate({
  admin,
  onBack,
}: AdminCommonOrderCreateProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pickup_location: "",
    delivery_location: "",
    weight: "",
    material_type: "",
    vehicle_type: "",
    truck_type: "",         // open / container
    wheel_type: "",
    ft: "",                 // body length in feet
    trip_date: "",          // yyyy-mm-dd
    amount: "",
    advance: "",
    contact_number: "",
  });

  const vehicleTypes = ["truck", "tempo", "mini-truck"];
  const wheelTypes = ["4-wheel", "6-wheel", "10-wheel", "12-wheel", "14-wheel"];
  const truckBodyTypes = ["open", "container"];
  const materialTypes = [
    "Electronics",
    "Furniture",
    "Construction Materials",
    "Food Items",
    "Clothing",
    "Machinery",
    "Raw Materials",
    "Other",
  ];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.pickup_location ||
      !formData.delivery_location ||
      !formData.weight ||
      !formData.material_type ||
      !formData.vehicle_type ||
      !formData.truck_type ||
      !formData.trip_date ||
      !formData.amount ||
      !formData.contact_number
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.advance && +formData.advance > +formData.amount) {
      alert("Advance cannot be more than total amount");
      return;
    }

    setLoading(true);
    setShareUrl(null);

    try {
      const payload = {
        pickup_location: formData.pickup_location,
        delivery_location: formData.delivery_location,
        weight: formData.weight,
        material_type: formData.material_type,
        vehicle_type: formData.vehicle_type,
        truck_type: formData.truck_type,
        wheel_type: formData.wheel_type || null,
        ft: formData.ft || null,
        trip_date: formData.trip_date,
        amount: parseFloat(formData.amount),
        advance: formData.advance ? parseFloat(formData.advance) : 0,
        contact_number: formData.contact_number,
        // common order – no assigned_to here
      };

      const resp = await fetch(
        "https://projects.growtechnologies.in/bhadra/api/create_common_order.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json().catch(() => ({} as any));

      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Failed to create common order");
      }

      setShareUrl(data.share_url);
      alert("Common order created. Share the link below.");
    } catch (err) {
      console.error("Create common order error:", err);
      alert("Failed to create common order");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    alert("Order link copied");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Common Order</h1>
            <p className="text-sm text-slate-500">Generate sharable order link</p>
          </div>
        </div>
      </header>

      {/* BODY */}
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
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, pickup_location: v }))
                }
                placeholder="Search pickup location"
              />

              <LocationSearchInput
                label="Delivery Location *"
                value={formData.delivery_location}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, delivery_location: v }))
                }
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Weight *
                </label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Material Type *
                </label>
                <select
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  <option value="">Select material type</option>
                  {materialTypes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
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
                <label className="block text-sm mb-2">Date *</label>
                <input
                  type="date"
                  name="trip_date"
                  value={formData.trip_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Vehicle Type *</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicleTypes.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Truck Type (Open / Container) *</label>
                <select
                  name="truck_type"
                  value={formData.truck_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  <option value="">Select truck type</option>
                  {truckBodyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Wheel *</label>
                <select
                  name="wheel_type"
                  value={formData.wheel_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                >
                  <option value="">Select wheels</option>
                  {wheelTypes.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Ft</label>
                <input
                  type="number"
                  name="ft"
                  value={formData.ft}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="ft"
                  min={0}
                />
              </div>
            </div>
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
              className="flex-1 bg-purple-600 text-white py-4 rounded-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create & Get Link"}
            </button>
          </div>
        </form>

        {/* Share section */}
        {shareUrl && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Share this order link
            </h3>
            <div className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 break-all">
              {shareUrl}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white text-sm py-3 rounded-lg"
              >
                <Copy className="w-4 h-4" />
                Copy Order Link
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Load details: ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-3 rounded-lg text-center flex items-center justify-center"
              >
                Share in WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
