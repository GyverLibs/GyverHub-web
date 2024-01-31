class Ack {
  static set(id) {
    Ack.clear(id);
    Ack.buf[id] = setTimeout(() => {
      Widget.setPlabel(id, '[' + lang.error.toUpperCase() + ']');
      delete Ack.buf[id];
    }, 1500);
  }
  static clear(id) {
    Widget.setPlabel(id);
    if (Ack.buf[id]) {
      clearTimeout(Ack.buf[id]);
      delete Ack.buf[id];
    }
  }
  static clearAll() {
    for (let id in Ack.buf) Ack.clear(id);
  }

  static buf = {};
};

// ================== POST ==================
const set_prd = 15;
let set_prd_buf = {};

function post(cmd, name = '', value = '') {
  if (focused) hub.post(focused, cmd, name, value);
}
function post_click(name, dir) {
  UiButton.pressID = (dir == 1) ? name : null;
  post('set', name, dir);
}
function post_set(name, value = '') {
  post('set', name, value);
  // Widget.setPlabel(name, '•');
  Ack.set(name);
}
function post_set_prd(name, value) {
  if (!(name in set_prd_buf)) set_prd_buf[name] = { value: null, tout: null };

  if (!set_prd_buf[name].tout) {
    post_set(name, value);
    set_prd_buf[name].tout = setTimeout(() => {
      if (set_prd_buf[name] && set_prd_buf[name].value != null) {
        post_set(name, set_prd_buf[name].value);
      }
      delete set_prd_buf[name];
    }, set_prd);
  } else {
    set_prd_buf[name].value = value;
  }
}
function reboot_h() {
  post('reboot');
}
function release_all() {
  if (UiButton.pressID) post('set', UiButton.pressID, 0);
  UiButton.pressID = null;
}

// ================== SHOW ==================
let render_busy = false;

let ui_render = new UiRender();
ui_render.add('hook', UiHook);
ui_render.add('input', UiInput);
ui_render.add('pass', UiPass);
ui_render.add('area', UiArea);
ui_render.add('button', UiButton);
ui_render.add('switch_t', UiSwitch);
ui_render.add('switch_i', UiSwicon);
ui_render.add('label', UiLabel);
ui_render.add('title', UiTitle);
ui_render.add('display', UiDisplay);
ui_render.add('text', UiText);
ui_render.add('text_f', UiText_f);
ui_render.add('image', UiImage);
ui_render.add('table', UiTable);
ui_render.add('log', UiLog);
ui_render.add('date', UiDate);
ui_render.add('time', UiTime);
ui_render.add('datetime', UiDateTime);
ui_render.add('slider', UiSlider);
ui_render.add('spinner', UiSpinner);
ui_render.add('select', UiSelect);
ui_render.add('color', UiColor);
ui_render.add('led', UiLED);
ui_render.add('icon', UiIcon);
ui_render.add('html', UiHTML);
ui_render.add('gauge', UiGauge);
ui_render.add('gauge_r', UiGaugeR);
ui_render.add('gauge_l', UiGaugeL);
ui_render.add('joy', UiJoy);
ui_render.add('dpad', UiDpad);
ui_render.add('flags', UiFlags);
ui_render.add('tabs', UiTabs);
ui_render.add('canvas', UiCanvas);
ui_render.add('plot', UiPlot);
ui_render.add('stream', UiStream);
ui_render.add('confirm', UiConfirm);
ui_render.add('prompt', UiPrompt);
ui_render.add('js', UiJS);
ui_render.add('css', UiCSS);
ui_render.add('plugin', UiPlugin);

function showControls(id, controls) {
  Ack.clearAll();
  if (!controls) return;
  if (render_busy) return;

  render_busy = true;
  let dev = hub.dev(id);
  let cont = document.createElement("div");
  ui_render.root = cont;
  cont.classList.add('main_col');
  cont.style.visibility = 'hidden';
  cont.id = 'controls#' + id;
  cont.style.maxWidth = dev.info.main_width + 'px';
  if (dev.info.ui_mode >= 2) {
    cont.style.display = 'grid';
    cont.style.gridTemplateColumns = `repeat(auto-fit, minmax(${dev.info.ui_block_width}px, 1fr))`;
  } else {
    cont.style.display = 'block';
  }
  let excont = EL('controls#' + id);
  if (excont) {
    cont.id += '_new';
    addIdRecursive(excont, '__old');
  }
  EL('controls').appendChild(cont);

  set_prd_buf = {};
  ui_render.clearWidgets();
  ui_render.reset();
  Menu.clear();
  dev.resetFiles();

  ui_render.render(cont, 'col', controls, (dev.info.ui_mode == 1 || dev.info.ui_mode == 3));

  UiFunc.show(cont);
  if (ui_render.dup_names.length) showPopupError(lang.dup_names + ': ' + ui_render.dup_names);
  hub.dev(focused).checkFiles();
  UiHook.update();

  wait2Frame().then(() => {
    if (excont) {
      excont.remove();
      cont.id = 'controls#' + id;
    }
    cont.style.visibility = 'visible';
    render_busy = false;
  });
}