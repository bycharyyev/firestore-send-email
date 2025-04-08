const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { processQueue } = require('../index');

describe('Firestore Send Email Extension', () => {
  let db;
  let testDoc;

  beforeAll(async () => {
    // Инициализация Firebase Admin
    initializeApp();
    db = getFirestore();
  });

  beforeEach(async () => {
    // Очистка тестовых данных
    const mailCollection = db.collection(process.env.COLLECTION_PATH);
    const snapshot = await mailCollection.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  });

  afterAll(async () => {
    // Очистка после всех тестов
    await admin.app().delete();
  });

  test('should send email when document is created', async () => {
    // Создание тестового документа
    const mailData = {
      to: 'test@example.com',
      message: {
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      }
    };

    testDoc = await db.collection(process.env.COLLECTION_PATH).add(mailData);

    // Проверка статуса отправки
    const doc = await testDoc.get();
    const data = doc.data();

    expect(data.status).toBe('sent');
    expect(data.sentAt).toBeDefined();
  });

  test('should handle template emails', async () => {
    // Создание тестового шаблона
    const templateData = {
      subject: 'Welcome {{name}}',
      html: '<p>Hello {{name}}, welcome to our service!</p>'
    };

    await db.collection(process.env.TEMPLATES_COLLECTION)
      .doc('welcome')
      .set(templateData);

    // Создание документа с использованием шаблона
    const mailData = {
      to: 'test@example.com',
      template: 'welcome',
      data: {
        name: 'John'
      }
    };

    testDoc = await db.collection(process.env.COLLECTION_PATH).add(mailData);

    // Проверка статуса отправки
    const doc = await testDoc.get();
    const data = doc.data();

    expect(data.status).toBe('sent');
    expect(data.sentAt).toBeDefined();
  });

  test('should handle user UIDs', async () => {
    // Создание тестового пользователя
    const userData = {
      email: 'user@example.com'
    };

    await db.collection(process.env.USERS_COLLECTION)
      .doc('testUser')
      .set(userData);

    // Создание документа с UID пользователя
    const mailData = {
      to: ['testUser'],
      message: {
        subject: 'Test User Email',
        html: '<p>This is a test email for user</p>'
      }
    };

    testDoc = await db.collection(process.env.COLLECTION_PATH).add(mailData);

    // Проверка статуса отправки
    const doc = await testDoc.get();
    const data = doc.data();

    expect(data.status).toBe('sent');
    expect(data.sentAt).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    // Создание документа с неверными данными
    const mailData = {
      to: 'invalid-email',
      message: {
        subject: 'Test Error',
        html: '<p>This should fail</p>'
      }
    };

    testDoc = await db.collection(process.env.COLLECTION_PATH).add(mailData);

    // Проверка обработки ошибки
    const doc = await testDoc.get();
    const data = doc.data();

    expect(data.status).toBe('error');
    expect(data.error).toBeDefined();
    expect(data.errorAt).toBeDefined();
  });
}); 