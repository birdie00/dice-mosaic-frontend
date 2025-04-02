
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

      <header className="site-header">
        <div className="site-header-inner">
          {/* Logo (Left) */}
          <Link href="/" className="site-logo">
            <Image
              src="/images/HeaderLogo.png"
              alt="Pipcasso Logo"
              width={300}
              height={80}
              className="logo-img"
              priority
            />
          </Link>

          {/* Hamburger Menu (Mobile) */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          {/* Navigation Links */}
          <nav className={`site-nav ${menuOpen ? "open" : ""}`}>
            <Link href="/create">Create</Link>
            <Link href="/commissions">Commissions</Link>
            <Link href="/store">DIY Kits</Link>
          </nav>

          {/* Cart (Right) */}
          <div className="cart-icon">
            <Link href="/cart" aria-label="Cart">
              🛒
            </Link>
          </div>
        </div>
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
