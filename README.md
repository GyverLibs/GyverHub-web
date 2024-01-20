# GyverHub-web
Клиент платформы GyverHub

### Приложение
- [Android](https://github.com/GyverLibs/GyverHub-app/releases/latest)
- [Desktop](https://github.com/neko-neko-nyan/gyverhub-desktop/releases/latest)

### Папки
- **app** - версия для приложения или запуска в браузере
- **esp** - версия для esp (файлы разместить в FS по пути `/hub/`)
- **lib** - JavaScript библиотека
- **src** - исходник

### Сборка
- `build.py` компилит исходник и раскидывает по папкам (дополнительно появояются папки `esp_h` с бинарным .gz сайтом и `host` с версией для хостинга). `clean.py` удаляет лишние папки
- Для запуска нужно установить модули `rcssmin` и `rjsmin`