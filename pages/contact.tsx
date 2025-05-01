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
            maxWidth: "1000px",
            margin: "auto",
            backgroundColor: "#FDF7F1",
            borderRadius: "16px",
            boxShadow: "0 0 20px rgba(0,0,0,0.08)",
            padding: "2rem",
            color: "#3B1B47",
          }}
        >
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", textAlign: "center", color: "#6A3073" }}>
            📬 Contact Us
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#4b4453", textAlign: "center", marginBottom: "2rem" }}>
            Got questions, custom requests, or need help with your order? Reach out and we’ll get back to you ASAP!
          </p>

          <form style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="name" style={{ display: "block", fontWeight: "500", marginBottom: "0.5rem" }}>Name</label>
              <input
                type="text"
                id="name"
                placeholder="Your Name"
                required
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" style={{ display: "block", fontWeight: "500", marginBottom: "0.5rem" }}>Email</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                required
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="message" style={{ display: "block", fontWeight: "500", marginBottom: "0.5rem" }}>Message</label>
              <textarea
                id="message"
                rows={5}
                placeholder="Type your message..."
                required
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "#E84C3D",
                color: "#fff",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
