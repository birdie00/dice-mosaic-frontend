import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import ReactCompareImage from "react-compare-image";
import Layout from "@/components/Layout";

// ── Brand tokens ────────────────────────────────────────────────────────────
const CREAM   = "#FDF7F1";
const TEAL    = "#155e63";
const TEAL_LT = "#1a7a80";
const RED     = "#E84C3D";
const GOLD    = "#ECB84A";
const PURPLE  = "#6A3073";
const DARK    = "#0e0e0e";
const MUTED   = "#5a5a5a";
const WHITE   = "#ffffff";
const BORDER  = "#e2d9ce";

// ── Shared button styles ─────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "0.85rem 2rem",
  backgroundColor: RED,
  color: WHITE,
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "1rem",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "background 0.2s",
};
const btnOutline: React.CSSProperties = {
  display: "inline-block",
  padding: "0.85rem 2rem",
  backgroundColor: "transparent",
  color: WHITE,
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "1rem",
  textDecoration: "none",
  border: `2px solid ${WHITE}`,
  cursor: "pointer",
};

// ── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: "1.1rem 0",
        cursor: "pointer",
      }}
      onClick={() => setOpen((v) => !v)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: DARK }}>{q}</span>
        <span style={{ fontSize: "1.2rem", color: RED, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <p style={{ marginTop: "0.75rem", color: MUTED, lineHeight: 1.7, fontSize: "0.95rem" }}>{a}</p>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
const hero = (
  <section
    style={{
      height: "100vh",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <video
      autoPlay
      muted
      loop
      playsInline
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 0,
      }}
      src="/videos/dice-falling.mp4"
    />

    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 1,
      }}
    />

    <div
      style={{
        position: "relative",
        zIndex: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <img
        src="/images/HeaderLogo.png"
        alt="Pipcasso Logo"
        style={{
          width: "100%",
          maxWidth: "100%",
          objectFit: "contain",
          marginBottom: "1.25rem",
        }}
      />

      <p
        style={{
          color: WHITE,
          fontSize: "1.1rem",
          letterSpacing: "0.08em",
          textAlign: "center",
          marginBottom: "1.5rem",
          fontFamily: "'Righteous', sans-serif",
        }}
      >
        America&apos;s #1 Custom Dice Mosaic Company
      </p>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/create" style={btnPrimary}>
          Create Yours Now
        </Link>
        <a href="#how-it-works" style={btnOutline}>
          See How It Works
        </a>
      </div>
    </div>
  </section>
);

export default function HomepageV2() {
  return (
    <Layout hero={hero}>
      <Head>
        <title>Pipcasso — Turn Any Photo Into a Dice Mosaic</title>
        <meta name="description" content="America's #1 custom dice mosaic company. Instant digital delivery. Color-guided building tools included." />
      </Head>

      {/* ── TRANSFORMATION SLIDER + INTRO TEXT ──────────────────────────── */}
      <section style={{ backgroundColor: CREAM, padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="slider-layout">

            {/* Left: Slider */}
            <div className="slider-col">
              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                <ReactCompareImage
                  leftImage="/dog_real.png"
                  rightImage="/dog_dice.png"
                  sliderLineColor={RED}
                />
              </div>
              <p style={{ marginTop: "0.75rem", color: MUTED, fontSize: "0.85rem", textAlign: "center" }}>
                Drag the slider to reveal the transformation
              </p>
            </div>

            {/* Right: Descriptive text */}
            <div className="text-col">
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: DARK,
                  letterSpacing: "1px",
                  lineHeight: 1.1,
                  marginBottom: "1.25rem",
                }}
              >
                Dice Art. Reimagined.
              </h2>
              <p style={{ color: MUTED, fontSize: "1rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                At Pipcasso, we transform any photo into a stunning mosaic made from thousands of dice.
                Whether it&apos;s a portrait, a pet, a logo, or a cherished memory — our generator instantly maps
                your image into a buildable dice masterpiece. See what your photo looks like as a dice mosaic in seconds.
              </p>
              <Link href="/create" style={btnPrimary}>
                Start Creating →
              </Link>
            </div>

          </div>
        </div>

        <style jsx>{`
          .slider-layout {
            display: flex;
            gap: 3rem;
            align-items: center;
          }
          .slider-col {
            flex: 1 1 50%;
            min-width: 0;
          }
          .text-col {
            flex: 1 1 50%;
            min-width: 0;
          }
          @media (max-width: 768px) {
            .slider-layout {
              flex-direction: column;
            }
          }
        `}</style>
      </section>

      {/* ── IMAGE SCROLLER ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: DARK, overflow: "hidden", padding: "2.5rem 0" }}>
        <div className="scroller-track">
          {[
            "/images/scroller/dog.jpg",
            "/images/scroller/lioness.jpg",
            "/images/scroller/logo1.jpg",
            "/images/scroller/logo2.jpg",
            "/images/scroller/marilyn.jpg",
            "/images/scroller/mj.jpg",
            "/images/scroller/tiger.jpg",
            "/images/scroller/usa.jpg",
            "/images/scroller/yoda.jpg",
            "/images/scroller/dog.jpg",
            "/images/scroller/lioness.jpg",
            "/images/scroller/logo1.jpg",
            "/images/scroller/logo2.jpg",
            "/images/scroller/marilyn.jpg",
            "/images/scroller/mj.jpg",
            "/images/scroller/tiger.jpg",
            "/images/scroller/usa.jpg",
            "/images/scroller/yoda.jpg",
          ].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              style={{
                width: 220,
                height: 280,
                objectFit: "cover",
                borderRadius: 10,
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        <style jsx>{`
          @keyframes scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .scroller-track {
            display: flex;
            gap: 16px;
            width: max-content;
            animation: scroll 30s linear infinite;
          }
          .scroller-track:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ backgroundColor: DARK, color: WHITE, padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: RED, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Simple Process
          </p>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              marginBottom: "3.5rem",
              letterSpacing: "1px",
            }}
          >
            How It Works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              {
                step: "01",
                icon: "📸",
                title: "Upload Your Photo",
                desc: "Choose any photo — a portrait, pet, landscape, or logo. Our tool handles the rest.",
              },
              {
                step: "02",
                icon: "🎨",
                title: "Choose Your Style & Size",
                desc: "Pick from 6 mosaic styles and select your grid size. Preview the result instantly.",
              },
              {
                step: "03",
                icon: "📦",
                title: "Download, Build, or Ship",
                desc: "Get your blueprint instantly, order a framed print, or have a professional build it for you.",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: "2rem 1.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-1rem",
                    left: "1.5rem",
                    backgroundColor: RED,
                    color: WHITE,
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: 6,
                    letterSpacing: 1,
                  }}
                >
                  Step {item.step}
                </div>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", marginTop: "0.5rem" }}>{item.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: WHITE, marginBottom: "0.6rem" }}>{item.title}</h3>
                <p style={{ color: "#bbb", fontSize: "0.9rem", lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "3rem" }}>
            <Link href="/create" style={btnPrimary}>
              Get Started — It&apos;s Free to Try
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. BUILD MODE SHOWCASE ──────────────────────────────────────── */}
      <section style={{ backgroundColor: DARK, color: WHITE, padding: "5rem 1.5rem" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          {/* Text side */}
          <div>
            <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Exclusive Feature
            </p>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                marginBottom: "1.25rem",
                letterSpacing: "1px",
                lineHeight: 1.1,
              }}
            >
              Build With Confidence
            </h2>
            <p style={{ color: "#ccc", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "0.97rem" }}>
              Every Dice Map purchase includes access to our exclusive{" "}
              <strong style={{ color: WHITE }}>Build Mode</strong> — a free interactive tool that turns
              your blueprint into a step-by-step digital guide. Think of it like a GPS for your mosaic.
              It tells you exactly which die to place next, tracks your progress, and lets you jump to any
              row instantly. No guessing, no losing your place.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "Cell-by-cell guidance — one die at a time",
                "Switch between number view and dice face view",
                "Jump to any row instantly",
                "Tracks your progress automatically",
                "Works perfectly on mobile while you build",
              ].map((pt) => (
                <li key={pt} style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#ddd", fontSize: "0.95rem" }}>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: "1.1rem" }}>✓</span>
                  {pt}
                </li>
              ))}
            </ul>
            <Link href="/build" style={{ ...btnPrimary, backgroundColor: GOLD, color: DARK }}>
              Try Build Mode
            </Link>
          </div>

          {/* Mockup side */}
          <div
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #333",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src="/images/build-mode.png"
              alt="Build Mode screenshot"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* ── COMMISSION BANNER ───────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#1a1200",
          borderTop: `1px solid ${GOLD}33`,
          borderBottom: `1px solid ${GOLD}33`,
          padding: "1.1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap" as const,
        }}
      >
        <p style={{ color: GOLD, fontWeight: 600, fontSize: "0.97rem", margin: 0 }}>
          Speak to us about commissioning your own piece
        </p>
        <Link
          href="/commissions"
          style={{
            ...btnPrimary,
            backgroundColor: GOLD,
            color: DARK,
            fontSize: "0.85rem",
            padding: "0.5rem 1.25rem",
            whiteSpace: "nowrap" as const,
          }}
        >
          Commissions →
        </Link>
      </div>

      {/* ── COMMISSIONS ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: DARK, color: WHITE, padding: "5rem 1.5rem" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          {/* Photo */}
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}>
            <img
              src="/images/commission2.jpeg"
              alt="Custom dice mosaic commission"
              style={{ width: "100%", display: "block", objectFit: "cover", aspectRatio: "4/5" }}
            />
          </div>

          {/* Text */}
          <div>
            <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Hand Built By Us
            </p>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                marginBottom: "1.25rem",
                letterSpacing: "1px",
                lineHeight: 1.05,
              }}
            >
              Want the Real Thing?
            </h2>
            <p style={{ color: "#ccc", lineHeight: 1.75, marginBottom: "2rem", fontSize: "0.97rem" }}>
              We hand-build custom dice mosaic pieces for private homes, businesses, and brands. Every piece
              is made from thousands of dice, individually placed by hand. From portraits to logos
              — if you can imagine it, we can build it. Pieces start at $1,000 and are built and shipped
              directly to you.
            </p>
            <Link href="/commissions" style={btnPrimary}>
              Request a Commission →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. WHAT YOU GET ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: WHITE, padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: RED, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Products
          </p>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: DARK,
              textAlign: "center",
              marginBottom: "3rem",
              letterSpacing: "1px",
            }}
          >
            What You Get
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                icon: "🗺️",
                title: "Dice Map",
                desc: "Your photo as a step-by-step building blueprint. Instantly downloadable, printer-ready.",
                price: "From $14.99",
                href: "/create",
                cta: "Create Now",
                accent: TEAL,
              },
              {
                icon: "🖼️",
                title: "Framed Print",
                desc: "A stunning framed print of your dice mosaic portrait. Arrives ready to hang.",
                price: "From $59.99",
                href: "/create",
                cta: "Order Print",
                accent: GOLD,
              },
              {
                icon: "🎨",
                title: "Commission",
                desc: "Let us build it for you. A professional dice artist creates your mosaic and ships it to your door.",
                price: "Custom quote",
                href: "/commissions",
                cta: "Request Quote",
                accent: RED,
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: CREAM,
                  borderRadius: 14,
                  padding: "2rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>{card.icon}</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: card.accent, marginBottom: "0.5rem", letterSpacing: "0.5px" }}>
                  {card.title}
                </h3>
                <p style={{ color: MUTED, fontSize: "0.92rem", lineHeight: 1.6, flexGrow: 1, marginBottom: "1.25rem" }}>
                  {card.desc}
                </p>
                <div style={{ fontWeight: 700, color: DARK, fontSize: "1rem", marginBottom: "1rem" }}>
                  {card.price}
                </div>
                <Link
                  href={card.href}
                  style={{
                    ...btnPrimary,
                    backgroundColor: card.accent,
                    textAlign: "center",
                    fontSize: "0.9rem",
                    padding: "0.6rem 1.25rem",
                  }}
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. WHY PIPCASSO ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: TEAL, color: WHITE, padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Why Choose Us
          </p>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              marginBottom: "3rem",
              letterSpacing: "1px",
            }}
          >
            Why Pipcasso
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
              textAlign: "left",
            }}
          >
            {[
              { icon: "🇺🇸", title: "USA-Based Company", desc: "Designed, built, and supported right here in America." },
              { icon: "⚡", title: "Instant Digital Delivery", desc: "Your dice map is ready to download the moment you pay." },
              { icon: "🎨", title: "Color-Coded Building Guide", desc: "Standard black & white dice with full-color visual guidance for every step." },
              { icon: "🔧", title: "Exclusive Build Mode Tool", desc: "A step-by-step digital assistant included with every Dice Map purchase." },
              { icon: "💰", title: "Every Budget Covered", desc: "From $14.99 dice maps to custom commissioned pieces — something for everyone." },
              { icon: "📄", title: "Professional Quality Blueprints", desc: "Print-ready, labeled maps with row and column guides for flawless building." },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "1.4rem 1.5rem",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.97rem", marginBottom: "0.3rem" }}>{item.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ──────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: WHITE, padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: RED, fontWeight: 700, letterSpacing: 3, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            FAQ
          </p>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: DARK,
              textAlign: "center",
              marginBottom: "3rem",
              letterSpacing: "1px",
            }}
          >
            Common Questions
          </h2>

          <FaqItem
            q="What kind of dice are used?"
            a="Standard 16mm black & white pips dice. The color you see in the mosaic preview and blueprint is a visual guide only — every die in the actual build is black and white."
          />
          <FaqItem
            q="How big can my mosaic be?"
            a="Our standard sizes go up to 120×120 dice, which creates a large-format piece. Custom sizes are available for commission orders."
          />
          <FaqItem
            q="How does Build Mode work?"
            a="After purchase, enter your access code at pipcasso.com/build. The tool loads your mosaic grid and guides you cell by cell. You can view dice images or numbers, jump to any row, and track your progress — all from your phone or computer."
          />
          <FaqItem
            q="Can I commission a custom piece?"
            a="Yes! Our professional dice artists can build any size mosaic and ship it framed to your door. Visit the Commissions page to get a quote."
          />
          <FaqItem
            q="How long does delivery take?"
            a="Digital products (dice map blueprint, Build Mode access) are instant. Framed prints ship within 5–7 business days. Commission pieces are quoted individually based on complexity and size."
          />
        </div>
      </section>

      {/* ── 8. FOOTER CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: DARK,
          color: WHITE,
          padding: "5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎲</div>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            marginBottom: "1rem",
            letterSpacing: "1px",
          }}
        >
          Ready to Create Yours?
        </h2>
        <p style={{ color: "#aaa", fontSize: "1rem", marginBottom: "2.5rem", maxWidth: 480, margin: "0 auto 2.5rem" }}>
          Upload a photo and see your dice mosaic preview in seconds. No account required.
        </p>
        <Link
          href="/create"
          style={{
            ...btnPrimary,
            fontSize: "1.15rem",
            padding: "1rem 2.75rem",
            borderRadius: 10,
          }}
        >
          Start Creating — Free
        </Link>
      </section>
    </Layout>
  );
}
