import nodemailer from "nodemailer";

export class MailService {
  private static get clientUrl(): string {
    return (
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    );
  }

  // Gmail OAuth 2.0 Taşıyıcısı
  private static get transporter() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SMTP_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
  }

  // Merkezi Gönderim Metodu
  private static async send({
    to,
    subject,
    html,
    senderTitle = "Bilgilendirme",
  }: {
    to: string;
    subject: string;
    html: string;
    senderTitle?: string;
  }) {
    try {
      console.log(
        `[MailService] E-posta gönderimi başlatılıyor -> Kime: ${to}, SMTP_USER: ${process.env.SMTP_USER}`,
      );

      const info = await this.transporter.sendMail({
        from: `"FinBank ${senderTitle}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      console.log(
        `[MailService] E-posta başarıyla gönderildi: ${info.messageId}`,
      );
      return info;
    } catch (error: any) {
      // Google / Nodemailer'ın döndürdüğü gerçek hatayı loglayın:
      console.error(
        `[MailService Hatası] (${subject}):`,
        error.response || error.message || error,
      );
      throw new Error(`E-posta gönderimi başarısız oldu: ${error.message}`);
    }
  }

  // Hoş Geldin E-postası
  static async sendWelcomeEmail(
    toEmail: string,
    fullName: string,
    username: string,
    rawPassword: string,
  ) {
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
          <a href="${this.clientUrl}/login" style="background-color: #1976d2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Portala Giriş Yap
          </a>
        </div>

        <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
          Güvenliğiniz için ilk girişinizden sonra şifrenizi değiştirmenizi öneririz.
        </p>
      </div>
    `;

    return await this.send({
      to: toEmail,
      subject: "FinBank - Hesabınız Oluşturuldu",
      html: htmlContent,
      senderTitle: "Bilgilendirme",
    });
  }

  // Şifre Sıfırlama E-postası
  static async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    name: string,
  ) {
    const resetLink = `${this.clientUrl}/reset-password?token=${resetToken}`;

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
          Bu bağlantı <strong>15 dakika</strong> boyunca geçerlidir.
        </p>
      </div>
    `;

    return await this.send({
      to: toEmail,
      subject: "FinBank - Şifre Sıfırlama Bağlantısı",
      html: htmlContent,
      senderTitle: "Destek",
    });
  }

  // Kayıt Davet E-postası
  static async sendInvitationEmail(
    toEmail: string,
    fullName: string,
    setupToken: string,
  ) {
    const setupLink = `${this.clientUrl}/setup-password?token=${setupToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1976d2; margin-top: 0; text-align: center;">FinBank Ailesine Hoş Geldiniz!</h2>
        <p style="font-size: 15px; color: #333;">Sayın <strong>${fullName}</strong>,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.5;">
          FinBank Personel Yönetim Portalı hesabınız tanımlanmıştır. Hesabınızı aktif hale getirmek ve ilk şifrenizi belirlemek için aşağıdaki butona tıklayınız:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" style="background-color: #1976d2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Hesabımı Aktifleştir & Şifre Oluştur
          </a>
        </div>

        <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
          Bu bağlantı <strong>24 saat</strong> boyunca geçerlidir.
        </p>
      </div>
    `;

    return await this.send({
      to: toEmail,
      subject: "FinBank - Hesabınızı Aktifleştirin",
      html: htmlContent,
      senderTitle: "Hesap Aktivasyonu",
    });
  }
}
