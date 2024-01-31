function applyUpdate(id, data) {
  // PLUGIN
  // TODO func
  if (data.func) {
    let wid = EL('widget#' + id);
    if (wid && wid.getAttribute("data-func")) {
      UiFunc.update(focused, id, data);
    }
    return;
  }

  // standard component
  let el = CMP(id);
  if (el) {
    let type = el.getAttribute('data-type');
    Widget.update(type, id, data);
    ui_render.updateWidget(type, id, data);
  } else {
    // custom component
    let wid = EL('widget#' + id);
    if (wid) {  // widget
      let type = wid.getAttribute('data-custom-type');
      Widget.update(type, id, data);
      switch (type) {
        case 'html': UiHTML.update(id, data); break;
      }
    } else {   // non-widget
    }
  }
}