'use strict';

export const textAlign = {
    start: 'start',
    end: 'end',
    left: 'left',
    right: 'right',
    center: 'center'
};
textAlign.default = textAlign.start;

export const textBaseLine = {
    top: 'top',
    hanging: 'hanging',
    middle: 'middle',
    alphabetic: 'alphabetic',
    ideographic: 'ideographic',
    bottom: 'bottom'
};
textBaseLine.default = textBaseLine.alphabetic;

export const defaultTheme = {
    windowActiveTitle: '#667',
    windowActiveTitleText: '#fff',
    windowInactiveTitle: '999',
    windowInactiveTitleText: '#fff',
    windowBorderColor: '#555',
    windowBgColor: '#ddd',
    windowTitleFont: '12px Serif',

    controlFont: '12px Serif',
    controlActiveBgColor: '#667',
    controlActiveTextColor: '#000',
};

const controlColors = {
    /** Gets the color of the active window's border. */
    activeBorder: '#555',

    /** Gets the color of the background of the active window's title bar. */
    activeCaption: '#66f',

    /** Gets the color of the text in the active window's title bar. */
    activeCaptionText: '#fff',

    /** Gets the color of the application workspace. */
    appWorkspace: '',

    /** Gets the face color of a 3-D element. */
    buttonFace: '#ddd',

    /** Gets the highlight color of a 3-D element. */
    buttonHighlight: '',

    /** Gets the shadow color of a 3-D element. */
    buttonShadow: '',

    /** Gets the face color of a 3-D element. */
    control: '#ddd',

    /** Gets the shadow color of a 3-D element. */
    controlDark: '',

    /** Gets the dark shadow color of a 3-D element. */
    controlDarkDark: '',

    /** Gets the light color of a 3-D element. */
    controlLight: '',

    /** Gets the highlight color of a 3-D element. */
    controlLightLight: '',

    /** Gets the color of text in a 3-D element. */
    controlText: '#000',

    /** Gets the color of the desktop. */
    desktop: '',

    /** Gets the lightest color in the color gradient of an active window's title bar. */
    gradientActiveCaption: '',

    /** Gets the lightest color in the color gradient of an inactive window's title bar. */
    gradientInactiveCaption: '',

    /** Gets the color of dimmed text. */
    grayText: '',

    /** Gets the color of the background of selected items. */
    highlight: '',

    /** Gets the color of the text of selected items. */
    highlightText: '#fff-',

    /** Gets the color used to designate a hot-tracked item. */
    hotTrack: '',

    /** Gets the color of an inactive window's border. */
    inactiveBorder: '',

    /** Gets the color of the background of an inactive window's title bar. */
    inactiveCaption: '',

    /** Gets the color of the text in an inactive window's title bar. */
    inactiveCaptionText: '',

    /** Gets the color of the background of a ToolTip. */
    info: '',

    /** Gets the color of the text of a ToolTip. */
    infoText: '',

    /** Gets the color of a menu's background. */
    menu: '',

    /** Gets the color of the background of a menu bar. */
    menuBar: '',

    /** Gets the color used to highlight menu items when the menu appears as a flat menu. */
    menuHighlight: '',

    /** Gets the color of a menu's text. */
    menuText: '',

    /** Gets the color of the background of a scroll bar. */
    scrollBar: '',

    /** Gets the color of the background in the client area of a window. */
    window: '',

    /** Gets the color of a window frame. */
    windowFrame: '',

    /** Gets the color of the text in the client area of a window. */
    windowText: ''
};
