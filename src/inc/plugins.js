async function loadPlugins() {
  EL('plugins_cont').replaceChildren(EL('plugins_cont').lastElementChild);
  const resp = await fetch("https://raw.githubusercontent.com/GyverLibs/GyverHub-plugins/main/plugins.txt", { cache: "no-store" });
  let plugins = await resp.text();
  plugins += '\n' + cfg.plugin_links;
  plugins = plugins.split('\n');
  for (const plug of plugins) {
    if (!plug) continue;
    loadPlugin(plug);
  }
}

class PlugDevice { }
let plugDevice = new PlugDevice();
let plugRenderer = new Renderer(plugDevice);

async function loadPlugin(link) {
  let rep = 'https://raw.githubusercontent.com/' + link.split('https://github.com/')[1].replace('/blob/', '/');
  const resp = await fetch(rep, { cache: "no-store" });
  const js = await resp.text();

  let wtype = Renderer.registerPlugin(js);
  if (!wtype) return;

  let controls = {
    id: Math.floor(Math.random() * 0xffffffff).toString(16),
    type: wtype,
  };

  plugRenderer.update([controls]);

  let cont = createElement(this, {
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
              click: () => { }
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

  EL('plugins_cont').insertBefore(cont, EL('plugins_cont').firstChild);
}