import {UIControl} from './ui-controls-base.js';
import {getMousePosition} from "./ui-helpers.js";

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
        const region = this.region.findRegionByXY(args.clientX, args.clientY, true);
        if (region) {
            region.data.fireEvent('click', args);
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
        const point = getMousePosition(args);
        if (!this.region.shape.containsPoint(point.x, point.y)) {
            this.handleCanvasMouseOut();
        }
        else {
            const oldRegions = this[$regionsUnderMouse];
            const newRegions = this.region.findAllRegionsByXY(point.x, point.y);
            const ml = Math.min(oldRegions.length, newRegions.length);
            let maxSameLength = 0;
            while (maxSameLength < ml && oldRegions[maxSameLength].id === newRegions[maxSameLength].id) maxSameLength++;

            for (let i = oldRegions.length - 1; i >= maxSameLength; i--) {
                const data = oldRegions[i].region.data;
                data.fireEvent('mouseOut', args);
            }

            for (let i = newRegions.length - 1; i >= maxSameLength; i--) {
                const data = newRegions[i].region.data;
                data.fireEvent('mouseIn', args);
            }

            for (let i = maxSameLength - 1; i >= 0; i--) {
                const data = newRegions[i].region.data;
                data.fireEvent('mouseMove', args);
                ////data.onMouseMove && data.onMouseMove(args);
            }

            this[$regionsUnderMouse] = newRegions;
        }
    }

    handleCanvasMouseOut() {
        const regionsUnderMouse = this[$regionsUnderMouse];
        for (let i = regionsUnderMouse.length - 1; i >= 0; i--) {
            const region = regionsUnderMouse[i];
            region.data.fireEvent('mouseOut', null);
        }

        this[$regionsUnderMouse] = [];
    }
}
