// =========== MAIN ===========
function render_main() {
  // BODY
  document.body.innerHTML = `
  <noscript>Browser is not supported</noscript>
  <div id="notice" class="notice"></div>
  <div class="head" id="head_cont"></div>
  <div class="test" id="test_cont"></div>
  <div class="projects" id="projects_cont"></div>
  <div class="main" id="main_cont"></div>
  <div class="cli" id="cli_cont"></div>
  <div class="footer" id="footer_cont"></div>
  <div id="qrcode" style="display: none"></div>
  `;

  // HEAD
  head_cont.innerHTML = `
  <div class="title" id="title_cont">
    <div class="title_inn">
      <div id="title_row" class="title_row" onclick="back_h()">
        <span class="icon icon_head back_btn" id="back"></span>
        <span><span id="title">${app_title}</span><sup id="conn"></sup></span>
        <div id="conn_icons">
          <span id='bt_ok' class="icon icon_ui icon_ok"></span>
          <span id='mqtt_ok' class="icon icon_ui icon_ok"></span>
          <span id='serial_ok' class="icon icon_ui icon_ok"></span>
        </div>
      </div>
      <div class="head_btns">
        <span class="icon icon_head" id='icon_refresh' onclick="refresh_h()"></span>
        <span class="icon icon_head" id='icon_cfg' style="display:none" onclick="config_h()"></span>
        <span class="icon icon_head" id='icon_menu' style="display:none" onclick="menu_h()"></span>
      </div>
    </div>
  </div>
  `;

  /*NON-ESP*/
  // TEST
  test_cont.innerHTML = `
  <div class="test_text">А тут пока ничего нет. Но будет онлайн-тест интерфейса, в котором можно будет поиграться и проверить свой билд без загрузки прошивки</div>
  `;

  // PROJECTS
  projects_cont.innerHTML = `
  <div class="projects_inn">
    <div id="projects" class="projects"></div>

    <div class="projects">
      <div class="proj">
        <div class="proj_inn">
          <div class="proj_name">
            <a href="https://github.com/GyverLibs/GyverHub-projects" target="_blank">+ Add Project</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
  /*/NON-ESP*/

  // CLI
  cli_cont.innerHTML = `
  <div class="cli_block">
    <div class="cli_area" id="cli"></div>
    <div class="cli_row">
      <span class="icon cli_icon"></span>
      <input type="text" class="ui_inp cli_inp" id="cli_input" onkeydown="checkCLI(event)">
      <button class="icon icon_btn cli_icon cli_enter" onclick="sendCLI()"></button>
    </div>
  </div>
  `;

  /*NON-ESP*/
  // FOOTER
  footer_cont.innerHTML = `
  <div class="footer_inner">
    <!--<a href="https://alexgyver.ru/support_alex/" target="_blank"><span class="icon icon_inline i_footer"></span>Support</a>-->
    <a style="cursor:pointer" onclick="projects_h()"><span class="icon icon_inline i_footer"></span>Projects</a>
    <!--<a style="cursor:pointer" onclick="test_h()"><span class="icon icon_inline i_footer"></span>Test</a>-->
    <a style="cursor:pointer" onclick="window.open('https://hub.gyver.ru/old/')"><span class="icon icon_inline i_footer"></span>Old</a>
    <a href="https://github.com/GyverLibs/GyverHub/wiki" target="_blank"><span class="icon icon_inline i_footer"></span>Wiki</a>
  </div>
  `;
  /*/NON-ESP*/

  // MAIN
  main_cont.innerHTML = `
  <div id="menu_overlay" onclick="menu_show(0)"></div>
  <div id="menu" class="main_col menu">
    <div class="menu_inn">
      <div id="menu_user"></div>
      <div id="menu_system"></div>
    </div>
  </div>

  <div class="main_inn">
    <div id="plugins"></div>
    <div id="app_plugins"></div>
    <div id="devices" class="main_col"></div>
    <div id="controls"></div>
    
    <div id="info" class="main_col">
      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Settings</label>
        </div>

        <div class="ui_row">
          <label>Console</label>
          <label class="switch"><input type="checkbox" id="info_cli_sw" onchange="showCLI(this.checked);save_devices()">
          <span class="slider"></span></label>
        </div>
        <div class="ui_row">
          <label>UI mode</label>
          <div class="ui_inp_row">
            <select class="ui_inp ui_sel" id="ui_mode" onchange="ui_mode_h(this)">
              <option value="0">Default</option>
              <option value="1">Single row</option>
              <option value="2">Responsive</option>
              <option value="3">Grid</option>
            </select>
          </div>          
        </div>
        <div class="ui_row" id="ui_block_width_cont">
          <label class="ui_label">Block width</label>
          <div class="ui_inp_row">
            <input class="ui_inp" type="text" id="ui_block_width" onchange="ui_block_width_h(this)">
          </div>
        </div>
        <div class="ui_row">
          <label class="ui_label">Main width</label>
          <div class="ui_inp_row">
            <input class="ui_inp" type="text" id="main_width" onchange="ui_width_h(this)">
          </div>
        </div>
        <div class="ui_row">
          <label class="ui_label">Plugin CSS</label>
          <div class="ui_inp_row">
            <textarea class="w_area" id="plugin_css" onchange="ui_plugin_css_h(this)"></textarea>
          </div>
        </div>
        <div class="ui_row">
          <label class="ui_label">Plugin JS</label>
          <div class="ui_inp_row">
            <textarea class="w_area" id="plugin_js" onchange="ui_plugin_js_h(this)"></textarea>
          </div>
        </div>
        <div style="height:5px"></div>
        <div class="ui_btn_row">
          <button id="reboot_btn" class="ui_btn ui_btn_mini" onclick="reboot_h()"><span class="icon icon_inline"></span>Reboot</button>
          <button id="devlink_btn" class="ui_btn ui_btn_mini" onclick="devlink_h()"><span class="icon icon_inline"></span>Link</button>
          <!--NON-ESP--><button id="qr_btn" class="ui_btn ui_btn_mini" onclick="qr_h()"><span class="icon icon_inline"></span>QR code</button><!--/NON-ESP-->
        </div>
      </div>

      <div class="ui_col" id="info_topics">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Topics</label>
        </div>
      </div>

      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Version</label>
        </div>
        <div id="info_version"></div>
      </div>

      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Network</label>
        </div>
        <div id="info_net"></div>
      </div>

      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Memory</label>
        </div>
        <div id="info_memory"></div>
      </div>

      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>System</label>
        </div>
        <div id="info_system"></div>
      </div>
    </div>

    <div id="fsbr_edit" class="main_col">
      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Editor</label>
        </div>
        <div class="ui_row">
          <label id="edit_path"></label>
        </div>
        <div class="ui_row">
          <label>Wrap text</label>
          <label class="switch"><input type="checkbox" id="editor_wrap" onchange="this.checked?editor_area.classList.remove('w_area_wrap'):editor_area.classList.add('w_area_wrap')"><span class="slider"></span></label>
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

    <div id="files" class="main_col">
      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>FS browser</label>
        </div>
        <div id="fs_browser">
          <div id="fsbr_inner"></div>
          <div class="ui_row">
            <div>
              <button id="fs_format" onclick="format_h()" class="ui_btn ui_btn_mini">Format</button>
            </div>
          </div>
        </div>
      </div>
      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Upload to</label>
        </div>
        <div id="fs_upload">
          <div class="upl_row">
            <input class="ui_inp ui_inp_wbtn" type="text" id="file_upload_path" value="/">
            <input type="file" id="file_upload" style="display:none" onchange="uploadFile(this.files[0], file_upload_path.value)">
            <button id="file_upload_btn" onclick="file_upload.click()" class="ui_btn upl_btn">Upload</button>
          </div>
        </div>
      </div>
      <div class="ui_col">
        <div class="ui_row ui_head">
          <label><span class="icon icon_ui"></span>Create file</label>
        </div>
        <div id="fs_create">
          <div class="upl_row">
            <input class="ui_inp ui_inp_wbtn" type="text" id="file_create_path" value="/">
            <button onclick="create_h()" class="ui_btn upl_btn">Create</button>
          </div>
        </div>
      </div>

    </div>

    <div id="ota" class="main_col">

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

    <div id="config" class="cfg_inner">

      <div class="ui_col">
        <div class="ui_row ui_head ui_tab" onclick="use_local.click()">
          <label class="ui_label ui_tab" id="local_label"><span class="icon icon_ui"></span>Local</label>
          <input type="checkbox" id="use_local" onchange="update_cfg(this)" style="display:none">
        </div>
        <div id="local_block" style="display:none">
          <div class="ui_row" id="http_only_http" style="display:none">
            <span style="color:#c60000">Works only on <strong class="span_btn" onclick="window.location.href = window.location.href.replace('https', 'http')">HTTP</strong>!</span>
          </div>

          <div id="http_settings">
            <div class="ui_row">
              <label class="ui_label">Local IP</label>
              <div class="ui_inp_row">
                <input class="ui_inp" type="text" id="local_ip" onchange="update_cfg(this)">
                <div class="btn_inp_block">
                  <button class="icon icon_btn" onclick="update_ip_h();update_cfg(EL('local_ip'))"></button>
                </div>
              </div>
            </div>

            <div class="ui_row">
              <label>Netmask</label>
              <div class="ui_inp_row">
                <select class="ui_inp ui_sel" id="netmask" onchange="update_cfg(this)"></select>
              </div>
            </div>

            <div class="ui_row">
              <label>HTTP port</label>
              <div class="ui_inp_row"><input class="ui_inp" type="text" id="http_port" onchange="update_cfg(this)"></div>
            </div>
            
            <div class="ui_row">
              <label class="ui_label">Add by IP</label>
              <div class="ui_inp_row">
                <input class="ui_inp" type="text" value="192.168.1.1" id="local_add_ip">
                <div class="btn_inp_block">
                  <button class="icon icon_btn" onclick="manual_ip_h(local_add_ip.value)"></button>
                </div>
              </div>
            </div>

            <!--APP-->
            <span class="notice_block">Disable: <u>${browser()}://flags/#block-insecure-private-network-requests</u></span>
            <!--/APP-->
          </div>
        </div>
      </div>

      <!--NON-ESP-->
      <div class="ui_col" id="mq_col">
        <div class="ui_row ui_head ui_tab" onclick="use_mqtt.click()">
          <label class="ui_label ui_tab" id="mqtt_label"><span class="icon icon_ui"></span>MQTT</label>
          <input type="checkbox" id="use_mqtt" onchange="update_cfg(this);hub.mqtt.stop()" style="display:none">
        </div>

        <div id="mq_block" style="display:none">

          <div class="ui_row">
            <label class="ui_label">Host</label>
            <div class="ui_inp_row"><input class="ui_inp" type="text" id="mq_host" onchange="update_cfg(this);hub.mqtt.stop()"></div>
          </div>

          <div class="ui_row">
            <label class="ui_label">Port (WSS)</label>
            <div class="ui_inp_row"><input class="ui_inp" type="number" id="mq_port" onchange="update_cfg(this);hub.mqtt.stop()"></div>
          </div>

          <div class="ui_row">
            <label class="ui_label">Login</label>
            <div class="ui_inp_row"><input class="ui_inp" type="text" id="mq_login" onchange="update_cfg(this);hub.mqtt.stop()"></div>
          </div>

          <div class="ui_row">
            <label class="ui_label">Pass</label>
            <div class="ui_inp_row"><input class="ui_inp" type="password" id="mq_pass" onchange="update_cfg(this);hub.mqtt.stop()">
            </div>
          </div>
          <div class="ui_row">
            <div></div>
            <div class="ui_btn_row">
              <button class="ui_btn ui_btn_mini" onclick="hub.mqtt.start()" id="mq_start">Connect</button>
              <button class="ui_btn ui_btn_mini" onclick="hub.mqtt.stop()" id="mq_stop" style="display:none">Disconnect</button>
            </div>
          </div>

        </div>
      </div>
      
      <div class="ui_col" id="serial_col" ${hasSerial() ? '' : 'style="display:none"'}>
        <div class="ui_row ui_head ui_tab" onclick="use_serial.click()">
          <label class="ui_label ui_tab" id="serial_label"><span class="icon icon_ui"></span>Serial</label>
          <input type="checkbox" id="use_serial" onchange="serial_toggle(this.checked);update_cfg(this)" style="display:none">
        </div>

        <div id="serial_block" style="display:none">
          <div class="ui_row">
            <label class="ui_label">Baudrate</label>
            <div class="ui_inp_row">
              <select class="ui_inp ui_sel" id='baudrate' onchange="update_cfg(this)"></select>
            </div>
          </div>
          <div class="ui_row">
            <label class="ui_label">Time offset</label>
            <div class="ui_inp_row"><input class="ui_inp" type="text" id="serial_offset" onchange="update_cfg(this)"></div>
          </div>
          <div class="ui_row">
            <label class="ui_label">Port</label>
            <div class="ui_btn_row">
              <button class="ui_btn ui_btn_mini" onclick="hub.serial.select()">Select</button>
              <button id="serial_open" class="ui_btn ui_btn_mini" onclick="hub.serial.open()" style="display:none">Connect</button>
              <button id="serial_close" class="ui_btn ui_btn_mini" onclick="hub.serial.close()" style="display:none">Disconnect</button>
            </div>
          </div>
        </div>
      </div>

      <div class="ui_col" id="bt_col" ${hasBT() ? '' : 'style="display:none"'}>
        <div class="ui_row ui_head ui_tab" onclick="use_bt.click()">
          <label class="ui_label ui_tab" id="bt_label"><span class="icon icon_ui"></span>Bluetooth</label>
          <input type="checkbox" id="use_bt" onchange="update_cfg(this)" style="display:none">
        </div>

        <div id="bt_block" style="display:none">
          <div class="ui_row">
            <label class="ui_label" id="bt_device">Not Connected</label>
            <div class="ui_btn_row">
              <button id="bt_open" class="ui_btn ui_btn_mini" onclick="hub.bt.open()">Connect</button>
              <button id="bt_close" class="ui_btn ui_btn_mini" onclick="hub.bt.close()" style="display:none">Disconnect</button>
            </div>
          </div>
        </div>

      </div>
      <!--/NON-ESP-->         

      <div class="ui_col">
        <div class="ui_row ui_head">
          <label class="ui_label"><span class="icon icon_ui"></span>Settings</label>
        </div>

        <div class="ui_row">
          <label class="ui_label">Search</label>
          <button class="icon icon_btn_big" onclick="search();back_h();" title="Find new devices"></button>
        </div>

        <div class="ui_row">
          <label class="ui_label">Prefix</label>
          <div class="ui_inp_row">
            <input class="ui_inp" type="text" id="prefix" onchange="update_cfg(this)">
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Client ID</label>
          <div class="ui_inp_row">
            <input class="ui_inp" type="text" id="client_id" onchange="update_cfg(this)" oninput="if(this.value.length>8)this.value=this.value.slice(0,-1)">
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Theme</label>
          <div class="ui_inp_row">
            <select class="ui_inp ui_sel" id='theme' onchange="update_cfg(this)"></select>
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Main Color</label>
          <div class="ui_inp_row">
            <select class="ui_inp ui_sel" id='maincolor' onchange="update_cfg(this)"></select>
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Font</label>
          <div class="ui_inp_row">
            <select class="ui_inp ui_sel" id='font' onchange="update_cfg(this)"></select>
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Lang</label>
          <div class="ui_inp_row">
            <select class="ui_inp ui_sel" id='lang' onchange="update_cfg(this)"></select>
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">UI Width</label>
          <div class="ui_inp_row">
            <input class="ui_inp" type="text" id="ui_width" onchange="update_cfg(this);update_theme()">
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Plugin CSS</label>
          <div class="ui_inp_row">
            <textarea class="w_area" id="app_plugin_css" onchange="update_cfg(this);update_theme()"></textarea>
          </div>
        </div>

        <div class="ui_row">
          <label class="ui_label">Plugin JS</label>
          <div class="ui_inp_row">
            <textarea class="w_area" id="app_plugin_js" onchange="update_cfg(this);update_theme()"></textarea>
          </div>
        </div>

        <div class="ui_row">
          <label>Check updates</label>
          <label class="switch"><input type="checkbox" id="check_upd" onchange="update_cfg(this)"><span class="slider"></span></label>
        </div>

        <div class="ui_row">
          <label class="ui_label">Settings</label>
          <div class="ui_btn_row">
            <button class="ui_btn ui_btn_mini" onclick="cfg_export()">Export</button>
            <button class="ui_btn ui_btn_mini" onclick="cfg_import()">Import</button>
          </div>
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
            <div class="ui_inp_row"><input class="ui_inp" type="password" pattern="[0-9]*" inputmode="numeric"
                id="pin" onchange="this.value=this.value.hashCode();update_cfg(this)" oninput="check_type(this)">
            </div>
          </div>
        </div>
      </div>

      <!--NON-ESP-->
      <div class="ui_col" id="pwa_block">
        <div class="ui_row ui_head">
        <label class="ui_label"><span class="icon icon_ui"></span>Web App</label>
          <div class="ui_btn_row">
            <button class="ui_btn ui_btn_mini ${isSSL() ? 'ui_btn_dis' : ''}" onclick="pwa_install(false)">HTTP</button>
            <button class="ui_btn ui_btn_mini ${!isSSL() ? 'ui_btn_dis' : ''}" onclick="pwa_install(true)">HTTPS</button>
          </div>
        </div>
        <!--<span class="notice_block">HTTP app: <b>Local</b> and <b>MQTT</b><br>HTTPS app: only <b>MQTT</b></span>-->
        <span class="notice_block" id="pwa_unsafe">Enable <u>${browser()}://flags/#unsafely-treat-insecure-origin-as-secure</u> and add <u>${window.location.href}</u> to list</span>
      </div>
      <!--/NON-ESP-->

      <div class="ui_col" id="app_block">
        <div class="ui_row ui_head">
        <label class="ui_label"><span class="icon icon_ui"></span>App</label>
          <div class="ui_btn_row">
            <button class="ui_btn ui_btn_mini" onclick="openURL('https://play.google.com/store/apps/details?id=ru.alexgyver.GyverHub')">Android</button>
            <button class="ui_btn ui_btn_mini" onclick="openURL('https://github.com/GyverLibs/GyverHub/raw/main/app/GyverHub.apk')">.apk</button>
          </div>
        </div>
      </div>

      <div class="ui_col">
        <div class="cfg_info" id="hub_stat"></div>
        <div class="cfg_info">
          Contribution:
          <a href="https://github.com/Simonwep/pickr" target="_blank">Pickr</a>
          <a href="https://github.com/mqttjs/MQTT.js" target="_blank">MQTT.js</a>
          <a href="https://github.com/ghornich/sort-paths" target="_blank">sort-paths</a>
          <a href="https://fontawesome.com/v5/search?o=r&m=free&s=solid" target="_blank">Fontawesome</a>
          <a href="https://github.com/loginov-rocks/Web-Bluetooth-Terminal" target="_blank">Bluetooth Terminal</a>
          <a href="https://github.com/davidshimjs/qrcodejs" target="_blank">QRCode.js</a>
        </div>
      </div>
    </div>

    <div id="password" class="main_col">
      <div class="pass_inp_inner">
        <input class="ui_inp pass_inp" type="number" pattern="[0-9]*" inputmode="numeric" id="pass_inp" oninput="pass_type('')">
      </div>
      <div class="ui_row pin_inner">
        <button class="ui_btn pin_btn" onclick="pass_type(1)">1</button>
        <button class="ui_btn pin_btn" onclick="pass_type(2)">2</button>
        <button class="ui_btn pin_btn" onclick="pass_type(3)">3</button>
      </div>
      <div class="ui_row pin_inner">
        <button class="ui_btn pin_btn" onclick="pass_type(4)">4</button>
        <button class="ui_btn pin_btn" onclick="pass_type(5)">5</button>
        <button class="ui_btn pin_btn" onclick="pass_type(6)">6</button>
      </div>
      <div class="ui_row pin_inner">
        <button class="ui_btn pin_btn" onclick="pass_type(7)">7</button>
        <button class="ui_btn pin_btn" onclick="pass_type(8)">8</button>
        <button class="ui_btn pin_btn" onclick="pass_type(9)">9</button>
      </div>
      <div class="ui_row pin_inner">
        <button class="ui_btn pin_btn pin_no_btn"></button>
        <button class="ui_btn pin_btn" onclick="pass_type(0)">0</button>
        <button class="ui_btn pin_btn pin_red_btn" onclick="pass_inp.value=pass_inp.value.slice(0, -1)">&lt;</button>
      </div>
    </div>
  </div>
  <div id="bottom_space"></div>
  `;
}

// =========== MISC ===========
function render_selects() {
  /*NON-ESP*/
  for (let baud of baudrates) {
    EL('baudrate').innerHTML += `
    <option value="${baud}">${baud}</option>`;
  }
  /*/NON-ESP*/
  for (let color in colors) {
    EL('maincolor').innerHTML += `
    <option value="${color}">${color}</option>`;
  }

  for (let lang in langs) {
    EL('lang').innerHTML += `
    <option value="${lang}">${lang}</option>`;
  }

  for (let font of fonts) {
    EL('font').innerHTML += `
    <option value="${font}">${font}</option>`;
  }

  for (let theme in themes) {
    EL('theme').innerHTML += `
    <option value="${theme}">${theme}</option>`;
  }

  let masks = getMaskList();
  for (let mask in masks) {
    EL('netmask').innerHTML += `<option value="${mask}">${masks[mask]}</option>`;
  }
}
function render_info() {
  const info_labels_topics = {
    info_id: 'ID',
    info_set: 'Set',
    info_read: 'Read',
    info_get: 'Get',
    info_status: 'Status',
  };

  for (let id in info_labels_topics) {
    EL('info_topics').innerHTML += `
    <div class="ui_row info">
      <label>${info_labels_topics[id]}</label>
      <label id="${id}" class="info_label info_label_small">-</label>
    </div>`;
  }
}
function add_device(dev) {
  let icon = dev.icon;
  if (icon.length && isESP()) icon = '';
  EL('devices').innerHTML += `
  <div class="device ${dev.conn == Conn.NONE ? 'offline' : ''}" id="device#${dev.id}" onclick="device_h('${dev.id}')" title="${dev.id} [${dev.prefix}]">
    <div class="device_inner">
      <div id="d_head#${dev.id}" style="display:contents">
        <div class="d_icon ${icon.length ? '' : 'd_icon_empty'}"><span class="icon icon_min ${icon.length ? '' : 'd_icon_none'}" id="icon#${dev.id}">${getIcon(icon)}</span></div>
        <div class="d_title">
          <span><span class="d_name" id="name#${dev.id}">${dev.name}</span><sup class="conn_dev" id="Serial#${dev.id}">S</sup><sup class="conn_dev" id="BT#${dev.id}">B</sup><sup class="conn_dev" id="HTTP#${dev.id}">L</sup><sup class="conn_dev" id="MQTT#${dev.id}">M</sup></span>
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

  let device = hub.dev(dev.id);
  EL('d_head#' + dev.id).style.display = device.cfg_flag ? 'none' : 'contents';
  EL('d_cfg#' + dev.id).style.display = device.cfg_flag ? 'flex' : 'none';
}
function render_devices() {
  EL('devices').innerHTML = '';
  for (let dev of hub.devices) {
    add_device(dev.info);
    for (let i in dev.conn_arr) {
      if (dev.conn_arr[i]) display(`${Conn.names[i]}#${dev.info.id}`, 'inline-block');
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
function mq_change(opened) {
  display('mq_start', opened ? 'none' : 'inline-block');
  display('mq_stop', opened ? 'inline-block' : 'none');
}

function bt_show_ok(state) {
  display('bt_ok', state ? 'inline-block' : 'none');
}
function bt_change(opened) {
  display('bt_open', opened ? 'none' : 'inline-block');
  display('bt_close', opened ? 'inline-block' : 'none');
}

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
  serial_check_ports();
}
async function serial_check_ports() {
  if (!hasSerial()) return;
  const ports = await hub.serial.getPorts();
  display('serial_open', ports.length ? 'inline-block' : 'none');
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
    } else addInfo('info_memory', i, info.memory[i]);
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