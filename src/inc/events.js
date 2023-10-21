// ============ CONNECTION ============
/*NON-ESP*/
hub.mqtt.onConnChange = (state) => {
  display('mqtt_ok', state ? 'inline-block' : 'none');
  mq_change(state);
}
hub.bt.onConnChange = (state) => {
  switch (state) {
    case 'connecting':
      EL('bt_device').innerHTML = 'Connecting...';
      break;

    case 'open':
      bt_change(true);
      EL('bt_device').innerHTML = hub.bt.getName();
      bt_show_ok(true);
      break;

    case 'close':
      bt_change(false);
      EL('bt_device').innerHTML = 'Not Connected';
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
  if (id == focused) hub.dev(id).post(screen);
}

// ============ DEVICES ============
hub.onSaveDevices = () => {
  save_devices();
}
hub.onAddDevice = (dev) => {
  dev.ui_mode = 0;
  dev.ui_width = 450;
  dev.ui_block_width = 450;
  add_device(dev);
}
hub.onUpdDevice = (dev) => {
  /*NON-ESP*/
  if (dev.icon.length) EL(`icon#${dev.id}`).innerHTML = dev.icon;
  /*/NON-ESP*/
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
  showPopup('Uploading... ' + perc + '%');
}
hub.onFsUploadEnd = (id, text) => {
  if (id != focused) return;
  EL('file_upload_btn').innerHTML = 'Upload';
  showPopup(text);
}
hub.onFsUploadError = (id, text) => {
  if (id != focused) return;
  EL('file_upload_btn').innerHTML = 'Upload';
  showPopupError(text);
}
// =========== FETCH FS ===========
hub.onFsFetchStart = (id, index) => {
  if (id != focused) return;
  display('download#' + index, 'none');
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
  display('open#' + index, 'inline-block');
  display('edit#' + index, 'inline-block');
  display('process#' + index, 'none');
}
hub.onFsFetchError = (id, index, text) => {
  if (id != focused) return;
  showPopupError(text);
  EL('process#' + index).innerHTML = 'Error';
}

// ============ FETCH ============
hub.onFetchStart = (id, name) => {
  if (id == focused) setPlabel(name, '[fetch...]');
}
hub.onFetchPerc = (id, name, perc) => {
  if (id == focused) setPlabel(name, `[${perc}%]`);
}
hub.onFetchEnd = (id, name, data, file) => {
  if (id != focused) return;
  switch (data.type) {
    case 'img':
      EL('#' + name).innerHTML = `<img style="width:100%" src="${file}">`;
      setPlabel(name, '');
      break;

    case 'csv':
      EL('#' + name).innerHTML = renderTable(dataTotext(file).replaceAll(/\\n/ig, "\n"), data.aligns, data.widths);
      setPlabel(name, '');
      break;

    case 'cv_img':
      data.img.src = file;
      setPlabel(name, '');
      break;
  }
}
hub.onFetchError = (id, name, data) => {
  if (id != focused) return;
  setPlabel(name, '[error]');
  switch (data.type) {
    case 'csv':
    case 'img':
      // EL('#' + name).innerHTML = 'Error';
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
  showPopup('OTA done');
  EL('ota_label').innerHTML = 'Done';
}
hub.onOtaError = (id, text) => {
  if (id != focused) return;
  showPopupError(text);
  EL('ota_label').innerHTML = 'Error';
}
hub.onOtaPerc = (id, perc) => {
  if (id != focused) return;
  EL('ota_label').innerHTML = perc + '%';
}
hub.onOtaUrlEnd = (id) => {
  if (id != focused) return;
  showPopup('OTA done');
}
hub.onOtaUrlError = (id) => {
  if (id != focused) return;
  showPopupError('OTA error');
}
// ============ SYSTEM ============
hub.onFsError = (id) => {
  if (id == focused) EL('fsbr_inner').innerHTML = '<div class="fs_err">FS ERROR</div>';
}
hub.onError = (id, text) => {
  if (id == focused) showPopupError(text);
}
hub.onAck = (id, name) => {
  if (id == focused) setPlabel(name, '');
}
hub.onUpdate = (id, name, data) => {
  if (id != focused) return;
  if (screen != 'ui') return;
  applyUpdates(name, data);
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
hub.onUi = (id, controls, conn, ip) => {
  if (id == focused) showControls(controls, false, conn, ip);
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
    showNotif(hub.dev(id).info.name + ' (' + id + '): ', text);
  }
}