import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ThankYouPage() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [lowResUrl, setLowResUrl] = useState<string | null>(null);
  const [highResUrl, setHighResUrl] = useState<string | null>(null);
  const [highResDownloadUrl, setHighResDownloadUrl] = useState<string | null>(null);
  const [generatingHighRes, setGeneratingHighRes] = useState(false);
  const [productType, setProductType] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const gelatoProductMap: Record<string, Record<string, string>> = {
    portrait: {
      small: "framed_poster_mounted_210x297mm-8x12-inch_black_wood_w12xt22-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-coated-silk_4-0_ver",
      large: "framed_poster_mounted_400x600-mm-16x24-inch_black_wood_w12xt22-mm_plexiglass_400x600-mm-16x24-inch_200-gsm-80lb-coated-silk_4-0_ver",
    },
    square: {
      small: "framed_poster_mounted_300x300-mm-12x12-inch_black_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-coated-silk_4-0_ver",
      large: "framed_poster_mounted_500x500-mm-20x20-inch_black_wood_w12xt22-mm_plexiglass_500x500-mm-20x20-inch_200-gsm-80lb-coated-silk_4-0_ver",
    },
    landscape: {
      small: "framed_poster_mounted_210x297mm-8x12-inch_black_wood_w12xt22-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-coated-silk_4-0_hor",
      large: "framed_poster_mounted_400x600-mm-16x24-inch_black_wood_w12xt22-mm_plexiglass_400x600-mm-16x24-inch_200-gsm-80lb-coated-silk_4-0_hor",
    },
  };
  
  useEffect(() => {
    if (!router.isReady) return;

    const { session_id } = router.query;
    if (!session_id) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/get-stripe-session?session_id=${session_id}`);
        const data = await res.json();

        console.log("🎯 Raw response from get-stripe-session:", data);
        console.log("🔍 pdfUrl in response:", data?.metadata?.pdfUrl);
        if (data?.metadata?.productType === "print") {
          
          const orderToGelato = async () => {
            const aspect = data.metadata.printAspectRatio || "portrait";
            const size = data.metadata.size || "small";
            const productUid = gelatoProductMap[aspect]?.[size];
          
            if (!productUid) {
              console.error("❌ Invalid print aspect ratio or size", { aspect, size });
              return;
            }
          
            const gelatoRes = await fetch("/api/submit-gelato-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: data.customer_details.name,
                email: data.customer_details.email,
                address: data.customer_details.address,
                imageUrl: data.metadata.highResImageUrl,
                productUid,
              }),
            });
          
            const result = await gelatoRes.json();
            console.log("📦 Gelato order result:", result);
          };
                  
          orderToGelato();
        }
        


        if (data?.metadata) {
          setProductType(data.metadata.productType || null);
          setPdfUrl(data.metadata.pdfUrl || null);
          setLowResUrl(data.metadata.lowResImageUrl || null);
          setHighResUrl(data.metadata.highResImageUrl || null);
          // 🧠 If this is a highres order, but no highResImageUrl was passed
if (
  data?.metadata?.productType === "highres" &&
  data.metadata.grid &&
  data.metadata.styleId &&
  data.metadata.projectName &&
  !data.metadata.highResImageUrl
) {
  setGeneratingHighRes(true);

const generate = async () => {
  const res = await fetch("/api/generate-highres", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grid: JSON.parse(data.metadata.grid),
      styleId: data.metadata.styleId,
      projectName: data.metadata.projectName,
    }),
  });

  const result = await res.json();
  setHighResDownloadUrl(result.imageUrl);
  setGeneratingHighRes(false);
};


  generate();
}

          setCode(data.code || null);
        } else {
          setPdfUrl(null);
        }

              } catch (error) {
        console.error("Error fetching session:", error);
        setPdfUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router.isReady, router.query]);

  const downloadButtonStyle = {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    backgroundColor: "#E84C3D",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "1rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  };
  

  return (
    <div
      style={{
        backgroundColor: "#3B1B47",
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#FDF7F1",
          borderRadius: "16px",
          padding: "3rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", color: "#E84C3D", marginBottom: "1rem" }}>
          Thank You for Your Purchase!
        </h1>
  
        {loading ? (
          <p style={{ fontSize: "1.1rem", color: "#444" }}>
            Loading your download...
          </p>
        ) : (
          <>
            {productType === "pdf" && pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <button style={downloadButtonStyle}>
                  📥 Download Your Dice Map PDF
                </button>
              </a>
            )}
  
            {productType === "lowres" && lowResUrl && (
              <button
                style={downloadButtonStyle}
                onClick={async () => {
                  try {
                    const res = await fetch(lowResUrl);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "pipcasso-lowres.png";
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    alert("Failed to download image. Please try again.");
                    console.error(err);
                  }
                }}
              >
                🖼 Download Your Basic Image
              </button>
            )}
  
            {productType === "highres" && highResUrl && (
              <button
                style={downloadButtonStyle}
                onClick={async () => {
                  try {
                    const res = await fetch(highResUrl);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "pipcasso-highres.png";
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    alert("Failed to download image. Please try again.");
                    console.error(err);
                  }
                }}
              >
                🖼 Download Your High-Res Image
              </button>
            )}
            {productType === "highres" && generatingHighRes && (
  <p style={{ fontSize: "1.1rem", color: "#444" }}>
    🛠 Generating your high-res image... please wait
  </p>
)}

{productType === "highres" && highResDownloadUrl && (
  <a href={highResDownloadUrl} download>
    <button style={downloadButtonStyle}>
      🖼 Download Your High-Res Image
    </button>
  </a>
)}

  
            {productType === "bundle" && (
              <>
                {highResUrl && (
                  <button
                    style={downloadButtonStyle}
                    onClick={async () => {
                      try {
                        const res = await fetch(highResUrl);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "pipcasso-highres.png";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        alert("Failed to download high-res image. Please try again.");
                        console.error(err);
                      }
                    }}
                  >
                    🖼 Download High-Res Image
                  </button>
                )}
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <button style={downloadButtonStyle}>
                      📥 Download Dice Map PDF
                    </button>
                  </a>
                )}
              </>
            )}
  
            {!pdfUrl && !lowResUrl && !highResUrl && (
              <p style={{ fontSize: "1.1rem", color: "#b91c1c" }}>
                We couldn't find your download. Please contact support.
              </p>
            )}
          </>
        )}
  
        {code && (
          <div style={{ marginTop: "2rem", color: "#3B1B47", fontSize: "1rem" }}>
            <p>
              🎟️ <strong>Your Access Code:</strong> <code>{code}</code>
            </p>
            <p>
              You can use this code at{" "}
              <a
                href="/redeem"
                style={{
                  color: "#E84C3D",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
              >
                pipcasso.com/redeem
              </a>{" "}
              to re-download your purchase anytime.
            </p>
          </div>
        )}
  
        <div style={{ marginTop: "2.5rem" }}>
          <a href="/create">
            <button
              style={{
                ...downloadButtonStyle,
                backgroundColor: "#1C4C54",
                marginTop: "0.5rem",
              }}
            >
              🎨 Start Another Mosaic
            </button>
          </a>
        </div>
      </div>
    </div>
  );  
}
