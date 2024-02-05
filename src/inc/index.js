window.onload = () => {
  load_cfg();
  updateLang();
  render_main();
  EL('hub_stat').innerHTML = 'GyverHub v' + app_version + ' ' + platform();

  /*@[if_target:esp]*/
    hub.config.set('connections', 'HTTP', 'enabled', true);  // force local on esp
  /*@/[if_target:esp]*/

  update_ip();
  update_theme();
  set_drop();
  key_change();
  handle_back();
  register_SW();
  if (cfg.use_pin && cfg.pin.length) show_keypad(true);
  else startup();

  function register_SW() {
    /*@[if_target:host]*/
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
      window.addEventListener('beforeinstallprompt', (e) => deferredPrompt = e);
    }
    /*@/[if_target:host]*/
  }
  function set_drop() {
    function preventDrop(e) {
      e.preventDefault()
      e.stopPropagation()
    }
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
      document.body.addEventListener(e, preventDrop, false);
    });

    ['dragenter', 'dragover'].forEach(e => {
      document.body.addEventListener(e, function () {
        document.querySelectorAll('.drop_area').forEach((el) => {
          el.classList.add('active');
        });
      }, false);
    });

    ['dragleave', 'drop'].forEach(e => {
      document.body.addEventListener(e, function () {
        document.querySelectorAll('.drop_area').forEach((el) => {
          el.classList.remove('active');
        });
      }, false);
    });
  }
  function key_change() {
    document.addEventListener('keydown', function (e) {
      switch (e.keyCode) {
        case 116: // refresh on F5
          if (!e.ctrlKey) {
            e.preventDefault();
            refresh_h();
          }
          break;

        case 192: // open cli on `
          break;  // TODO console
          if (focused) {
            e.preventDefault();
            toggleCLI();
          }
          break;

        default:
          break;
      }
      //log(e.keyCode);
    });
  }
  function handle_back() {
    window.history.pushState({ page: 1 }, "", "");
    window.onpopstate = function (e) {
      window.history.pushState({ page: 1 }, "", "");
      back_h();
    }
  }
  function update_ip() {//TODO
    /*@[if_target:esp]*/
    if (window_ip()) {
      EL('local_ip').value = window_ip();
      hub.config.set('connections', 'HTTP', 'local_ip', window_ip());
    }
    /*@/[if_target:esp]*/
    /*@[if_not_target:esp]*/
    if (!Boolean(window.webkitRTCPeerConnection || window.mozRTCPeerConnection)) return;
    getLocalIP()
      .then((ip) => {
        if (ip.indexOf("local") < 0) {
          EL('local_ip').value = ip;
          hub.config.set('connections', 'HTTP', 'local_ip', ip);
        }
        return;
      })
      .catch(e => console.log(e));
    /*@/[if_not_target:esp]*/
  }
}
function startup() {
  render_selects();
  render_info();
  apply_cfg();
  update_theme();
  show_screen('main');
  if ('Notification' in window && Notification.permission == 'default') Notification.requestPermission();

  // device hook
  let qs = window.location.search;
  if (qs) {
    let params = new URLSearchParams(qs).entries();
    let data = {};
    for (let param of params) data[param[0]] = param[1];
    if (!hub.dev(data.id)) hub.addDevice(data);
  }

  // show version
  setTimeout(() => {
    let ver = localStorage.getItem('version');
    if (!ver || ver != app_version) {
      asyncAlert(lang.i_version + ' ' + app_version + '!\n' + '/*@![:release_notes]*/');
      localStorage.setItem('version', app_version);
    }
  }, 1000);

  render_devices();
  hub.begin();
  discover();

  /*@[if_target:esp]*/
    for (const id of hub.getDeviceIds()) {
      const dev = hub.dev(id);
      if (window.location.href.includes(dev.info.ip)) {
        // dev.conn = Conn.HTTP;
        // dev.conn_arr[Conn.HTTP] = 1;  // TODO
        device_h(dev.info.id);
        return;
      }
    }
  /*@/[if_target:esp]*/
  /*@[if_target:host]*/
    display('app_block', 'block');
    if (isSSL()) {
      display('http_only_http', 'block');
      display('http_settings', 'none');
      display('pwa_unsafe', 'none');
    }
  /*@/[if_target:host]*/
  /*@[if_not_target:esp, host]*/
    display('pwa_block', 'none');
    display('devlink_btn', 'none');
    display('qr_btn', 'none');
  /*@/[if_not_target:esp, host]*/
  /*@[if_not_target:esp,desktop,mobile]*/
  /*@/[if_not_target:esp,desktop,mobile]*/
}

// =================== FUNC ===================
function discover() {
  spinArrows(true);   // before discover!
  for (const id of hub.getDeviceIds()) {
    EL(`device#${id}`).className = "device offline";
    display(`SERIAL#${id}`, 'none');
    display(`BLE#${id}`, 'none');
    display(`HTTP#${id}`, 'none');
    display(`MQTT#${id}`, 'none');
  }

  /*@[if_target:esp]*/
    hub.http.discover_ip(window_ip(), window.location.port.length ? window.location.port : 80);
  /*@/[if_target:esp]*/
  /*@[if_not_target:esp]*/
    hub.discover();
  /*@/[if_not_target:esp]*/
}
function search() {
  spinArrows(true);
  hub.search();
}