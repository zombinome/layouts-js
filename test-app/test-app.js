import { scaleCanvas, getPixelRatio } from "../ui/ui-helpers.js";
import { Rect } from '../regions.js';
import { backgroundImagePosition } from '../ui/ui-controls-base.js';
import { Dialog, Button, Label, Checkbox } from '../ui/ui-controls.js';
import { UIControlLayout } from '../ui/ui-control-layout.js';

//======================================================================
// Examples gallery
//======================================================================
window.switchExample = function(id) {
    const exampleBody = id + '-body';
    const examples = document.querySelectorAll('.example-body');
    for(let i = 0; i < examples.length; i++) {
        const example = examples[i];
        example.style.display = example.id === exampleBody ? 'initial' : null;
    }
};

//======================================================================
// Demos
//======================================================================

/**
 * @param layout {UIControlLayout}
 * @param canvasContext {CanvasRenderingContext2D}
 */
function demoDialogWithControls(layout, canvasContext) {
    /** @type {Dialog} */
    const dialog = layout.addControl(Dialog, new Rect(10, 10, 200, 120));
    dialog.title = 'Test dialog';
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
    okButton.on('click', function(control) {
        console.info(control.text + ' button clicked');
        layout.removeControl(dialog.id);
    });
    subscribe(okButton);

    /** @type {Button} */
    const cancelButton = dialog.addControl(Button, new Rect(114, 90, 80, 24));
    cancelButton.text = 'Cancel';
    cancelButton.on('click', function(control) {
        console.info(control.text + ' button clicked');
        layout.removeControl(dialog.id);
    });
    subscribe(cancelButton);
}

/**
 * @param layout {UIControlLayout}
 * @param context {CanvasRenderingContext2D}
 */
function demoWithBackgroundImagePosition(layout, context) {
    // TODO: Add background image
    /**@type {Dialog}*/
    const dialog1 = layout.addControl(Dialog, new Rect(10, 100, 320, 160));
    dialog1.title = 'Stretch';
    dialog1.style.background.imagePosition = backgroundImagePosition.stretch;

    /**@type {Dialog}*/ const dialog2 = layout.addControl(Dialog, new Rect(10, 300, 320, 160));
    dialog2.title = 'Center';
    dialog2.style.background.imagePosition = backgroundImagePosition.center;

    /**@type {Dialog}*/
    const dialog3 = layout.addControl(Dialog, new Rect(400, 100, 320, 160));
    dialog3.title = 'Fit';
    dialog3.style.background.imagePosition = backgroundImagePosition.fit;

    /**@type {Dialog}*/
    const dialog4 = layout.addControl(Dialog, new Rect(400, 300, 320, 160));
    dialog4.title = 'Fill';
    dialog4.style.background.imagePosition = backgroundImagePosition.fill;

    loadImage('assets/bg-2.png').then(/** @param image {HTMLImageElement} */image => {
        dialog1.style.background.image = image;
        dialog2.style.background.image = image;
        dialog3.style.background.image = image;
        dialog4.style.background.image = image;
    });
}

/**
 * @param layout {UIControlLayout}
 * @param context {CanvasRenderingContext2D}
 */
function demoWithDialogOverlapping(layout, context) {
    const dialog1 = layout.addControl(Dialog, new Rect(50, 50, 200,100));
    dialog1.title = 'Dialog #1';

    const dialog2 = layout.addControl(Dialog, new Rect(100, 100, 200,100));
    dialog2.title = 'Dialog #2';

    const dialog3 = layout.addControl(Dialog, new Rect(150, 150, 200, 100));
    dialog3.title = 'Dialog #3 - TopMost';
    dialog3.isTopMost = true;
}

const demos = {
    demoDialogWithControls,
    demoWithBackgroundImagePosition,
    demoWithDialogOverlapping,
};

//======================================================================
// Demo init
//======================================================================
window.start = function start(demoName, demoId) {
    const demoFn = demos[demoName];
    if (typeof demoFn !== 'function') {
        console.error('Unsupported demo', demoName);
        return;
    }

    /**@type {HTMLElement}      */ const containerEl = document.getElementById(demoId + '-body');
    /**@type {HTMLCanvasElement}*/ const canvasEl = containerEl.querySelector('canvas');

    const canvasRect = new Rect(0, 0, 800, 600);

    scaleCanvas(canvasEl, canvasRect.width, canvasRect.height);
    /**@type {CanvasRenderingContext2D}*/ let canvasContext = canvasEl.getContext('2d');

    const layout = new UIControlLayout(canvasRect);
    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     */
    layout.draw = function(ctx, rect) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(1, 1, rect.width - 2, rect.height - 2);
    };

    demoFn(layout, canvasContext);

    canvasEl.addEventListener('mousemove', args => {
        layout.handleMouseMove(args);

        const region = layout.region.findRegionByXY(args.clientX, args.clientY, true);
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

//======================================================================
// Utils
//======================================================================
const colors = [
    '#000', '#f00', '#0f0', '#00f',
    '#ff0', '#f0f', '#0ff', '#fff',
    '#808080', '#800000', '#008000', '#000080',
    '#808000', '#800080', '#008080', '#c0c0c0'];

const defaultColors = {};

/**
 * @param control {UIControl}
 * @param args {MouseEvent}
 */
function onMouseIn(control, args) {
    /**@type{UIBackgroundStyle}*/ const bg = control.style.background;
    bg.color = colors[control.id % colors.length];
}

/**
 * @param control {UIControl}
 * @param args {MouseEvent}
 */
function onMouseOut(control, args) {
    /**@type{UIBackgroundStyle}*/ const bg = control.style.background;
    bg.color = defaultColors[control.id];
}

/** @param control {UIControl} */
function subscribe(control) {
    control.on('mouseIn', onMouseIn);
    control.on ('mouseOut', onMouseOut);
    defaultColors[control.id] = control.style.background.color;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = function() { resolve(image); };
        image.onerror = function(error) { console.error(error); reject(); };

        image.src = url;
    });
}














/**
 * @param layout {UIControlLayout}
 * @param context {CanvasRenderingContext2D}
 */
function demoForImageScalingCheck(layout, context) {
    loadImage('assets/bg-2.png').then(image => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        scaleCanvas(tempCanvas, tempCanvas.width, tempCanvas.height);

        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        context.lineWidth = 1;
        const scale = 1 / getPixelRatio(context.canvas);
        console.info('scale is: ' + scale);

        context.drawImage(tempCanvas, 0, 0, 720, 513);
        //-context.drawImage(canvas, 0, 0, 720, 513, 0, 0, 720 * scale, 513 * scale);
    });
}
