// ================== POST ==================
const oninput_prd = 10;
let oninp_buffer = {};

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
function showControls(controls, from_buffer = false, conn = Conn.NONE, ip = null) {
  let contIdx = 0;
  let prevWidth = 1;

  function addCont(type, contID, width) {
    contIdx++;
    let id = 'container#' + contIdx;
    EL(contID).innerHTML += `
      <div class="${'widget_' + type}" id="${id}" style="width:${width}%"></div>
    `;
    return id;
  }
  function renderControls(contID, type, data, single) {
    if (type == 'row') {
      let sumw = 0;
      for (let ctrl of data) {
        if (!ctrl.width) ctrl.width = prevWidth;
        else prevWidth = ctrl.width;
        sumw += ctrl.width;
      }
      for (let ctrl of data) ctrl.width = ctrl.width * 100 / sumw;
    } else {
      for (let ctrl of data) ctrl.width = 100;
    }

    for (let ctrl of data) {
      if (ctrl.type == 'row' || ctrl.type == 'col') {
        if (single) {
          renderControls(contID, 'col', ctrl.data, single);
        } else {
          let newCont = addCont(ctrl.type, contID, ctrl.width);
          renderControls(newCont, ctrl.type, ctrl.data, single);
        }
      } else {
        if (ctrl.id && EL('#' + ctrl.id)) {
          if (dup_names.length) dup_names += ', ';
          dup_names += ctrl.id;
          continue;
        }

        let wid = renderWidget(contID, ctrl);

        switch (ctrl.type) {
          case 'button': addButton(wid, ctrl); break;
          // case 'button_i': addButtonIcon(ctrl); break;
          // case 'spacer': addSpace(ctrl); break;
          // case 'tabs': addTabs(ctrl); break;
          // case 'title': addTitle(ctrl); break;
          // case 'led': addLED(ctrl); break;
          // case 'label': addLabel(ctrl); break;
          // case 'icon': addIcon(ctrl); break;
          case 'input': addInput(wid, ctrl); break;
          case 'pass': addPass(wid, ctrl); break;
          // case 'slider': addSlider(ctrl); break;
          // case 'sliderW': addSliderW(ctrl); break;
          // case 'switch': addSwitch(ctrl); break;
          // case 'switch_i': addSwitchIcon(ctrl); break;
          // case 'switch_t': addSwitchText(ctrl); break;
          // case 'date': addDate(ctrl); break;
          // case 'time': addTime(ctrl); break;
          // case 'datetime': addDateTime(ctrl); break;
          // case 'select': addSelect(ctrl); break;
          // case 'week': addWeek(ctrl); break;
          // case 'color': addColor(ctrl); break;
          // case 'spinner': addSpinner(ctrl); break;
          // case 'display': addDisplay(ctrl); break;
          // case 'html': addHTML(ctrl); break;
          // case 'flags': addFlags(ctrl); break;
          // case 'log': addLog(ctrl); break;
          // case 'row_b': case 'widget_b': beginWidgets(ctrl); break;
          // case 'row_e': case 'widget_e': endWidgets(); break;
          // case 'canvas': addCanvas(ctrl); break;
          // case 'gauge': addGauge(ctrl); break;
          // case 'image': addImage(ctrl); break;
          // case 'stream': addStream(ctrl, conn, ip); break;
          // case 'dpad': case 'joy': addJoy(ctrl); break;
          // case 'js': eval(ctrl.value); break;
          // case 'confirm': confirms[ctrl.name] = { label: ctrl.label }; break;
          // case 'prompt': prompts[ctrl.name] = { label: ctrl.label, value: ctrl.value }; break;
          // case 'menu': addMenu(ctrl); break;
          // case 'table': addTable(ctrl); break;
        }
      }
    }
  }
  function renderWidget(contID, ctrl) {
    let hint = 'ID: ' + ctrl.id + (ctrl.hint ? ('/n' + ctrl.hint) : '');
    let label = null;
    if (!ctrl.noback) {
      if (ctrl.label) {
        if (ctrl.label == '_nl') label = null;
        else label = ctrl.label;
      } else {
        label = ctrl.type;
      }
    }
    EL(contID).innerHTML += `
    <div class="widget" style="width:${ctrl.width}%">
      <div class="widget_inner id="winner#${ctrl.id}" ${(ctrl.noback && ctrl.noback == 1) ? 'widget_noback' : ''}">
        <div class="widget_label" id="wlabel_cont#${ctrl.id}" style="${label ? '' : 'display:none'}"><span id="wlabel#${ctrl.id}" title="${hint}" onclick="alert(this.title)">${label}</span><span class="plabel" id="plabel#${ctrl.id}"></span></div>
        <div class="widget_block ${ctrl.dsbl ? 'widget_dsbl' : ''}" id=widget#${ctrl.id}></div>
      </div>
    </div>
    `;
    return 'widget#' + ctrl.id;
  }

  if (!controls) return;
  let dev = hub.dev(focused);
  dev.resetFiles();
  let cont = EL('controls');
  cont.style.maxWidth = dev.info.ui_width + 'px';
  cont.style.visibility = 'hidden';
  if (dev.info.ui_mode >= 2) {
    cont.style.display = 'grid';
    cont.style.gridTemplateColumns = `repeat(auto-fit, minmax(${dev.info.ui_block_width}px, 1fr))`;
  } else {
    cont.style.display = 'block';
  }
  cont.innerHTML = '';
  oninp_buffer = {};
  gauges = {};
  canvases = {};
  pickers = {};
  joys = {};
  prompts = {};
  confirms = {};
  dup_names = '';
  addMenu(null);

  renderControls('controls', 'col', controls, (dev.info.ui_mode == 1 || dev.info.ui_mode == 3));

  // resizeFlags();
  // moveSliders();
  // scrollDown();
  // resizeSpinners();
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
      // showCanvases();
      // showGauges();
      // showPickers();
      // showJoys();
      EL('controls').style.visibility = 'visible';
      if (!from_buffer) hub.dev(focused).checkFiles();
      break;
    }
  }
}

// ================== MENU ==================
function addMenu(ctrl) {
  let inner = '';
  let labels = [];
  if (ctrl != null) {
    labels = ctrl.text.toString().split(',');
    for (let i in labels) {
      let sel = (i == ctrl.value) ? 'menu_act' : '';
      inner += `<div onclick="menuClick(${i})" class="menu_item ${sel}">${labels[i].trim()}</div>`;
    }
  }
  document.querySelector(':root').style.setProperty('--menu_h', ((labels.length + 3) * 35 + 10) + 'px');
  EL('menu_user').innerHTML = inner;
}
function menuClick(num) {
  menu_show(0);
  menuDeact();
  if (screen != 'ui') show_screen('ui');
  set_h('_menu', num);
}
function menuDeact() {
  let els = Array.from(document.getElementById('menu_user').children).filter(el => el.tagName == 'DIV');
  els.push(EL('menu_info'), EL('menu_fsbr'), EL('menu_ota'));
  for (let el in els) els[el].classList.remove('menu_act');
}