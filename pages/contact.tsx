import Layout from "@/components/Layout";

export default function Contact() {
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
            maxWidth: "800px",
            margin: "auto",
            backgroundColor: "#FDF7F1",
            borderRadius: "16px",
            boxShadow: "0 0 20px rgba(0,0,0,0.08)",
            padding: "2rem",
            color: "#3B1B47",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#6A3073" }}>
            📬 Contact Us
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#4b4453", marginBottom: "2rem" }}>
            Got questions, custom requests, or need help with your order?
          </p>
          <p style={{ fontSize: "1.25rem" }}>
            Email us directly at:{" "}
            <a href="mailto:hello@pipcasso.com" style={{ color: "#E84C3D", fontWeight: "bold" }}>
              hello@pipcasso.com
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
