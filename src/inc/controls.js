// ================== POST ==================
async function reboot_h() {
  await hub.dev(focused).reboot();
}

// ================== SHOW ==================
let renderer;

function showControls(id, controls) {
  if (renderer) renderer.close();
  const device = hub.dev(id);
  renderer = new Renderer(device, controls);

  const $root = document.getElementById('controls');
  $root.style.setProperty('--device-width', device.info.main_width + 'px');
  if (cfg.wide_mode) $root.classList.add('wide-mode');
  else $root.classList.remove('wide-mode');

  $root.replaceChildren(...renderer.build());
}