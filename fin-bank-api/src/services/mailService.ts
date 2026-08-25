export class MailService {
  private static get clientUrl(): string {
    return (
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    );
  }

  // Google OAuth 2.0 Access Token Alma (HTTPS Port 443)
  private static async getAccessToken(): Promise<string> {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
      console.error("[Google OAuth Hatası]:", data);
      throw new Error("Google access token alınamadı.");
    }

    return data.access_token;
  }

  // Merkezi Gönderim Metodu (Gmail REST API - Port Kısıtlamasından Etkilenmez)
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
        `[MailService] E-posta gönderimi başlatılıyor (HTTPS API) -> Kime: ${to}`,
      );

      const accessToken = await this.getAccessToken();

      // RFC 2822 Standartlarında E-posta Başlığı ve Gövdesi
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
      const messageParts = [
        `From: "FinBank ${senderTitle}" <${process.env.SMTP_USER}>`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: 7bit",
        "",
        html,
      ];
      const message = messageParts.join("\r\n");

      // Web-Safe Base64 Formatı
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedMessage }),
        },
      );

      const result = await res.json();
      if (!res.ok) {
        console.error("[Gmail API Hata Yanıtı]:", result);
        throw new Error("Gmail API isteği reddetti.");
      }

      console.log(`[MailService] E-posta başarıyla iletildi: ${result.id}`);
      return result;
    } catch (error: any) {
      console.error(
        `[MailService Hatası] (${subject}):`,
        error.message || error,
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
  // Kayıt Davet E-postası
  static async sendInvitationEmail(
    toEmail: string,
    fullName: string,
    username: string,
    setupToken: string,
  ) {
    const setupLink = `${this.clientUrl}/setup-password?token=${setupToken}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <h2 style="color: #1976d2; margin-top: 0; text-align: center;">FinBank Ailesine Hoş Geldiniz!</h2>
      <p style="font-size: 15px; color: #333;">Sayın <strong>${fullName}</strong>,</p>
      <p style="font-size: 14px; color: #555; line-height: 1.5;">
        FinBank Personel Yönetim Portalı hesabınız tanımlanmıştır. Sisteme giriş yaparken kullanacağınız kurumsal kullanıcı adınız aşağıda belirtilmiştir:
      </p>

      <div style="background-color: #f0f7ff; border: 1px solid #cce3ff; border-radius: 8px; padding: 14px; margin: 18px 0; text-align: center;">
        <span style="font-size: 13px; color: #555;">Kullanıcı Adınız:</span>
        <div style="font-size: 18px; font-weight: bold; color: #0a192f; letter-spacing: 0.5px; margin-top: 4px;">${username}</div>
      </div>

      <p style="font-size: 14px; color: #555; line-height: 1.5;">
        Hesabınızı aktif hale getirmek ve giriş şifrenizi oluşturmak için aşağıdaki bağlantıyı kullanabilirsiniz:
      </p>

      <div style="text-align: center; margin: 25px 0;">
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
      subject: "FinBank - Personel Hesabı Aktivasyonu",
      html: htmlContent,
      senderTitle: "Hesap Aktivasyonu",
    });
  }
}
