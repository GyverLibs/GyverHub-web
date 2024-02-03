// ================== POST ==================
const set_prd = 15;
let set_prd_buf = {};

function post_set(name, value = '') {
  hub.dev(focused).set(name, value);
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
  // if (UiButton.pressID) ub.dev(focused).set(UiButton.pressID, 0);
  // UiButton.pressID = null;
}

// ================== SHOW ==================
let renderer;

function showControls(id, controls) {
  if (renderer) renderer.close();
  const device = hub.dev(id);
  renderer = new Renderer(device, controls);
  const $root = renderer.build();

  EL('controls').replaceChildren($root);
}