import { Region, Rect } from './regions.js';
import { UIControl, UIControlLayout } from './ui-controls-base.js';
import { Dialog, Button, Label, Checkbox } from './ui-controls.js';

const canvasRect = new Rect(0, 0, 800, 600);
const layout = new UIControlLayout(canvasRect);
layout.draw = function(ctx, rect) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 1, rect.width - 2, rect.height - 2);
};

const mainRegion = layout.region; // new Region(-1, canvasRect, null, null, null);

/**@type {HTMLCanvasElement}*/ let canvasEl;
/**@type {CanvasRenderingContext2D}*/ let canvasContext;

window.start = function start() {

    /** @type {Dialog} */
    const dialog = layout.add-Control(new Dialog(), new Rect(50, 100, 200, 120));
    dialog.title = 'Test dialog';

    /** @type {Label} */
    const label = dialog.addControl(new Label(), new Rect(16, 40, 200, 16));
    label.text = 'Test dialog window';

    /** @type {Checkbox} */
    const cb = dialog.addControl(new Checkbox(), new Rect(16, 60, 16, 16));
    cb.checked = true;

    /** @type {Button} */
    const okButton = dialog.addControl(new Button(), new Rect(26, 90, 80, 24));
    okButton.text = 'OK';
    okButton.onClick = function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    };

    /** @type {Button} */
    const cancelButton = dialog.addControl(new Button(), new Rect(114, 90, 80, 24));
    cancelButton.text = 'Cancel';
    cancelButton.onClick = function() {
        console.info(this.text + ' button clicked');
        layout.removeControl(dialog.id);
    };

    canvasEl = document.querySelector('canvas');
    scaleCanvas(canvasEl, canvasRect.width, canvasRect.height);

    canvasContext = canvasEl.getContext('2d');

    canvasEl.addEventListener('mousemove', args => {
        const region = mainRegion.findRegionByXY(args.clientX, args.clientY);
        canvasEl.style.cursor = region && region.data instanceof Button
                                ? 'pointer'
                                : 'default';
    });

    canvasEl.addEventListener('click', layout.handleMouseClick.bind(layout));

    const y = 100;
    window.requestAnimationFrame(function redraw(timeStamp) {
        window.requestAnimationFrame(redraw);

        // const newX = windowRegion.shape.x;
        // const newY = y + Math.round(y * Math.sin(timeStamp / 500));
        // const newW = windowRegion.shape.width;
        // const newH = windowRegion.shape.height;
        // windowRegion.update(new Rect(newX, newY, newW, newH));

        renderRegion(canvasContext, layout.region, layout.shape);
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

function renderRegion(canvasContext, region, parentShape) {
    const shape = region.shape.relate(parentShape.x, parentShape.y);
    if (typeof region.data.draw === 'function') {
        region.data.drawIfRequired(canvasContext, shape, false);
    }

    region.enumRegions(childRegion => renderRegion(canvasContext, childRegion, shape));
    return true;
}

/**
 * @param region {Region}
 * @param eventName {string}
 * @param args {MouseEvent}
 */
function handleMouseEvent(region, eventName, args) {
    const x = args.clientX;
    const y = args.clientY;

    if (!region.shape.containsPoint(x, y)) {
        return;
    }

    let regionsChain = [region];
    let childRegion;
    do {
        let childRegion = region._regions.find(r => r.shape.containsPoint(x, y));
        if (childRegion) {
            regionsChain.push(childRegion);
        }
    } while (childRegion);
}
