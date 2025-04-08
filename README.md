# Firestore Send Email Extension

Это расширение Firebase для отправки электронных писем на основе документов в Firestore.

## Функциональность

- Отправка email при создании документа в указанной коллекции Firestore
- Поддержка шаблонов email с использованием Handlebars
- Поддержка отправки по UID пользователей
- Настраиваемое время жизни документов (TTL)
- Поддержка CC и BCC
- Настраиваемые адреса отправителя и ответа

## Установка

1. Установите расширение через Firebase Console или CLI
2. Настройте параметры SMTP сервера
3. Укажите коллекцию для документов email

## Использование

### Базовое использование

```javascript
admin.firestore().collection('mail').add({
  to: 'someone@example.com',
  message: {
    subject: 'Hello from Firebase!',
    html: 'This is an <code>HTML</code> email body.',
  },
})
```

### Использование шаблонов

1. Создайте шаблон в коллекции шаблонов:

```javascript
admin.firestore().collection('email-templates').doc('welcome').set({
  subject: 'Welcome to our service!',
  html: 'Hello {{name}}, welcome to our service!'
})
```

2. Используйте шаблон при отправке:

```javascript
admin.firestore().collection('mail').add({
  to: 'someone@example.com',
  template: 'welcome',
  data: {
    name: 'John'
  }
})
```

### Отправка по UID пользователей

```javascript
admin.firestore().collection('mail').add({
  to: ['user123', 'user456'],
  message: {
    subject: 'Hello users!',
    html: 'This is a message for our users.'
  }
})
```

## Конфигурация

### Обязательные параметры

- `SMTP_CONNECTION_URI`: URI SMTP сервера
- `SMTP_PASSWORD`: Пароль SMTP сервера
- `COLLECTION_PATH`: Путь к коллекции документов email

### Опциональные параметры

- `DEFAULT_FROM`: Адрес отправителя по умолчанию
- `DEFAULT_REPLY_TO`: Адрес для ответа по умолчанию
- `USERS_COLLECTION`: Коллекция пользователей
- `TEMPLATES_COLLECTION`: Коллекция шаблонов
- `TTL_EXPIRE_TYPE`: Тип времени жизни документов
- `TTL_EXPIRE_VALUE`: Значение времени жизни документов

## Безопасность

- Все пароли и секреты хранятся как секретные параметры
- Поддерживается OAuth2 аутентификация
- Рекомендуется использовать безопасное SMTP соединение (TLS/SSL)

## Ограничения

- Требуется план Blaze (оплата по использованию)
- Использует Cloud Functions и Firestore
- Зависит от настроек SMTP провайдера 