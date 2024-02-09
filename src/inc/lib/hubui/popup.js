function makeDialog(title, text, buttons, additional) {
  const $box = document.createElement('div');
  $box.className = 'dialog_box';

  const $d = document.createElement('div');
  $box.append($d);
  $d.className = 'ui_col ui_dialog';

  if (title) {
    const $title = document.createElement('div');
    $d.append($title);
    $title.className = 'ui_row ui_head';
    $title.textContent = title;
  }

  if (text) {
    const $text = document.createElement('div');
    $d.append($text);
    $text.className = 'ui_row';

    const $label = document.createElement('label');
    $text.append($label);
    $label.className = 'dialog_row';
    $label.textContent = text;
  }

  if (additional) {
    const $text = document.createElement('div');
    $d.append($text);
    $text.className = 'ui_row';
    $text.innerHTML = additional;
  }

  if (buttons) {
    const $buttons = document.createElement('div');
    $d.append($buttons);
    $buttons.className = 'ui_row';

    $buttons.append(document.createElement('div'));

    const $row = document.createElement('div');
    $buttons.append($row);
    $row.className = 'ui_btn_row';

    for (const i of buttons) {
      const $btn = document.createElement('button');
      $row.append($btn);
      $btn.className = 'ui_btn ui_btn_mini';
      $btn.textContent = i.text;
      $btn.addEventListener('click', i.click);
    }
  }

  document.body.appendChild($box);
  return $box;
}

function asyncAlert(text, title = null) {
  return new Promise(resolve => {
    const $box = makeDialog(title, text, [{
      text: 'OK',
      click: () => {
        document.body.removeChild($box);
        resolve(true);
      }
    }]);
  });
}

function asyncConfirm(text, title = null) {
  return new Promise(resolve => {
    const $box = makeDialog(title, text, [
      {
        text: lang.pop_yes,
        click:() => {
          document.body.removeChild($box);
          resolve(true);
        }
      },
      {
        text: lang.pop_no,
        click:() => {
          document.body.removeChild($box);
          resolve(false);
        }
      }
    ]);
  });
}

function asyncPrompt(text, placeh = '', title = null) {
  return new Promise(resolve => {
    const $box = makeDialog(title, text, [
      {
        text: 'OK',
        click:() => {
          let res = EL('dia_input').value;
          document.body.removeChild($box);
          resolve(res);
        }
      },
      {
        text: lang.cancel,
        click:() => {
          document.body.removeChild($box);
          resolve(null);
        }
      }
    ], `<input id="dia_input" class="ui_inp" type="text" value="${placeh}">`);
  });
}

function makePinDialog(title, canCancel, inputHandler) {
  const $box = document.createElement('div');
  $box.className = 'dialog_box';

  const $d = document.createElement('div');
  $box.append($d);
  $d.className = 'ui_col ui_dialog';

  const $title = document.createElement('div');
  $d.append($title);
  $title.className = 'ui_row ui_head';
  $title.textContent = title;

  const $inpRow = document.createElement('div');
  $d.append($inpRow);
  $inpRow.className = 'ui_row pass_inp_inner';
  
  const $input = document.createElement('input');
  $inpRow.append($input);
  $input.className = 'ui_inp pass_inp';
  $input.type = 'number';
  $input.pattern = '[0-9]*';
  $input.inputMode = 'numeric';

  $d.addEventListener('click', e => {
    const $b = e.target;
    if (!($b instanceof HTMLButtonElement)) return;
    if ($b.classList.contains('pin_cancel')) {
      inputHandler(null);
      return;
    }
    if ($b.textContent === '<') $input.value = $input.value.slice(0, -1);
    else $input.value += $b.textContent;
    inputHandler($input.value);
  })

  $input.addEventListener('input', () => {
    inputHandler($input.value);
  });

  for (let i = 0; i < 3; i++) {
    const $row = document.createElement('div');
    $d.append($row);
    $row.className = 'ui_row pin_inner';

    for (let j = 0; j < 3; j++) {
      const $b = document.createElement('button');
      $row.append($b);
      $b.className = 'ui_btn pin_btn';
      $b.textContent = "" + (i * 3 + j + 1);
    }
  }

  const $row = document.createElement('div');
  $d.append($row);
  $row.className = 'ui_row pin_inner';
  {
    const $b = document.createElement('button');
    $row.append($b);

    if (canCancel) {
      $b.className = 'ui_btn pin_btn pin_cancel';
      $b.textContent = lang.cancel;
    } else {
      $b.className = 'ui_btn pin_btn pin_no_btn';
    }
  }
  {
    const $b = document.createElement('button');
    $row.append($b);
    $b.className = 'ui_btn pin_btn';
    $b.textContent = "0";
  }
  {
    const $b = document.createElement('button');
    $row.append($b);
    $b.className = 'ui_btn pin_btn pin_red_btn';
    $b.textContent = "<";
  }

  document.body.appendChild($box);
  return $box;
}

function asyncAskPin(title, targetPin, canCancel = false) {
  return new Promise(resolve => {
    const $box = makePinDialog(title, canCancel, value => {
      if (value === null || value.hashCode() == targetPin) {
        document.body.removeChild($box);
        resolve(value !== null);
      }
    });
  });
}
