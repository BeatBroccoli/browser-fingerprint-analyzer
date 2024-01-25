// ==UserScript==
// @name         Window Property Logger
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Use this script to help debug what properties are being used to create a fingerprint
// @author       Your Name
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let usedProps = {};
    const processedObjects = new WeakMap();
    let logIgnore = ['performance.now', 'requestAnimationFrame', 'setTimeout', 'setInterval', 'history.replaceState'];
    logIgnore = logIgnore.concat(['document.querySelectorAll', 'document.querySelector', 'document.createElement', 'document.getElementById', 'document.importNode']);
    Error.stackTraceLimit = Infinity;

    function getCallerFile() {
        let stack = new Error().stack.split('\n');
        stack = stack.filter((s) => { return s.indexOf('chrome-extension://') < 0; }).slice(1);
        return stack.join('\n');
    }

    function logProperties(obj, path = '', depth = 0, maxDepth = 30) {

        //console.log('Trapping', path);
        if (depth >= maxDepth || processedObjects.has(obj)) return;
        processedObjects.set(obj, true);

        //debugger;
        for (const key in obj) {
            //console.log('Key', key);
            if (obj[key]) {

                const fullPath = path === '' ? key : `${path}.${key}`;
                let value = obj[key];
                if(logIgnore.indexOf(fullPath) > -1) continue;

                if (typeof value === 'object' && value !== null) {
                    // Recursively handle nested objects
                    logProperties(value, fullPath, depth + 1, maxDepth);
                } else {
                    try {
                        Object.defineProperty(obj, key, {
                            get: function() {
                                if(!usedProps[fullPath]) usedProps[fullPath] = 0;
                                usedProps[fullPath]++;
                                let callerFile = getCallerFile();
                                console.warn(`Reading ${fullPath}`); // ,'\n', callerFile
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
    unsafeWindow.usedProps = usedProps;

})();
