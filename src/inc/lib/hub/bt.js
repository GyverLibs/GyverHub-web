// based on https://github.com/loginov-rocks/Web-Bluetooth-Terminal
/*NON-ESP*/
class BluetoothJS {
  async onopen() { }
  async onmessage(data) { }
  async onclose() { }
  async onerror(e) { }
  getName() {
    return this.state() ? this._device.name : null;
  }

  state() {
    return (this._device != null);
  }
  async open() {
    try {
      if (this._device) throw "Already open";
      await this._connectToDevice(this._device);
      this.onopen();
    } catch (e) {
      this.onerror(e)
    }
  }
  async close() {
    await this._disconnectFromDevice(this._device);
    if (this._characteristic) {
      this._characteristic.removeEventListener('characteristicvaluechanged', this._change_h);
      this._characteristic = null;
    }
    if (this._device) this.onclose();
    this._device = null;
  }
  async send(data) {
    if (!this._characteristic) return this.onerror('No device');
    this._txbuf.push(data);
    if (!this._txflag) this._send();
  }

  // private
  _maxlen = 20;
  _device = null;
  _characteristic = null;
  _serviceUuid = 0xFFE0;
  _characteristicUuid = 0xFFE1;
  _disconnect_h = this._handleDisconnection.bind(this);
  _change_h = this._btchanged.bind(this);
  _txbuf = [];
  _txflag = false;

  async _send() {
    this._txflag = true;
    while (this._txbuf.length) {
      let data = this._txbuf[0];
      let size = Math.ceil(data.length / this._maxlen);
      let offset = 0;
      for (let i = 0; i < size; i++) {
        if (!this._characteristic) {
          this.onerror('Device has been disconnected');
          this._txbuf = [];
          break;
        }
        try {
          await this._characteristic.writeValue(new TextEncoder().encode(data.substr(offset, this._maxlen)));
        } catch (e) {
          this.onerror(e);
        }
        offset += this._maxlen;
      }
      this._txbuf.shift();
    }
    this._txflag = false;
  }
  async _connectToDevice(device) {
    if (!device) device = await this._requestBluetoothDevice();
    let characteristic = await this._connect(device);
    await this._startNotifications(characteristic);
  }
  async _disconnectFromDevice(device) {
    if (!device) return;
    device.removeEventListener('gattserverdisconnected', this._disconnect_h);
    if (device.gatt.connected) await device.gatt.disconnect();
  }
  async _requestBluetoothDevice() {
    this._device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [this._serviceUuid] }],
    });
    this._device.addEventListener('gattserverdisconnected', this._disconnect_h);
    return this._device;
  }
  async _connect(device) {
    if (device.gatt.connected && this._characteristic) {
      return this._characteristic;
    }
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(this._serviceUuid);
    this._characteristic = await service.getCharacteristic(this._characteristicUuid);
    return this._characteristic;
  }
  async _startNotifications(characteristic) {
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', this._change_h);
  }
  async _stopNotifications(characteristic) {
    await characteristic.stopNotifications();
    characteristic.removeEventListener('characteristicvaluechanged', this._change_h);
  }
  async _handleDisconnection(event) {
    const device = event.target;
    this.onclose();
    try {
      const characteristic = await this._connect(device);
      await this._startNotifications(characteristic);
    } catch (e) {
      this.onerror(e);
    }
  }
  async _btchanged(event) {
    const value = new TextDecoder().decode(event.target.value);
    if (value) this.onmessage(value);
  }
}
/*/NON-ESP*/