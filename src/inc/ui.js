let menu_f = false;
let pin_id = null;

// ====================== VARS ======================
let screen = 'main';
let focused = null;

// ============== SCREEN ==============
async function show_screen(nscreen) {
  spinArrows(false);
  screen = nscreen;

  document.body.dataset.screen = screen;
  const $title = document.getElementsByClassName('header-title')[0];

  const dev = hub.dev(focused);
  if (dev) dev.fsStop();

  switch (screen) {
    case 'main':
      $title.textContent = "GyverHub";
      showCLI(false);
      break;

    case 'test':
      $title.textContent = 'UI Test';
      break;

    case 'projects':
      $title.textContent = lang.p_proj;
      loadProjects();
      break;

    case 'ui':
      $title.textContent = dev.info.name;
      EL('controls').replaceChildren();
      break;

    case 'config':
      $title.textContent = lang.config;
      break;

    case 'info':
      $title.textContent = dev.info.name + '/info';
      enterMenu('menu_info');
      await show_info();
      break;

    case 'files':
      $title.textContent = dev.info.name + '/fs';
      EL('fs_upload').textContent = lang.fs_upload;
      enterMenu('menu_fsbr');
      display('fs_browser', dev.isModuleEnabled(Modules.FILES) ? 'block' : 'none');
      display('fs_upload', dev.isModuleEnabled(Modules.UPLOAD) ? 'block' : 'none');
      display('fs_create', dev.isModuleEnabled(Modules.CREATE) ? 'block' : 'none');
      display('fs_format', dev.isModuleEnabled(Modules.FORMAT) ? 'flex' : 'none');
      if (dev.isModuleEnabled(Modules.FILES)) {
        EL('fsbr_inner').innerHTML = waiter();
        await dev.updateFileList();
      }
      break;

    case 'fsbr_edit':
      $title.textContent = dev.info.name + '/fs';
      enterMenu('menu_fsbr');
      break;

    case 'ota':
      $title.textContent = dev.info.name + '/ota';
      enterMenu('menu_ota');
    
      const ota_t = '.' + dev.info.ota_t;
      EL('ota_upload').accept = ota_t;
      EL('ota_upload_fs').accept = ota_t;
      EL('ota_url_f').value = "http://flash" + ota_t;
      EL('ota_url_fs').value = "http://filesystem" + ota_t;
      display('fs_otaf', dev.isModuleEnabled(Modules.OTA) ? 'block' : 'none');
      display('fs_otaurl', dev.isModuleEnabled(Modules.OTA_URL) ? 'block' : 'none');
      break;

    case 'dev_config':
      $title.textContent = dev.info.name + '/cfg';
      enterMenu('menu_cfg');
      show_cfg();
      break;
  }
}
function show_cfg() {
  const dev = hub.dev(focused);

  EL('main_width').value = dev.info.main_width;
  EL('info_cli_sw').checked = document.body.classList.contains('show-cli');
  EL('info_trust').checked = dev.info.trust;
  EL('plugin_css').value = dev.info.plugin_css;
  EL('plugin_js').value = dev.info.plugin_js;
}
async function show_info() {
  const dev = hub.dev(focused);

  EL('info_id').textContent = focused;
  EL('info_set').textContent = dev.info.prefix + '/' + focused + '/ID/set/*';
  EL('info_read').textContent = dev.info.prefix + '/' + focused + '/ID/read/*';
  EL('info_get').textContent = dev.info.prefix + '/hub/' + focused + '/get/*';
  EL('info_status').textContent = dev.info.prefix + '/hub/' + focused + '/status';
  display('reboot_btn', dev.isModuleEnabled(Modules.REBOOT) ? 'block' : 'none');
  display('info_topics', dev.isModuleEnabled(Modules.MQTT) ? 'block' : 'none');

  EL('info_version').replaceChildren();
  EL('info_net').replaceChildren();
  EL('info_memory').replaceChildren();
  EL('info_system').replaceChildren();

  if (dev.isModuleEnabled(Modules.INFO)) {
    const info = await dev.getInfo();
    if (info) showInfo(info);
  }
}

