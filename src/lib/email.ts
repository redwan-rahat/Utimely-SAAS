import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
) {
  const { data, error } = await resend.emails.send({
    from: "Utimely <hello@utimely.app>",
    to: email,
    subject: "Reset your Utimely password",
    html: `
      <div>
        <h2>Reset your password</h2>
        <p>Click the button below to reset your Utimely password.</p>
        <a href="${resetUrl}">
          Reset password
        </a>
      </div>
    `,
  });

  if (error) {
    console.error("RESEND ERROR:", error);
    throw new Error(error.message);
  }

  console.log("RESEND SUCCESS:", data);
}