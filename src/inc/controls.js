// ================== POST ==================
async function reboot_h() {
  await hub.dev(focused).reboot();
}

// ================== SHOW ==================
let renderer;

function showControls(id, controls) {
  if (renderer) renderer.close();
  const device = hub.dev(id);
  renderer = new Renderer(device, controls, cfg.wide_mode);
  const $root = renderer.build();

  EL('controls').replaceChildren($root);
}