// =========== HANDLERS ===========
async function refresh_h() {
  if (!focused) {
    discover();
    return
  }
  const dev = hub.dev(focused);
  switch (screen) {
    case "ui":
      await dev.updateUi();
      break;
    case "files":
      await dev.updateFileList();
      break;
    case "info":
      const info = await dev.getInfo();
      if (info) showInfo(info);
      break;
  }
}
async function back_h() {
  if (focused) {
    const dev = hub.dev(focused);
    dev.fsStop();
  }
  if (menu_f) {
    menu_show(false);
    return;
  }
  switch (screen) {
    case 'ui':
      close_device();
      break;
    case 'dev_config':
    case 'info':
    case 'files':
    case 'ota':
      enterMenu();
      show_screen('ui');
      hub.dev(focused).updateUi();
      break;
    case 'fsbr_edit':
      show_screen('files');
      break;
    case 'config':
      config_h();
      break;
    case 'projects':
    case 'test':
      show_screen('main');
      break;
  }
}
function config_h() {
  if (screen == 'config') {
    show_screen('main');
    if (cfg_changed) {
      save_cfg();
      discover();
    }
    cfg_changed = false;
  } else {
    show_screen('config');
  }
}

function manual_ip_h(ip) {
  if (!checkIP(ip)) {
    showPopupError(lang.wrong_ip);
    return;
  }
  hub.http.discover_ip(ip);
  save_cfg();
  show_screen('main');
}
function update_ip_h() {
  /*@[if_target:esp]*/
  EL('local_ip').value = window_ip();
  /*@/[if_target:esp]*/
  /*@[if_not_target:esp]*/
  getLocalIP(false);
  /*@/[if_not_target:esp]*/
}
function menu_h() {
  menu_show(!menu_f);
}
function devlink_h() {
  copyClip(devLink());
}
function qr_h() {
  /*@[if_not_target:esp]*/
  const $qr = document.createElement('div');
  new QRCode($qr, devLink());
  $qr.style.margin = '0 auto';
  asyncShowQr($qr);
  /*@/[if_not_target:esp]*/
}
function devLink() {
  let qs = window.location.origin + window.location.pathname + '?';
  const info = hub.dev(focused).info;
  ["id", "prefix", "ip", "http_port"].forEach(x => { if (info[x]) qs += `${x}=${info[x]}&`; });
  return qs.slice(0, -1);
}
function ui_width_h(el) {
  hub.dev(focused).info.main_width = el.value;
}
function ui_plugin_css_h(el) {
  hub.dev(focused).info.plugin_css = el.value;
  addDOM('device_css', 'style', el.value, EL('plugins'));
}
function ui_plugin_js_h(el) {
  hub.dev(focused).info.plugin_js = el.value;
  addDOM('device_js', 'script', el.value, EL('plugins'));
}

