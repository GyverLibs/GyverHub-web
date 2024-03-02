# GyverHub-web
Клиент платформы GyverHub

### Приложение
- Android: [Google Play](https://play.google.com/store/apps/details?id=ru.alexgyver.GyverHub), [скачать APK](https://github.com/GyverLibs/GyverHub-app/releases/latest), [исходник](https://github.com/GyverLibs/GyverHub-app)
- iOS: [App Store](https://apps.apple.com/kz/app/gyverhub/id6474273925), [исходник](https://github.com/GyverLibs/GyverHub-app)
- Desktop (Windows/Linux/Mac): [скачать](https://github.com/neko-neko-nyan/gyverhub-desktop/releases/latest), [исходник](https://github.com/neko-neko-nyan/gyverhub-desktop)

### Папки
- **app** - версия для приложения или запуска в браузере
- **esp** - версия для esp (файлы разместить в FS по пути `/hub/`)
- **lib** - JavaScript библиотека
- **src** - исходник

### Сборка
- `build.py` компилит исходник и раскидывает по папкам (дополнительно появояются папки `esp_h` с бинарным .gz сайтом и `host` с версией для хостинга). `clean.py` удаляет лишние папки
- Для запуска нужно установить модули `rcssmin` и `rjsmin`