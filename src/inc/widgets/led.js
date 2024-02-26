class UiLED {
    static render(cont, data) {
        cont.innerHTML = `
        <style id="style#${data.id}"></style>
        <div data-type="${data.type}" id="${ID(data.id)}" class="w_led ${Number(data.value == 1) ? 'w_led_on' : ''}"></div>`;

        UiLED.color(data.id, intToCol(data.color) ?? getDefColor());
        Widget.disable(data.id, data.disable);
    }

    static update(id, data) {
        let el = CMP(id);
        if ('value' in data) {
            // el.classList.remove('w_led_on');
            // el.classList.remove('w_led_off');
            if (Number(data.value)) el.classList.add('w_led_on');
            else el.classList.remove('w_led_on');
        }
        if ('color' in data) UiLED.color(id, intToCol(data.color));
    }

    static color(id, color) {
        /*EL('style#' + id).innerHTML = `
        #${ID(id)}.w_led_on {
            background-color: ${adjustColor(color, 1.3)};
            box-shadow: inset #0008 0 0 10px, ${adjustColor(color, 1)} 0 0 12px 4px, inset 2px 3px 0px 0px #fff3;
        }
        #${ID(id)}.w_led_off {
            background-color: ${adjustColor(color, 0.8)}; 
            box-shadow: #000b 0 0 1px, inset #000 0 0 2px, inset #000d 0 0 10px, inset 2px 3px 0px 0px #fff3;
        }`;*/
        EL('style#' + id).innerHTML = `
        #${ID(id)}.w_led_on {
            background: ${color};
            box-shadow: ${color} 0 0 9px 1px, inset 2px 3px 0px 0px #fff3;
        }`;
    }
};