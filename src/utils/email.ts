import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'OTP Verification',
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`
  });
};

export const sendRoundResultEmail = async (to: string, roundName: string, status: string): Promise<void> => {
  const message =
    status === 'Qualified'
      ? `<p>🎉 Congratulations! You have <b>qualified</b> the <b>${roundName}</b> round.</p><p>Stay tuned for the next round instructions.</p>`
      : `<p>We appreciate your effort in the <b>${roundName}</b> round.</p><p>Unfortunately, you have not qualified this time. Best of luck for your future!</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Round Result: ${roundName}`,
    html: message
  });
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

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Application Confirmation: ${jobTitle} at ${companyName}`,
    html: message
  });
};
