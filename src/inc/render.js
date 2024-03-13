// =========== MISC ===========
function add_device(device, dev) {
  let icon = dev.icon;
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
  if (val) EL('icon_refresh').classList.add('spinning');
  else EL('icon_refresh').classList.remove('spinning');
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
      <div class="icon header-icon icon_refresh" id='icon_refresh' data-action="refresh"></div>
      <div class="icon header-icon icon_cfg" data-action="config"></div>
      <div class="icon header-icon icon_menu" id='icon_menu' data-action="menu"></div>
    </div>
  </div>

  <div class="main">
    <div id="menu_overlay" onclick="menu_show(0)"></div>
    <div id="menu" class="main_col menu"></div>
  
    <div class="main_inn">
      <div class="main_col screen-test">
        <div class="test_text">А тут пока ничего нет. Но будет онлайн-тест интерфейса, в котором можно будет поиграться и проверить свой билд без загрузки прошивки</div>
      </div>

      <div id="projects_cont" class="main_col screen-projects">
        <div class="proj">
          <div class="proj_name">
            <a href="https://github.com/GyverLibs/GyverHub-projects" target="_blank">+ <slot name="lang.p_add"></slot></a>
          </div>
        </div>
      </div>

      <div id="devices" class="main_col screen-main"></div>
      <div id="controls" class="main_col screen-ui"></div>
  
      <div class="main_col screen-dev_config">
        <div class="ui_col">
  
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_settings"></slot></label>
          </div>
  
          <div class="ui_row">
            <label><slot name="lang.i_console"></slot></label>
            <label class="switch"><input type="checkbox" id="info_cli_sw" onchange="showCLI(this.checked);save_cfg()">
              <span class="slider"></span></label>
          </div>
  
          <div class="ui_row">
            <label><slot name="lang.i_trust"></slot></label>
            <label class="switch"><input type="checkbox" id="info_trust" onchange="trust_dev_h()">
              <span class="slider"></span></label>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.i_main"></slot></label>
            <div class="ui_inp_row">
              <input class="ui_inp" type="text" id="main_width" onchange="ui_width_h(this)">
            </div>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.i_css"></slot></label>
            <div class="ui_inp_row">
              <textarea class="w_area" id="plugin_css" onchange="ui_plugin_css_h(this)"></textarea>
            </div>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.i_js"></slot></label>
            <div class="ui_inp_row">
              <textarea class="w_area" id="plugin_js" onchange="ui_plugin_js_h(this)"></textarea>
            </div>
          </div>
  
          <div class="ui_btn_row">
            <button id="reboot_btn" class="ui_btn ui_btn_mini" onclick="reboot_h()"><span class="icon icon_inline"></span><slot name="lang.i_reboot"></slot></button>
            <!--@[if_not_target:esp]-->
            <button class="ui_btn ui_btn_mini" onclick="devlink_h()"><span class="icon icon_inline"></span><slot name="lang.i_link"></slot></button>
            <button class="ui_btn ui_btn_mini" onclick="qr_h()"><span class="icon icon_inline"></span>QR</button>
            <!--@/[if_not_target:esp]-->
          </div>
  
        </div>
      </div>
  
      <div class="main_col screen-info">
  
        <div class="ui_col" id="info_topics">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_topics"></slot></label>
          </div>
          <div class="ui_row info">
            <label>ID</label>
            <label id="info_id" class="info_label info_label_small">-</label>
          </div>
          <div class="ui_row info">
            <label>Set</label>
            <label id="info_set" class="info_label info_label_small">-</label>
          </div>
          <div class="ui_row info">
            <label>Read</label>
            <label id="info_read" class="info_label info_label_small">-</label>
          </div>
          <div class="ui_row info">
            <label>Get</label>
            <label id="info_get" class="info_label info_label_small">-</label>
          </div>
          <div class="ui_row info">
            <label>Status</label>
            <label id="info_status" class="info_label info_label_small">-</label>
          </div>
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_version"></slot></label>
          </div>
          <div id="info_version"></div>
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_net"></slot></label>
          </div>
          <div id="info_net"></div>
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_memory"></slot></label>
          </div>
          <div id="info_memory"></div>
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.i_system"></slot></label>
          </div>
          <div id="info_system"></div>
        </div>
      </div>
  
      <div class="main_col screen-fsbr_edit">
        <div class="ui_col">
  
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span>Editor</label>
          </div>
  
          <div class="ui_row">
            <label id="edit_path"></label>
          </div>
  
          <div class="ui_row">
            <label>Wrap text</label>
            <label class="switch">
              <input type="checkbox" id="editor_wrap" onchange="this.checked?editor_area.classList.remove('w_area_wrap'):editor_area.classList.add('w_area_wrap')">
              <span class="slider"></span>
            </label>
          </div>
  
          <div class="ui_row">
            <textarea rows=20 id="editor_area" class="ui_inp w_area w_area_wrap"></textarea>
          </div>
  
          <div class="ui_row">
            <button id="editor_save" onclick="editor_save()" class="ui_btn ui_btn_mini">Save & Upload</button>
            <button onclick="editor_cancel()" class="ui_btn ui_btn_mini">Cancel</button>
          </div>
  
        </div>
      </div>
  
      <div class="main_col screen-files">
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span><slot name="lang.fs_fsbr"></slot></label>
          </div>
          <div id="fs_browser">
            <div id="fsbr_inner"></div>
            <div class="ui_row" style="justify-content: flex-start;">
              <button id="fs_format" onclick="format_h()" class="ui_btn ui_btn_mini"><slot name="lang.fs_format"></slot></button>
              <button id="fs_create" onclick="create_h()" class="ui_btn ui_btn_mini"><slot name="lang.fs_create"></slot></button>
              <button id="fs_upload" onclick="upload_h()" class="ui_btn ui_btn_mini"><slot name="lang.fs_upload"></slot></button>
            </div>
          </div>
        </div>
      </div>
  
      <div class="main_col screen-ota">
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span>OTA FILE</label>
          </div>
          <div id="fs_otaf">
            <div class="ui_row">
              <div>
                <input type="file" id="ota_upload" style="display:none" onchange="uploadOta(this.files[0], 'flash')">
                <button onclick="ota_upload.click()" class="ui_btn ui_btn_mini drop_area" ondrop="uploadOta(event.dataTransfer.files[0], 'flash')">Flash</button>
                <input type="file" id="ota_upload_fs" style="display:none" onchange="uploadOta(this.files[0], 'fs')">
                <button onclick="ota_upload_fs.click()" class="ui_btn ui_btn_mini drop_area" ondrop="uploadOta(event.dataTransfer.files[0], 'fs')">Filesystem</button>
              </div>
              <label style="font-size:18px" id="ota_label"></label>
            </div>
          </div>
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label><span class="icon icon_ui"></span>OTA URL</label>
          </div>
          <div id="fs_otaurl">
            <div class="upl_row">
              <input class="ui_inp ui_inp_wbtn" type="text" id="ota_url_f">
              <button id="ota_url_btn" onclick="otaUrl(ota_url_f.value,'flash')" class="ui_btn upl_btn">Flash</button>
            </div>
            <div class="upl_row">
              <input class="ui_inp ui_inp_wbtn" type="text" id="ota_url_fs">
              <button id="ota_url_btn" onclick="otaUrl(ota_url_fs.value,'fs')" class="ui_btn upl_btn">FS</button>
            </div>
          </div>
        </div>
  
      </div>
  
      <div class="main_col screen-config">
  
        <div class="ui_col">
          <div class="ui_row ui_head ui_tab" onclick="use_local.click()">
            <label class="ui_label ui_tab" id="local_label"><span class="icon icon_ui"></span>WiFi</label>
            <input type="checkbox" id="use_local" data-hub-config="connections.HTTP.enabled" onchange="update_cfg(this);save_cfg()" style="display:none">
          </div>
          <div id="local_block" style="display:none">
            <div class="ui_row" id="http_only_http" style="display:none">
              <span style="color:#c60000">Works only on <strong class="span_btn" onclick="window.location.href = window.location.href.replace('https', 'http')">HTTP</strong>!</span>
            </div>
  
            <div id="http_settings">            
              <div class="ui_row">
                <label class="ui_label"><slot name="lang.wifi_ip"></slot></label>
                <div class="ui_inp_row">
                  <input class="ui_inp" type="text" id="local_ip" data-hub-config="connections.HTTP.local_ip" onchange="update_cfg(this)">
                  <div class="btn_inp_block">
                    <button class="icon icon_btn" onclick="update_ip_h();update_cfg(EL('local_ip'))"></button>
                  </div>
                </div>
              </div>
  
              <div class="ui_row">
                <label><slot name="lang.wifi_mask"></slot></label>
                <div class="ui_inp_row">
                  <select class="ui_inp ui_sel" id="netmask" data-hub-config="connections.HTTP.netmask" onchange="update_cfg(this)"></select>
                </div>
              </div>
  
              <div class="ui_row">
                <label><slot name="lang.wifi_port"></slot></label>
                <div class="ui_inp_row"><input class="ui_inp" type="text" id="http_port" data-hub-config="connections.HTTP.port" onchange="update_cfg(this)">
                </div>
              </div>
    
              <!--@[if_target:host,esp]-->
              <span class="notice_block">Disable:
                <u><slot name="browser"></slot>://flags/#block-insecure-private-network-requests</u></span>
              <!--@/[if_target:host,esp]-->

              <hr>

              <div class="ui_row">
                <label class="ui_label"><slot name="lang.wifi_add"></slot></label>
                <div class="ui_inp_row">
                  <input class="ui_inp" type="text" value="192.168.1.1" id="local_add_ip">
                  <div class="btn_inp_block">
                    <button class="icon icon_btn" onclick="manual_ip_h(local_add_ip.value)"></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!--@[if_not_target:esp]-->
        <div class="ui_col" id="mq_col">
          <div class="ui_row ui_head ui_tab" onclick="use_mqtt.click()">
            <label class="ui_label ui_tab" id="mqtt_label"><span class="icon icon_ui"></span>MQTT</label>
            <input type="checkbox" id="use_mqtt" data-hub-config="connections.MQTT.enabled" onchange="update_cfg(this);hub.mqtt.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="mq_block" style="display:none">
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.mq_host"></slot></label>
              <div class="ui_inp_row"><input class="ui_inp" type="text" id="mq_host" data-hub-config="connections.MQTT.host" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.mq_port"></slot></label>
              <div class="ui_inp_row"><input class="ui_inp" type="number" id="mq_port" data-hub-config="connections.MQTT.port" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.mq_login"></slot></label>
              <div class="ui_inp_row"><input class="ui_inp" type="text" id="mq_login" data-hub-config="connections.MQTT.login" onchange="update_cfg(this);hub.mqtt.disconnect()"></div>
            </div>
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.mq_pass"></slot></label>
              <div class="ui_inp_row"><input class="ui_inp" type="password" id="mq_pass" data-hub-config="connections.MQTT.password" onchange="update_cfg(this);hub.mqtt.disconnect()">
              </div>
            </div>
  
            <div class="ui_row">
              <div></div>
              <div class="ui_btn_row">
                <button class="ui_btn ui_btn_mini" onclick="hub.mqtt.connect()" id="mq_start"><slot name="lang.connect"></slot></button>
                <button class="ui_btn ui_btn_mini" onclick="hub.mqtt.disconnect()" id="mq_stop" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
  
          </div>
        </div>
  
        <div class="ui_col" id="tg_col">
  
          <div class="ui_row ui_head ui_tab" onclick="use_tg.click()">
            <label class="ui_label ui_tab" id="tg_label"><span class="icon icon_ui"></span>Telegram</label>
            <input type="checkbox" id="use_tg" data-hub-config="connections.TG.enabled" onchange="update_cfg(this);hub.tg.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="tg_block" style="display:none">
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.tg_token"></slot></label>
              <div class="ui_inp_row">
                <input class="ui_inp" type="text" id="tg_token" data-hub-config="connections.TG.token" onchange="update_cfg(this);hub.tg.disconnect()">
              </div>
            </div>
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.tg_chat"></slot></label>
              <div class="ui_inp_row">
                <input class="ui_inp" type="text" id="tg_chat" data-hub-config="connections.TG.chat" onchange="update_cfg(this)">
              </div>
            </div>
  
            <div class="ui_row">
              <div></div>
              <div class="ui_btn_row">
                <button class="ui_btn ui_btn_mini" onclick="hub.tg.connect()" id="tg_start"><slot name="lang.connect"></slot></button>
                <button class="ui_btn ui_btn_mini" onclick="hub.tg.disconnect()" id="tg_stop" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
          </div>
        </div>
  
        <div class="ui_col" id="serial_col">
          <div class="ui_row ui_head ui_tab" onclick="use_serial.click()">
            <label class="ui_label ui_tab" id="serial_label"><span class="icon icon_ui"></span>Serial</label>
            <input type="checkbox" id="use_serial" data-hub-config="connections.SERIAL.enabled" onchange="update_cfg(this);hub.serial.disconnect();save_cfg()" style="display:none">
          </div>
  
          <div id="serial_block" style="display:none">
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.sr_baud"></slot></label>
              <div class="ui_inp_row">
                <select class="ui_inp ui_sel" id='baudrate' data-hub-config="connections.SERIAL.baudrate" onchange="update_cfg(this)">
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
  
            <div class="ui_row">
              <label class="ui_label"><slot name="lang.sr_offset"></slot></label>
              <div class="ui_inp_row"><input class="ui_inp" type="text" id="serial_offset" data-hub-config="connections.SERIAL.offset" onchange="update_cfg(this)">
              </div>
            </div>
  
            <div class="ui_row">
              <div><label class="ui_label" id="serial_device"><slot name="lang.not_conn"></slot></label> <label class="ui_label" id="port_name"></label></div>
              <div class="ui_btn_row">
                <button class="ui_btn ui_btn_mini" onclick="hub.serial.select()"><slot name="lang.select"></slot></button>
                <button id="serial_open" class="ui_btn ui_btn_mini" onclick="hub.serial.connect()" style="display:none"><slot name="lang.connect"></slot></button>
                <button id="serial_close" class="ui_btn ui_btn_mini" onclick="hub.serial.disconnect()" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
  
          </div>
        </div>
  
        <div class="ui_col" id="bt_col">
          <div class="ui_row ui_head ui_tab" onclick="use_bt.click()">
            <label class="ui_label ui_tab" id="bt_label"><span class="icon icon_ui"></span>Bluetooth</label>
            <input type="checkbox" id="use_bt" data-hub-config="connections.BLE.enabled" onchange="update_cfg(this);save_cfg()" style="display:none">
          </div>
  
          <div id="bt_block" style="display:none">
            <div class="ui_row">
              <label class="ui_label" id="bt_device"><slot name="lang.not_conn"></slot></label>
              <div class="ui_btn_row">
                <button class="ui_btn ui_btn_mini" onclick="hub.bt.select()"><slot name="lang.select"></slot></button>
                <button id="bt_open" class="ui_btn ui_btn_mini" onclick="hub.bt.connect()" style="display:none"><slot name="lang.connect"></slot></button>
                <button id="bt_close" class="ui_btn ui_btn_mini" onclick="hub.bt.disconnect()" style="display:none"><slot name="lang.disconnect"></slot></button>
              </div>
            </div>
          </div>
  
        </div>
        <!--@/[if_not_target:esp]-->
  
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label class="ui_label"><span class="icon icon_ui"></span><slot name="lang.cfg_search"></slot></label>
          </div>

          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_prefix"></slot></label>
            <div class="ui_inp_row">
              <input class="ui_inp" type="text" id="prefix" data-hub-config="hub.prefix" onchange="update_cfg(this)">
            </div>
          </div>

          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_add"></slot></label>
            <div class="ui_inp_row">
              <input class="ui_inp" type="text" value="device_id" id="add_by_id">
              <div class="btn_inp_block">
                <button class="icon icon_btn" onclick="manual_id_h(add_by_id.value)"></button>
              </div>
            </div>
          </div>

          <div class="ui_btn_row">
            <button class="ui_btn ui_btn_mini" onclick="search()"><slot name="lang.cfg_find_dev"></slot></button>
          </div>
        </div>

        <div class="ui_col">
          <div class="ui_row ui_head">
            <label class="ui_label"><span class="icon icon_ui"></span><slot name="lang.cfg_sett"></slot></label>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_id"></slot></label>
            <div class="ui_inp_row">
              <input class="ui_inp" type="text" id="client_id" data-hub-config="hub.client_id" onchange="update_cfg(this)" oninput="if(this.value.length>8)this.value=this.value.slice(0,-1)">
            </div>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_theme"></slot></label>
            <div class="ui_inp_row">
              <select class="ui_inp ui_sel" id='theme' onchange="update_cfg(this)">
                <option value="auto"></option>
                <option value="dark"></option>
                <option value="light"></option>
              </select>
            </div>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_color"></slot></label>
            <div class="ui_inp_row">
              <select class="ui_inp ui_sel" id='maincolor' onchange="update_cfg(this)">
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
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_font"></slot></label>
            <div class="ui_inp_row">
              <select class="ui_inp ui_sel" id='font' onchange="update_cfg(this)">
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
  
          <div class="ui_row">
            <label class="ui_label">Language</label>
            <div class="ui_inp_row">
              <select class="ui_inp ui_sel" id='lang' onchange="update_cfg(this)">
                <option value="English">English</option>
                <option value="Russian">Russian</option>
              </select>
            </div>
          </div>
  
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_width"></slot></label>
            <div class="ui_inp_row">
              <input class="ui_inp" type="text" id="ui_width" onchange="update_cfg(this)">
            </div>
          </div>
  
          <div class="ui_row">
            <label><slot name="lang.cfg_wide_mode"></slot></label>
            <label class="switch"><input type="checkbox" id="wide_mode" onchange="update_cfg(this)"><span class="slider"></span></label>
          </div>

          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_css"></slot></label>
            <button class="icon icon_btn_big" onclick="app_plugin_css()"></button>
          </div>
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_js"></slot></label>
            <button class="icon icon_btn_big" onclick="app_plugin_js()"></button>
          </div>
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_proj"></slot></label>
            <button class="icon icon_btn_big" onclick="project_links()"></button>
          </div>
          <div class="ui_row">
            <label class="ui_label"><slot name="lang.cfg_plugin"></slot></label>
            <button class="icon icon_btn_big" onclick="plugin_links()"></button>
          </div>
  
          <div class="ui_row">
            <label><slot name="lang.cfg_updates"></slot></label>
            <label class="switch"><input type="checkbox" id="check_upd" onchange="update_cfg(this)"><span class="slider"></span></label>
          </div>
  
          <div class="ui_btn_row">
            <button class="ui_btn ui_btn_mini" onclick="cfg_export()"><slot name="lang.cfg_export"></slot></button>
            <button class="ui_btn ui_btn_mini" onclick="cfg_import()"><slot name="lang.cfg_import"></slot></button>
            <button class="ui_btn ui_btn_mini" onclick="cfg_reset()"><slot name="lang.cfg_reset"></slot></button>
          </div>
  
        </div>
  
        <div class="ui_col">
          <div class="ui_row ui_head ui_tab" onclick="use_pin.click()">
            <label id="pin_label" class="ui_label ui_tab"><span class="icon icon_ui"></span>PIN</label>
            <input type="checkbox" id="use_pin" onchange="update_cfg(this)" style="display:none">
          </div>
  
          <div id="pin_block" style="display:none">
            <div class="ui_row">
              <label class="ui_label">PIN</label>
              <div class="ui_inp_row"><input class="ui_inp" type="password" pattern="[0-9]*" inputmode="numeric" id="pin" onchange="make_pin(this);update_cfg(this)" oninput="check_type(this)">
              </div>
            </div>
          </div>
  
        </div>
  
        <!--@[if_target:host]-->
        <div class="ui_col">
          <div class="ui_row ui_head">
            <label class="ui_label"><span class="icon icon_ui"></span>App</label>
            <div class="ui_btn_row">
              <button class="ui_btn ui_btn_mini" onclick="openURL('https://github.com/neko-neko-nyan/gyverhub-desktop/releases/latest')">PC</button>
              <button class="ui_btn ui_btn_mini" onclick="openURL('https://apps.apple.com/kz/app/gyverhub/id6474273925')">iOS</button>
              <button class="ui_btn ui_btn_mini" onclick="openURL('https://play.google.com/store/apps/details?id=ru.alexgyver.GyverHub')">Android</button>
              <button class="ui_btn ui_btn_mini" onclick="openURL('https://github.com/GyverLibs/GyverHub-app/releases/latest/download/app-release.apk')">.apk</button>
            </div>
          </div>
        </div>
        
        <div class="ui_col" id="pwa_block" style="display: none;">
          <div class="ui_row ui_head">
            <label class="ui_label"><span class="icon icon_ui"></span>Web App</label>
            <div class="ui_btn_row">
              <button class="ui_btn ui_btn_mini" id="btn_pwa"><slot name="lang.p_install"></slot></button>
            </div>
          </div>
          <span class="notice_block" id="pwa_unsafe">Enable <u><slot name="browser"></slot>://flags/#unsafely-treat-insecure-origin-as-secure</u> and add <u><slot name="location"></slot></u> to list</span>
        </div>

        <div class="ui_col">
          <div class="ui_row ui_head">
            <label class="ui_label"><span class="icon icon_ui"></span>HTTP/HTTPS</label>
            <div class="ui_btn_row">
              <button class="ui_btn ui_btn_mini" id="btn_pwa_http" onclick="switch_ssl(false)">HTTP</button>
              <button class="ui_btn ui_btn_mini" id="btn_pwa_https" onclick="switch_ssl(true)">HTTPS</button>
            </div>
          </div>
        </div>

        <!--@/[if_target:host]-->
  
        <div class="ui_col">
          <div class="cfg_info" id="hub_stat">GyverHub v<!--@![:version]--> <!--@![:target]--></div>
          <div class="cfg_info">
            Contribution:
            <a href="https://github.com/Simonwep/pickr" target="_blank">Pickr</a>
            <a href="https://github.com/mqttjs/MQTT.js" target="_blank">MQTT.js</a>
            <a href="https://github.com/ghornich/sort-paths" target="_blank">sort-paths</a>
            <a href="https://fontawesome.com/v5/search?o=r&m=free&s=solid" target="_blank">Fontawesome</a>
            <a href="https://github.com/loginov-rocks/Web-Bluetooth-Terminal" target="_blank">Bluetooth Terminal</a>
            <a href="https://github.com/davidshimjs/qrcodejs" target="_blank">QRCode.js</a>
            <a href="https://esphome.github.io/esp-web-tools/" target="_blank">ESP Web Tools</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="cli" id="cli_cont">
    <div class="cli_block">
      <div class="cli_area" id="cli"></div>
      <div class="cli_row">
        <span class="icon cli_icon"></span>
        <input type="text" class="ui_inp cli_inp" id="cli_input" onkeydown="checkCLI(event)">
        <button class="icon icon_btn cli_icon cli_enter" onclick="sendCLI()"></button>
      </div>
    </div>
  </div>

  <div class="footer">
    <!-- <a href="https://alexgyver.ru/support_alex/" target="_blank"><span class="icon icon_inline i_footer"></span> Support</a> -->
    <a style="cursor:pointer" data-action="show_screen" data-screen="projects"><span class="icon icon_inline i_footer"></span> <slot name="lang.p_proj"></slot></a>
    <a style="cursor:pointer" data-action="show_screen" data-screen="test"><span class="icon icon_inline i_footer"></span> Test</a>
    <!-- <a href="https://hub.gyver.ru/old/" target="_blank"><span class="icon icon_inline i_footer"></span> Old</a> -->
    <a href="https://github.com/GyverLibs/GyverHub/wiki" target="_blank"><span class="icon icon_inline i_footer"></span> Wiki</a>
  </div>
  `;

  // render netmask
  let masks = getMaskList();
  for (let mask in masks) {
    EL('netmask').innerHTML += `<option value="${mask}">${masks[mask]}</option>`;
  }
}