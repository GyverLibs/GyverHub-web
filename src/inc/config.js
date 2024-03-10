let cfg_changed = false;
let cfg = {
  serial_offset: 2000,
  use_pin: false,
  pin: '',
  theme: 'auto',
  maincolor: 'GREEN',
  font: 'monospace',
  check_upd: true,
  ui_width: 450,
  wide_mode: false,
  lang: userLang(),
  app_plugin_css: '',
  app_plugin_js: '',
  api_ver: 2,
};

if (localStorage.hasOwnProperty('app_config')) {
  const cfg_r = JSON.parse(localStorage.getItem('app_config'));
  if (cfg.api_ver === cfg_r.api_ver) {
    cfg = cfg_r;
  }
}
localStorage.setItem('app_config', JSON.stringify(cfg));

let lang = langBase[cfg.lang];

function update_cfg(el) {
  if (el.type == 'text') el.value = el.value.trim();
  const val = (el.type == 'checkbox') ? el.checked : el.value;
  if (el.id in cfg) cfg[el.id] = val;
  else if (el.dataset.hubConfig) {
    if (el.dataset.hubConfig === 'connections.HTTP.local_ip' && !checkIP(val)) {
      asyncAlert(lang.wrong_ip);
      return;
    }
    hub.config.set(...el.dataset.hubConfig.split('.'), val);
  }
  cfg_changed = true;
  update_theme();
}
function save_cfg() {
  if (cfg.pin.length < 4) cfg.use_pin = false;
  localStorage.setItem('app_config', JSON.stringify(cfg));
  localStorage.setItem('hub_config', hub.config.toJson());
}

function update_theme() {
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-auto');
  document.body.classList.add('theme-' + cfg.theme.toLowerCase());

  const r = document.querySelector(':root');
  r.style.setProperty('--ui_width', cfg.ui_width + 'px');
  r.style.setProperty('--prim', intToCol(colors[cfg.maincolor]));
  r.style.setProperty('--font_f', cfg.font);

  EL('app_plugins').replaceChildren();
  addDOM('app_css', 'style', cfg.app_plugin_css, EL('app_plugins'));
  addDOM('app_js', 'script', cfg.app_plugin_js, EL('app_plugins'));

  display('local_block', hub.config.get('connections', 'HTTP', 'enabled') ? 'block' : 'none');
  EL('local_label').style.color = hub.config.get('connections', 'HTTP', 'enabled') ? 'var(--font)' : 'var(--font3)';

  display('pin_block', cfg.use_pin ? 'block' : 'none');
  EL('pin_label').style.color = cfg.use_pin ? 'var(--font)' : 'var(--font3)';

/*@[if_not_target:esp]*/
  display('mq_block', hub.config.get('connections', 'MQTT', 'enabled') ? 'block' : 'none');
  EL('mqtt_label').style.color = hub.config.get('connections', 'MQTT', 'enabled') ? 'var(--font)' : 'var(--font3)';

  display('tg_block', hub.config.get('connections', 'TG', 'enabled') ? 'block' : 'none');
  EL('tg_label').style.color = hub.config.get('connections', 'TG', 'enabled') ? 'var(--font)' : 'var(--font3)';

  const bt = hub.config.get('connections', 'BLE', 'enabled');
  display('bt_block', bt ? 'block' : 'none');
  EL('bt_label').style.color = bt ? 'var(--font)' : 'var(--font3)';

  const ser = hub.config.get('connections', 'SERIAL', 'enabled');
  display('serial_block', ser ? 'block' : 'none');
  EL('serial_label').style.color = ser ? 'var(--font)' : 'var(--font3)';
/*@/[if_not_target:esp]*/
}

function cfg_export() {
  const config = {
    app_config: cfg,
    hub_config: hub.config.toJson(),
  };
  const $a = document.createElement('a');
  $a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
  $a.download = "GyverHub-config-export.json";
  document.body.appendChild($a);
  $a.click();
  $a.remove();
}

function cfg_import() {
  const $in = document.createElement('input');
  $in.type = 'file';
  $in.accept = ".json,application/json";
  $in.addEventListener("change", async () => {
    const file = $in.files[0];

    try {
      const ab = await readFileAsArrayBuffer(file);
      const text = new TextDecoder().decode(ab);
      const data = JSON.parse(text);
      cfg = data.app_config;
      hub.config.fromJson(data.hub_config);
    } catch (e) {
      console.log(e);
      showPopupError(lang.import_err);
      return;
    }

    save_cfg();
    showPopup(lang.import_ok);
    setTimeout(() => location.reload(), 500);
  });
  $in.click();
}

async function cfg_reset() {
  if (await asyncConfirm(lang.cfg_reset_conf)) {
    localStorage.clear();
    setTimeout(() => location.reload(), 500);
  }
}
