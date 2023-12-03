# GyverHub-web
Клиент платформы GyverHub

### Приложение
- В релизах [вот тут](https://github.com/GyverLibs/GyverHub-app/releases). [Скачать](https://github.com/GyverLibs/GyverHub-app/releases/download/0.1/app-release.apk) актуальную версию

### Папки
- **app** - версия для приложения
- **esp** - версия для esp (файлы разместить в FS по пути `/hub/`)
- **lib** - JavaScript библиотека
- **local** - версия для для локальной работы
- **src** - исходник

### Сборка
- `build.py` компилит исходник и раскидывает по папкам (дополнительно появояются папки `esp_h` с бинарным .gz сайтом и `host` с версией для хостинга). `clean.py` удаляет лишние папки
- Для запуска нужно установить модули `rcssmin` и `rjsmin`