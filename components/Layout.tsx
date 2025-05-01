
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

  {/* Desktop Nav */}
  <nav className="desktop-nav">
    <Link href="/create" style={{ color: "#fff", margin: "0 1rem" }}>
      Create
    </Link>
    <Link href="/commissions" style={{ color: "#fff", margin: "0 1rem" }}>
      Commissions
    </Link>
    <Link href="/store" style={{ color: "#fff", margin: "0 1rem" }}>
      DIY Kits
    </Link>
  </nav>

  {/* Mobile hamburger */}
  <button
    onClick={() => setMenuOpen((prev) => !prev)}
    className="mobile-toggle"
    aria-label="Toggle menu"
    style={{
      background: "none",
      border: "none",
      fontSize: "1.75rem",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    {menuOpen ? "✖" : "☰"}
  </button>

  {/* Mobile dropdown nav */}
  {menuOpen && (
    <nav
      className="mobile-nav"
      style={{
        position: "absolute",
        top: "70px",
        left: 0,
        right: 0,
        backgroundColor: "#000",
        padding: "1rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link href="/create" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.5rem 0" }}>
        Create
      </Link>
      <Link href="/commissions" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.5rem 0" }}>
        Commissions
      </Link>
      <Link href="/store" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.5rem 0" }}>
        DIY Kits
      </Link>
    </nav>
  )}

  <style jsx>{`
    @media (min-width: 768px) {
      .desktop-nav {
        display: flex;
      }
      .mobile-toggle,
      .mobile-nav {
        display: none;
      }
    }

    @media (max-width: 767px) {
      .desktop-nav {
        display: none;
      }
      .mobile-toggle {
        display: inline-block;
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
