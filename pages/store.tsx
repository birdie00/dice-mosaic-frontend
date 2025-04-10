import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function StorePage() {
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

          {/* Kits Section */}
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center", color: "#BF4F31" }}>Choose Your Kit</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
              {["10mm", "8mm"].flatMap((size) => [
                { size, dims: "100x100" },
                { size, dims: "80x80" },
              ]).map((kit, i) => (
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
                  <p style={{ fontSize: "0.95rem" }}>Dimensions: {kit.dims}</p>
                  <p style={{ marginBottom: "1rem" }}>
                    Includes dice, custom frame, and your unique Dice Map.
                  </p>
                  <button
                    style={{
                      backgroundColor: "#E84C3D",
                      color: "#fff",
                      border: "none",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Order Now
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Apparel & Extras */}
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem", textAlign: "center", color: "#BF4F31" }}>
              🎽 Apparel, Stickers & More
            </h2>
            <p style={{ textAlign: "center", marginBottom: "2rem", maxWidth: "700px", marginInline: "auto" }}>
              Show off your Pipcasso pride with custom gear! Browse our limited-run designs and accessories.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
              {["shirt", "sticker", "hat"].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: "220px",
                    backgroundColor: "#ffffff",
                    padding: "1rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    textAlign: "center",
                  }}
                >
                  <Image
                    src={`/store/${item}.jpg`}
                    alt={item}
                    width={200}
                    height={200}
                    style={{ borderRadius: "8px", marginBottom: "1rem" }}
                  />
                  <h4 style={{ color: "#BF4F31" }}>{item.charAt(0).toUpperCase() + item.slice(1)}</h4>
                  <button
                    style={{
                      marginTop: "0.5rem",
                      backgroundColor: "#BF4F31",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Shop
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