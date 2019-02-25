import {UIControl, UIEvents} from './ui-controls-base.js';
import {getMousePosition} from "./ui-helpers.js";

const $handleRegionEvents = Symbol('handleRegionEvents');
const $regionsUnderMouse = Symbol.for('regionsUnderMouse');
const $redrawRequired = Symbol.for('redrawRequired');

export class UIControlLayout extends UIControl {
    constructor(shape) {
        super(shape);
        this.region.update(shape, this, this[$handleRegionEvents].bind(this));

        /** @type {UIForm[]} */ this.dialogs = [];

        /** @description List of regions that is currently located under mouse pointer.
         *  Used to calculate & fire mouseIn\mouseOut events
         *  @type {Region[]} */
        this[$regionsUnderMouse] = [];
    }

    [$handleRegionEvents](eventName, args) {

    };

    handleMouseClick(args) {
        const point = getMousePosition(args);
        const childRegion = this.region.findRegionByXY(point.x, point.y, false);
        if (!childRegion)
            return;

        /**@type{UIControl}*/const childControl = childRegion.data;
        layoutHelper.handleClick(this, childControl);

        const region = this.region.findRegionByXY(point.x, point.y, true);
        if (region) {
            region.data.fireEvent(UIEvents.click, args);
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

            for (let i =- oldRegions.length - 1; i >= maxSameLength; i--) {
                const data = oldRegions[i].region.data;
                data.fireEvent(UIEvents.mouseOut, args);
            }

            for (let i = newRegions.length - 1; i >= maxSameLength; i--) {
                const data = newRegions[i].region.data;
                data.fireEvent(UIEvents.mouseIn, args);
            }

            for (let i = maxSameLength - 1; i >= 0; i--) {
                const data = newRegions[i].region.data;
                data.fireEvent(UIEvents.mouseMove, args);
            }

            this[$regionsUnderMouse] = newRegions;
        }
    }

    handleCanvasMouseOut() {
        const regionsUnderMouse = this[$regionsUnderMouse];
        for (let i = regionsUnderMouse.length - 1; i >= 0; i--) {
            const region = regionsUnderMouse[i].region;
            region.data.fireEvent(UIEvents.mouseOut, null);
        }

        this[$regionsUnderMouse] = [];
    }
}

export const layoutHelper = {
    /**
     * @param parent {UIControl}
     * @param child {UIControl}
     */
    handleClick: function(parent, child) {
        if (child.layoutProperties.form) {
            handleClickForForm(parent, child);
        }
    }
};

/**
 * @param parent {UIControl}
 * @param form {UIControl|IFormControl}
 */
function handleClickForForm(parent, form) {
    if (form.isTopMost) {
        parent.region.bringToFront(form.region.id);
    }
    else {
        let lastTopMostRegion = null;
        parent.region.enumRegions(region => {
            if (region.data.isTopMost) {
                lastTopMostRegion = region;
                return false;
            }

            return true;
        });

        if (lastTopMostRegion !== null) {
            parent.region.moveAfter(lastTopMostRegion.id, form.region.id);
            parent[$redrawRequired] = true;
        }
        else {
            parent.region.bringToFront(form.region.id);
        }
    }

    form[$redrawRequired] = true;
}

/** @interface IFormControl */
/** @field IFormControl#isTopMost {boolean} */
