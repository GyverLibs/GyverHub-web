class EventEmitter {
  constructor() {
    var delegate = document.createDocumentFragment();
    ['addEventListener','dispatchEvent','removeEventListener'].forEach(f => this[f] = (...xs) => delegate[f](...xs));
  }
}

class MessageEvent extends Event {
  constructor(message) {
    super('message');
    this.message = message
  }
}

const ConnectionState = new Enum(
  'ConnectionState',
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
);

class Transport extends EventEmitter {
  #state;

  constructor() {
    super();
    this.#state = ConnectionState.DISCONNECTED;
  }

  getState() {
    return this.#state;
  }

  isConnected() {
    return this.#state === ConnectionState.CONNECTED;
  }

  _setState(state) {
    if (this.#state === state)
      return;
    this.#state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}