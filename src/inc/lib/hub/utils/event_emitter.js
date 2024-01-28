class EventEmitter {
  #delegate;

  constructor() {
    this.#delegate = document.createDocumentFragment();
    ['addEventListener','dispatchEvent','removeEventListener'].forEach(f => this[f] = (...xs) => delegate[f](...xs));
  }

  /**
   * Appends an event listener for events whose type attribute value is type. The callback
   * argument sets the callback that will be invoked when the event is dispatched.
   *
   * The options argument sets listener-specific options.
   *
   * When set to true, options's passive indicates that the callback will not cancel
   * the event by invoking preventDefault().
   *
   * When set to true, options's once indicates that the callback will only be invoked
   * once after which the event listener will be removed.
   *
   * @param {string} type 
   * @param {EventListener} callback 
   * @param {{once?: boolean, passive?: boolean} | undefined} options 
   */
  addEventListener(type, callback, options = undefined) {
    this.#delegate.addEventListener(type, callback, options);
  }

  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   * @param {string} type 
   * @param {EventListener} callback 
   * @param {{once?: boolean, passive?: boolean} | undefined} options 
   */
  removeEventListener(type, callback, options = undefined) {
    this.#delegate.removeEventListener(type, callback, options);
  }

  /**
   * Dispatches a synthetic event event to target and returns true if either event's cancelable
   * attribute value is false or its preventDefault() method was not invoked, and false otherwise.
   * @param {Event} event 
   * @returns {boolean}
   */
  dispatchEvent(event) {
    return this.#delegate.dispatchEvent(event);
  }
}

class DeviceEvent extends Event {
  device;

  constructor(type, device, eventInitDict = undefined) {
    super(type, eventInitDict);
    this.device = device;
  }
}

class MessageEvent extends Event {
  constructor(message) {
    super('message');
    this.message = message
  }
}
