'use strict';

export const fn = {
    compose2: function (first, second, target) {
        return function() {
            const t = target || this;
            first.apply(t, arguments);
            second.apply(t, arguments);
        }
    }
};