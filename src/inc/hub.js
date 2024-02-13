const hub = new GyverHub();

if (localStorage.hasOwnProperty('hub_config')) {
  hub.config.fromJson(localStorage.getItem('hub_config'));
}

hub.addConnection(HTTPConnection);
/*@[if_not_target:esp]*/
hub.addConnection(MQTTConnection);
hub.addConnection(TelegramConnection);
hub.addConnection(SerialConnection);
hub.addConnection(BLEConnection);
/*@/[if_not_target:esp]*/

// ============ CONNECTION ============
/*@[if_not_target:esp]*/
hub.addEventListener('connectionstatechange.BLE', e => {
  bt_change(e.state === ConnectionState.CONNECTED);
  switch (e.state) {
    case ConnectionState.CONNECTING:
      EL('bt_device').textContent = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      EL('bt_device').textContent = e.connection.getName();
      break;

    case ConnectionState.DISCONNECTED:
      EL('bt_device').textContent = lang.disconnected;
      break;
  }
});
hub.addEventListener('connectionstatechange.SERIAL', e => {
  serial_change(e.state === ConnectionState.CONNECTED);
  switch (e.state) {
    case ConnectionState.CONNECTING:
      EL('serial_device').textContent = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      EL('serial_device').textContent = e.connection.getName();
      break;

    case ConnectionState.DISCONNECTED:
      EL('serial_device').textContent = lang.disconnected;
      break;
  }
});
hub.addEventListener('connectionstatechange.TG', e => {
  tg_change(e.state === ConnectionState.CONNECTED);
});
hub.addEventListener('connectionstatechange.MQTT', e => {
  mq_change(e.state === ConnectionState.CONNECTED);
});
/*@/[if_not_target:esp]*/

// ============ DEVICES ============
hub.config.addEventListener('changed.devices', () => {
  save_cfg();
});
hub.addEventListener('deviceadded', (ev) => {  // found new device (search)
  const dev = ev.device.info;
  dev.main_width = 450;
  dev.plugin_css = '';
  dev.plugin_js = '';
  add_device(ev.device, dev);
});
hub.addEventListener('devicecreated', ev => {  // found new device OR requested saved device
  ev.device.addEventListener('transferstart', e => {
    if (screen !== 'main' && e.device.info.id === focused)
      spinArrows(true);
  });

  ev.device.addEventListener('transferend', e => {
    if (screen !== 'main' && e.device.info.id === focused)
      spinArrows(false);
  });

  ev.device.addEventListener('connectionchanged', e => {
    for (const $i of document.querySelectorAll('.conn_dev'))
      $i.style.display = '';

    const conn = e.device.getConnection()?.name;
    EL(`device#${e.device.info.id}`).className = conn ? "device" : 'device offline';
    if (conn && conn !== 'WS')
      display(`${conn}#${e.device.info.id}`, 'inline-block');

    if (e.device.info.id == focused)
      EL('conn').textContent = dev.getConnection().name;
  });


  ev.device.addEventListener('command.alert', e => {
    asyncAlert(e.device.info.name + ': ' + e.data.text);
  });

  ev.device.addEventListener('command.notice', e => {
    showPopup(e.device.info.name + ': ' + e.data.text, intToCol(e.data.color));
  });

  let push_timer = 0;
  ev.device.addEventListener('command.push', e => {
    let date = (new Date).getTime();
    if (date - push_timer > 3000) {
      push_timer = date;
      showNotif(e.device.info.name + ': ', e.data.text);
    }
  });

  ev.device.addEventListener('command.print', e => {
    if (e.device.info.id == focused)
      printCLI(e.data.text, e.data.color);
  });


  ev.device.addEventListener('command.files', e => {
    if (e.device.info.id == focused)
      showFsbr(e.data.fs, e.data.total, e.data.used);
  });


  ev.device.addEventListener('command.ui', e => {
    if (e.device.info.id == focused && e.data.controls)
      showControls(focused, e.data.controls);
  });

  ev.device.addEventListener('command.script', e => {
    if (e.device.info.trust)
      eval(e.data.script);
    else 
      showPopupError('Script from device was blocked!');
  });

  ev.device.addEventListener('command.error', e => {
    if (e.device.info.id == focused)
      showPopupError(getError(e.data.code));
  });
  ev.device.addEventListener('command.fs_err', () => {
    if (e.device.info.id == focused)
      EL('fsbr_inner').innerHTML = `<div class="fs_err">FS ${lang.error}</div>`;
  });

  ev.device.addEventListener('update', e => {
    if (e.device.info.id == focused && screen == 'ui' && renderer)
      renderer.handleUpdate(e.name, e.data);
  });
});
hub.addEventListener('deviceinfochanged', ev => {
  const dev = ev.device.info;
  EL(`name#${dev.id}`).textContent = dev.name ? dev.name : 'Unknown';
  EL(`device#${dev.id}`).title = `${dev.id} [${dev.prefix}]`;
});
hub.addEventListener('discoverfinished', () => {
  if (screen == 'main') spinArrows(false);
});
hub.addEventListener('protocolerror', ev => {
  showPopupError(ev.text);
});
