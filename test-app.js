import { Rect } from './regions.js';
import { UIControlLayout } from './ui-controls-base.js';
import { Dialog, Button, Label, Checkbox } from './ui-controls.js';
import { fn } from './compose.js';

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

const mainRegion = layout.region; // new Region(-1, canvasRect, null, null, null);

/**@type {HTMLCanvasElement}*/ let canvasEl;
/**@type {CanvasRenderingContext2D}*/ let canvasContext;

window.start = function start() {
    createDialog(layout, 50, 100, 'Test dialog #1');
    createDialog(layout, 200, 150, 'Test dialog #2');

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

    canvasEl.addEventListener("mouseout", layout.handleCanvasMouseOut.bind(layout));

    canvasEl.addEventListener('click', layout.handleMouseClick.bind(layout));

    window.requestAnimationFrame(function redraw(/*timeStamp*/) {
        window.requestAnimationFrame(redraw);

        layout.drawIfRequired(canvasContext, layout.shape, false);
    });
};

/**
 * Based on:
 * https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
 * @param [canvasElement] {HTMLCanvasElement}
 * @returns {number} pixel ratio
 */
function getPixelRatio(canvasElement) {
    const ctx = (canvasElement || document.createElement('canvas')).getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // noinspection SpellCheckingInspection
    const bspr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

    return dpr / bspr;
}

function scaleCanvas(canvasElement, width, height) {
    const pixelRatio = getPixelRatio(canvasElement);

    canvasElement.width = width * pixelRatio;
    canvasElement.height = height * pixelRatio;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';

    canvasElement.getContext('2d').scale(pixelRatio, pixelRatio);
}

/**
 * @param layout {UIControlLayout}
 * @param x {number}
 * @param y {number}
 * @param title {string}
 */
function createDialog(layout, x ,y, title) {
    /** @type {Dialog} */
    const dialog = layout.addControl(Dialog, new Rect(x, y, 200, 120));
    dialog.title = title;
    subscribe(dialog);

    /** @type {Label} */
    const label = dialog.addControl(Label, new Rect(16, 40, 180, 16));
    label.text = 'Test dialog window';
    subscribe(label);

    /** @type {Checkbox} */
    const cb = dialog.addControl(Checkbox, new Rect(16, 60, 16, 16));
    cb.checked = true;
    subscribe(cb);

    /** @type {Button} */
    const okButton = dialog.addControl(Button, new Rect(26, 90, 80, 24));
    okButton.text = 'OK';
    okButton.onClick = function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    };
    subscribe(okButton);
    okButton.onClick = fn.compose2(okButton.onClick, function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    });

    /** @type {Button} */
    const cancelButton = dialog.addControl(Button, new Rect(114, 90, 80, 24));
    cancelButton.text = 'Cancel';
    subscribe(cancelButton);
    cancelButton.onClick = fn.compose2(cancelButton.onClick, function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    });
}

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

