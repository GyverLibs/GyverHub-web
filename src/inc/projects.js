// ============== PROJECTS =============
/*NON-ESP*/
let updates = [];

async function checkUpdates(id) {
    if (!cfg.check_upd) return;
    if (updates.includes(id)) return;
    let ver = hub.dev(id).info.version;
    if (!ver.includes('@')) return;
    let namever = ver.split('@');
    const resp = await fetch(`https://raw.githubusercontent.com/${namever[0]}/master/project.json`, { cache: "no-store" });
    let proj = await resp.text();
    try {
      proj = JSON.parse(proj);
    } catch (e) {
      return;
    }
    if (proj.version == namever[1]) return;
    if (id != focused) return;
    updates.push(id);
    if (await asyncConfirm('Available new version v' + proj.version + ' for device [' + namever[0] + ']. Notes:\n' + proj.notes + '\n\nUpdate firmware?')) {
      if ('ota_url' in proj) otaUrl(proj.ota_url, 'flash');
      else otaUrl(`https://raw.githubusercontent.com/${namever[0]}/master/bin/firmware.bin${hub.dev(id).ota_t == 'bin' ? '' : ('.' + hub.dev(id).ota_t)}`, 'flash');
    }
  }
  async function pwa_install(ssl) {
    if (ssl && !isSSL()) {
      if (await asyncConfirm("Redirect to HTTPS?")) window.location.href = window.location.href.replace('http:', 'https:');
      else return;
    }
    if (!ssl && isSSL()) {
      if (await asyncConfirm("Redirect to HTTP")) window.location.href = window.location.href.replace('https:', 'http:');
      else return;
    }
    if (!('serviceWorker' in navigator)) {
      alert('Error');
      return;
    }
    if (deferredPrompt !== null) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') deferredPrompt = null;
    }
  }
  async function loadProjects() {
    const resp = await fetch("https://raw.githubusercontent.com/GyverLibs/GyverHub-projects/main/projects.txt", { cache: "no-store" });
    let projects = await resp.text();
    projects = projects.split('\n');
    for (let proj of projects) {
      if (!proj) continue;
      let rep = proj.split('https://github.com/')[1];
      if (!rep) continue;
      loadProj(rep);
    }
  }
  async function loadProj(rep) {
    try {
      const resp = await fetch(`https://raw.githubusercontent.com/${rep}/master/project.json`, { cache: "no-store" });
      let proj = await resp.json();
      if (!('version' in proj) || !('notes' in proj) || !('about' in proj)) return;
      let name = rep.split('/')[1];
      if (name.length > 30) name = name.slice(0, 30) + '..';
      EL('projects').innerHTML += `
      <div class="proj">
        <div class="proj_inn">
          <div class="proj_name">
            <a href="${'https://github.com/' + rep}" target="_blank" title="${rep} v${proj.version}">${name}</a>
            <!--<a href="javascript:void(0)" onclick="">[bin]</a>-->
          </div>
          <div class="proj_about">${proj.about}</div>
        </div>
      </div>
      `;
    } catch (e) {
      return;
    }
  }
  async function copyBin() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) { }
  }
  /*/NON-ESP*/