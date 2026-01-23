import { useEffect, useState } from "react";

interface AddCallNumberProps {
  onBack: () => void;
}

interface CallNumber {
  id: number;
  callnumber: string;
}
// /Users/growtechnologies/Documents/GROWTECHPROJECTS/bhadra/Bhadratrucks/src/pages/AddCallNumber.tsx
export default function AddCallNumber({ onBack }: AddCallNumberProps) {
  const [callnumber, setCallnumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<CallNumber[]>([]);

  const API_URL =
    "https://projects.growtechnologies.in/bhadra/api/add_callnumber.php";
  const DELETE_URL =
    "https://projects.growtechnologies.in/bhadra/api/delete_callnumber.php";

  const fetchNumbers = async () => {
    try {
      const resp = await fetch(API_URL);
      const data = await resp.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callnumber.trim()) return;

    setLoading(true);
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callnumber }),
      });

      const json = await resp.json();
      if (!resp.ok || json.success === false) throw new Error();

      setCallnumber("");
      fetchNumbers();
    } catch {
      alert("Failed to add call number");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this call number?")) return;

    try {
      const resp = await fetch(DELETE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await resp.json();
      if (!resp.ok || json.success === false) throw new Error();

      fetchNumbers();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Call Numbers
          </h1>
          <p className="text-sm text-slate-500">
            Manage customer support call numbers
          </p>
        </div>

        <button
          onClick={onBack}
          className="text-sm px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          ← Back
        </button>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={callnumber}
            onChange={(e) => setCallnumber(e.target.value)}
            placeholder="Enter call number"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            Saved Call Numbers
          </h2>
        </div>

        {list.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No call numbers added yet
          </div>
        ) : (
          <div className="divide-y">
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
              >
                <span className="font-mono text-slate-800">
                  {item.callnumber}
                </span>
<button
  onClick={() => handleDelete(item.id)}
  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
>
  Delete
</button>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
