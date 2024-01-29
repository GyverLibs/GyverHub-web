
const ConnectionState = new Enum(
  'ConnectionState',
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
);

class Connection extends EventEmitter {
  #state;
  #discovering;
  hub;
  options;

  constructor(hub) {
    super();
    this.#state = ConnectionState.DISCONNECTED;
    this.#discovering = false;
    this.hub = hub;
    this.options = this.hub.config.getConnection(this.name);
  }

  get name() {
    return this.constructor.name;
  }

  get priority() {
    return this.constructor.priority;
  }

  _setState(state) {
    if (this.#state === state)
      return;
    this.#state = state;
    this.dispatchEvent(new Event('statechange'));
  }

  isDiscovering() {
    return this.#discovering;
  }

  _discoverTimer() {
    this.#discovering = true;
    setTimeout(() => {
      this.#discovering = false;
      this.hub._checkDiscoverEnd();
    }, this.options.discover_timeout);
  }

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
  async discover() {}

  /**
   * Send discover request to all devices.
   */
  async search() {}

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
    let uri = device.info.prefix + '/' + device.info.id + '/' + this.hub.cfg.client_id + '/' + command;
    if (name) {
      uri += '/' + name;
      if (value) {
        uri += '=' + value;
      }
    }

    await this.send(uri);
  }
}
