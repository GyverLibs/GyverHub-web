class WidgetBase {
  classes = new Map();
  virtual = new Set();

  registerClass(cls) {
    this.classes.set(cls.wtype, cls);
    if (cls.virtual) this.virtual.add(cls.wtype);
    if (cls.style) addDOM(cls.wtype + '_style', 'style', cls.style, EL('widget_styles'));
  }

  registerText(text, replacewtype = null) {
    text = text.trim();
    if (text.endsWith(';')) text = text.slice(0, -1);
    let wtype = text.match(/static wtype\s?=\s?'(\w+)'/);
    if (!wtype || wtype.length < 2) return null;
    wtype = wtype[1];
    if (replacewtype) text = text.replace(wtype, replacewtype);

    try {
      const f = new Function('return (' + text + ');');
      this.registerClass(f());
    } catch (e) {
      return null;
    }
    return wtype;
  }
};
let GlobalWidgets = new WidgetBase();

class Renderer extends EventEmitter {

  /** @type {Device} */
  device;
  #widgets;
  #idMap;
  #idMapExt;
  #files;
  #filesLoaded;
  widgetBase;

  constructor(device, widgetBase) {
    super();
    this.widgetBase = widgetBase;
    this.device = device;
    this.#widgets = [];
    this.#idMap = new Map();
    this.#idMapExt = new Map();
    this.#files = [];
    this.#filesLoaded = false;
  }

  update(controls) {
    this.close();
    this.#widgets.length = 0;
    this.#idMap.clear();
    this.#idMapExt.clear();
    this.#files.length = 0;
    this.#filesLoaded = false;

    this._makeWidgets(this.#widgets, 'col', controls);
    this.#filesLoaded = true;
    this.#loadFiles();
  }

  #updateWWidth(type, data) {
    switch (type) {
      case 'row':
        let sumw = 0;
        for (const ctrl of data) {
          if (!ctrl.type || this.widgetBase.virtual.has(ctrl.type)) continue;
          if (!ctrl.wwidth) ctrl.wwidth = 1;
          sumw += ctrl.wwidth;
        }
        for (const ctrl of data) {
          if (!ctrl.type || this.widgetBase.virtual.has(ctrl.type)) continue;
          ctrl.wwidth_perc = ctrl.wwidth * 100 / sumw;
        }
        break;

      case 'col':
        for (const ctrl of data) {
          if (!ctrl.type || this.widgetBase.virtual.has(ctrl.type)) continue;
          ctrl.wwidth_perc = 100;
        }
        break;
    }
  }

  /**
   * Generate widgets from layout.
   * @param {Widget[]} cont 
   * @param {'row' | 'col'} type 
   * @param {object[]} data 
   */
  _makeWidgets(cont, type, data, isExt = false) {
    this.#updateWWidth(type, data);
    const idMap = isExt ? this.#idMapExt : this.#idMap;

    for (const ctrl of data) {
      if (!ctrl.type) continue;

      let cls = this.widgetBase.classes.get(ctrl.type);
      if (cls === undefined) {
        console.log('W: Missing widget:', ctrl);
        // continue;
        cls = this.widgetBase.classes.get('load');
      }

      const obj = new cls(ctrl, this);
      idMap.set(obj.id, obj)
      cont.push(obj);
    }
  }

  async _set(widget, value, ack = true) {
    try {
      await this.device.set(widget.id, value);
    } catch (e) {
      console.log(e);
      if (ack) widget._handleSetError(e);
    }
    if (ack) widget._handleAck();
  }

  /**
   * Build HTML tree from widgets.
   * @returns {HTMLElement}
   */
  build() {
    const res = [];
    for (const w of this.#widgets) {
      const $w = w.build();
      if ($w) res.push($w);
    }

    return res;
  }

  /**
   * Закрытие рендерера (остановка таймеров). Нужно вызвать перед удалением рендерера.
   */
  close() {
    for (const w of this.#idMap.values()) {
      w.close();
    }
  }

  /**
   * Обработчик пакета update с устройства
   * @param {string} id Widget id
   * @param {object} data 
   */
  handleUpdate(id, data) {
    const w = this.#idMap.get(id);
    if (w) w.update(data);
  }

  /**
   * Register an UI file to load.
   * @param {Widget} widget
   * @param {string} path
   * @param {string} type
   * @param {(string) => undefined} callback 
   */
  _addFile(widget, path, type, callback) {
    let has = this.#files.some(f => f.widget.id == widget.id);
    if (path.startsWith('http')) {
      downloadFile(checkGitLink(path))
        .then(res => res.text())
        .then(res => callback(res))
        .catch(e => widget._handleFileError(e));
    } else {
      if (!has) this.#files.push({
        widget, path, type, callback
      });
      this.#loadFiles();
    }
  }

  async #loadFiles() {
    if (!this.#filesLoaded) return;

    while (this.#files.length) {
      const file = this.#files.shift();

      let res;
      try {
        res = await this.device.fetch(file.path, file.type, file.widget._handleFileProgress.bind(file.widget));
      } catch (e) {
        console.log(e);
        file.widget._handleFileError(e);
        continue;
      }
      file.widget._handleFileLoaded(res);
      file.callback(res);
    }
  }

  _getPlugin(wtype) {
    return this.widgetBase.classes.get(wtype);
  }
}

function registerPlugins() {
  GlobalWidgets = new WidgetBase();
  [
    ButtonWidget,
    CanvasWidget,
    ColorWidget,
    DateWidget,
    TimeWidget,
    DateTimeWidget,
    DpadWidget,
    FlagsWidget,
    GaugeWidget,
    GaugeRWidget,
    GaugeLWidget,
    HTMLWidget,
    ImageWidget,
    IconWidget,
    InputWidget,
    PassWidget,
    JoyWidget,
    LabelWidget,
    LedWidget,
    MenuWidget,
    PlotWidget,
    PluginLoader,
    LoadWidget,
    ConfirmWidget,
    PromptWidget,
    ContainerWidget,
    SpoilerWidget,
    SelectWidget,
    SliderWidget,
    SpinnerWidget,
    StreamWidget,
    SwitchWidget,
    SwitchIconWidget,
    TableWidget,
    TabsWidget,
    TextWidget,
    LogWidget,
    TextFileWidget,
    DisplayWidget,
    AreaWidget,
    TitleWidget,
    SpaceWidget,
    DummyWidget,
    TagsWidget,
    UiFileWidget,
    
    /*@[if_not_target:esp]*/
    MapWidget,
    /*@/[if_not_target:esp]*/
  ].forEach(cls => GlobalWidgets.registerClass(cls));

  if (localStorage.hasOwnProperty('plugins')) {
    let plugins = JSON.parse(localStorage.getItem('plugins'));
    for (let plug in plugins)
      GlobalWidgets.registerText(plugins[plug]);
  }
}