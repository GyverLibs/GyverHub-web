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
  ub.dev(focused).set(name, dir);
}
function post_set(name, value = '') {
  ub.dev(focused).set(name, value);
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
  if (UiButton.pressID) ub.dev(focused).set(UiButton.pressID, 0);
  UiButton.pressID = null;
}

// ================== SHOW ==================
let renderer;

function showControls(id, controls) {
  Ack.clearAll();

  set_prd_buf = {};

  renderer = new Renderer(id, controls);
  const $root = renderer.build();

  const excont = EL('controls#' + id);
  if (excont) {
    $root.id += '_new';
  }
  EL('controls').appendChild($root);

  wait2Frame().then(() => {
    if (excont) {
      excont.remove();
      $root.id = 'controls#' + id;
    }
    render_busy = false;
  });
}