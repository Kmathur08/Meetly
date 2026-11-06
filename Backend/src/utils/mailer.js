import config from "../config/env.js";

// Sends email through Brevo's HTTP API. Render's free plan blocks outgoing SMTP ports,
// so an HTTP API is the dependable way to send from there.
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export const mailConfigured = () => Boolean(config.mail.brevoApiKey && config.mail.from);

export const sendMail = async ({to, toName, subject, html, text}) => {
    if(!mailConfigured()) {
        // Locally there is no mail provider; print the message so the flow can still be tested.
        if(process.env.NODE_ENV !== "production") {
            console.log(`[mail] to ${to}: ${subject}\n${text}`);
            return;
        }
        throw new Error("Mail is not configured: set BREVO_API_KEY and MAIL_FROM");
    }

    const response = await fetch(BREVO_URL, {
        method: "POST",
        headers: {"api-key": config.mail.brevoApiKey, "content-type": "application/json", accept: "application/json"},
        body: JSON.stringify({
            sender: {email: config.mail.from, name: config.mail.fromName},
            to: [{email: to, name: toName || to}],
            subject,
            htmlContent: html,
            textContent: text
        }),
        signal: AbortSignal.timeout(10000)
    });
    if(!response.ok) throw new Error(`Brevo returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
};

const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const passwordResetEmail = ({name, link, minutes}) => {
    const firstName = String(name || "there").trim().split(/\s+/)[0];
    const text = `Hi ${firstName},

Someone asked to reset the password for your Meetly account. Open this link to choose a new one:

${link}

The link works for ${minutes} minutes and can be used once. If you didn't ask for this, ignore this email and your password stays the same.

– Meetly`;

    const html = `<!doctype html><html><body style="margin:0;background:#faf9ff;font-family:Arial,Helvetica,sans-serif;color:#12172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e5e5f1;border-radius:16px;padding:32px">
      <tr><td style="font-size:20px;font-weight:700;color:#4c3ce3;padding-bottom:20px">Meetly</td></tr>
      <tr><td style="font-size:22px;font-weight:700;padding-bottom:12px">Reset your password</td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#60627a;padding-bottom:24px">Hi ${escapeHtml(firstName)}, someone asked to reset the password for your Meetly account. Choose a new one with the button below.</td></tr>
      <tr><td style="padding-bottom:24px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#4c3ce3;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">Choose a new password</a></td></tr>
      <tr><td style="font-size:13px;line-height:1.6;color:#60627a">The link works for ${minutes} minutes and can be used once. If you didn't ask for this, ignore this email and your password stays the same.</td></tr>
      <tr><td style="font-size:12px;line-height:1.6;color:#9a97ad;padding-top:20px;word-break:break-all">Button not working? Paste this into your browser:<br>${escapeHtml(link)}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

    return {subject: "Reset your Meetly password", text, html};
};
