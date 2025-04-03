import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Cropper from "react-cropper";
import type CropperJS from "cropperjs"; // default export from cropperjs
import "cropperjs/dist/cropper.css";
import Layout from "@/components/Layout";

interface MosaicOption {
  style_id: number;
  grid: number[][];
}

type AspectRatioOption = "square" | "portrait" | "landscape";

export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [mosaicOptions, setMosaicOptions] = useState<MosaicOption[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("square");
  const [gridSize, setGridSize] = useState<[number, number]>([100, 100]);
  const [showGeneratingMessage, setShowGeneratingMessage] = useState(false);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);
  const cropperRef = useRef<{ cropper: CropperJS }>(null);

  const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

  useEffect(() => {
    const preloadDiceImages = () => {
      for (let i = 0; i <= 6; i++) {
        const img = new Image();
        img.src = `/dice/dice_${i}.png`;
      }
    };
    preloadDiceImages();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const projectFromUrl = urlParams.get("project");
  
    if (success === "true" && projectFromUrl) {
      const grid_data = JSON.parse(localStorage.getItem("grid_data") || "null");
      const style_id = parseInt(localStorage.getItem("style_id") || "0");
      const project_name = localStorage.getItem("project_name") || projectFromUrl;
  
      if (!grid_data || !style_id || !project_name) {
        alert("Missing project data. Please try again.");
        return;
      }
  
      fetch(`${BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grid_data,
          style_id,
          project_name,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to generate PDF.");
          return res.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${project_name}.pdf`;
          a.click();
  
          // ✅ Clean up
          localStorage.removeItem("grid_data");
          localStorage.removeItem("style_id");
          localStorage.removeItem("project_name");
        })
        .catch((err) => {
          console.error("PDF generation failed:", err);
          alert("Something went wrong creating your PDF.");
        });
    }
  }, []);
  

  const handleAspectRatioChange = (option: AspectRatioOption) => {
    setAspectRatio(option);
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    let ratio = 1;
    let newGrid: [number, number] = [100, 100];

    if (option === "portrait") {
      ratio = 2 / 3;
      newGrid = [80, 120];
    } else if (option === "landscape") {
      ratio = 3 / 2;
      newGrid = [120, 80];
    }

    cropper.setAspectRatio(ratio);
    setGridSize(newGrid);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImagePreviewUrl(URL.createObjectURL(file));
      setCroppedImage(null);
      setCroppedImageUrl(null);
      setMosaicOptions([]);
      setPdfUrl(null);
      setSelectedStyleId(null);
    }
  };

  const cropImage = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas();
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      alert("Please resize your crop area.");
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) {
        setCroppedImage(blob);
        setCroppedImageUrl(URL.createObjectURL(blob));
      }
    }, "image/png");
  };

  const generateMosaics = async () => {
    if (!croppedImage) return;
    const formData = new FormData();
    formData.append("file", croppedImage, "cropped.png");
    formData.append("grid_width", gridSize[0].toString());
    formData.append("grid_height", gridSize[1].toString());

    setLoading(true);
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName }),
    });
    

    const data: { styles: MosaicOption[] } = await res.json();
    setMosaicOptions(data.styles);
    setLoading(false);
  };

  const generatePDF = async () => {
    if (selectedStyleId === null) return;
  
    const selected = mosaicOptions.find((o) => o.style_id === selectedStyleId);
    if (!selected) return;
  
    try {
      setLoading(true);
  
      localStorage.setItem("grid_data", JSON.stringify(selected.grid));
      localStorage.setItem("style_id", selectedStyleId.toString());
      localStorage.setItem("project_name", projectName);
  
      console.log("📦 Saving project data and creating Stripe session...");
  
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName }),
      });
  
      const data = await res.json();
      console.log("🔁 Stripe session response:", data);
  
      if (res.ok && data.url) {
        console.log("✅ Redirecting to Stripe:", data.url);
        window.location.href = data.url;
      } else {
        console.error("❌ Stripe session creation failed:", data);
        alert("Could not start payment session.");
      }
    } catch (err) {
      console.error("🔥 Stripe error:", err);
      alert("Something went wrong starting the payment.");
    } finally {
      setLoading(false);
    }
  };

  const clampDiceValue = (val: number | string): number => {
    const num = parseInt(val as string);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(6, num));
  };
  const steps = [
    "Upload",
    "Crop",
    "Preview",
    "Styles",
    "Generate PDF",
    "Download",
  ];
  
  return (
    <Layout>
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)", // 💚 outer background
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
    }}
    >
</div>

      {showGeneratingMessage && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 0 15px rgba(0,0,0,0.3)",
        maxWidth: "90%",
        textAlign: "center",
      }}
    >
      <h2 style={{ marginBottom: "1rem", color: "#ECB84A" }}>Generating Dice Mosaics...</h2>
      <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>
        Please be patient while your dice mosaic previews are being generated.
        <br />
        This can take up to <strong>60 seconds</strong>.
        <br />
        <strong>Do not refresh</strong> or exit this page.
      </p>
    </div>
  </div>
)}

