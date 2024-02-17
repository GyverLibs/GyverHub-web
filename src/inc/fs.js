let fs_arr = [];

// ============ FS BROWSER ============
function showFsbr(fs, total, used) {
  fs_arr = [];
  for (const path in fs) fs_arr.push(path);
  fs_arr = sortPaths(fs_arr, '/');

  let inner = '';
  for (const i in fs_arr) {
    if (fs_arr[i].endsWith('/')) {
      inner += `<div class="fs_file fs_folder drop_area" onclick="file_upload_path.value='${fs_arr[i]}'/*;file_upload_btn.click()*/" ondrop="file_upload_path.value='${fs_arr[i]}';uploadFile(event.dataTransfer.files[0],'${fs_arr[i]}')">${fs_arr[i]}</div>`;
    } else {
      const none = "style='display:none'";
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
    inner += `<div class="fs_info" style="background-image:linear-gradient(90deg,var(--prim) ${used / total * 100}%, var(--back) 0%);">${lang.fs_used} ${(used / 1000).toFixed(2)}/${(total / 1000).toFixed(2)} kB [${Math.round(used / total * 100)}%]</div>`;
  } else {
    inner += `<div class="fs_info">${lang.fs_used} ${(used / 1000).toFixed(2)} kB</div>`;
  }
  EL('fsbr_inner').innerHTML = inner;
}
function openFSctrl(i) {
  const current = EL(`fs#${i}`).style.display == 'flex';
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
    data = await hub.dev(focused).fetch(path, 'url', perc => {
      EL('process#' + index).textContent = perc + '%';
    });
  } catch (e) {
    showPopupError(`[${lang.fetch}] ` + getError(e));
    EL('process#' + index).textContent = lang.error;
    return;
  }

  display('download#' + index, 'inline-block');
  const name = path.split('/').pop();
  EL('download#' + index).href = data;
  EL('download#' + index).download = name;
  display('edit#' + index, 'inline-block');
  display('process#' + index, 'none');
}

// ============ FILE UTILS ============
async function deleteFile(i) {
  if (await asyncConfirm(lang.delete + ' ' + fs_arr[i] + '?')) {
    await hub.dev(focused).deleteFile(fs_arr[i]);
  }
}
async function renameFile(i) {
  const path = fs_arr[i];
  const res = await asyncPrompt(lang.rename + ' ' + path + ':', path);
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
  show_screen('fsbr_edit');
  edit_idx = idx;
}
function editor_cancel() {
  show_screen('files');
}
function editor_save() {
  editor_cancel();
  const div = fs_arr[edit_idx].lastIndexOf('/');
  const path = fs_arr[edit_idx].slice(0, div);
  const name = fs_arr[edit_idx].slice(div + 1);
  uploadFile(new File([EL('editor_area').value], name, { type: getMime(name), lastModified: new Date() }), path);
}
