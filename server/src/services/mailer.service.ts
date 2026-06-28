import nodemailer from 'nodemailer';

interface SmtpConfig {
  host?: string;
  port?: string | number;
  user?: string;
  pass?: string;
}

const getTransporter = async (smtpConfig?: SmtpConfig) => {
  const host = smtpConfig?.host || process.env.SMTP_HOST;
  const port = smtpConfig?.port ? Number(smtpConfig.port) : parseInt(process.env.SMTP_PORT || '587');
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      }),
      isTest: false,
      fromAddress: user
    };
  }

  // Generate Ethereal test account on the fly if no SMTP settings are configured
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    }),
    isTest: true,
    fromAddress: 'no-reply@submanager.com'
  };
};

export const sendWelcomeEmail = async (email: string, firstName: string, smtpConfig?: SmtpConfig) => {
  try {
    const { transporter, isTest, fromAddress } = await getTransporter(smtpConfig);
    
    const mailOptions = {
      from: `"SubManager" <${fromAddress}>`,
      to: email,
      subject: `SubManager'a Hoş Geldiniz! 🚀`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">SubManager Dünyasına Hoş Geldiniz!</h2>
          <p>Merhaba <strong>${firstName}</strong>,</p>
          <p>Aboneliklerinizi tek bir çatı altından akıllıca yönetebileceğiniz SubManager sisteminde hesabınız başarıyla oluşturuldu!</p>
          <p>Artık şunları yapabilirsiniz:</p>
          <ul>
            <li>Tüm aboneliklerinizi tek panelden takip edin.</li>
            <li>Yenileme tarihlerinden önce Telegram ve E-posta bildirimleri alın.</li>
            <li>Aile Planı davetiyeleri göndererek harcamalarınızı ortak yönetin.</li>
            <li>Detaylı analitik raporları dışa aktarın.</li>
          </ul>
          <div style="margin: 30px 0;">
            <a href="http://localhost:3000" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Panele Git</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">Bu e-posta otomatik olarak gönderilmiştir. Sorularınız için bizimle iletişime geçebilirsiniz.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
    return { success: true, messageId: info.messageId, previewUrl, isTest };
  } catch (error) {
    console.error('Welcome email error:', error);
    throw error;
  }
};

export const sendResetPasswordEmail = async (email: string, resetLink: string, smtpConfig?: SmtpConfig) => {
  try {
    const { transporter, isTest, fromAddress } = await getTransporter(smtpConfig);

    const mailOptions = {
      from: `"SubManager Security" <${fromAddress}>`,
      to: email,
      subject: `🔒 Şifre Sıfırlama Talebi - SubManager`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Şifre Sıfırlama Talebi</h2>
          <p>Merhaba,</p>
          <p>Hesabınız için bir şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Şifremi Sıfırla</a>
          </div>
          <p>Bu talep sizin tarafınızdan yapılmadıysa lütfen bu e-postayı yoksayın. Bağlantı süresi 1 saattir.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">Bu e-posta güvenlik gereği otomatik olarak üretilmiştir.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
    return { success: true, messageId: info.messageId, previewUrl, isTest };
  } catch (error) {
    console.error('Password reset email error:', error);
    throw error;
  }
};

export const sendSubscriptionChangeEmail = async (
  email: string, 
  subName: string, 
  actionType: 'Created' | 'Canceled' | 'Modified', 
  price?: string,
  smtpConfig?: SmtpConfig
) => {
  try {
    const { transporter, isTest, fromAddress } = await getTransporter(smtpConfig);

    let subject = '';
    let headline = '';
    let message = '';
    let color = '#4f46e5';

    if (actionType === 'Created') {
      subject = `➕ Yeni Abonelik Eklendi: ${subName}`;
      headline = `Abonelik Başarıyla Eklendi`;
      message = `Hesabınıza yeni bir <strong>${subName}</strong> aboneliği eklendi. Ödemeleriniz ve yenileme tarihleriniz otomatik takip edilmektedir.`;
      color = '#10b981';
    } else if (actionType === 'Canceled') {
      subject = `🚫 Abonelik İptal Edildi: ${subName}`;
      headline = `Abonelik İptal Edildi`;
      message = `<strong>${subName}</strong> aboneliğiniz sistem üzerinden iptal edildi veya pasife alındı.`;
      color = '#ef4444';
    } else {
      subject = `📝 Abonelik Güncellendi: ${subName}`;
      headline = `Abonelik Bilgileri Güncellendi`;
      message = `<strong>${subName}</strong> aboneliğinizin detayları başarıyla güncellendi.`;
      color = '#3b82f6';
    }

    const mailOptions = {
      from: `"SubManager Alerts" <${fromAddress}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: ${color}; margin-top: 0;">${headline}</h2>
          <p>Merhaba,</p>
          <p>${message}</p>
          ${price ? `
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">Plan: <strong>${subName}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;">Aylık Ücret: <strong>${price}</strong></p>
          </div>
          ` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">SubManager Akıllı Hatırlatıcı Servisi.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
    return { success: true, messageId: info.messageId, previewUrl, isTest };
  } catch (error) {
    console.error('Subscription change email error:', error);
    throw error;
  }
};
