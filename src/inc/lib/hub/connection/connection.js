
/**
 * @type {{
 *   DISCONNECTED: Symbol,
 *   CONNECTING: Symbol,
 *   CONNECTED: Symbol,
 * }}
 */
const ConnectionState = new Enum(
  'ConnectionState',
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
);

class ConnectionStateChangeEvent extends Event {
  constructor(type, connection, state) {
    super(type)
    this.connection = connection;
    this.state = state;
  }
}

class Connection extends EventEmitter {
  #state;
  #discovering;
  #discoverTimer;

  /** @type {GyverHub} */
  hub;
  /** @type {object} */
  options;

  /**
   * @param {GyverHub} hub 
   */
  constructor(hub) {
    super();
    this.#state = ConnectionState.DISCONNECTED;
  
    this.#discovering = false;
    this.#discoverTimer = new AsyncTimer(undefined, () => {
      this.#discovering = false;
      this.hub._checkDiscoverEnd();
    });
  
    this.hub = hub;
    this.options = this.hub.config.getConnection(this.name);

    this.options.discover_timeout = 3000;
  }

  /**
   * Имя соединения.
   * @type {string}
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Приоритет соединения.
   * @type {number}
   */
  get priority() {
    return this.constructor.priority;
  }

  _setState(state) {
    if (this.#state === state)
      return;
    this.#state = state;
    this.dispatchEvent(new ConnectionStateChangeEvent('statechange', this, state));
  }

  _discoverTimer() {
    this.#discovering = true;
    this.#discoverTimer.restart(this.options.discover_timeout);
  }

  /**
   * Check if connection is currently discovering for new devices
   * @returns {boolean}
   */
  isDiscovering() {
    return this.#discovering;
  }

  /**
   * Get connection state.
   * @returns {ConnectionState}
   */
  getState() {
    return this.#state;
  }

  /**
   * Check if device is connected.
   * @returns {boolean}
   */
  isConnected() {
    return this.options.enabled && this.#state === ConnectionState.CONNECTED;
  }

  /**
   * Get current device display name, if available.
   * @returns {string}
   */
  getName() {
    return null;
  }

  /**
   * Send discover request to known device(s).
   */
  async discover() {
    if (this.discovering || !this.isConnected()) return;
    this._discoverTimer();
    for (let pref of this.hub.getAllPrefixes()) await this.send(pref);
  }


  /**
   * Send discover request to all devices.
   */
  async search() {
    if (this.discovering || !this.isConnected()) return;
    this._discoverTimer();
    await this.send(this.hub.prefix);
  }

  /**
   * Initialize device connection (ex. autoconnect)
   */
  async begin() {
    if (this.options.enabled)
      await this.connect();
  }

  /**
   * Connnect to device.
   */
  async connect() {}

  /**
   * Disconnect from device.
   */
  async disconnect() {}

  /**
   * Request user to select device (if applicable).
   */
  async select() {}

  /**
   * Send raw request
   * @param {string} data 
   */
  async send(data) {}

  /**
   * Send command to device.
   * @param {Device} device
   * @param {string} command 
   * @param {string} name 
   * @param {string} value 
   */
  async post(device, command, name = '', value = '') {
    let uri = device.info.prefix + '/' + device.info.id + '/' + this.hub.clientId + '/' + command;
    if (name) {
      uri += '/' + name;
      if (value) {
        uri += '=' + value;
      }
    }

    await this.send(uri);
  }
}
