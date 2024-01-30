// ============ CONNECTION ============
/*@[if_not_target:esp]*/
hub.mqtt.onConnChange = (state) => {
  display('mqtt_ok', state ? 'inline-block' : 'none');
  mq_change(state);
}
hub.bt.onConnChange = (state) => {
  switch (state) {
    case ConnectionState.CONNECTING:
      EL('bt_device').innerHTML = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      bt_change(true);
      EL('bt_device').innerHTML = hub.bt.getName();
      bt_show_ok(true);
      hub.bt.discover();
      break;

    case ConnectionState.DISCONNECTED:
      bt_change(false);
      EL('bt_device').innerHTML = lang.disconnected;
      bt_show_ok(false);
      break;
  }
}
hub.serial.onConnChange = (state) => {
  switch (state) {
    case ConnectionState.CONNECTING:
      EL('serial_device').innerHTML = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      serial_change(true);
      EL('serial_device').innerHTML = hub.bt.getName();
      serial_show_ok(true);
      if (state) {
        setTimeout(() => hub.serial.discover(), cfg.serial_offset);
      }
      break;

    case ConnectionState.DISCONNECTED:
      serial_change(false);
      EL('serial_device').innerHTML = lang.disconnected;
      serial_show_ok(false);
      break;
  }
}
hub.tg.onConnChange = (state) => {
  display('tg_ok', state ? 'inline-block' : 'none');
  tg_change(state);
}
/*@/[if_not_target:esp]*/

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
hub.config.addEventListener('changed.devices', () => {
  save_devices();
});
hub.addEventListener('deviceadded', (ev) => {
  const dev = ev.device.info;
  dev.ui_mode = 0;
  dev.main_width = 450;
  dev.ui_block_width = 250;
  dev.plugin_css = '';
  dev.plugin_js = '';
  add_device(ev.device, dev);
});
hub.addEventListener('devicecreated', ev => {
  ev.device.addEventListener('asynccommand.alert', ev => {

  });
  ev.device.addEventListener('asynccommand.notice', ev => {

  });
  ev.device.addEventListener('asynccommand.push', ev => {

  });
  ev.device.addEventListener('asynccommand.cli', ev => {

  });

  ev.device.addEventListener('asynccommand.ui', ev => {

  });
  ev.device.addEventListener('asynccommand.files', ev => {

  });
  ev.device.addEventListener('asynccommand.update', ev => {

  });
  ev.device.addEventListener('asynccommand.ack', ev => {

  });
  ev.device.addEventListener('error', ev => {

  });
  ev.device.addEventListener('infochanged', ev => {

  });
  ev.device.addEventListener('connectionchanged', ev => {

  });
});
hub.addEventListener('deviceinfochanged', (ev) => {
  const dev = ev.device.info;
  EL(`name#${dev.id}`).innerHTML = dev.name ? dev.name : 'Unknown';
  EL(`device#${dev.id}`).title = `${dev.id} [${dev.prefix}]`;
});
hub.addEventListener('discoverfinished', () => {
  if (screen == 'main') spinArrows(false);
});
hub.onDiscover = (id, conn) => {
  EL(`device#${id}`).className = "device";
  display(`${conn.name}#${id}`, 'inline-block');
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
hub.onFsbr = (id, fs, total, used) => {
  if (id == focused) showFsbr(fs, total, used);
}
hub.onPrint = (id, text, color) => {
  if (id == focused) printCLI(text, color);
}
hub.onUi = (id, controls) => {
  if (id == focused) showControls(id, controls);
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