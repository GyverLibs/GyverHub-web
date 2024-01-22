/*NON-ESP*/
// ============== PROJECTS =============
// updates
let updates_list = [];
async function checkUpdates(id) {
  if (!cfg.check_upd) return;
  if (updates_list.includes(id)) return;
  let ver = hub.dev(id).info.version;
  if (!ver.includes('@')) return;
  let namever = ver.split('@');
  let proj;
  try {
    const resp = await fetch("https://raw.githubusercontent.com/"+namever[0]+"/main/project.json", { cache: "no-store" });
    proj = await resp.text();
    proj = JSON.parse(proj);
  } catch (e) {
    return;
  }
  if (!('builds' in proj) || !('version' in proj)) return;
  if (proj.version == namever[1]) return;
  if (id != focused) return;
  updates_list.push(id);
  const platform = hub.dev(id).info.platform;
  for (build of proj.builds) {
    if (build.chipFamily == platform) {
      const text = `${lang.p_has_upd}!\n${namever[0]} v${proj.version}:\n${proj.notes}\n\n${lang.p_upd}?`;
      if (await asyncConfirm(text)) otaUrl(build.parts[0].path, 'flash');
      break;
    }
  }
}

// projects
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
    const manifest = `https://raw.githubusercontent.com/${rep}/main/project.json`;
    const resp = await fetch(manifest, { cache: "no-store" });
    let proj = await resp.json();
    if (!('name' in proj) || !('version' in proj) || !('about' in proj)) return;
    let name = proj.name;
    let repname = rep.split('/')[1];
    if (name.length > 30) name = name.slice(0, 30) + '..';
    let allowInstall = (platform() == 'host' || platform() == 'desktop');
    const btn = allowInstall ? `<button title="${lang.p_install}" class="icon icon_btn_big" style="font-size:15px" onclick="EL('proj_${repname}').click()"></button>` : '';

    EL('projects').innerHTML += `
      <div class="proj">
        <div class="proj_inn">
          <div class="proj_name">
            <a href="${'https://github.com/' + rep}" target="_blank" title="${rep} v${proj.version}">${name}</a>
            ${btn}
          </div>
          <div class="proj_about">${proj.about}</div>
        </div>
      </div>`;

    if (allowInstall) EL('projects').innerHTML += `
    <esp-web-install-button manifest="${manifest}" style="display:none">
      <button id="proj_${repname}" slot="activate"></button>
      <span slot="unsupported">${lang.p_not_support}</span>
      <span slot="not-allowed">${lang.p_use_https}</span>
    </esp-web-install-button>`;
  } catch (e) {
    return;
  }
}
/*/NON-ESP*/