function makeDialog() {
  let box = document.createElement('div');
  box.className = 'dialog_box';
  document.body.appendChild(box);
  return box;
}

function asyncAlert(text, title = null) {
  return new Promise(resolve => {
    let box = makeDialog();
    let tit = title ? `<div class="ui_row ui_head">${title}</div>` : '';
    box.innerHTML = `
    <div class="ui_col ui_dialog">
      ${tit}
      <div class="ui_row">
        <label class="dialog_row">${text}</label>
      </div>
      <div class="ui_row">
        <div></div>
        <button id="alert_btn" class="ui_btn ui_btn_mini">OK</button>
      </div>
    </div>`;

    EL('alert_btn').onclick = () => {
      document.body.removeChild(box);
      resolve(true);
    };
  });
}

function asyncConfirm(text, title = null) {
  return new Promise(resolve => {
    let box = makeDialog();
    let tit = title ? `<div class="ui_row ui_head">${title}</div>` : '';
    box.innerHTML = `
    <div class="ui_col ui_dialog">
      ${tit}
      <div class="ui_row">
        <label class="dialog_row">${text}</label>
      </div>
      <div class="ui_row">
        <div></div>
        <div class="ui_btn_row">
          <button id="dia_yes" class="ui_btn ui_btn_mini">${lang.pop_yes}</button>
          <button id="dia_no" class="ui_btn ui_btn_mini">${lang.pop_no}</button>
        </div>
      </div>
    </div>`;

    EL('dia_yes').onclick = () => {
      document.body.removeChild(box);
      resolve(true);
    };
    EL('dia_no').onclick = () => {
      document.body.removeChild(box);
      resolve(false);
    };
  });
}

function asyncPrompt(text, placeh = '', title = null) {
  return new Promise(resolve => {
    let box = makeDialog();
    let tit = title ? `<div class="ui_row ui_head">${title}</div>` : '';
    box.innerHTML = `
    <div class="ui_col ui_dialog">
      ${tit}
      <div class="ui_row">
        <label class="dialog_row">${text}</label>
      </div>
      <div class="ui_row">
        <input id="dia_input" class="ui_inp" type="text" value="${placeh}">
      </div>
      <div class="ui_row">
        <div></div>
        <div class="ui_btn_row">
          <button id="dia_ok" class="ui_btn ui_btn_mini">OK</button>
          <button id="dia_cancel" class="ui_btn ui_btn_mini">${lang.cancel}</button>
        </div>
      </div>
    </div>`;

    EL('dia_ok').onclick = () => {
      let res = EL('dia_input').value;
      document.body.removeChild(box);
      resolve(res);
    };
    EL('dia_cancel').onclick = () => {
      document.body.removeChild(box);
      resolve(null);
    };
  });
}