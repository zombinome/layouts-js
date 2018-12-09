import {backgroundImagePosition} from "./ui-controls-base.js";
import {Rect} from "../regions.js";

'use strict';

const imageHelpers = {
    /**
     * @param ctx {CanvasRenderingContext2D}
     * @param imageSource {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
     * @param sourceRect {Rect}
     * @param destRect {Rect}
     * @param bgImagePosition {string}
     */
    drawImage: function(ctx, imageSource, sourceRect, destRect, bgImagePosition) {
        switch (bgImagePosition) {
            case backgroundImagePosition.stretch:
                ctx.drawImage(imageSource,
                    sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
                    destRect.x, destRect.y, destRect.width, destRect.height);
                break;

            case backgroundImagePosition.center:
                drawImageWithCenterPosition(ctx, imageSource, sourceRect, destRect);
                break;

            case backgroundImagePosition.fit:
                drawImageWithFitPosition(ctx, imageSource, sourceRect, destRect);
                break;

            case backgroundImagePosition.fill:
                drawImageWithFillPosition(ctx, imageSource, sourceRect, destRect);
                break;
        }
    }
};

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param imageSource {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
 * @param sourceRect {Rect}
 * @param destRect {Rect}
 */
function drawImageWithCenterPosition(ctx, imageSource, sourceRect, destRect) {
    let sourceX = sourceRect.x,
        sourceY = sourceRect.y,
        sourceWidth = sourceRect.width,
        sourceHeight = sourceRect.height,
        destX = destRect.x,
        destY = destRect.y,
        destWidth = destRect.width,
        destHeight = destRect.height;

    if (sourceWidth > destWidth) {
        let delta = sourceWidth - destWidth;
        sourceX += delta / 2;
        sourceWidth = destWidth;
    }

    if (sourceHeight > destHeight) {
        let delta = sourceHeight - destHeight;
        sourceY += delta / 2;
        sourceHeight = destHeight;
    }

    if (sourceWidth < destWidth) {
        destX += (destWidth - sourceWidth) / 2;
        destWidth = sourceWidth;

    }

    if (sourceHeight <= destHeight) {
        destY += (destHeight - sourceHeight) / 2;
        destHeight = sourceHeight;
    }

    ctx.drawImage(imageSource,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destX, destY, destRect.width, destRect.height);
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param imageSource {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
 * @param sourceRect {Rect}
 * @param destRect {Rect}
 */
function drawImageWithFitPosition(ctx, imageSource, sourceRect, destRect) {
    let destX = destRect.x,
        destY = destRect.y;

    const scale = Math.min(destRect.height / sourceRect.height, destRect.width / sourceRect.width);

    const destWidth = destRect.width * scale;
    if (destWidth < destRect.width) {
        destX += (destRect.width - destWidth) / 2;
    }

    const destHeight = destRect.height * scale;
    if (destHeight < destRect.height) {
        destY += (destRect.height - destHeight) / 2;
    }

    ctx.drawImage(imageSource,
        sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
        destX, destY, destWidth, destHeight);
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param imageSource {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
 * @param sourceRect {Rect}
 * @param destRect {Rect}
 */
function drawImageWithFillPosition(ctx, imageSource, sourceRect, destRect) {
    const scale = Math.max(destRect.height / sourceRect.height, destRect.width / sourceRect.width);


}
