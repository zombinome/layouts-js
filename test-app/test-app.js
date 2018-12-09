import { scaleCanvas } from "./canvasUtils.js";
import { Rect } from '../regions.js';
import { UIControlLayout } from '../ui/ui-controls-base.js';
import { Dialog, Button, Label, Checkbox } from '../ui/ui-controls.js';

const canvasRect = new Rect(0, 0, 800, 600);
const layout = new UIControlLayout(canvasRect);
layout.draw = function(ctx, rect) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 1, rect.width - 2, rect.height - 2);
};

const colors = [
    '#000', '#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fff',
    '#808080', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0'];

const defaultColors = {};

const mainRegion = layout.region;

/**@type {HTMLCanvasElement}*/ let canvasEl;
/**@type {CanvasRenderingContext2D}*/ let canvasContext;

window.start = function start() {

    /** @type {Dialog} */
    const dialog = layout.addControl(new Dialog(), new Rect(10, 10, 200, 120));
    dialog.title = 'Test dialog';
    subscribe(dialog);

    /** @type {Label} */
    const label = dialog.addControl(new Label(), new Rect(16, 40, 180, 16));
    label.text = 'Test dialog window';
    subscribe(label);

    /** @type {Checkbox} */
    const cb = dialog.addControl(new Checkbox(), new Rect(16, 60, 16, 16));
    cb.checked = true;
    subscribe(cb);

    /** @type {Button} */
    const okButton = dialog.addControl(new Button(), new Rect(26, 90, 80, 24));
    okButton.text = 'OK';
    okButton.onClick = function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    };
    subscribe(okButton);

    /** @type {Button} */
    const cancelButton = dialog.addControl(new Button(), new Rect(114, 90, 80, 24));
    cancelButton.text = 'Cancel';
    cancelButton.onClick = function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    };
    subscribe(cancelButton);

    // TODO: Add background image
    /** @type {Dialog} */
    const dialog1 = layout.addControl(new Dialog, new Rect(10, 100, 160, 80));
    dialog1.title = 'Stretch';

    const dialog2 = layout.addControl(new Dialog(), new Rect(10, 200, 160, 80));
    dialog2.title = 'Center';

    const dialog3 = layout.addControl(new Dialog(), new Rect(200, 100, 160, 80));
    dialog3.title = 'Fit';

    const dialog4 = layout.addControl(new Dialog(), new Rect(200, 200, 160, 80));
    dialog4.title = 'Fill';

    canvasEl = document.querySelector('canvas');
    scaleCanvas(canvasEl, canvasRect.width, canvasRect.height);

    canvasContext = canvasEl.getContext('2d');

    canvasEl.addEventListener('mousemove', args => {
        layout.handleMouseMove(args);

        const region = mainRegion.findRegionByXY(args.clientX, args.clientY, true);
        canvasEl.style.cursor = region && region.data instanceof Button
                                ? 'pointer'
                                : 'default';
    });

    canvasEl.addEventListener("mouseout", () => { layout.handleCanvasMouseOut(); });

    canvasEl.addEventListener('click', layout.handleMouseClick.bind(layout));

    window.requestAnimationFrame(function redraw(timeStamp) {
        window.requestAnimationFrame(redraw);

        layout.drawIfRequired(canvasContext, layout.shape, false);
    });
};

function onMouseIn() {

    this.style.bgColor = colors[this.id % colors.length];

    const $redrawRequired = Symbol.for('redrawRequired');
    this[$redrawRequired] = true;
}

function onMouseOut() {
    this.style.bgColor = defaultColors[this.id];

    const $redrawRequired = Symbol.for('redrawRequired');
    this[$redrawRequired] = true;
}

function subscribe(control) {
    control.onMouseIn = onMouseIn.bind(control);
    control.onMouseOut = onMouseOut.bind(control);
    defaultColors[control.id] = control.style.bgColor;
}
