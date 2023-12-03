class UiFile {
    constructor(cont, data, contType, single) {
        let params = {
            type: "ui_json",
            cont: cont,
            path: data.value,
            contType: contType,
            single: single
        };
        hub.dev(focused).addFile(data.id, data.value, params);
    }

    static async apply(json, data) {
        let controls = null;
        try {
            controls = JSON.parse('[' + json + ']');
        } catch (e) {
            console.log('JSON parse error in ui_json from ' + data.path);
        }
        await ui_render.render(data.cont, data.contType, controls, data.single);
        UiHook.update();
    }
};