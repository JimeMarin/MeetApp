// import emailjs from 'emailjs-com';

// // Servicio para enviar email usando EmailJS
// export const sendEmail = (toEmail, subject, message) => {
//   const serviceID = 'service_ufvxwq5';  // Reemplaza con tu Service ID
//   const templateID = 'service_ufvxwq5';  // Reemplaza con tu Template ID
//   const publicKey = 'p1yL7ZtB9h0RV17-X';  // Reemplaza con tu Public Key
//   // const privateKey = 'YOUR_PRIVATE_KEY'; // Si prefieres usar la Private Key, puedes usar esta línea en backend

//   const templateParams = {
//     to_email: toEmail,
//     subject: subject,
//     message: message,
//   };

//   return emailjs.send(serviceID, templateID, templateParams, publicKey)
//     .then(response => {
//       console.log('Email enviado con éxito!', response.status, response.text);
//     })
//     .catch(error => {
//       console.error('Error al enviar el email:', error);
//     });
// };

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // O el servicio que prefieras
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