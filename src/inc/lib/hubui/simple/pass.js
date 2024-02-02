class UiPass {
  constructor(cont, data) {
    cont.innerHTML = `
      <div class="w_inp_cont">
        <input class="w_inp" type="password" onkeydown="UiInput.checkDown(this,event)" oninput="UiInput.check(this)" onfocusout="UiInput.send(this)">
        <div class="btn_inp_block">
          <button class="icon w_eye" onclick="UiPass.toggle('${data.id}')"></button>
        </div>
      </div>
    `;
    UiInput.color(data.id, data.color);
    Widget.disable(data.id, data.disable);
  }

  static toggle(id) {
    let el = CMP(id);
    if (el.type == 'text') el.type = 'password';
    else el.type = 'text';
  }

  static update(id, data) {
    let el = CMP(id);
    if ('color' in data) UiInput.color(id, data.color);
    if ('value' in data) el.value = data.value;
    if ('regex' in data) el.setAttribute("data-regex", data.regex);
    if ('maxlen' in data) el.maxlength = Math.ceil(data.maxlen);
    if ('disable' in data) Widget.disable(id, data.disable);
  }
}