// ============== VARS =================
const oninput_prd = 10;

let focused = null;
let touch = 0;
let pressId = null;
let dup_names = [];
let gauges = {};
let canvases = {};
let pickers = {};
let joys = {};
let prompts = {};
let confirms = {};
let oninp_buffer = {};

let wid_row_id = null;
let wid_row_count = 0;
let wid_row_size = 0;
let btn_row_id = null;
let btn_row_count = 0;
let dis_scroll_f = false;

// ================== POST ==================
function post(cmd, name = '', value = '') {
  if (focused) hub.post(focused, cmd, name, value);
}
function click_h(name, dir) {
  pressId = (dir == 1) ? name : null;
  post('set', name, dir);
}
function set_h(name, value = '') {
  post('set', name, value);
  setPlabel(name, '•');
}
function input_h(name, value) {
  if (!(name in oninp_buffer)) oninp_buffer[name] = { value: null, tout: null };

  if (!oninp_buffer[name].tout) {
    set_h(name, value);
    oninp_buffer[name].tout = setTimeout(() => {
      if (oninp_buffer[name] && oninp_buffer[name].value != null) {
        set_h(name, oninp_buffer[name].value);
      }
      delete oninp_buffer[name];
    }, oninput_prd);
  } else {
    oninp_buffer[name].value = value;
  }
}
function reboot_h() {
  post('reboot');
}
function release_all() {
  if (pressId) post('set', pressId, 0);
  pressId = null;
}

// ================== SHOW ==================
function showControls(controls, from_buffer = false, conn = Conn.NONE, ip = 'unset') {
  hub.dev(focused).resetFiles();
  EL('controls').style.visibility = 'hidden';
  EL('controls').innerHTML = '';
  if (!controls) return;
  oninp_buffer = {};
  gauges = {};
  canvases = {};
  pickers = {};
  joys = {};
  prompts = {};
  confirms = {};
  dup_names = [];

  wid_row_count = 0;
  btn_row_count = 0;
  wid_row_id = null;
  btn_row_id = null;
  addMenu(null);

  for (let id in controls) {
    let ctrl = controls[id];
    ctrl.name = id;

    if (hub.dev(focused).info.show_names && ctrl.name) ctrl.label = ctrl.name;
    ctrl.wlabel = ctrl.label ? ctrl.label : ctrl.type;
    ctrl.clabel = (ctrl.label && ctrl.label != '_no') ? ctrl.label : ctrl.type;
    ctrl.clabel = ctrl.clabel.charAt(0).toUpperCase() + ctrl.clabel.slice(1);

    switch (ctrl.type) {
      case 'button': addButton(ctrl); break;
      case 'button_i': addButtonIcon(ctrl); break;
      case 'spacer': addSpace(ctrl); break;
      case 'tabs': addTabs(ctrl); break;
      case 'title': addTitle(ctrl); break;
      case 'led': addLED(ctrl); break;
      case 'label': addLabel(ctrl); break;
      case 'icon': addIcon(ctrl); break;
      case 'input': addInput(ctrl); break;
      case 'pass': addPass(ctrl); break;
      case 'slider': addSlider(ctrl); break;
      case 'sliderW': addSliderW(ctrl); break;
      case 'switch': addSwitch(ctrl); break;
      case 'switch_i': addSwitchIcon(ctrl); break;
      case 'switch_t': addSwitchText(ctrl); break;
      case 'date': addDate(ctrl); break;
      case 'time': addTime(ctrl); break;
      case 'datetime': addDateTime(ctrl); break;
      case 'select': addSelect(ctrl); break;
      case 'week': addWeek(ctrl); break;
      case 'color': addColor(ctrl); break;
      case 'spinner': addSpinner(ctrl); break;
      case 'display': addDisplay(ctrl); break;
      case 'html': addHTML(ctrl); break;
      case 'flags': addFlags(ctrl); break;
      case 'log': addLog(ctrl); break;
      case 'row_b': case 'widget_b': beginWidgets(ctrl); break;
      case 'row_e': case 'widget_e': endWidgets(); break;
      case 'canvas': addCanvas(ctrl); break;
      case 'gauge': addGauge(ctrl); break;
      case 'image': addImage(ctrl); break;
      case 'stream': addStream(ctrl, conn, ip); break;
      case 'dpad': case 'joy': addJoy(ctrl); break;
      case 'js': eval(ctrl.value); break;
      case 'confirm': confirms[ctrl.name] = { label: ctrl.label }; break;
      case 'prompt': prompts[ctrl.name] = { label: ctrl.label, value: ctrl.value }; break;
      case 'menu': addMenu(ctrl); break;
      case 'table': addTable(ctrl); break;
    }
  }
  if (hub.dev(focused).info.show_names) {
    let labels = document.querySelectorAll(".widget_label");
    for (let lbl of labels) lbl.classList.add('widget_label_name');
  }

  resizeFlags();
  moveSliders();
  scrollDown();
  resizeSpinners();
  renderElms(from_buffer);
}
async function renderElms(from_buffer) {
  while (1) {
    await waitAnimationFrame();
    let end = 1;
    for (let i in gauges) if (EL('#' + i) == null) end = 0;
    for (let i in canvases) if (EL('#' + i) == null) end = 0;
    for (let i in joys) if (EL('#' + i) == null) end = 0;
    for (let i in pickers) if (EL('#' + i) == null) end = 0;

    if (end) {
      if (dup_names.length) showPopupError('Duplicated names: ' + dup_names);
      showCanvases();
      showGauges();
      showPickers();
      showJoys();
      EL('controls').style.visibility = 'visible';
      if (!from_buffer) hub.dev(focused).checkFiles();
      break;
    }
  }
}





