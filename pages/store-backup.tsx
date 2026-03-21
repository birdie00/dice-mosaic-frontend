import { useState } from "react";
import Layout from "@/components/Layout";

export default function StorePage() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const kits = [
    { size: "10mm", price: 59999, label: "$599.99" },
    { size: "8mm", price: 49999, label: "$499.99" },
  ];

  const handleCheckout = async (kit: { size: string; price: number }, index: number) => {
    setLoadingIndex(index);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: "kit",
          kitSize: kit.size,
          quantity: 1,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout session failed.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Something went wrong.");
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <Layout>
      <div
        style={{
          backgroundColor: "#ECB84A",
          padding: "2rem 1rem",
          minHeight: "100vh",
          color: "#1F2937",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 0 20px rgba(0,0,0,0.08)",
            padding: "2rem",
            color: "#3B1B47",
          }}
        >
          <section style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#BF4F31" }}>
              🧰 DIY Dice Mosaic Kits
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#444", maxWidth: "700px", margin: "0 auto" }}>
              Create your own mosaic masterpiece at home with our all-in-one kits. Each kit includes the correct number of dice, a sturdy frame, and your personalized Dice Map — generated with our proprietary software.
            </p>
          </section>

          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center", color: "#BF4F31" }}>
              Choose Your Kit
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
              {kits.map((kit, i) => (
                <div
                  key={i}
                  style={{
                    flex: "0 0 280px",
                    backgroundColor: "#FDF7F1",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ color: "#BF4F31" }}>{kit.size} Dice Kit</h3>
                  <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#1C4C54" }}>
                    {kit.label}
                  </p>
                  <p style={{ marginBottom: "1rem" }}>
                    Includes dice, custom frame, and your unique Dice Map.
                  </p>
                  <button
                    onClick={() => handleCheckout(kit, i)}
                    disabled={loadingIndex === i}
                    style={{
                      backgroundColor: "#E84C3D",
                      color: "#fff",
                      border: "none",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      cursor: loadingIndex === i ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {loadingIndex === i ? "Processing..." : "Order Now"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
