
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
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  }}
>
  <Link href="/" style={{ display: "flex", alignItems: "center" }}>
    <Image
      src="/images/HeaderLogo.png"
      alt="Pipcasso Logo"
      width={180}
      height={50}
      priority
    />
  </Link>

  <button
    onClick={() => setMenuOpen(!menuOpen)}
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

  <nav
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
    className="mobile-nav"
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
    <Link href="/cart" onClick={() => setMenuOpen(false)} style={{ color: "#fff", margin: "0.5rem 0" }}>
      🛒 Cart
    </Link>
  </nav>

  <style jsx>{`
    @media (min-width: 768px) {
      .mobile-toggle {
        display: none;
      }
      .mobile-nav {
        display: flex !important;
        position: static;
        flex-direction: row;
        gap: 2rem;
        padding: 0;
        align-items: center;
        background: none;
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
