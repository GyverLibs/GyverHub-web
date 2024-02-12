// =========== MISC ===========
function add_device(device, dev) {
  const icon = dev.icon;
  /*@[if_target:esp]*/
  if (icon.length) icon = '';
  /*@/[if_target:esp]*/
  EL('devices').innerHTML += `
  <div class="device ${device.isConnected() ? '' : 'offline'}" id="device#${dev.id}" onclick="device_h('${dev.id}')" title="${dev.id} [${dev.prefix}]">
    <div id="d_head#${dev.id}">
      <div class="d_icon">
        <span class="icon icon_min" id="icon#${dev.id}">${getIcon(icon) ?? ''}</span>
      </div>
      <div class="d_title">
        <span class="d_name" id="name#${dev.id}">${dev.name}</span><sup class="conn_dev" id="SERIAL#${dev.id}">S</sup><sup class="conn_dev" id="BLE#${dev.id}">B</sup><sup class="conn_dev" id="HTTP#${dev.id}">W</sup><sup class="conn_dev" id="MQTT#${dev.id}">M</sup><sup class="conn_dev" id="TG#${dev.id}">T</sup>
      </div>
    </div>
    <div id="d_cfg#${dev.id}" class="d_btn_cont">
      <div class="icon d_btn_red" onclick="delete_h('${dev.id}');event.stopPropagation()"></div>
      <div class="icon d_btn_green" onclick="dev_up_h('${dev.id}');event.stopPropagation()"></div>
      <div class="icon d_btn_green" onclick="dev_down_h('${dev.id}');event.stopPropagation()"></div>
    </div>
    <span class="icon d_btn_cfg" onclick="dev_cfg_h('${dev.id}');event.stopPropagation()"></span>
  </div>`;

  EL('d_head#' + dev.id).style.display = device.cfg_flag ? 'none' : 'flex';
  EL('d_cfg#' + dev.id).style.display = device.cfg_flag ? 'flex' : 'none';
}
function render_devices() {
  EL('devices').replaceChildren();
  for (const id of hub.getDeviceIds()) {
    const dev = hub.dev(id);
    add_device(dev, dev.info);
    for (let connection in dev.active_connections) {
      display(`${connection.name}#${dev.info.id}`, 'inline-block');
    }
  }
}
function dev_cfg_h(id) {
  const dev = hub.dev(id);
  dev.cfg_flag = !dev.cfg_flag;
  EL('d_head#' + id).style.display = dev.cfg_flag ? 'none' : 'flex';
  EL('d_cfg#' + id).style.display = dev.cfg_flag ? 'flex' : 'none';
}

// ============= UI =============
function errorBar(v) {
  EL('head_cont').style.background = v ? 'var(--err)' : 'var(--prim)';
}
function spinArrows(val) {
  if (val) EL('icon_refresh').classList.add('spinning');
  else EL('icon_refresh').classList.remove('spinning');
}
// ============= CONNECTION =============
// mqtt
function mq_change(opened) {
  display('mq_start', opened ? 'none' : 'inline-block');
  display('mq_stop', opened ? 'inline-block' : 'none');
  display('mqtt_ok', opened ? 'inline-block' : 'none');
}

// bt
function bt_change(opened) {
  display('bt_open', opened ? 'none' : 'inline-block');
  display('bt_close', opened ? 'inline-block' : 'none');
  display('bt_ok', opened ? 'inline-block' : 'none');
}

// serial
function serial_change(opened) {
  display('serial_open', opened ? 'none' : 'inline-block');
  display('serial_close', opened ? 'inline-block' : 'none');
  display('serial_ok', opened ? 'inline-block' : 'none');
}

// telegram
function tg_change(opened) {
  display('tg_start', opened ? 'none' : 'inline-block');
  display('tg_stop', opened ? 'inline-block' : 'none');
  display('tg_ok', opened ? 'inline-block' : 'none');
}

// ============= INFO =============
function showInfo(info) {
  function addInfo(el, label, value, title = '') {
    EL(el).innerHTML += `
    <div class="ui_row info">
      <label>${label}</label>
      <label title="${title}" class="info_label">${value}</label>
    </div>`;
  }
  EL('info_version').replaceChildren();
  EL('info_net').replaceChildren();
  EL('info_memory').replaceChildren();
  EL('info_system').replaceChildren();

  for (const i in info.version) addInfo('info_version', i, info.version[i]);
  for (const i in info.net) addInfo('info_net', i, info.net[i]);
  for (const i in info.memory) {
    if (typeof (info.memory[i]) == 'object') {
      const used = info.memory[i][0];
      const total = info.memory[i][1];
      const mem = (used / 1000).toFixed(1) + ' kB';
      if (total) mem += ' [' + (used / total * 100).toFixed(0) + '%]';
      addInfo('info_memory', i, mem, `Total ${(total / 1000).toFixed(1)} kB`);
    } else {
      addInfo('info_memory', i, info.memory[i]);
    }
  }
  for (const i in info.system) {
    if (i == 'Uptime') {
      const sec = info.system[i];
      const upt = Math.floor(sec / 86400) + ':' + new Date(sec * 1000).toISOString().slice(11, 19);
      const d = new Date();
      const utc = d.getTime() - (d.getTimezoneOffset() * 60000);
      addInfo('info_system', i, upt);
      addInfo('info_system', 'Started', new Date(utc - sec * 1000).toISOString().split('.')[0].replace('T', ' '));
      continue;
    }
    addInfo('info_system', i, info.system[i]);
  }
}