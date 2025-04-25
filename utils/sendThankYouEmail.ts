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

        <h2 style="color: #1C4C54;">Thank you for your purchase!</h2>

        <p style="font-size: 1rem; color: #333;">
          We're genuinely grateful that you've chosen Pipcasso to turn your photo into a one-of-a-kind dice mosaic. Each order helps support our tiny but passionate team — and we couldn't do this without you. 🎨✨
        </p>

        <p style="font-size: 1rem; color: #333;">
          Whether you're printing your piece, sharing it with friends, or simply admiring your pixel-perfect portrait — we hope it brings you joy!
        </p>

        <p style="font-size: 1rem; color: #333;">
          <strong>Project:</strong> ${projectName || 'Your Pipcasso Art'}<br />
          <strong>Redemption Code:</strong> <span style="font-size: 1.25rem; letter-spacing: 2px; font-weight: bold; color: #E84C3D;">${code}</span>
        </p>

        <p style="font-size: 1rem;">
          To access your downloads at any time, head to:<br />
          👉 <a href="https://pipcasso.com/redeem" style="color: #1C4C54;">https://pipcasso.com/redeem</a>
        </p>

        ${pdfUrl ? `
        <p>
          Your Dice Map PDF is also ready:<br />
          👉 <a href="${pdfUrl}" style="color: #1C4C54;">Download PDF</a>
        </p>
        ` : ''}

        <hr style="margin: 2rem 0;" />

        <p style="font-size: 0.95rem; color: #555;">
          If you ever need help, want to share feedback, or just want to say hi, feel free to reply to this email. We'd love to hear from you.
        </p>

        <p style="font-size: 0.95rem; color: #555;">Thank you again — your support truly means the world to us.</p>

        <p style="font-size: 0.95rem; color: #1C4C54; font-weight: bold;">– The Pipcasso Team</p>
      </div>
    `
  });
}
