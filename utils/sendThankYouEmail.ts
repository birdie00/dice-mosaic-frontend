import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendThankYouEmail(email: string, code: string) {
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

        <!-- Message -->
        <p style="font-size: 1rem; margin: 1rem 0 0.75rem;">
          Your project is ready and your access code is:
        </p>

        <!-- Code block -->
        <div style="font-size: 1.25rem; font-weight: bold; background: #f3f3f3; padding: 0.75rem 1rem; border-radius: 6px; letter-spacing: 1px; display: inline-block; margin-bottom: 1rem;">
          ${code}
        </div>

        <!-- Button -->
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

        <!-- Divider -->
        <hr style="margin: 2rem 0;" />

        <!-- Footer -->
        <p style="font-size: 0.85rem; color: #888;">
          Have questions or need help? Just reply to this email or contact us at <a href="mailto:support@pipcasso.com">support@pipcasso.com</a>.
        </p>
        <p style="font-size: 0.75rem; color: #aaa;">
          Pipcasso 2025 • Digital download only – no physical dice included.
        </p>
      </div>
    `
  });
}
