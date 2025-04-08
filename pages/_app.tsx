import "@/styles/globals.css";
import "cropperjs/dist/cropper.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* ✅ Google Fonts: Bebas Neue (headings) + Rubik (body) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rubik&display=swap"
          rel="stylesheet"
        />
        {/* ✅ Font styling rules */}
        <style>{`
          body {
            font-family: 'Rubik', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fff;
          }
          h1, h2, h3, h4, h5 {
            font-family: 'Bebas Neue', sans-serif;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
