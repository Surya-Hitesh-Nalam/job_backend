import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test the connection on startup
interface TransporterVerifyCallback {
  (error: Error | null, success: boolean): void;
}

(transporter.verify as (callback: TransporterVerifyCallback) => void)((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  try {
    const otpTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JobQuest - OTP Verification</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                padding: 20px;
                line-height: 1.6;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.3);
            }
            
            .header {
                background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
            }
            
            @keyframes shimmer {
                0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
                50% { transform: translateX(-50%) translateY(-50%) rotate(180deg); }
            }
            
            .logo {
                font-size: 32px;
                font-weight: 800;
                color: #ffffff;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
            
            .tagline {
                color: #e2e8f0;
                font-size: 16px;
                font-weight: 400;
                position: relative;
                z-index: 1;
            }
            
            .content {
                padding: 50px 40px;
                text-align: center;
            }
            
            .greeting {
                font-size: 24px;
                color: #1e293b;
                margin-bottom: 20px;
                font-weight: 600;
            }
            
            .message {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 40px;
                line-height: 1.7;
            }
            
            .otp-container {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
                position: relative;
                overflow: hidden;
            }
            
            .otp-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #1e40af, #3730a3, #1e3a8a);
            }
            
            .otp-label {
                font-size: 14px;
                color: #64748b;
                margin-bottom: 15px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .otp-code {
                font-size: 36px;
                font-weight: 800;
                color: #1e40af;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
                margin: 10px 0;
            }
            
            .validity {
                font-size: 14px;
                color: #f59e0b;
                font-weight: 600;
                background: #fef3c7;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                margin-top: 15px;
                border: 1px solid #fcd34d;
            }
            
            .security-note {
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                text-align: left;
            }
            
            .security-note h3 {
                color: #dc2626;
                font-size: 16px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .security-icon {
                margin-right: 8px;
                font-size: 18px;
            }
            
            .security-note p {
                color: #7f1d1d;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .footer {
                background: #f8fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .company-info {
                color: #94a3b8;
                font-size: 12px;
                margin-top: 20px;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 30px 0;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 12px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 4px;
                }
                
                .greeting {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">JobQuest</div>
                <div class="tagline">Your Gateway to Career Success</div>
            </div>
            
            <div class="content">
                <h1 class="greeting">Verify Your Account</h1>
                <p class="message">
                    We received a request to verify your JobQuest account. Use the OTP code below to complete your verification process.
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="validity">⏱️ Valid for 10 minutes</div>
                </div>
                
                <div class="divider"></div>
                
                <div class="security-note">
                    <h3><span class="security-icon">🔒</span>Security Notice</h3>
                    <p>This OTP is confidential and for your use only. Never share this code with anyone. JobQuest will never ask for your OTP over phone or email.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>If you didn't request this verification, please ignore this email.</p>
                <p>Need help? Contact our support team anytime.</p>
                <div class="company-info">
                    © 2025 JobQuest. All rights reserved.<br>
                    This is an automated email, please do not reply.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"JobQuest" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🔐 JobQuest - Your OTP Verification Code',
      html: otpTemplate,
    };

    console.log('Mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    console.log('Email info:', info);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    if (typeof error === 'object' && error !== null) {
      const err = error as { [key: string]: any };
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
      });
    }
    throw error;
  }
};
export const sendRoundResultEmail = async (
  to: string,
  roundName: string,
  status: string,
  opportunityLink: string = 'https://jobquest.com/opportunities'
): Promise<void> => {
  const isQualified = status === 'Qualified';
  
  const roundResultTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JobQuest - Round Result</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 20px;
              line-height: 1.6;
          }
          
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.3);
          }
          
          .header {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
          }
          
          .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
              0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
              50% { transform: translateX(-50%) translateY(-50%) rotate(180deg); }
          }
          
          .logo {
              font-size: 32px;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
          }
          
          .tagline {
              color: #e2e8f0;
              font-size: 16px;
              font-weight: 400;
              position: relative;
              z-index: 1;
          }
          
          .content {
              padding: 50px 40px;
              text-align: center;
          }
          
          .status-badge {
              display: inline-block;
              padding: 12px 24px;
              border-radius: 25px;
              font-weight: 700;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 30px;
              ${isQualified 
                ? 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);'
                : 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);'
              }
          }
          
          .round-name {
              font-size: 28px;
              color: #1e293b;
              margin-bottom: 20px;
              font-weight: 700;
          }
          
          .result-icon {
              font-size: 64px;
              margin-bottom: 20px;
          }
          
          .message {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 40px;
              line-height: 1.7;
          }
          
          .message p {
              margin-bottom: 15px;
          }
          
          .cta-container {
              margin: 40px 0;
          }
          
          .cta-button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
              text-transform: uppercase;
              letter-spacing: 1px;
          }
          
          .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(30, 64, 175, 0.6);
              background: linear-gradient(135deg, #3730a3 0%, #1e3a8a 100%);
          }
          
          .next-steps {
              background: ${isQualified ? '#f0fdf4' : '#fef3c7'};
              border: 1px solid ${isQualified ? '#bbf7d0' : '#fcd34d'};
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: left;
          }
          
          .next-steps h3 {
              color: ${isQualified ? '#166534' : '#92400e'};
              font-size: 18px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
          }
          
          .next-steps-icon {
              margin-right: 10px;
              font-size: 20px;
          }
          
          .next-steps p {
              color: ${isQualified ? '#15803d' : '#a16207'};
              font-size: 15px;
              line-height: 1.6;
          }
          
          .stats-container {
              display: flex;
              justify-content: space-around;
              margin: 30px 0;
              background: #f8fafc;
              padding: 25px;
              border-radius: 12px;
          }
          
          .stat-item {
              text-align: center;
          }
          
          .stat-number {
              font-size: 24px;
              font-weight: 800;
              color: #1e40af;
              display: block;
          }
          
          .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 5px;
          }
          
          .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 10px;
          }
          
          .company-info {
              color: #94a3b8;
              font-size: 12px;
              margin-top: 20px;
          }
          
          .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
          }
          
          .social-links {
              margin: 20px 0;
          }
          
          .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #64748b;
              text-decoration: none;
              font-size: 14px;
              transition: color 0.3s ease;
          }
          
          .social-links a:hover {
              color: #1e40af;
          }
          
          @media (max-width: 600px) {
              .email-container {
                  margin: 10px;
                  border-radius: 12px;
              }
              
              .header {
                  padding: 30px 20px;
              }
              
              .content {
                  padding: 30px 20px;
              }
              
              .round-name {
                  font-size: 22px;
              }
              
              .result-icon {
                  font-size: 48px;
              }
              
              .stats-container {
                  flex-direction: column;
                  gap: 15px;
              }
              
              .cta-button {
                  padding: 14px 28px;
                  font-size: 14px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              <div class="logo">JobQuest</div>
              <div class="tagline">Your Gateway to Career Success</div>
          </div>
          
          <div class="content">
              <div class="result-icon">${isQualified ? '🎉' : '💼'}</div>
              <div class="status-badge">${status}</div>
              <h1 class="round-name">${roundName}</h1>
              
              <div class="message">
                  ${isQualified 
                    ? `<p><strong>Congratulations!</strong> You have successfully <strong>qualified</strong> for the <strong>${roundName}</strong> round.</p>
                       <p>Your performance was outstanding and we're excited to see you move forward in the process.</p>`
                    : `<p>Thank you for your participation in the <strong>${roundName}</strong> round.</p>
                       <p>While you haven't qualified this time, we appreciate your effort and encourage you to explore other opportunities with us.</p>`
                  }
              </div>
              
              <div class="next-steps">
                  <h3>
                      <span class="next-steps-icon">${isQualified ? '🚀' : '🔍'}</span>
                      ${isQualified ? 'What\'s Next?' : 'Keep Exploring'}
                  </h3>
                  <p>
                      ${isQualified 
                        ? 'Stay tuned for the next round instructions. We\'ll send you detailed information about the upcoming assessment within the next 24-48 hours.'
                        : 'Don\'t let this stop you! We have many other exciting opportunities that might be perfect for your skills and experience.'
                      }
                  </p>
              </div>
              
              <div class="cta-container">
                  <a href="${opportunityLink}" class="cta-button">
                      ${isQualified ? '📊 View Dashboard' : '🔍 View Opportunities'}
                  </a>
              </div>
              
              <div class="divider"></div>
          </div>
          
          <div class="footer">
              <p>Need assistance? Our support team is here to help you 24/7.</p>
              
              <div class="company-info">
                  © 2025 JobQuest. All rights reserved.<br>
                  This is an automated email, please do not reply directly.
              </div>
          </div>
      </div>
  </body>
  </html>
  `;

  try {
    const mailOptions = {
      from: `"JobQuest" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${isQualified ? '🎉' : '📋'} JobQuest - ${roundName} Round Result`,
      html: roundResultTemplate,
    };

    console.log('Mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Round result email sent successfully:', info.messageId);
    console.log('Email info:', info);
  } catch (error) {
    console.error('❌ Failed to send round result email:', error);
    if (typeof error === 'object' && error !== null) {
      const err = error as { [key: string]: any };
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
      });
    }
    throw error;
  }
};

export const sendJobApplicationEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  companyName: string,
  dashboardLink: string = 'https://jobquest.com/dashboard'
): Promise<void> => {
  
  const jobApplicationTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JobQuest - Application Confirmation</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 20px;
              line-height: 1.6;
          }
          
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.3);
          }
          
          .header {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
          }
          
          .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
              0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
              50% { transform: translateX(-50%) translateY(-50%) rotate(180deg); }
          }
          
          .logo {
              font-size: 32px;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
          }
          
          .tagline {
              color: #e2e8f0;
              font-size: 16px;
              font-weight: 400;
              position: relative;
              z-index: 1;
          }
          
          .content {
              padding: 50px 40px;
          }
          
          .success-icon {
              font-size: 64px;
              text-align: center;
              margin-bottom: 20px;
          }
          
          .success-badge {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: inline-block;
              margin-bottom: 20px;
              box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
          }
          
          .greeting {
              font-size: 24px;
              color: #1e293b;
              margin-bottom: 15px;
              font-weight: 600;
          }
          
          .main-message {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 30px;
              line-height: 1.7;
          }
          
          .job-details {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              position: relative;
              overflow: hidden;
          }
          
          .job-details::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #1e40af, #3730a3, #1e3a8a);
          }
          
          .job-title {
              font-size: 20px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 8px;
          }
          
          .company-name {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 15px;
              font-weight: 500;
          }
          
          .application-id {
              background: #fef3c7;
              border: 1px solid #fcd34d;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              color: #92400e;
              font-weight: 600;
              display: inline-block;
          }
          
          .timeline-section {
              margin: 30px 0;
          }
          
          .timeline-title {
              font-size: 18px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
          }
          
          .timeline-icon {
              margin-right: 10px;
              font-size: 20px;
          }
          
          .timeline-steps {
              display: flex;
              justify-content: space-between;
              position: relative;
              margin: 25px 0;
          }
          
          .timeline-steps::before {
              content: '';
              position: absolute;
              top: 15px;
              left: 15px;
              right: 15px;
              height: 2px;
              background: #e2e8f0;
              z-index: 1;
          }
          
          .timeline-step {
              text-align: center;
              flex: 1;
              position: relative;
              z-index: 2;
          }
          
          .step-circle {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              margin: 0 auto 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 12px;
              color: white;
          }
          
          .step-active {
              background: #10b981;
              box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
          }
          
          .step-pending {
              background: #e2e8f0;
              color: #64748b;
          }
          
          .step-label {
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
          }
          
          .cta-container {
              text-align: center;
              margin: 40px 0;
          }
          
          .cta-button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
              text-transform: uppercase;
              letter-spacing: 1px;
          }
          
          .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(30, 64, 175, 0.6);
              background: linear-gradient(135deg, #3730a3 0%, #1e3a8a 100%);
          }
          
          .tips-section {
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
          }
          
          .tips-title {
              color: #0369a1;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
          }
          
          .tips-icon {
              margin-right: 8px;
              font-size: 18px;
          }
          
          .tips-list {
              color: #0c4a6e;
              font-size: 14px;
              line-height: 1.6;
          }
          
          .tips-list li {
              margin-bottom: 8px;
              padding-left: 5px;
          }
          
          .contact-section {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
          }
          
          .contact-title {
              color: #dc2626;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
          }
          
          .contact-text {
              color: #7f1d1d;
              font-size: 14px;
          }
          
          .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 10px;
          }
          
          .company-signature {
              color: #1e40af;
              font-weight: 600;
              margin: 15px 0;
          }
          
          .company-info {
              color: #94a3b8;
              font-size: 12px;
              margin-top: 20px;
          }
          
          .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
          }
          
          @media (max-width: 600px) {
              .email-container {
                  margin: 10px;
                  border-radius: 12px;
              }
              
              .header {
                  padding: 30px 20px;
              }
              
              .content {
                  padding: 30px 20px;
              }
              
              .greeting {
                  font-size: 20px;
              }
              
              .timeline-steps {
                  flex-direction: column;
                  gap: 20px;
              }
              
              .timeline-steps::before {
                  display: none;
              }
              
              .cta-button {
                  padding: 14px 28px;
                  font-size: 14px;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              <div class="logo">JobQuest</div>
              <div class="tagline">Your Gateway to Career Success</div>
          </div>
          
          <div class="content">
              <div class="success-icon">🎯</div>
              <div class="success-badge">Application Received</div>
              
              <h1 class="greeting">Hi ${userName}! 👋</h1>
              
              <div class="main-message">
                  <p><strong>Exciting news!</strong> We've successfully received your application and you're now officially in the running for an amazing opportunity.</p>
              </div>
              
              <div class="job-details">
                  <div class="job-title">${jobTitle}</div>
                  <div class="company-name">📍 ${companyName}</div>
              </div>
              
              <div class="timeline-section">
                  <div class="timeline-title">
                      <span class="timeline-icon">📋</span>
                      Your Application Journey
                  </div>
                  
                  <div class="timeline-steps">
                      <div class="timeline-step">
                          <div class="step-circle step-active">✓</div>
                          <div class="step-label">Applied</div>
                      </div>
                      <div class="timeline-step">
                          <div class="step-circle step-pending">2</div>
                          <div class="step-label">Review</div>
                      </div>
                      <div class="timeline-step">
                          <div class="step-circle step-pending">3</div>
                          <div class="step-label">Interview</div>
                      </div>
                      <div class="timeline-step">
                          <div class="step-circle step-pending">4</div>
                          <div class="step-label">Decision</div>
                      </div>
                  </div>
              </div>
              
              <div class="tips-section">
                  <div class="tips-title">
                      <span class="tips-icon">💡</span>
                      Pro Tips While You Wait
                  </div>
                  <ul class="tips-list">
                      <li><strong>Keep your profile updated</strong> - Make sure your skills and experience are current</li>
                      <li><strong>Check your email regularly</strong> - We'll send updates about your application status</li>
                      <li><strong>Research the company</strong> - Learn more about ${companyName}'s culture and values</li>
                      <li><strong>Prepare for potential interviews</strong> - Review common questions for ${jobTitle} roles</li>
                  </ul>
              </div>
              
              <div class="cta-container">
                  <a href="${dashboardLink}" class="cta-button">
                      📊 Track Application Status
                  </a>
              </div>
              
              <div class="divider"></div>
              
              <div class="contact-section">
                  <div class="contact-title">🤝 Need Help?</div>
                  <div class="contact-text">Our support team is here to assist you throughout the process. Don't hesitate to reach out!</div>
              </div>
          </div>
          
          <div class="footer">
              <p>We're excited about the possibility of you joining the ${companyName} team!</p>
              <div class="company-signature">
                  Best regards,<br>
                  <strong>${companyName} Recruitment Team</strong><br>
                  <em>via JobQuest Platform</em>
              </div>
              
              <div class="company-info">
                  © 2025 JobQuest. All rights reserved.<br>
                  This is an automated confirmation email.
              </div>
          </div>
      </div>
  </body>
  </html>
  `;

  try {
    const mailOptions = {
      from: `"JobQuest - ${companyName}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎯 Application Confirmed: ${jobTitle} at ${companyName} | JobQuest`,
      html: jobApplicationTemplate,
    };

    console.log('Mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Job application email sent successfully:', info.messageId);
    console.log('Email info:', info);
  } catch (error) {
    console.error('❌ Failed to send job application email:', error);
    if (typeof error === 'object' && error !== null) {
      const err = error as { [key: string]: any };
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
      });
    }
    throw error;
  }
};

