const nodemailer = require('nodemailer');

// Configurez votre transporteur (exemple avec Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendConfirmation(toEmail, fullname, date, time, specialty, teleconsultationLink) {
    const subject = 'Confirmation de rendez-vous - Medical Center Elizabeth';
    const html = `<p>Bonjour ${fullname},</p>
    <p>Votre rendez-vous est confirmé pour le ${date} à ${time} (${specialty}).</p>
    <p>Lien de téléconsultation : <a href="${teleconsultationLink}">${teleconsultationLink}</a></p>
    <p>Merci.</p>`;
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: toEmail, subject, html });
}

async function sendNewsletterEmail(toEmail, subject, content) {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: toEmail, subject, html: content });
}

module.exports = { sendConfirmation, sendNewsletterEmail };