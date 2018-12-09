import {Region} from '../regions.js';

'use strict';

const $visible = Symbol.for('visible');
const $enabled = Symbol.for('enabled');
const $redrawRequired = Symbol.for('redrawRequired');

const $activeControl = Symbol.for('activeControl');
const $controlUnderMouse = Symbol.for('controlUnderMouse');

const $parentStyle = Symbol.for('parentStyle');
const $defaultValues = Symbol.for('defaultValues');

export const UIEvents = {
    mouseIn: 'mouseIn',
    mouseOut: 'mouseOut',
    mouseMove: 'mouseMove'
};

export class UIControl {
    /**
     * @constructor
     * @param [shape] {IShape}
     */
    constructor(shape) {
        /** @type {UIControl[]} */this.controls = [];
        /** @type {UIControl}   */this.parent = null;
        /** @type {Region}      */this.region = null;
        this[$visible] = true;
        this[$enabled] = true;
        this[$redrawRequired] = true;
        if (shape) {
            this.region = Region.create(shape, this);
        }

        this.style = null;

        this.onMouseIn = null;
        this.onMouseOut = null;
        this.onMouseMove = null;
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

    /**
     * Draws control if required
     * @param ctx {CanvasRenderingContext2D}
     * @param shape {IShape}
     * @param forceRedraw {boolean}
     */
    drawIfRequired(ctx, shape, forceRedraw) {
        if (!this.visible) return;

        const shouldRedraw = forceRedraw || this[$redrawRequired];
        if (shouldRedraw) {
            this[$redrawRequired] = false;
            this.draw(ctx, shape);
        }

        this.controls.forEach(control => {
            const relativeShape = control.shape.relate(shape.x, shape.y);
            control.drawIfRequired(ctx, relativeShape, shouldRedraw);
        });
    }
}

export class UIDialog extends UIControl {
    constructor(shape) {
        super(shape);

        this.isModal = false;

        /** @type {UIDialog[]} */ this.modals = [];
        this[$activeControl] = null;
        this[$controlUnderMouse] = null;
    }
}

const $handleRegionEvents = Symbol('handleRegionEvents');
const $regionsUnderMouse = Symbol.for('regionsUnderMouse');

export class UIControlLayout extends UIControl {
    constructor(shape) {
        super(shape);
        this.region.update(shape, this, this[$handleRegionEvents].bind(this));

        /** @type {UIDialog[]} */ this.dialogs = [];

        /** @description List of regions that is currently located under mouse pointer.
         *  Used to calculate & fire mouseIn\mouseOut events
         *  @type {Region[]} */
        this[$regionsUnderMouse] = [];
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

    /**
     * @param args {MouseEvent}
     */
    handleMouseMove(args) {
        const mouseX = args.clientX, mouseY = args.clientY;

        if (!this.region.shape.containsPoint(mouseX, mouseY)) {
            this.handleCanvasMouseOut();
        }
        else {
            const oldRegions = this[$regionsUnderMouse];
            const newRegions = this.region.findAllRegionsByXY(mouseX, mouseY);
            const ml = Math.min(oldRegions.length, newRegions.length);
            let maxSameLength = 0;
            while (maxSameLength < ml && oldRegions[maxSameLength].id === newRegions[maxSameLength].id) maxSameLength++;

            for (let i = oldRegions.length - 1; i >= maxSameLength; i--) {
                const data = oldRegions[i].region.data;
                data.onMouseOut && data.onMouseOut(args);
            }

            for (let i = newRegions.length - 1; i >= maxSameLength; i--) {
                const data = newRegions[i].region.data;
                data.onMouseIn && data.onMouseIn(args);
            }

            for (let i = maxSameLength - 1; i >= 0; i--) {
                const data = newRegions[i].region.data;
                data.onMouseMove && data.onMouseMove(args);
            }

            this[$regionsUnderMouse] = newRegions;
        }
    }

    handleCanvasMouseOut() {
        const regionsUnderMouse = this[$regionsUnderMouse];
        for (let i = regionsUnderMouse.length - 1; i >= 0; i--) {
            const region = regionsUnderMouse[i];
            if (region.data.onMouseOut) {
                region.data.onMouseOut();
            }
        }

        this[$regionsUnderMouse] = [];
    }
}

export const backgroundImagePosition = {
    center: 'center',
    stretch: 'stretch',
    fit: 'fit',
    fill: 'fill'
};
