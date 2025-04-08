#!/bin/bash

# Установка зависимостей
npm install

# Сборка TypeScript
npm run build

# Создание директории lib, если она не существует
mkdir -p lib

# Копирование скомпилированных файлов
cp -r src/* lib/

echo "Build completed successfully!" 