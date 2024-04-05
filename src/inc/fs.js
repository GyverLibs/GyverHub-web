let fs_arr = [];

// ============ FS BROWSER ============
function showFsbr(device, fs, total, used) {
  fs_arr = [];
  for (const path in fs) fs_arr.push(path);
  fs_arr = sortPaths(fs_arr, '/');

  let inner = '';
  for (const i in fs_arr) {
    if (fs_arr[i].endsWith('/')) {
      inner += `<div class="fs-file fs-folder drop-area" onclick="upload_h('${fs_arr[i]}')" ondrop="upload_file(event.dataTransfer.files[0],'${fs_arr[i]}')">${fs_arr[i]}</div>`;
    } else {
      const none = "style='display:none'";
      inner += `<div class="fs-file" onclick="openFSctrl(${i})">${fs_arr[i]}<div class="fs-weight">${(fs[fs_arr[i]] / 1000).toFixed(2)} kB</div></div>
        <div id="fs#${i}" class="fs-controls">
          <button ${device.isModuleEnabled(Modules.RENAME) ? '' : none} title="${lang.rename}" class="icon icon-btn-big" onclick="renameFile(${i})"></button>
          <button ${device.isModuleEnabled(Modules.DELETE) ? '' : none} title="${lang.delete}" class="icon icon-btn-big" onclick="deleteFile(${i})"></button>
          <button ${device.isModuleEnabled(Modules.FETCH) ? '' : none} title="${lang.fetch}" class="icon icon-btn-big" onclick="fetchFile(${i},'${fs_arr[i]}')"></button>
          <label id="process#${i}"></label>
          <a id="download#${i}" title="${lang.download}" class="icon icon-btn-big" href="" download="" style="display:none"></a>
          <button id="open#${i}" title="${lang.open}" class="icon icon-btn-big" onclick="openFile(EL('download#${i}').href)" style="display:none"></button>
          <button ${device.isModuleEnabled(Modules.UPLOAD) ? '' : none} id="edit#${i}" title="${lang.edit}" class="icon icon-btn-big" onclick="editFile(EL('download#${i}').href,${i})" style="display:none"></button>
        </div>`;
    }
  }
  if (total) {
    inner += `<div class="fs-info" style="background-image:linear-gradient(90deg,var(--prim) ${used / total * 100}%, var(--back) 0%);">${lang.fs_used} ${(used / 1000).toFixed(2)}/${(total / 1000).toFixed(2)} kB [${Math.round(used / total * 100)}%]</div>`;
  } else {
    inner += `<div class="fs-info">${lang.fs_used} ${(used / 1000).toFixed(2)} kB</div>`;
  }
  EL('fsbr_inner').innerHTML = inner;
}
function openFSctrl(i) {
  const current = EL(`fs#${i}`).style.display == 'flex';
  document.querySelectorAll('.fs-controls').forEach(el => el.style.display = 'none');
  if (!current) display(`fs#${i}`, 'flex');
}


// ============ TRANSFER ============
function upload_h(dirname = '/') {
  const $in = document.createElement('input');
  $in.type = 'file';
  $in.addEventListener('change', async () => {
    upload_file($in.files[0], dirname);
  });
  $in.click();
}

async function upload_file(file, dirname = '/') {
  if (!dirname.endsWith('/')) dirname += '/';
  const path = await asyncPrompt(lang.fs_name, dirname + file.name, lang.fs_upload);
  if (!path) return;
  uploadFile(file, path);
}
function openFile(src) {
  let w = window.open();
  src = w.document.write('<iframe src="' + src + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}
async function uploadFile(file, path) {
  if (!path.startsWith('/')) path = '/' + path;

  EL('fs_upload').innerHTML = waiter(22, 'var(--font_inv)', false);

  try {
    await hub.dev(focused).upload(file, path, perc => {
      showPopup(lang.upload + '... ' + perc + '%');
    });
  } catch (e) {
    EL('fs_upload').textContent = lang.fs_upload;
    showPopupError(`[${lang.upload}] ` + getError(e));
    return;
  }

  EL('fs_upload').textContent = lang.fs_upload;
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
  if (platform() != 'mobile') display('open#' + index, 'inline-block');
  display('process#' + index, 'none');
}

// ============ FILE UTILS ============

async function format_h() {
  if (!await asyncConfirm(lang.fs_format + '?')) return;
  try {
    await hub.dev(focused).formatFS();
  } catch (e) {
    showPopupError('[FS] ' + getError(e));
  }
}

async function create_h() {
  const path = await asyncPrompt(lang.fs_name, '/', lang.fs_create_f);
  if (!path) return;

  if (path[0] != '/') path = '/' + path;
  try {
    await hub.dev(focused).createFile(path);
  } catch (e) {
    showPopupError('[FS] ' + getError(e));
  }
}

async function deleteFile(i) {
  if (!await asyncConfirm(lang.delete + ' ' + fs_arr[i] + '?')) return;
  try {
    await hub.dev(focused).deleteFile(fs_arr[i]);
  } catch (e) {
    showPopupError('[FS] ' + getError(e));
  }
}

async function renameFile(i) {
  const path = fs_arr[i];
  const res = await asyncPrompt(lang.rename + ' ' + path + ':', path);
  if (!res || res == path) return;
  try {
    await hub.dev(focused).renameFile(path, res);
  } catch (e) {
    showPopupError('[FS] ' + getError(e));
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
  const name = fs_arr[edit_idx].slice(div + 1);
  uploadFile(new File([EL('editor_area').value], name, { type: getMime(name), lastModified: new Date() }), fs_arr[edit_idx]);
}
