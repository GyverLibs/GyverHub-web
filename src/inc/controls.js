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

function post_click(name, dir) {
  UiButton.pressID = (dir == 1) ? name : null;
  ub.dev(focused).post('set', name, dir);
}
function post_set(name, value = '') {
  ub.dev(focused).post('set', name, value);
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
async function reboot_h() {
  await hub.dev(focused).reboot();
}
function release_all() {
  if (UiButton.pressID) ub.dev(focused).post('set', UiButton.pressID, 0);
  UiButton.pressID = null;
}

// ================== SHOW ==================
let ui_render = new UiRender();
let render_busy = false;

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
  UiHook.reset();
  UiColor.reset();
  UiGauge.reset();
  UiGaugeR.reset();
  UiGaugeL.reset();
  UiJoy.reset();
  UiDpad.reset();
  UiCanvas.reset();
  UiPlot.reset();
  ui_render.reset();
  Menu.clear();
  dev.resetFiles();

  ui_render.render(cont, 'col', controls, (dev.info.ui_mode == 1 || dev.info.ui_mode == 3));

  UiFunc.render(cont);
  if (ui_render.dup_names.length) showPopupError('Duplicated names: ' + ui_render.dup_names);
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