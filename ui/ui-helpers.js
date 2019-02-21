import {backgroundImagePosition} from "./ui-controls-base.js";
import {Rect, Point} from "../regions.js";

'use strict';

/**
 * Based on:
 * https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
 * @param [canvasElement] {HTMLCanvasElement}
 * @returns {number} pixel ratio
 */
export function getPixelRatio(canvasElement) {
    // /**@type {CanvasRenderingContext2D}*/
    // const ctx = (canvasElement || document.createElement('canvas')).getContext('2d');
    // const dpr = window.devicePixelRatio || 1;
    // // noinspection SpellCheckingInspection
    // const bspr = ctx.webkitBackingStorePixelRatio ||
    //     ctx.mozBackingStorePixelRatio ||
    //     ctx.msBackingStorePixelRatio ||
    //     ctx.oBackingStorePixelRatio ||
    //     ctx.backingStorePixelRatio || 1;
    //
    // return dpr / bspr;
    return window.devicePixelRatio || 1;
}

/**
 * @param canvasElement {HTMLCanvasElement}
 * @param width {number}
 * @param height {number}
 */
export function scaleCanvas(canvasElement, width, height) {
    const pixelRatio = getPixelRatio(canvasElement);

    canvasElement.width = width * pixelRatio;
    canvasElement.height = height * pixelRatio;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';

    canvasElement.getContext('2d').scale(pixelRatio, pixelRatio);
}

/** @param args {MouseEvent}
 *  @returns {Point} */
export function getMousePosition(args) {
    const x = args.clientX - args.target.offsetLeft;
    const y = args.clientY - args.target.offsetTop;
    return new Point(x, y);
}

export const imageHelpers = {
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
    },

    /**
     * @param imageSource {HTMLCanvasElement|HTMLImageElement|ImageBitmap}
     */
    getImageRect(imageSource) {
        if (imageSource instanceof HTMLImageElement
        || imageSource instanceof HTMLCanvasElement
        || imageSource instanceof ImageBitmap) {
            return new Rect(0, 0, imageSource.width, imageSource.height);
        }

        throw new Error('Unsupported ImageSource');
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
        destX, destY, destWidth, destHeight);
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

    const destWidth = sourceRect.width * scale;
    if (destWidth < destRect.width) {
        destX += (destRect.width - destWidth) / 2;
    }

    const destHeight = sourceRect.height * scale;
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
    let sourceX = sourceRect.x,
        sourceY = sourceRect.y;

    const scale = Math.min(sourceRect.height / destRect.height, sourceRect.width / destRect.width);

    const sourceWidth = destRect.width * scale;
    if (sourceWidth < sourceRect.width) {
        sourceX += (sourceRect.width - sourceWidth) / 2;
    }

    const sourceHeight = destRect.height * scale;
    if (sourceHeight < sourceRect.height) {
        sourceY += (sourceRect.height - sourceHeight) / 2;
    }

    ctx.drawImage(imageSource,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destRect.x, destRect.y, destRect.width, destRect.height);
}

const screenScale = getPixelRatio(null);
const canvasScale = 1 / screenScale;

function normalizeRect(rect, maxWidth, maxHeight) {
    if (screenScale === 1) {
        return rect;
    }

    let newWidth = rect.width * canvasScale,
        newHeight = rect.height * canvasScale,
        newX, newY;

    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newX = 0;
    } else {
        const widthDelta = (newWidth - rect.width) / 2;
        newX = rect.x - widthDelta;
    }

    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newX = 0;
    } else {
        const heightDelta = (newHeight - rect.height) / 2;
        newY = rect.y - heightDelta;

    }

    return new Rect(newX, newY, newWidth, newHeight);
}
