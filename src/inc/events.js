// ============ CONNECTION ============
/*NON-ESP*/
hub.mqtt.onConnChange = (state) => {
  display('mqtt_ok', state ? 'inline-block' : 'none');
  mq_change(state);
}
hub.bt.onConnChange = (state) => {
  switch (state) {
    case 'connecting':
      EL('bt_device').innerHTML = lang.connecting;
      break;

    case 'open':
      bt_change(true);
      EL('bt_device').innerHTML = hub.bt.getName();
      bt_show_ok(true);
      hub.bt.discover();
      break;

    case 'close':
      bt_change(false);
      EL('bt_device').innerHTML = lang.disconnected;
      bt_show_ok(false);
      break;
  }
}
hub.serial.onConnChange = (state) => {
  serial_show_ok(state);
  serial_change(state);
  if (state) {
    setTimeout(() => hub.serial.discover(), cfg.serial_offset);
  }
}
hub.serial.onPortChange = (selected) => {
  display('serial_open', selected ? 'inline-block' : 'none');
  serial_update_name();
}
hub.tg.onConnChange = (state) => {
  display('tg_ok', state ? 'inline-block' : 'none');
  tg_change(state);
}
/*/NON-ESP*/

hub.onWsConnChange = (id, state) => {
  if (id == focused) {
    EL('conn').innerHTML = state ? 'HTTP/WS' : 'HTTP';
  }
}
hub.onDeviceConnChange = (id, state) => {
  if (id == focused) errorBar(!state);
}
hub.onWaitAnswer = (id, state) => {
  if (id == focused) spinArrows(state);
}
hub.onPingLost = (id) => {
  if (id == focused) {
    let cmd = '';
    switch (screen) {
      case 'ui': cmd = 'ui'; break;
      case 'info': cmd = 'info'; break;
      case 'files': cmd = 'files'; break;
      default: cmd = 'ping'; break;
    }
    hub.dev(id).post(cmd);
  }
}

// ============ DEVICES ============
hub.onSaveDevices = () => {
  save_devices();
}
hub.onAddDevice = (dev) => {
  dev.ui_mode = 0;
  dev.main_width = 450;
  dev.ui_block_width = 250;
  dev.plugin_css = '';
  dev.plugin_js = '';
  add_device(dev);
}
hub.onUpdDevice = (dev) => {
  EL(`name#${dev.id}`).innerHTML = dev.name ? dev.name : 'Unknown';
  EL(`device#${dev.id}`).title = `${dev.id} [${dev.prefix}]`;
}
hub.onDiscoverEnd = () => {
  if (screen == 'main') spinArrows(false);
}
hub.onDiscover = (id, conn) => {
  EL(`device#${id}`).className = "device";
  display(`${Conn.names[conn]}#${id}`, 'inline-block');
}

// ============ UPLOAD ============
hub.onFsUploadStart = (id) => {
  if (id != focused) return;
  EL('file_upload_btn').innerHTML = waiter(22, 'var(--font_inv)', false);
}
hub.onFsUploadPerc = (id, perc) => {
  if (id != focused) return;
  // EL('file_upload_btn').innerHTML = perc + '%';
  showPopup(lang.upload + '... ' + perc + '%');
}
hub.onFsUploadEnd = (id) => {
  if (id != focused) return;
  EL('file_upload_btn').innerHTML = lang.upload;
  showPopup(`[${lang.upload}] ` + lang.done);
}
hub.onFsUploadError = (id, code) => {
  if (id != focused) return;
  EL('file_upload_btn').innerHTML = lang.upload;
  showPopupError(`[${lang.upload}] ` + getError(code));
}
// =========== FETCH FS ===========
hub.onFsFetchStart = (id, index) => {
  if (id != focused) return;
  display('download#' + index, 'none');
  display('edit#' + index, 'none');
  display('open#' + index, 'none');
  display('process#' + index, 'unset');
  EL('process#' + index).innerHTML = '';
}
hub.onFsFetchPerc = (id, index, perc) => {
  if (id != focused) return;
  EL('process#' + index).innerHTML = perc + '%';
}
hub.onFsFetchEnd = (id, name, index, data) => {
  if (id != focused) return;
  display('download#' + index, 'inline-block');
  EL('download#' + index).href = ('data:' + getMime(name) + ';base64,' + data);
  EL('download#' + index).download = name;
  display('edit#' + index, 'inline-block');
  display('process#' + index, 'none');
  if (platform() != 'mobile') display('open#' + index, 'inline-block');
}
hub.onFsFetchError = (id, index, code) => {
  if (id != focused) return;
  showPopupError(`[${lang.fetch}] ` + getError(code));
  EL('process#' + index).innerHTML = lang.error;
}

