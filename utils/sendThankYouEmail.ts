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
    from: "Pipcasso <noreply@pipcasso.com>", // ✅ keep using noreply@pipcasso.com for now
    to: email,
    subject: "🎲 Your Pipcasso download is ready!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #fdfdfd; border-radius: 10px; border: 1px solid #eee;">
        <img src="https://dice-mosaic-frontend.vercel.app/images/HeaderLogo.png" alt="Pipcasso Logo" style="max-width: 180px; margin-bottom: 1.5rem;" />

        <h2 style="color: #1C4C54;">Thank you for your Pipcasso purchase!</h2>

        <p style="font-size: 1rem; color: #333;">
          We're so grateful that you've chosen Pipcasso to create your unique dice mosaic portrait! 🎨✨
        </p>

        <p style="font-size: 1rem; color: #333;">
          <strong>Project:</strong> ${projectName || 'Your Pipcasso Art'}<br />
          <strong>Access Code:</strong> <span style="font-size: 1.25rem; letter-spacing: 2px; font-weight: bold; color: #E84C3D;">${code}</span>
        </p>

        <p style="font-size: 1rem;">
          You can access your project anytime at:<br />
          👉 <a href="https://pipcasso.com/redeem" style="color: #1C4C54;">https://pipcasso.com/redeem</a>
               ` : ''}

        <hr style="margin: 2rem 0;" />

        <p style="font-size: 0.95rem; color: #555;">
          If you have any questions or need assistance, simply reply to this email. We'd love to hear from you and help!
        </p>

        <p style="font-size: 0.95rem; color: #555;">Thanks again for supporting Pipcasso — your creativity inspires us! 🎲🧡</p>

        <p style="font-size: 0.95rem; color: #1C4C54; font-weight: bold;">– The Pipcasso Team</p>
      </div>
    `
  });
}
