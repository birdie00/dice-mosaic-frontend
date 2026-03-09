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
  console.log("🔲 recordPurchase received gridData:", gridData ? `${gridData.length} chars` : "undefined/null");

  // If no gridData was passed directly, look it up from grid_drafts by pdfUrl
  let resolvedGridData = gridData ?? null;
  if (!resolvedGridData && pdfUrl) {
    const { data: draft, error: draftErr } = await supabase
      .from('grid_drafts')
      .select('grid_data')
      .eq('pdf_url', pdfUrl)
      .single();
    if (draft?.grid_data) {
      resolvedGridData = draft.grid_data;
      console.log("✅ Resolved gridData from grid_drafts:", `${(resolvedGridData ?? '').length} chars`);
    } else {
      console.warn("⚠️ No grid draft found for pdfUrl:", pdfUrl, draftErr);
    }
  }

  const { error } = await supabase.from('purchases').insert([
    {
      code,
      email,
      pdf_url: pdfUrl,
      project_name: projectName,
      stripe_data: JSON.stringify(stripeData ?? {}),
      grid_data: resolvedGridData,
    },
  ]);

  if (error) {
    console.error("❌ Error inserting into Supabase:", error);
    console.error("❌ Supabase error details:", JSON.stringify(error));
    throw new Error("Database error");
  }
  console.log("✅ Supabase insert succeeded, grid_data saved:", resolvedGridData ? "yes" : "no");

  // Clean up the draft row now that it's been saved to purchases
  if (resolvedGridData && pdfUrl) {
    const { error: deleteErr } = await supabase
      .from('grid_drafts')
      .delete()
      .eq('pdf_url', pdfUrl);
    if (deleteErr) console.warn("⚠️ Failed to delete grid draft:", deleteErr);
    else console.log("🗑️ grid_drafts row cleaned up for:", pdfUrl);
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
