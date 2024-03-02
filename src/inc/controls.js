// ================== POST ==================
async function reboot_h() {
  await hub.dev(focused).reboot();
}

// ================== SHOW ==================
let renderer;

function showControls(device, controls) {
  if (!renderer) {
    renderer = new Renderer(device);
  
    renderer.addEventListener('menuchanged', () => {
      updateSystemMenu();
    });
  
    renderer.addEventListener('menuopen', () => {
      try {
          device.fsStop();
      } catch (e) { }
      enterMenu();
      if (screen != 'ui') show_screen('ui');
    });
  }

  renderer.update(controls);

  const $root = document.getElementById('controls');
  $root.style.setProperty('--device-width', device.info.main_width + 'px');
  if (cfg.wide_mode) $root.classList.add('wide-mode');
  else $root.classList.remove('wide-mode');

  $root.replaceChildren(...renderer.build());
}