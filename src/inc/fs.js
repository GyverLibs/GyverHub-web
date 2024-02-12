let fs_arr = [];

// ============ FS BROWSER ============
function showFsbr(fs, total, used) {
  fs_arr = [];
  for (let path in fs) fs_arr.push(path);
  fs_arr = sortPaths(fs_arr, '/');

  let inner = '';
  for (let i in fs_arr) {
    if (fs_arr[i].endsWith('/')) {
      inner += `<div class="fs_file fs_folder drop_area" onclick="file_upload_path.value='${fs_arr[i]}'/*;file_upload_btn.click()*/" ondrop="file_upload_path.value='${fs_arr[i]}';uploadFile(event.dataTransfer.files[0],'${fs_arr[i]}')">${fs_arr[i]}</div>`;
    } else {
      let none = "style='display:none'";
      inner += `<div class="fs_file" onclick="openFSctrl(${i})">${fs_arr[i]}<div class="fs_weight">${(fs[fs_arr[i]] / 1000).toFixed(2)} kB</div></div>
        <div id="fs#${i}" class="fs_controls">
          <button ${hub.dev(focused).isModuleEnabled(Modules.RENAME) ? '' : none} title="${lang.rename}" class="icon icon_btn_big" onclick="renameFile(${i})"></button>
          <button ${hub.dev(focused).isModuleEnabled(Modules.DELETE) ? '' : none} title="${lang.delete}" class="icon icon_btn_big" onclick="deleteFile(${i})"></button>
          <button ${hub.dev(focused).isModuleEnabled(Modules.FETCH) ? '' : none} title="${lang.fetch}" class="icon icon_btn_big" onclick="fetchFile(${i},'${fs_arr[i]}')"></button>
          <label id="process#${i}"></label>
          <a id="download#${i}" title="${lang.download}" class="icon icon_btn_big" href="" download="" style="display:none"></a>
          <button ${hub.dev(focused).isModuleEnabled(Modules.UPLOAD) ? '' : none} id="edit#${i}" title="${lang.edit}" class="icon icon_btn_big" onclick="editFile(EL('download#${i}').href,${i})" style="display:none"></button>
        </div>`;
    }
  }
  if (total) {
    let color = adjustColor(getDefColor(), 0.9);
    let style = `background-repeat: no-repeat;background-image:linear-gradient(${color},${color});background-size: ${used / total * 100}% 100%;`;
    inner += `<div style="${style}" class="fs_info">${lang.fs_used} ${(used / 1000).toFixed(2)}/${(total / 1000).toFixed(2)} kB [${Math.round(used / total * 100)}%]</div>`;
  } else {
    inner += `<div class="fs_info">${lang.fs_used} ${(used / 1000).toFixed(2)} kB</div>`;
  }
  EL('fsbr_inner').innerHTML = inner;
}
function openFSctrl(i) {
  let current = EL(`fs#${i}`).style.display == 'flex';
  document.querySelectorAll('.fs_controls').forEach(el => el.style.display = 'none');
  if (!current) display(`fs#${i}`, 'flex');
}

async function create_h() {
  await hub.dev(focused).createFile(EL('file_create_path').value);
}


// ============ TRANSFER ============
async function uploadFile(file, path) {
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/') && path !== '/') path += '/';
  path += file.name;
  const res = await asyncConfirm(lang.fs_upload + ' ' + path + '?');
  if (!res) return;
  
  EL('file_upload_btn').innerHTML = waiter(22, 'var(--font_inv)', false);
  EL('file_upload').value = '';

  try {
    await hub.dev(focused).upload(file, path, perc => {
      showPopup(lang.upload + '... ' + perc + '%');
    });
  } catch (e) {
    EL('file_upload_btn').textContent = lang.upload;
    showPopupError(`[${lang.upload}] ` + getError(e));
    return;
  }

  EL('file_upload_btn').textContent = lang.upload;
  showPopup(`[${lang.upload}] ` + lang.done);
}
async function fetchFile(index, path) {
  display('download#' + index, 'none');
  display('edit#' + index, 'none');
  display('process#' + index, 'unset');
  EL('process#' + index).replaceChildren();

  let data;
  try {
    data = await hub.dev(focused).fetch(path, perc => {
      EL('process#' + index).textContent = perc + '%';
    });
  } catch (e) {
    showPopupError(`[${lang.fetch}] ` + getError(e));
    EL('process#' + index).textContent = lang.error;
    return;
  }

  display('download#' + index, 'inline-block');
  const name = path.split('/').pop();
  EL('download#' + index).href = ('data:' + getMime(name) + ';base64,' + data);
  EL('download#' + index).download = name;
  display('edit#' + index, 'inline-block');
  display('process#' + index, 'none');
}
async function uploadOta(file, type) {
  if (!file.name.endsWith(this.info.ota_t)) {
    asyncAlert(lang.wrong_ota + ' .' + this.info.ota_t);
    return;
  }

  const res = await asyncConfirm(lang.fs_upload + ' OTA ' + type + '?');
  if (!res) return;

  EL('ota_label').innerHTML = waiter(25, 'var(--font)', false);
  EL('ota_upload').value = '';
  EL('ota_upload_fs').value = '';

  try {
    await hub.dev(focused).uploadOta(file, type, perc => {
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

// ============ FILE UTILS ============
async function deleteFile(i) {
  if (hub.dev(focused).fsBusy()) {
    showPopupError(getError(HubErrors.FsBusy));
    return;
  }
  if (await asyncConfirm(lang.delete + ' ' + fs_arr[i] + '?')) {
    await hub.dev(focused).deleteFile(fs_arr[i]);
  }
}
async function renameFile(i) {
  if (hub.dev(focused).fsBusy()) {
    showPopupError(getError(HubErrors.FsBusy));
    return;
  }
  let path = fs_arr[i];
  let res = await asyncPrompt(lang.rename + ' ' + path + ':', path);
  if (res && res != path) {
    await hub.dev(focused).renameFile(path, res);
  }
}

// ============ EDITOR ============
let edit_idx = 0;

function editFile(data, idx) {
  EL('editor_area').value = dataTotext(data);
  EL('editor_area').scrollTop = 0;
  EL('edit_path').textContent = fs_arr[idx];
  display('files', 'none');
  display('fsbr_edit', 'block');
  edit_idx = idx;
}
function editor_cancel() {
  display('files', 'block');
  display('fsbr_edit', 'none');
}
function editor_save() {
  editor_cancel();
  let div = fs_arr[edit_idx].lastIndexOf('/');
  let path = fs_arr[edit_idx].slice(0, div);
  let name = fs_arr[edit_idx].slice(div + 1);
  uploadFile(new File([EL('editor_area').value], name, { type: getMime(name), lastModified: new Date() }), path);
}

// ============ OTA ============
async function otaUrl(url, type) {
  if (await asyncConfirm(lang.fs_upload + ' OTA?')) {
    showPopup('OTA start');
    try {
      await hub.dev(focused).otaUrl(type, url);
    } catch (e) {
      showPopupError('[OTA url] ' + getError(e));
      return;
    }
  }
  
  showPopup('[OTA] ' + lang.done);
}