export const sendJobPostedEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  lastDateToApply: string,
  applyLink: string = 'https://jobquest.com/jobs'
): Promise<void> => {

  const jobNotificationTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JobQuest - New Job Alert</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 20px;
              line-height: 1.6;
          }
          
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.3);
          }
          
          .header {
              background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
          }
          
          .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
              0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
              50% { transform: translateX(-50%) translateY(-50%) rotate(180deg); }
          }
          
          .logo {
              font-size: 32px;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
          }
          
          .tagline {
              color: #e2e8f0;
              font-size: 16px;
              font-weight: 400;
              position: relative;
              z-index: 1;
          }
          
          .content {
              padding: 50px 40px;
          }
          
          .alert-icon {
              font-size: 64px;
              text-align: center;
              margin-bottom: 20px;
              animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
          }
          
          .new-job-badge {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 10px 24px;
              border-radius: 25px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: inline-block;
              margin-bottom: 20px;
              box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
              position: relative;
              overflow: hidden;
          }
          
          .new-job-badge::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
              animation: shine 2s infinite;
          }
          
          @keyframes shine {
              0% { left: -100%; }
              100% { left: 100%; }
          }
          
          .greeting {
              font-size: 24px;
              color: #1e293b;
              margin-bottom: 15px;
              font-weight: 600;
          }
          
          .intro-message {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 30px;
              line-height: 1.7;
          }
          
          .job-card {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          
          .job-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 5px;
              background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
          }
          
          .job-title {
              font-size: 24px;
              font-weight: 800;
              color: #1e40af;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 10px;
          }
          
          .job-title-icon {
              background: linear-gradient(135deg, #1e40af, #3730a3);
              color: white;
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
          }
          
          .company-name {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 20px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
          }
          
          .job-description {
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
              margin-bottom: 25px;
              background: white;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #1e40af;
          }
          
          .deadline-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #fcd34d;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
              position: relative;
          }
          
          .deadline-icon {
              font-size: 32px;
              margin-bottom: 10px;
              animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
          }
          
          .deadline-title {
              color: #92400e;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
          }
          
          .deadline-date {
              color: #78350f;
              font-size: 20px;
              font-weight: 800;
          }
          
          .cta-container {
              text-align: center;
              margin: 40px 0;
          }
          
          .cta-button {
              display: inline-block;
              padding: 18px 40px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 700;
              font-size: 18px;
              transition: all 0.3s ease;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
              text-transform: uppercase;
              letter-spacing: 1px;
              position: relative;
              overflow: hidden;
          }
          
          .cta-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
          }
          
          .cta-button:hover::before {
              left: 100%;
          }
          
          .cta-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 10px 30px rgba(16, 185, 129, 0.6);
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }
          
          .urgency-message {
              background: #fee2e2;
              border: 1px solid #fecaca;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
          }
          
          .urgency-title {
              color: #dc2626;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
          }
          
          .urgency-text {
              color: #7f1d1d;
              font-size: 14px;
              font-weight: 500;
          }
          
          .job-highlights {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin: 25px 0;
          }
          
          .highlight-item {
              background: white;
              padding: 15px;
              border-radius: 10px;
              text-align: center;
              border: 1px solid #e2e8f0;
              transition: all 0.3s ease;
          }
          
          .highlight-item:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .highlight-icon {
              font-size: 24px;
              margin-bottom: 8px;
          }
          
          .highlight-text {
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
          }
          
          .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
          }
          
          .footer-message {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 15px;
          }
          
          .company-signature {
              color: #1e40af;
              font-weight: 600;
              margin: 15px 0;
          }
          
          .company-info {
              color: #94a3b8;
              font-size: 12px;
              margin-top: 20px;
          }
          
          .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
          }
          
          @media (max-width: 600px) {
              .email-container {
                  margin: 10px;
                  border-radius: 12px;
              }
              
              .header {
                  padding: 30px 20px;
              }
              
              .content {
                  padding: 30px 20px;
              }
              
              .job-card {
                  padding: 20px;
              }
              
              .job-title {
                  font-size: 20px;
                  flex-direction: column;
                  text-align: center;
              }
              
              .cta-button {
                  padding: 16px 32px;
                  font-size: 16px;
              }
              
              .job-highlights {
                  grid-template-columns: 1fr 1fr;
              }
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              <div class="logo">JobQuest</div>
              <div class="tagline">Your Gateway to Career Success</div>
          </div>
          
          <div class="content">
              <div class="alert-icon">🚨</div>
              <div class="new-job-badge">🔥 Hot Opportunity Alert</div>
              
              <h1 class="greeting">Hi ${userName}! 👋</h1>
              
              <div class="intro-message">
                  <p><strong>Exciting news!</strong> A perfect job opportunity just landed that matches your profile. Don't let this one slip away!</p>
              </div>
              
              <div class="job-card">
                  <div class="job-title">
                      <div class="job-title-icon">💼</div>
                      ${jobTitle}
                  </div>
                  <div class="company-name">
                      🏢 ${companyName}
                  </div>
                  
                  <div class="job-highlights">
                      <div class="highlight-item">
                          <div class="highlight-icon">💰</div>
                          <div class="highlight-text">Competitive Salary</div>
                      </div>
                      <div class="highlight-item">
                          <div class="highlight-icon">🏠</div>
                          <div class="highlight-text">Remote Friendly</div>
                      </div>
                      <div class="highlight-item">
                          <div class="highlight-icon">⚡</div>
                          <div class="highlight-text">Fast Growing</div>
                      </div>
                      <div class="highlight-item">
                          <div class="highlight-icon">🎯</div>
                          <div class="highlight-text">Career Growth</div>
                      </div>
                  </div>
                  
                  <div class="job-description">
                      <strong>What You'll Do:</strong><br>
                      ${jobDescription}
                  </div>
              </div>
              
              <div class="deadline-section">
                  <div class="deadline-icon">⏰</div>
                  <div class="deadline-title">Application Deadline</div>
                  <div class="deadline-date">${lastDateToApply}</div>
              </div>
              
              <div class="urgency-message">
                  <div class="urgency-title">
                      ⚡ Act Fast!
                  </div>
                  <div class="urgency-text">
                      Great opportunities like this don't wait. Apply now to secure your spot before the deadline!
                  </div>
              </div>
              
              <div class="cta-container">
                  <a href="${applyLink}" class="cta-button">
                      🚀 Apply Now - Don't Miss Out!
                  </a>
              </div>
              
              <div class="divider"></div>
              
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; text-align: center;">
                  <div style="color: #0369a1; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                      💡 Pro Tip
                  </div>
                  <div style="color: #0c4a6e; font-size: 14px;">
                      Companies receive hundreds of applications. Apply early to stand out and increase your chances of getting noticed!
                  </div>
              </div>
          </div>
          
          <div class="footer">
              <div class="footer-message">
                  Ready to take the next step in your career? We're here to support you every step of the way!
              </div>
              
              <div class="company-signature">
                  Best wishes for your application,<br>
                  <strong>JobQuest Team</strong><br>
                  <em>Connecting Talent with Opportunity</em>
              </div>
              
              <div class="company-info">
                  © 2025 JobQuest. All rights reserved.<br>
                  You're receiving this because you're subscribed to job alerts.
              </div>
          </div>
      </div>
  </body>
  </html>
  `;

  try {
    const mailOptions = {
      from: `"JobQuest Opportunities" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔥 Hot Job Alert: ${jobTitle} at ${companyName} - Apply Before ${lastDateToApply}!`,
      html: jobNotificationTemplate,
    };

    console.log('Mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Job notification email sent to ${to}:`, info.messageId);
    console.log('Email info:', info);
  } catch (error) {
    console.error(`❌ Failed to send job notification to ${to}:`, error);
    if (typeof error === 'object' && error !== null) {
      const err = error as { [key: string]: any };
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
      });
    }
    throw error;
  }
};

