// ============ CONNECTION ============
/*@[if_not_target:esp]*/
hub.mqtt.onConnChange = (state) => {
  mq_change(state === ConnectionState.CONNECTED);
}

hub.bt.onConnChange = (state) => {
  bt_change(state === ConnectionState.CONNECTED);
  switch (state) {
    case ConnectionState.CONNECTING:
      EL('bt_device').textContent = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      EL('bt_device').textContent = hub.bt.getName();
      break;

    case ConnectionState.DISCONNECTED:
      EL('bt_device').textContent = lang.disconnected;
      break;
  }
}
hub.serial.onConnChange = (state) => {
  serial_change(state === ConnectionState.CONNECTED);
  switch (state) {
    case ConnectionState.CONNECTING:
      EL('serial_device').textContent = lang.connecting;
      break;

    case ConnectionState.CONNECTED:
      EL('serial_device').textContent = hub.bt.getName();
      break;

    case ConnectionState.DISCONNECTED:
      EL('serial_device').textContent = lang.disconnected;
      break;
  }
}
hub.tg.onConnChange = (state) => {
  tg_change(state === ConnectionState.CONNECTED);
}
/*@/[if_not_target:esp]*/

// ============ DEVICES ============
hub.config.addEventListener('changed.devices', () => {
  save_cfg();
});
hub.addEventListener('deviceadded', (ev) => {  // found new device (search)
  const dev = ev.device.info;
  dev.ui_mode = 0;
  dev.main_width = 450;
  dev.ui_block_width = 250;
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
    EL(`device#${e.device.info.id}`).className = "device";
    const conn = e.device.getConnection().name;
    if (conn !== 'WS')
      display(`${conn}#${e.device.info.id}`, 'inline-block');
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

  ev.device.addEventListener('command.ack', e => {
    if (e.device.info.id == focused && renderer)
      renderer.handleAck(e.data.name);
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
