
class HubError extends Error {

}

const HubErrors = {
    None: 0,        // нет ошибки
    OpenFile: 1,    // ошибка открытия файла
    FreeSpace: 2,   // нет свободного места
    CrcMiss: 3,     // ошибка контрольной суммы
    SizeMiss: 4,    // не совпал размер
    Start: 5,       // ошибка старта
    Write: 6,       // ошибка записи
    End: 7,         // ошибка завершения
    Abort: 8,       // прервано
    Timeout: 9,     // таймаут соединения
    Busy: 10,       // загрузчик занят другим клиентом
    Memory: 11,     // невозможно выделить память
    WrongClient: 12,// не тот клиент
    Forbidden: 13,  // запрещено в request
    Disabled: 14,   // модуль отключен
    WrongType: 15,  // некорректный тип
    PacketDamage: 16,// пакет повреждён
    CantAlloc: 17,

    FsBusy: 18,     // fs занята
    Cancelled: 19,  // отменено пользователем
};

class DeviceError extends HubError {
    constructor(code) {
        super(`Device error: ${code}`);
        this.code = code;
    }
}

class TimeoutError extends HubError {
    constructor() {
        super("Timed out");
    }
}
