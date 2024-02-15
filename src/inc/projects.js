async function loadProjects() {
  EL('projects_cont').replaceChildren(EL('projects_cont').lastElementChild);

  const resp = await fetch("https://raw.githubusercontent.com/GyverLibs/GyverHub-projects/main/projects.txt", { cache: "no-store" });
  let projects = await resp.text();
  projects = projects.split('\n');
  for (const proj of projects) {
    if (!proj) continue;
    const rep = proj.split('https://github.com/')[1];
    if (!rep) continue;
    loadProj(rep);
  }
}
async function loadProj(rep) {
  try {
    const manifest = `https://raw.githubusercontent.com/${rep}/main/project.json`;
    const resp = await fetch(manifest, { cache: "no-store" });
    const proj = await resp.json();
    if (!('name' in proj) || !('version' in proj) || !('about' in proj)) return;
    let name = proj.name;
    if (name.length > 30) name = name.slice(0, 30) + '..';

    /*@[if_target:host,desktop,local]*/
    EL('projects_cont').innerHTML = `
      <div class="proj">
          <div class="proj_name">
            <a href="${'https://github.com/' + rep}" target="_blank" title="${rep} v${proj.version}">${name}</a>
            <esp-web-install-button manifest="${manifest}">
              <button title="${lang.p_install}" class="icon icon_btn_big" style="font-size:15px" slot="activate"></button>
              <span slot="unsupported">${lang.p_not_support}</span>
              <span slot="not-allowed">${lang.p_use_https}</span>
            </esp-web-install-button>
          </div>
          <div class="proj_about">${proj.about}</div>
      </div>
    ` + EL('projects_cont').innerHTML;
    /*@/[if_target:host,desktop,local]*/
    /*@[if_not_target:host,desktop,local]*/
    EL('projects_cont').innerHTML += `
      <div class="proj">
        <div class="proj_name">
          <a href="${'https://github.com/' + rep}" target="_blank" title="${rep} v${proj.version}">${name}</a>
        </div>
        <div class="proj_about">${proj.about}</div>
      </div>
    `;
    /*@/[if_not_target:host,desktop,local]*/
  } catch (e) {
    return;
  }
}
