import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendThankYouEmail({
  email,
  code,
  pdfUrl,
  projectName,
  stripeData,
}: {
  email: string;
  code: string;
  pdfUrl?: string;
  projectName?: string;
  stripeData?: any;
}) {
  await resend.emails.send({
    from: "Pipcasso <noreply@pipcasso.com>",
    to: email,
    subject: "🎲 Your Pipcasso download is ready!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #fdfdfd; border-radius: 10px; border: 1px solid #eee;">
        <img src="https://dice-mosaic-frontend.vercel.app/images/HeaderLogo.png" alt="Pipcasso Logo" style="max-width: 180px; margin-bottom: 1.5rem;" />

        <h2 style="color: #1C4C54;">Thanks for your Pipcasso purchase!</h2>

        <p style="font-size: 1rem; color: #333;">
          We're thrilled to have created your unique dice mosaic portrait!
        </p>

        <p style="font-size: 1rem; color: #333;">
          <strong>Project:</strong> ${projectName || 'Your Pipcasso Art'}<br />
          <strong>Download Code:</strong> <span style="font-size: 1.25rem; letter-spacing: 2px; font-weight: bold; color: #E84C3D;">${code}</span>
        </p>

        <p style="font-size: 1rem;">
          You can re-download your files anytime by visiting:<br />
          👉 <a href="https://pipcasso.com/redeem" style="color: #1C4C54;">https://pipcasso.com/redeem</a>
        </p>

        ${pdfUrl ? `
        <p>
          Your Dice Map PDF is also available here:<br />
          <a href="${pdfUrl}" style="color: #1C4C54;">Download PDF</a>
        </p>
        ` : ''}

        <hr style="margin: 2rem 0;" />

        <p style="font-size: 0.9rem; color: #777;">
          If you have any questions or need help, just reply to this email.<br />
          We’re always happy to help!
        </p>

        <p style="font-size: 0.9rem; color: #777;">🎲 The Pipcasso Team</p>
      </div>
    `
  });
}
