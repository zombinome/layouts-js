import {Region} from './regions.js';

'use strict';

const $visible = Symbol.for('visible');
const $enabled = Symbol.for('enabled');
const $redrawRequired = Symbol.for('redrawRequired');

export class UIControl {
    /**
     * @constructor
     * @param [rect] {IShape}
     */
    constructor(rect) {
        /** @type {UIControl[]} */this.controls = [];
        /** @type {UIControl}   */this.parent = null;
        /** @type {Region}      */this.region = null;
        this[$visible] = true;
        this[$enabled] = true;
        this[$redrawRequired] = true;
        if (rect) {
            this.region = Region.create(rect, this);
        }
    }

    get id() { return this.region.id; }

    get shape() { return this.region.shape; }
    set shape(value) { this.region.update(value); }

    get visible() { return this[$visible]; }
    set visible(value) {
        value = !!value;
        if (this[$visible] !== value) {
            this[$visible] = value;
            this.parent && (this.parent._redrawRequired = true);
        }
    }

    get enabled() { return this[$enabled]; }
    set enabled(value) {
        value = !!value;
        if (this[$enabled] !== value) {
            this[$enabled] = value;
            this[$redrawRequired] = true;
        }
    }

    /**
     * Add new control to current control.
     * Child region created and added to regions hierarchy
     * @param control {UIControl}
     * @param shape {IShape}
     * @returns {*}
     */
    addControl(control, shape) {
        control.region = this.region.addRegion(shape, control);
        control.parent = this;
        this.controls.push(control);

        this[$redrawRequired] = true;

        return control;
    }

    /**
     * Removes control from parent control
     * @param controlId {number}
     */
    removeControl(controlId) {
        const childControlIndex = this.controls.findIndex(x => x.id === controlId);
        if (childControlIndex >= 0) {
            this.region.removeRegion(controlId);
            this.controls.splice(childControlIndex, 1);

            this[$redrawRequired] = true;
        }
    }

    /**-
     * Draws control if required
     * @param ctx {CanvasRenderingContext2D}
     * @param shape {IShape}
     * @param forceRedraw {boolean}
     */
    drawIfRequired(ctx, shape, forceRedraw) {
        if (!this.visible) return;

        if (!forceRedraw && !this[$redrawRequired]) return;
        this[$redrawRequired] = false;

        this.draw(ctx, shape);
    }
}

export class UIDialog extends UIControl {
    constructor(shape) {
        super(shape);

        this.isModal = false;

        /** @type {UIDialog[]} */ this.modals = [];
    }
}

const $handleRegionEvents = Symbol('handleRegionEvents');
export class UIControlLayout extends UIControl {
    constructor(shape) {
        super(shape);
        this.region.update(shape, this, this[$handleRegionEvents].bind(this));

        /** @type {UIDialog[]} */ this.dialogs = [];
    }

    [$handleRegionEvents](eventName, args) {

    };

    handleMouseClick(args) {
        const region = this.region.findRegionByXY(args.clientX, args.clientY);
        if (region && region.data.onClick) {
            region.data.onClick(args);
        }
    }

    handleMouseDown(args) {

    }

    handleMouseUp(args) {

    }

    handleMouseMove(args) {

    }
}
