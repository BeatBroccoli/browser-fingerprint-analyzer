// ==UserScript==
// @name         Canvas Fingerprint Inspector
// @version      2023-12-11
// @description  Use this script to preview what fingerprint are being generated
// @author       BeatBroccoli
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    if(false) {
        unsafeWindow.HTMLCanvasElement.prototype._toDataURL = unsafeWindow.HTMLCanvasElement.prototype.toDataURL;
        unsafeWindow.HTMLCanvasElement.prototype.toDataURL = function() {
            var originalDataURL = unsafeWindow.HTMLCanvasElement.prototype._toDataURL.call(this);
            setTimeout(function() { appendFingerprint(originalDataURL, document.location.href); }, 1000);
            return originalDataURL;
        };
    } else {
        let proxyHandler = {
            apply: function (target, thisArg, argumentsList) {
                let originalData = target.apply(thisArg, argumentsList);
                if (originalData instanceof Blob) {
                    let reader = new FileReader();
                    reader.onloadend = function () {
                        let blobDataUrl = reader.result;
                        setTimeout(function () {  appendFingerprint(blobDataUrl, document.location.href); }, 1000);
                    };
                    reader.readAsDataURL(originalData);
                } else if (typeof originalData === 'string') {
                    setTimeout(function () { appendFingerprint(originalData, document.location.href); }, 1000);
                }
                return originalData;
            }
        };
        let canvasToDataURLProxy = new Proxy(unsafeWindow.HTMLCanvasElement.prototype.toDataURL, proxyHandler);
        unsafeWindow.HTMLCanvasElement.prototype.toDataURL = canvasToDataURLProxy;
        let canvasToBlobProxy = new Proxy(unsafeWindow.HTMLCanvasElement.prototype.toBlob, proxyHandler);
        unsafeWindow.HTMLCanvasElement.prototype.toBlob = canvasToBlobProxy;
    }

    let $container = document.createElement('div');
    $container.classList.add('fingerprints-analyzer');

    let css = `
      .fingerprints-analyzer { padding: 5px; position: fixed; bottom: 10px; left: 0; z-index: 999999; background: #FFF; white-space: nowrap; overflow: auto; max-width: 20px; border-radius: 0 10px 10px 0; opacity: 0.1 }
      .fingerprints-analyzer:hover { max-width: 80%; opacity: 1 }
      .fingerprints-analyzer .canvasprint { margin: 10px; display: inline-block; max-width: 100px; }
      .fingerprints-analyzer img { max-width: 100%; border: 1px solid #F00; min-width: 50px; max-height: 50px; image-rendering: pixelated; object-fit: contain }
      .fingerprints-analyzer b, .fingerprints-analyzer a { font-size: 10px; max-width: 100%; overflow: hidden; display: block }
    `;
    let styles = document.createElement('style');
    styles.innerHTML += css;
    $container.append(styles);

    let idx = 1;
    let appended = false;
    function appendFingerprint(src, url) {
        let cid = 'cid-' + idx++;
        let $html = document.createElement('div');
        $html.classList.add('canvasprint', cid);
        let dom = '';
        dom += '<b class="size">- x -</b>';
        dom += '<img src="' + src + '">';
        dom += '<a class="url" href="'+url+'">'+ url +'</a>';
        dom += '<b class="hash">xxxxxxxxx</b>';
        $html.innerHTML = dom;
        $container.append($html);
        if(!document.contains($container)) document.body.append($container);

        const img = new Image(); img.src = src;
        img.onload = function() { $html.querySelector('.size').innerText = img.naturalWidth + ' x ' + img.naturalHeight; };

        generateSHA512Hash(src).then(hash => { $html.querySelector('.hash').innerText = hash; });

    }

    async function generateSHA512Hash(inputString) {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputString);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

})();