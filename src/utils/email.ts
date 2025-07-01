import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    secure: false,
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: "OTP Verification",
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`,
  });
};
