import {Region, Rect, Circle} from './regions.js';

'use strict';

const $visible = Symbol.for('visible');
const $enabled = Symbol.for('enabled');
const $redrawRequired = Symbol.for('redrawRequired');

const $activeControl = Symbol.for('activeControl');
const $controlUnderMouse = Symbol.for('controlUnderMouse');

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
     * @param control {UIControl|function}
     * @param shape {IShape}
     * @returns {UIControl|*}
     */
    addControl(control, shape) {
        if (typeof control === 'function') control = new control();

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

            // console.log(
            //     'old: [' + oldRegions.map(r => r.region.id).join('->') + ']',
            //     'new: [' + newRegions.map(r => r.region.id).join('->') + ']');
            const ml = Math.min(oldRegions.length, newRegions.length);
            let maxSameLength = 0;
            while (maxSameLength < ml && oldRegions[maxSameLength].region.id === newRegions[maxSameLength].region.id)
                maxSameLength++;

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

        getControlsToRedraw(this, [], this.shape);
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

/**
 * @param control {UIControl}
 * @param shapes {IShape[]}
 * @param absoluteTop {Point}
 */
function getControlsToRedraw(control, shapes, absoluteTop) {
    const controlShape = control.shape.relate(absoluteTop.x, absoluteTop.y);
    if (control[$redrawRequired]) {
        shapes.push(controlShape);
        return;
    }

    if (shapes.some(shape => intersects(shape, control.shape))) {
        control[$redrawRequired] = true;
        shapes.push(controlShape);
        return;
    }

    if (control.controls || control.controls.length)
        for(let i = 0; i < control.controls.length; i++)
            getControlsToRedraw(control.controls[i], shapes, controlShape);
}

/**
 * @param shape1 {IShape}
 * @param shape2 {IShape}
 * @returns {boolean}
 */
function intersects(shape1, shape2) {
    if (shape1 instanceof Rect) {
        if (shape2 instanceof Rect)
            return isIntersect2Rects(shape1, shape2);

        if (shape2 instanceof Circle)
            return isIntersectRectWithCircle(shape1, shape2);
    }
    else if (shape1 instanceof Circle) {
        if (shape2 instanceof Rect)
            return isIntersectRectWithCircle(shape2, shape1);

        if (shape2 instanceof Circle)
            return isIntersect2Circles(shape1, shape2);
    }

    return false;
}

/**
 * @param circle1 {Circle}
 * @param circle2 {Circle}
 * @returns {boolean}
 */
function isIntersect2Circles(circle1, circle2) {
    const dx = circle1.x - circle2.x,
          dy = circle1.y - circle2.y,
          dr = circle1.radius + circle2.radius;

    return dx * dx + dy * dy <= dr * dr;
}

/**
 * @param rect1 {Rect}
 * @param rect2 {Rect}
 * @returns {boolean}
 */
function isIntersect2Rects(rect1, rect2) {
    const isOutOfBoundsX = (rect1.x + rect1.width) < rect2.x || (rect2.x + rect2.width) < rect1.x;
    const isOutOfBoundsY = (rect1.y + rect1.height) < rect2.y || (rect2.y + rect2.height) < rect1.y;

    return !isOutOfBoundsX && !isOutOfBoundsY;
}

/**
 * @param rect {Rect}
 * @param circle {Circle}
 * @returns {boolean}
 */
function isIntersectRectWithCircle(rect, circle) {
    // https://yal.cc/rectangle-circle-intersection-test/
    const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width)),
          nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    return circle.containsPoint(nearestX, nearestY);
}