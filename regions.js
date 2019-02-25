'use strict';

const $hash = Symbol('hash');

export function Point(x, y) {
    this.x = x;
    this.y = y;
}

/** Rectangular shape
 * @implements {IShape}
 * @implements {IEquatable}
 * @class
 */
export class Rect {
    /**
     * @param left {number}
     * @param top {number}
     * @param width {number}
     * @param height {number}
     */
    constructor(left, top, width, height) {
        /**@type {number}*/ this.x = left;
        /**@type {number}*/ this.y = top;
        /**@type {number}*/ this.width = width;
        /**@type {number}*/ this.height = height;
    }

    containsPoint(x, y) {
        return x >= this.x && x < (this.x + this.width)
            && y >= this.y && y < (this.y + this.height);
    }

    relate(x, y) {
        return new Rect(this.x + x, this.y + y, this.width, this.height);
    }

    getLocalPoint(x, y) {
        return new Point(x - this.x, y - this.y);
    }

    /**
     * @param other {IEquatable}
     */
    equals(other) {
        return this.getHash() === other.getHash();
    }

    getHash() {
        if (!this[$hash]) {
            let hash = 17;
            const c = 23;
            this[$hash] = (((hash * c + this.x) * c + this.y) * c + this.width) * c + this.height;
        }

        return this[$hash];
    }
}

/**
 * Circular shape
 * @implements {IShape}
 * @implements {IEquatable}
 * @class
 */
export class Circle {
    /**
     * @param x {number}
     * @param y {number}
     * @param radius {number}
     */
    constructor(x, y, radius) {
        /**@type {number}*/ this.x = x;
        /**@type {number}*/ this.y = y;
        /**@type {number}*/ this.radius = radius;
    }

    /**
     * @param x {number}
     * @param y {number}
     * @returns {boolean}
     */
    containsPoint(x, y) {
        const dx = this.x - x,
            dy = this.y - y,
            r = this.radius;
        return r * r >= (dx * dx + dy * dy);
    }

    /**
     * @param x {number}
     * @param y {number}
     * @returns {Circle}
     */
    relate(x, y) {
        return new Circle(this.x + x, this.y + y, this.radius);
    }

    /**
     * @param x {number}
     * @param y {number}
     * @returns {Point}
     */
    getLocalPoint(x, y) {
        return new Point(x - this.x, y - this.y);
    }

    /**
     * @param other {IEquatable}
     * @returns {boolean}
     */
    equals(other) {
        return this.getHash() === other.getHash();
    }

    /**
     * @returns {number}
     */
    getHash() {
        if (!this[$hash]) {
            let hash = 17;
            const c = 29;
            this[$hash] = ((hash * c + this.x) * c + this.y) * c + this.radius;
        }

        return this[$hash];
    }
}

/**
 * @const
 * @implements {IShape}
 * @implements {IEquatable}
 * @type {{
 *  containsPoint: (function(number, number): boolean),
 *  relate: (function(): IShape),
 *  getLocalPoint: (function(number, number): Point),
 *  equals: (function(IEquatable): boolean),
 *  getHash: (function(): number)
 * }}
 */
const emptyShape = {
    x: 0,
    y: 0,
    containsPoint: (x, y) => false,
    relate: function() { return this; },
    getLocalPoint: (x, y) => new Point(x, y),
    equals: function(other) { return this === other; },
    getHash: () => -1
};

let nextIndex = 0;

const $id = Symbol('id');
const $shape = Symbol('shape');
const $data = Symbol('data');
const $handler = Symbol('handler');
const $regions = Symbol('regions');
const $parent = Symbol('parent');

export class Region {
    /**
     * @param id {number}
     * @param shape {IShape}
     * @param parent {Region}
     * @param data {*}
     * @param eventHandler {function}
     * @constructor
     */
    constructor(id, shape, parent, data, eventHandler) {
        /**@type{number}*/ this[$id] = id;
        /**@type{IShape}*/ this[$shape] = shape;
        /**@type{*}*/ this[$data] = data;
        /**@type{LayoutEventHandler}*/ this[$handler] = eventHandler;
        /**@type{Region[]}*/ this[$regions] = [];

        this[$parent] = parent;
    }

    /** @returns {number} */
    get id() { return this[$id]; }

    /** @returns {IShape} */
    get shape() { return this[$shape]; }

    /** @returns {*} */
    get data() { return this[$data]; }

    /**
     * @param shape {IShape}
     * @param [data] {*}
     * @param [eventHandler] {LayoutEventHandler}
     * @return {Region}
     * @public
     */
    addRegion(shape, data, eventHandler) {
        const newRegion = Region.create(shape, data, eventHandler);
        this[$regions].push(newRegion);

        if (this[$handler]) {
            setTimeout(() => this[$handler]('regionAdded', { parent: this, newRegion }), 0);
        }

        return newRegion;
    }

    /**
     * @param id {number}
     * @returns {boolean}
     * @public
     */
    removeRegion(id) {
        const index = this[$regions].findIndex(x => x[$id] === id);
        if (index < 0)
            return false;

        const regionToRemove = this[$regions][index];
        regionToRemove[$parent] = null; //removing link to parent
        if (this[$handler]) {
            setTimeout(() => this[$handler]('regionRemoved', {parent: this, oldRegion: regionToRemove }), 0);
        }

        this[$regions].splice(index, 1);
        return true;
    }

