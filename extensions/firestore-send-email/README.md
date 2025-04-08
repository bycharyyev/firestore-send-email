# Firestore Send Email Extension

This Firebase Extension allows you to send emails based on Firestore document changes. It's perfect for sending transactional emails, notifications, or any other email communications triggered by your application's events.

## Features

- Send emails when documents are created in a specified Firestore collection
- Support for HTML and plain text email content
- Template support using Handlebars
- User data integration
- Configurable SMTP server
- TTL (Time To Live) configuration for documents
- Error handling and status updates
- Support for CC and BCC recipients
- Configurable FROM and REPLY-TO addresses

## Installation

1. Install the extension using the Firebase Console or CLI:
   ```bash
   firebase ext:install gulyaly/firestore-send-email
   ```

2. Configure the extension with your SMTP server details and other settings.

## Usage

1. Create a document in your configured Firestore collection with the following structure:
   ```json
   {
     "to": "recipient@example.com",
     "subject": "Email Subject",
     "text": "Plain text content",
     "html": "<p>HTML content</p>",
     "template": "template-name", // Optional
     "templateData": { // Optional
       "variable": "value"
     },
     "from": "sender@example.com", // Optional
     "replyTo": "reply@example.com", // Optional
     "cc": ["cc@example.com"], // Optional
     "bcc": ["bcc@example.com"], // Optional
     "uid": "user123" // Optional
   }
   ```

2. The extension will automatically:
   - Process the document
   - Send the email
   - Update the document with the sending status
   - Set TTL if configured

## Configuration

- `SMTP_CONNECTION_URI`: SMTP server connection URI
- `SMTP_PASSWORD`: SMTP server password
- `COLLECTION_PATH`: Firestore collection path for email documents
- `DEFAULT_FROM`: Default sender email address
- `DEFAULT_REPLY_TO`: Default reply-to email address
- `USERS_COLLECTION`: Collection for user data
- `TEMPLATES_COLLECTION`: Collection for email templates
- `TTL_EXPIRE_TYPE`: TTL expiration type (never, hours, days, weeks)
- `TTL_EXPIRE_VALUE`: TTL expiration value

## Support

For support, please open an issue in the [GitHub repository](https://github.com/bycharyyev/firestore-send-email). 