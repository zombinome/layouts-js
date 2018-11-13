'use strict';

/**
 * Based on:
 * https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
 * @param [canvasElement] {HTMLCanvasElement}
 * @returns {number} pixel ratio
 */
export function getPixelRatio(canvasElement) {
    const ctx = (canvasElement || document.createElement('canvas')).getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // noinspection SpellCheckingInspection
    const bspr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

    return dpr / bspr;
}

export function scaleCanvas(canvasElement, width, height) {
    const pixelRatio = getPixelRatio(canvasElement);

    canvasElement.width = width * pixelRatio;
    canvasElement.height = height * pixelRatio;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';

    canvasElement.getContext('2d').scale(pixelRatio, pixelRatio);
}
