class Discover {
  discovering = false;
  
  constructor(hub) {
    this._hub = hub;
  }

  _discoverTimer(tout) {
    this.discovering = true;
    setTimeout(() => {
      this.discovering = false;
      this._hub._checkDiscoverEnd();
    }, tout);
  }
}