# Пост-установочные шаги

После успешной установки расширения Firestore Send Email выполните следующие шаги для настройки и проверки работоспособности:

## 1. Проверка установки

```bash
# Проверка статуса расширения
firebase ext:info

# Проверка статуса функций
firebase functions:list
```

## 2. Настройка коллекций

### Создание коллекции для email
```javascript
// Создание коллекции mail
admin.firestore().collection('mail').doc('test').set({
  to: 'test@example.com',
  message: {
    subject: 'Test Email',
    html: '<p>This is a test email</p>'
  }
});
```

### Создание коллекции шаблонов (опционально)
```javascript
// Создание шаблона welcome
admin.firestore().collection('email-templates').doc('welcome').set({
  subject: 'Welcome {{name}}',
  html: '<p>Hello {{name}}, welcome to our service!</p>'
});
```

### Создание коллекции пользователей (опционально)
```javascript
// Создание пользователя
admin.firestore().collection('users').doc('user123').set({
  email: 'user@example.com',
  name: 'John Doe'
});
```

## 3. Настройка правил безопасности

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Правила для коллекции mail
    match /mail/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Правила для шаблонов
    match /email-templates/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Правила для пользователей
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. Тестирование

### Тест простой отправки
```javascript
admin.firestore().collection('mail').add({
  to: 'test@example.com',
  message: {
    subject: 'Test Email',
    html: '<p>This is a test email</p>'
  }
});
```

### Тест с шаблоном
```javascript
admin.firestore().collection('mail').add({
  to: 'test@example.com',
  template: 'welcome',
  data: {
    name: 'John'
  }
});
```

### Тест с UID пользователя
```javascript
admin.firestore().collection('mail').add({
  to: ['user123'],
  message: {
    subject: 'Test User Email',
    html: '<p>This is a test email for user</p>'
  }
});
```

## 5. Мониторинг

1. **Проверка логов**:
   ```bash
   firebase functions:log
   ```

2. **Настройка оповещений**:
   - Настройте оповещения в Google Cloud Console
   - Отслеживайте ошибки отправки
   - Мониторьте использование квот

## 6. Оптимизация

1. **Настройка TTL**:
   - Проверьте настройки TTL в конфигурации
   - Убедитесь, что старые документы удаляются

2. **Оптимизация производительности**:
   - Настройте размер пакетов для массовой отправки
   - Оптимизируйте шаблоны
   - Настройте кэширование

## 7. Резервное копирование

1. **Экспорт шаблонов**:
   ```bash
   firebase firestore:export templates
   ```

2. **Резервное копирование конфигурации**:
   - Сохраните настройки SMTP
   - Сохраните OAuth2 токены
   - Документируйте все изменения 