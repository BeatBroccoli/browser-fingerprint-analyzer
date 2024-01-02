// ==UserScript==
// @name         Window Property Logger
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Use this script to help debug what properties are being used to create a fingerprint
// @author       BeatBroccoli
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const processedObjects = new WeakMap();

    function logProperties(obj, path = '', depth = 0, maxDepth = 30) {

        console.log('Trapping', path);
        if (depth >= maxDepth || processedObjects.has(obj)) return;
        processedObjects.set(obj, true);

        //debugger;
        for (const key in obj) {
            console.log('Key', key);
            if (obj[key]) {

                const fullPath = path === '' ? key : `${path}.${key}`;
                const value = obj[key];

                if (typeof value === 'object' && value !== null) {
                    // Recursively handle nested objects
                    logProperties(value, fullPath, depth + 1, maxDepth);
                } else {
                    try {
                        Object.defineProperty(obj, key, {
                            get: function() {
                                console.warn(`Reading ${fullPath}`);
                                return value;
                            },
                            set: function(newValue) {
                                console.warn(`Writing ${fullPath} with value ${newValue}`);
                                value = newValue;
                            },
                        });
                    } catch (error) {
                        //console.warn(`Failed to define property '${fullPath}': ${error.message}`);
                    }
                }
            }
        }
    }

    logProperties(unsafeWindow);

})();
