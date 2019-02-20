import {UIControl} from './ui-controls-base.js';

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
                data.fireEvent('mouseOut', args);
                ////data.onMouseOut && data.onMouseOut(args);
            }

            for (let i = newRegions.length - 1; i >= maxSameLength; i--) {
                const data = newRegions[i].region.data;
                data.fireEvent('mouseId', args);
                ////data.onMouseIn && data.onMouseIn(args);
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
            if (region.data.onMouseOut) {
                region.data.onMouseOut();
            }
        }

        this[$regionsUnderMouse] = [];
    }
}
