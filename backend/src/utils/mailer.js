const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

exports.sendOtpEmail = async (email, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP credentials not configured. Cannot send OTP in production.')
    }
    console.log(`[MAILER MOCK] OTP would be sent to: ${email}`)
    return true
  }

  const mailOptions = {
    from: `"Zyra Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Zyra Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #032416;">
        <h2 style="color: #032416;">Welcome to Zyra!</h2>
        <p>Your one-time verification code is:</p>
        <div style="background-color: #fdfaea; padding: 20px; border-radius: 12px; border: 1px solid #f1eedf; text-align: center; margin: 20px 0;">
          <h1 style="color: #5e51ad; font-size: 42px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #424843;">This code will expire in 10 minutes.</p>
        <p style="color: #8b918d; font-size: 12px; margin-top: 40px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  }

  return await transporter.sendMail(mailOptions)
}