// ============ FETCH ============
hub.onFetchStart = (id, name) => {
  if (id == focused) Widget.setPlabel(name, '[FETCH...]');
}
hub.onFetchPerc = (id, name, perc) => {
  if (id == focused) Widget.setPlabel(name, `[${perc}%]`);
  // console.log('Fetch ' + name + ': ' + perc + '%');
}
hub.onFetchEnd = (id, name, data, file) => {
  if (id != focused) return;
  switch (data.type) {
    case 'img':
      UiImage.apply(name, file);
      Widget.setPlabel(name);
      break;

    case 'csv':
      UiTable.apply(name, dataTotext(file).replaceAll(/\\n/ig, "\n"));
      Widget.setPlabel(name);
      break;

    case 'cv_img':
      data.img.src = file;
      Widget.setPlabel(name);
      break;

    case 'text':
      UiText_f.apply(name, dataTotext(file));
      Widget.setPlabel(name);
      break;

    case 'plugin_js':
      UiPlugin.applyScript(id, dataTotext(file));
      UiFunc.render(data.cont);
      break;

    case 'plugin_css':
      UiPlugin.applyStyle(id, dataTotext(file));
      break;

    case 'js':
      UiJS.apply(name, dataTotext(file), data.cont);
      break;

    case 'css':
      UiCSS.apply(name, dataTotext(file), data.cont);
      break;

    case 'html':
      UiHTML.apply(name, dataTotext(file));
      Widget.setPlabel(name);
      break;

    case 'icon':
      UiButton.apply(name, dataTotext(file));
      Widget.setPlabel(name);
      break;

    case 'ui_json':
      UiFile.apply(dataTotext(file), data);
      break;
  }
}
hub.onFetchError = (id, name, data, code) => {
  if (id != focused) return;
  Widget.setPlabel(name, '[ERROR]');
  switch (data.type) {
    case 'csv':
    case 'img':
      // CMP(name).innerHTML = 'Error';
      break;
  }
}

// ============ OTA ============
hub.onOtaStart = (id) => {
  if (id != focused) return;
  EL('ota_label').innerHTML = waiter(25, 'var(--font)', false);
}
hub.onOtaEnd = (id) => {
  if (id != focused) return;
  showPopup('[OTA] ' + lang.done);
  EL('ota_label').innerHTML = lang.done;
}
hub.onOtaError = (id, code) => {
  if (id != focused) return;
  showPopupError('[OTA] ' + getError(code));
  EL('ota_label').innerHTML = lang.error;
}
hub.onOtaPerc = (id, perc) => {
  if (id != focused) return;
  EL('ota_label').innerHTML = perc + '%';
}
hub.onOtaUrlEnd = (id) => {
  if (id != focused) return;
  showPopup('[OTA] ' + lang.done);
}
hub.onOtaUrlError = (id, code) => {
  if (id != focused) return;
  showPopupError('[OTA url] ' + getError(code));
}
// ============ SYSTEM ============
hub.onFsError = (id) => {
  if (id == focused) EL('fsbr_inner').innerHTML = `<div class="fs_err">FS ${lang.error}</div>`;
}
hub.onError = (id, code) => {
  if (id == focused) showPopupError(getError(code));
}
hub.onAck = (id, name) => {
  // if (id == focused) Widget.setPlabel(name);
  if (id == focused) Ack.clear(name);
}
hub.onUpdate = (id, name, data) => {
  if (id != focused) return;
  if (screen != 'ui') return;
  applyUpdate(name, data);
}
hub.onInfo = (id, info) => {
  if (id == focused) showInfo(info);
}
hub.onFsbr = (id, fs, total, used) => {
  if (id == focused) showFsbr(fs, total, used);
}
hub.onPrint = (id, text, color) => {
  if (id == focused) printCLI(text, color);
}
hub.onUi = (id, controls) => {
  if (id == focused) showControls(id, controls);
}
hub.onData = (id, data) => {
  console.log('Data from ' + id + ': ' + data);
}
hub.onAlert = (id, text) => {
  release_all();
  alert(hub.dev(id).info.name + ': ' + text);
}
hub.onNotice = (id, text, color) => {
  showPopup(hub.dev(id).info.name + ': ' + text, color);
}

let push_timer = 0;
hub.onPush = (id, text) => {
  let date = (new Date).getTime();
  if (date - push_timer > 3000) {
    push_timer = date;
    showNotif(hub.dev(id).info.name + ': ', text);
  }
}

hub.onHubError = (text) => {
  showPopupError(text);
}