/**
 * Email Service for sending notifications via email
 * Currently uses console logging as placeholder
 * In production, integrate with email service provider (SendGrid, AWS SES, Nodemailer, etc.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SessionNotificationData {
  sessionId: string;
  sessionTime: Date;
  menteeName: string;
  menteeEmail: string;
  mentorName: string;
  mentorEmail: string;
  sessionGoal?: string;
  sessionQuestions?: string;
}

export class EmailService {
  /**
   * Send email notification
   * @param options Email options
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Integrate with actual email service provider
      // Options:
      // 1. SendGrid: https://sendgrid.com/
      // 2. AWS SES: https://aws.amazon.com/ses/
      // 3. Nodemailer with SMTP: https://nodemailer.com/
      // 4. Mailgun: https://www.mailgun.com/
      
      console.log('[EmailService] Email would be sent:', {
        to: options.to,
        subject: options.subject,
        html: options.html.substring(0, 100) + '...',
      });

      // Placeholder: In production, replace with actual email sending
      // Example with Nodemailer:
      /*
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@lifely.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });
      */

      return true;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return false;
    }
  }

  /**
   * Send session reminder email (24 hours before)
   */
  static async sendSessionReminder24h(data: SessionNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #A11692 0%, #A31694 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #A11692; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nhắc nhở phiên tư vấn</h1>
            </div>
            <div class="content">
              <p>Xin chào ${data.mentorName},</p>
              <p>Bạn có một phiên tư vấn sắp diễn ra trong <strong>24 giờ</strong>:</p>
              <ul>
                <li><strong>Thời gian:</strong> ${new Date(data.sessionTime).toLocaleString('vi-VN')}</li>
                <li><strong>Người được tư vấn:</strong> ${data.menteeName}</li>
                <li><strong>Email:</strong> ${data.menteeEmail}</li>
                ${data.sessionGoal ? `<li><strong>Mục tiêu:</strong> ${data.sessionGoal}</li>` : ''}
              </ul>
              <p>Vui lòng chuẩn bị và đảm bảo bạn sẵn sàng cho phiên tư vấn này.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/sessions/${data.sessionId}" class="button">Xem chi tiết phiên</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: data.mentorEmail,
      subject: `Nhắc nhở: Phiên tư vấn với ${data.menteeName} trong 24 giờ`,
      html,
    });
  }

  /**
   * Send session reminder email (1 hour before)
   */
  static async sendSessionReminder1h(data: SessionNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #A11692 0%, #A31694 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #A11692; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .urgent { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Phiên tư vấn sắp bắt đầu</h1>
            </div>
            <div class="content">
              <div class="urgent">
                <p><strong>Phiên tư vấn của bạn sẽ bắt đầu trong 1 giờ!</strong></p>
              </div>
              <p>Xin chào ${data.mentorName},</p>
              <p>Thông tin phiên tư vấn:</p>
              <ul>
                <li><strong>Thời gian:</strong> ${new Date(data.sessionTime).toLocaleString('vi-VN')}</li>
                <li><strong>Người được tư vấn:</strong> ${data.menteeName}</li>
                <li><strong>Email:</strong> ${data.menteeEmail}</li>
              </ul>
              <p>Vui lòng chuẩn bị và tham gia phiên tư vấn đúng giờ.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/sessions/${data.sessionId}/waiting" class="button">Tham gia phiên</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: data.mentorEmail,
      subject: `⚠️ Phiên tư vấn với ${data.menteeName} bắt đầu trong 1 giờ`,
      html,
    });
  }

  /**
   * Send session accepted notification to mentee
   */
  static async sendSessionAcceptedToMentee(data: SessionNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Phiên tư vấn đã được chấp nhận</h1>
            </div>
            <div class="content">
              <p>Xin chào ${data.menteeName},</p>
              <p>Yêu cầu phiên tư vấn của bạn đã được <strong>${data.mentorName}</strong> chấp nhận!</p>
              <p>Thông tin phiên tư vấn:</p>
              <ul>
                <li><strong>Thời gian:</strong> ${new Date(data.sessionTime).toLocaleString('vi-VN')}</li>
                <li><strong>Mentor:</strong> ${data.mentorName}</li>
              </ul>
              <p>Vui lòng chuẩn bị và tham gia phiên tư vấn đúng giờ.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/sessions/${data.sessionId}" class="button">Xem chi tiết</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: data.menteeEmail,
      subject: `✅ Phiên tư vấn với ${data.mentorName} đã được chấp nhận`,
      html,
    });
  }

  /**
   * Send new session request notification to mentor
   */
  static async sendNewSessionRequestToMentor(data: SessionNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; margin-right: 10px; }
            .button-danger { background: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Yêu cầu phiên tư vấn mới</h1>
            </div>
            <div class="content">
              <p>Xin chào ${data.mentorName},</p>
              <p>Bạn có một yêu cầu phiên tư vấn mới từ <strong>${data.menteeName}</strong>:</p>
              <ul>
                <li><strong>Thời gian đề xuất:</strong> ${new Date(data.sessionTime).toLocaleString('vi-VN')}</li>
                <li><strong>Người yêu cầu:</strong> ${data.menteeName}</li>
                <li><strong>Email:</strong> ${data.menteeEmail}</li>
                ${data.sessionGoal ? `<li><strong>Mục tiêu:</strong> ${data.sessionGoal}</li>` : ''}
                ${data.sessionQuestions ? `<li><strong>Câu hỏi:</strong> ${data.sessionQuestions}</li>` : ''}
              </ul>
              <p>Vui lòng xem xét và chấp nhận hoặc từ chối yêu cầu này.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/sessions/${data.sessionId}" class="button">Xem chi tiết</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: data.mentorEmail,
      subject: `Yêu cầu phiên tư vấn mới từ ${data.menteeName}`,
      html,
    });
  }
}
