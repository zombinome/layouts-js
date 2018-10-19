'use strict';

import {textAlign, textBaseLine} from './ui-constants.js';
import {Region} from './layouts.js';

const visibleProp = Symbol('visible');
const enabledProp = Symbol('enabled');
////const redrawRequiredProp = Symbol('redrawRequired');
const stateProp = Symbol('state');
////const textProp = Symbol('text');
////const checkedProp = Symbol('checked');

export class UIControl {
    /**
     * @constructor
     * @param [rect] {IShape}
     */
    constructor(rect) {
        /** @type {UIControl[]} */this.controls = [];
        /** @type {UIControl}   */this.parent = null;
        /** @type {Region}      */this.region = null;
        this[visibleProp] = true;
        this[enabledProp] = true;
        this._redrawRequired = true;
        if (rect) {
            this.region = Region.create(rect, this);
        }
    }

    get id() { return this.region.id; }

    get shape() { return this.region.shape; }
    set shape(value) { this.region.update(value); }

    get visible() { return this[visibleProp]; }
    set visible(value) {
        value = !!value;
        if (this[visibleProp] !== value) {
            this[visibleProp] = value;
            this.parent && (this.parent._redrawRequired = true);
        }
    }

    get enabled() { return this[enabledProp]; }
    set enabled(value) {
        value = !!value;
        if (this[enabledProp] !== value) {
            this[enabledProp] = value;
            this._redrawRequired = true;
        }
    }

    addControl(control, shape) {
        control.region = this.region.addRegion(shape, control);
        control.parent = this;
        this.controls.push(control);

        return control;
    }

    removeControl(controlId) {
        const childControlIndex = this.controls.findIndex(x => x.id === controlId);
        if (childControlIndex >= 0) {
            this.region.removeRegion(controlId);
            this.controls.splice(childControlIndex, 1);
        }
    }
}

