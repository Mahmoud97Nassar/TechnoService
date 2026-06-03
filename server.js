require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname)));

function isSmtpConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            process.env.SUPPORT_TO
    );
}

function createTransporter() {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/support', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim().slice(0, 100);
        const email = String(req.body.email || '').trim().slice(0, 254);
        const message = String(req.body.message || '').trim().slice(0, 5000);

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'Adresse e-mail invalide.',
            });
        }

        if (message.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Veuillez décrire votre problème (10 caractères minimum).',
            });
        }

        const displayName = name || 'Visiteur';
        const subject = `[Support] ${displayName} — ${new Date().toLocaleString('fr-BE')}`;
        const textBody = [
            'Nouvelle demande — الدعم الفني الفوري',
            '',
            `Nom: ${displayName}`,
            `E-mail: ${email}`,
            '',
            'Problème / Message:',
            message,
            '',
            `Envoyé depuis: ${req.get('origin') || req.get('referer') || 'site web'}`,
        ].join('\n');

        const htmlBody = `
            <h2>Nouvelle demande — الدعم الفني الفوري</h2>
            <p><strong>Nom:</strong> ${escapeHtml(displayName)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            <p><strong>Problème:</strong></p>
            <pre style="white-space:pre-wrap;font-family:inherit;background:#f1f5f9;padding:12px;border-radius:8px;">${escapeHtml(message)}</pre>
        `;

        if (!isSmtpConfigured()) {
            console.log('\n--- Support (mode développement, SMTP non configuré) ---');
            console.log(textBody);
            console.log('---\n');
            return res.json({
                success: true,
                message:
                    'Message reçu (mode développement). Configurez SMTP dans .env pour envoyer les e-mails.',
                mode: 'development',
            });
        }

        const transporter = createTransporter();
        const from =
            process.env.SUPPORT_FROM ||
            `"TechnoService Support" <${process.env.SMTP_USER}>`;

        await transporter.sendMail({
            from,
            to: process.env.SUPPORT_TO,
            replyTo: `"${displayName}" <${email}>`,
            subject,
            text: textBody,
            html: htmlBody,
        });

        return res.json({
            success: true,
            message: 'Votre message a été envoyé. Notre équipe vous répondra rapidement.',
        });
    } catch (err) {
        console.error('Erreur API support:', err);
        return res.status(500).json({
            success: false,
            error: "Impossible d'envoyer le message pour le moment. Réessayez plus tard.",
        });
    }
});

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

app.listen(PORT, () => {
    console.log(`Serveur: http://localhost:${PORT}`);
    console.log(`Page:    http://localhost:${PORT}/index.HTML`);
    console.log(
        isSmtpConfigured()
            ? 'SMTP: configuré — les e-mails seront envoyés.'
            : 'SMTP: non configuré — les messages s\'affichent dans la console.'
    );
});
