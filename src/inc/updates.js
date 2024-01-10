function applyUpdate(id, data) {
  // PLUGIN
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
    Widget.update(id, type, data);
    switch (type) {
      case 'input': UiInput.update(id, data); break;
      case 'pass': UiPass.update(id, data); break;
      case 'area': UiArea.update(id, data); break;
      case 'button': UiButton.update(id, data); break;
      case 'switch_t': UiSwitch.update(id, data); break;
      case 'switch_i': UiSwicon.update(id, data); break;
      case 'label': UiLabel.update(id, data); break;
      case 'title': UiTitle.update(id, data); break;
      case 'display': UiDisplay.update(id, data); break;
      case 'text': UiText.update(id, data); break;
      case 'text_f': UiText_f.update(id, data); break;
      case 'log': UiLog.update(id, data); break;
      case 'date': UiDate.update(id, data); break;
      case 'time': UiTime.update(id, data); break;
      case 'datetime': UiDateTime.update(id, data); break;
      case 'image': UiImage.update(id, data); break;
      case 'confirm': UiConfirm.update(id, data); break;
      case 'prompt': UiPrompt.update(id, data); break;
      case 'table': UiTable.update(id, data); break;
      case 'slider': UiSlider.update(id, data); break;
      case 'spinner': UiSpinner.update(id, data); break;
      case 'html': UiHTML.update(id, data); break;
      case 'select': UiSelect.update(id, data); break;
      case 'color': UiColor.update(id, data); break;
      case 'led': UiLED.update(id, data); break;
      case 'icon': UiIcon.update(id, data); break;
      case 'gauge': UiGauge.update(id, data); break;
      case 'gauge_r': UiGaugeR.update(id, data); break;
      case 'gauge_l': UiGaugeL.update(id, data); break;
      case 'joy': UiJoy.update(id, data); break;
      case 'dpad': UiDpad.update(id, data); break;
      case 'flags': UiFlags.update(id, data); break;
      case 'tabs': UiTabs.update(id, data); break;
      case 'canvas': UiCanvas.update(id, data); break;
      case 'plot': UiPlot.update(id, data); break;
      case 'stream': UiStream.update(id, data); break;
    }
  } else {
    // custom component
    let wid = EL('widget#' + id);
    if (wid) {  // widget
      let type = wid.getAttribute('data-custom');
      Widget.update(id, type, data);
      switch (type) {
        case 'html': UiHTML.update(id, data); break;
      }
    } else {   // non-widget
    }
  }
}