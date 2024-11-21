const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail, outlook', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(emailData) {
  try {
    let info = await transporter.sendMail(emailData);
    console.log('Correo enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
}

module.exports = { sendEmail };