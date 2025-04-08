import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import ReactCompareImage from "react-compare-image";
import Link from "next/link";


export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showNav, setShowNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let latestScrollY = 0;
    let ticking = false;
    let windowHeight = window.innerHeight;

    setIsMobile(window.innerWidth < 768);

    const onScroll = () => {
      latestScrollY = window.scrollY;
      requestTick();
    };

    const onResize = () => {
      windowHeight = window.innerHeight;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    const update = () => {
      ticking = false;
      const slowScroll = latestScrollY / 2;
      const blurOpacity = (latestScrollY * 2) / windowHeight;
      const opacity = 1.4 - latestScrollY / 400;

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${slowScroll}px)`;
        contentRef.current.style.opacity = `${opacity}`;
      }

      if (overlayRef.current) {
        overlayRef.current.style.opacity = `${blurOpacity}`;
      }

      setShowNav(latestScrollY > windowHeight * 0.75);
    };

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div>
      <nav
        style={{
          ...styles.nav,
          transform: showNav ? "translateY(0)" : "translateY(-100%)",
          opacity: showNav ? 1 : 0,
        }}
      >
        <div style={styles.navInner}>
  <img
    src="/images/HeaderLogo.png"
    alt="Pipcasso Logo"
    style={styles.navLogo}
  />

  {isMobile ? (
    <>
      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        style={{
          background: "none",
          border: "none",
          fontSize: "1.75rem",
          color: "#fff",
          cursor: "pointer",
        }}
        aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? "✖" : "☰"}
        </button>

      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            right: 0,
            left: 0,
            backgroundColor: "#000",
            padding: "1rem",
            textAlign: "center",
            zIndex: 999,
          }}
        >
          <Link
          href="/create"
          onClick={() => setMobileMenuOpen(false)}
          style={{ color: "#fff", display: "block", margin: "1rem 0" }}
        >
          Create
        </Link>
        <Link
          href="/commissions"
          onClick={() => setMobileMenuOpen(false)}
          style={{ color: "#fff", display: "block", margin: "1rem 0" }}
        >
          Commissions
        </Link>
        <Link
          href="/store"
          onClick={() => setMobileMenuOpen(false)}
          style={{ color: "#fff", display: "block", margin: "1rem 0" }}
        >
          Store
        </Link>
      </div>
      )}
    </>
  ) : (
    <div style={styles.navLinks}>
      <Link href="/store" style={{ color: "#fff" }}>Create</Link>
      <Link href="/commissions" style={{ color: "#fff" }}>Commissions</Link>
      <Link href="/store" style={{ color: "#fff" }}>Store</Link>
    </div>
  )}
</div>


      </nav>

      <header
        style={{
          height: isMobile ? "50vh" : "100vh",
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
          ref={contentRef}
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
          <h2
  style={{
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: "1rem",
    fontFamily: "'Righteous', sans-serif",
  }}
>
  Create. Assemble. Display.
</h2>

<button
  onClick={() => router.push("/create")}
  style={{
    fontSize: "1rem",
    padding: "0.75rem 2rem",
    backgroundColor: "transparent",
    color: "#fff",
    border: "2px solid #fff",
    borderRadius: "999px", // ✅ pill shape
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
  }}
>
  Create. Assemble. Display.
</button>

        </div>
      </header>

{/* 🔁 Image Reveal Section with Overlayed Top-Centered Heading */}
<div style={{ padding: "0", backgroundColor: "#FDF7F1", position: "relative" }}>
  <div
    style={{
      position: "relative",
      maxWidth: "600px",
      margin: "0 auto",
      height: "auto",
    }}
  >
    {/* Top-Centered Heading */}
    <h2
  style={{
    position: "absolute",
    top: "1rem",
    left: 0,
    right: 0,
    textAlign: "center", // ✅ center the text without transform
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "1.4rem",
    color: "#fff",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
    letterSpacing: "1px",
    zIndex: 2,
    margin: 0,
    padding: "0.25rem 1rem", // ✅ horizontal breathing room
    boxSizing: "border-box", // ✅ respect full width
    whiteSpace: "nowrap", // ✅ prevent line wrapping
    overflow: "hidden",   // ✅ in case it's too long
    textOverflow: "ellipsis", // ✅ gracefully truncate if needed
  }}
>
  See the transformation
</h2>


    {/* Slider */}
    <ReactCompareImage
      leftImage="/dog_real.png"
      rightImage="/dog_dice.png"
      sliderLineColor="#E84C3D"
    />
  </div>
</div>




      
      <section style={{ width: "100%" }}>
      {[
  {
    title: "DIY Kits",
    desc: "Create your own dice mosaic using our software and build it yourself at home!",
    href: "/store",
    img: "/images/DiceKit.png",
    cta: "Create Now →",
    bgColor: "#ECB84A",
  },
  {
    title: "Commissions",
    desc: "Want us to build it for you? Commission a professional dice artist.",
    href: "/commissions",
    img: "/images/DiceCommission.png",
    cta: "Request a Quote →",
    bgColor: "#6A3073",
  },
  {
    title: "Prints",
    desc: "Order custom-printed versions of your mosaic — no dice needed!",
    href: "/create",
    img: "/images/DicePrints.png",
    cta: "View Prints →",
    bgColor: "#155e63",
  },
].map((feature, index) => {
  const isEven = index % 2 === 1;

  return (
    <div
      key={index}
      className={`feature-block ${isEven ? "reverse" : ""}`}
      style={{
        display: "flex",
        flexDirection: isEven ? "row-reverse" : "row",
        flexWrap: "wrap",
        minHeight: "400px",
        backgroundColor: feature.bgColor,
        color: "#FDF7F1",
        width: "100%",
      }}
    >
      {/* Image */}
      <div
        style={{
          flex: "1 1 50%",
          backgroundImage: `url(${feature.img})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "300px",
        }}
      />

      {/* Text */}
      <div
        style={{
          flex: "1 1 50%",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h3 style={{ fontSize: "2rem", marginBottom: "1rem", fontFamily: "'Bebas Neue', sans-serif", textTransform: "uppercase" }}>
          {feature.title}
        </h3>
        <p
  style={{
    fontSize: "1rem",
    lineHeight: "1.6",
    marginBottom: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  }}
>
  At <strong>Pipcasso</strong>, you can turn your favorite photo into a custom dice mosaic. Just upload an image and we’ll generate a downloadable Dice Map — ready to print or build with real dice.
</p>
        <Link
          href={feature.href}
          style={{
            color: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            fontWeight: "bold",
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          {feature.cta}
        </Link>
      </div>
    </div>
  );
})}

