function update_cfg(el) {
  if (el.type == 'text') el.value = el.value.trim();
  let val = (el.type == 'checkbox') ? el.checked : el.value;
  if (el.id in cfg) cfg[el.id] = val;
  else if (el.dataset.hubConfig) hub.config.set(...el.dataset.hubConfig.split('.'), val);
  cfg_changed = true;
  update_theme();
}
function save_cfg() {
  if (cfg.pin.length < 4) cfg.use_pin = false;
  localStorage.setItem('app_config', JSON.stringify(cfg));
  localStorage.setItem('hub_config', hub.config.toJson());
}
async function cfg_export() {
  await copyClip(btoa(JSON.stringify(cfg)) + ';' + btoa(hub.config.toJson()));
}
async function cfg_import() {
  try {
    let text = await navigator.clipboard.readText();
    text = text.split(';');
    try {
      cfg = JSON.parse(atob(text[0]));
    } catch (e) { }
    try {
      hub.config.fromJson(atob(text[1]));
    } catch (e) { }

    save_cfg();
    showPopup(lang.import_ok);
    setTimeout(() => location.reload(), 500);
  } catch (e) {
    showPopupError(lang.import_err);
  }
}
async function cfg_reset() {
  if (await asyncConfirm(lang.cfg_reset_conf)) {
    localStorage.clear();
    setTimeout(() => location.reload(), 500);
  }
}

function update_theme() {
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-auto');
  document.body.classList.add('theme-' + cfg.theme.toLowerCase());

  let r = document.querySelector(':root');
  r.style.setProperty('--ui_width', cfg.ui_width + 'px');
  r.style.setProperty('--prim', intToCol(colors[cfg.maincolor]));
  r.style.setProperty('--font_f', cfg.font);

  EL('app_plugins').innerHTML = '';
  addDOM('app_css', 'style', cfg.app_plugin_css, EL('app_plugins'));
  addDOM('app_js', 'script', cfg.app_plugin_js, EL('app_plugins'));

  let b = 'block';
  let n = 'none';
  let f = 'var(--font)';
  let f3 = 'var(--font3)';

  display('local_block', hub.config.get('connections', 'HTTP', 'enabled') ? b : n);
  EL('local_label').style.color = hub.config.get('connections', 'HTTP', 'enabled') ? f : f3;
  display('pin_block', cfg.use_pin ? b : n);

  EL('pin_label').style.color = cfg.use_pin ? f : f3;

/*@[if_not_target:esp]*/
  display('mq_block', hub.config.get('connections', 'MQTT', 'enabled') ? b : n);
  EL('mqtt_label').style.color = hub.config.get('connections', 'MQTT', 'enabled') ? f : f3;

  display('tg_block', hub.config.get('connections', 'TG', 'enabled') ? b : n);
  EL('tg_label').style.color = hub.config.get('connections', 'TG', 'enabled') ? f : f3;

  let bt = hub.config.get('connections', 'BLE', 'enabled') && hasBT();
  display('bt_block', bt ? b : n);
  EL('bt_label').style.color = bt ? f : f3;

  let ser = hub.config.get('connections', 'SERIAL', 'enabled') && hasSerial();
  display('serial_block', ser ? b : n);
  EL('serial_label').style.color = ser ? f : f3;
  /*@/[if_not_target:esp]*/
}