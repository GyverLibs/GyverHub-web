function getMyPlugins(plugins, ondelete) {
  let list = [];
  for (let wtype in plugins) {
    let plugin = makeDOM(this, {
      tag: 'div',
      class: 'myplugin',
      name: 'el',
      children: [
        {
          tag: 'div',
          class: 'myplugin_inner',
          children: [
            {
              tag: 'span',
              class: 'my_plugin_wtype',
              text: wtype,
              events: {
                click: async () => {
                  asyncPromptArea(wtype, plugins[wtype], null, true);
                }
              }
            },
            {
              tag: 'span',
              class: 'icon icon_my_plugin',
              text: '',
              events: {
                click: async () => {
                  if (!await asyncConfirm(lang.delete_plugin + ' ' + wtype + '?')) return;
                  await ondelete(wtype);
                }
              }
            }
          ]
        }
      ],
    });
    list.push(plugin);
  }
  return list;
}

function showMyPlugins() {
  let plugins = getPlugins();
  let list = getMyPlugins(plugins, (wtype) => {
    delete plugins[wtype];
    savePlugins(plugins);
    registerPlugins();
    showMyPlugins();
  });

  let myplugins = makeDOM(this, {
    tag: 'div',
    class: 'widget_main',
    style: {
      paddingBottom: '15px',
    },
    children: [
      {
        tag: 'div',
        class: 'widget_inner',
        children: [
          {
            tag: 'div',
            class: 'widget_label',
            text: lang.my_plugins,
          },
          {
            tag: 'div',
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
  showMyPlugins();

  let cont = EL('plugins_cont');
  cont.replaceChildren();

  let addplugin = makeDOM(this, {
    tag: 'div',
    class: 'widget_main',
    children: [
      {
        tag: 'div',
        class: 'widget_inner plugin_inner',
        children: [
          {
            tag: 'a',
            text: '+ ' + lang.add_plugin,
            target: '_blank',
            href: 'https://github.com/GyverLibs/GyverHub-plugins',
          }
        ]
      }
    ]
  });
  cont.appendChild(addplugin);

  let plugins;
  try {
    const resp = await downloadFile(checkGitLink('https://github.com/GyverLibs/GyverHub-plugins/blob/main/plugins.txt'));
    plugins = await resp.text();
  } catch (e) {
    return;
  }

  plugins += '\n' + cfg.plugin_links;
  plugins = plugins.split('\n');
  for (const plug of plugins) {
    if (!plug) continue;
    loadPlugin(plug);
  }
}

function pluginEditor(js, wtype) {
  const $area = makeDOM(this, {
    tag: 'textarea',
    value: js,
    readOnly: 1,
    className: 'ui_inp ui_area ui_area_wrap',
    rows: 30,
  });

  const $input = makeDOM(this, {
    tag: 'input',
    type: 'text',
    class: 'ui_inp',
    value: wtype,
  });

  const $box = makeDialog(lang.plug_add, null, [
    {
      text: 'OK',
      click: () => {
        if ($input.value) {
          js = js.replace(wtype, $input.value);
          wtype = $input.value;

          let plugins = getPlugins();
          plugins[wtype] = js;
          savePlugins(plugins);
          registerPlugins();
          showMyPlugins();
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

async function loadPlugin(rep) {
  let js;
  try {
    js = await downloadFile(checkGitLink(rep));
    js = await js.text();
  } catch (e) {
    return;
  }

  // TODO
  class PlugDevice {
    async set(name, value) {
      console.log(value);
    }
  };
  let widgets = new WidgetBase();
  let plugDevice = new PlugDevice();
  let plugRenderer = new Renderer(plugDevice, widgets);
  let wtype = widgets.registerText(js);
  if (!wtype) return;

  plugRenderer.update([{ type: wtype }]);

  let wid = makeDOM(this, {
    tag: 'div',
    class: 'plugin_row',
    content: plugRenderer.build()[0],
    children: [
      {
        tag: 'div',
        class: 'plugin_actions',
        children: [
          {
            tag: 'span',
            class: 'icon icon_plugin',
            text: '',
            title: lang.plug_add,
            events: {
              click: () => pluginEditor(js, wtype),
            }
          },
          {
            tag: 'span',
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