export class Dialog extends UIControl{
    constructor() {
        super();
        this.title = '';

        this.style = new DialogStyle();
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     * @param forced {boolean}
     */
    draw(ctx, rect, forced) {
        if (!this.visible) return;

        if (!forced && !this._redrawRequired) return;
        this._redrawRequired = false;

        //** @type Rect */ const rect = this.shape.relate(relPoint.x, relPoint.y);
        const style = this.style;

        // drawing control border
        ctx.strokeStyle = this.style.borderColor;
        ctx.lineWidth = this.style.borderWidth;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        // Drawing dialog header
        const clientX = rect.x + style.borderWidth;
        const clientY = rect.y + style.borderWidth + style.titleHeight;
        const clientWidth = rect.width - 2 * style.borderWidth;
        const clientHeight = rect.height - 2 * style.borderWidth - style.titleHeight;

        ctx.fillStyle = style.titleBgColor;
        ctx.fillRect(clientX, rect.y + style.borderWidth, clientWidth, style.titleHeight);

        ctx.font = style.titleFont;
        ctx.fillStyle = style.titleTextColor;
        ctx.textAlign = style.titleTextAlign;
        ctx.textBaseline = style.titleTextBaseline;
        ctx.fillText(this.title, clientX + 2, rect.y + style.borderWidth + style.titleHeight / 2, clientWidth - 2);

        // Drawing main dialog space
        ctx.fillStyle = style.bgColor;
        ctx.fillRect(clientX, clientY, clientWidth, clientHeight);
    }
}

export function DialogStyle() {
    // Border
    this.borderWidth = 1;
    this.borderColor = '#555';

    // Title
    this.titleHeight = 16;
    this.titleFont = '12px Serif';
    this.titleTextAlign = textAlign.start;
    this.titleTextBaseline = textBaseLine.middle;
    this.titleBgColor = '#66f';
    this.titleTextColor = '#fff';

    // Control area
    ////this.font = '12px Serif';
    this.bgColor = '#ddd';
}

export class Button extends UIControl {
    constructor() {
        super();
        this.text = '';

        this.style = new ButtonStyle();
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     * @param forced {boolean}
     */
    draw(ctx, rect, forced) {
        if (!this.visible) return;

        if (!forced && !this._redrawRequired) return;
        this._redrawRequired = false;

        //** @type Rect */ const rect = this.shape.relate(relPoint.x, relPoint.y);
        const style = this.style;

        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = style.borderWidth;

        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = style.bgColor;

        const clientX = rect.x + style.borderWidth;
        const clientY = rect.y + style.borderWidth;
        const clientWidth = rect.width - 2 * style.borderWidth;
        const clientHeight = rect.height - 2 * style.borderWidth;
        ctx.fillRect(clientX, clientY, clientWidth, clientHeight);

        const measure = ctx.measureText(this.text);
        const textX = clientX + (clientWidth - measure.width) / 2;

        ctx.font = style.font;
        ctx.fillStyle = style.textColor;
        ctx.textBaseline = style.textBaseLine;
        ctx.textAlign = style.textAlign;
        ctx.fillText(this.text, textX + style.padding, clientY + clientHeight / 2, clientWidth - style.padding * 2);
    }
}

export function ButtonStyle() {
    // Border
    this.borderWidth = 1;
    this.borderColor = '#555';

    // Control area
    this.padding = 2;
    this.font = '12px Serif';
    this.bgColor = '#ddd';
    this.textColor = '#000';
    this.textAlign = textAlign.center;
    this.textBaseLine = textBaseLine.middle;
}

export class Label extends UIControl {
    constructor() {
        super();
        this.text = '';

        this.style = new LabelStyle();
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     * @param forced {boolean}
     */
    draw(ctx, rect, forced) {
        if (!this.visible) return;

        if (!forced && !this._redrawRequired) return;
        this._redrawRequired = false;


        //** @type Rect */ const rect = this.shape.relate(relPoint.x, relPoint.y);
        const style = this.style;

        const clientX = rect.x + style.padding;
        const clientY = rect.y + style.padding;
        const clientWidth = rect.width - 2 * style.padding;

        ctx.font = style.font;
        ctx.fillStyle = style.textColor;
        ctx.textBaseline = textBaseLine.middle;
        ctx.fillText(this.text, clientX, clientY, clientWidth);
    }
}

export function LabelStyle() {
    this.padding = 2;
    this.font = '12px Serif';
    this.textColor = '#000';
}

export class Checkbox extends UIControl {
    constructor() {
        super();

        this.checked = false;
        this[stateProp] = 0;
        // 0 - unchecked
        // 1 - unchecked highlighted
        // 2 - checked
        // 3 - checked highlighted

        this.style = new CheckboxStyle();
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}-
     * @param forced {boolean}
     */
    draw(ctx, rect, forced) {
        if (!this.visible) return;

        if (!forced && !this._redrawRequired) return;
        this._redrawRequired = false;

        const size = Math.min(rect.width, rect.height);
        const style = this.style;
        const bw = style.borderWidth,
            bw2 = style.borderWidth * 2;

        // Draw outer rect
        ctx.lineWidth = bw;
        ctx.strokeStyle = style.color;
        ctx.strokeRect(rect.x, rect.y, size, size);

        // Draw cb background
        ctx.fillStyle = this[stateProp] === 0 || this[stateProp] === 2 ? style.bgColor : style.bgHighlightedColor;
        ctx.fillRect(rect.x + bw, rect.y + bw, size - bw2, size - bw2);

        if (this.checked) {
            ctx.lineWidth = bw2;
            const halfSize = size / 2;
            const quarterSize = size / 4;
            ctx.beginPath();
            ctx.moveTo(rect.x + quarterSize, rect.y + halfSize);
            ctx.lineTo(rect.x + halfSize, rect.y + quarterSize * 3);
            ctx.lineTo(rect.x + quarterSize * 3, rect.y + quarterSize);
            ctx.stroke();
        }
    }
}

export function CheckboxStyle() {
    this.borderWidth = 1;
    this.color = '#000';
    this.bgColor = '#fff';
    this.bgHighlightedColor = '#ddd';
}
