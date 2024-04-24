// =========== MISC ===========
function add_device(device, dev) {
  let icon = dev.icon;
  /*@[if_target:esp]*/
  if (icon.length) icon = '';
  /*@/[if_target:esp]*/
  EL('devices').innerHTML += `
  <div class="device ${device.isConnected() ? '' : 'offline'}" id="device#${dev.id}" onclick="device_h('${dev.id}')" title="${dev.id} [${dev.prefix}]">
    <div id="d_head#${dev.id}">
      <div class="dev-icon">
        <span class="icon icon-min" id="icon#${dev.id}">${getIcon(icon)}</span>
      </div>
      <div class="dev-title">
        <span class="dev-name" id="name#${dev.id}">${dev.name}</span><sup class="dev-conn" id="SERIAL#${dev.id}">S</sup><sup class="dev-conn" id="BLE#${dev.id}">B</sup><sup class="dev-conn" id="HTTP#${dev.id}">W</sup><sup class="dev-conn" id="MQTT#${dev.id}">M</sup><sup class="dev-conn" id="TG#${dev.id}">T</sup>
      </div>
    </div>
    <div id="d_cfg#${dev.id}" class="dev-btn-cont">
      <div class="icon dev-btn-red" onclick="delete_h('${dev.id}');event.stopPropagation()"></div>
      <div class="icon dev-btn-green" onclick="dev_up_h('${dev.id}');event.stopPropagation()"></div>
      <div class="icon dev-btn-green" onclick="dev_down_h('${dev.id}');event.stopPropagation()"></div>
    </div>
    <span class="icon dev-btn-cfg" onclick="dev_cfg_h('${dev.id}');event.stopPropagation()"></span>
  </div>`;

  EL('d_head#' + dev.id).style.display = device.cfg_flag ? 'none' : 'flex';
  EL('d_cfg#' + dev.id).style.display = device.cfg_flag ? 'flex' : 'none';
}
function render_devices() {
  EL('devices').replaceChildren();
  for (const id of hub.getDeviceIds()) {
    const dev = hub.dev(id);
    add_device(dev, dev.info);
    for (let connection of dev.active_connections) {
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
  if (v) document.body.classList.add('connection-error');
  else document.body.classList.remove('connection-error');
}
function spinArrows(val) {
  if (val) EL('icon-refresh').classList.add('spinning');
  else EL('icon-refresh').classList.remove('spinning');
}
// ============= CONNECTION =============
// mqtt
function mq_change(opened) {
  display('mq_start', opened ? 'none' : 'inline-block');
  display('mq_stop', opened ? 'inline-block' : 'none');
  display('mqtt_ok', opened ? 'block' : 'none');
}

// bt
function bt_change(opened) {
  display('bt_open', opened ? 'none' : 'inline-block');
  display('bt_close', opened ? 'inline-block' : 'none');
  display('bt_ok', opened ? 'block' : 'none');
}

// serial
function serial_change(opened) {
  display('serial_open', opened ? 'none' : 'inline-block');
  display('serial_close', opened ? 'inline-block' : 'none');
  display('serial_ok', opened ? 'block' : 'none');
}

// telegram
function tg_change(opened) {
  display('tg_start', opened ? 'none' : 'inline-block');
  display('tg_stop', opened ? 'inline-block' : 'none');
  display('tg_ok', opened ? 'block' : 'none');
}

// ============= INFO =============
function showInfo(info) {
  function addInfo(el, label, value, title = '') {
    EL(el).innerHTML += `
    <div class="ui-row info">
      <label>${label}</label>
      <label title="${title}" class="info-label">${value}</label>
    </div>`;
  }
  EL('info_version').replaceChildren();
  EL('info_net').replaceChildren();
  EL('info_memory').replaceChildren();
  EL('info_system').replaceChildren();

  for (const i in info.version) addInfo('info_version', i, info.version[i]);
  for (const i in info.net) addInfo('info_net', i, info.net[i]);
  for (const i in info.memory) {
    if (typeof (info.memory[i]) === 'object') {
      const used = info.memory[i][0];
      const total = info.memory[i][1];
      let mem = (used / 1024).toFixed(1) + ' KiB';
      let title = used;
      if (total) {
        mem += ' [' + (used / total * 100).toFixed(0) + '%]';
        title += ' of ' + total;
      }
      addInfo('info_memory', i, mem, `Used ${title} bytes`);
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

function renderBody() {
  document.body.innerHTML += `
  <div id="plugins"></div>
  <div id="app_plugins"></div>
  <div id="test_plugins"></div>
  <div id="widget_styles"></div>

  <div class="header-row">
    <div class="header">
      <div class="icon header-back" data-action="back"></div>
      <div class="header-title" data-action="back">GyverHub</div>

      <div id="conn" class="header-connection"></div>
      <div id='bt_ok' class="icon header-connection-icon"></div>
      <div id='mqtt_ok' class="icon header-connection-icon"></div>
      <div id='serial_ok' class="icon header-connection-icon"></div>
      <div id='tg_ok' class="icon header-connection-icon"></div>

      <div class="header-connections"></div>
      <div class="icon header-icon icon-refresh" id='icon-refresh' data-action="refresh"></div>
      <div class="icon header-icon icon-cfg" data-action="config"></div>
      <div class="icon header-icon icon-menu" id='icon-menu' data-action="menu"></div>
    </div>
  </div>

  <div class="main">
    <div id="menu_overlay" onclick="menu_show(0)"></div>
    <div id="menu" class="main-col menu"></div>
  
    <div class="main-inner">

      <div class="main-col screen-plugins">
        <div id="my_plugins"></div>
        <div id="plugins_cont"></div>
      </div>

      <div class="main-col screen-test">
        <div id="test_container" class=""></div>
        <br>
        <div class="ui-col">
          <div class="ui-inpbtn-row">
            <input id="test_controls" class="ui-inp ui-inp-w-btn" type="text" value="" placeholder='{"value":50}'>
            <button onclick="testbuild_h()" class="ui-btn upl-btn">Build</button>
          </div>
          <div class="ui-inpbtn-row">
            <input id="test_updates" class="ui-inp ui-inp-w-btn" type="text" value="" placeholder='{"value":50}'>
            <button onclick="testupdate_h()" class="ui-btn upl-btn">Update</button>
          </div>
          <div class="ui-row-btn">
            <label>Out:&nbsp</label><label id="test_out"></label>
          </div>
        </div>
        <div class="ui-col">
          <div class="ui-row test-tabs"><label>JS</label></div>
          <div class="ui-row"><textarea id="test_js" rows="40" class="ui-inp ui-area ui-area-wrap"></textarea></div>
        </div>
      </div>

      <div id="projects_cont" class="main-col screen-projects">
        <div class="proj">
          <div class="proj-name">
            <a href="https://github.com/GyverLibs/GyverHub-projects" target="_blank">+ <slot name="lang.p_add_project"></slot></a>
          </div>
        </div>
      </div>

      <div id="devices" class="main-col screen-main"></div>
      <div id="controls" class="main-col screen-ui"></div>
  
      <div class="main-col screen-dev_config">
        <div class="ui-col">
  
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_settings"></slot></label>
          </div>
  
          <div class="ui-row">
            <label><slot name="lang.i_console"></slot></label>
            <label class="switch"><input type="checkbox" id="info_cli_sw" onchange="showCLI(this.checked);save_cfg()">
              <span class="slider"></span></label>
          </div>
  
          <div class="ui-row">
            <label><slot name="lang.i_trust"></slot></label>
            <label class="switch"><input type="checkbox" id="info_trust" onchange="trust_dev_h()">
              <span class="slider"></span></label>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.i_main"></slot></label>
            <div class="ui-inp-row">
              <input class="ui-inp" type="text" id="main_width" onchange="ui_width_h(this)">
            </div>
          </div>

          <hr>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.i_ui"></slot></label>
            <button class="icon icon-btn-big" onclick="ui_custom_ui_h()"></button>
          </div>

          <div class="ui-row">
            <label class="ui-label"><slot name="lang.i_css"></slot></label>
            <button class="icon icon-btn-big" onclick="ui_custom_css_h()"></button>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.i_js"></slot></label>
            <button class="icon icon-btn-big" onclick="ui_custom_js_h()"></button>
          </div>

          <hr>
  
          <div class="ui-row-btn">
            <button id="reboot_btn" class="ui-btn ui-btn-mini" onclick="reboot_h()"><span class="icon i-inline"></span><slot name="lang.i_reboot"></slot></button>
            <!--@[if_not_target:esp]-->
            <button class="ui-btn ui-btn-mini" onclick="devlink_h()"><span class="icon i-inline"></span><slot name="lang.i_link"></slot></button>
            <button class="ui-btn ui-btn-mini" onclick="qr_h()"><span class="icon i-inline"></span>QR</button>
            <!--@/[if_not_target:esp]-->
          </div>
  
        </div>

        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.plugins"></slot></label>
          </div>

          <div class="ui-row">
            <div id="device_plugins"></div>
          </div>
        </div>
      </div>
  
      <div class="main-col screen-info">
  
        <div class="ui-col" id="info_topics">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_topics"></slot></label>
          </div>
          <div class="ui-row info">
            <label>ID</label>
            <label id="info_id" class="info-label info-label-small">-</label>
          </div>
          <div class="ui-row info">
            <label>Set</label>
            <label id="info_set" class="info-label info-label-small">-</label>
          </div>
          <div class="ui-row info">
            <label>Read</label>
            <label id="info_read" class="info-label info-label-small">-</label>
          </div>
          <div class="ui-row info">
            <label>Get</label>
            <label id="info_get" class="info-label info-label-small">-</label>
          </div>
          <div class="ui-row info">
            <label>Status</label>
            <label id="info_status" class="info-label info-label-small">-</label>
          </div>
        </div>
  
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_system"></slot></label>
          </div>
          <div id="info_system"></div>
        </div>
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_net"></slot></label>
          </div>
          <div id="info_net"></div>
        </div>
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_memory"></slot></label>
          </div>
          <div id="info_memory"></div>
        </div>
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.i_version"></slot></label>
          </div>
          <div id="info_version"></div>
        </div>
      </div>
  
      <div class="main-col screen-fsbr_edit">
        <div class="ui-col">
  
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span>Editor</label>
          </div>
  
          <div class="ui-row">
            <label id="edit_path"></label>
          </div>
  
          <div class="ui-row">
            <label><slot name="lang.fs_wrap"></slot></label>
            <label class="switch">
              <input type="checkbox" id="editor_wrap" onchange="this.checked?editor_area.classList.remove('ui-area-wrap'):editor_area.classList.add('ui-area-wrap')">
              <span class="slider"></span>
            </label>
          </div>
  
          <div class="ui-row">
            <textarea rows=20 id="editor_area" class="ui-inp ui-area ui-area-wrap"></textarea>
          </div>
  
          <div class="ui-row">
            <button id="editor_save" onclick="editor_save()" class="ui-btn ui-btn-mini"><slot name="lang.fs_save"></slot></button>
            <button onclick="editor_cancel()" class="ui-btn ui-btn-mini"><slot name="lang.cancel"></slot></button>
          </div>
  
        </div>
      </div>
  
      <div class="main-col screen-files">
  
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span><slot name="lang.fs_fsbr"></slot></label>
          </div>
          <div id="fs_browser">
            <div id="fsbr_inner"></div>
            <div class="ui-row-btn">
              <button id="fs_format" onclick="format_h()" class="ui-btn ui-btn-mini"><slot name="lang.fs_format"></slot></button>
              <button id="fs_create" onclick="create_h()" class="ui-btn ui-btn-mini"><slot name="lang.fs_create"></slot></button>
              <button id="fs_upload" onclick="upload_h()" class="ui-btn ui-btn-mini"><slot name="lang.fs_upload"></slot></button>
            </div>
          </div>
        </div>
      </div>
  
      <div class="main-col screen-ota">
  
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span>OTA FILE</label>
          </div>
          <div id="fs_otaf">
            <div class="ui-row">
              <div>
                <input type="file" id="ota_upload" style="display:none" onchange="uploadOta(this.files[0], 'flash')">
                <button onclick="ota_upload.click()" class="ui-btn ui-btn-mini drop-area" ondrop="uploadOta(event.dataTransfer.files[0], 'flash')">Flash</button>
                <input type="file" id="ota_upload_fs" style="display:none" onchange="uploadOta(this.files[0], 'fs')">
                <button onclick="ota_upload_fs.click()" class="ui-btn ui-btn-mini drop-area" ondrop="uploadOta(event.dataTransfer.files[0], 'fs')">Filesystem</button>
              </div>
              <label style="font-size:18px" id="ota_label"></label>
            </div>
          </div>
        </div>
  
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label><span class="icon icon-ui"></span>OTA URL</label>
          </div>
          <div id="fs_otaurl">
            <div class="ui-inpbtn-row">
              <input class="ui-inp ui-inp-w-btn" type="text" id="ota_url_f">
              <button id="ota_url_btn" onclick="otaUrl(ota_url_f.value,'flash')" class="ui-btn upl-btn">Flash</button>
            </div>
            <div class="ui-inpbtn-row">
              <input class="ui-inp ui-inp-w-btn" type="text" id="ota_url_fs">
              <button id="ota_url_btn" onclick="otaUrl(ota_url_fs.value,'fs')" class="ui-btn upl-btn">FS</button>
            </div>
          </div>
        </div>
  
      </div>
  
      <div class="main-col screen-config">
  
        <div class="ui-col">
          <div class="ui-row ui-head ui-tab" onclick="use_local.click()">
            <label class="ui-label ui-tab" id="local_label"><span class="icon icon-ui"></span>WiFi</label>
            <input type="checkbox" id="use_local" data-hub-config="connections.HTTP.enabled" onchange="update_cfg(this);save_cfg()" style="display:none">
          </div>
          <div id="local_block" style="display:none">
            <div class="ui-row" id="http_only_http" style="display:none">
              <span style="color:#c60000">Works only on <strong class="span-btn" onclick="window.location.href = window.location.href.replace('https', 'http')">HTTP</strong>!</span>
            </div>
  
            <div id="http_settings">            
              <div class="ui-row">
                <label class="ui-label"><slot name="lang.wifi_ip"></slot></label>
                <div class="ui-inp-row">
                  <input class="ui-inp" type="text" id="local_ip" data-hub-config="connections.HTTP.local_ip" onchange="update_cfg(this)">
                  <div class="btn-inp-block">
                    <button class="icon icon-btn" onclick="update_ip_h();update_cfg(EL('local_ip'))"></button>
                  </div>
                </div>
              </div>
  
              <div class="ui-row">
                <label><slot name="lang.wifi_mask"></slot></label>
                <div class="ui-inp-row">
                  <select class="ui-inp ui-select" id="netmask" data-hub-config="connections.HTTP.netmask" onchange="update_cfg(this)"></select>
                </div>
              </div>
  
              <div class="ui-row">
                <label><slot name="lang.wifi_port"></slot></label>
                <div class="ui-inp-row"><input class="ui-inp" type="text" id="http_port" data-hub-config="connections.HTTP.port" onchange="update_cfg(this)">
                </div>
              </div>
    
              <!--@[if_target:host,esp]-->
              <span class="notice-block">Disable:
                <u><slot name="browser"></slot>://flags/#block-insecure-private-network-requests</u></span>
              <!--@/[if_target:host,esp]-->

              <hr>

              <div class="ui-row">
                <label class="ui-label"><slot name="lang.wifi_add"></slot></label>
                <div class="ui-inp-row">
                  <input class="ui-inp" type="text" value="192.168.1.1" id="local_add_ip">
                  <div class="btn-inp-block">
                    <button class="icon icon-btn" onclick="manual_ip_h(local_add_ip.value)"></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!--@[if_not_target:esp]-->
        <div class="ui-col" id="mq_col">
          <div class="ui-row ui-head ui-tab" onclick="use_mqtt.click()">
            <label class="ui-label ui-tab" id="mqtt_label"><span class="icon icon-ui"></span>MQTT</label>
            <input type="checkbox" id="use_mqtt" data-hub-config="connections.MQTT.enabled" onchange="update_cfg(this);hub.mqtt.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="mq_block" style="display:none">
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.mq_host"></slot></label>
              <div class="ui-inp-row"><input class="ui-inp" type="text" id="mq_host" data-hub-config="connections.MQTT.host" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.mq_port"></slot></label>
              <div class="ui-inp-row"><input class="ui-inp" type="number" id="mq_port" data-hub-config="connections.MQTT.port" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.mq_login"></slot></label>
              <div class="ui-inp-row"><input class="ui-inp" type="text" id="mq_login" data-hub-config="connections.MQTT.login" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.mq_pass"></slot></label>
              <div class="ui-inp-row"><input class="ui-inp" type="password" id="mq_pass" data-hub-config="connections.MQTT.password" onchange="update_cfg(this);hub.mqtt.disconnect()">
              </div>
            </div>
            <hr>
            <div class="ui-row-btn">
              <button class="ui-btn ui-btn-mini" onclick="hub.mqtt.connect()" id="mq_start"><slot name="lang.connect"></slot></button>
              <button class="ui-btn ui-btn-mini" onclick="hub.mqtt.disconnect()" id="mq_stop" style="display:none"><slot name="lang.disconnect"></slot></button>
            </div>
  
          </div>
        </div>
  
        <div class="ui-col" id="tg_col">
  
          <div class="ui-row ui-head ui-tab" onclick="use_tg.click()">
            <label class="ui-label ui-tab" id="tg_label"><span class="icon icon-ui"></span>Telegram</label>
            <input type="checkbox" id="use_tg" data-hub-config="connections.TG.enabled" onchange="update_cfg(this);hub.tg.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="tg_block" style="display:none">
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.tg_token"></slot></label>
              <div class="ui-inp-row">
                <input class="ui-inp" type="text" id="tg_token" data-hub-config="connections.TG.token" onchange="update_cfg(this);hub.tg.disconnect()">
              </div>
            </div>
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.tg_chat"></slot></label>
              <div class="ui-inp-row">
                <input class="ui-inp" type="text" id="tg_chat" data-hub-config="connections.TG.chat" onchange="update_cfg(this)">
              </div>
            </div>
            <hr>
            <div class="ui-row-btn">
              <button class="ui-btn ui-btn-mini" onclick="hub.tg.connect()" id="tg_start"><slot name="lang.connect"></slot></button>
              <button class="ui-btn ui-btn-mini" onclick="hub.tg.disconnect()" id="tg_stop" style="display:none"><slot name="lang.disconnect"></slot></button>
            </div>
          </div>
        </div>
  
        <div class="ui-col" id="serial_col">
          <div class="ui-row ui-head ui-tab" onclick="use_serial.click()">
            <label class="ui-label ui-tab" id="serial_label"><span class="icon icon-ui"></span>Serial</label>
            <input type="checkbox" id="use_serial" data-hub-config="connections.SERIAL.enabled" onchange="update_cfg(this);hub.serial.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="serial_block" style="display:none">
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.sr_baud"></slot></label>
              <div class="ui-inp-row">
                <select class="ui-inp ui-select" id='baudrate' data-hub-config="connections.SERIAL.baudrate" onchange="update_cfg(this)">
                  <option value="4800">4800</option>
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="74880">74880</option>
                  <option value="115200">115200</option>
                  <option value="230400">230400</option>
                  <option value="250000">250000</option>
                  <option value="500000">500000</option>
                  <option value="1000000">1000000</option>
                  <option value="2000000">2000000</option>
                </select>
              </div>
            </div>
  
            <div class="ui-row">
              <label class="ui-label"><slot name="lang.sr_offset"></slot></label>
              <div class="ui-inp-row"><input class="ui-inp" type="text" id="serial_offset" data-hub-config="connections.SERIAL.offset" onchange="update_cfg(this)">
              </div>
            </div>
            <hr>
            <div class="ui-row">
              <div><label class="ui-label" id="serial_device"><slot name="lang.not_conn"></slot></label> <label class="ui-label" id="port_name"></label></div>
              <div class="ui-row-btn">
                <button class="ui-btn ui-btn-mini" onclick="hub.serial.select()"><slot name="lang.select"></slot></button>
                <button id="serial_open" class="ui-btn ui-btn-mini" onclick="hub.serial.connect()" style="display:none"><slot name="lang.connect"></slot></button>
                <button id="serial_close" class="ui-btn ui-btn-mini" onclick="hub.serial.disconnect()" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
  
          </div>
        </div>
  
        <div class="ui-col" id="bt_col">
          <div class="ui-row ui-head ui-tab" onclick="use_bt.click()">
            <label class="ui-label ui-tab" id="bt_label"><span class="icon icon-ui"></span>Bluetooth</label>
            <input type="checkbox" id="use_bt" data-hub-config="connections.BLE.enabled" onchange="update_cfg(this);save_cfg()" style="display:none">
          </div>
  
          <div id="bt_block" style="display:none">
            <div class="ui-row">
              <label class="ui-label" id="bt_device"><slot name="lang.not_conn"></slot></label>
              <div class="ui-row-btn">
                <button class="ui-btn ui-btn-mini" onclick="hub.bt.select()"><slot name="lang.select"></slot></button>
                <button id="bt_open" class="ui-btn ui-btn-mini" onclick="hub.bt.connect()" style="display:none"><slot name="lang.connect"></slot></button>
                <button id="bt_close" class="ui-btn ui-btn-mini" onclick="hub.bt.disconnect()" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
          </div>
  
        </div>
        <!--@/[if_not_target:esp]-->
  
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label class="ui-label"><span class="icon icon-ui"></span><slot name="lang.cfg_search"></slot></label>
          </div>

          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_prefix"></slot></label>
            <div class="ui-inp-row">
              <input class="ui-inp" type="text" id="prefix" data-hub-config="hub.prefix" onchange="update_cfg(this)">
            </div>
          </div>

          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_add"></slot></label>
            <div class="ui-inp-row">
              <input class="ui-inp" type="text" value="device_id" id="add_by_id">
              <div class="btn-inp-block">
                <button class="icon icon-btn" onclick="manual_id_h(add_by_id.value)"></button>
              </div>
            </div>
          </div>

          <hr>

          <div class="ui-row-btn">
            <button class="ui-btn ui-btn-mini" onclick="search()"><slot name="lang.cfg_find_dev"></slot></button>
          </div>
        </div>

        <div class="ui-col">
          <div class="ui-row ui-head">
            <label class="ui-label"><span class="icon icon-ui"></span><slot name="lang.cfg_sett"></slot></label>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_id"></slot></label>
            <div class="ui-inp-row">
              <input class="ui-inp" type="text" id="client_id" data-hub-config="hub.client_id" onchange="update_cfg(this)" oninput="client_inp_h(this)">
            </div>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_theme"></slot></label>
            <div class="ui-inp-row">
              <select class="ui-inp ui-select" id='theme' onchange="update_cfg(this)">
                <option value="auto"></option>
                <option value="dark"></option>
                <option value="light"></option>
              </select>
            </div>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_color"></slot></label>
            <div class="ui-inp-row">
              <select class="ui-inp ui-select" id='maincolor' onchange="update_cfg(this)">
                <option value="ORANGE"></option>
                <option value="YELLOW"></option>
                <option value="GREEN"></option>
                <option value="MINT"></option>
                <option value="AQUA"></option>
                <option value="BLUE"></option>
                <option value="VIOLET"></option>
                <option value="PINK"></option>
              </select>
            </div>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_font"></slot></label>
            <div class="ui-inp-row">
              <select class="ui-inp ui-select" id='font' onchange="update_cfg(this)">
                <option value="monospace">monospace</option>
                <option value="system-ui">system-ui</option>
                <option value="cursive">cursive</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Georgia">Georgia</option>
                <option value="Garamond">Garamond</option>
              </select>
            </div>
          </div>
  
          <div class="ui-row">
            <label class="ui-label">Language</label>
            <div class="ui-inp-row">
              <select class="ui-inp ui-select" id='lang' onchange="update_cfg(this);save_cfg();location.reload()">
                <option value="English">English</option>
                <option value="Russian">Russian</option>
              </select>
            </div>
          </div>
  
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_width"></slot></label>
            <div class="ui-inp-row">
              <input class="ui-inp" type="text" id="ui_width" onchange="update_cfg(this)">
            </div>
          </div>

          <hr>
  
          <div class="ui-row">
            <label><slot name="lang.cfg_wide_mode"></slot></label>
            <label class="switch"><input type="checkbox" id="wide_mode" onchange="update_cfg(this)"><span class="slider"></span></label>
          </div>
          <div class="ui-row">
            <label><slot name="lang.cfg_updates"></slot></label>
            <label class="switch"><input type="checkbox" id="check_upd" onchange="update_cfg(this)"><span class="slider"></span></label>
          </div>

          <hr>

          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_css"></slot></label>
            <button class="icon icon-btn-big" onclick="app_custom_css()"></button>
          </div>
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_js"></slot></label>
            <button class="icon icon-btn-big" onclick="app_custom_js()"></button>
          </div>
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_proj"></slot></label>
            <button class="icon icon-btn-big" onclick="project_links()"></button>
          </div>
          <div class="ui-row">
            <label class="ui-label"><slot name="lang.cfg_plugin"></slot></label>
            <button class="icon icon-btn-big" onclick="plugin_links()"></button>
          </div>

          <hr>
  
          <div class="ui-row-btn">
            <button class="ui-btn ui-btn-mini" onclick="cfg_export()"><slot name="lang.cfg_export"></slot></button>
            <button class="ui-btn ui-btn-mini" onclick="cfg_import()"><slot name="lang.cfg_import"></slot></button>
            <button class="ui-btn ui-btn-mini" onclick="cfg_reset()"><slot name="lang.cfg_reset"></slot></button>
          </div>
  
        </div>
  
        <div class="ui-col">
          <div class="ui-row ui-head ui-tab" onclick="use_pin.click()">
            <label id="pin_label" class="ui-label ui-tab"><span class="icon icon-ui"></span>PIN</label>
            <input type="checkbox" id="use_pin" onchange="update_cfg(this)" style="display:none">
          </div>
  
          <div id="pin_block" style="display:none">
            <div class="ui-row">
              <label class="ui-label">PIN</label>
              <div class="ui-inp-row"><input class="ui-inp" type="password" pattern="[0-9]*" inputmode="numeric" id="pin" onchange="make_pin(this);update_cfg(this)" oninput="check_type(this)">
              </div>
            </div>
          </div>
  
        </div>
  
        <!--@[if_target:host]-->
        <div class="ui-col">
          <div class="ui-row ui-head">
            <label class="ui-label"><span class="icon icon-ui"></span>App</label>
            <div class="ui-row-btn">
              <button class="ui-btn ui-btn-mini" onclick="openURL('https://github.com/neko-neko-nyan/gyverhub-desktop/releases/latest')">PC</button>
              <button class="ui-btn ui-btn-mini" onclick="openURL('https://apps.apple.com/kz/app/gyverhub/id6474273925')">iOS</button>
              <button class="ui-btn ui-btn-mini" onclick="openURL('https://play.google.com/store/apps/details?id=ru.alexgyver.GyverHub')">Android</button>
              <button class="ui-btn ui-btn-mini" onclick="openURL('https://github.com/GyverLibs/GyverHub-app/releases/latest/download/app-release.apk')">.apk</button>
            </div>
          </div>
        </div>
        
        <div class="ui-col" id="pwa_block" style="display: none;">
          <div class="ui-row ui-head">
            <label class="ui-label"><span class="icon icon-ui"></span>Web App</label>
            <div class="ui-row-btn">
              <button class="ui-btn ui-btn-mini" id="btn_pwa"><slot name="lang.p_install"></slot></button>
            </div>
          </div>
          <span class="notice-block" id="pwa_unsafe">Enable <u><slot name="browser"></slot>://flags/#unsafely-treat-insecure-origin-as-secure</u> and add <u><slot name="location"></slot></u> to list</span>
        </div>

        <div class="ui-col">
          <div class="ui-row ui-head">
            <label class="ui-label"><span class="icon icon-ui"></span>HTTP/HTTPS</label>
            <div class="ui-row-btn">
              <button class="ui-btn ui-btn-mini" id="btn_pwa_http" onclick="switch_ssl(false)">HTTP</button>
              <button class="ui-btn ui-btn-mini" id="btn_pwa_https" onclick="switch_ssl(true)">HTTPS</button>
            </div>
          </div>
        </div>

        <!--@/[if_target:host]-->
  
        <div class="ui-col">
          <div class="cfg-info" id="hub_stat">GyverHub v<!--@![:version]--> <!--@![:target]--></div>

          <hr>

          <div class="cfg-info">
            <a href="https://fontawesome.com/v6/search?o=r&m=free&s=solid" target="_blank">Fontawesome</a>
            <a href="https://github.com/Simonwep/pickr" target="_blank">Pickr</a>
            <a href="https://github.com/mqttjs/MQTT.js" target="_blank">MQTT.js</a>
            <a href="https://github.com/ghornich/sort-paths" target="_blank">sort-paths.js</a>
            <a href="https://github.com/loginov-rocks/Web-Bluetooth-Terminal" target="_blank">Bluetooth Terminal</a>
            <a href="https://github.com/davidshimjs/qrcodejs" target="_blank">QRCode.js</a>
            <a href="https://esphome.github.io/esp-web-tools/" target="_blank">ESP Web Tools</a>
            <a href="https://leafletjs.com/" target="_blank">Leaflet.js</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="cli" id="cli_cont">
    <div class="cli-block">
      <div class="cli-area" id="cli"></div>
      <div class="cli-row">
        <span class="icon cli-icon"></span>
        <input type="text" class="ui-inp cli-input" id="cli_input" onkeydown="checkCLI(event)">
        <button class="icon icon-btn cli-icon cli-enter" onclick="sendCLI()"></button>
      </div>
    </div>
  </div>

  <div class="footer">
    <a style="cursor:pointer" data-action="show_screen" data-screen="main"><span class="icon i-footer" title="Home"></span></a>
    <a style="cursor:pointer" data-action="show_screen" data-screen="projects"><span class="icon i-footer" title="Projects"></span></a>
    <a style="cursor:pointer" data-action="show_screen" data-screen="plugins"><span class="icon i-footer" title="Plugins"></span></a>
    <a style="cursor:pointer" data-action="show_screen" data-screen="test"><span class="icon i-footer" title="Plugin Test"></span></a>
    <a href="https://github.com/GyverLibs/GyverHub/wiki" target="_blank"><span class="icon i-footer" title="Wiki"></span></a>
    <a href="https://alexgyver.ru/support_alex/" target="_blank"><span class="icon i-footer" title="Support"></span></a>
  </div>
  `;

  // render netmask
  let masks = getMaskList();
  for (let mask in masks) {
    EL('netmask').innerHTML += `<option value="${mask}">${masks[mask]}</option>`;
  }
}