// ============== MENU =============
function menu_show(state) {
  menu_f = state;
  const cl = EL('menu').classList;
  if (menu_f) cl.add('menu_show');
  else cl.remove('menu_show');
  EL('icon_menu').textContent = menu_f ? '' : '';
  display('menu_overlay', menu_f ? 'block' : 'none');
}
function updateSystemMenu() {
  const dev = hub.dev(focused);
  EL('menu').append(createElement(null, {
    type: 'div',
    class: "menu_item menu_cfg",
    text: lang.m_config,
    events: {
      click: () => show_screen('dev_config')
    }
  }));
  EL('menu').append(createElement(null, {
    type: 'div',
    class: "menu_item menu_info",
    text: lang.m_info,
    events: {
      click: () => show_screen('info')
    }
  }));

  if (dev.isModuleEnabled(Modules.FILES)) {
    EL('menu').append(createElement(null, {
      type: 'div',
      class: "menu_item menu_fsbr",
      text: lang.m_files,
      events: {
        click: () => show_screen('files')
      }
    }));
  }
  if (dev.isModuleEnabled(Modules.OTA) || dev.isModuleEnabled(Modules.OTA_URL)) {
    EL('menu').append(createElement(null, {
      type: 'div',
      class: "menu_item menu_ota",
      text: lang.m_ota,
      events: {
        click: () => show_screen('ota')
      }
    }));
  }
}
function enterMenu(sel = null) {
  menu_show(false);
  for (const $i of document.getElementById('menu').children)
      $i.classList.remove('menu_act');
  if (sel !== null)
      document.querySelector('.menu_item.' + sel).classList.add('menu_act');
}
// ============== DEVICE =============
async function device_h(id) {
  const dev = hub.dev(id);
  if (!dev || !dev.isConnected()) return;
  if (!dev.info.api_v || dev.info.api_v != GyverHub.api_v) asyncAlert(lang.api_mis);

  if (dev.info.pin && !dev.granted) {
    if (!await asyncAskPin(lang.dev_pin + dev.info.name, dev.info.pin, true)) {
      return false;
    }
    dev.granted = true;
  }
  
  /*@[if_not_target:esp]*/
  await checkUpdates(dev);
  /*@/[if_not_target:esp]*/

  focused = id;
  EL('menu').replaceChildren();
  updateSystemMenu();
  EL('conn').textContent = dev.getConnection().name;
  addDOM('device_css', 'style', dev.info.plugin_css, EL('plugins'));
  addDOM('device_js', 'script', dev.info.plugin_js, EL('plugins'));
  show_screen('ui');
  dev.focus();
}
function close_device() {
  if (renderer) renderer.close();
  renderer = null;
  const $root = document.getElementById('controls');
  $root.replaceChildren();
  EL('plugins').replaceChildren();
  EL('ota_label').replaceChildren();

  errorBar(false);
  hub.dev(focused).unfocus();
  focused = null;
  show_screen('main');
}
async function delete_h(id) {
  if (await asyncConfirm(lang.delete + ' ' + id + '?')) {
    hub.deleteDevice(id);
    EL(`device#${id}`).remove();
  }
}
function dev_up_h(id) {
  hub.moveDevice(id, -1);
  render_devices();
}
function dev_down_h(id) {
  hub.moveDevice(id, 1);
  render_devices();
}
async function trust_dev_h() {
  const v = EL('info_trust').checked;
  if (v && !await asyncConfirm(lang.dev_trust_warning)) {
    EL('info_trust').checked = false;
    return;
  }
  hub.dev(focused).info.trust = v;
}

// ============== CLI =============
function showCLI(v) {
  if (v) document.body.classList.add('show-cli');
  else document.body.classList.remove('show-cli');

  if (v) EL('cli_input').focus();
  EL('info_cli_sw').checked = v;
}
function printCLI(text, color) {
  if (document.body.classList.contains('show-cli')) {
    if (EL('cli').innerHTML) EL('cli').innerHTML += '\n';
    let st = color ? `style="color:${intToCol(color)}"` : '';
    EL('cli').innerHTML += `<span ${st}>${text}</span>`;
    EL('cli').scrollTop = EL('cli').scrollHeight;
  }
}
function toggleCLI() {
  EL('cli').replaceChildren();
  EL('cli_input').value = "";
  showCLI(!document.body.classList.contains('show-cli'));
}
function checkCLI(event) {
  if (event.key == 'Enter') sendCLI();
}
async function sendCLI() {
  await hub.dev(focused).sendCli(EL('cli_input').value);
  EL('cli').innerHTML += "\n>" + EL('cli_input').value;
  EL('cli').scrollTop = EL('cli').scrollHeight;
  EL('cli_input').value = "";
}

// =========== PIN ===========
function make_pin(arg) {
  if (arg.value.length >= 4) arg.value = arg.value.hashCode();
  else arg.value = '';
}
function check_type(arg) {
  if (arg.value.length > 0) {
    let c = arg.value[arg.value.length - 1];
    if (c < '0' || c > '9') arg.value = arg.value.slice(0, -1);
  }
}
