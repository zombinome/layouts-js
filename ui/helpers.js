'use strict';

import {Rect} from '../regions.js';
import {backgroundImageAlign} from "./ui-constants.js";

export const imageHelper = {
    /**
     * @param imageSource {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
     * @param clip {Rect}
     * @return {Rect};
     */
    getImageBounds: function(imageSource, clip) {
        let maxWidth, maxHeight;
        if (imageSource instanceof Image) {
            maxWidth = imageSource.naturalWidth;
            maxHeight = imageSource.naturalHeight;
        }
        else {
            maxWidth = imageSource.width;
            maxHeight = imageSource.height;
        }

        if (!clip) {
            return new Rect(0, 0, maxWidth, maxHeight);
        }

        let x = clip.x, y = clip.y, w = clip.width, h = clip.height;
        if (x < 0) {
            w = w + x;
            x = 0;
        }

        if (x + w > maxWidth) {
            w = maxWidth - x;
        }

        if (y < 0) {
            h = h + y;
            y = 0;
        }

        if (y + h > maxHeight) {
            h = maxHeight - y;
        }

        return new Rect(x, y, w, h);
    },

    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param destinationArea {Rect}
     * @param imageSource {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
     * @param sourceArea {Rect}
     * @param imageAlign {string}
     */
    copyImage: function(ctx, destinationArea, imageSource, sourceArea, imageAlign) {
        let srcRatio = sourceArea.width / sourceArea.height,
            dstRatio = destinationArea.width / destinationArea.height;

        switch (imageAlign) {
            case backgroundImageAlign.stretch:
                copyImageWithStretchAlign(ctx, imageSource, sourceArea, destinationArea);
                break;
            case backgroundImageAlign.center:
                copyImageWithCenterAlign(ctx, imageSource, sourceArea, destinationArea);
                break;
            case backgroundImageAlign.fit:
                copyImageWithFitAlign(ctx, imageSource, sourceArea, destinationArea);
                break;

        }
    }
};

function copyImageWithStretchAlign(ctx, imageSource, sourceArea, destArea) {
    ctx.drawImage(
        imageSource,
        sourceArea.x, sourceArea.y, sourceArea.width, sourceArea.height,
        destArea.x, destArea.y, destArea.width, destArea.height);
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param imageSource {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
 * @param sourceArea {Rect}
 * @param destArea {Rect}
 */
function copyImageWithCenterAlign(ctx, imageSource, sourceArea, destArea) {
    let sourceX = sourceArea.x,
        sourceY = sourceArea.y,
        sourceW = sourceArea.width,
        sourceH = sourceArea.height,
        destX = destArea.x,
        destY = destArea.y,
        destW = destArea.width,
        destH = destArea.height;

    if (sourceW > destW) {
        const delta = sourceW - destW;
        sourceX += delta / 2;
        sourceW = destW;
    }

    if (sourceH > destH) {
        const delta = sourceH - destH;
        sourceY += delta / 2;
        sourceH = destH;
    }

    if (sourceW < destW) {
        const delta = destW - sourceW;
        destX += delta / 2;
        destW = sourceW;
    }

    if (sourceH < destH) {
        const delta = destH - sourceH;
        destH += delta / 2;
        destH = sourceH;
    }

    ctx.drawImage(imageSource, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param imageSource {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
 * @param sourceArea {Rect}
 * @param destArea {Rect}
 */
function copyImageWithFitAlign(ctx, imageSource, sourceArea, destArea) {

}