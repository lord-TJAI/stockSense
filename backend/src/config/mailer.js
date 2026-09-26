'use strict';

const env = require('./env');

/**
 * MockMailer: logs all "emails" to the console — used in dev when no real
 * email provider credentials are configured. Never blocks signup/invite/reset flows.
 */
const MockMailer = {
  async sendMail({ to, subject, html }) {
    console.log('\n========== [MockMailer] EMAIL ==========');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body (HTML stripped):');
    console.log(html.replace(/<[^>]+>/g, ''));
    console.log('=========================================\n');
  },
};

/**
 * RealMailer: thin wrapper around nodemailer for SMTP/Gmail.
 * Only instantiated when EMAIL_PROVIDER !== 'mock'.
 */
function buildRealMailer() {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
  });
  return {
    async sendMail({ to, subject, html }) {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
    },
  };
}

let mailer;
if (env.EMAIL_PROVIDER === 'mock' || (!env.EMAIL_HOST && !env.EMAIL_USER)) {
  console.log('[Mailer] Using MockMailer — emails logged to console');
  mailer = MockMailer;
} else {
  console.log(`[Mailer] Using real mailer via ${env.EMAIL_PROVIDER}`);
  mailer = buildRealMailer();
}

module.exports = mailer;