</section>

<style jsx>{`
  @media (max-width: 768px) {
    .feature-block,
    .feature-block.reverse {
      flex-direction: column !important;
      min-height: 600px; /* or try 100vh for full-screen feel */
    }

    .feature-block > div {
      flex: none !important;
      width: 100% !important;
    }
  }
`}</style>




    <section style={{ backgroundColor: "#fdf7f1", padding: "4rem 1rem", textAlign: "center" }}>
  <h2
    style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "2.25rem",
      marginBottom: "1rem",
      letterSpacing: "1px",
      color: "#E84C3D",
    }}
  >
    Contact Us
  </h2>
  <p style={{ fontSize: "1rem", color: "#4b5563", maxWidth: "600px", margin: "0 auto 2rem" }}>
    Have questions about a project, commission, or custom idea? Reach out and our team will get back to you within 1 business day.
  </p>

  <a
    href="mailto:commissions@pipcasso.com"
    style={{
      backgroundColor: "#E84C3D",
      color: "#fff",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: "bold",
    }}
  >
    Email Us
  </a>
</section>



      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Pipcasso. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    position: "relative",
    height: "75vh",
    overflow: "hidden",
  },
  splitContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: "2rem",
    width: "100%",
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
    filter: "blur(4px) brightness(0.4)",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1,
  },
  content: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
  },
  hgroup: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    zIndex: 2,
    paddingInline: "1rem",
  },
  imageLogo: {
    maxWidth: "90vw",
    width: "100%",
    marginBottom: "1.5rem",
    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
  },
  button: {
    fontSize: "1.25rem",
    backgroundColor: "#EAAA4F",
    border: "none",
    color: "#fff",
    padding: "0.75rem 2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.2s ease",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "70px",
    backgroundColor: "#000",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    zIndex: 999,
    transition: "transform 0.4s ease, opacity 0.4s ease",
    transform: "translateY(-100%)",
    opacity: 0,
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    padding: "0 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navLogo: {
    height: "40px",
    width: "auto",
  },
  navLinks: {
    display: "flex",
    gap: "1.5rem",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#fff", // ✅ white link text
  },
  
  sideBySide: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: "2rem",
    padding: "4rem 1rem",
    backgroundColor: "#fff",
  },
  sliderSection: {
    textAlign: "center",
    display: "flex",
    alignItems: "stretch",
  },
  sliderWrapper: {
    flex: "0 1 30%",
    minWidth: "300px",
    maxWidth: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    justifyContent: "center",
  },
  featureCard: {
    background: "#f3f4f6",
    padding: "2rem",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  },
  footer: {
    padding: "2rem",
    textAlign: "center",
    backgroundColor: "#000000",
    color: "#fff",
    fontSize: "0.9rem",
  },
};