{/* ✅ Simple Bold Block-Style Step Tracker */}
<div
  style={{
    display: "flex",
    marginBottom: "0",
    maxWidth: "1000px",
    marginInline: "auto",
  }}
>
  {steps.map((_, index) => {
    const stepNum = index + 1;
    const isActive = step === stepNum;
    const isCompleted = step > stepNum;

    let backgroundColor = "#fdf7f1"; // light green (completed)
    let textColor = "#613073"; // dark green

    if (isActive) {
      backgroundColor = "#edb84a"; // solid green (active)
      textColor = "#ffffff";
    } else if (!isCompleted) {
      backgroundColor = "#e5e7eb"; // gray (upcoming)
      textColor = "#6b7280"; // muted gray
    }

    return (
      <div
        key={index}
        style={{
          flex: 1,
          padding: "0.5rem 0.25rem",
          backgroundColor,
          color: textColor,
          textAlign: "center",
          fontSize: "1.1rem",
          fontWeight: "bold",
          borderLeft: index !== 0 ? "1px solid #fff" : "none",
        }}
      >
        Step {stepNum}
      </div>
    );
  })}
</div>

{/* ✅ Raised Heading Box snapped to step tracker */}
<div
  style={{
    backgroundColor: "#EAAA4F",
    height: "48px", // match the height
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2rem",
    marginTop: "0", // flush to step bar
  }}
>
  <h1
    style={{
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#338A9D",
      margin: 0,
    }}
  >
    Dice Mosaic Generator
  </h1>
