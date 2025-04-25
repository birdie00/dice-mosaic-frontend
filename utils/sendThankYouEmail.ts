import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailProps = {
  email: string;
  code: string;
  pdfUrl: string;
  projectName: string;
  stripeData?: any;
};

export default async function sendThankYouEmail({
  email,
  code,
  pdfUrl,
  projectName,
  stripeData,
}: EmailProps) {
  await resend.emails.send({
    from: 'Pipcasso <noreply@resend.dev>', // Replace with your domain later
    to: email,
    subject: '🎲 Your Dice Map and Access Code',
    html: `
      <div style="font-family: sans-serif; color: #111;">
        <h2>Thank you for your Pipcasso purchase!</h2>
        <p><strong>🎨 Project Name:</strong> ${projectName}</p>

        <p><strong>🎟️ Your Access Code:</strong> <code>${code}</code></p>

        <p>
          <a href="${pdfUrl}" style="display: inline-block; background-color: #E84C3D; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            ⬇️ Download Your Dice Map PDF
          </a>
        </p>

        <p>You can return anytime to <a href="https://pipcasso.com/redeem">pipcasso.com/redeem</a> and enter your email + code to download your map again.</p>

        <hr style="margin: 2rem 0;" />

        <p>Need help? Just reply to this email. Happy building!<br/>— The Pipcasso Team 🎲</p>
      </div>
    `,
  });
}
