// pages/thank-you.tsx

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ThankYou() {
  const router = useRouter();
  const { session_id, canceled } = router.query;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (session_id) {
      fetch(`/api/get-stripe-session?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          setSession(data.session);
          setLoading(false);
        });
    } else if (canceled) {
      setLoading(false);
    }
  }, [session_id, canceled]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem", fontSize: "1.5rem" }}>
        Loading your order details...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem", fontSize: "1.5rem" }}>
        No order information found.
      </div>
    );
  }

  const productType = session.metadata?.productType;
  const code = session.metadata?.code;
  const imageUrl = session.metadata?.highResImageUrl;

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1 style={{ color: "#3B1B47", fontSize: "2rem" }}>🎉 Thank You for Your Purchase!</h1>

      <p style={{ marginTop: "1rem", fontSize: "1.25rem", color: "#3B1B47" }}>
        Your order has been received successfully.
      </p>

      {/* Show Access Code for all products that have a code */}
      {code && (
        <div style={{ marginTop: "2rem", color: "#3B1B47", fontSize: "1rem" }}>
          <p>
            🎟️ <strong>Your Access Code:</strong> <code>{code}</code>
          </p>
          <p>
            You can use this code anytime at{" "}
            <a
              href="/redeem"
              style={{
                color: "#E84C3D",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
            >
              pipcasso.com/redeem
            </a>{" "}
            to re-download your mosaic for sharing or reprinting!
          </p>
        </div>
      )}

      {/* Download Button only for highres and bundle products */}
      {(productType === "highres" || productType === "bundle") && imageUrl && (
        <div style={{ marginTop: "2rem" }}>
          <a
            href={imageUrl}
            download
            style={{
              padding: "12px 24px",
              backgroundColor: "#E84C3D",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            ⬇️ Download Your High-Res Mosaic
          </a>
        </div>
      )}

      <div style={{ marginTop: "3rem" }}>
        <a
          href="/create"
          style={{
            padding: "10px 20px",
            border: "2px solid #3B1B47",
            color: "#3B1B47",
            borderRadius: "8px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          ➡️ Start a New Mosaic
        </a>
      </div>
    </div>
  );
}
