import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const getTransporter = async (smtpConfig?: { host?: string; port?: number; user?: string; pass?: string }) => {
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
      isTest: false
    };
  }

  // Generate Ethereal test account on the fly if no SMTP settings are configured in .env
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
    isTest: true
  };
};

// Send Family Plan Invite
router.post('/invite', async (req: Request, res: Response) => {
  const { email, planName, senderName, smtpConfig } = req.body;
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const { transporter, isTest } = await getTransporter(smtpConfig);
    
    const mailOptions = {
      from: smtpConfig?.user ? `"SubManager" <${smtpConfig.user}>` : `"SubManager" <no-reply@submanager.com>`,
      to: email,
      subject: `Aile Planı Davetiye - ${planName || 'Spotify Premium'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">SubManager Aile Planına Davet Edildiniz!</h2>
          <p>Merhaba,</p>
          <p><strong>${senderName || 'Alex'}</strong> sizi <strong>${planName || 'Spotify Premium Family'}</strong> aboneliğinin paylaşılan Aile Planı grubuna katılmaya davet etti.</p>
          <p>Gruba katılarak ortak fatura hatırlatmalarını görebilir ve koltuk durumunuzu güncelleyebilirsiniz.</p>
          <div style="margin: 30px 0;">
            <a href="http://localhost:3000/family-plan" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Daveti Kabul Et</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">Bu e-posta SubManager üzerinden gönderilmiştir. Eğer bu daveti beklemiyorsanız bu mesajı yoksayabilirsiniz.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl,
      isTest
    });
  } catch (error: any) {
    console.error('Failed to send invite email:', error);
    res.status(500).json({ error: 'Email sending failed', details: error.message });
  }
});

// Send Subscription Renewal Notification Alert
router.post('/notify', async (req: Request, res: Response) => {
  const { email, subName, daysRemaining, price, userEmail, smtpConfig } = req.body;
  const targetEmail = email || userEmail;

  if (!targetEmail) {
    res.status(400).json({ error: 'Target email is required' });
    return;
  }

  try {
    const { transporter, isTest } = await getTransporter(smtpConfig);

    const mailOptions = {
      from: smtpConfig?.user ? `"SubManager Alerts" <${smtpConfig.user}>` : `"SubManager Alerts" <alerts@submanager.com>`,
      to: targetEmail,
      subject: `🔔 Fatura Hatırlatması: ${subName} - ${daysRemaining} Gün Kaldı!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48; margin-top: 0;">🔔 Abonelik Yenileme Uyarısı</h2>
          <p>Merhaba,</p>
          <p><strong>${subName}</strong> aboneliğinizin yenilenmesine sadece <strong>${daysRemaining} gün</strong> kaldı!</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">Abonelik: <strong>${subName}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;">Aylık Tutar: <strong>${price || '$9.99'}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;">Kalan Süre: <strong style="color: #e11d48;">${daysRemaining} Gün</strong></p>
          </div>
          <p>Lütfen kart bakiyenizi kontrol edin veya yenileme istemiyorsanız aboneliğinizi iptal edin.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">Bu e-posta SubManager Akıllı Hatırlatıcı tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl,
      isTest
    });
  } catch (error: any) {
    console.error('Failed to send notification email:', error);
    res.status(500).json({ error: 'Email notification failed', details: error.message });
  }
});

export default router;
