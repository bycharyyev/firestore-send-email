@echo off

REM Установка зависимостей
call npm install

REM Сборка TypeScript
call npm run build

REM Создание директории lib, если она не существует
if not exist lib mkdir lib

REM Копирование скомпилированных файлов
xcopy /E /I /Y src\* lib\

echo Build completed successfully! 