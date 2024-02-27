document.addEventListener('DOMContentLoaded', async () => {
  renderBody();
  apply_cfg();
  render_main();

  document.addEventListener('click', e => {
    const $t = e.composedPath().find(e => e.dataset && e.dataset.action);
    if (!$t) return;
    switch ($t.dataset.action) {
      case "show_screen":
        show_screen($t.dataset.screen);
        break;
        case "back":
          back_h();
          break;
        case "refresh":
          refresh_h();
          break;
        case "config":
          config_h();
          break;
        case "menu":
          menu_h();
          break;
    }
  });

  /*@[if_target:esp]*/
    hub.config.set('connections', 'HTTP', 'enabled', true);  // force local on esp
  /*@/[if_target:esp]*/

  update_theme();
  set_drop();
  key_change();
  handle_back();
  register_SW();

  getLocalIP();

  // device hook
  const qs = window.location.search;
  if (qs) {
    const params = new URLSearchParams(qs).entries();
    const data = {};
    for (const param of params) data[param[0]] = param[1];
    if (!hub.dev(data.id)) hub.addDevice(data);
  }

  /*@[if_target:host]*/
    if (isSSL()) {
      display('http_only_http', 'block');
      display('http_settings', 'none');
      display('pwa_unsafe', 'none');
    }
    if (isSSL()) {
      EL('btn_pwa_http').classList.add('ui_btn_dis');
    } else {
      EL('btn_pwa_https').classList.add('ui_btn_dis');
    }
  /*@/[if_target:host]*/

  if (cfg.use_pin && cfg.pin.length) await asyncAskPin(lang.hub_pin, cfg.pin, false);

  // show version
  const ver = localStorage.getItem('version');
  const app_version = '/*@![:version]*/';
  if (!ver || ver != app_version) {
    localStorage.setItem('version', app_version);
    setTimeout(() => {
      asyncAlert(lang.i_version + ' ' + app_version + '!\n' + '/*@![:release_notes]*/');
    }, 1000);
  }

  if ('Notification' in window && Notification.permission == 'default') Notification.requestPermission();

  show_screen('main');

  render_devices();
  hub.begin();
  await discover();

  function render_main() {
    const slots = document.getElementsByTagName('slot');
    while (slots.length) {
      const i = slots[0];
      const p = i.name.split('.');
      const n =  p.shift();
      let v = '';
      if (n === 'lang'){
        v = lang;
        for (const i of p)
          v = v[i] ?? "";
      }
      if (n === 'browser')
        v = browser();
      if (n === 'location')
        v = location.href;
      i.replaceWith(v);
    }

    for (const i of EL('maincolor').children){
      i.text = lang.colors[i.value];
    }

    for (const i of EL('theme').children){
      i.text = lang.themes[i.value];
    }

    /*@[if_not_target:esp]*/
    if (!("serial" in navigator)) EL('serial_col').style.display = 'none';
    if (!("bluetooth" in navigator)) EL('bt_col').style.display = 'none';
    /*@/[if_not_target:esp]*/

    let masks = getMaskList();
    for (let mask in masks) {
      EL('netmask').innerHTML += `<option value="${mask}">${masks[mask]}</option>`;
    }
  }
  function register_SW() {
    /*@[if_target:host]*/
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      display('pwa_block', 'block');
      EL('btn_pwa').addEventListener('click', async () => {
        e.prompt();
        const { outcome } = await e.userChoice;
        if (outcome === 'accepted') 
          display('pwa_block', 'none');
      })
    });
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
  function apply_cfg() {
    if (cfg.pin.length < 4) cfg.use_pin = false;
    for (const key in cfg) {
      const el = EL(key);
      if (el == undefined) continue;
      if (el.type == 'checkbox') el.checked = cfg[key];
      else el.value = cfg[key];
    }
    for (const el of document.querySelectorAll('[data-hub-config]')) {
      const value = hub.config.get(...el.dataset.hubConfig.split('.'));
      if (el.type == 'checkbox') el.checked = value;
      else el.value = value;
    }
  }
});

// =================== FUNC ===================
async function discover() {
  spinArrows(true);   // before discover!
  for (const id of hub.getDeviceIds()) {
    EL(`device#${id}`).className = "device offline";
    display(`SERIAL#${id}`, 'none');
    display(`BLE#${id}`, 'none');
    display(`HTTP#${id}`, 'none');
    display(`MQTT#${id}`, 'none');
  }

  /*@[if_target:esp]*/
    let device;
    try {
      device = await hub.http.discover_ip(window.location.hostname, window.location.port.length ? window.location.port : 80);
    } catch (e) {
      showPopupError(getError(e));
      return;
    }
    if (device) device_h(device.info.id);
  /*@/[if_target:esp]*/
  /*@[if_not_target:esp]*/
    await hub.discover();
  /*@/[if_not_target:esp]*/
}
function search() {
  if (cfg_changed) {
    save_cfg();
  }
  cfg_changed = false;

  show_screen('main');

  spinArrows(true);
  hub.search();
}