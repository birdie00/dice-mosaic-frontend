import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function CommissionsPage() {
  return (
    <Layout>
      <div
        style={{
          backgroundColor: "#6A3073",
          padding: "2rem 1rem",
          minHeight: "100vh",
          color: "#FDF7F1",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
            backgroundColor: "#FDF7F1",
            borderRadius: "16px",
            boxShadow: "0 0 20px rgba(0,0,0,0.08)",
            padding: "2rem",
            color: "#3B1B47",
          }}
        >
          {/* Hero Section */}
          <section style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#6A3073" }}>
              🎨 Commission a Custom Dice Mosaic
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#4b4453", maxWidth: "600px", margin: "0 auto" }}>
              Let a Pipcasso artist transform your favorite photo into a stunning mosaic made entirely from dice.
              Each piece is handcrafted and made to order — perfect for gifts, collectors, or bold home décor.
            </p>
          </section>

          {/* How It Works */}
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center", color: "#6A3073" }}>
              How It Works
            </h2>
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "2rem" }}>
              {[
                {
                  title: "Upload Your Photo",
                  description: "Choose a photo and send it to us for review and mockup approval.",
                },
                {
                  title: "We Build It",
                  description: "Our artists create your mosaic with real dice, arranged by hand to match your image.",
                },
                {
                  title: "Shipped to You",
                  description: "We pack and deliver your finished mosaic — ready to display right out of the box.",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "2rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    flex: "1 1 250px",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ color: "#6A3073" }}>{`${index + 1}. ${step.title}`}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section style={{ textAlign: "center", margin: "3rem 0" }}>
            <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
              Ready to bring your idea to life?
            </p>
            <Link href="/contact">
              <button
                style={{
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  backgroundColor: "#E84C3D",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Request a Quote
              </button>
            </Link>
          </section>

          {/* Contact Section */}
          <section
            style={{
              textAlign: "center",
              padding: "2rem 0",
              fontSize: "1rem",
              color: "#374151",
            }}
          >
            <p>
              Want to talk to a real human? <br />
              Email us directly at{" "}
              <a href="mailto:commissions@pipcasso.com">commissions@pipcasso.com</a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
