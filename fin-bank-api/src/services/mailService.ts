import nodemailer from "nodemailer";

export class MailService {
  static async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    name: string,
  ) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1976d2; margin-top: 0;">FinBank Personel Portalı</h2>
        <p style="font-size: 15px; color: #333;">Merhaba <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.5;">
          Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre belirlemek için aşağıdaki butona tıklayabilirsiniz:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1976d2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Şifremi Sıfırla
          </a>
        </div>
        <p style="font-size: 12px; color: #888;">
          Bu bağlantı <strong>15 dakika</strong> boyunca geçerlidir. Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.
        </p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"FinBank Destek" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "FinBank - Şifre Sıfırlama Bağlantısı",
        html: htmlContent,
      });

      return info;
    } catch (error: any) {
      console.error("Nodemailer mail gönderme hatası:", error);
      throw new Error("E-posta gönderimi başarısız oldu.");
    }
  }
}
