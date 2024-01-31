class UiFile {
    constructor(cont, data, contType, single) {
        hub.dev(focused).addFile(data.id, data.value, async (file) => {
            const json = dataTotext(file);
            let controls = null;
            try {
                controls = JSON.parse('[' + json + ']');
            } catch (e) {
                console.log('JSON parse error in ui_json from ' + data.path);
            }
            await ui_render.render(cont, contType, controls, single);
            UiHook.update();
        });
    }
};