    /**
     * @param shape {IShape}
     * @param [data] {*}
     * @param [handler] {function}
     * @return {boolean}
     * @public
     */
    update(shape, data, handler) {
        let newShape = shape !== undefined && shape !== null;
        let newHandler = handler !== undefined && handler !== null;

        if (newShape && !isShapeValid(shape)) throw new Error('Invalid shape');
        if (newHandler && !isHandlerValid(handler)) throw new Error('Invalid handler');

        if (newShape)
            this[$shape] = shape;

        if (data !== undefined)
            this[$data] = data;

        if (newHandler) {
            this[$handler] = handler;
        }

        if (newShape && this[$handler]) {
            this[$handler]('shapeChanged', { region: this, newShape});
        }

        return true;
    }

    /**
     * @param id {number}
     * @param [shape] {IShape}
     * @param [data] {*}
     * @param {LayoutEventHandler} [handler]
     * @returns {boolean}
     * @public
     */
    updateChildRegion(id, shape, data, handler) {
        const item = this[$regions].find(x => x[$id] === id);
        if (!item)
            return false;

        return item.update(shape, data, handler);
    }

    /**
     * @param action {(function(Region): boolean)}
     */
    enumRegions(action) {// this[$regions].every(x => action(x));
        let index = 0;
        let continueEnum = true;
        while(index < this[$regions].length && continueEnum) {
            let region = this[$regions][index];
            continueEnum = action(region);
            index++;
        }
    }

    /**
     * Sends child region with specified id to back of regions stack
     * @param regionId {number} region id
     */
    sendToBack(regionId) {
        const index = this[$regions].findIndex(x => x[$id] === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === 0)
            return;

        const region = this[$regions][index];
        for(let i = index; i > 0; i--)
            this[$regions][i] = this[$regions][i - 1];
        this[$regions][0] = region;
    }

    /**
     * Brings child region with specified id to front of regions stack
     * @param regionId {number} region id
     */
    bringToFront(regionId) {
        const index = this[$regions].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        const lastIndex = this[$regions].length - 1;
        if (index === lastIndex)
            return;

        const region = this[$regions][index];
        for (let i = index; i < lastIndex; i++)
            this[$regions][i] = this[$regions][i + 1];
        this[$regions][lastIndex] = region;
    }

    moveToBack(regionId) {
        const index = this[$regions].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === 0)
            return;

        const region = this[$regions][index];
        this[$regions][index] = this[$regions][index - 1];
        this[$regions][index - 1] = region;
    }

    moveToFront(regionId) {
        const index = this[$regions].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === (this[$regions].length - 1))
            return;

        const region = this[$regions][index];
        this[$regions][index] = this[$regions][index + 1];
        this[$regions][index + 1] = region;
    }

    moveAfter(targetId, regionId) {
        if (targetId === regionId)
            return;

        const targetIndex = this[$regions].findIndex(x => x.id === targetId);
        if (targetIndex < 0)
            throw new Error('Unknown region with ID: ' + targetId);

        const index = this[$regions].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === targetIndex - 1)
            return;

        const region = this[$regions][index];
        if (index < targetIndex) {
            for (let i = index; i < targetIndex - 1; i++)
                this[$regions][i] = this[$regions][i + 1];
            this[$regions][targetIndex - 1] = region;
        }
        else {
            for(let i = index; i > targetIndex; i--)
                this[$regions][i] = this[$regions][i - 1];
            this[$regions][targetIndex] = region;
        }
    }

    /**
     *
     * @param x {number}
     * @param y {number}
     * @param [deepSearch] {boolean}
     * @returns {Region}
     * @public
     */
    findRegionByXY(x, y, deepSearch) {
        let region = null;
        for (let i = this[$regions].length - 1; i >= 0; i--) {
            let r = this[$regions][i];
            if (r.shape.containsPoint(x, y)) {
                region = r;
                break;
            }
        }

        if (!region)
            return null;

        if (!deepSearch)
            return region;

        const localPoint = region.shape.getLocalPoint(x, y);
        return region.findRegionByXY(localPoint.x, localPoint.y, true) || region;
    }

    /**
     *
     * @param x {number}
     * @param y {number}
     * @returns {Region[]}
     * @public
     */
    findAllRegionsByXY(x, y) {
        const result = [];
        let point = new Point(x, y);
        /**@type{Region}*/let region = this;
        while((region = region.findRegionByXY(point.x, point.y, false)) !== null) {
            result.push({ region, absoluteLocation: point });
            point = region.shape.getLocalPoint(point.x, point.y);
        }

        return result;
    }

    /**
     * @param shape {IShape}
     * @param [data] {*}
     * @param [eventHandler] {LayoutEventHandler}
     * @return {Region}
     * @public
     */
    static create(shape, data, eventHandler) {
        return new Region(nextIndex++, shape || emptyShape, this, data || null, eventHandler || null);
    }
}

function isShapeValid(shape) {
    return !!shape
        && typeof shape.containsPoint === 'function'
        && typeof shape.relate === 'function'
        && typeof shape.getLocalPoint === 'function';
}

function isHandlerValid(handler) {
    return !!handler && typeof handler === 'function';
}

/** @interface IShape */
/** @property IShape#x {number}*/
/** @property IShape#y {number}*/
/** @function IShape#containsPoint
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
/** @function IShape#relate
 * @param {number} x
 * @param {number} y
 * @returns {IShape}
 */
/** @function IShape#getLocalPoint
 * @param x {number}
 * @param y {number}
 * @returns {Point}
 */

/** @interface IEquatable */
/** @function IEquatable#getHash
 * @returns {number}
 */
/** @function IEquatable#equals
 * @param other {IEquatable}
 * @returns {boolean}
 */


/**
 * @callback LayoutEventHandler
 * @param {string} eventName
 * @param {number} x
 * @param {number} y
 * @param {*} args
 * @param {*} data
 * @param {IShape} shape
 */
