function applyUpdates(name, data) {
  let value = data.value;
  // prompt TODO
  if (name in prompts) {
    release_all();
    let res = prompt(value ? value : prompts[name].label, prompts[name].value);
    if (res !== null) {
      prompts[name].value = res;
      set_h(name, res);
    }
    return;
  }

  // confirm TODO
  if (name in confirms) {
    release_all();
    let res = confirm(value ? value : confirms[name].label);
    set_h(name, res ? 1 : 0);
    return;
  }

  let el = EL('#' + name);
  if (!el) return;
  let type = el.getAttribute('data-type');

  // label
  if ('label' in data) {
    let label = data['label'];
    delete data['label'];
    if (label) {
      if (label == '_nl') label = null;
    } else {
      label = type;
    }
    display('wlabel_cont#' + name, label ? 'block' : 'none');
    EL('wlabel#' + name).innerHTML = label;
  }

  // noback
  if ('noback' in data) {
    if (data.noback == 1) EL('winner#' + name).classList.add('widget_noback');
    else EL('winner#' + name).classList.remove('widget_noback');
  }

  // types
  for (let key in data) {
    let val = data[key];
    switch (type) {
      case 'input':
      case 'pass':
        switch (key) {
          case 'color': addInputColor(el, val); break;
          case 'value': el.value = val; break;
          case 'regex': el.pattern = val; break;
          case 'max': el.maxlength = Math.ceil(val); break;
        }
        break;
      case 'button':
        switch (key) {
          case 'text': if (!isESP()) el.innerHTML = val; break;
          case 'color': el.style.color = intToCol(val); break;
          case 'size': el.style.fontSize = val + 'px'; break;
        }
        break;
    } // switch type
  } // for key






  return;

  if (name in pickers) {
    pickers[name].setColor(intToCol(value));
    return;
  }

  // let el = EL('#' + name);
  if (!el) return;

  cl = el.classList;
  if (cl.contains('icon_t')) el.style.color = value;
  else if (cl.contains('text_t')) el.innerHTML = value;
  else if (cl.contains('input_t')) el.value = value;
  else if (cl.contains('date_t')) el.value = new Date(value * 1000).toISOString().split('T')[0];
  else if (cl.contains('time_t')) el.value = new Date(value * 1000).toISOString().split('T')[1].split('.')[0];
  else if (cl.contains('datetime_t')) el.value = new Date(value * 1000).toISOString().split('.')[0];
  else if (cl.contains('slider_t')) el.value = value, EL('out#' + name).innerHTML = value, moveSlider(el, false);
  else if (cl.contains('switch_t')) el.checked = (value == '1');
  else if (cl.contains('select_t')) el.value = value;
  else if (cl.contains('image_t')) {
    hub.dev(focused).addFile(name, value ? value : EL('#' + name).getAttribute("data-path"), { type: "img" });
  }
  else if (cl.contains('csv_t')) {
    hub.dev(focused).addFile(name, value ? value : EL('#' + name).getAttribute("data-path"), { type: "csv" });  // TODO update csv
  }
  else if (cl.contains('canvas_t')) {
    if (name in canvases) {
      if (!canvases[name].value) {
        canvases[name].value = value;
        drawCanvas(canvases[name]);
      }
    }
  }
  else if (cl.contains('gauge_t')) {
    if (name in gauges) {
      gauges[name].value = Number(value);
      drawGauge(gauges[name]);
    }
  }
  else if (cl.contains('flags_t')) {
    let flags = document.getElementById('#' + name).getElementsByTagName('input');
    let val = value;
    for (let i = 0; i < flags.length; i++) {
      flags[i].checked = val & 1;
      val >>= 1;
    }
  }
}
