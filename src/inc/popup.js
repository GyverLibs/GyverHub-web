function makeDialog(title, text, buttons, additional) {
  const $box = document.createElement('div');
  $box.className = 'dialog_box';
  document.body.appendChild($box);

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