</div>



        {step === 1 && (
  <section style={{ padding: "2rem 1rem" }}>
    <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#338a9d", textAlign: "center" }}>Welcome to Pipcasso Dice Mosaic Generator</h2>
    <p style={{ fontSize: "1rem", lineHeight: "1.6", marginBottom: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      At <strong>Pipcasso</strong>, we turn your unique images into stunning dice mosaic portraits. Upload a photo, and we’ll
      transform it into a custom portrait made entirely from dice. You can download it as a high-resolution image, have it printed and shipped to your door,
      or even receive a <strong>DIY Dice Kit</strong> with a personalized Dice Map to build your own mosaic masterpiece at home.
    </p>

    <div
      style={{
        borderRadius: "16px",
        padding: "2rem",
        background: "#ffffff",
        border: "1px solid #338a9d", // greenish border
        maxWidth: "600px",
        margin: "2rem auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem", textAlign: "center", color: "#333" }}>
        Upload your image here to move to Step 2
      </h3>

      {/* Project Name */}
      <label style={{ display: "block", marginBottom: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Project Name</div>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Grandma Portrait"
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #bbb",
          }}
        />
      </label>

      {/* Image Upload */}
      <label style={{ display: "block", marginBottom: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Choose Image</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            onSelectFile(e);
          }}
          style={{
            fontSize: "1rem",
            padding: "0.4rem 0",
            width: "100%",
          }}
        />
      </label>

      {/* Terms and Conditions */}
      <label style={{ display: "flex", alignItems: "flex-start", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          style={{ marginRight: "0.75rem", marginTop: "0.2rem" }}
        />
        <span>
          <strong>Terms:</strong> No offensive content, trademarks or copyright material may be used, and only images that you have the rights to use may be submitted.
          You acknowledge that, if the image is of or includes another person, you have obtained the consent of the subject(s) for their image to be used by Dice Ideas Ltd.
          to create the resulting dice portrait.
        </span>
      </label>

      {/* Continue Button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => setStep(2)}
          disabled={!imagePreviewUrl || !agreedToTerms || projectName.trim() === ""}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor:
              !imagePreviewUrl || !agreedToTerms || projectName.trim() === ""
                ? "#ccc"
                : "#ECB84A",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor:
              !imagePreviewUrl || !agreedToTerms || projectName.trim() === ""
                ? "not-allowed"
                : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          Continue to Step 2
        </button>
      </div>
    </div>
  </section>
)}



  
{step === 2 && imagePreviewUrl && (
  <section style={{ padding: "2rem 0" }}>
    <h2 style={{
  fontSize: "2rem",
  textAlign: "center",
  color: "#613073",
  marginBottom: "1.5rem",
}}>
  Crop Your Image - Choose Aspect Ratio
</h2>



    {/* Aspect Ratio Options */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "2rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}
    >
      {[
        { label: "Portrait", ratio: 2 / 3, grid: [80, 120], key: "portrait" },
        { label: "Square", ratio: 1, grid: [100, 100], key: "square" },
        { label: "Landscape", ratio: 3 / 2, grid: [120, 80], key: "landscape" },
      ].map(({ label, ratio, grid, key }) => {
        const isSelected = aspectRatio === key;

        return (
          <div
            key={key}
            onClick={() => {
              handleAspectRatioChange(key as AspectRatioOption);
            }}
            style={{
              cursor: "pointer",
              padding: "1rem",
              border: isSelected ? "3px solid #ECB84A" : "2px solid #ccc",
              borderRadius: "12px",
              backgroundColor: isSelected ? "#e6fffa" : "#fff",
              width: "140px",
              textAlign: "center",
              transition: "border 0.2s, background 0.2s",
            }}
          >
            <div
              style={{
                backgroundColor: "#338a9d",
                border: "3px solid #ECB84A",
                margin: "0 auto 0.75rem",
                width: "80px",
                height: ratio === 1 ? "80px" : ratio < 1 ? "100px" : "60px",
                display: "block",
              }}
            />
            <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{label}</div>
            <div style={{ fontStyle: "italic", color: "#555", fontSize: "0.85rem" }}>
              ({grid[0]} x {grid[1]} dice)
            </div>
          </div>
        );
      })}
    </div>
    <div
  style={{
    backgroundColor: "#fef2f2", // light red background
    border: "1px solid #dc2626", // dark red border
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    maxWidth: "800px",
    marginInline: "auto",
    textAlign: "center",
    color: "#613073", // dark green
    fontSize: "1rem",
    lineHeight: 1.6,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  }}
>
  Choose the aspect ratio that best matches your image. HINT: Select a smaller area for greater detail.
</div>

    {/* Cropper */}
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <Cropper
        src={imagePreviewUrl}
        style={{ width: "100%", height: 600 }}
        aspectRatio={1}
        viewMode={1}
        guides={false}
        dragMode="crop"
        autoCrop={true}
        checkOrientation={false}
        responsive={true}
        zoomOnWheel={false}
        wheelZoomRatio={0}
        ref={cropperRef as any}
      />
    </div>

    {/* Navigation Buttons */}
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={() => {
          cropImage();
          setStep(3);
        }}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: "#ECB84A",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          marginRight: "1rem",
        }}
      >
        Continue to Step 3
      </button>
      <button
        onClick={() => setStep(1)}
        style={{
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          backgroundColor: "#aaa",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
        }}
      >
        ⬅ Back
      </button>
    </div>
  </section>
)}

{step === 3 && croppedImageUrl && (
  <section style={{ padding: "2rem 0", textAlign: "center" }}>
    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. Preview</h2>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <img
        src={croppedImageUrl}
        alt="Cropped"
        style={{
          width: "80vw",        // ✅ max 80% of viewport width
          maxWidth: "600px",    // ✅ never exceed this
          height: "auto",
          borderRadius: "8px",
          border: "1px solid #ccc",
          boxShadow: "0 0 10px rgba(0,0,0,0.05)",
        }}
      />
    </div>

    <div style={{ marginTop: "2rem" }}>
      <button
        onClick={() => {
          setShowGeneratingMessage(true);
          generateMosaics().then(() => {
            setShowGeneratingMessage(false);
            setStep(4);
          });
        }}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: "#2f5884",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          marginRight: "1rem",
        }}
      >
        Generate Dice Mosaics
      </button>
      <button
        onClick={() => {
          setCroppedImage(null);
          setCroppedImageUrl(null);
          setStep(2);
        }}
        style={{
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          backgroundColor: "#aaa",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
        }}
      >
        ⬅ Back
      </button>
    </div>
  </section>
)}


  
        {step === 4 && mosaicOptions.length > 0 && (
          <section style={{ padding: "2rem 0" }}>
            <h2 style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>4. Select a Mosaic Style</h2>
            <div
  style={{
    backgroundColor: "#fef2f2", // light red background
    border: "1px solid #dc2626", // dark red border
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    maxWidth: "800px",
    marginInline: "auto",
    textAlign: "center",
    color: "#613073", // ✅ dark green text (same as heading)
    fontSize: "1rem",
    lineHeight: 1.6,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  }}
>
  Click on the image to zoom in. Choose which option looks best and we will convert it into a high resolution print and Dice Map PDF!
</div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "2rem",
              }}
            >
              {mosaicOptions.map((option) => (
                <div
                  key={option.style_id}
                  style={{
                    flex: "0 0 300px",
                    padding: "1rem",
                    background: "#fafafa",
                    borderRadius: "8px",
                    boxShadow: "0 0 8px rgba(0,0,0,0.08)",
                    textAlign: "center",
                  }}
                >
                  <div
  onClick={() => setExpandedImage(option.style_id)}
  style={{
    position: "relative",
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 0 0 1px #ddd",
    transition: "box-shadow 0.2s ease-in-out",
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px #4ade80";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px #ddd";
  }}
>
  {/* Image grid preview */}
  <div
  onClick={() => setExpandedImage(option.style_id)}
  style={{
    position: "relative",
    cursor: "zoom-in",
    borderRadius: "8px",
    overflow: "hidden",
    transition: "box-shadow 0.2s ease-in-out",
  }}
  onMouseEnter={(e) => {
    const overlay = e.currentTarget.querySelector(".zoom-overlay") as HTMLDivElement;
    if (overlay) overlay.style.opacity = "1";
  }}
  onMouseLeave={(e) => {
    const overlay = e.currentTarget.querySelector(".zoom-overlay") as HTMLDivElement;
    if (overlay) overlay.style.opacity = "0";
  }}
>
  {/* Mosaic Grid */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${option.grid?.[0]?.length || 1}, 1fr)`,
      aspectRatio: `${option.grid?.[0]?.length || 1} / ${option.grid?.length || 1}`,
      

      width: "100%",
      lineHeight: 0,
    }}
  >
    {option.grid.map((row, y) =>
      row.map((val, x) => (
        <img
          key={`${y}-${x}`}
          src={`/dice/dice_${clampDiceValue(val)}.png`}
          alt={`dice ${val}`}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      ))
    )}
  </div>

  {/* 🔍 Zoom Overlay Icon */}
  <div
    className="zoom-overlay"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.3)",
      opacity: 0,
      transition: "opacity 0.3s ease-in-out",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "none",
    }}
  >
    <img
  src="/icons/expand.svg"
  alt="Zoom"
  style={{
    width: "48px",
    height: "48px",
    opacity: 0.9,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: "50%",
    padding: "8px",
  }}
/>

  </div>
</div>
</div>


                  <button
                    onClick={() => setSelectedStyleId(option.style_id)}
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.85rem",
                      borderRadius: "4px",
                      background: selectedStyleId === option.style_id ? "#2f5884" : "#333",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Option {option.style_id}
                  </button>
                </div>
              ))}
            </div>
  
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                onClick={async () => {
                  if (!selectedStyleId) return;
                
                  const res = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ projectName }),
                  });
                
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url; // Redirect to Stripe
                  } else {
                    alert("Failed to redirect to payment.");
                  }
                }}
                
                disabled={selectedStyleId === null}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  background: selectedStyleId === null ? "#aaa" : "#ECB84A",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: selectedStyleId === null ? "not-allowed" : "pointer",
                  marginRight: "1rem",
                }}
              >
                Generate Dice Map PDF
              </button>
              <button onClick={() => setStep(3)} style={{ padding: "0.6rem 1.2rem", fontSize: "1rem" }}>
                ⬅ Back
              </button>
            </div>
          </section>
        )}
  
        {step === 5 && pdfUrl && (
          <section style={{ padding: "2rem 0", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>5. Download Your Dice Map</h2>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <button
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  backgroundColor: "#2f5884",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Download Dice Map PDF
              </button>
            </a>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={() => setStep(4)} style={{ padding: "0.6rem 1.2rem", fontSize: "1rem" }}>
                ⬅ Back
              </button>
            </div>
          </section>
        )}
      return (

    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
      onClick={() => setExpandedImage(null)} // click background to close
    >
      {/* Close Button */}
      <button
        onClick={() => setExpandedImage(null)}
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          background: "transparent",
          color: "#fff",
          fontSize: "1.5rem",
          border: "none",
          cursor: "pointer",
          zIndex: 10000,
        }}
        aria-label="Close Zoom"
      >
        ✖
      </button>

      {/* Modal Content */}
      <div
        style={{
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#111",
          borderRadius: "8px",
          padding: "1rem",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()} // prevent modal from closing when clicking inside
      >
        {/* Calculate cols and rows */}
        {(() => {
          const expanded = mosaicOptions.find((o) => o.style_id === expandedImage);
          const cols = expanded?.grid?.[0]?.length || 1;
          const rows = expanded?.grid?.length || 1;

          // Define colors for each cell value
          const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]; // Add more colors if needed

          return (
            <div
              className="grid gap-[1px] bg-black"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                width: "100%",
                height: "auto",
                maxWidth: "80vw",
                maxHeight: "80vh",
                aspectRatio: `${cols} / ${rows}`,
                overflow: "hidden",
                imageRendering: "pixelated",
              }}
            >
              {/* Grid Rendering */}
              {expanded?.grid?.map((row, y) =>
                row.map((cell: number, x: number) => (
                  <div
                    key={`${x}-${y}`}
                    className="w-2 h-2 sm:w-3 sm:h-3"
                    style={{ backgroundColor: colors[cell] }} // Use colors[cell] to get the color
                  />
                ))
              )}
            </div>
          );
        })()}
      </div>
    </div>
  </Layout>
)}
