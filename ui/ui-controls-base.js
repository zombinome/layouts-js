import { Region } from '../regions.js';
import { imageHelpers } from "./ui-helpers.js";
import { Rect } from "../regions.js";

'use strict';

const $visible = Symbol.for('visible');
const $enabled = Symbol.for('enabled');
const $redrawRequired = Symbol.for('redrawRequired');

const $activeControl = Symbol.for('activeControl');
const $controlUnderMouse = Symbol.for('controlUnderMouse');

const $eventHandlers = Symbol.for('eventHandlers');
const $topMost = Symbol.for('topMost');
const $getFirstTopMostRegion = Symbol.for('getFirstTopMostRegion');
//const $parentStyle = Symbol.for('parentStyle');
//const $defaultValues = Symbol.for('defaultValues');

export const UIEvents = {
    mouseIn: 'mouseIn',
    mouseOut: 'mouseOut',
    mouseMove: 'mouseMove',
    click: 'click'
};

export const LayoutProperties = {
    container: 'container',
    form: 'form'
};

export class UIControl {

    static layoutProperties = defineLayoutProperties();

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

        this[$eventHandlers] = {};
        this.style = null;
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

    get layoutProperties() { return UIControl.layoutProperties; }

    /**
     * Add new control to current control.
     * Child region created and added to regions hierarchy
     * @param control {UIControl}
     * @param shape {IShape}
     * @returns {*}
     */
    addControl(control, shape) {
        const childControl = typeof control == 'function' ? new control() : control;

        childControl.region = this.region.addRegion(shape, childControl);
        childControl.parent = this;
        this.controls.push(childControl);

        this[$redrawRequired] = true;

        return childControl;
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
            this.draw && this.draw(ctx, shape);
        }

        this.region.enumRegions(region => {
            const control = region.data;
            const relativeShape = region.shape.relate(shape.x, shape.y);
            control.drawIfRequired(ctx, relativeShape, shouldRedraw);
            return true;
        });
    }

    /**
     * Adds event handler to control
     * @param event {string}
     * @param handler {function}
     * @param [context] {*}
     * @returns {function}
     */
    on(event, handler, context) {
        const eh = this[$eventHandlers];

        const block = { handler, context: context || null };

        if (!eh.hasOwnProperty(event)) {
            eh[event] = [];
        }

        eh[event].push(block);

        return () => { this.off(event, handler); }
    }

    off(event, handler) {
        const eh = this[$eventHandlers];
        if (!eh.hasOwnProperty(event)) {
            return;
        }

        const idx = eh[event].findIndex(x => x.handler === handler);
        if (idx < 0) {
            return;
        }

        eh[event].splice(idx, 1);
    }

    fireEvent(event, args) {
        const handlers = this[$eventHandlers][event];
        if (handlers && handlers.length) {
            for(let i = 0; i < handlers.length; i++) {
                const block = handlers[i];
                block.handler.call(block.context, this, args);
            }
        }
    }
}

/**
 * @implements {IFormControl}
 */
export class UIForm extends UIControl {

    static layoutProperties = defineLayoutProperties([LayoutProperties.container, LayoutProperties.form]);

    constructor(shape) {
        super(shape);

        this.isModal = false;
        this[$topMost] = false;

        /** @type {UIForm[]} */ this.modals = [];
        this[$activeControl] = null;
        this[$controlUnderMouse] = null;
    }

    get layoutProperties() { return UIForm.layoutProperties; }

    get isTopMost() { return this[$topMost]; }
    set isTopMost(value) {
        value = !!value;
        if (this[$topMost] !== value) {
            this[$topMost] = value;

            if (this.parent) {
                this.parent.region.bringToFront(this.region.id);
            }

            // redraw update notification logic
            if (value) {
                this[$redrawRequired] = true;
            }
            else if (this.parent) {
                this.parent[$redrawRequired] = true;
            }
        }
    }

    [$getFirstTopMostRegion](parentRegion) {
        let result = null;
        parentRegion.enumRegions(region => {
            if (region.data.layoutProperties.form && region.data.isTopMost) {
                result = region;
                return false;
            }

            return true;
        });
    }
}

export const backgroundImagePosition = {
    center: 'center',
    stretch: 'stretch',
    fit: 'fit',
    fill: 'fill'
};

const $color = Symbol.for('color'),
    $imageSource = Symbol.for('imageSource'),
    $imageRect = Symbol.for('imageRect'),
    $imagePosition = Symbol.for('imagePosition'),
    $owner = Symbol.for('owner');

/**
 *
 * @param owner {UIControl}
 * @param color {string}
 * @param [imageSource] {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
 * @param [imageRect] {Rect}
 * @param [imagePosition] {backgroundImagePosition}
 * @constructor
 */
export class UIBackgroundStyle {
    constructor(owner, color, imageSource, imageRect, imagePosition) {
        this[$owner] = owner;
        this[$color] = color || null;
        this[$imageSource] = imageSource || null;
        this[$imageRect] = imageRect || (imageSource ? imageHelpers.getImageRect(imageSource) : null);
        this[$imagePosition] = imagePosition || backgroundImagePosition.center;
    }

    /** @returns {string} */
    get color() { return this[$color]; }

    /** @param value {string} */
    set color(value) {
        if (this[$color] !== value) {
            this[$color] = value;
            this[$owner][$redrawRequired] = true;
        }
    }

    /** @returns {HTMLCanvasElement|HTMLImageElement|ImageBitmap} */
    get image() { return this[$imageSource]; }

    /** @param value {HTMLCanvasElement|HTMLImageElement|ImageBitmap} */
    set image(value) {
        if (this[$imageSource] !== value) {
            this[$imageSource] = value;
            this[$owner][$redrawRequired] = true;
        }
    }

    /** @returns {Rect} */
    get imageRect() { return this[$imageRect]; }

    /** @param value {Rect} */
    set imageRect(value) {
        if (this[$imageRect] !== value) {
            this[$imageRect] = value;
            this[$owner][$redrawRequired] = true;
        }
    }

    /** @returns {backgroundImagePosition.center|backgroundImagePosition.fill|backgroundImagePosition.fit|backgroundImagePosition.stretch} */
    get imagePosition() { return this[$imagePosition]; }

    /** @param value {backgroundImagePosition.center|backgroundImagePosition.fill|backgroundImagePosition.fit|backgroundImagePosition.stretch} */
    set imagePosition(value) {
        if (this[$imagePosition] !== value) {
            this[$imagePosition] = value;
            this[$owner][$redrawRequired] = true;
        }
    }

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param x {number}
     * @param y {number}
     * @param width {number}
     * @param height {number}
     */
    draw(ctx, x, y, width, height) {
        if (this[$color] && this[$color] !== 'transparent') {
            ctx.fillStyle = this[$color];
            ctx.fillRect(x, y, width, height);
        }

        if (this[$imageSource]) {
            const sourceRect = this[$imageRect]
                || (this[$imageSource] ? imageHelpers.getImageRect(this[$imageSource]) : null);
            const destRect = new Rect(x, y, width, height);
            imageHelpers.drawImage(ctx, this[$imageSource], sourceRect, destRect, this[$imagePosition]);
        }
    }
}



/**
 * @param [properties] {string[]}
 */
export function defineLayoutProperties(properties) {
    const props = {};
    const allKeys = Object.keys(LayoutProperties);

    properties = properties || [];
    allKeys.forEach(propName => {
        const value = properties.indexOf(propName) >= 0;
        Object.defineProperty(props, propName, {value, writable: false});
    });

    return props;
}