// ============ COMPONENTS =============
// button
function addButton(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  if (wid_row_id) {
    let label = ctrl.wlabel, icon = '';
    if (ctrl.wlabel.charCodeAt(0) >= 0xF005) {
      icon = label[0];
      if (isESP()) icon = "";
      label = label.slice(1).trim();
    }
    endButtons();
    let inner = renderButton(ctrl.name, 'icon w_btn', ctrl.name, icon, ctrl.size * 3, ctrl.color, true);
    addWidget(ctrl.tab_w, ctrl.name, label, inner);
  } else {
    if (!btn_row_id) beginButtons();
    let label = ctrl.clabel, icon = '';
    if (ctrl.clabel.charCodeAt(0) >= 0xF005) {
      icon = label[0];
      label = label.slice(1).trim();
      label = `<span class="icon icon_min">${icon}</span>&nbsp;` + label;
    }
    EL(btn_row_id).innerHTML += `${renderButton(ctrl.name, 'ui_btn', ctrl.name, label, ctrl.size, ctrl.color, false)}`;
  }
}
function addButtonIcon(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  if (isESP()) ctrl.label = "";
  if (wid_row_id) {
    endButtons();
    let inner = renderButton(ctrl.name, 'icon w_btn', ctrl.name, ctrl.label, ctrl.size, ctrl.color, true);
    addWidget(ctrl.tab_w, ctrl.name, '', inner, 0, true);
  } else {
    if (!btn_row_id) beginButtons();
    EL(btn_row_id).innerHTML += `${renderButton(ctrl.name, 'icon w_btn', ctrl.name, ctrl.label, ctrl.size, ctrl.color, true)}`;
  }
}
function beginButtons() {
  btn_row_id = 'buttons_row#' + btn_row_count;
  btn_row_count++;
  EL('controls').innerHTML += `
  <div id="${btn_row_id}" class="control control_nob control_scroll"></div>
  `;
}
function endButtons() {
  if (btn_row_id && EL(btn_row_id).getElementsByTagName('*').length == 1) {
    EL(btn_row_id).innerHTML = "<div></div>" + EL(btn_row_id).innerHTML + "<div></div>";  // center button
  }
  btn_row_id = null;
}
function renderButton(title, className, name, label, size, color = null, is_icon = false) {
  let col = (color != null) ? ((is_icon ? ';color:' : ';background:') + intToCol(color)) : '';
  return `<button id="#${name}" title='${title}' style="font-size:${size}px${col}" class="${className}" onclick="set_h('${name}',2)" onmousedown="if(!touch)click_h('${name}',1)" onmouseup="if(!touch&&pressId)click_h('${name}',0)" onmouseleave="if(pressId&&!touch)click_h('${name}',0);" ontouchstart="touch=1;click_h('${name}',1)" ontouchend="click_h('${name}',0)">${label}</button>`;
}

