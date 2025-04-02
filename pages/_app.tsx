import "@/styles/globals.css";
import "cropperjs/dist/cropper.css"; // ✅ add this here
import type { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
