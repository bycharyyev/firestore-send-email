const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');

admin.initializeApp();

const db = admin.firestore();

// Создаем транспорт для отправки email
const createTransporter = () => {
  const smtpUri = process.env.SMTP_CONNECTION_URI;
  const smtpPassword = process.env.SMTP_PASSWORD;

  return nodemailer.createTransport({
    uri: smtpUri,
    auth: {
      user: smtpUri.split('://')[1].split('@')[0],
      pass: smtpPassword
    }
  });
};

// Получаем email пользователя по UID
const getUserEmail = async (uid) => {
  const usersCollection = process.env.USERS_COLLECTION;
  if (!usersCollection) return null;

  const userDoc = await db.collection(usersCollection).doc(uid).get();
  return userDoc.exists ? userDoc.data().email : null;
};

// Получаем шаблон email
const getTemplate = async (templateName) => {
  const templatesCollection = process.env.TEMPLATES_COLLECTION;
  if (!templatesCollection) return null;

  const templateDoc = await db.collection(templatesCollection).doc(templateName).get();
  return templateDoc.exists ? templateDoc.data() : null;
};

// Обработка очереди писем
exports.processQueue = functions.firestore
  .document('{collection}/{docId}')
  .onCreate(async (snap, context) => {
    const mailData = snap.data();
    const docRef = snap.ref;

    try {
      // Проверяем обязательные поля
      if (!mailData.to) {
        throw new Error('Recipient email address is required');
      }

      // Получаем email адреса для UID получателей
      const toEmails = await Promise.all(
        (Array.isArray(mailData.to) ? mailData.to : [mailData.to]).map(async (recipient) => {
          if (recipient.includes('@')) return recipient;
          return await getUserEmail(recipient) || recipient;
        })
      );

      // Получаем шаблон если указан
      let emailContent = mailData.message;
      if (mailData.template) {
        const template = await getTemplate(mailData.template);
        if (template) {
          const compiledTemplate = Handlebars.compile(template.html);
          emailContent = {
            subject: template.subject,
            html: compiledTemplate(mailData.data || {})
          };
        }
      }

      // Настраиваем параметры письма
      const mailOptions = {
        from: mailData.from || process.env.DEFAULT_FROM,
        to: toEmails.join(', '),
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        replyTo: mailData.replyTo || process.env.DEFAULT_REPLY_TO
      };

      if (mailData.cc) {
        mailOptions.cc = mailData.cc.join(', ');
      }
      if (mailData.bcc) {
        mailOptions.bcc = mailData.bcc.join(', ');
      }

      // Отправляем письмо
      const transporter = createTransporter();
      await transporter.sendMail(mailOptions);

      // Обновляем статус документа
      await docRef.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Устанавливаем TTL если настроено
      if (process.env.TTL_EXPIRE_TYPE !== 'never') {
        const expireValue = parseInt(process.env.TTL_EXPIRE_VALUE) || 1;
        const expireType = process.env.TTL_EXPIRE_TYPE;
        const expireAt = new Date();
        
        switch (expireType) {
          case 'hours':
            expireAt.setHours(expireAt.getHours() + expireValue);
            break;
          case 'days':
            expireAt.setDate(expireAt.getDate() + expireValue);
            break;
          case 'weeks':
            expireAt.setDate(expireAt.getDate() + (expireValue * 7));
            break;
        }

        await docRef.update({
          expireAt: expireAt
        });
      }

    } catch (error) {
      console.error('Error sending email:', error);
      await docRef.update({
        status: 'error',
        error: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw error;
    }
  }); 