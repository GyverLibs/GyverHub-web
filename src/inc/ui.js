let menu_f = false;
let pin_id = null;

// ====================== VARS ======================
let screen = 'main';
let focused = null;

// ============== SCREEN ==============
async function show_screen(nscreen) {
  if (focused) hub.dev(focused).fsStop();
  spinArrows(false);
  screen = nscreen;

  ['conn_icons', 'test_cont', 'projects_cont', 'config', 'devices',
    'controls', 'info', 'icon_menu', 'icon_cfg', 'files', 'ota', 'back', 'icon_refresh',
    'footer_cont', 'conn', 'dev_config'].forEach(e => display(e, 'none'));

  display('main_cont', 'block');

  EL('title').textContent = "GyverHub";
  EL('title_row').style.cursor = 'pointer';
  const dev = hub.dev(focused);

  switch (screen) {
    case 'main':
      display('conn_icons', 'inline-block');
      display('devices', 'grid');
      display('icon_cfg', 'inline-block');
      display('icon_refresh', 'inline-block');
      display('footer_cont', 'block');
      EL('title_row').style.cursor = 'unset';
      showCLI(false);
      break;

    case 'test':
      display('main_cont', 'none');
      display('test_cont', 'block');
      display('back', 'inline-block');
      EL('title').textContent = 'UI Test';
      break;

    case 'projects':
      display('main_cont', 'none');
      display('projects_cont', 'block');
      display('back', 'inline-block');
      EL('title').textContent = lang.p_proj;
      EL('projects').replaceChildren();
      loadProjects();
      break;

    case 'ui':
      display('controls', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('icon_refresh', 'inline-block');
      display('conn', 'inline-block');
      EL('title').textContent = dev.info.name;
      break;

    case 'config':
      display('conn_icons', 'inline-block');
      display('config', 'block');
      display('icon_cfg', 'inline-block');
      display('back', 'inline-block');
      EL('title').textContent = lang.config;
      break;

    case 'info':
      display('info', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      display('icon_refresh', 'inline-block');
      EL('title').textContent = dev.info.name + '/info';
      enterMenu('menu_info');
      await show_info();
      break;

    case 'files':
      display('files', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      display('icon_refresh', 'inline-block');
      EL('title').textContent = dev.info.name + '/fs';
      EL('file_upload_btn').textContent = lang.fs_upload;
      enterMenu('menu_fsbr');
      display('fs_browser', dev.isModuleEnabled(Modules.FILES) ? 'block' : 'none');
      display('fs_upload', dev.isModuleEnabled(Modules.UPLOAD) ? 'block' : 'none');
      display('fs_create', dev.isModuleEnabled(Modules.CREATE) ? 'block' : 'none');
      display('fs_format_row', dev.isModuleEnabled(Modules.FORMAT) ? 'flex' : 'none');
      if (dev.isModuleEnabled(Modules.FILES)) {
        EL('fsbr_inner').innerHTML = waiter();
        await dev.updateFileList();
      }
      break;

    case 'ota':
      display('ota', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      EL('title').textContent = dev.info.name + '/ota';
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
      display('dev_config', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      EL('title').textContent = dev.info.name + '/cfg';
      enterMenu('menu_cfg');
      show_cfg();
      break;
  }
}
function show_cfg() {
  let dev = hub.dev(focused);

  EL('ui_mode').value = dev.info.ui_mode;
  EL('main_width').value = dev.info.main_width;
  EL('ui_block_width').value = dev.info.ui_block_width;
  display('ui_block_width_cont', dev.info.ui_mode >= 2 ? 'flex' : 'none');
  EL('info_cli_sw').checked = EL('cli_cont').style.display == 'block';
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
    let dev = hub.dev(focused);
    if (dev.fsBusy()) {
      showPopupError(dev.fs_mode + ' ' + getError(HubErrors.Abort));  // TODO fs_mode
      dev.fsStop();
    }
  }
  if (EL('fsbr_edit').style.display == 'block') {
    editor_cancel();
    return;
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
      leaveSystemMenu();
      show_screen('ui');
      hub.dev(focused).updateUi();
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
async function format_h() {
  if (await asyncConfirm(lang.fs_format + '?')) {
    await hub.dev(focused).formatFS();
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
  let info = hub.dev(focused).info;
  ["id", "prefix", "ip", "http_port"].forEach(x => { if (info[x]) qs += `${x}=${info[x]}&`; });
  return qs.slice(0, -1);
}
function ui_mode_h(el) {
  hub.dev(focused).info.ui_mode = el.value;
  display('ui_block_width_cont', el.value >= 2 ? 'flex' : 'none');
}
function ui_width_h(el) {
  hub.dev(focused).info.main_width = el.value;
}
function ui_block_width_h(el) {
  hub.dev(focused).info.ui_block_width = el.value;
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
  let cl = EL('menu').classList;
  if (menu_f) cl.add('menu_show');
  else cl.remove('menu_show');
  EL('icon_menu').textContent = menu_f ? '' : '';
  display('menu_overlay', menu_f ? 'block' : 'none');
}
function updateSystemMenu() {
  let dev = hub.dev(focused);

  EL('menu_system').innerHTML = `<div id="menu_cfg" class="menu_item" data-action="show_screen" data-screen="dev_config">${lang.m_config}</div>`;
  EL('menu_system').innerHTML += `<div id="menu_info" class="menu_item" data-action="show_screen" data-screen="info">${lang.m_info}</div>`;
  if (dev.isModuleEnabled(Modules.FILES)) {
      EL('menu_system').innerHTML += `<div id="menu_fsbr" class="menu_item" data-action="show_screen" data-screen="files">${lang.m_files}</div>`;
  }
  if (dev.isModuleEnabled(Modules.OTA) || dev.isModuleEnabled(Modules.OTA_URL)) {
      EL('menu_system').innerHTML += `<div id="menu_ota" class="menu_item" data-action="show_screen" data-screen="ota">${lang.m_ota}</div>`;
  }
}
function leaveSystemMenu() {
  for (const $i of document.getElementById('menu_system').children)
      $i.classList.remove('menu_act');
}
function enterMenu(sel = null) {
  menu_show(false);
  leaveSystemMenu();
  for (const $i of document.getElementById('menu_user').children)
      $i.classList.remove('menu_act');
  if (sel !== null)
      document.querySelector('.menu_item#' + sel).classList.add('menu_act');
}
// ============== DEVICE =============
async function device_h(id) {
  let dev = hub.dev(id);
  if (!dev || !dev.isConnected()) return;
  if (!dev.info.api_v || dev.info.api_v != GyverHub.api_v) asyncAlert(lang.api_mis);

  if (dev.info.pin && !dev.granted) {
    if (!await asyncAskPin(lang.dev_pin + dev.info.name, dev.info.pin, true)) {
      return false;
    }
    dev.granted = true;
  }
  
  /*@[if_not_target:esp]*/
  checkUpdates(id);
  /*@/[if_not_target:esp]*/

  focused = id;
  updateSystemMenu();
  EL('menu_user').replaceChildren();
  EL('conn').textContent = dev.getConnection().name;
  addDOM('device_css', 'style', dev.info.plugin_css, EL('plugins'));
  addDOM('device_js', 'script', dev.info.plugin_js, EL('plugins'));
  show_screen('ui');
  dev.focus();
}
function close_device() {
  if (renderer) renderer.close();
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
  EL('bottom_space').style.height = v ? '170px' : '50px';
  display('cli_cont', v ? 'block' : 'none');
  if (v) EL('cli_input').focus();
  EL('info_cli_sw').checked = v;
}
function printCLI(text, color) {
  if (EL('cli_cont').style.display == 'block') {
    if (EL('cli').innerHTML) EL('cli').innerHTML += '\n';
    let st = color ? `style="color:${intToCol(color)}"` : '';
    EL('cli').innerHTML += `<span ${st}>${text}</span>`;
    EL('cli').scrollTop = EL('cli').scrollHeight;
  }
}
function toggleCLI() {
  EL('cli').replaceChildren();
  EL('cli_input').value = "";
  showCLI(!(EL('cli_cont').style.display == 'block'));
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
