// updates
const updates_list = [];
async function getUpdateInfo(dev) {
  if (updates_list.includes(dev.info.id)) return;

  /** @type {string} */
  const ver = dev.info.version;
  if (!ver || !ver.includes('@')) return;

  const namever = ver.split('@', 2);
  let proj;
  try {
    const resp = await fetch("https://raw.githubusercontent.com/"+namever[0]+"/main/project.json", { cache: "no-store" });
    proj = await resp.json();
  } catch (e) {
    return;
  }

  if (!('builds' in proj) || !('version' in proj) || proj.version === namever[1]) return;

  updates_list.push(dev.info.id);
  const platform = dev.info.platform;
  for (const build of proj.builds) {
    if (build.chipFamily === platform) 
      return {
        name: namever[0],
        version: proj.version,
        notes: proj.notes,
        url: build.parts[0].path,
      };
    {
      const text = `${namever[0]} v${proj.version}:\n${proj.notes}\n\n${lang.p_upd}?`;
      if (await asyncConfirm(text, lang.p_has_upd + '!')) otaUrl(build.parts[0].path, 'flash');
      break;
    }
  }
}

async function installOta(dev, type, url) {
    showPopup('OTA start');
    try {
        await dev.otaUrl(type, url);
    } catch (e) {
        showPopupError('[OTA url] ' + getError(e));
        return;
    }
    showPopup('[OTA] ' + lang.done);
}

async function checkUpdates(dev) {
    if (!cfg.check_upd) return;
    
    const upd = await getUpdateInfo(dev);
    if (!upd) return;
    
    const text = `${upd.name} v${upd.version}:\n${upd.notes}\n\n${lang.p_upd}?`;
    if (!await asyncConfirm(text, lang.p_has_upd + '!')) return;
    
    await installOta(dev, 'flash', upd.url);
}

async function otaUrl(url, type) {
    if (!await asyncConfirm(lang.fs_upload + ' OTA?'))
      return;
  
    await installOta(hub.dev(focused), type, url);
}

async function uploadOta(file, type) {
    const dev = hub.dev(focused);

    if (!file.name.endsWith(dev.info.ota_t)) {
      asyncAlert(lang.wrong_ota + ' .' + dev.info.ota_t);
      return;
    }
  
    const res = await asyncConfirm(lang.fs_upload + ' OTA ' + type + '?');
    if (!res) return;
  
    EL('ota_label').innerHTML = waiter(25, 'var(--font)', false);
    EL('ota_upload').value = '';
    EL('ota_upload_fs').value = '';
  
    try {
      await dev.uploadOta(file, type, perc => {
        EL('ota_label').textContent = perc + '%';
      });
    } catch (e) {
      showPopupError('[OTA] ' + getError(e));
      EL('ota_label').textContent = lang.error;
      return;
    }
  
    showPopup('[OTA] ' + lang.done);
    EL('ota_label').textContent = lang.done;
}
