import { useEffect, useRef } from "react";

export default function HeroHeader() {
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let latestScrollY = 0;
    let ticking = false;
    let windowHeight = window.innerHeight;

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
      const blurOpacity = latestScrollY * 2 / windowHeight;
      const opacity = 1.4 - latestScrollY / 400;

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${slowScroll}px)`;
        contentRef.current.style.opacity = `${opacity}`;
      }

      if (overlayRef.current) {
        overlayRef.current.style.opacity = `${blurOpacity}`;
      }
    };

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header ref={headerRef} style={styles.header}>
      <div className="overlay" ref={overlayRef} style={styles.overlay}></div>
      <div className="content" ref={contentRef} style={styles.content}>
        <hgroup style={styles.hgroup}>
          <h1 style={styles.h1}>Dice Mosaic Generator</h1>
          <h2 style={styles.h2}>Turn Photos Into Dice Art</h2>
        </hgroup>
      </div>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    position: "relative",
    height: "100vh",
    overflow: "hidden",
    background: `url(https://unsplash.imgix.net/45/ZLSw0SXxThSrkXRIiCdT_DSC_0345.jpg?q=75&w=1080&h=1080&fit=max&fm=jpg&auto=format&s=857f07b76abac23a7fb7161cc7b12a46) center no-repeat`,
    backgroundSize: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    background: "#333 center no-repeat",
    backgroundSize: "cover",
    zIndex: 0,
    opacity: 0,
    filter: "blur(4px)",
    transition: "opacity 0.3s ease",
  },
  content: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
  },
  hgroup: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    padding: "0.5em 3em",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "5px solid #fff",
    zIndex: 2,
  },
  h1: {
    fontSize: "2.5rem",
    margin: 0,
  },
  h2: {
    fontSize: "1.2rem",
    textTransform: "uppercase",
    marginTop: "-0.5em",
  },
};
