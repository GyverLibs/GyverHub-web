const langBase = {
  English: {
    errors: ["not an error", "open file error", "not enough space", "checksum error", "size error", "start error", "write error", "end error", "aborted", "timeout", "busy", "memory error", "wrong client", "forbidden", "module disabled", "incorret type", "damaged packet", "FS busy", "cancelled"],
    themes: {
      auto: "System",
      dark: "Dark",
      light: "Light"
    },
    colors: {
      ORANGE: "Orange",
      YELLOW: "Yellow",
      GREEN: "Green",
      MINT: "Mint",
      AQUA: "Aqua",
      BLUE: "Blue",
      VIOLET: "Violet",
      PINK: "Pink"
    },
    api_mis: "Device and App API version mismatch. Update library and App!",

    pop_yes: "Yes",
    pop_no: "No",
    cancel: "Cancel",
    done: "Done",
    error: "Error",
    upload: "Upload",
    fetch: "Fetch",
    connecting: "Connecting",
    connected: "Connected",
    connect: "Connect",
    disconnect: "Disconnect",
    disconnected: "Disconnected",
    not_conn: "Not connected",
    select: "Select",
    clip_copy: "Copied to clipboard",
    import_ok: "Import done",
    import_err: "Wrong data",

    config: "Config",
    wifi_ip: "Local IP",
    wifi_mask: "Netmask",
    wifi_port: "HTTP port",
    wifi_add: "Add by IP",
    mq_host: "Host",
    mq_port: "Port (WSS)",
    mq_login: "Login",
    mq_pass: "Password",
    sr_baud: "Baudrate",
    sr_offset: "Start offset, ms",
    sr_port: "Port",
    tg_token: "Bot token",
    tg_chat: "Chat ID",
    cfg_search: "Search",
    cfg_prefix: "Net name",
    cfg_id: "Client ID",
    cfg_theme: "Theme",
    cfg_color: "Main Color",
    cfg_font: "Font",
    cfg_width: "App width",
    cfg_wide_mode: "Wide device UI",
    cfg_css: "Plugin CSS",
    cfg_js: "Plugin JS",
    cfg_proj: "Project links",
    cfg_plugin: "Plugin links",
    cfg_updates: "Check updates",
    cfg_sett: "Settings",
    cfg_import: "Import",
    cfg_export: "Export",
    cfg_reset: "Reset",
    cfg_reset_conf: "Reset all settings?",
    cfg_add: "Add by ID",
    cfg_find_dev: "Find devices",

    m_config: "Config",
    m_info: "Info",
    m_files: "Files",
    m_ota: "OTA",

    i_settings: "Settings",
    i_console: "Console",
    i_trust: "Trust this device",
    i_main: "UI width",
    i_css: "Plugin CSS",
    i_js: "Plugin JS",
    i_reboot: "Reboot",
    i_link: "Link",
    dev_trust_warning: "",

    i_topics: "Topics",
    i_version: "Version",
    i_net: "Network",
    i_memory: "Memory",
    i_system: "System",

    fs_fsbr: "FS browser",
    fs_used: "Used",
    fs_format: "Format",
    fs_upload_to: "Upload to",
    fs_upload: "Upload",
    fs_create_f: "Create file",
    fs_create: "Create",
    fs_name: "File name",
    fs_wrap: "Wrap text",
    fs_save: "Save & upload",
    rename: "Rename",
    delete: "Delete",
    fetch: "Fetch",
    download: "Download",
    edit: "Edit",
    wrong_ota: "Wrong file! Use",

    p_add: "Add project",
    p_proj: "Projects",
    p_not_support: "Browser in not supported",
    p_use_https: "Use https version of website",
    p_has_upd: "Update available",
    p_upd: "Update firmware",
    p_install: "Install",

    wrong_text: "Wrong text!",
    wrong_ip: "Wrong IP",
    dup_names: "Duplicated names",
    redirect: "Redirect to",
    hub_pin: "Enter PIN",
    dev_pin: "Enter PIN for device ",
  },
  
  Russian: {
    errors: ["не ошибка", "невозможно открыть файл", "недостаточно места", "ошибка контрольной суммы", "ошибка размера", "ошибка старта", "ошибка записи", "ошибка завершения", "прервано", "тайм-аут", "занят", "ошибка памяти", "не тот клиент", "запрещено", "модуль отключен", "некорректный тип", "пакет повреждён", "файловая система занята", "отменено"],
    themes: {
      auto: "Системная",
      dark: "Тёмная",
      light: "Светлая"
    },
    colors: {
      ORANGE: "Оранжевый",
      YELLOW: "Жёлтый",
      GREEN: "Зелёный",
      MINT: "Мятный",
      AQUA: "Бирюзовый",
      BLUE: "Синий",
      VIOLET: "Фиолетовый",
      PINK: "Розовый"
    },
    api_mis: "Разная версия API у устройства и приложения. Обнови приложение и библиотеку!",

    pop_yes: "Да",
    pop_no: "Нет",
    cancel: "Отмена",
    done: "Завершено",
    error: "Ошибка",
    upload: "Загрузка",
    fetch: "Скачивание",
    connecting: "Подключение",
    connected: "Подключено",
    connect: "Подключить",
    disconnect: "Отключить",
    disconnected: "Отключено",
    not_conn: "Не подключено",
    select: "Выбрать",
    clip_copy: "Скопировано в буфер обмена",
    import_ok: "Импорт завершён",
    import_err: "Некорректные данные",

    config: "Настройки",
    wifi_ip: "Мой IP",
    wifi_mask: "Маска сети",
    wifi_port: "HTTP порт",
    wifi_add: "Добавить по IP",
    mq_host: "Хост",
    mq_port: "Порт (WSS)",
    mq_login: "Логин",
    mq_pass: "Пароль",
    sr_baud: "Скорость",
    sr_offset: "Задержка запуска, мс",
    sr_port: "Порт",
    tg_token: "Токен бота",
    tg_chat: "ID чата",
    cfg_search: "Поиск",
    cfg_prefix: "Имя сети",
    cfg_id: "ID клиента",
    cfg_theme: "Тема",
    cfg_color: "Цвет",
    cfg_font: "Шрифт",
    cfg_width: "Ширина окна",
    cfg_wide_mode: "Интерфейс по ширине окна",
    cfg_css: "Плагин CSS",
    cfg_js: "Плагин JS",
    cfg_proj: "Ссылки проектов",
    cfg_plugin: "Ссылки плагинов",
    cfg_updates: "Проверять обновления",
    cfg_sett: "Настройки",
    cfg_import: "Импорт",
    cfg_export: "Экспорт",
    cfg_reset: "Сброс",
    cfg_reset_conf: "Сбросить все настройки?",
    cfg_add: "Добавить по ID",
    cfg_find_dev: "Найти устройства",

    m_config: "Настройки",
    m_info: "Инфо",
    m_files: "Файлы",
    m_ota: "OTA",

    i_settings: "Настройки",
    i_console: "Консоль",
    i_trust: "Доверять этому устройству",
    i_main: "Ширина ПУ",
    i_css: "Плагин CSS",
    i_js: "Плагин JS",
    i_reboot: "Перезагрузка",
    i_link: "Ссылка",
    dev_trust_warning: "Внимание: включение этой настройки разрешит устройству выполняить скрипты от в GyverHub. Включение этой настройки для неизвестных устройств может нарушить работу GyverHub и украсть ваши данные!\n\nВы действительно хотите доверять этому устройству?",

    i_topics: "Топики",
    i_version: "Версия",
    i_net: "Сеть",
    i_memory: "Память",
    i_system: "Система",

    fs_fsbr: "FS браузер",
    fs_used: "Занято",
    fs_format: "Форматировать",
    fs_upload_to: "Загрузить в",
    fs_upload: "Загрузить",
    fs_create_f: "Создать файл",
    fs_create: "Создать",
    fs_name: "Имя файла",
    fs_wrap: "Переносить текст",
    fs_save: "Сохранить и загрузить",
    rename: "Переименовать",
    delete: "Удалить",
    fetch: "Скачать",
    download: "Скачать",
    edit: "Редактировать",
    wrong_ota: "Некорректный файл! Используй",

    p_add: "Добавить проект",
    p_proj: "Проекты",
    p_not_support: "Браузер не поддерживается",
    p_use_https: "Используйте https версию сайта",
    p_has_upd: "Доступно обновление",
    p_upd: "Обновить прошивку",
    p_install: "Установить",

    wrong_text: "Некорректный текст!",
    wrong_ip: "Некорректный IP",
    dup_names: "Повторяющиеся имена",
    redirect: "Перейти на",
    hub_pin: "Введите ПИН",
    dev_pin: "Введите пин устройства ",
  }
};
