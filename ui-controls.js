'use strict';

import {textAlign, textBaseLine} from './ui-constants.js';
import { UIControl, UIDialog } from './ui-controls-base.js';

const $state = Symbol('state');
const $checked = Symbol('checked');
const $redrawRequired = Symbol.for('redrawRequired');

export class Dialog extends UIDialog {
    constructor() {
        super();
        this.title = '';

        this.style = new DialogStyle();

        this.onClick = null;
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     */
    draw(ctx, rect) {
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
        // fields
        this.text = '';

        // styles
        this.style = new ButtonStyle();

        // event handlers
        this.onClick = null;
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     */
    draw(ctx, rect) {
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

        this.onClick = null;
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     */
    draw(ctx, rect) {
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

        this[$checked] = false;
        this[$state] = 0;
        // 0 - unchecked
        // 1 - unchecked highlighted
        // 2 - checked
        // 3 - checked highlighted

        this.style = new CheckboxStyle();

        this.onClick = null;
    }

    get checked() { return this[$checked]; }
    set checked(value) {
        if (this[$checked] !== value) {
            this[$checked] = value;
            this[$redrawRequired] = true;
        }
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param rect {Rect}
     */
    draw(ctx, rect) {
        const size = Math.min(rect.width, rect.height);
        const style = this.style;
        const bw = style.borderWidth,
            bw2 = style.borderWidth * 2;

        // Draw outer rect
        ctx.lineWidth = bw;
        ctx.strokeStyle = style.color;
        ctx.strokeRect(rect.x, rect.y, size, size);

        // Draw cb background
        ctx.fillStyle = this[$state] === 0 || this[$state] === 2 ? style.bgColor : style.bgHighlightedColor;
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

    onClick() {
        if (!this.visible || !this.enabled) return;

        this.checked = !this.checked;
    }
}

export function CheckboxStyle() {
    this.borderWidth = 1;
    this.color = '#000';
    this.bgColor = '#fff';
    this.bgHighlightedColor = '#ddd';
}
