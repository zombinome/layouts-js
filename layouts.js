'use strict';

const hashProp = Symbol('hash');
const getHashProp = Symbol('getHash');

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
        if (!this[hashProp]) {
            let hash = 17;
            const c = 23;
            this[hashProp] = (((hash * c + this.x) * c + this.y) * c + this.width) * c + this.height;
        }

        return this[hashProp];
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

        const rr = radius + radius;
        this._boundRect = new Rect(x - radius, y - radius, rr, rr);
    }

    containsPoint(x, y) {
        const dx = this.x - x,
            dy = this.y - y,
            r = this.radius;
        return r * r >= (dx * dx + dy * dy);
    }

    relate(x, y) {
        return new Circle(this.x + x, this.y + y, this.radius);
    }

    getLocalPoint(x, y) {
        return new Point(x - this.x, y - this.y);
    }

    equals(other) {
        return this.getHash() === other.getHash();
    }

    getHash() {
        if (!this[hashProp]) {
            let hash = 17;
            const c = 29;
            this[hashProp] = ((hash * c + this.x) * c + this.y) * c + this.radius;
        }

        return this[hashProp];
    }
}

/**
 * @implements {IShape}
 * @implements {IEquatable}
 * @type {{containsPoint: (function(number, number): boolean), relate: (function(): IShape), getLocalPoint: (function(number, number): Point), equals: (function(IEquatable): boolean), getHash: (function(): number)}}
 */
const emptyShape = {
    containsPoint: (x, y) => false,
    relate: function() { return this; },
    getLocalPoint: (x, y) => new Point(x, y),
    equals: function(other) { return this === other; },
    getHash: () => 0
};

let nextIndex = 0;

const idProp = Symbol('id');
const shapeProp = Symbol('shape');
const dataProp = Symbol('data');
const handlerProp = Symbol('handler');
const regionsProp = Symbol('regions');
const parentProp = Symbol('parent');

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
        /**@type{number}*/ this[idProp] = id;
        /**@type{IShape}*/ this[shapeProp] = shape;
        /**@type{*}*/ this[dataProp] = data;
        /**@type{LayoutEventHandler}*/ this[handlerProp] = eventHandler;
        /**@type{Region[]}*/ this[regionsProp] = [];

        this[parentProp] = parent;
    }

    get id() { return this[idProp]; }

    get shape() { return this[shapeProp]; }

    get data() { return this[dataProp]; }

    /**
     * @param shape {IShape}
     * @param [data] {*}
     * @param [eventHandler] {LayoutEventHandler}
     * @return {Region}
     * @public
     */
    addRegion(shape, data, eventHandler) {
        const newRegion = Region.create(shape, data, eventHandler);
        this[regionsProp].push(newRegion);
        return newRegion;
    }

    /**
     * @param id {number}
     * @returns {boolean}
     * @public
     */
    removeRegion(id) {
        const index = this[regionsProp].findIndex(x => x[idProp] === id);
        if (index < 0)
            return false;

        this[regionsProp][index][parentProp] = null; //removing link to parent
        this[regionsProp].splice(index, 1);
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
            this[shapeProp] = shape;

        if (data !== undefined)
            this[dataProp] = data;

        if (newHandler) {
            this[handlerProp] = handler;
        }

        if (newShape && this[handlerProp]) {
            this[handlerProp]('shapeChanged', this);
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
        const item = this[regionsProp].find(x => x[idProp] === id);
        if (!item)
            return false;

        return item.update(shape, data, handler);
    }

    enumRegions(action) {
        let index = 0;
        let continueEnum = true;
        while(index < this[regionsProp].length && continueEnum) {
            let region = this[regionsProp][index];
            continueEnum = action(region);
            index++;
        }
    }

    sendToBack(regionId) {
        const index = this[regionsProp].findIndex(x => x[idProp] === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === 0)
            return;

        const region = this[regionsProp][index];
        for(let i = index; i > 0; i--)
            this[regionsProp][i] = this[regionsProp][i - 1];
        this[regionsProp][0] = region;
    }

    bringToFront(regionId) {
        const index = this[regionsProp].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        const lastIndex = this[regionsProp].length - 1;
        if (index === lastIndex)
            return;

        const region = this[regionsProp][index];
        for (let i = index; i < lastIndex; i++)
            this[regionsProp][i] = this[regionsProp][i + 1];
        this[regionsProp][lastIndex] = region;
    }

    moveToBack(regionId) {
        const index = this[regionsProp].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === 0)
            return;

        if (index === 0)
            return;

        const region = this[regionsProp][index];
        this[regionsProp][index] = this[regionsProp][index - 1];
        this[regionsProp][index - 1] = region;
    }

    moveToFront(regionId) {
        const index = this[regionsProp].findIndex(x => x.id === regionId);
        if (index < 0)
            throw new Error('Unknown region with ID: ' + regionId);

        if (index === 0)
            return;

        if (index === (this[regionsProp].length - 1))
            return;

        const region = this[regionsProp][index];
        this[regionsProp][index] = this[regionsProp][index + 1];
        this[regionsProp][index + 1] = region;
    }

    findRegionByXY(x, y) {
        const region = this[regionsProp].find(r => r.shape.containsPoint(x, y));
        if (!region) {
            return null;
        }

        const localPoint = region.shape.getLocalPoint(x, y);
        return region.findRegionByXY(localPoint.x, localPoint.y) || region;
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
