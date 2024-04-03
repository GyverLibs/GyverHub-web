function myPlugins() {
  let list = [];

  if (localStorage.hasOwnProperty('plugins')) {
    let plugins = JSON.parse(localStorage.getItem('plugins'));
    for (let wtype in plugins) {
      let plugin = createElement(this, {
        type: 'div',
        class: 'myplugin',
        name: 'el',
        children: [
          {
            type: 'div',
            class: 'myplugin_inner',
            children: [
              {
                type: 'span',
                text: wtype,
              },
              {
                type: 'span',
                class: 'icon icon_my_plugin',
                text: '',
                events: {
                  click: async() => {
                    if (!await asyncConfirm(lang.delete_plugin)) return;
                    delete plugins[wtype];
                    localStorage.setItem('plugins', JSON.stringify(plugins));
                    registerWidgets();
                    myPlugins();
                  }
                }
              }
            ]
          }
        ],
      });
      list.push(plugin);
    }
  }

  let myplugins = createElement(this, {
    type: 'div',
    class: 'widget_main',
    style: {
      paddingBottom: '15px',
    },
    children: [
      {
        type: 'div',
        class: 'widget_inner',
        children: [
          {
            type: 'div',
            class: 'widget_label',
            text: lang.my_plugins,
          },
          {
            type: 'div',
            class: 'widget_body',
            style: {
              display: 'block',
            },
            children: list,
          }
        ]
      }
    ]
  });
  EL('my_plugins').replaceChildren(myplugins);
}

async function loadPlugins() {
  myPlugins();

  let cont = EL('plugins_cont');
  cont.replaceChildren();

  let addplugin = createElement(this, {
    type: 'div',
    class: 'widget_main',
    children: [
      {
        type: 'div',
        class: 'widget_inner plugin_inner',
        children: [
          {
            type: 'a',
            text: '+ ' + lang.add_plugin,
            params: {
              target: '_blank',
              href: 'https://github.com/GyverLibs/GyverHub-plugins'
            }
          }
        ]
      }
    ]
  });
  cont.appendChild(addplugin);

  const resp = await fetch("https://raw.githubusercontent.com/GyverLibs/GyverHub-plugins/main/plugins.txt", { cache: "no-store" });
  let plugins = await resp.text();
  plugins += '\n' + cfg.plugin_links;
  plugins = plugins.split('\n');
  for (const plug of plugins) {
    if (!plug) continue;
    loadPlugin(plug);
  }
}

function pluginEditor(js, wtype) {
  const $area = document.createElement('textarea');
  $area.rows = 30;
  $area.value = js;
  $area.readOnly = 1;
  $area.className = 'ui_inp ui_area ui_area_wrap';

  const $input = document.createElement('input');
  $input.type = 'text';
  $input.className = 'ui_inp';
  $input.value = wtype;

  const $box = makeDialog(lang.plug_add, null, [
    {
      text: 'OK',
      click: () => {
        if ($input.value) {
          js = js.replace(wtype, $input.value);
          wtype = $input.value;

          if (!localStorage.hasOwnProperty('plugins')) {
            localStorage.setItem('plugins', JSON.stringify({ [wtype]: js }));
          } else {
            let plugins = JSON.parse(localStorage.getItem('plugins'));
            plugins[wtype] = js;
            localStorage.setItem('plugins', JSON.stringify(plugins));
            registerWidgets();
            myPlugins();
          }
        }
        document.body.removeChild($box);
      }
    },
    {
      text: lang.cancel,
      click: () => {
        document.body.removeChild($box);
      }
    }
  ], [$input, $area]);

  $box.firstElementChild.style.maxWidth = "900px";
}

async function loadPlugin(link) {
  let rep = 'https://raw.githubusercontent.com/' + link.split('https://github.com/')[1].replace('/blob/', '/');
  const resp = await fetch(rep, { cache: "no-store" });
  const js = await resp.text();

  class PlugDevice {
    async set(name, value) {
      console.log(value);
    }
  };
  let widgets = new Map();
  let plugDevice = new PlugDevice();
  let plugRenderer = new Renderer(plugDevice, widgets);
  let wtype = Renderer.registerPlugin(js, widgets);
  if (!wtype) return;

  plugRenderer.update([{ type: wtype }]);

  let wid = createElement(this, {
    type: 'div',
    class: 'plugin_row',
    content: plugRenderer.build()[0],
    children: [
      {
        type: 'div',
        class: 'plugin_actions',
        children: [
          {
            type: 'span',
            class: 'icon icon_plugin',
            text: '',
            title: lang.plug_add,
            events: {
              click: () => pluginEditor(js, wtype),
            }
          },
          {
            type: 'span',
            class: 'icon icon_plugin',
            text: '',
            title: lang.plug_link,
            events: {
              click: () => openURL(link)
            }
          },
        ]
      }
    ]
  });

  let cont = EL('plugins_cont')
  cont.insertBefore(wid, cont.lastChild);
}