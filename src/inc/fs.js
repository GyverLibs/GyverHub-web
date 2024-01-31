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
          <button ${hub.dev(focused).module(Modules.RENAME) ? '' : none} title="${lang.rename}" class="icon icon_btn_big" onclick="renameFile(${i})"></button>
          <button ${hub.dev(focused).module(Modules.DELETE) ? '' : none} title="${lang.delete}" class="icon icon_btn_big" onclick="deleteFile(${i})"></button>
          <button ${hub.dev(focused).module(Modules.FETCH) ? '' : none} title="${lang.fetch}" class="icon icon_btn_big" onclick="fetchFile(${i},'${fs_arr[i]}')"></button>
          <label id="process#${i}"></label>
          <a id="download#${i}" title="${lang.download}" class="icon icon_btn_big" href="" download="" style="display:none"></a>
          <button id="open#${i}" title="${lang.open}" class="icon icon_btn_big" onclick="openFile(EL('download#${i}').href)" style="display:none"></button>
          <button ${hub.dev(focused).module(Modules.UPLOAD) ? '' : none} id="edit#${i}" title="${lang.edit}" class="icon icon_btn_big" onclick="editFile(EL('download#${i}').href,'${i}')" style="display:none"></button>
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

function create_h() {
  post('mkfile', EL('file_create_path').value);
}


// ============ TRANSFER ============
function uploadFile(file, path) {
  hub.dev(focused).upload(file, path);
  EL('file_upload').value = '';
}
function fetchFile(index, path) {
  hub.dev(focused).fetch(index, path);
}
function uploadOta(file, type) {
  hub.dev(focused).uploadOta(file, type);
  EL('ota_upload').value = '';
  EL('ota_upload_fs').value = '';
}

// ============ FILE UTILS ============
async function deleteFile(i) {
  if (hub.dev(focused).fsBusy()) {
    showPopupError(getError(HubErrors.FsBusy));
    return;
  }
  if (await asyncConfirm(lang.delete + ' ' + fs_arr[i] + '?')) {
    post('delete', fs_arr[i]);
  }
}
async function renameFile(i) {
  if (hub.dev(focused).fsBusy()) {
    showPopupError(getError(HubErrors.FsBusy));
    return;
  }
  let path = fs_arr[i];
  let res = await asyncPrompt(lang.rename + ' ' + path + ':', path);
  if (res && res != path) post('rename', path, res);
}

// ============ EDITOR ============
let edit_idx = 0;

function editFile(data, idx) {
  EL('editor_area').value = dataTotext(data);
  EL('editor_area').scrollTop = 0;
  EL('edit_path').innerHTML = fs_arr[idx];
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
  //EL('download#' + edit_idx).href = ('data:' + getMime(name) + ';base64,' + window.btoa(EL('editor_area').value));
  uploadFile(new File([EL('editor_area').value], name, { type: getMime(name), lastModified: new Date() }), path);
}

// ============ OTA ============
async function otaUrl(url, type) {
  if (await asyncConfirm(lang.fs_upload + ' OTA?')) {
    post('ota_url', type, url);
    showPopup('OTA start');
  }
}