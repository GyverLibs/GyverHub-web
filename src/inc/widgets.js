let touch = 0;
let pressId = null;
let dup_names = '';
let gauges = {};
let canvases = {};
let pickers = {};
let joys = {};
let prompts = {};
let confirms = {};
let dis_scroll_f = false;

// input/pass
function addInput(wid, ctrl) {
  let id = '#' + ctrl.id;
  EL(wid).innerHTML = `
    <div class="w_inp_cont">
      <input data-type="${ctrl.type}" class="w_inp" type="text" value="${ctrl.value ?? ''}" id="${id}" name="${ctrl.id}" onkeydown="checkDown(this,event)" oninput="checkInput(this)" pattern="${ctrl.regex ?? ''}" maxlength="${ctrl.max ?? ''}" onfocusout="sendInput(this)">
    </div>
  `;
  addInputColor(EL(id), ctrl.color);
}
function addPass(wid, ctrl) {
  let id = '#' + ctrl.id;
  EL(wid).innerHTML = `
    <div class="w_inp_cont">
      <input data-type="${ctrl.type}" class="w_inp" type="password" value="${ctrl.value ?? ''}" id="#${ctrl.id}" name="${ctrl.id}" onkeydown="checkDown(this,event)" oninput="checkInput(this)" pattern="${ctrl.regex ?? ''}" maxlength="${ctrl.max ?? ''}" onfocusout="sendInput(this)">
      <div class="btn_inp_block">
        <button class="icon w_eye" onclick="togglePass('#${ctrl.id}')"></button>
      </div>
    </div>
  `;
  addInputColor(EL(id), ctrl.color);
}
function addInputColor(el, color) {
  if (color) el.style.boxShadow = '0px 2px 0px 0px ' + intToCol(color);
}
function sendInput(arg, force = false) {
  if (arg.pattern) {
    const r = new RegExp(arg.pattern);
    if (!r.test(arg.value)) {
      showPopupError("Wrong text!");
      return;
    }
  }
  if (force || arg.getAttribute('data-changed')) {
    arg.removeAttribute('data-changed');
    set_h(arg.name, arg.value);
  }
}
function checkInput(arg) {
  setPlabel(arg.name, '•');
  arg.setAttribute('data-changed', '1');
}
function checkDown(arg, event) {
  if (event.key == 'Enter') sendInput(arg, true);
}
function togglePass(id) {
  if (EL(id).type == 'text') EL(id).type = 'password';
  else EL(id).type = 'text';
}

// button
function addButton(wid, ctrl) {
  if (isESP()) ctrl.text = "";
  EL(wid).innerHTML = `
    <button id="#${ctrl.id}" style="font-size:${ctrl.size ?? 45}px;color:${intToCol(ctrl.color) ?? 'var(--prim)'}" class="icon w_btn" onclick="set_h('${ctrl.id}',2)" onmousedown="if(!touch)click_h('${ctrl.id}',1)" onmouseup="if(!touch&&pressId)click_h('${ctrl.id}',0)" onmouseleave="if(pressId&&!touch)click_h('${ctrl.id}',0);" ontouchstart="touch=1;click_h('${ctrl.id}',1)" ontouchend="click_h('${ctrl.id}',0)">${ctrl.text ?? ''}</button>`
  ;
}