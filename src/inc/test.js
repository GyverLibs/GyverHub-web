class TestDevice {
  async set(name, value) {
    EL('test_out').innerHTML = value;
  }
};
let testWidgets = new WidgetBase();
let testDevice = new TestDevice();
let testRenderer = new Renderer(testDevice, testWidgets);

async function testbuild_h() {
  let wtype = testWidgets.registerText(EL('test_js').value);
  if (!wtype) return;
  let json;
  try {
    json = JSON.parse(EL('test_controls').value);
  } catch (e) {
    return;
  }
  let controls = Object.assign({ id: 'test', type: wtype }, json);
  testRenderer.update([controls]);
  let cont = EL('test_container');
  cont.replaceChildren(...testRenderer.build());

  // save
  let config = {
    controls: EL('test_controls').value,
    updates: EL('test_updates').value,
    plugin: EL('test_js').value,
  };
  localStorage.setItem('test_config', JSON.stringify(config));
}
function testupdate_h() {
  let updates;
  try {
    updates = JSON.parse(EL('test_updates').value);
  } catch (e) {
    return;
  }

  for (let upd in updates) {
    let obj = {};
    obj[upd] = updates[upd];
    testRenderer.handleUpdate('test', obj);
  }
}