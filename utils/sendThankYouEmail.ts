import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendThankYouEmailParams = {
  email: string;
  code: string;
  pdfUrl?: string;
  projectName?: string;
  stripeData?: any;
};

export async function sendThankYouEmail({
  email,
  code,
  pdfUrl,
  projectName,
  stripeData,
}: SendThankYouEmailParams) {
  await resend.emails.send({
    from: "Pipcasso <noreply@pipcasso.com>",
    to: email,
    subject: "🎲 Your Pipcasso download is ready!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 2rem; color: #1c1c1c;">
        
        <!-- Logo -->
        <img 
          src="https://dice-mosaic-frontend.vercel.app/images/HeaderLogo.png" 
          alt="Pipcasso Logo" 
          style="width: 140px; margin-bottom: 2rem;"
        />

        <!-- Greeting -->
        <h2 style="font-size: 1.4rem; font-weight: 600;">Thanks for your Pipcasso purchase!</h2>

        <p style="font-size: 1rem; margin: 1rem 0;">
          We’re truly honored that you chose Pipcasso to turn your image into something special. Your support helps us continue crafting one-of-a-kind dice art experiences — thank you!
        </p>

        <p style="font-size: 1rem;">
          Below is your unique access code. Use it to download your custom Dice Map whenever you’d like.
        </p>

        <!-- Code block -->
        <div style="font-size: 1.25rem; font-weight: bold; background: #f3f3f3; padding: 0.75rem 1rem; border-radius: 6px; letter-spacing: 1px; display: inline-block; margin: 1rem 0;">
          ${code}
        </div>

        <!-- Download Button -->
        <div style="margin: 1.5rem 0;">
          <a href="https://pipcasso.com/redeem"
            style="
              background-color: #E84C3D;
              color: white;
              padding: 0.75rem 1.5rem;
              text-decoration: none;
              font-weight: bold;
              border-radius: 6px;
              display: inline-block;
            "
          >
            ⬇️ Download Your Dice Map
          </a>
        </div>

        <p style="font-size: 0.95rem; color: #555;">
          You can return anytime to <a href="https://pipcasso.com/redeem">pipcasso.com/redeem</a> and enter your email + code to redownload your files.
        </p>

        <p style="margin-top: 2rem; font-size: 1rem;">
          If you love your mosaic, we’d be thrilled if you shared it with others or tagged us on social media. Every share helps our small team grow!
        </p>

        <hr style="margin: 2rem 0;" />

        <p style="font-size: 0.85rem; color: #888;">
          Need help? Just reply to this email or contact us at <a href="mailto:support@pipcasso.com">support@pipcasso.com</a>.
        </p>
        <p style="font-size: 0.75rem; color: #aaa;">
          Pipcasso 2025 • Digital download only – no physical dice included.
        </p>
      </div>
    `
  });
}
