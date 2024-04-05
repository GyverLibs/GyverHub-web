async function loadProjects() {
  EL('projects_cont').replaceChildren(EL('projects_cont').lastElementChild);

  let projects;
  try {
    projects = await downloadFile(checkGitLink('https://github.com/GyverLibs/GyverHub-projects/blob/main/projects.txt'));
    projects = await projects.text();
  } catch (e) {
    return;
  }
  projects += '\n' + cfg.project_links;
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
    const resp = await downloadFile(manifest);
    const proj = await resp.json();
    if (!('name' in proj) || !('version' in proj) || !('about' in proj)) return;
    let name = proj.name;
    if (name.length > 30) name = name.slice(0, 30) + '..';
    const ctor = customElements.get('esp-web-install-button');
    const installButton = `
      <esp-web-install-button manifest="${manifest}">
        <button title="${lang.p_install}" class="icon icon-btn-big" style="font-size:15px" slot="activate"></button>
        <!--<span slot="unsupported">${lang.p_not_support}</span>-->
        <span slot="not-allowed">${lang.p_use_https}</span>
      </esp-web-install-button>
    `;
    EL('projects_cont').innerHTML = `
      <div class="proj">
          <div class="proj-name">
            <a href="${'https://github.com/' + rep}" target="_blank" title="${rep} v${proj.version}">${name}</a>
            ${ctor ? installButton : ''}
          </div>
          <div class="proj-about">${proj.about}</div>
      </div>
    ` + EL('projects_cont').innerHTML;
  } catch (e) {
    return;
  }
}
