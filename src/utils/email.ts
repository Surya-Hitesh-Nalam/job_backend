import nodemailer from 'nodemailer';

console.log("=== EMAIL CONFIG DEBUG ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "***SET***" : "NOT SET");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
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
  console.log("=== SEND OTP EMAIL DEBUG ===");
  console.log("Sending to:", to);
  console.log("OTP:", otp);
  console.log("From:", process.env.EMAIL_USER);
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'OTP Verification',
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    };
    
    console.log("Mail options:", mailOptions);
    
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
        responseCode: err.responseCode
      });
    }
    throw error;
  }
};

export const sendRoundResultEmail = async (to: string, roundName: string, status: string): Promise<void> => {
  const message =
    status === 'Qualified'
      ? `<p>🎉 Congratulations! You have <b>qualified</b> the <b>${roundName}</b> round.</p><p>Stay tuned for the next round instructions.</p>`
      : `<p>We appreciate your effort in the <b>${roundName}</b> round.</p><p>Unfortunately, you have not qualified this time. Best of luck for your future!</p>`;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `Round Result: ${roundName}`,
      html: message
    });
    console.log('Round result email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send round result email:', error);
    throw new Error('Email sending failed');
  }
};

export const sendJobApplicationEmail = async (
  to: string,
  userName: string,
  jobTitle: string,
  companyName: string
): Promise<void> => {
  const message = `
    <p>Hi <b>${userName}</b>,</p>
    <p>🎉 Thank you for applying for the position of <b>${jobTitle}</b> at <b>${companyName}</b>.</p>
    <p>We have received your application and our team will be reviewing it soon.</p>
    <p>Please ensure your profile is updated and keep an eye on your inbox for further updates regarding the interview rounds.</p>
    <p>Good luck!</p>
    <br/>
    <p>Best regards,<br/>${companyName} Recruitment Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `Application Confirmation: ${jobTitle} at ${companyName}`,
      html: message
    });
    console.log('Job application email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send job application email:', error);
    throw new Error('Email sending failed');
  }
};