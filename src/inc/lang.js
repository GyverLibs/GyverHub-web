const langBase = {
    English: {
        errors: ["not an error", "open file error", "not enough space", "checksum error", "size error", "start error", "write error", "end error", "aborted", "timeout", "busy", "memory error", "wrong client", "forbidden", "module disabled", "FS busy", "cancelled"],
        api_mis: "Device and App API version mismatch. Update library and App!",

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
        cfg_prefix: "Prefix",
        cfg_id: "Client ID",
        cfg_theme: "Theme",
        cfg_color: "Main Color",
        cfg_font: "Font",
        cfg_width: "UI width",
        cfg_css: "Plugin CSS",
        cfg_js: "Plugin JS",
        cfg_updates: "Check updates",
        cfg_sett: "Settings",
        cfg_import: "Import",
        cfg_export: "Export",

        i_settings: "Settings",
        i_console: "Console",
        i_mode: "UI mode",
        i_default: "Default",
        i_single: "Single row",
        i_resp: "Responsive",
        i_grid: "Grid",
        i_main: "Main width",
        i_block: "Block width",
        i_css: "Plugin CSS",
        i_js: "Plugin JS",
        i_reboot: "Reboot",
        i_link: "Link",
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
        rename: "Rename",
        delete: "Delete",
        fetch: "Fetch",
        download: "Download",
        open: "Open",
        edit: "Edit",

        p_not_support: "Browser in not supported",
        p_use_https: "Use https version of website",
        p_has_upd: "Update available",
        p_upd: "Update firmware",
    },
    Russian: {
        errors: ["не ошибка", "невозможно открыть файл", "недостаточно места", "ошибка контрольной суммы", "ошибка размера", "ошибка старта", "ошибка записи", "ошибка завершения", "прервано", "тайм-аут", "занят", "ошибка памяти", "не тот клиент", "запрещено", "модуль отключен", "система занята", "отменено"],
        api_mis: "Разная версия API у устройства и приложения. Обнови приложение и библиотеку!",
        
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
        cfg_prefix: "Префикс",
        cfg_id: "ID клиента",
        cfg_theme: "Тема",
        cfg_color: "Цвет",
        cfg_font: "Шрифт",
        cfg_width: "Ширина ПУ",
        cfg_css: "Плагин CSS",
        cfg_js: "Плагин JS",
        cfg_updates: "Проверять обновления",
        cfg_sett: "Настройки",
        cfg_import: "Импорт",
        cfg_export: "Экспорт",

        i_settings: "Настройки",
        i_console: "Консоль",
        i_mode: "Режим ПУ",
        i_default: "По умолчанию",
        i_single: "Один столбец",
        i_resp: "Адаптивный",
        i_grid: "Сетка",
        i_main: "Ширина ПУ",
        i_block: "Ширина блока",
        i_css: "Плагин CSS",
        i_js: "Плагин JS",
        i_reboot: "Перезагрузка",
        i_link: "Ссылка",
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
        rename: "Переименовать",
        delete: "Удалить",
        fetch: "Скачать",
        download: "Скачать",
        open: "Открыть",
        edit: "Редактировать",

        p_not_support: "Браузер не поддерживается",
        p_use_https: "Используйте https версию сайта",
        p_has_upd: "Доступно обновление",
        p_upd: "Обновить прошивку",
    }
};

let lang = langBase.English;

function updateLang() {
    lang = langBase[cfg.lang];
}