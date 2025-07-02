import nodemailer from 'nodemailer';

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'OTP Verification',
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};
