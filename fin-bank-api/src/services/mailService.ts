import nodemailer from "nodemailer";

export class MailService {
  // Hoş Geldin E-postası Metodu
  static async sendWelcomeEmail(
    toEmail: string,
    fullName: string,
    username: string,
    rawPassword: string,
  ) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1976d2; margin-top: 0; text-align: center;">FinBank Ailesine Hoş Geldiniz!</h2>
        <p style="font-size: 15px; color: #333;">Sayın <strong>${fullName}</strong>,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.5;">
          FinBank Personel Yönetim Portalı hesabınız başarıyla oluşturulmuştur. Sisteme giriş yapabileceğiniz hesap bilgileriniz aşağıda yer almaktadır:
        </p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 6px 0; font-size: 14px; color: #333;"><strong>Kullanıcı Adı:</strong> <span style="color: #1976d2;">${username}</span></p>
          <p style="margin: 6px 0; font-size: 14px; color: #333;"><strong>Geçici Şifre:</strong> <span style="color: #d32f2f; font-family: monospace; font-size: 15px;">${rawPassword}</span></p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${CLIENT_URL}/login" style="background-color: #1976d2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Portala Giriş Yap
          </a>
        </div>

        <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
          Güvenliğiniz için ilk girişinizden sonra şifrenizi değiştirmenizi öneririz. Bu hesabı siz açmadıysanız lütfen sistem yöneticisi ile iletişime geçiniz.
        </p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"FinBank Bilgilendirme" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "FinBank - Hesabınız Oluşturuldu",
        html: htmlContent,
      });

      return info;
    } catch (error: any) {
      console.error("Hoş geldin maili gönderilemedi:", error);
    }
  }

  //şifre sıfırlama emaili
  static async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    name: string,
  ) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
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