// tabs
function addTabs(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let tabs = '';
  let labels = ctrl.text.toString().split(',');
  for (let i in labels) {
    let sel = (i == ctrl.value) ? 'class="tab_act"' : '';
    tabs += `<li onclick="set_h('${ctrl.name}','${i}')" ${sel}>${labels[i]}</li>`;
  }

  if (wid_row_id) {
    let inner = `
    <div class="navtab_tab">
      <ul>
        ${tabs}
      </ul>
    </div>
    `;
    addWidget(ctrl.tab_w, '', ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="navtab">
      <ul>
        ${tabs}
      </ul>
    </div>
  `;
  }
}





// slider
function addSlider(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let col = (ctrl.color != null) ? `background-image: linear-gradient(${intToCol(ctrl.color)}, ${intToCol(ctrl.color)})` : '';
  let formatted = formatToStep(ctrl.value, ctrl.step);
  if (wid_row_id) {
    let inner = `
    <input ontouchstart="dis_scroll_f=2" ontouchend="dis_scroll_f=0;enableScroll()" name="${ctrl.name}" id="#${ctrl.name}" oninput="moveSlider(this)" type="range" class="c_rangeW slider_t" style="${col}" value="${ctrl.value}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}"><div class="sldW_out"><output id="out#${ctrl.name}">${formatted}</output></div>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div class="sld_name">
        <label title='${ctrl.name}'>${ctrl.clabel}</label>
        <label>:&nbsp;</label>
        <output id="out#${ctrl.name}">${formatted}</output>
        <span class="plabel" id="plabel#${ctrl.name}"></span>
      </div>
      <div class="ui_inp_row">
        <input ontouchstart="dis_scroll_f=2" ontouchend="dis_scroll_f=0;enableScroll()" name="${ctrl.name}" id="#${ctrl.name}" oninput="moveSlider(this)" type="range" class="c_range slider_t" style="${col}" value="${ctrl.value}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}">      
      </div>
    </div>
  `;
  }
}
function moveSliders() {
  document.querySelectorAll('.c_range, .c_rangeW').forEach(x => { moveSlider(x, false) });
}
function moveSlider(arg, sendf = true) {
  if (dis_scroll_f) {
    dis_scroll_f--;
    if (!dis_scroll_f) disableScroll();
  }
  arg.style.backgroundSize = (arg.value - arg.min) * 100 / (arg.max - arg.min) + '% 100%';
  EL('out' + arg.id).value = formatToStep(arg.value, arg.step);
  if (sendf) input_h(arg.name, arg.value);
}

// switch
function addSwitch(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let ch = ctrl.value ? 'checked' : '';
  let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.slider{background:${intToCol(ctrl.color)}}</style>` : '';
  if (wid_row_id) {
    let inner = `${col}
    <label id="swlabel_${ctrl.name}" class="switch"><input type="checkbox" class="switch_t" id='#${ctrl.name}' onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" ${ch}><span class="slider"></span></label>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `${col}
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <label id="swlabel_${ctrl.name}" class="switch"><input type="checkbox" class="switch_t" id='#${ctrl.name}' onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" ${ch}><span class="slider"></span></label>
    </div>
  `;
  }
}
function addSwitchIcon(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let ch = ctrl.value ? 'checked' : '';
  let text = ctrl.text ? ctrl.text : '';
  if (isESP()) text = "";
  if (wid_row_id) {
    let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.switch_i_tab{background:${intToCol(ctrl.color)};color:var(--font_inv)} #swlabel_${ctrl.name} .switch_i_tab{box-shadow: 0 0 0 2px ${intToCol(ctrl.color)};color:${intToCol(ctrl.color)}}</style>` : '';
    let inner = `${col}
    <label id="swlabel_${ctrl.name}" class="switch_i_cont switch_i_cont_tab"><input type="checkbox" onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" class="switch_t" id='#${ctrl.name}' ${ch}><span class="switch_i switch_i_tab">${text}</span></label>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner, 120);
  } else {
    let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.switch_i{color:${intToCol(ctrl.color)}}</style>` : '';
    EL('controls').innerHTML += `${col}
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <label id="swlabel_${ctrl.name}" class="switch_i_cont"><input type="checkbox" onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" class="switch_t" id='#${ctrl.name}' ${ch}><span class="switch_i">${text}</span></label>
    </div>
  `;
  }
}
function addSwitchText(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let ch = ctrl.value ? 'checked' : '';
  let text = ctrl.text ? ctrl.text : 'ON';
  if (wid_row_id) {
    let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.switch_i_tab{background:${intToCol(ctrl.color)};color:var(--font_inv)} #swlabel_${ctrl.name} .switch_i_tab{box-shadow: 0 0 0 2px ${intToCol(ctrl.color)};color:${intToCol(ctrl.color)}}</style>` : '';
    let inner = `${col}
    <label id="swlabel_${ctrl.name}" class="switch_i_cont switch_i_cont_tab"><input type="checkbox" onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" class="switch_t" id='#${ctrl.name}' ${ch}><span class="switch_i switch_i_tab switch_txt switch_txt_tab">${text}</span></label>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner, 120);
  } else {
    let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.switch_i{color:${intToCol(ctrl.color)}}</style>` : '';
    EL('controls').innerHTML += `${col}
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <label id="swlabel_${ctrl.name}" class="switch_i_cont"><input type="checkbox" onclick="set_h('${ctrl.name}',(this.checked ? 1 : 0))" class="switch_t" id='#${ctrl.name}' ${ch}><span class="switch_i switch_txt">${text}</span></label>
    </div>
  `;
  }
}

// date time
function addDate(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let date = new Date(ctrl.value * 1000).toISOString().split('T')[0];
  let col = (ctrl.color != null) ? `color:${intToCol(ctrl.color)}` : '';
  if (wid_row_id) {
    let inner = `
    <input id='#${ctrl.name}' class="ui_inp c_inp_block c_inp_block_tab date_t" style="${col}" type="date" value="${date}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))">
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
      <div class="control">
        <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
        <input id='#${ctrl.name}' class="ui_inp c_inp_block datime date_t" style="${col}" type="date" value="${date}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))">
      </div>
    `;
  }
}
function addTime(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let time = new Date(ctrl.value * 1000).toISOString().split('T')[1].split('.')[0];
  let col = (ctrl.color != null) ? `color:${intToCol(ctrl.color)}` : '';
  if (wid_row_id) {
    let inner = `
    <input id='#${ctrl.name}' class="ui_inp c_inp_block c_inp_block_tab time_t" style="${col}" type="time" value="${time}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))" step="1">
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <input id='#${ctrl.name}' class="ui_inp c_inp_block datime time_t" style="${col}" type="time" value="${time}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))" step="1">
    </div>
  `;
  }
}
function addDateTime(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let datetime = new Date(ctrl.value * 1000).toISOString().split('.')[0];
  let col = (ctrl.color != null) ? `color:${intToCol(ctrl.color)}` : '';
  if (wid_row_id) {
    let inner = `
    <input id='#${ctrl.name}' class="ui_inp c_inp_block c_inp_block_tab datetime_t" style="${col}" type="datetime-local" value="${datetime}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))" step="1">
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <input id='#${ctrl.name}' class="ui_inp c_inp_block datime datime_w datetime_t" style="${col}" type="datetime-local" value="${datetime}" onclick="this.showPicker()" onchange="set_h('${ctrl.name}',getUnix(this))" step="1">
    </div>
  `;
  }
}
function getUnix(arg) {
  return Math.floor(arg.valueAsNumber / 1000);
}

// color
function addColor(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let color = intToCol(ctrl.value);
  let inner = `
    <div id="color_cont#${ctrl.name}" style="visibility: hidden">
      <div id='#${ctrl.name}'></div>
    </div>
    <button id="color_btn#${ctrl.name}" style="margin-left:-30px;color:${color}" class="icon icon_btn_big" onclick="openPicker('${ctrl.name}')"></button>
    `;

  if (wid_row_id) {
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      ${inner}
    </div>
    `;
  }
  pickers[ctrl.name] = color;
  /*if (wid_row_id) {
    let inner = `
    <input id='#${ctrl.name}' class="c_base_inp c_col c_col_tab input_t" type="color" value="${ctrl.value}" onchange="set_h('${ctrl.name}',this.value)">
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.label, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <label title='${ctrl.name}'>${ctrl.label}</label>
      <input id='#${ctrl.name}' class="c_base_inp c_col input_t" type="color" value="${ctrl.value}" onchange="set_h('${ctrl.name}',this.value)">
    </div>
    `;
  }*/
}
function openPicker(id) {
  EL('color_cont#' + id).getElementsByTagName('button')[0].click()
}
function showPickers() {
  for (let picker in pickers) {
    let id = '#' + picker;
    let obj = Pickr.create({
      el: EL(id),
      theme: 'nano',
      default: pickers[picker],
      defaultRepresentation: 'HEXA',
      components: {
        preview: true,
        hue: true,
        interaction: {
          hex: false,
          input: true,
          save: true
        }
      }
    }).on('save', (color) => {
      let col = color.toHEXA().toString();
      set_h(picker, colToInt(col));
      EL('color_btn' + id).style.color = col;
    });
    pickers[picker] = obj;
  }
}

// spinner
function addSpinner(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let formatted = formatToStep(ctrl.value, ctrl.step);
  if (wid_row_id) {
    let inner = `
      <div class="spinner_row">
        <button class="icon icon_btn btn_no_pad" onclick="spinSpinner(this, -1);set_h('${ctrl.name}',EL('#${ctrl.name}').value);"></button>
        <input id="#${ctrl.name}" name="${ctrl.name}" class="ui_inp spinner input_t" type="number" oninput="resizeSpinner(this)" onkeydown="checkDown(this)" value="${formatted}" min="${ctrl.min}"
          max="${ctrl.max}" step="${ctrl.step}">
        <button class="icon icon_btn btn_no_pad" onclick="spinSpinner(this, 1);set_h('${ctrl.name}',EL('#${ctrl.name}').value);"></button>
      </div>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <div class="spinner_row">
        <button class="icon icon_btn btn_no_pad" onclick="spinSpinner(this, -1);set_h('${ctrl.name}',EL('#${ctrl.name}').value);"></button>
        <input id="#${ctrl.name}" name="${ctrl.name}" class="ui_inp spinner input_t" type="number" oninput="resizeSpinner(this)" onkeydown="checkDown(this)" value="${formatted}" min="${ctrl.min}"
          max="${ctrl.max}" step="${ctrl.step}">
        <button class="icon icon_btn btn_no_pad" onclick="spinSpinner(this, 1);set_h('${ctrl.name}',EL('#${ctrl.name}').value);"></button>
      </div>
    </div>
  `;
  }
}
function spinSpinner(el, dir) {
  let num = (dir == 1) ? el.previousElementSibling : el.nextElementSibling;
  let val = Number(num.value) + Number(num.step) * Number(dir);
  val = Math.max(Number(num.min), val);
  val = Math.min(Number(num.max), val);
  num.value = formatToStep(val, num.step);
  resizeSpinner(num);
}
function resizeSpinner(el) {
  el.style.width = el.value.length + 'ch';
}
function resizeSpinners() {
  let spinners = document.querySelectorAll(".spinner");
  spinners.forEach((sp) => resizeSpinner(sp));
}

// flags
function addFlags(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let flags = "";
  let val = ctrl.value;
  let labels = ctrl.text.toString().split(',');
  for (let i = 0; i < labels.length; i++) {
    let ch = (!(val & 1)) ? '' : 'checked';
    val >>= 1;
    flags += `<label id="swlabel_${ctrl.name}" class="chbutton chtext">
    <input name="${ctrl.name}" type="checkbox" onclick="set_h('${ctrl.name}',encodeFlags('${ctrl.name}'))" ${ch}>
    <span class="chbutton_s chtext_s">${labels[i]}</span></label>`;
  }
  let col = (ctrl.color != null) ? `<style>#swlabel_${ctrl.name} input:checked+.chbutton_s{background:${intToCol(ctrl.color)}}</style>` : '';

  if (wid_row_id) {
    let inner = `${col}
      <div class="chbutton_cont chbutton_cont_tab flags_t" id='#${ctrl.name}'>
        ${flags}
      </div>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `${col}
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <div class="chbutton_cont flags_t" id='#${ctrl.name}'>
        ${flags}
      </div>
    </div>
  `;
  }
}
function resizeFlags() {
  let chtext = document.querySelectorAll(".chtext");
  let chtext_s = document.querySelectorAll(".chtext_s");
  chtext.forEach((ch, i) => {
    let len = chtext_s[i].innerHTML.length + 2;
    chtext[i].style.width = (len + 0.5) + 'ch';
    chtext_s[i].style.width = len + 'ch';
  });
}
function encodeFlags(name) {
  let weeks = document.getElementsByName(name);
  let encoded = 0;
  weeks.forEach((w, i) => {
    if (w.checked) encoded |= (1 << weeks.length);
    encoded >>= 1;
  });
  return encoded;
}

// canvas
function addCanvas(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  if (wid_row_id) {
    let inner = `
    <canvas onclick="clickCanvas('${ctrl.name}',event)" class="${ctrl.active ? 'canvas_act' : ''} canvas_t" id="#${ctrl.name}"></canvas>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="cv_block">
      <canvas onclick="clickCanvas('${ctrl.name}',event)" class="${ctrl.active ? 'canvas_act' : ''} canvas_t" id="#${ctrl.name}"></canvas>
    </div>
    `;
  }
  canvases[ctrl.name] = { name: ctrl.name, width: ctrl.width, height: ctrl.height, value: ctrl.value };
}
function showCanvases() {
  Object.values(canvases).forEach(canvas => {
    let cv = EL('#' + canvas.name);
    if (!cv || !cv.parentNode.clientWidth) return;
    let rw = cv.parentNode.clientWidth;
    canvas.scale = rw / canvas.width;
    let rh = Math.floor(canvas.height * canvas.scale);
    cv.style.width = rw + 'px';
    cv.style.height = rh + 'px';
    cv.width = Math.floor(rw * ratio());
    cv.height = Math.floor(rh * ratio());
    canvas.scale *= ratio();
    drawCanvas(canvas);
  });
}
function drawCanvas(canvas) {
  let ev_str = '';
  let cv = EL('#' + canvas.name);

  function cv_map(v, h) {
    v *= canvas.scale;
    return v >= 0 ? v : (h ? cv.height : cv.width) - v;
  }
  function scale() {
    return canvas.scale;
  }

  let cx = cv.getContext("2d");
  const cmd_list = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin', 'globalCompositeOperation', 'globalAlpha', 'scale', 'rotate', 'rect', 'fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'arcTo', 'arc', 'fillText', 'strokeText', 'drawImage', 'roundRect', 'fill', 'stroke', 'beginPath', 'closePath', 'clip', 'save', 'restore'];
  const const_list = ['butt', 'round', 'square', 'square', 'bevel', 'miter', 'start', 'end', 'center', 'left', 'right', 'alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom', 'source-over', 'source-atop', 'source-in', 'source-out', 'destination-over', 'destination-atop', 'destination-in', 'destination-out', 'lighter', 'copy', 'xor', 'top', 'bottom', 'middle', 'alphabetic'];

  for (d of canvas.value) {
    let div = d.indexOf(':');
    let cmd = parseInt(d, 10);

    if (!isNaN(cmd) && cmd <= 37) {
      if (div == 1 || div == 2) {
        let val = d.slice(div + 1);
        let vals = val.split(',').map(v => (v > 0) ? v = Number(v) : v);
        if (cmd <= 2) ev_str += ('cx.' + cmd_list[cmd] + '=\'' + intToColA(val) + '\';');   // shadowColor
        else if (cmd <= 7) ev_str += ('cx.' + cmd_list[cmd] + '=' + (val * scale()) + ';'); // miterLimit
        else if (cmd <= 13) ev_str += ('cx.' + cmd_list[cmd] + '=\'' + const_list[val] + '\';');  // globalCompositeOperation
        else if (cmd <= 14) ev_str += ('cx.' + cmd_list[cmd] + '=' + val + ';');  // globalAlpha
        else if (cmd <= 16) ev_str += ('cx.' + cmd_list[cmd] + '(' + val + ');'); // rotate
        else if (cmd <= 26) {   // arcTo
          let str = 'cx.' + cmd_list[cmd] + '(';
          for (let i in vals) {
            if (i > 0) str += ',';
            str += `cv_map(${vals[i]},${(i % 2)})`;
          }
          ev_str += (str + ');');
        } else if (cmd == 27) { // arc
          ev_str += (`cx.${cmd_list[cmd]}(cv_map(${vals[0]},0),cv_map(${vals[1]},1),cv_map(${vals[2]},0),${vals[3]},${vals[4]},${vals[5]});`);
        } else if (cmd <= 29) { // strokeText
          ev_str += (`cx.${cmd_list[cmd]}(${vals[0]},cv_map(${vals[1]},0),cv_map(${vals[2]},1),${vals[3]});`);
        } else if (cmd == 30) { // drawImage
          let img = new Image();
          for (let i in vals) {
            if (i > 0) vals[i] = cv_map(vals[i], !(i % 2));
          }
          if (vals[0].startsWith('http://') || vals[0].startsWith('https://')) {
            img.src = vals[0];
          } else {
            hub.dev(focused).addFile(canvas.name, vals[0], { type: "cv_img", img: img });
          }

          img.onload = function () {
            ev = `cx.drawImage(img`;
            for (let i in vals) {
              if (i > 0) ev += ',' + vals[i];
            }
            if (vals.length - 1 == 3) {
              ev += ',' + vals[3] * img.height / img.width;
            }
            ev += ')';
            eval(ev);// TODO notify on fetch
          }

        } else if (cmd == 31) { // roundRect
          let str = 'cx.' + cmd_list[cmd] + '(';
          for (let i = 0; i < 4; i++) {
            if (i > 0) str += ',';
            str += `cv_map(${vals[i]},${(i % 2)})`;
          }
          if (vals.length == 5) str += `,${vals[4] * scale()}`;
          else {
            str += ',[';
            for (let i = 4; i < vals.length; i++) {
              if (i > 4) str += ',';
              str += `cv_map(${vals[i]},${(i % 2)})`;
            }
            str += ']';
          }
          ev_str += (str + ');');
        }
      } else {
        if (cmd >= 32) ev_str += ('cx.' + cmd_list[cmd] + '();');
      }
    } else {
      ev_str += d + ';';
    }
  }
  eval(ev_str);
  canvas.value = null;
}
function clickCanvas(id, e) {
  if (!(id in canvases)) return;
  let rect = EL('#' + id).getBoundingClientRect();
  let scale = canvases[id].scale;
  let x = Math.round((e.clientX - rect.left) / scale * ratio());
  if (x < 0) x = 0;
  let y = Math.round((e.clientY - rect.top) / scale * ratio());
  if (y < 0) y = 0;
  set_h(id, (x << 16) | y);
}

// gauge
function addGauge(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  if (wid_row_id) {
    let inner = `
    <canvas class="gauge_t" id="#${ctrl.name}"></canvas>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="cv_block cv_block_back">
      <canvas class="gauge_t" id="#${ctrl.name}"></canvas>
    </div>
    `;
  }
  gauges[ctrl.name] = { perc: null, name: ctrl.name, value: Number(ctrl.value), min: Number(ctrl.min), max: Number(ctrl.max), step: Number(ctrl.step), text: ctrl.text, color: ctrl.color };
}
function drawGauge(g) {
  let cv = EL('#' + g.name);
  if (!cv || !cv.parentNode.clientWidth) return;

  let perc = (g.value - g.min) * 100 / (g.max - g.min);
  if (perc < 0) perc = 0;
  if (perc > 100) perc = 100;
  if (g.perc == null) g.perc = perc;
  else {
    if (Math.abs(g.perc - perc) <= 0.2) g.perc = perc;
    else g.perc += (perc - g.perc) * 0.2;
    if (g.perc != perc) setTimeout(() => drawGauge(g), 30);
  }

  let cx = cv.getContext("2d");
  let v = themes[cfg.theme];
  let col = g.color == null ? intToCol(colors[cfg.maincolor]) : intToCol(g.color);
  let rw = cv.parentNode.clientWidth;
  let rh = Math.floor(rw * 0.47);
  cv.style.width = rw + 'px';
  cv.style.height = rh + 'px';
  cv.width = Math.floor(rw * ratio());
  cv.height = Math.floor(rh * ratio());

  cx.clearRect(0, 0, cv.width, cv.height);
  cx.lineWidth = cv.width / 8;
  cx.strokeStyle = theme_cols[v][4];
  cx.beginPath();
  cx.arc(cv.width / 2, cv.height * 0.97, cv.width / 2 - cx.lineWidth, Math.PI * (1 + g.perc / 100), Math.PI * 2);
  cx.stroke();

  cx.strokeStyle = col;
  cx.beginPath();
  cx.arc(cv.width / 2, cv.height * 0.97, cv.width / 2 - cx.lineWidth, Math.PI, Math.PI * (1 + g.perc / 100));
  cx.stroke();

  let font = cfg.font;
  /*NON-ESP*/
  font = 'PTSans Narrow';
  /*/NON-ESP*/

  cx.fillStyle = col;
  cx.font = '10px ' + font;
  cx.textAlign = "center";

  let text = g.text;
  let len = Math.max(
    (formatToStep(g.value, g.step) + text).length,
    (formatToStep(g.min, g.step) + text).length,
    (formatToStep(g.max, g.step) + text).length
  );
  if (len == 1) text += '  ';
  else if (len == 2) text += ' ';

  let w = Math.max(
    cx.measureText(formatToStep(g.value, g.step) + text).width,
    cx.measureText(formatToStep(g.min, g.step) + text).width,
    cx.measureText(formatToStep(g.max, g.step) + text).width
  );

  cx.fillStyle = theme_cols[v][3];
  cx.font = cv.width * 0.45 * 10 / w + 'px ' + font;
  cx.fillText(formatToStep(g.value, g.step) + g.text, cv.width / 2, cv.height * 0.93);

  cx.font = '10px ' + font;
  w = Math.max(
    cx.measureText(Math.round(g.min)).width,
    cx.measureText(Math.round(g.max)).width
  );
  cx.fillStyle = theme_cols[v][2];
  cx.font = cx.lineWidth * 0.55 * 10 / w + 'px ' + font;
  cx.fillText(g.min, cx.lineWidth, cv.height * 0.92);
  cx.fillText(g.max, cv.width - cx.lineWidth, cv.height * 0.92);
}
function showGauges() {
  Object.values(gauges).forEach(gauge => {
    drawGauge(gauge);
  });
}

// joystick
function addJoy(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let inner = `
    <div class="joyCont"><canvas id="#${ctrl.name}"></canvas></div>
  `;

  if (wid_row_id) {
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += inner;
  }
  joys[ctrl.name] = ctrl;
}
function showJoys() {
  for (let joy in joys) {
    joys[joy].joy = new Joystick(joy,
      joys[joy].type == 'dpad',
      intToCol(joys[joy].color == null ? colors[cfg.maincolor] : joys[joy].color),
      joys[joy].auto,
      joys[joy].exp,
      function (data) {
        input_h(joy, ((data.x + 255) << 16) | (data.y + 255));
      });
  }
}

// other
function addSpace(ctrl) {
  if (wid_row_id) {
    checkWidget(ctrl);
    wid_row_size += ctrl.tab_w;
    if (wid_row_size > 100) {
      beginWidgets();
      wid_row_size = ctrl.tab_w;
    }
    EL(wid_row_id).innerHTML += `
    <div class="widget" style="width:${ctrl.tab_w}%"><div class="widget_inner widget_noback"></div></div>
  `;
  } else {
    endButtons();
    EL('controls').innerHTML += `
    <div style="height:${ctrl.height}px"></div>
  `;
  }
}
function addTitle(ctrl) {
  if (!ctrl.value) return;
  endWidgets();
  endButtons();
  EL('controls').innerHTML += `
  <div class="control control_title">
    <span class="c_title">${ctrl.value}</span>
  </div>
  `;
}
function addLED(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let ch = ctrl.value ? 'checked' : '';
  if (ctrl.text && !isESP()) {
    if (wid_row_id) {
      let inner = `
      <label id="swlabel_${ctrl.name}" class="led_i_cont led_i_cont_tab"><input type="checkbox" class="switch_t" id='#${ctrl.name}' ${ch} disabled><span class="switch_i led_i led_i_tab">${ctrl.text}</span></label>
      `;
      addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
    } else {
      EL('controls').innerHTML += `
      <div class="control">
        <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
        <label id="swlabel_${ctrl.name}" class="led_i_cont"><input type="checkbox" class="switch_t" id='#${ctrl.name}' ${ch} disabled><span class="switch_i led_i">${ctrl.text}</span></label>
      </div>
    `;
    }
  } else {
    if (wid_row_id) {
      let inner = `
    <label class="led_cont"><input type="checkbox" class="switch_t" id='#${ctrl.name}' ${ch} disabled><span class="led"></span></label>
    `;
      addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
    } else {
      EL('controls').innerHTML += `
      <div class="control">
        <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
        <label class="led_cont"><input type="checkbox" class="switch_t" id='#${ctrl.name}' ${ch} disabled><span class="led"></span></label>
      </div>
    `;
    }
  }
}
// function addIcon(ctrl) {
//   if (checkDup(ctrl)) return;
//   checkWidget(ctrl);
//   endButtons();
//   if (isESP()) ctrl.text = "";
//   let col = (ctrl.color != null) ? `color:${intToCol(ctrl.color)}` : '';
//   if (wid_row_id) {
//     let inner = `
//     <span class="icon icon_t" id='#${ctrl.name}' style="${col}">${ctrl.text}</span>
//     `;
//     addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
//   } else {
//     EL('controls').innerHTML += `
//       <div class="control">
//         <label title='${ctrl.name}'>${ctrl.clabel}</label>
//         <span class="icon icon_t" id='#${ctrl.name}' style="${col}">${ctrl.text}</span>
//       </div>
//     `;
//   }
// }
function addLabel(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let col = (ctrl.color) ? (`color:${intToCol(ctrl.color)}`) : '';
  if (wid_row_id) {
    let inner = `
    <label class="c_label text_t c_label_tab" id='#${ctrl.name}' style="${col};font-size:${ctrl.size}px">${ctrl.value}</label>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <label class="c_label text_t" id='#${ctrl.name}' style="${col};font-size:${ctrl.size}px">${ctrl.value}</label>
    </div>
  `;
  }
}
function addSelect(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let elms = ctrl.text.toString().split(',');
  let options = '';
  for (let i in elms) {
    let sel = (i == ctrl.value) ? 'selected' : '';
    options += `<option value="${i}" ${sel}>${elms[i]}</option>`;
  }
  let col = (ctrl.color != null) ? `color:${intToCol(ctrl.color)}` : '';
  if (wid_row_id) {
    let inner = `
    <select class="ui_inp c_inp_block select_t" style="${col}" id='#${ctrl.name}' onchange="set_h('${ctrl.name}',this.value)">
      ${options}
    </select>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <div><label title='${ctrl.name}'>${ctrl.clabel}</label><span class="plabel" id="plabel#${ctrl.name}"></span></div>
      <select class="ui_inp c_inp_block select_t" style="${col}" id='#${ctrl.name}' onchange="set_h('${ctrl.name}',this.value)">
        ${options}
      </select>
    </div>
  `;
  }
}
function addLog(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  if (ctrl.value.endsWith('\n')) ctrl.value = ctrl.value.slice(0, -1);
  if (wid_row_id) {
    let inner = `
    <textarea id="#${ctrl.name}" title='${ctrl.name}' class="ui_inp c_log text_t" readonly>${ctrl.value}</textarea>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <textarea id="#${ctrl.name}" title='${ctrl.name}' class="ui_inp c_log text_t" readonly>${ctrl.value}</textarea>
    </div>
  `;
  }
}
function addDisplay(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let col = (ctrl.color != null) ? ('background:' + intToCol(ctrl.color)) : '';
  if (wid_row_id) {
    let inner = `
    <textarea id="#${ctrl.name}" title='${ctrl.name}' class="ui_inp c_area c_disp text_t" style="font-size:${ctrl.size}px;${col}" rows="${ctrl.rows}" readonly>${ctrl.value}</textarea>
    `;
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control">
      <textarea id="#${ctrl.name}" title='${ctrl.name}' class="ui_inp c_area c_disp text_t" style="font-size:${ctrl.size}px;${col}" rows="${ctrl.rows}" readonly>${ctrl.value}</textarea>
    </div>
  `;
  }
}
function addHTML(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let inner = `<div name="text" id="#${ctrl.name}" title='${ctrl.name}' class="c_text text_t">${ctrl.value}</div>`;
  if (wid_row_id) {
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control control_nob">
      ${inner}
    </div>
    `;
  }
}
function addImage(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let inner = `
    <div class="image_t" data-path="${ctrl.value}" id="#${ctrl.name}">${waiter()}</div>
    `;
  if (wid_row_id) {
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="cv_block cv_block_back">
    ${inner}
    </div>
    `;
  }
  hub.dev(focused).addFile(ctrl.name, ctrl.value, { type: "img" });// TODO notify on fetch
}
function addStream(ctrl, conn, ip) {
  checkWidget(ctrl);
  endButtons();
  let inner = '<label>No connection</label>';
  if (conn == Conn.WS && ip != 'unset') inner = `<img style="width:100%" src="http://${ip}:${ctrl.port}/">`;
  if (wid_row_id) {
    addWidget(ctrl.tab_w, '', ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="cv_block cv_block_back">
    ${inner}
    </div>
    `;
  }
}
function addTable(ctrl) {
  if (checkDup(ctrl)) return;
  checkWidget(ctrl);
  endButtons();
  let aligns = ctrl.align.split(',');
  let widths = ctrl.width.split(',');
  let valArr = ctrl.value.split('.');
  let isFile = (valArr.length == 2 && valArr[1] == 'csv');
  let inner = `<div id="#${ctrl.name}" style="display:contents" class="csv_t" data-path="${isFile ? ctrl.value : ''}">`;

  if (isFile) {   // *.csv
    hub.dev(focused).addFile(ctrl.name, ctrl.value, { type: "csv", aligns: aligns, widths: widths });
    inner += waiter();
  } else {
    inner += renderTable(ctrl.value, aligns, widths);
  }
  inner += '</div>';

  if (wid_row_id) {
    addWidget(ctrl.tab_w, ctrl.name, ctrl.wlabel, inner);
  } else {
    EL('controls').innerHTML += `
    <div class="control control_nob">
      ${inner}
    </div>
    `;
  }
}

// ================ WIDGET =================
function checkWidget(ctrl) {
  if (ctrl.tab_w && !wid_row_id) beginWidgets(null, true);
}
function beginWidgets(ctrl = null, check = false) {
  if (!check) endButtons();
  wid_row_size = 0;
  if (hub.dev(focused).info.break_rows) return;

  let st = (ctrl && ctrl.height) ? `style="height:${ctrl.height}px"` : '';
  wid_row_id = 'widgets_row#' + wid_row_count;
  wid_row_count++;
  EL('controls').innerHTML += `
    <div class="widget_row" id="${wid_row_id}" ${st}></div>
  `;
}
function endWidgets() {
  endButtons();
  wid_row_id = null;
}
function addWidget(width, name, label, inner, height = 0, noback = false) {
  wid_row_size += width;
  if (wid_row_size > 100) {
    beginWidgets();
    wid_row_size = width;
  }

  let h = height ? ('height:' + height + 'px') : '';
  let lbl = (label && label != '_no') ? `<div class="widget_label" title="${name}">${label}<span class="plabel" id="plabel#${name}"></span></div>` : '';
  EL(wid_row_id).innerHTML += `
  <div class="widget" style="width:${width}%;${h}">
    <div class="widget_inner ${noback ? 'widget_noback' : ''}">
      ${lbl}
      <div class="widget_block">
        ${inner}
      </div>
    </div>
  </div>
  `;
}

// ================ UTILS =================
function renderTable(csv, widths, aligns) {
  let table = parseCSV(csv);
  let inner = `<table class="c_table">`;
  for (let row of table) {
    inner += '<tr>';
    for (let col in row) {
      inner += `<td width="${widths[col] ? (widths[col] + '%') : ''}" align="${aligns[col] ? aligns[col] : 'center'}">${row[col]}</td>`;
    }
    inner += '</tr>';
  }
  inner += '</table>';
  return inner;
}
function showNotif(name, text) {
  if (!("Notification" in window) || Notification.permission != 'granted') return;
  let descr = name + ' (' + new Date(Date.now()).toLocaleString() + ')';
  navigator.serviceWorker.getRegistration().then(function (reg) {
    reg.showNotification(text, { body: descr, vibrate: true });
  });
  //new Notification(text, {body: descr});
  //self.registration.showNotification(text, {body: descr});
}
function formatToStep(val, step) {
  step = step.toString();
  if (step.includes('.')) return Number(val).toFixed((step.split('.')[1]).toString().length);
  else return val;
}
function scrollDown() {
  let logs = document.querySelectorAll(".c_log");
  logs.forEach((log) => log.scrollTop = log.scrollHeight);
}