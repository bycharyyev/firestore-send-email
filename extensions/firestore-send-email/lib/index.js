const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');

admin.initializeApp();

/**
 * Processes document changes in the specified Cloud Firestore collection,
 * delivers emails, and updates the document with delivery status information.
 */
exports.processQueue = functions.firestore
  .document('{collection}/{docId}')
  .onCreate(async (snap, context) => {
    const config = functions.config();
    const collection = context.params.collection;
    
    if (collection !== config.collection_path) {
      return null;
    }

    const data = snap.data();
    const db = admin.firestore();

    try {
      // Get user data if uid is provided
      let userData = {};
      if (data.uid && config.users_collection) {
        const userDoc = await db.collection(config.users_collection).doc(data.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data() || {};
        }
      }

      // Get template if specified
      let html = data.html;
      if (data.template && config.templates_collection) {
        const templateDoc = await db.collection(config.templates_collection).doc(data.template).get();
        if (templateDoc.exists) {
          const template = Handlebars.compile(templateDoc.data().html || '');
          html = template({ ...data.templateData, ...userData });
        }
      }

      // Create transporter
      const transporter = nodemailer.createTransport(config.smtp_connection_uri);

      // Send email
      const mailOptions = {
        from: data.from || config.default_from,
        replyTo: data.replyTo || config.default_reply_to,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        text: data.text,
        html: html
      };

      const info = await transporter.sendMail(mailOptions);

      // Update document with success status
      await snap.ref.update({
        status: 'sent',
        messageId: info.messageId,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Set TTL if configured
      if (config.ttl_expire_type !== 'never' && config.ttl_expire_value) {
        const expireAt = new Date();
        const value = parseInt(config.ttl_expire_value);
        
        switch (config.ttl_expire_type) {
          case 'hours':
            expireAt.setHours(expireAt.getHours() + value);
            break;
          case 'days':
            expireAt.setDate(expireAt.getDate() + value);
            break;
          case 'weeks':
            expireAt.setDate(expireAt.getDate() + (value * 7));
            break;
        }

        await snap.ref.update({ expireAt });
      }

      return null;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update document with error status
      await snap.ref.update({
        status: 'error',
        error: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  }); 