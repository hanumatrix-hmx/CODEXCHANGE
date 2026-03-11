import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLicenseConfirmationEmail(email: string, licenseKey: string, assetName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Email not sent.");
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'Codexchange <onboarding@resend.dev>',
            to: email,
            subject: `Your License Key for ${assetName}`,
            text: `Thank you for your purchase!

Your license key for ${assetName} is: ${licenseKey}

Keep this key secure. You can also view it anytime in your Codexchange dashboard.

Best,
The Codexchange Team`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5;">
                    <h2>Thank you for your purchase!</h2>
                    <p>Your license key for <strong>${assetName}</strong> is ready.</p>
                    <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <code style="font-size: 1.2rem; color: #000; font-weight: bold;">${licenseKey}</code>
                    </div>
                    <p>Keep this key secure. You can also view it anytime in your Codexchange dashboard.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #666; font-size: 0.9rem;">Best,<br>The Codexchange Team</p>
                </div>
            `,
        });

        if (data.error) {
            console.error("Resend API returned an error:", data.error);
            return { success: false, error: data.error };
        }

        console.log("Email sent successfully via Resend. ID:", data.data?.id);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send license email (Exception):", error);
        return { success: false, error };
    }
}
