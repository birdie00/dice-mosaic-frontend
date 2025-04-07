// /pages/api/generate-pdf.ts
import { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { grid_data, style_id, project_name } = req.body;

  // Check if the required fields are provided
  if (!grid_data || !style_id || !project_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create a PDF document
    const doc = new PDFDocument();

    // Define the file path where the PDF will be saved
    const pdfPath = path.join(process.cwd(), "public", "pdf", `${project_name}_${style_id}.pdf`);

    // Pipe the output to the file
    doc.pipe(fs.createWriteStream(pdfPath));

    // Set up the PDF content (you can customize this part based on your needs)
    doc.fontSize(25).text(`Dice Mosaic for ${project_name}`, {
      align: "center",
    });

    // Add content to the PDF (based on `grid_data` and `style_id`)
    doc.fontSize(16).text(`Style ID: ${style_id}`, {
      align: "center",
    });

    // Add a placeholder for your grid_data (you will need to customize this part)
    doc.fontSize(12).text(`Grid Data: ${JSON.stringify(grid_data)}`);

    // Finalize the PDF and close the stream
    doc.end();

    // Return the URL of the generated PDF
    const diceMapUrl = `/pdf/${project_name}_${style_id}.pdf`;

    res.status(200).json({ dice_map_url: diceMapUrl });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
