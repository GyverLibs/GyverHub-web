let menu_f = false;
let pin_id = null;

// ============== SCREEN ==============
async function show_screen(nscreen) {
  if (focused) hub.dev(focused).fsStop();
  spinArrows(false);
  screen = nscreen;
  show_keypad(false);

  ['conn_icons', 'test_cont', 'projects_cont', 'config', 'devices',
    'controls', 'info', 'icon_menu', 'icon_cfg', 'files', 'ota', 'back', 'icon_refresh',
    'footer_cont', 'conn', 'dev_config'].forEach(e => display(e, 'none'));

  display('main_cont', 'block');

  EL('title').innerHTML = app_title;
  EL('title_row').style.cursor = 'pointer';
  let dev = hub.dev(focused);

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
      EL('title').innerHTML = 'UI Test';
      break;

    case 'projects':
      display('main_cont', 'none');
      display('projects_cont', 'block');
      display('back', 'inline-block');
      EL('title').innerHTML = lang.p_proj;
      break;

    case 'ui':
      display('controls', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('icon_refresh', 'inline-block');
      display('conn', 'inline-block');
      EL('title').innerHTML = dev.info.name;
      break;

    case 'config':
      display('conn_icons', 'inline-block');
      display('config', 'block');
      display('icon_cfg', 'inline-block');
      display('back', 'inline-block');
      EL('title').innerHTML = lang.config;
      break;

    case 'info':
      display('info', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      display('icon_refresh', 'inline-block');
      EL('title').innerHTML = dev.info.name + '/info';
      show_info();
      break;

    case 'files':
      display('files', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      display('icon_refresh', 'inline-block');
      EL('title').innerHTML = dev.info.name + '/fs';
      EL('file_upload_btn').innerHTML = lang.fs_upload;
      break;

    case 'ota':
      display('ota', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      EL('title').innerHTML = dev.info.name + '/ota';
      break;

    case 'dev_config':
      display('dev_config', 'block');
      display('icon_menu', 'inline-block');
      display('back', 'inline-block');
      display('conn', 'inline-block');
      EL('title').innerHTML = dev.info.name + '/cfg';
      show_cfg();
      break;

    case 'pin':
      display('back', 'inline-block');
      show_keypad(true);
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
  EL('plugin_css').value = dev.info.plugin_css;
  EL('plugin_js').value = dev.info.plugin_js;
}
function show_info() {
  let dev = hub.dev(focused);

  EL('info_id').innerHTML = focused;
  EL('info_set').innerHTML = dev.info.prefix + '/' + focused + '/ID/set/*';
  EL('info_read').innerHTML = dev.info.prefix + '/' + focused + '/ID/read/*';
  EL('info_get').innerHTML = dev.info.prefix + '/hub/' + focused + '/get/*';
  EL('info_status').innerHTML = dev.info.prefix + '/hub/' + focused + '/status';
  display('reboot_btn', dev.module(Modules.REBOOT) ? 'block' : 'none');
  display('info_topics', dev.module(Modules.MQTT) ? 'block' : 'none');

  EL('info_version').innerHTML = '';
  EL('info_net').innerHTML = '';
  EL('info_memory').innerHTML = '';
  EL('info_system').innerHTML = '';
}

// =========== HANDLERS ===========
function resize_h() {
  UiGauge.resize();
  UiGaugeR.resize();
  UiGaugeL.resize();
  UiJoy.resize();
  UiDpad.resize();
  UiCanvas.resize();
  UiPlot.resize();
}
function test_h() {
  show_screen('test');
}
function projects_h() {
  EL('projects').innerHTML = '';
  show_screen('projects');
  loadProjects();
}
function refresh_h() {
  if (focused) post(screen);
  else discover();
}
async function back_h() {
  if (focused) {
    let dev = hub.dev(focused);
    if (dev.fsBusy()) {
      showPopupError(dev.fs_mode + ' ' + getError(HubErrors.Abort));
      dev.fsStop();
    }
  }
  if (EL('fsbr_edit').style.display == 'block') {
    editor_cancel();
    return;
  }
  if (menu_f) {
    Menu.deact();
    menu_show(0);
    return;
  }
  switch (screen) {
    case 'ui':
      release_all();
      close_device();
      break;
    case 'dev_config':
    case 'info':
    case 'files':
    case 'ota':
      Menu.deact();
      show_screen('ui');
      post('ui');
      break;
    case 'config':
      config_h();
      break;
    case 'pin':
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
function info_h() {
  Menu.deact();
  menu_show(0);
  if (hub.dev(focused).module(Modules.INFO)) post('info');
  show_screen('info');
  EL('menu_info').classList.add('menu_act');
}
function cfg_h() {
  Menu.deact();
  menu_show(0);
  show_screen('dev_config');
  EL('menu_cfg').classList.add('menu_act');
}
function fsbr_h() {
  Menu.deact();
  menu_show(0);
  if (hub.dev(focused).module(Modules.FILES)) {
    post('files');
    EL('fsbr_inner').innerHTML = waiter();
  }
  display('fs_browser', hub.dev(focused).module(Modules.FILES) ? 'block' : 'none');
  display('fs_upload', hub.dev(focused).module(Modules.UPLOAD) ? 'block' : 'none');
  display('fs_create', hub.dev(focused).module(Modules.CREATE) ? 'block' : 'none');
  display('fs_format_row', hub.dev(focused).module(Modules.FORMAT) ? 'flex' : 'none');
  show_screen('files');
  EL('menu_fsbr').classList.add('menu_act');
}
async function format_h() {
  if (await asyncConfirm('Format filesystem?')) post('format');
}
function ota_h() {
  Menu.deact();
  menu_show(0);
  show_screen('ota');
  EL('menu_ota').classList.add('menu_act');

  let ota_t = '.' + hub.dev(focused).info.ota_t;
  EL('ota_upload').accept = ota_t;
  EL('ota_upload_fs').accept = ota_t;
  EL('ota_url_f').value = "http://flash" + ota_t;
  EL('ota_url_fs').value = "http://filesystem" + ota_t;
  display('fs_otaf', hub.dev(focused).module(Modules.OTA) ? 'block' : 'none');
  display('fs_otaurl', hub.dev(focused).module(Modules.OTA_URL) ? 'block' : 'none');
}
function manual_ip_h(ip) {
  if (hub.http.discover_ip(ip, hub.cfg.http_port)) {
    save_cfg();
    show_screen('main');
  } else showPopupError('Wrong IP');
}
function update_ip_h() {
  /*NON-ESP*/
  if (!Boolean(window.webkitRTCPeerConnection || window.mozRTCPeerConnection)) notSupported();
  else getLocalIP().then((ip) => {
    if (ip.indexOf("local") > 0) alert(`Disable WEB RTC anonymizer: ${browser()}://flags/#enable-webrtc-hide-local-ips-with-mdns`);
    else EL('local_ip').value = ip;
  });
  /*/NON-ESP*/
  if (isESP()) EL('local_ip').value = window_ip();
}
function menu_h() {
  menu_show(!menu_f);
}
function devlink_h() {
  copyClip(devLink());
}
function qr_h() {
  /*NON-ESP*/
  let qr = EL("qrcode");
  new QRCode(qr, devLink());
  setTimeout(() => openFile(qr.children[1].src), 100);
  /*/NON-ESP*/
}
function devLink() {
  let qs = window.location.origin + window.location.pathname + '?';
  let info = hub.dev(focused).info;
  ["id", "prefix", "ip", "http_port"].forEach(x => { if (info[x]) qs += `${x}=${info[x]}&`; });
  return qs.slice(0, -1);
}
function ui_mode_h(el) {
  hub.dev(focused).info.ui_mode = el.value;
  save_devices();
  display('ui_block_width_cont', el.value >= 2 ? 'flex' : 'none');
}
function ui_width_h(el) {
  hub.dev(focused).info.main_width = el.value;
  save_devices();
}
function ui_block_width_h(el) {
  hub.dev(focused).info.ui_block_width = el.value;
  save_devices();
}
function ui_plugin_css_h(el) {
  hub.dev(focused).info.plugin_css = el.value;
  save_devices();
  addDOM('device_css', 'style', el.value, EL('plugins'));
}
function ui_plugin_js_h(el) {
  hub.dev(focused).info.plugin_js = el.value;
  save_devices();
  addDOM('device_js', 'script', el.value, EL('plugins'));
}

// ============== MENU =============
function menu_show(state) {
  menu_f = state;
  let cl = EL('menu').classList;
  if (menu_f) cl.add('menu_show');
  else cl.remove('menu_show');
  EL('icon_menu').innerHTML = menu_f ? '' : '';
  display('menu_overlay', menu_f ? 'block' : 'none');
}

// ============== DEVICE =============
function device_h(id) {
  let dev = hub.dev(id);
  if (!dev || dev.conn == Conn.NONE) return;
  if (!dev.info.api_v || dev.info.api_v != hub.api_v) alert(lang.api_mis);

  if (dev.info.PIN && !dev.granted) {
    pin_id = id;
    show_screen('pin');
  } else {
    open_device(id);
  }
}
function open_device(id) {
  /*NON-ESP*/
  checkUpdates(id);
  /*/NON-ESP*/

  focused = id;
  let dev = hub.dev(id)
  EL('menu_user').innerHTML = '';
  EL('conn').innerHTML = Conn.names[dev.conn];
  UiPlugin.enableStyle(id);
  addDOM('device_css', 'style', dev.info.plugin_css, EL('plugins'));
  addDOM('device_js', 'script', dev.info.plugin_js, EL('plugins'));
  let ctrls = EL('controls#' + id);
  if (ctrls) {
    ctrls.style.display = 'block';
    truncIdRecursive(ctrls, '__old');
  }
  show_screen('ui');
  dev.focus();
}
function close_device() {
  Ack.clearAll();
  UiHook.reset();
  UiColor.reset();
  UiGauge.reset();
  UiGaugeR.reset();
  UiGaugeL.reset();
  UiCanvas.reset();
  UiPlot.reset();
  UiJoy.reset();
  UiDpad.reset();

  UiPlugin.disableStyle(focused);
  UiJS.disable();
  UiCSS.disable();
  EL('plugins').innerHTML = '';
  let ctrls = EL('controls#' + focused);
  if (ctrls) {
    ctrls.style.display = 'none';
    addIdRecursive(ctrls, '__old');
  }
  EL('ota_label').innerHTML = "";

  errorBar(false);
  hub.dev(focused).unfocus();
  focused = null;
  show_screen('main');
}
async function delete_h(id) {
  if (await asyncConfirm('Delete ' + id + '?')) {
    hub.delete(id);
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
  EL('cli').innerHTML = "";
  EL('cli_input').value = "";
  showCLI(!(EL('cli_cont').style.display == 'block'));
}
function checkCLI(event) {
  if (event.key == 'Enter') sendCLI();
}
function sendCLI() {
  post('cli', 'cli', EL('cli_input').value);
  EL('cli').innerHTML += "\n>" + EL('cli_input').value;
  EL('cli').scrollTop = EL('cli').scrollHeight;
  EL('cli_input').value = "";
}

// =========== PIN ===========
function make_pin(arg) {
  if (arg.value.length >= 4) arg.value = arg.value.hashCode();
  else arg.value = '';
}
function pass_type(v) {
  EL('pass_inp').value += v;
  let hash = EL('pass_inp').value.hashCode();

  if (pin_id) {   // device
    if (hash == hub.dev(pin_id).info.PIN) {
      open_device(pin_id);
      EL('pass_inp').value = '';
      hub.dev(pin_id).granted = true;
    }
  } else {        // app
    if (hash == cfg.pin) {
      display('password', 'none');
      startup();
      EL('pass_inp').value = '';
    }
  }
}
function check_type(arg) {
  if (arg.value.length > 0) {
    let c = arg.value[arg.value.length - 1];
    if (c < '0' || c > '9') arg.value = arg.value.slice(0, -1);
  }
}
function show_keypad(v) {
  if (v) {
    display('password', 'block');
    EL('pass_inp').focus();
  } else {
    display('password', 'none');
  }
}