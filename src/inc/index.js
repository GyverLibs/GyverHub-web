window.onload = () => {
  render_main();
  EL('hub_stat').innerHTML = 'GyverHub v' + app_version + ' ' + (isPWA() ? 'PWA ' : '') + (isSSL() ? 'SSL ' : '') + (isLocal() ? 'Local ' : '') + (isESP() ? 'ESP ' : '') + (isApp() ? 'App ' : '');

  load_cfg();
  load_cfg_hub();
  if (isESP()) hub.cfg.use_local = true;  // force local on esp
  update_ip();
  update_theme();
  set_drop();
  key_change();
  handle_back();
  register_SW();
  if (cfg.use_pin) show_keypad(true);
  else startup();

  function register_SW() {
    /*NON-ESP*/
    if ('serviceWorker' in navigator && !isLocal() && !isApp()) {
      navigator.serviceWorker.register('sw.js');
      window.addEventListener('beforeinstallprompt', (e) => deferredPrompt = e);
    }
    /*/NON-ESP*/
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
    if (isESP() || window_ip()) {
      EL('local_ip').value = window_ip();
      hub.cfg.local_ip = window_ip();
    }
    /*NON-ESP*/
    else if (!Boolean(window.webkitRTCPeerConnection || window.mozRTCPeerConnection)) return;
    getLocalIP()
      .then((ip) => {
        if (ip.indexOf("local") < 0) {
          EL('local_ip').value = ip;
          hub.cfg.local_ip = ip;
        }
        return;
      })
      .catch(e => console.log(e));
    /*/NON-ESP*/
  }
}
function startup() {
  render_selects();
  render_info();
  apply_cfg();
  update_theme();
  show_screen('main');
  if ('Notification' in window && Notification.permission == 'default') Notification.requestPermission();
  load_devices();

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
      alert('Версия ' + app_version + '!\n' + '__NOTES__');
      localStorage.setItem('version', app_version);
    }
  }, 1000);

  render_devices();
  hub.begin();
  discover();

  /*NON-ESP*/
  if (isSSL()) {
    display('http_only_http', 'block');
    display('http_settings', 'none');
    display('pwa_unsafe', 'none');
  }
  if (isPWA() || isLocal() || isApp()) {
    display('pwa_block', 'none');
  }
  if (isApp()) display('app_block', 'none');

  serial_check_ports();
  /*/NON-ESP*/

  if (isESP()) {
    for (let dev of hub.devices) {
      if (window.location.href.includes(dev.info.ip)) {
        dev.conn = Conn.HTTP;
        dev.conn_arr[Conn.HTTP] = 1;
        device_h(dev.info.id);
        return;
      }
    }
  }
}

// =================== FUNC ===================
function discover() {
  for (let dev of hub.devices) {
    let id = dev.info.id;
    EL(`device#${id}`).className = "device offline";
    display(`Serial#${id}`, 'none');
    display(`BT#${id}`, 'none');
    display(`HTTP#${id}`, 'none');
    display(`MQTT#${id}`, 'none');
  }

  if (isESP()) {
    hub.http.discover_ip(window_ip(), window.location.port.length ? window.location.port : 80);
  } else {
    hub.discover();
  }
  spinArrows(true);

}
function search() {
  spinArrows(true);
  hub.search();
}