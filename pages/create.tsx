import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Cropper } from "react-cropper";
import type CropperJS from "cropperjs";
import Layout from "@/components/Layout";
import React from "react";

function getDiceStats(grid: number[][]) {
  const counts = Array(7).fill(0); // values 0–6
  let total = 0;

  for (const row of grid) {
    for (const val of row) {
      if (val >= 0 && val <= 6) {
        counts[val]++;
        total++;
      }
    }
  }

  const mostCommon = counts.indexOf(Math.max(...counts));
  const leastCommon = counts.indexOf(Math.min(...counts));

  return {
    total,
    mostCommon,
    leastCommon,
    counts,
  };
}

interface MosaicOption {
  style_id: number;
  grid: number[][];
}


type AspectRatioOption = "square" | "portrait" | "landscape";


export default function CreatePage() {
  const router = useRouter();


  const [step, setStep] = useState<number>(1);
  const [showFinalizingMessage, setShowFinalizingMessage] = useState(false);
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
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [customHeight, setCustomHeight] = useState<number>(100);
  const [lowResImageUrl, setLowResImageUrl] = useState<string | null>(null);
  const [highResImageUrl, setHighResImageUrl] = useState<string | null>(null);
  const [showGeneratingMessage, setShowGeneratingMessage] = useState(false);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);
  const [buyHighRes, setBuyHighRes] = useState(false);
  const [orderPrint, setOrderPrint] = useState(false);
  const [printQuantity, setPrintQuantity] = useState(1);
  const [selectedPrintSize, setSelectedPrintSize] = useState("small");
  const getPriceForSize = (size: string): string => {
    switch (size) {
      case "small":
        return "$59.99";
      case "large":
        return "$89.99";
      default:
        return "$—";
    }
  };
  

  const cropperRef = useRef<HTMLImageElement & { cropper: CropperJS }>(null);


  const [email, setEmail] = useState('');
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

  // ✅ Preload dice images
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
    const { success } = router.query;

    if (
      success === "true" &&
      selectedStyleId !== null &&
      mosaicOptions.length > 0 &&
      pdfUrl === null
    ) {
      generatePDF();
      setStep(5);
      router.replace("/create", undefined, { shallow: true });
    }
  }, [router.query, selectedStyleId, mosaicOptions, pdfUrl]);

  // 🔧 Image crop ratio logic
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
const handleCustomRatioChange = () => {
  if (!customWidth || !customHeight) return;

  const cropper = cropperRef.current?.cropper;
  if (!cropper) return;

  const ratio = customWidth / customHeight;
  cropper.setAspectRatio(ratio);
  setGridSize([customWidth, customHeight]);
};
  // 🔧 Handle image upload
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

  // 🔧 Crop the image to canvas
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
    const res = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMosaicOptions(data.styles);
    setLoading(false);
  };

  const generatePDF = async () => {
    if (selectedStyleId === null || !projectName.trim()) {
      alert("Please select a mosaic style and enter a project name.");
      return;
    }
  
    const selectedIndex = mosaicOptions.findIndex((o) => o.style_id === selectedStyleId);
    if (selectedIndex === -1) {
      alert("Selected mosaic style not found.");
      return;
    }
  
    const selected = mosaicOptions[selectedIndex];
    const gridToSend = selected.grid.map((row) => [...row]); // deep clone

    try {
      setLoading(true);
  
      const res = await fetch(`${BACKEND_URL}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grid_data: gridToSend,
          style_id: selectedStyleId,
          project_name: projectName,
        }),
      });
  
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();

      if (!data.dice_map_url) {
        throw new Error("Missing dice_map_url in response.");
      }
  
      setPdfUrl(`${BACKEND_URL}${data.dice_map_url}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating your PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };
    
  const generateImage = async (resolution: "low" | "high") => {
    const selected = mosaicOptions.find((o) => o.style_id === selectedStyleId);
    if (!selected) return null;
  
    const res = await fetch(`${BACKEND_URL}/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grid_data: selected.grid,
        style_id: selectedStyleId,
        project_name: projectName,
        resolution,
        mode: "dice",
      }),
    });
  
    const data = await res.json();
    return `${BACKEND_URL}${data.image_url}`;
  };
  
  const handleStripeCheckout = async (
    productType: string,
    size?: string,
    quantity: number = 1,
    styleId?: number,
    grid?: number[][]
  ) => {
      try {
        
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productType,
              size,
              quantity,
              email,
              projectName,
              pdfUrl,
              lowResImageUrl,
              highResImageUrl,
              styleId,
              grid,
              printAspectRatio: aspectRatio, // <- Add this
            }),
          });
      
          const data = await res.json();
      
          if (data.url) {
            window.location.href = data.url;
          } else {
            alert("Stripe session creation failed.");
          }
        } catch (error) {
          console.error("Stripe Checkout error:", error);
          alert("There was a problem starting the checkout.");
        }
      };

  const clampDiceValue = (val: any): number => {
    const num = parseInt(val);
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
          backgroundColor: "#155E63", // dark teal background
          padding: "2rem 1rem",
          minHeight: "100vh",
          color: "#1F2937",
        }}
      >
        <div
  style={{
    maxWidth: "1000px",             // ⬆️ slightly wider
    margin: "auto",            // ⬆️ add top/bottom margin
    backgroundColor: "#FDF7F1",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    padding: "1rem",         // ⬆️ more breathing room
    color: "#2F5884",
    lineHeight: 1.65,               // ⬆️ better readability
  }}
>{showFinalizingMessage && (
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
      <h2 style={{ marginBottom: "1rem", color: "#E84C3D" }}>Finalizing Your Dice Map...</h2>
      <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>
        We’re creating your final high-resolution image and PDF.
        <br />
        This may take up to <strong>2 minutes</strong>.
        <br />
        Please stay on this page and do not refresh.
      </p>
    </div>
  </div>
)}

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
      <h2 style={{ marginBottom: "1rem", color: "#E84C3D" }}>Generating Dice Mosaics...</h2>
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

<div
          style={{
            display: "flex",
            marginBottom: "0rem",
            maxWidth: "1000px",
            marginInline: "auto",
          }}
        >
          {steps.map((_, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;


            let backgroundColor = "#F1943C"; // orange (completed)
            let textColor = "#fff";


            if (isActive) {
              backgroundColor = "#E84C3D"; // red (active)
              textColor = "#ffffff";
            } else if (!isCompleted) {
              backgroundColor = "#F8D4C4"; // light pastel (upcoming)
              textColor = "#3B1B47"; // deep purple for contrast
            }

    return (
      <div
  key={index}
  style={{
    flex: 1,
    padding: "0.5rem 0.25rem",
    backgroundColor,
    borderLeft: index !== 0 ? "1px solid #fff" : "none",
    display: "flex",                  // ✅ enable flexbox
    alignItems: "center",            // ✅ vertical centering
    justifyContent: "center",        // ✅ horizontal centering
    minHeight: "60px",               // ✅ ensure enough height
  }}
>
  <img
    src={`/icons/dicevector_${stepNum}.png`}
    alt={`Step ${stepNum}`}
    style={{ width: "32px", height: "32px" }}
  />
</div>
    );
  })}
</div>

{/* ✅ Raised Heading Box snapped to step tracker */}
<div
  style={{
    backgroundColor: "#1C4C54",
    height: "48px", // match the height
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.25rem",
    marginTop: "0", // flush to step bar
  }}
>
  <h1
    style={{
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#FDF7F1",
      margin: 0,
    }}
  >
    Dice Mosaic Generator
  </h1>
</div>

        {step === 1 && (
  <section style={{ padding: "2rem 1rem" }}>
<h2
  style={{
    fontSize: "1.6rem",
    fontWeight: "800",
    margin: "0 0 0.75rem",
    color: "#155E63",
    textAlign: "center",
    lineHeight: 1.3,
    maxWidth: "95%",                 // ✅ prevents overflow
    marginInline: "auto",   
  }}
>
  Welcome to Pipcasso Dice Mosaic Generator
</h2>

    <p style={{ fontSize: "1rem", lineHeight: "1.4", marginBottom: "0.5rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
    At Pipcasso, you can turn your favorite photo into a custom dice mosaic. Just upload an image and we will generate a downloadable Dice Portrait or Dice Map - ready to print or build with real dice!
    </p>

    <div
  className="upload-card"
  style={{
    borderRadius: "16px",
    padding: "2rem", // desktop default
    background: "#ffffff",
    border: "1px solid #c6f6d5",
    maxWidth: "600px",
    margin: "2rem auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
<style jsx>{`
  @media (max-width: 600px) {
    .upload-card {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
  }
`}</style>

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
          placeholder="e.g. My Puppy"
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #bbb",
          }}
        />
      </label>
{/* Add this near your project name field or before "Generate PDF" */}
<label>
  <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Your Email</div>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="pablo@pipcasso.com"
    style={{
      width: "100%",
      padding: "0.65rem 0.9rem",
      fontSize: "1rem",
      borderRadius: "8px",
      border: "1px solid #bbb",
      marginBottom: "1rem",
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
          <strong>Terms:</strong> By submitting an image, you confirm that you either own the rights to the image or have obtained all necessary permissions to use it. You agree not to upload any content that is offensive, infringes on copyrights, trademarks, or the rights of any third party. If the image contains identifiable individuals, you affirm that you have secured their consent for Pipcasso to create and use the resulting dice mosaic.
        </span>
      </label>




      {/* Continue Button */}
     
      <div style={{ textAlign: "center" }}>
      <button
  onClick={() => setStep(2)}
  disabled={
    !imagePreviewUrl ||
    !agreedToTerms ||
    projectName.trim() === "" ||
    !isValidEmail(email)
  }
  style={{
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    backgroundColor:
      !imagePreviewUrl ||
      !agreedToTerms ||
      projectName.trim() === "" ||
      !isValidEmail(email)
        ? "#ccc"
        : "#E84C3D",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor:
      !imagePreviewUrl ||
      !agreedToTerms ||
      projectName.trim() === "" ||
      !isValidEmail(email)
        ? "not-allowed"
        : "pointer",
    transition: "background-color 0.2s",
  }}
>
  Continue to Step 2
</button>


      </div>
     
    </div>
    {/* 🧾 Second card: Redeem existing code */}
<div
  style={{
    border: "1px solid #e5e7eb",
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "16px",
    marginTop: "2rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    maxWidth: "600px",
    marginInline: "auto",
    textAlign: "center",
  }}
>
  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", color: "#1f2937" }}>
    🎟️ Already have a code?
  </h3>
  <p style={{ marginBottom: "1rem", fontSize: "1rem", color: "#374151" }}>
    If you've already purchased a Dice Map, you can re-download it anytime using your access code.
  </p>
  <a
    href="/redeem"
    style={{
      display: "inline-block",
      backgroundColor: "#E84C3D",
      color: "#fff",
      fontWeight: "bold",
      padding: "0.6rem 1.2rem",
      borderRadius: "8px",
      textDecoration: "none",
      fontSize: "1rem",
    }}
  >
    Redeem Your Dice Map
  </a>
</div>


  </section>
)}












 
{step === 2 && imagePreviewUrl && (
  <section style={{ padding: "2rem 0" }}>
    <h2 style={{
  fontSize: "2rem",
  textAlign: "center",
  color: "#1C4C54",
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
              border: isSelected ? "3px solid #dc2626" : "2px solid #1C4C54", // dark purple or soft lavender
              backgroundColor: isSelected ? "#f3e8ff" : "#fff", // light purple or white
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f3e8ff",
                border: "3px solid #7e22ce",
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
    marginTop: "1.5rem",
    textAlign: "center",
    backgroundColor: "#fffbea",
    padding: "1rem 1.5rem",
    border: "1px solid #fcd34d",
    borderRadius: "12px",
  }}
>
  <h3 style={{ marginBottom: "0.5rem" }}>Custom Grid Size</h3>
  <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
    <label>
      Width (dice):
      <input
        type="number"
        value={customWidth}
        onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1)}
        style={{ marginLeft: "0.5rem", width: "80px" }}
        min={1}
      />
    </label>
    <label>
      Height (dice):
      <input
        type="number"
        value={customHeight}
        onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1)}
        style={{ marginLeft: "0.5rem", width: "80px" }}
        min={1}
      />
    </label>
    <button
      onClick={handleCustomRatioChange}
      style={{
        marginLeft: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#E84C3D",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Set Custom Crop
    </button>
  </div>
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
    color: "#1C4C54", // dark green
    fontSize: "1rem",
    lineHeight: 1.6,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  }}
>
Choose the aspect ratio that best fits your image. Tip: Cropping a smaller section can give you sharper detail in the final mosaic.
</div>




    {/* Cropper */}
    <div
  style={{
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    maxHeight: "80vh", // ✅ limit height on small screens
    overflow: "hidden",
  }}
>      <Cropper
        src={imagePreviewUrl}
        style={{ width: "100%", height: 400 }}
        aspectRatio={1}
        viewMode={1}
        guides={true}
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
          backgroundColor: "#E84C3D",
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
    width: "100%",
    maxWidth: "400px",    // ⬅️ slightly smaller than before
    height: "auto",
    maxHeight: "350px",   // ⬅️ cap vertical space for portrait
    borderRadius: "12px",
    border: "1px solid #ccc",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    objectFit: "contain",
    marginBottom: "1rem",
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
          backgroundColor: "#E84C3D",
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
    <h2 style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
      4. Select a Mosaic Style
    </h2>

    {/* Helpful Info Box */}
    <div style={{
      backgroundColor: "#fef2f2",
      border: "1px solid #dc2626",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      marginBottom: "1.5rem",
      maxWidth: "800px",
      marginInline: "auto",
      textAlign: "center",
      color: "#065f46",
      fontSize: "1rem",
      lineHeight: 1.6,
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
    }}>
      Click on the image to zoom in. Choose which option looks best and we will convert it into a high-resolution print and Dice Map PDF!
    </div>

    {/* Mosaic Options */}
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2rem" }}>
      {mosaicOptions.map((option) => (
        <div
          key={option.style_id}
          onClick={() => setSelectedStyleId(option.style_id)}
          style={{
            flex: "0 0 300px",
            padding: "1rem",
            background: "#fafafa",
            borderRadius: "12px",
            boxShadow: "0 0 8px rgba(0,0,0,0.08)",
            textAlign: "center",
            border: selectedStyleId === option.style_id ? "2px solid #E84C3D" : "2px solid transparent",
            cursor: "pointer",
            transition: "border 0.2s ease-in-out"
          }}
        >
          {/* Mosaic Dice Preview with Watermark */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: `${option.grid[0].length} / ${option.grid.length}`,
              overflow: "hidden",
            }}
          >
            {/* Dice Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${option.grid[0].length}, 1fr)`,
                width: "100%",
                height: "100%",
                gap: 0,
                lineHeight: 0,
              }}
            >
              {option.grid.map((row, y) =>
                row.map((val, x) => (
                  <img
                    key={`${y}-${x}`}
                    src={`/dice/dice_${clampDiceValue(val)}.png`}
                    alt={`dice ${val}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      imageRendering: "auto",
                    }}
                  />
                ))
              )}
            </div>

            {/* Watermark Overlay */}
            <div
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    transform: "rotate(-25deg)",
    opacity: 0.18,
  }}
>
  {Array.from({ length: 3 }).map((_, rowIdx) => (
    <div
      key={rowIdx}
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        transform: rowIdx % 2 === 0 ? "translateX(0)" : "translateX(40%)",
      }}
    >
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div
          key={colIdx}
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            color: "#ffffff",
            userSelect: "none",
            padding: "1rem 2.2rem",
            whiteSpace: "nowrap",
          }}
        >
          pipcasso.com
        </div>
      ))}
    </div>
  ))}
</div>

          </div>

          {/* Style Title */}
          <strong style={{ display: "block", marginTop: "0.5rem" }}>
            Style #{option.style_id}
          </strong>
        </div>
      ))}
    </div>

    {/* Navigation Buttons */}
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={async () => {
          if (selectedStyleId === null) return;

          setShowFinalizingMessage(true);
          setLoading(true);

          try {
            const imageLow = await generateImage("low");
            const imageHigh = await generateImage("high");

            setLowResImageUrl(imageLow);
            setHighResImageUrl(imageHigh);

            await generatePDF();
            setStep(5);
          } catch (err) {
            console.error("❌ Error in Step 4 → 5 logic:", err);
            alert("Something went wrong generating your image or PDF.");
          } finally {
            setLoading(false);
            setShowFinalizingMessage(false);
          }
        }}
        disabled={selectedStyleId === null}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: selectedStyleId === null ? "#ccc" : "#E84C3D",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: selectedStyleId === null ? "not-allowed" : "pointer",
          marginRight: "1rem",
        }}
      >
        Next
      </button>

      <button
        onClick={() => setStep(3)}
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


{step === 5 && selectedStyleId !== null && (
  <section style={{ padding: "2rem 1rem" }}>
    <h2 style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "2rem" }}>
      5. Download & Purchase Options
    </h2>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* 🟩 Left: Preview */}
      <div style={{ flex: "1 1 400px", maxWidth: "600px" }}>
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 0 12px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#1C4C54", marginBottom: "1rem" }}>Preview</h3>

          <div
            style={{
              width: "100%",
              position: "relative",
              aspectRatio: `${
                mosaicOptions.find((o) => o.style_id === selectedStyleId)?.grid[0]?.length || 1
              } / ${
                mosaicOptions.find((o) => o.style_id === selectedStyleId)?.grid.length || 1
              }`,
              overflow: "hidden",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${
                  mosaicOptions.find((o) => o.style_id === selectedStyleId)?.grid[0]?.length || 1
                }, 1fr)`,
                width: "100%",
                height: "100%",
                lineHeight: 0,
              }}
            >
              {mosaicOptions
                .find((option) => option.style_id === selectedStyleId)
                ?.grid.flatMap((row, y) =>
                  row.map((val, x) => (
                    <img
                      key={`${y}-${x}`}
                      src={`/dice/dice_${val}.png`}
                      alt={`dice ${val}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ))
                )}
            </div>

            {/* Watermark */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 2,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                alignItems: "center",
                transform: "rotate(-25deg)",
                opacity: 0.18,
              }}
            >
              {Array.from({ length: 4 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    transform: rowIdx % 2 === 0 ? "translateX(0)" : "translateX(40%)",
                  }}
                >
                  {Array.from({ length: 2 }).map((_, colIdx) => (
                    <div
                      key={colIdx}
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: 500,
                        color: "#ffffff",
                        userSelect: "none",
                        padding: "1rem 3rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      pipcasso.com
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 🎲 Dice Stats */}
          {(() => {
            const selected = mosaicOptions.find((o) => o.style_id === selectedStyleId);
            const stats = selected ? getDiceStats(selected.grid) : null;
            return (
              stats && (
<div
  style={{
    marginTop: "1rem",
    backgroundColor: "#fffbea",
    border: "1px solid #fcd34d",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#444",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  }}
>
  <strong style={{ display: "block", marginBottom: "0.5rem", color: "#6b21a8" }}>
    🎲 Fun Fact:
  </strong>
  <p>Your mosaic uses <strong>{stats.total.toLocaleString()}</strong> dice!</p>
  <p>
    Most common dice face: <strong>{stats.mostCommon}</strong> (
    {stats.counts[stats.mostCommon].toLocaleString()} times)
  </p>
  <p>
    Least common dice face: <strong>{stats.leastCommon}</strong> (
    {stats.counts[stats.leastCommon].toLocaleString()} times)
  </p>
</div>

              )
            );
          })()}
        </div>
      </div>

      {/* 🟦 Right: Purchase Options */}
      <div style={{ flex: "1 1 400px", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Digital Downloads */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 0 12px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#1C4C54", marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
            Digital Downloads
          </h3>

          {[
            {
              key: "highres",
              title: "High Quality Image",
              subtitle: "7500 x 7500 px",
              price: "$9.99",
              buttonText: "Buy Now",
            },
            {
              key: "pdf",
              title: "Dice Map PDF",
              subtitle: "Dice Map to build a DIY Dice Portrait",
              price: "$19.99",
              buttonText: "Buy Now",
            },
            {
              key: "bundle",
              title: "Digital Bundle",
              subtitle: "High-Resolution Image + Dice Map",
              price: "$24.95",
              buttonText: "Buy Now",
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #eee",
                padding: "1rem 0",
              }}
            >
              <div>
                {item.subtitle && (
                  <div style={{ fontStyle: "italic", fontSize: "0.85rem", color: "#555" }}>
                    {item.subtitle}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{item.price}</div>

                <button
                  className="btn"
                  onClick={() => {
                    const selected = mosaicOptions.find((o) => o.style_id === selectedStyleId);
                    handleStripeCheckout(
                      item.key,
                      undefined,
                      1,
                      selectedStyleId || undefined,
                      selected?.grid || []
                    );
                  }}
                >
                  🛒 {item.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Physical Print */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 0 12px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#1C4C54", marginBottom: "1rem" }}>Physical Print</h3>
          <label style={{ fontWeight: 600 }}>Select Size:</label>
          <select
            value={selectedPrintSize}
            onChange={(e) => setSelectedPrintSize(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <option value="small">Small (12 × 12 in OR 8 × 12 in)</option>
            <option value="large">Large (20 × 20 in OR 16 × 24 in)</option>
          </select>

          <label style={{ fontWeight: 600 }}>Quantity:</label>
          <input
            type="number"
            value={printQuantity}
            min={1}
            onChange={(e) => setPrintQuantity(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <button
            className="btn"
            onClick={() => {
              const selected = mosaicOptions.find((o) => o.style_id === selectedStyleId);
              handleStripeCheckout(
                "print",
                selectedPrintSize,
                printQuantity,
                selectedStyleId || undefined,
                selected?.grid || []
              );
            }}
          >
            Buy Now – {getPriceForSize(selectedPrintSize)}
          </button>
        </div>
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={() => setStep(4)}
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

    <style jsx>{`
      .btn {
        padding: 0.5rem 1rem;
        background-color: #E84C3D;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .btn {
          width: 100%;
        }
      }
    `}</style>
  </section>
)}



      {/* ✅ Zoomed-In Mosaic with Watermark */}
      {expandedImage !== null && (
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
            cursor: "zoom-out",
          }}
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "transparent",
              color: "#fff",
              fontSize: "2rem",
              border: "none",
              cursor: "pointer",
              zIndex: 10000,
            }}
            aria-label="Close Zoom"
          >
            ✖
          </button>


          <div
            style={{
              position: "relative",
              width: "80vw",
              maxWidth: "600px",
              aspectRatio: `$ {
                mosaicOptions.find((o) => o.style_id === expandedImage)?.grid[0]?.length || 1
              } / $ {
                mosaicOptions.find((o) => o.style_id === expandedImage)?.grid.length || 1
              }`,
              overflow: "hidden",
            }}
          >
            {/* Mosaic Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${
                  mosaicOptions.find((o) => o.style_id === expandedImage)?.grid[0]?.length || 1
                }, 1fr)`,
                width: "100%",
                height: "auto",
                gap: 0,
                lineHeight: 0,
              }}
            >
              {mosaicOptions
                .find((option) => option.style_id === expandedImage)
                ?.grid.flatMap((row, y) =>
                  row.map((val, x) => (
                    <img
                      key={`${y}-${x}`}
                      src={`/dice/dice_${clampDiceValue(val)}.png`}
                      alt={`dice ${val}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                        imageRendering: "auto",
                        margin: 0,
                        padding: 0,
                        boxSizing: "border-box",
                      }}
                    />
                  ))
                )}
            </div>


            {/* ✅ Watermark Overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: "6rem",
                  fontWeight: "bold",
                  color: "rgba(255, 255, 255, 0.2)",
                  transform: "rotate(-25deg)",
                  userSelect: "none",
                }}
              >
                pipcasso.com
              </span>
            </div>
          </div>
        </div>
      )}
  </div>
  </div>
</Layout>
  );
}