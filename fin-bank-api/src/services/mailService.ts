import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class MailService {
  static async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    name: string,
  ) {
    // Kullanıcının tıklayacağı link (Frontend adresi)
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    try {
      await resend.emails.send({
        from: "FinBank Destek <onboarding@resend.dev>", // Resend'in test gönderici adresi
        to: toEmail, // Kendi kayıt olduğunuz Gmail adresiniz
        subject: "FinBank - Şifre Sıfırlama Bağlantısı",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #1976d2;">FinBank Personel Portalı</h2>
            <p>Merhaba <strong>${name}</strong>,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayabilirsiniz:</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Şifremi Sıfırla
              </a>
            </p>
            <small style="color: #888;">Bu bağlantı 15 dakika geçerlidir.</small>
          </div>
        `,
      });
      console.log(`Sıfırlama maili ${toEmail} adresine başarıyla gönderildi.`);
    } catch (error) {
      console.error("Mail gönderim hatası:", error);
      throw new Error("Mail gönderilemedi.");
    }
  }
}
