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

  const $root = EL('controls');
  $root.replaceChildren(...renderer.build());

  if (cfg.wide_mode) {
      $root.style.display = 'grid';
      $root.style.gridTemplateColumns = `repeat(auto-fit, ${device.info.main_width}px)`;
      $root.style.maxWidth = 'unset';
      $root.style.justifyContent = 'center';
  } else {
      $root.style.display = 'block';
      $root.style.maxWidth = device.info.main_width + 'px'
  }
}