// lib/recordPurchase.ts
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import sendThankYouEmail from '@/utils/sendThankYouEmail';

export async function recordPurchase({
  email,
  pdfUrl,
  projectName,
  stripeData,
  gridData,
}: {
  email: string;
  pdfUrl: string;
  projectName: string;
  stripeData?: any;
  gridData?: string;  // JSON-stringified 2D array of dice values (0-6)
}) {
  if (!email || !pdfUrl || !projectName) {
    console.error("❌ Missing required field(s):", { email, pdfUrl, projectName });
    throw new Error("Missing one or more required fields");
  }

  const code = nanoid(6).toUpperCase(); // e.g., "XK49HZ"
  console.log("📦 Recording purchase for:", { email, projectName, pdfUrl });

  const { error } = await supabase.from('purchases').insert([
    {
      code,
      email,
      pdf_url: pdfUrl,
      project_name: projectName,
      stripe_data: JSON.stringify(stripeData ?? {}),
      grid_data: gridData ?? null,
    },
  ]);

  if (error) {
    console.error("❌ Error inserting into Supabase:", error);
    throw new Error("Database error");
  }

  try {
    await sendThankYouEmail({ email, code, pdfUrl, projectName, stripeData });
    console.log("📧 Email sent to:", email, "with code:", code);
  } catch (emailErr) {
    console.error("❌ Failed to send email:", emailErr);
    return {
      code,
      warning: "Purchase saved, but email failed to send.",
    };
  }

  return { code };
}
