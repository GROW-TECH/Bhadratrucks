import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";

interface Props {
  order: any;
  vehicleNumber?: string;
  onClick: () => void;
}

export default function OrderShareCard({
  order,
  vehicleNumber,
  onClick,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [callNumber, setCallNumber] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
const [loggedUser, setLoggedUser] = useState<any>(null);
const canShowContact =
  loggedUser &&
  (
    // PREMIUM → always show
    loggedUser.membership_type === "premium" ||

    // ELITE 4-wheel → show only if approved
    (
      loggedUser.membership_type === "elite" &&
      loggedUser.wheel_type === "4-wheel" &&
      Number(loggedUser.admin_approval) === 1
    ) ||

    // ELITE but not 4-wheel → show
    (
      loggedUser.membership_type === "elite" &&
      loggedUser.wheel_type !== "4-wheel"
    )
  );


  /* ⏰ 24 hours expiry */
const createdAt = order?.created_at
  ? new Date(order.created_at.replace(" ", "T")).getTime()
  : 0;

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const isExpired = Date.now() - createdAt > TWENTY_FOUR_HOURS;


  /* 📞 CALL NUMBER (PER ORDER – RANDOM) */
  useEffect(() => {
    if (!vehicleNumber) {
      setCallNumber(null);
      return;
    }

    fetch("https://projects.growtechnologies.in/bhadra/api/users.php")
      .then((res) => res.json())
      .then((users) => {
        const loggedUser = users.find(
          (u: any) =>
            u.vehicle_number &&
            u.vehicle_number.toLowerCase() ===
              vehicleNumber.toLowerCase()
        );
setLoggedUser(loggedUser);

        console.log("👤 MATCHED USER:", loggedUser);

        if (
          !loggedUser ||
          (
            loggedUser.wheel_type === "4-wheel" &&
            loggedUser.membership_type === "elite" &&
            Number(loggedUser.admin_approval) !== 1
          )
        ) {
          setCallNumber(null);
          return null;
        }

        return fetch(
          `https://projects.growtechnologies.in/bhadra/api/fetch_callnumbers.php?user_id=${loggedUser.id}&order=${order?.id}&t=${Date.now()}`
        );
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data?.success && data.callnumber) {
          setCallNumber(data.callnumber);
        } else {
          setCallNumber(null);
        }
      })
      .catch(() => setCallNumber(null));
  }, [vehicleNumber, order?.id]);

  /* 🖼️ SHARE IMAGE */
  const handleShareImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSharing(true);

    try {
      if (!cardRef.current) return;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        ignoreElements: (el) =>
          el.classList.contains("hide-share-button") ||
          el.classList.contains("hide-on-share"),
      });

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      const topSpace = 70;
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + topSpace;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      ctx.fillStyle = "#FFF7CC";
      ctx.fillRect(0, 0, finalCanvas.width, topSpace);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Bhadra Trucks",
        finalCanvas.width / 2,
        topSpace / 2
      );

      ctx.drawImage(canvas, 0, topSpace);

      const blob = await new Promise<Blob | null>((res) =>
        finalCanvas.toBlob(res, "image/png")
      );

      if (!blob) return;

      const file = new File([blob], "order.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("❌ Image share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  /* 📋 COPY TEXT */
  const handleCopyOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const text = `
Order Details:
Order No: ${order.id}
Date: ${order.created_at}
Amount: ₹${order.amount}
Advance: ₹${order.advance}
Pickup: ${order.pickup_location}
Delivery: ${order.delivery_location}
Material: ${order.material_type}
Weight: ${order.weight}
Vehicle: ${order.vehicle_type}
type: ${order.truck_type}
Wheel: ${order.wheel_type}
${canShowContact ? `number:${order.contact_number}` : ""}
${callNumber ? `Call: ${callNumber}` : ""}
`;

    await navigator.clipboard.writeText(text);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };
// Premium users should NOT see 4-wheel orders
if (
  loggedUser &&
  loggedUser.membership_type === "premium" &&
  order?.wheel_type === "4-wheel"
) {
  return null;
}

  if (isExpired) return null;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="border rounded-xl p-4 shadow-sm cursor-pointer bg-yellow-50 border-yellow-400"
    >
      <div className="flex justify-between mb-2">
        <div>
          <p className="font-semibold">₹{order.amount}</p>
          <p className="text-xs text-slate-500">
            Advance: ₹{order.advance}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100">
          {order.status}
        </span>
      </div>

      <div className="text-sm space-y-1">
        <p><b>Order No:</b> {order.id}</p>
        <p><b>Date:</b> {order.created_at}</p>
        <p><b>Pickup:</b> {order.pickup_location}</p>
        <p><b>Delivery:</b> {order.delivery_location}</p>
        <p><b>Material:</b> {order.material_type}</p>
        <p><b>Weight:</b> {order.weight}</p>
        <p><b>Vehicle Name:</b> {order.vehicle_type}</p>
        <p><b>Vehicle type:</b> {order.truck_type}</p>
        <p><b>Wheel type:</b> {order.wheel_type}</p>
{canShowContact && (
  <p><b>Contact Number:</b> {order.contact_number}</p>
)}

        {callNumber && (
          <p className="hide-on-share">
            <b>Call:</b> {callNumber}
          </p>
        )}
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={handleShareImage}
          disabled={sharing}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hide-share-button"
        >
          {sharing ? "Sharing..." : "Share Order"}
        </button>

        <button
          onClick={handleCopyOrder}
          className="w-full bg-green-600 text-white py-2 rounded-lg hide-share-button"
        >
          Copy & Share WhatsApp
        </button>
      </div>
    </div>
  );
}
