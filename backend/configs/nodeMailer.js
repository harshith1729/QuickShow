import nodemailer from 'nodemailer'

// Create a transporter for SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER, // Make sure this is set in Vercel
    pass: process.env.SMTP_PASS, // Make sure this is set in Vercel
  },
});

const sendEmail = async({to,subject,body})=>{
    const response = await transporter.sendMail({ // ⭐ FIX: Changed to sendMail
        from : process.env.SENDER_EMAIL, // Make sure this is set in Vercel
        to,
        subject,
        html : body,
    })
    return response
}

export default sendEmail