
import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Pipcasso</title>
        <meta name="description" content="Turn your favorite photos into stunning dice mosaics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header
  style={{
    backgroundColor: "#000",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  }}
>
  {/* Logo */}
  <Link href="/" style={{ display: "flex", alignItems: "center" }}>
  <img
  src="/images/HeaderLogo.png"
  alt="Pipcasso Logo"
  style={{
    height: "40px",
    width: "auto",
    objectFit: "contain",
  }}
/>




  </Link>

  {/* Hamburger toggle */}
  <button
    onClick={() => setMenuOpen((prev) => !prev)}
    style={{
      background: "none",
      border: "none",
      fontSize: "1.75rem",
      color: "#fff",
      cursor: "pointer",
      display: "inline-block",
    }}
    className="mobile-toggle"
    aria-label="Toggle menu"
  >
    {menuOpen ? "✖" : "☰"}
  </button>

  {/* Navigation menu */}
  <nav
    className={`site-nav ${menuOpen ? "open" : ""}`}
    style={{
      display: menuOpen ? "flex" : "none",
      flexDirection: "column",
      position: "absolute",
      top: "70px",
      right: 0,
      backgroundColor: "#000",
      width: "100%",
      textAlign: "center",
      padding: "1rem",
    }}
  >
    <Link href="/create" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.75rem 0" }}>
      Create
    </Link>
    <Link href="/commissions" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.75rem 0" }}>
      Commissions
    </Link>
    <Link href="/store" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.75rem 0" }}>
      DIY Kits
    </Link>
    <Link href="/cart" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.75rem 0" }}>
      🛒 Cart
    </Link>
  </nav>

  <style jsx>{`
    @media (min-width: 768px) {
      .mobile-toggle {
        display: none;
      }
      .site-nav {
        display: flex !important;
        position: static !important;
        flex-direction: row;
        gap: 2rem;
        padding: 0;
        align-items: center;
        background: none !important;
      }
    }
  `}</style>
</header>



      <main>{children}</main>

      <footer style={footerStyle}>
        <p>&copy; {new Date().getFullYear()} Pipcasso. All rights reserved.</p>
      </footer>
    </>
  );
}

const footerStyle: React.CSSProperties = {
  backgroundColor: "#000",
    color: "#fff",
    textAlign: "center",
    padding: "1rem",
    marginTop: "2rem",
    fontSize: "0.9rem",
};
