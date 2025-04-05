import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ThankYouPage() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { session_id } = router.query;
    if (!session_id) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/get-stripe-session?session_id=${session_id}`);
        const data = await res.json();

        console.log("🎯 Raw response from get-stripe-session:", data);
        console.log("🔍 pdfUrl in response:", data?.metadata?.pdfUrl);

        if (data?.metadata?.pdfUrl) {
          setPdfUrl(data.metadata.pdfUrl);
          setCode(data.code || null);
        } else {
          setPdfUrl(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setPdfUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router.isReady, router.query]);

  return (
    <div
      style={{
        backgroundColor: "#3B1B47", // dark purple background from logo
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#FDF7F1", // cream card background
          borderRadius: "16px",
          padding: "3rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", color: "#E84C3D", marginBottom: "1rem" }}>
          Thank You for Your Purchase!
        </h1>

        {loading ? (
          <p style={{ fontSize: "1.1rem", color: "#444" }}>
            Loading your Dice Map PDF...
          </p>
        ) : pdfUrl ? (
          <>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <button
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.1rem",
                  backgroundColor: "#E84C3D", // brand orange
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginTop: "1rem",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                Download Your Dice Map PDF
              </button>
            </a>

            {code && (
              <div style={{ marginTop: "2rem", color: "#3B1B47", fontSize: "1rem" }}>
                <p>
                  🎟️ <strong>Your Access Code:</strong> <code>{code}</code>
                </p>
                <p>
                  You can use this code at{" "}
                  <a
                    href="/redeem"
                    style={{ color: "#E84C3D", fontWeight: "bold", textDecoration: "underline" }}
                  >
                    pipcasso.com/redeem
                  </a>{" "}
                  to re-download your map anytime.
                </p>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: "1.1rem", color: "#b91c1c" }}>
            We couldn't find your Dice Map. Please contact support with your order details.
          </p>
        )}
      </div>
    </div>
  );
}
