function add_device(device, dev) {
  let icon = dev.icon;
  /*@[if_target:esp]*/
  if (icon.length) icon = '';
  /*@/[if_target:esp]*/
  EL('devices').innerHTML += `
  <div class="device ${device.isConnected() ? '' : 'offline'}" id="device#${dev.id}" onclick="device_h('${dev.id}')" title="${dev.id} [${dev.prefix}]">
    <div class="device_inner">
      <div id="d_head#${dev.id}" style="display:contents">
        <div class="d_icon ${icon.length ? '' : 'd_icon_empty'}"><span class="icon icon_min ${icon.length ? '' : 'd_icon_none'}" id="icon#${dev.id}">${getIcon(icon)}</span></div>
        <div class="d_title">
          <span><span class="d_name" id="name#${dev.id}">${dev.name}</span><sup class="conn_dev" id="Serial#${dev.id}">S</sup><sup class="conn_dev" id="BT#${dev.id}">B</sup><sup class="conn_dev" id="HTTP#${dev.id}">W</sup><sup class="conn_dev" id="MQTT#${dev.id}">M</sup><sup class="conn_dev" id="TG#${dev.id}">T</sup></span>
        </div>
      </div>
      <div id="d_cfg#${dev.id}" class="d_btn_cont">
        <div class="icon d_btn_red" onclick="delete_h('${dev.id}');event.stopPropagation()"></div>
        <div class="icon d_btn_green" onclick="dev_up_h('${dev.id}');event.stopPropagation()"></div>
        <div class="icon d_btn_green" onclick="dev_down_h('${dev.id}');event.stopPropagation()"></div>
      </div>
      <span class="icon d_btn_cfg" onclick="dev_cfg_h('${dev.id}');event.stopPropagation()"></span>
    </div>
  </div>`;

  EL('d_head#' + dev.id).style.display = device.cfg_flag ? 'none' : 'contents';
  EL('d_cfg#' + dev.id).style.display = device.cfg_flag ? 'flex' : 'none';
}
function render_devices() {
  EL('devices').innerHTML = '';
  for (const id of hub.getDeviceIds()) {
    const dev = hub.dev(id);
    add_device(dev, dev.info);
    for (let connection in dev.active_connections) {
      display(`${connection.name}#${dev.info.id}`, 'inline-block');
    }
  }
}
function dev_cfg_h(id) {
  let dev = hub.dev(id);
  dev.cfg_flag = !dev.cfg_flag;
  EL('d_head#' + id).style.display = dev.cfg_flag ? 'none' : 'contents';
  EL('d_cfg#' + id).style.display = dev.cfg_flag ? 'flex' : 'none';
}

// ============= UI =============
let popupT1 = null, popupT2 = null;
function showPopup(text, color = '#37a93c') {
  if (popupT1) clearTimeout(popupT1);
  if (popupT2) clearTimeout(popupT2);
  EL('notice').innerHTML = text;
  EL('notice').style.background = color;
  display('notice', 'block');
  EL('notice').style.animation = "fade-in 0.5s forwards";
  popupT1 = setTimeout(() => { popupT1 = null; display('notice', 'none'); }, 3500);
  popupT2 = setTimeout(() => { popupT2 = null; EL('notice').style.animation = "fade-out 0.5s forwards" }, 3000);
}
function showPopupError(text) {
  showPopup(text, /*getErrColor()*/'#a93737');
}
function errorBar(v) {
  EL('head_cont').style.background = v ? 'var(--err)' : 'var(--prim)';
}
function spinArrows(val) {
  if (val) EL('icon_refresh').classList.add('spinning');
  else EL('icon_refresh').classList.remove('spinning');
}
function waiter(size = 50, col = 'var(--prim)', block = true) {
  return `<div class="waiter ${block ? 'waiter_b' : ''}"><span style="font-size:${size}px;color:${col}" class="icon spinning"></span></div>`;
}

// ============= CONNECTION =============
// mqtt
function mq_change(opened) {
  display('mq_start', opened ? 'none' : 'inline-block');
  display('mq_stop', opened ? 'inline-block' : 'none');
}

// bt
function bt_show_ok(state) {
  display('bt_ok', state ? 'inline-block' : 'none');
}
function bt_change(opened) {
  display('bt_open', opened ? 'none' : 'inline-block');
  display('bt_close', opened ? 'inline-block' : 'none');
}

// serial
function serial_show_ok(state) {
  display('serial_ok', state ? 'inline-block' : 'none');
}
function serial_change(opened) {
  display('serial_open', opened ? 'none' : 'inline-block');
  display('serial_close', opened ? 'inline-block' : 'none');
}
async function serial_toggle(state) {
  serial_show_ok(false);
  serial_change(false);
  if (!state) hub.serial.close();
}

// telegram
function tg_change(opened) {
  display('tg_start', opened ? 'none' : 'inline-block');
  display('tg_stop', opened ? 'inline-block' : 'none');
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
  EL('info_version').innerHTML = '';
  EL('info_net').innerHTML = '';
  EL('info_memory').innerHTML = '';
  EL('info_system').innerHTML = '';

  for (let i in info.version) addInfo('info_version', i, info.version[i]);
  for (let i in info.net) addInfo('info_net', i, info.net[i]);
  for (let i in info.memory) {
    if (typeof (info.memory[i]) == 'object') {
      let used = info.memory[i][0];
      let total = info.memory[i][1];
      let mem = (used / 1000).toFixed(1) + ' kB';
      if (total) mem += ' [' + (used / total * 100).toFixed(0) + '%]';
      addInfo('info_memory', i, mem, `Total ${(total / 1000).toFixed(1)} kB`);
    } else {
      addInfo('info_memory', i, info.memory[i]);
    }
  }
  for (let i in info.system) {
    if (i == 'Uptime') {
      let sec = info.system[i];
      let upt = Math.floor(sec / 86400) + ':' + new Date(sec * 1000).toISOString().slice(11, 19);
      let d = new Date();
      let utc = d.getTime() - (d.getTimezoneOffset() * 60000);
      addInfo('info_system', i, upt);
      addInfo('info_system', 'Started', new Date(utc - sec * 1000).toISOString().split('.')[0].replace('T', ' '));
      continue;
    }
    addInfo('info_system', i, info.system[i]);
  }
}