(function () {

    'use strict';
    
    window.addEventListener('error', function (e) {
    console.error('[Lumio] window error:', e.message, e.filename, e.lineno, e.colno, e.error);
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('[Lumio] promise rejection:', e.reason);
});

    if (window.nexus_online_plugin_started) return;
    window.nexus_online_plugin_started = true;

    var NEXUS_VERSION   = '1.25.5';
    var NEXUS_COMPONENT = 'nexusonline';
    var NEXUS_TITLE     = 'Lumio';
    var NEXUS_DEBUG     = false;
    var NEXUS_CACHE_TTL = 6 * 60 * 60 * 1000;
    var NEXUS_CONTENT_CACHE_TTL = 45 * 60 * 1000;
    var NEXUS_FAST_SOURCE_LIMIT = 5;
    var NEXUS_SOURCE_PROBE_TIMEOUT = 6500;
    var NEXUS_SOURCE_PROBE_CONCURRENCY = 4;
    var NEXUS_CONTENT_TIMEOUT = 16000;
var NEXUS_SOURCE_ATTEMPTS = 3;
var NEXUS_OPEN_ATTEMPTS = 3;

var NEXUS_MIN_TIMEOUT = 8000;

function timeoutForAttempt(base, attempt) {
    return base + (attempt * 4000);
}
    
    var NEXUS_SOURCE_ORDER = [
        'zetflix',
        'veoveo',
        'cdnvideohub',
        'kinotochka',
        'phantom',
        'uafilm',
        'leproduction',
        'filmix',
        'vkmovie',
        'pidtor'
    ];
    var NEXUS_SOURCE_ALIASES = {
        videohub: 'cdnvideohub',
        vkvideo: 'vkmovie'
    };
    var NEXUS_DEFAULT_SOURCE = 'zetflix';
    var NEXUS_BALANSER_STORAGE = 'lumio_online_balanser';
    
    var NEXUS_STORAGE_SCHEMA = '1.25.5';

function removeStorageKey(key) {
    try {
        if (Lampa.Storage.remove) Lampa.Storage.remove(key);
        else Lampa.Storage.set(key, null);
    } catch (e) {}

    try {
        if (window.localStorage) localStorage.removeItem(key);
    } catch (e2) {}
}

function resetLumioCacheOnce() {
    var saved = Lampa.Storage.get('lumio_storage_schema', '');

    if (saved === NEXUS_STORAGE_SCHEMA) return;

    try {
        if (window.localStorage) {
            Object.keys(localStorage).forEach(function (key) {
                if (
                    key.indexOf('lumio_sources_') === 0 ||
                    key.indexOf('lumio_content_') === 0 ||
                    key.indexOf('lumio_serial_choice_') === 0 ||
                    key.indexOf('lumio_choice_') === 0 ||
                    key.indexOf('nexus_choice_') === 0
                ) {
                    localStorage.removeItem(key);
                }
            });
        }
    } catch (e) {}

    removeStorageKey('lumio_source_latency');
    Lampa.Storage.set('lumio_storage_schema', NEXUS_STORAGE_SCHEMA);
}

resetLumioCacheOnce();

    // Замените на свой адрес когда поднимите свой lampac
    var NEXUS_HOST = 'https://beta.mitsu.tv/api';

    function resetTemplates() {

        Lampa.Template.add('nexus_prestige_folder',
            '<div class="lumio-prestige lumio-prestige--folder selector">' +
                '<div class="lumio-prestige__glow"></div>' +
                '<div class="lumio-prestige__media {media_class}" style="{media_style}">' +
                    '<div class="lumio-prestige__logo">' +
                        '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M32 4 58 18v28L32 60 6 46V18L32 4Z" fill="#12D6DF"/>' +
                            '<path d="M32 4 58 18 32 33 6 18 32 4Z" fill="#9B5CFF"/>' +
                            '<path d="M25 21v22l18-11-18-11Z" fill="#fff"/>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="lumio-prestige__body">' +
                    '<div class="lumio-prestige__head">' +
                        '<div class="lumio-prestige__title">{title}</div>' +
                        '<div class="lumio-prestige__time">{time}</div>' +
                    '</div>' +
                    '<div class="lumio-prestige__footer">' +
                        '<div class="lumio-prestige__info">{info}</div>' +
                        '<div class="lumio-prestige__badge {badge_class}">{badge}</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        Lampa.Template.add('nexus_content_loading',
            '<div class="lumio-empty nexus-loader">' +
                '<div class="nexus-loader__mark">{logo}</div>' +
                '<div class="nexus-loader__title">{title}</div>' +
                '<div class="nexus-loader__text">{text}</div>' +
                '<div class="nexus-loader__bar"><i></i></div>' +
            '</div>'
        );

        Lampa.Template.add('nexus_doesnotanswer',
            '<div class="lumio-empty">' +
                '<div class="lumio-empty__title">{title}</div>' +
                '<div class="lumio-empty__time">{text}</div>' +
            '</div>'
        );

    }

    resetTemplates();

    if (!document.getElementById('nexus-css')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'nexus-css';
        styleEl.textContent = '.lumio-prestige{position:relative;overflow:hidden;border-radius:.55em;background:linear-gradient(110deg,rgba(15,23,42,.76),rgba(7,11,22,.48));border:1px solid rgba(255,255,255,.12);box-shadow:0 .45em 1.2em rgba(0,0,0,.22);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;min-height:7.4em}.lumio-prestige__glow{position:absolute;inset:-45% -10% auto auto;width:12em;height:12em;background:radial-gradient(circle,rgba(18,214,223,.25),rgba(155,92,255,0) 68%);pointer-events:none}.lumio-prestige__body{padding:1.05em 1.15em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative;min-width:0}.lumio-prestige__media{width:5.2em;min-height:7.4em;background-color:rgba(255,255,255,.08);background-position:center;background-size:cover;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;position:relative}.lumio-prestige__media:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(5,8,16,.44))}.lumio-prestige__media--poster .lumio-prestige__logo{display:none}.lumio-prestige__logo{position:absolute;left:50%;top:50%;width:3.7em;height:3.7em;transform:translate(-50%,-50%);filter:drop-shadow(0 .35em .8em rgba(0,0,0,.38));z-index:1}.lumio-prestige__logo svg{width:100%!important;height:100%!important}.lumio-prestige__head,.lumio-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;gap:.8em}.lumio-prestige__title{font-size:1.55em;font-weight:600;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.lumio-prestige__time,.lumio-prestige__badge{font-size:.86em;padding:.28em .58em;border-radius:.45em;background:rgba(18,214,223,.16);color:#bdfaff;white-space:nowrap}.lumio-prestige__time:empty,.lumio-prestige__badge:empty{display:none}.lumio-prestige__info{font-size:1.02em;color:rgba(255,255,255,.72);overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.lumio-prestige--folder .lumio-prestige__footer{margin-top:.85em}.lumio-prestige.focus{background:linear-gradient(110deg,rgba(18,214,223,.22),rgba(155,92,255,.24)),rgba(7,11,22,.78)}.lumio-prestige.focus:after{content:"";position:absolute;top:-0.34em;left:-0.34em;right:-0.34em;bottom:-0.34em;border-radius:.75em;border:solid .22em #fff;z-index:-1;pointer-events:none}.lumio-prestige .lumio-prestige{margin-top:1.5em}.lumio-empty{line-height:1.4}.lumio-empty__title{font-size:1.8em;margin-bottom:.3em}.lumio-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.nexus-loader{padding:2.2em 1em;text-align:center}.nexus-loader__mark{width:4.8em;height:4.8em;margin:0 auto 1em;animation:nexusPulse 1.3s ease-in-out infinite}.nexus-loader__mark svg{width:100%;height:100%;filter:drop-shadow(0 .6em 1.2em rgba(18,214,223,.28))}.nexus-loader__title{font-size:1.65em;font-weight:600}.nexus-loader__text{font-size:1.05em;color:rgba(255,255,255,.64);margin-top:.35em}.nexus-loader__bar{position:relative;overflow:hidden;width:15em;max-width:78%;height:.28em;margin:1.25em auto 0;border-radius:2em;background:rgba(255,255,255,.14)}.nexus-loader__bar i{position:absolute;inset:0 auto 0 0;width:45%;border-radius:inherit;background:linear-gradient(90deg,#12d6df,#9b5cff);animation:nexusLoad 1.15s ease-in-out infinite}@keyframes nexusPulse{0%,100%{transform:scale(.96);opacity:.72}50%{transform:scale(1);opacity:1}}@keyframes nexusLoad{0%{transform:translateX(-110%)}100%{transform:translateX(240%)}}.nexus--button svg{filter:drop-shadow(0 .2em .45em rgba(18,214,223,.35))}';
        styleEl.textContent += '.nexus-serial-filter{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;gap:.65em}.nexus-serial-filter__value{font-size:.78em;padding:.32em .55em;border-radius:.36em;background:rgba(255,255,255,.18);white-space:nowrap;color:#fff}.nexus-serial-filter.focus .nexus-serial-filter__value{background:rgba(18,214,223,.28)} .lumio-prestige__badge.nexus-badge--uhd{background:rgba(155,92,255,.22);color:#e4d4ff}.lumio-prestige__badge.nexus-badge--hd{background:rgba(34,197,94,.20);color:#9dffc0}.lumio-prestige__badge.nexus-badge--sd{background:rgba(234,179,8,.22);color:#ffe58a}';
        styleEl.textContent += '.lumio-prestige__media--voice{background:linear-gradient(145deg,rgba(18,214,223,.34),rgba(155,92,255,.20) 58%,rgba(15,23,42,.72));overflow:hidden}.lumio-prestige__media--voice .lumio-prestige__logo{display:none}.lumio-prestige__media--voice:before{content:"";position:absolute;left:50%;top:50%;width:2.75em;height:4.25em;transform:translate(-50%,-50%);background:rgba(255,255,255,.92);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 768 1280%22%3E%3Cg transform=%22translate(0,1280) scale(0.1,-0.1)%22%3E%3Cpath d=%22M3158 12790 c-91 -11 -256 -53 -350 -89 -504 -195 -884 -646 -995 -1184 -16 -76 -17 -285 -21 -2742 -3 -2824 -4 -2785 44 -2975 153 -606 674 -1083 1284 -1175 139 -22 1297 -22 1438 0 532 80 1005 457 1218 971 31 77 84 252 84 282 0 9 -159 12 -760 12 l-760 0 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 773 2 772 3 0 255 0 255 -772 3 -773 2 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 260 0 260 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 760 0 761 0 -7 38 c-12 71 -84 274 -128 361 -193 381 -532 678 -923 806 -213 69 -201 68 -923 71 -360 1 -685 -2 -722 -6z%22/%3E%3Cpath d=%22M3 6903 c4 -1139 2 -1097 68 -1418 104 -504 329 -976 672 -1408 101 -128 380 -408 513 -515 562 -451 1232 -709 1920 -740 l149 -7 0 -895 0 -895 -1087 -3 -1088 -2 0 -510 0 -510 2690 0 2690 0 0 510 0 510 -1087 2 -1088 3 0 895 0 895 149 7 c688 31 1358 289 1920 740 133 107 412 387 513 515 343 432 568 904 672 1408 66 321 64 279 68 1418 l4 1037 -510 0 -510 0 -4 -992 c-3 -960 -4 -998 -25 -1129 -41 -258 -116 -484 -236 -715 -113 -217 -227 -373 -406 -558 -357 -368 -795 -595 -1315 -683 -100 -16 -176 -18 -835 -18 -799 0 -798 0 -1062 66 -631 159 -1186 603 -1494 1193 -120 231 -195 457 -236 715 -21 131 -22 169 -25 1129 l-4 992 -510 0 -510 0 4 -1037z%22/%3E%3C/g%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 768 1280%22%3E%3Cg transform=%22translate(0,1280) scale(0.1,-0.1)%22%3E%3Cpath d=%22M3158 12790 c-91 -11 -256 -53 -350 -89 -504 -195 -884 -646 -995 -1184 -16 -76 -17 -285 -21 -2742 -3 -2824 -4 -2785 44 -2975 153 -606 674 -1083 1284 -1175 139 -22 1297 -22 1438 0 532 80 1005 457 1218 971 31 77 84 252 84 282 0 9 -159 12 -760 12 l-760 0 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 773 2 772 3 0 255 0 255 -772 3 -773 2 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 775 0 775 0 0 255 0 255 -775 0 -775 0 0 260 0 260 775 0 775 0 0 255 0 255 -775 0 -775 0 0 255 0 255 760 0 761 0 -7 38 c-12 71 -84 274 -128 361 -193 381 -532 678 -923 806 -213 69 -201 68 -923 71 -360 1 -685 -2 -722 -6z%22/%3E%3Cpath d=%22M3 6903 c4 -1139 2 -1097 68 -1418 104 -504 329 -976 672 -1408 101 -128 380 -408 513 -515 562 -451 1232 -709 1920 -740 l149 -7 0 -895 0 -895 -1087 -3 -1088 -2 0 -510 0 -510 2690 0 2690 0 0 510 0 510 -1087 2 -1088 3 0 895 0 895 149 7 c688 31 1358 289 1920 740 133 107 412 387 513 515 343 432 568 904 672 1408 66 321 64 279 68 1418 l4 1037 -510 0 -510 0 -4 -992 c-3 -960 -4 -998 -25 -1129 -41 -258 -116 -484 -236 -715 -113 -217 -227 -373 -406 -558 -357 -368 -795 -595 -1315 -683 -100 -16 -176 -18 -835 -18 -799 0 -798 0 -1062 66 -631 159 -1186 603 -1494 1193 -120 231 -195 457 -236 715 -21 131 -22 169 -25 1129 l-4 992 -510 0 -510 0 4 -1037z%22/%3E%3C/g%3E%3C/svg%3E") center/contain no-repeat;filter:drop-shadow(0 .45em .85em rgba(0,0,0,.34));z-index:1}.lumio-prestige__media--voice:after{background:linear-gradient(90deg,rgba(0,0,0,.04),rgba(5,8,16,.43))}.nexus-voice-tone-0{background:linear-gradient(145deg,rgba(18,214,223,.34),rgba(155,92,255,.20) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-1{background:linear-gradient(145deg,rgba(34,197,94,.34),rgba(18,214,223,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-2{background:linear-gradient(145deg,rgba(244,114,182,.30),rgba(155,92,255,.22) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-3{background:linear-gradient(145deg,rgba(250,204,21,.30),rgba(34,197,94,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-4{background:linear-gradient(145deg,rgba(96,165,250,.34),rgba(18,214,223,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-5{background:linear-gradient(145deg,rgba(248,113,113,.30),rgba(250,204,21,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-6{background:linear-gradient(145deg,rgba(45,212,191,.34),rgba(96,165,250,.20) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-7{background:linear-gradient(145deg,rgba(192,132,252,.32),rgba(244,114,182,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-8{background:linear-gradient(145deg,rgba(251,146,60,.30),rgba(248,113,113,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-9{background:linear-gradient(145deg,rgba(74,222,128,.30),rgba(250,204,21,.18) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-10{background:linear-gradient(145deg,rgba(56,189,248,.34),rgba(129,140,248,.20) 58%,rgba(15,23,42,.72))}.nexus-voice-tone-11{background:linear-gradient(145deg,rgba(217,70,239,.28),rgba(34,211,238,.18) 58%,rgba(15,23,42,.72))}.lumio-prestige__badge.nexus-badge--voice{background:rgba(18,214,223,.18);color:#bdfaff}';
        styleEl.textContent += '.nexus-logo-svg{display:block;width:48px;height:48px;overflow:visible;shape-rendering:geometricPrecision}.nexus-loader__mark{width:5.2em;height:5.2em;margin-bottom:1.05em}.nexus-loader__mark .nexus-logo-svg{width:100%;height:100%;filter:drop-shadow(0 .55em 1.15em rgba(18,214,223,.24))}.nexus--button{display:flex;align-items:center;gap:.45em}.nexus--button .nexus-menu-icon{display:none!important}.nexus--button .nexus-logo-svg{width:1.55em!important;height:1.55em!important;min-width:1.55em;min-height:1.55em;flex:none;filter:drop-shadow(0 .18em .34em rgba(18,214,223,.26))}.nexus--button span{display:inline-block}.nexus-controls-hidden{display:none!important}';
        document.head.appendChild(styleEl);
    }

    var Network = Lampa.Reguest;

    // Lampac validates generated proxy links against this shared session ID.
    // It is a protocol value, not Lumio's own preference.
    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
        unic_id = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    function accountUrl(url) {
    url = String(url);

    if (url.indexOf('uid=') === -1) {
        var uid = Lampa.Storage.get('lampac_unic_id', '');
        if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }

    if (url.indexOf('nws_id=') === -1) {
        var nwsid = Lampa.Storage.get('lampac_nws_id', '') || Lampa.Storage.get('lampac_nwsid', '');
        if (nwsid) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nwsid));
    }

    return url;
}

function addHeaders() {
    var kit_aesgcmkey = Lampa.Storage.get('kit_aesgcmkey', '');
    if (kit_aesgcmkey) {
        return { 'X-Kit-AesGcm': kit_aesgcmkey };
    }
    return {};
}

    // RCH is required by a few Lampac providers. Keep the client private to
    // Lumio so it cannot alter the state or handlers of other online plugins.
    var nexusRch = {
        client: null,
        state: 'idle',
        type: '',
        waiters: [],
        scriptLoading: false,
        typeLoading: false
    };

    function nexusRchType() {
        return nexusRch.type || (Lampa.Platform.is('android') ? 'apk' : 'cors');
    }

    function nexusRchResolveType(done) {
        if (nexusRch.type) {
            done();
            return;
        }

        if (Lampa.Platform.is('android')) {
            nexusRch.type = 'apk';
            done();
            return;
        }

        if (Lampa.Platform.is('tizen')) {
            nexusRch.type = 'cors';
            done();
            return;
        }

        if (nexusRch.typeLoading) return;
        nexusRch.typeLoading = true;

        var check = new Network();
        check.timeout(3500);
        check.silent(NEXUS_HOST + '/cors/check', function () {
            nexusRch.type = 'cors';
            nexusRch.typeLoading = false;
            done();
        }, function () {
            nexusRch.type = 'web';
            nexusRch.typeLoading = false;
            done();
        }, false, {
            dataType: 'text',
            headers: addHeaders()
        });
    }

    function nexusRchWsUrl() {
        return NEXUS_HOST
            .replace(/^https:/i, 'wss:')
            .replace(/^http:/i, 'ws:')
            .replace(/\/api\/?$/i, '') + '/nws';
    }

    function nexusRchFinish(ok, error) {
        var waiters = nexusRch.waiters.splice(0);
        waiters.forEach(function (waiter) {
            if (ok) waiter.success();
            else if (waiter.error) waiter.error(error || {});
        });
    }

    function nexusRchPostResult(uri, rchId, html) {
        $.ajax({
            url: accountUrl(NEXUS_HOST + '/rch/' + uri + '?id=' + encodeURIComponent(rchId)),
            type: 'POST',
            data: html,
            async: true,
            cache: false,
            contentType: false,
            processData: false,
            headers: addHeaders(),
            success: function () {
                console.warn('[Lumio RCH] result delivered:', uri, rchId);
            },
            error: function () {
                console.warn('[Lumio RCH] result delivery failed:', uri, rchId);
                if (nexusRch.client) nexusRch.client.invoke('RchResult', rchId, '');
            }
        });
    }

    function nexusRchSendResult(rchId, html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
            html = JSON.stringify(html);
        }

        html = html == null ? '' : String(html);

        if (typeof CompressionStream === 'undefined' || typeof TextEncoder === 'undefined' || html.length <= 1000) {
            nexusRchPostResult('result', rchId, html);
            return;
        }

        try {
            var stream = new CompressionStream('gzip');
            var readable = new ReadableStream({
                start: function (controller) {
                    controller.enqueue(new TextEncoder().encode(html));
                    controller.close();
                }
            });

            new Response(readable.pipeThrough(stream)).arrayBuffer().then(function (buffer) {
                var zipped = new Uint8Array(buffer);
                nexusRchPostResult(zipped.length < html.length ? 'gzresult' : 'result', rchId, zipped.length < html.length ? zipped : html);
            }).catch(function () {
                nexusRchPostResult('result', rchId, html);
            });
        } catch (e) {
            nexusRchPostResult('result', rchId, html);
        }
    }

    function nexusRchHandleRequest(rchId, url, data, headers, returnHeaders) {
        var network = new Lampa.Reguest();

        console.warn('[Lumio RCH] request:', rchId, url);

        if (url === 'eval') {
            try {
                // Lampac sends these helpers only through this authenticated RCH socket.
                nexusRchSendResult(rchId, eval(data));
            } catch (e) {
                nexusRchSendResult(rchId, '');
            }
            return;
        }

        if (url === 'evalrun') {
            try { eval(data); } catch (e2) {}
            return;
        }

        if (url === 'ping') {
            nexusRchSendResult(rchId, 'pong');
            return;
        }

        network.native(url, function (result) {
            console.warn('[Lumio RCH] request completed:', rchId, String(result || '').length + ' bytes');
            nexusRchSendResult(rchId, result);
        }, function () {
            console.warn('[Lumio RCH] request failed:', rchId, url);
            nexusRchSendResult(rchId, '');
        }, data, {
            dataType: 'text',
            timeout: 8000,
            headers: headers || {},
            returnHeaders: returnHeaders
        });
    }

    function nexusRchConnect() {
        if (typeof NativeWsClient === 'undefined') {
            nexusRch.state = 'failed';
            nexusRch.scriptLoading = false;
            nexusRchFinish(false, { msg: 'Не удалось загрузить клиент RCH' });
            return;
        }

        var client = nexusRch.client = new NativeWsClient(nexusRchWsUrl(), {
            autoReconnect: true,
            onClose: function () {
                if (nexusRch.state === 'ready') nexusRch.state = 'connecting';
            },
            onError: function (error) {
                nexusLog('[Lumio] RCH websocket error:', error);
            }
        });

        client.on('Connected', function () {
            nexusRch.state = 'registering';
            nexusLog('[Lumio] RCH connected, registering device');
            client.invoke('RchRegistry', {
                host: location.host,
                rchtype: nexusRchType(),
                apkVersion: Lampa.Platform.is('android') ? parseInt(((navigator.userAgent || '').match(/Android\s+(\d+)/i) || [])[1] || 0, 10) : 0,
                player: Lampa.Storage.field('player')
            });
        });

        client.on('RchRegistry', function () {
            nexusRch.state = 'ready';
            nexusLog('[Lumio] RCH ready');
            console.warn('[Lumio RCH] ready:', nexusRchType(), client.connectionId || '');
            nexusRchFinish(true);
        });

        client.on('RchClient', nexusRchHandleRequest);
        client.connect();
    }

    function nexusRchEnsure(success, error) {
        if (nexusRch.state === 'ready' && nexusRch.client && nexusRch.client.connectionId != null) {
            success();
            return;
        }

        nexusRch.waiters.push({ success: success, error: error });

        if (nexusRch.state === 'connecting' || nexusRch.state === 'registering' || nexusRch.scriptLoading) return;

        nexusRch.state = 'connecting';

        nexusRchResolveType(function () {
        if (typeof NativeWsClient !== 'undefined') {
            nexusRchConnect();
            return;
        }

        nexusRch.scriptLoading = true;
        var script = document.createElement('script');
        script.src = NEXUS_HOST + '/js/nws-client-es5.js?v21042026';
        script.onload = function () {
            nexusRch.scriptLoading = false;
            nexusRchConnect();
        };
        script.onerror = function () {
            nexusRch.state = 'failed';
            nexusRch.scriptLoading = false;
            nexusRchFinish(false, { msg: 'Не удалось подключиться к RCH' });
        };
        document.head.appendChild(script);
        });
    }

    function nexusRchRequestUrl(url) {
        if (!url) return url;

        var type = encodeURIComponent(nexusRchType());
        if (/[?&]rchtype=/.test(url)) {
            return url.replace(/([?&]rchtype=)[^&]*/i, '$1' + type);
        }

        return Lampa.Utils.addUrlComponent(url, 'rchtype=' + type);
    }

    function nexusRchResponse(data) {
        var json = data;

        if (typeof json === 'string') {
            try {
                json = JSON.parse(json);
            } catch (e) {
                return null;
            }
        }

        return json && json.rch ? json : null;
    }

    function nexusPlainText(value) {
        return String(value == null ? '' : value)
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function nexusPidtorDetails(item) {
        var details = [];
        var quality = item.quality;
        var size = item.size_name || item.sizeName || item.filesize || item.file_size || item.torrent_size || item.size;
        var seeds = item.seeders || item.seeds || item.sid || item.peers;

        function add(value) {
            value = nexusPlainText(value);
            if (value && details.indexOf(value) === -1) details.push(value);
        }

        if (typeof quality === 'string' && quality) add(quality);
        else if (quality && typeof quality === 'object') {
            var variants = Object.keys(quality).filter(Boolean);
            if (variants.length) add(variants.join(', '));
        } else if (item.maxquality) {
            add(item.maxquality + 'p');
        }

        var voiceParts = nexusPlainText(item.voice_name || '').split(/\s*\/\s*/).filter(Boolean);
        voiceParts.forEach(function (part, index) {
            if (/^\d+$/.test(part) && (index === voiceParts.length - 1 || index > 0)) {
                add('Сиды: ' + part);
            } else {
                add(part);
            }
        });

        if (details.length && item.maxquality) {
            var maxquality = item.maxquality + 'p';
            if (details[0] !== maxquality && details.indexOf(maxquality) === -1) details.unshift(maxquality);
        }

        if (size !== undefined && size !== null && size !== '') {
            if (typeof size === 'number' && size > 1024) {
                var units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
                var index = 0;
                while (size >= 1024 && index < units.length - 1) {
                    size /= 1024;
                    index++;
                }
                size = (size >= 10 || index === 0 ? Math.round(size) : Math.round(size * 10) / 10) + ' ' + units[index];
            }
            add(size);
        }

        if (seeds !== undefined && seeds !== null && seeds !== '') {
            add('Сиды: ' + seeds);
        }

        return details.join(' · ');
    }

    function nexusPidtorKey(item) {
        var url = String(item.stream || item.url || '');

        // Tracker parameters describe the same torrent and should not create
        // several visually identical cards for a single hash.
        url = url.replace(/([?&])tr=[^&]*/gi, '$1').replace(/[?&]$/, '').replace('?&', '?');
        return [url, item.method || '', item.season || '', item.episode || ''].join('|');
    }

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function nexusLog() {
    if (NEXUS_DEBUG && window.console && console.log) {
        console.log.apply(console, arguments);
    }
}

function cleanImageUrl(url) {
    if (!url) return '';

    url = String(url);

    var cssUrl = url.match(/url\((['"]?)(.*?)\1\)/i);
    if (cssUrl && cssUrl[2]) url = cssUrl[2];

    if (url.indexOf('//') === 0) url = 'https:' + url;
    if (/^https?:\/\//i.test(url)) return url;

    if (url.charAt(0) === '/') {
        return 'https://image.tmdb.org/t/p/w342' + url;
    }

    return url;
}

function movieImage(movie) {
    movie = movie || {};

    var direct = movie.img || movie.poster || movie.cover || movie.image || movie.picture || movie.poster_path || movie.backdrop || movie.backdrop_path;
    if (direct) return cleanImageUrl(direct);

    try {
        if (Lampa.Utils.cardImg) return cleanImageUrl(Lampa.Utils.cardImg(movie));
    } catch (e) {}

    try {
        if (Lampa.Utils.cardImgBackground) return cleanImageUrl(Lampa.Utils.cardImgBackground(movie));
    } catch (e2) {}

    return '';
}

function mediaTemplateData(movie) {
    var img = movieImage(movie);

    return {
        media_class: img ? 'lumio-prestige__media--poster' : 'lumio-prestige__media--logo',
        media_style: img ? 'background-image:url(&quot;' + escapeHtml(img) + '&quot;)' : ''
    };
}

function stableIndex(value, max) {
    value = String(value || '');
    max = max || 1;

    var hash = 0;
    for (var i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash) % max;
}

function voiceMediaTemplateData(title, tone) {
    var index = parseInt(tone, 10);
    if (isNaN(index)) index = stableIndex(title, 12);

    return {
        media_class: 'lumio-prestige__media--voice nexus-voice-tone-' + (index % 12),
        media_style: ''
    };
}

function movieCacheKey(movie) {
    movie = movie || {};

    var year = String(movie.release_date || movie.first_air_date || '0000').slice(0, 4);
    var raw = [
        movie.source || Lampa.Storage.field('source') || 'tmdb',
        movie.id || movie.tmdb_id || movie.imdb_id || movie.kinopoisk_id || movie.title || movie.name || '',
        movie.name ? 'serial' : 'movie',
        year
    ].join(':').toLowerCase();

    return 'lumio_sources_v127_' + encodeURIComponent(raw).replace(/%/g, '_').slice(0, 180);
}

function readSourcesCache(movie, allowExpired) {
    var saved = Lampa.Storage.get(movieCacheKey(movie), null);
    if (!saved || !saved.items || !saved.time) return null;
    if (!allowExpired && (Date.now() - saved.time) > NEXUS_CACHE_TTL) return null;
    return saved.items;
}

function saveSourcesCache(movie, items) {
    if (!items || !items.length) return;
    Lampa.Storage.set(movieCacheKey(movie), {
        time: Date.now(),
        items: filterWorkingSources(items)
    });
}

function isWorkingSource(j) {
    if (!j || !j.url) return false;

    return NEXUS_SOURCE_ORDER.indexOf(balanserName(j)) >= 0;
}

function filterWorkingSources(items) {
    if (!items || !items.length) return [];

    return items.filter(function (j) {
        return isWorkingSource(j);
    });
}

function sourceRank(name) {
    name = String(name || '').toLowerCase();

    var index = NEXUS_SOURCE_ORDER.indexOf(name);
    return index >= 0 ? index : 1000;
}

var NEXUS_LATENCY_STORAGE = 'lumio_source_latency';

function recordLatency(name, ms) {
    if (!name || !ms) return;
    var stats = Lampa.Storage.get(NEXUS_LATENCY_STORAGE, {});
    var prev = stats[name];
    stats[name] = prev ? Math.round(prev * 0.7 + ms * 0.3) : ms;
    Lampa.Storage.set(NEXUS_LATENCY_STORAGE, stats);
}

function latencyRank(name) {
    var stats = Lampa.Storage.get(NEXUS_LATENCY_STORAGE, {});
    return stats[name] !== undefined ? stats[name] : 99999;
}

function sortSourceKeys(keys) {
    return (keys || []).map(function (key, index) {
        return { key: key, index: index };
    }).sort(function (a, b) {
        var rankA = sourceRank(a.key);
        var rankB = sourceRank(b.key);

        if (rankA !== rankB) return rankA - rankB;
var latA = latencyRank(a.key);
var latB = latencyRank(b.key);
if (latA !== latB) return latA - latB;
return a.index - b.index;
    }).map(function (item) {
        return item.key;
    });
}

function contentCacheKey(url) {
    return 'lumio_content_v127_' + encodeURIComponent(String(url || '')).replace(/%/g, '_').slice(0, 220);
}

function readContentCache(url) {
    var saved = Lampa.Storage.get(contentCacheKey(url), null);
    if (!saved || !saved.data || !saved.time) return null;
    if ((Date.now() - saved.time) > NEXUS_CONTENT_CACHE_TTL) return null;
    return saved.data;
}

function saveContentCache(url, data) {
    if (!url || !data) return;

    Lampa.Storage.set(contentCacheKey(url), {
        time: Date.now(),
        data: data
    });
}

function preferredSourceKey(items) {
    var sources = {};

    filterWorkingSources(items).forEach(function (j) {
        var name = balanserName(j);
        sources[name] = { url: j.url, name: j.name || name };
    });

    var keys = sortSourceKeys(Lampa.Arrays.getKeys(sources));
    if (!keys.length) return null;

    var saved = Lampa.Storage.get(NEXUS_BALANSER_STORAGE, '');
    if (sources[saved]) return saved;

    return sources[NEXUS_DEFAULT_SOURCE] ? NEXUS_DEFAULT_SOURCE : keys[0];
}

function sourceByKey(items, key) {
    var found = null;

    filterWorkingSources(items).forEach(function (j) {
        var name = balanserName(j);
        if (name === key) found = j;
    });

    return found;
}

var nexusPrefetch = {};
var nexusContentPrefetch = {};

function loadContent(url, options, call, fail) {
    options = options || {};

    if (!url) {
        if (fail) fail({});
        return;
    }

    var cached = options.cache === false ? null : readContentCache(url);
    if (cached) {
        if (call) call(cached, true);
        return;
    }

    if (nexusContentPrefetch[url]) {
        nexusContentPrefetch[url].calls.push(call);
        nexusContentPrefetch[url].fails.push(fail);
        return;
    }

    nexusContentPrefetch[url] = {
        calls: [call],
        fails: [fail]
    };

    var contentNetwork = new Network();

    contentNetwork.timeout(options.timeout || NEXUS_CONTENT_TIMEOUT);
    contentNetwork['native'](
        accountUrl(url),
        function (data) {
            var waiters = nexusContentPrefetch[url];
            saveContentCache(url, data);
            delete nexusContentPrefetch[url];

            waiters.calls.forEach(function (fn) {
                if (fn) fn(data, false);
            });
        },
        function (e) {
            var waiters = nexusContentPrefetch[url];
            delete nexusContentPrefetch[url];

            waiters.fails.forEach(function (fn) {
                if (fn) fn(e || {});
            });
        },
        false,
        {
            dataType: 'text',
            headers: addHeaders()
        }
    );
}

function preloadContent(url) {
    loadContent(url, { timeout: NEXUS_CONTENT_TIMEOUT }, function () {}, function () {});
}

function warmBestSource(movie, items) {
    var key = preferredSourceKey(items);
    var item = key ? sourceByKey(items, key) : null;
    if (!item || !item.url) return;

    preloadContent(requestParams(item.url, movie));
}

function loadSources(movie, call, fail, fast, idsReady) {
    if (!movie) {
        fail && fail({});
        return;
    }

    if (!idsReady) {
        resolveExternalIds(movie, function () {
            loadSources(movie, call, fail, fast, true);
        });
        return;
    }

    var key = movieCacheKey(movie) + (fast ? ':fast' : ':open');
    var cached = readSourcesCache(movie);

    if (cached && cached.length) {
        call(cached);
        return;
    }

    if (nexusPrefetch[key]) {
        nexusPrefetch[key].calls.push(call);
        nexusPrefetch[key].fails.push(fail);
        return;
    }

    nexusPrefetch[key] = {
        calls: [call],
        fails: [fail]
    };

    var url = requestParams(NEXUS_HOST + '/lite/events?life=false', movie);

    function finishSuccess(items) {
        var waiters = nexusPrefetch[key];
        delete nexusPrefetch[key];

        saveSourcesCache(movie, items);
        warmBestSource(movie, items);

        waiters.calls.forEach(function (fn) {
            if (fn) fn(items);
        });
    }

    function finishFail(e) {
        var waiters = nexusPrefetch[key];
        var stale = readSourcesCache(movie, true);
        delete nexusPrefetch[key];

        if (stale && stale.length) {
            waiters.calls.forEach(function (fn) {
                if (fn) fn(stale);
            });
            return;
        }

        waiters.fails.forEach(function (fn) {
            if (fn) fn(e || {});
        });
    }

    function requestAttempt(attempt) {
        var sourceNetwork = new Network();
        var maxAttempts = fast ? 2 : NEXUS_SOURCE_ATTEMPTS;

        sourceNetwork.timeout(timeoutForAttempt(fast ? 8000 : 14000, attempt));
        sourceNetwork.silent(
            url,
            function (json) {
                var filtered = filterWorkingSources(json || []);

                if (filtered.length) {
                    finishSuccess(filtered);
                } else if (attempt + 1 < maxAttempts) {
                    setTimeout(function () {
                        requestAttempt(attempt + 1);
                    }, 500 + attempt * 700);
                } else {
                    finishFail({ msg: 'Server did not return working sources' });
                }
            },
            function (e) {
                if (attempt + 1 < maxAttempts) {
                    setTimeout(function () {
                        requestAttempt(attempt + 1);
                    }, 650 + attempt * 850);
                    return;
                }

                finishFail(e || {});
            },
            false,
            {
                headers: addHeaders()
            }
        );
    }

    requestAttempt(0);
    return;

    prefetchNetwork.timeout(fast ? 6500 : 8500);
    prefetchNetwork.silent(
        url,
        function (json) {
            var filtered = filterWorkingSources(json || []);
            var waiters = nexusPrefetch[key];

            if (filtered.length) {
                saveSourcesCache(movie, filtered);
                warmBestSource(movie, filtered);
                waiters.calls.forEach(function (fn) {
                    if (fn) fn(filtered);
                });
            } else {
                waiters.fails.forEach(function (fn) {
                    if (fn) fn({ msg: 'Сервер не вернул рабочие источники' });
                });
            }

            delete nexusPrefetch[key];
        },
        function (e) {
            var waiters = nexusPrefetch[key];
            waiters.fails.forEach(function (fn) {
                if (fn) fn(e || {});
            });
            delete nexusPrefetch[key];
        },
        false,
        {
            headers: addHeaders()
        }
    );
}

function preloadSources(movie) {
    loadSources(movie, function () {}, function () {}, true);
}

    function requestParams(baseUrl, movie, extraParams) {
    var cardSource = movie.source || Lampa.Storage.field('source') || 'tmdb';
    var q = [];

    q.push('id=' + encodeURIComponent(movie.id || ''));
    q.push('title=' + encodeURIComponent(movie.title || movie.name || ''));
    q.push('original_title=' + encodeURIComponent(movie.original_title || movie.originaltitle || movie.original_name || movie.originalname || ''));
    q.push('serial=' + (movie.name ? 1 : 0));
    q.push('year=' + String(movie.release_date || movie.first_air_date || '0000').slice(0, 4));
    q.push('source=' + encodeURIComponent(cardSource));
    q.push('original_language=' + encodeURIComponent(movie.original_language || ''));

    if (movie.imdb_id || movie.imdbid) {
        q.push('imdb_id=' + encodeURIComponent(movie.imdb_id || movie.imdbid));
    }

    if (movie.kinopoisk_id || movie.kinopoiskid) {
        q.push('kinopoisk_id=' + encodeURIComponent(movie.kinopoisk_id || movie.kinopoiskid));
    }

    if (movie.tmdb_id) {
        q.push('tmdb_id=' + encodeURIComponent(movie.tmdb_id));
    }

    q.push('rchtype=' + encodeURIComponent(nexusRch.type || ''));

    if (extraParams) {
        Object.keys(extraParams).forEach(function (key) {
            if (extraParams[key] !== undefined && extraParams[key] !== null && extraParams[key] !== '') {
                q.push(encodeURIComponent(key) + '=' + encodeURIComponent(extraParams[key]));
            }
        });
    }

    var sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
    return accountUrl(baseUrl + sep + q.join('&'));
}

var nexusExternalIdRequests = {};

function resolveExternalIds(movie, done) {
    if (!movie || (movie.imdb_id && movie.kinopoisk_id)) {
        done();
        return;
    }

    var key = [
        movie.source || Lampa.Storage.field('source') || 'tmdb',
        movie.id || movie.tmdb_id || '',
        movie.name ? 'serial' : 'movie'
    ].join(':');

    if (nexusExternalIdRequests[key]) {
        nexusExternalIdRequests[key].push(done);
        return;
    }

    nexusExternalIdRequests[key] = [done];

    function finish(data) {
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { data = null; }
        }

        if (data && typeof data === 'object') {
            var imdb = data.imdb_id || data.imdbid;
            var kinopoisk = data.kinopoisk_id || data.kinopoiskid || data.kp_id;

            if (imdb) movie.imdb_id = imdb;
            if (kinopoisk) movie.kinopoisk_id = kinopoisk;
        }

        var callbacks = nexusExternalIdRequests[key] || [];
        delete nexusExternalIdRequests[key];
        callbacks.forEach(function (callback) { callback(); });
    }

    var network = new Network();
    var query = [
        'id=' + encodeURIComponent(movie.id || ''),
        'serial=' + (movie.name ? 1 : 0)
    ];

    if (movie.imdb_id || movie.imdbid) {
        query.push('imdb_id=' + encodeURIComponent(movie.imdb_id || movie.imdbid));
    }

    if (movie.kinopoisk_id || movie.kinopoiskid) {
        query.push('kinopoisk_id=' + encodeURIComponent(movie.kinopoisk_id || movie.kinopoiskid));
    }

    network.timeout(6000);
    network.silent(
        accountUrl(NEXUS_HOST + '/externalids?' + query.join('&')),
        finish,
        function () { finish(null); },
        false,
        { headers: addHeaders() }
    );
}

    function balanserName(j) {
        var bals = j.balanser;
        var name = (j.name || '').split(' ')[0];
        var key = (bals || name).toLowerCase();
        return NEXUS_SOURCE_ALIASES[key] || key;
    }

    function sourceDisplayName(j, name) {
        if (name === 'pidtor') return 'PidTor (beta)';
        return j.name || name;
    }
    
    function qualityBadge(quality) {
    if (!quality || typeof quality !== 'object') return null;

    var keys = Object.keys(quality).join(' ').toLowerCase();

    if (/2160|4k|uhd/.test(keys)) return { label: '4K', css: 'nexus-badge--uhd' };
    if (/1440|2k/.test(keys)) return { label: '2K', css: 'nexus-badge--uhd' };
    if (/1080|720|hd/.test(keys)) return { label: 'HD', css: 'nexus-badge--hd' };
    if (/480|360|240|sd/.test(keys)) return { label: 'SD', css: 'nexus-badge--sd' };

    return null;
}

    function component(object) {
        var _this    = this;
        var network  = new Network();
        var scroll   = new Lampa.Scroll({ mask: true, over: true });
        var files    = new Lampa.Explorer(object);
        var filter   = new Lampa.Filter(object);
        var last;

        var sources        = {};
        var filter_sources = [];
        var balanser       = '';
        var source_url     = '';
        var initialized    = false;
        var number_requests = 0;
        var number_requests_timer;
        var request_token = 0;
        var is_serial = !!(object.movie && object.movie.name);
        var filter_render = null;
        var serial_filter_button = null;
        var serial_choice_key = 'lumio_serial_choice_' + movieCacheKey(object.movie || {});
        var serial_choice = Lampa.Storage.get(serial_choice_key, { season: 0, voice: '', voice_name: '', episode: 0 });
        var serial_seasons = {};
        var serial_voices = {};
        var serial_episode_url = '';
        var serial_auto_transition = false;
        var serial_veoveo_seasons = {};
        var loading_status_timer = null;
        var loading_status_token = 0;

        this.activity = object.activity;

        this.stopLoadingStatus = function () {
            loading_status_token++;

            if (loading_status_timer) {
                clearInterval(loading_status_timer);
                loading_status_timer = null;
            }
        };

        this.setLoadingStatus = function (title, text) {
            var loader = $('.nexus-loader').last();

            if (!loader.length) return;

            loader.find('.nexus-loader__title').text(title || '');
            loader.find('.nexus-loader__text').text(text || '');
        };

        this.loadingStatusSteps = function (title, text) {
            return [
                {
                    title: title || 'Запускаем просмотр',
                    text: text || 'Подключение к серверу'
                },
                {
                    title: 'Подбираем варианты',
                    text: 'Ищем доступные источники'
                },
                {
                    title: 'Проверяем доступность',
                    text: 'Оставляем рабочие варианты'
                },
                {
                    title: 'Готовим просмотр',
                    text: 'Уточняем качество видео'
                },
                {
                    title: 'Почти готово',
                    text: 'Осталось совсем немного'
                }
            ];
        };

        this.startLoadingStatus = function (title, text) {
            var token = ++loading_status_token;
            var index = 0;
            var steps = _this.loadingStatusSteps(title, text);

            if (loading_status_timer) {
                clearInterval(loading_status_timer);
                loading_status_timer = null;
            }

            _this.setLoadingStatus(steps[0].title, steps[0].text);

            loading_status_timer = setInterval(function () {
                if (token !== loading_status_token) return;

                index = Math.min(index + 1, steps.length - 1);
                _this.setLoadingStatus(steps[index].title, steps[index].text);
            }, 3000);
        };
        
        this.loading = function (status) {
            if (!status) _this.stopLoadingStatus();

            if (!_this.activity) return;

            if (status) {
                if ($('.nexus-loader').length) _this.activity.loader(false);
                else _this.activity.loader(true);
            }
            else {
                _this.setControlsVisible(true);
                _this.activity.loader(false);
            }
        };

        this.setControlsVisible = function (visible) {
            if (!filter_render) return;

            filter_render.toggleClass('nexus-controls-hidden', !visible);
        };

        this.showLoading = function (title, text) {
            _this.stopLoadingStatus();
            _this.setControlsVisible(false);
            scroll.clear();
            scroll.append(Lampa.Template.get('nexus_content_loading', {
                logo: NEXUS_LOGO_SVG,
                title: escapeHtml(title || 'Запускаем просмотр'),
                text: escapeHtml(text || 'Подключение к серверу')
            }));
            _this.startLoadingStatus(title, text);
            _this.loading(true);
        };

        this.updateSourceFilter = function () {
            if (!filter_sources.length || !sources[balanser]) return;

            filter.set('sort', filter_sources.map(function (k) {
                return { title: sources[k].name, source: k, selected: k === balanser, ghost: !sources[k].show };
            }));

            filter.chosen('sort', [sources[balanser].name || balanser]);
        };

        this.installSerialFilterButton = function (render) {
            if (!is_serial || serial_filter_button) return;

            serial_filter_button = $('<div class="filter--serial selector nexus-serial-filter"><span>Фильтры</span><div class="nexus-serial-filter__value"></div></div>');
            serial_filter_button.on('hover:enter', function () {
                _this.openSerialFilter();
            });

            var holder = render.find('.torrent-filter');
            if (holder.length) holder.append(serial_filter_button);
            else render.append(serial_filter_button);

            _this.updateSerialFilterButton();
        };

        this.updateSerialFilterButton = function () {
            if (!serial_filter_button) return;

            var value = serial_choice.season && serial_choice.episode ?
                (serial_choice.season + ' сезон / ' + serial_choice.episode + ' серия') :
                'Сезон и серия';

            serial_filter_button.find('.nexus-serial-filter__value').text(value);
        };

        this.updateSerialFilterButton = function () {
            if (!serial_filter_button) return;

            var value = serial_choice.season ?
                (serial_choice.season + ' \u0441\u0435\u0437\u043e\u043d' +
                    (serial_choice.voice_name ? ' / ' + serial_choice.voice_name : '') +
                    (serial_choice.episode ? ' / ' + serial_choice.episode + ' \u0441\u0435\u0440\u0438\u044f' : '')) :
                '\u0421\u0435\u0437\u043e\u043d, \u043e\u0437\u0432\u0443\u0447\u043a\u0430, \u0441\u0435\u0440\u0438\u044f';

            serial_filter_button.find('.nexus-serial-filter__value').text(value);
        };

        this.saveSerialChoice = function () {
            Lampa.Storage.set(serial_choice_key, serial_choice);
            _this.updateSerialFilterButton();
        };

        this.voiceName = function (item) {
            item = item || {};

            var name = item.voice_name || item.voice || item.translation || item.translate || item.t || item.name || '';
            var text = item.text || item.title || '';

            if (!name && text && !/^\d+\s*(?:серия|episode|сезон|season)?$/i.test(text)) {
                name = text;
            }

            return String(name || 'По умолчанию').trim();
        };

        this.voiceKey = function (item) {
            return String(_this.voiceName(item)).toLowerCase();
        };

        this.episodeKey = function (season, episode) {
            return String(parseInt(season || 0, 10)) + ':' + String(parseInt(episode || 0, 10));
        };

        this.collectSerialVoices = function (items) {
            if (!is_serial || !items || !items.length) return false;

            var changed = false;

            items.forEach(function (item) {
                var season = parseInt(item.season || 0, 10);
                var episode = parseInt(item.episode || 0, 10);

                if (!season || !episode) return;
                if (!item.url && !item.method && !item.stream) return;

                var epkey = _this.episodeKey(season, episode);
                var voicekey = _this.voiceKey(item);

                if (!serial_voices[epkey]) serial_voices[epkey] = {};
                if (!serial_voices[epkey][voicekey]) changed = true;

                serial_voices[epkey][voicekey] = {
                    key: voicekey,
                    title: _this.voiceName(item),
                    item: item
                };
            });

            return changed;
        };

        this.currentVoiceList = function () {
            var epkey = _this.episodeKey(serial_choice.season, serial_choice.episode);
            var voices = serial_voices[epkey] || {};

            return Lampa.Arrays.getKeys(voices).map(function (key) {
                return voices[key];
            }).sort(function (a, b) {
                return String(a.title).localeCompare(String(b.title));
            });
        };

        this.collectSerialOptions = function (items) {
            if (!is_serial || !items || !items.length) return false;

            var changed = false;

            items.forEach(function (item) {
                var season = parseInt(item.season || item.s || 0, 10);
                var episode = parseInt(item.episode || item.e || 0, 10);
                var title = item.text || item.title || item.name || '';

                if (!season && title) {
                    var sm = title.match(/(\d+)\s*(?:сезон|season)/i);
                    if (sm) season = parseInt(sm[1], 10);
                }

                if (!season) return;

                if (!serial_seasons[season]) {
                    serial_seasons[season] = { season: season, title: season + ' сезон', url: '', episodes: {} };
                    changed = true;
                }

                if (item.url && !episode) serial_seasons[season].url = item.url;

                if (episode) {
                    serial_seasons[season].episodes[episode] = {
                        season: season,
                        episode: episode,
                        title: title || (episode + ' серия'),
                        url: item.url || ''
                    };
                    changed = true;
                }
            });

            return changed;
        };

        this.defaultVoiceTitle = function () {
            return '\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e';
        };

        this.isSeasonText = function (text) {
            return /(\d+)\s*(?:\u0441\u0435\u0437\u043e\u043d|season)/i.test(String(text || ''));
        };

        this.isEpisodeText = function (text) {
            return /(\d+)\s*(?:\u0441\u0435\u0440\u0438\u044f|episode)/i.test(String(text || ''));
        };

        this.voiceName = function (item) {
            item = item || {};

            var name = item.voice_name || item.voice || item.translation || item.translate || item.t || item.translator || item.dubbing || item.sound || '';
            var text = item.text || item.title || item.name || '';

            if (!name && !item.episode && text && !_this.isSeasonText(text) && !_this.isEpisodeText(text)) {
                name = text;
            }

            return String(name || _this.defaultVoiceTitle()).trim();
        };

        this.ensureSerialSeason = function (season, title, url) {
            season = parseInt(season || 0, 10);
            if (!season) return null;

            if (!serial_seasons[season]) {
                serial_seasons[season] = {
                    season: season,
                    title: title || (season + ' \u0441\u0435\u0437\u043e\u043d'),
                    url: '',
                    episodes: {},
                    voices: {}
                };
            }

            if (title && _this.isSeasonText(title)) serial_seasons[season].title = title;
            if (url && !serial_seasons[season].url) serial_seasons[season].url = url;
            if (!serial_seasons[season].voices) serial_seasons[season].voices = {};

            return serial_seasons[season];
        };

        this.ensureSerialVoice = function (season, voice) {
            var info = _this.ensureSerialSeason(season);
            if (!info) return null;

            voice = voice || {};
            var title = String(voice.title || _this.defaultVoiceTitle()).trim();
            var key = String(voice.key || title).toLowerCase();

            if (!key) key = 'default';

            if (!info.voices[key]) {
                info.voices[key] = {
                    key: key,
                    title: title,
                    url: '',
                    episodes: {}
                };
            }

            if (title && info.voices[key].title === _this.defaultVoiceTitle()) info.voices[key].title = title;
            if (voice.url && !info.voices[key].url) info.voices[key].url = voice.url;

            return info.voices[key];
        };

        this.addSerialEpisode = function (season, episode, item, voice) {
            var info = _this.ensureSerialSeason(season);
            if (!info) return false;

            episode = parseInt(episode || 0, 10);
            if (!episode) return false;

            item = item || {};

            var ep = info.episodes[episode] || {
                season: parseInt(season, 10),
                episode: episode,
                title: episode + ' \u0441\u0435\u0440\u0438\u044f',
                original_title: '',
                url: ''
            };

            ep.title = episode + ' \u0441\u0435\u0440\u0438\u044f';
            ep.original_title = ep.original_title || item.text || item.title || '';
            if (item.url && !ep.url) ep.url = item.url;
            if (item.method || item.stream || item.quality) ep.item = item;

            info.episodes[episode] = ep;

            if (voice) {
                var v = _this.ensureSerialVoice(season, voice);
                if (v) v.episodes[episode] = ep;
            }

            return true;
        };

        this.collectSerialVoices = function (items) {
            return _this.collectSerialOptions(items);
        };

        this.currentVoiceList = function (season) {
            season = parseInt(season || serial_choice.season || 0, 10);
            var info = serial_seasons[season];
            if (!info) return [];

            var voices = info.voices || {};
            var keys = Lampa.Arrays.getKeys(voices);
            var hasNamedVoices = keys.some(function (key) {
                return key !== 'default';
            });

            if (hasNamedVoices) {
                keys = keys.filter(function (key) {
                    return key !== 'default';
                });
            } else if (!keys.length && Lampa.Arrays.getKeys(info.episodes || {}).length) {
                _this.ensureSerialVoice(season, { key: 'default', title: _this.defaultVoiceTitle() });
                voices = info.voices || {};
                keys = Lampa.Arrays.getKeys(voices);
            }

            return keys.map(function (key) {
                return voices[key];
            }).sort(function (a, b) {
                return String(a.title).localeCompare(String(b.title));
            });
        };

        this.currentEpisodeMap = function (season, voice) {
            var info = serial_seasons[season];
            if (!info) return {};

            var selected = voice && info.voices && info.voices[voice] ? info.voices[voice] : null;
            if (selected && selected.episodes && Lampa.Arrays.getKeys(selected.episodes).length) {
                return selected.episodes;
            }

            return info.episodes || {};
        };

        this.rememberVeoVeoSeasons = function () {
            if (!_this.isVeoVeoSource()) return;

            Lampa.Arrays.getKeys(serial_seasons).forEach(function (key) {
                var season = parseInt(key, 10);
                var info = serial_seasons[season];

                if (!season || !info) return;

                if (!serial_veoveo_seasons[season]) {
                    serial_veoveo_seasons[season] = {
                        season: season,
                        title: info.title || (season + ' \u0441\u0435\u0437\u043e\u043d'),
                        url: info.url || ''
                    };
                }

                if (info.title) serial_veoveo_seasons[season].title = info.title;
                if (info.url) serial_veoveo_seasons[season].url = info.url;
            });
        };

        this.restoreVeoVeoSeasons = function () {
            if (!_this.isVeoVeoSource()) return;

            Lampa.Arrays.getKeys(serial_veoveo_seasons).forEach(function (key) {
                var season = parseInt(key, 10);
                var cached = serial_veoveo_seasons[season];

                if (!season || !cached) return;

                var info = _this.ensureSerialSeason(season, cached.title, cached.url);
                if (cached.url && info && !info.url) info.url = cached.url;
            });
        };

        this.collectSerialOptions = function (items) {
            if (!is_serial || !items || !items.length) return false;

            var changed = false;
            var contextSeason = parseInt(serial_choice.season || 0, 10);
            var contextVoice = serial_choice.voice || '';
            var contextVoiceName = serial_choice.voice_name || '';

            items.forEach(function (item) {
                item = item || {};

                var season = parseInt(item.season || item.s || 0, 10);
                var episode = parseInt(item.episode || item.e || 0, 10);
                var title = item.text || item.title || item.name || '';

                if (!season && title) {
                    var sm = String(title).match(/(\d+)\s*(?:\u0441\u0435\u0437\u043e\u043d|season)/i);
                    if (sm) season = parseInt(sm[1], 10);
                }

                if (!episode && title) {
                    var em = String(title).match(/(\d+)\s*(?:\u0441\u0435\u0440\u0438\u044f|episode)/i);
                    if (em) episode = parseInt(em[1], 10);
                }

                if (!season && contextSeason) season = contextSeason;
                if (!season) return;

                item.season = season;
                if (episode) item.episode = episode;

                var hasLink = !!(item.url || item.method || item.stream || item.quality);

                if (!episode) {
                    if (!contextSeason || _this.isSeasonText(title)) {
                        _this.ensureSerialSeason(season, title || (season + ' \u0441\u0435\u0437\u043e\u043d'), item.url || '');
                        changed = true;
                        return;
                    }

                    if (!contextVoice && hasLink && title && !_this.isEpisodeText(title)) {
                        _this.ensureSerialVoice(season, {
                            key: _this.voiceKey(item),
                            title: _this.voiceName(item),
                            url: item.url || ''
                        });
                        changed = true;
                        return;
                    }
                }

                if (episode) {
                    var voiceTitle = contextVoiceName;
                    var voiceKey = contextVoice;
                    var explicitVoice = _this.voiceName(item);

                    if (!voiceKey && explicitVoice !== _this.defaultVoiceTitle()) {
                        voiceTitle = explicitVoice;
                        voiceKey = String(explicitVoice).toLowerCase();
                    }

                    if (!voiceKey && hasLink) {
                        voiceKey = 'default';
                        voiceTitle = _this.defaultVoiceTitle();
                    }

                    _this.addSerialEpisode(season, episode, item, voiceKey ? {
                        key: voiceKey,
                        title: voiceTitle || _this.defaultVoiceTitle()
                    } : null);
                    changed = true;
                }
            });

            _this.rememberVeoVeoSeasons();

            return changed;
        };

        this.serialSeasonItems = function () {
            _this.restoreVeoVeoSeasons();

            return Lampa.Arrays.getKeys(serial_seasons).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (season) {
                return !!season;
            }).sort(function (a, b) {
                return a - b;
            }).map(function (season) {
                var info = serial_seasons[season] || {};
                return {
                    text: info.title || (season + ' \u0441\u0435\u0437\u043e\u043d'),
                    season: season,
                    url: info.url || '',
                    folder: true,
                    nexus_serial_action: 'season'
                };
            });
        };

        this.serialVoiceItems = function () {
            return _this.currentVoiceList(serial_choice.season).map(function (voice, index) {
                return {
                    text: voice.title,
                    info: serial_choice.season ? (serial_choice.season + ' \u0441\u0435\u0437\u043e\u043d') : '',
                    badge: '\u041e\u0437\u0432\u0443\u0447\u043a\u0430',
                    badge_class: 'nexus-badge--voice',
                    voice_tone: index,
                    season: serial_choice.season,
                    voice: voice.key,
                    voice_name: voice.title,
                    url: voice.url || '',
                    folder: true,
                    nexus_serial_action: 'voice'
                };
            });
        };

        this.serialEpisodeItems = function () {
            var episodes = _this.currentEpisodeMap(serial_choice.season, serial_choice.voice);

            return Lampa.Arrays.getKeys(episodes).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (episode) {
                return !!episode;
            }).sort(function (a, b) {
                return a - b;
            }).map(function (episode) {
                var ep = episodes[episode] || {};
                return {
                    text: episode + ' \u0441\u0435\u0440\u0438\u044f',
                    season: serial_choice.season,
                    episode: episode,
                    url: ep.url || '',
                    folder: false,
                    nexus_serial_action: 'episode'
                };
            });
        };

        this.serialStepItems = function (items) {
            if (!is_serial) return null;

            if (serial_choice.season && serial_choice.voice && serial_choice.episode) {
                return null;
            }

            if (!serial_choice.season) {
                return _this.serialSeasonItems();
            }

            if (!serial_choice.voice) {
                var voices = _this.currentVoiceList(serial_choice.season);

                if (voices.length === 1) {
                    serial_choice.voice = voices[0].key;
                    serial_choice.voice_name = voices[0].title;
                    serial_choice.episode = 0;
                    serial_episode_url = '';
                    _this.saveSerialChoice();

                    if (voices[0].url && !Lampa.Arrays.getKeys(voices[0].episodes || {}).length) {
                        serial_auto_transition = true;
                        setTimeout(function () {
                            _this.selectSerialVoice({
                                voice: voices[0].key,
                                voice_name: voices[0].title
                            });
                        }, 0);

                        return [];
                    }

                    return _this.serialEpisodeItems();
                }

                return _this.serialVoiceItems();
            }

            return _this.serialEpisodeItems();
        };

        this.selectSerialSeason = function (season) {
            var info = serial_seasons[season];

            serial_choice.season = parseInt(season || 0, 10);
            serial_choice.voice = '';
            serial_choice.voice_name = '';
            serial_choice.episode = 0;
            serial_episode_url = '';
            _this.saveSerialChoice();

            var hasSeasonData = info && (
                Lampa.Arrays.getKeys(info.voices || {}).length ||
                Lampa.Arrays.getKeys(info.episodes || {}).length
            );

            if (_this.isVeoVeoSource() && !hasSeasonData) {
                var seasonUrl = _this.serialSeasonRequestUrl(serial_choice.season);

                if (seasonUrl) {
                    var token = ++request_token;

                    _this.showLoading('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u0435\u0437\u043e\u043d', serial_choice.season + ' \u0441\u0435\u0437\u043e\u043d');

                    loadContent(
                        seasonUrl,
                        { timeout: timeoutForAttempt(NEXUS_CONTENT_TIMEOUT, 1), cache: false },
                        function (data) {
                            if (token !== request_token) return;
                            _this.parse(data);
                        },
                        function () {
                            if (token !== request_token) return;

                            if (info && info.url) {
                                _this.request(accountUrl(_this.normalizeUrl(info.url)));
                                return;
                            }

                            _this.doesNotAnswer({});
                        }
                    );

                    return;
                }
            }

            if (info && info.url && !Lampa.Arrays.getKeys(info.voices || {}).length && !Lampa.Arrays.getKeys(info.episodes || {}).length) {
                _this.showLoading('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u0435\u0437\u043e\u043d', serial_choice.season + ' \u0441\u0435\u0437\u043e\u043d');
                _this.request(accountUrl(_this.normalizeUrl(info.url)));
            } else {
                _this.parse([]);
            }
        };

        this.selectSerialVoice = function (voice) {
            var info = serial_seasons[serial_choice.season] || {};
            var voices = info.voices || {};
            var selected = voices[voice.voice] || voice || {};

            serial_choice.voice = selected.key || voice.voice || '';
            serial_choice.voice_name = selected.title || voice.voice_name || '';
            serial_choice.episode = 0;
            serial_episode_url = '';
            _this.saveSerialChoice();

            if (selected.url && !Lampa.Arrays.getKeys(selected.episodes || {}).length) {
                _this.showLoading('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043e\u0437\u0432\u0443\u0447\u043a\u0443', serial_choice.voice_name);
                _this.request(accountUrl(_this.normalizeUrl(selected.url)));
            } else {
                _this.parse([]);
            }
        };

        this.playSerialEpisode = function () {
            _this.syncEpisodeUrl();

            var url = serial_episode_url ?
                accountUrl(_this.normalizeUrl(serial_episode_url)) :
                requestParams(source_url, object.movie, _this.getSerialParams());

            _this.showLoading('\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u0435\u0440\u0438\u044e', serial_choice.season + ' \u0441\u0435\u0437\u043e\u043d / ' + serial_choice.episode + ' \u0441\u0435\u0440\u0438\u044f');

            loadContent(
                url,
                { timeout: timeoutForAttempt(NEXUS_CONTENT_TIMEOUT, 1), cache: false },
                function (data) {
                    var items = _this.parseItems(data);

                    _this.collectSerialOptions(items);
                    _this.collectSerialVoices(items);

                    var item = _this.pickEpisodeItem(items, serial_choice.season, serial_choice.episode);

                    if (!item) {
                        _this.parse(items);
                        return;
                    }

                    _this.loading(false);
                    _this.open(item);
                },
                function () {
                    _this.doesNotAnswer({ msg: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u0441\u0435\u0440\u0438\u0438' });
                }
            );
        };

        this.selectSerialEpisode = function (episode) {
            var episodes = _this.currentEpisodeMap(serial_choice.season, serial_choice.voice);
            var ep = episodes[episode.episode] || episode || {};

            serial_choice.episode = parseInt(episode.episode || 0, 10);
            serial_episode_url = ep.url || '';
            _this.saveSerialChoice();

            if (ep.item && (ep.item.method || ep.item.stream || ep.item.quality)) {
                _this.open(ep.item);
                return;
            }

            _this.playSerialEpisode();
        };

        this.getSerialParams = function () {
            if (!is_serial || !serial_choice.season || !serial_choice.episode) return null;

            return {
                s: serial_choice.season,
                e: serial_choice.episode,
                season: serial_choice.season,
                episode: serial_choice.episode
            };
        };

        this.filterItemsBySerialChoice = function (items) {
            if (!is_serial || !serial_choice.season || !serial_choice.episode) return items;

            var filtered = items.filter(function (item) {
                return parseInt(item.season || 0, 10) === parseInt(serial_choice.season, 10) &&
                    parseInt(item.episode || 0, 10) === parseInt(serial_choice.episode, 10);
            });

            return filtered;
        };

        this.onlySerialFolders = function (items) {
            if (!is_serial || !items || !items.length) return false;

            return items.every(function (item) {
                return item.season && !item.episode && !item.method && !item.stream && !item.quality;
            });
        };

        this.showSerialPrompt = function (text) {
            scroll.clear();
            scroll.append(Lampa.Template.get('nexus_doesnotanswer', {
                title: 'Выберите серию',
                text: text || 'Откройте Фильтры и выберите сезон и серию'
            }));
            _this.loading(false);

            setTimeout(function () {
                try {
                    Lampa.Controller.toggle('content');
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                } catch (e) {
                    console.error('[Lumio] serial prompt focus error:', e);
                }
            }, 50);
        };

        this.openSerialFilter = function () {
            if (!is_serial) return;

            if (serial_choice.season && serial_choice.voice && serial_choice.episode) {
                _this.openSerialFilterMenu();
            } else if (serial_choice.season && !serial_choice.voice) {
                _this.openVoiceFilter();
            } else if (serial_choice.season && serial_choice.voice) {
                _this.openEpisodeFilter(serial_choice.season);
            } else {
                _this.openSeasonFilter();
            }
        };

        this.syncEpisodeUrl = function () {
            if (!is_serial || serial_episode_url || !serial_choice.season || !serial_choice.episode) return;

            var info = serial_seasons[serial_choice.season];
            var ep = info && info.episodes ? info.episodes[serial_choice.episode] : null;
            if (ep && ep.url) serial_episode_url = ep.url;
        };

        this.openSerialFilterMenu = function () {
            if (!is_serial) return;

            Lampa.Select.show({
                title: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b',
                items: [
                    { title: '\u0421\u0435\u0437\u043e\u043d: ' + serial_choice.season, action: 'season' },
                    { title: '\u041e\u0437\u0432\u0443\u0447\u043a\u0430: ' + (serial_choice.voice_name || _this.defaultVoiceTitle()), action: 'voice' },
                    { title: '\u0421\u0435\u0440\u0438\u044f: ' + serial_choice.episode, action: 'episode' }
                ],
                onSelect: function (a) {
                    Lampa.Select.close();

                    if (a.action === 'season') {
                        _this.openSeasonFilter();
                    } else if (a.action === 'voice') {
                        _this.openVoiceFilter();
                    } else if (a.action === 'episode') {
                        _this.openEpisodeFilter(serial_choice.season);
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('content');
                }
            });
        };

        this.openSeasonFilter = function () {
            if (!is_serial) return;

            var seasons = Lampa.Arrays.getKeys(serial_seasons).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (n) {
                return !!n;
            }).sort(function (a, b) {
                return a - b;
            });

            if (!seasons.length) {
                Lampa.Noty.show('Сезоны еще загружаются, попробуйте через пару секунд');
                _this.find();
                return;
            }

            Lampa.Select.show({
                title: 'Сезон',
                items: seasons.map(function (season) {
                    return {
                        title: (serial_seasons[season].title || (season + ' сезон')),
                        season: season,
                        selected: parseInt(serial_choice.season || 0, 10) === season
                    };
                }),
                onSelect: function (a) {
                    Lampa.Select.close();
                    serial_choice.season = a.season;
                    serial_choice.voice = '';
                    serial_choice.voice_name = '';
                    serial_choice.episode = 0;
                    serial_episode_url = '';
                    _this.saveSerialChoice();
                    _this.loadSeasonEpisodes(a.season, function () {
                        _this.openVoiceFilter();
                    });
                },
                onBack: function () {
                    Lampa.Controller.toggle('content');
                }
            });
        };

        this.openEpisodeFilter = function (season) {
            var info = serial_seasons[season];
            if (!info) return;

            var episodeMap = _this.currentEpisodeMap(season, serial_choice.voice);
            var episodes = Lampa.Arrays.getKeys(episodeMap).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (n) {
                return !!n;
            }).sort(function (a, b) {
                return a - b;
            });

            if (!episodes.length) {
                Lampa.Noty.show('Не удалось получить серии для выбранного сезона');
                return;
            }

            Lampa.Select.show({
                title: season + ' сезон',
                items: episodes.map(function (episode) {
                    var ep = info.episodes[episode];
                    return {
                        title: ep.title || (episode + ' серия'),
                        season: season,
                        episode: episode,
                        url: ep.url,
                        selected: parseInt(serial_choice.episode || 0, 10) === episode
                    };
                }),
                onSelect: function (a) {
                    Lampa.Select.close();
                    serial_choice.season = a.season;
                    serial_choice.episode = a.episode;
                    serial_choice.voice = '';
                    serial_choice.voice_name = '';
                    serial_episode_url = a.url || '';
                    _this.saveSerialChoice();
                    _this.showLoading('Загружаем серию', serial_choice.season + ' сезон / ' + serial_choice.episode + ' серия');
                    _this.find();
                },
                onBack: function () {
                    _this.openSerialFilter();
                }
            });
        };

        this.openEpisodeFilter = function (season) {
            var info = serial_seasons[season];
            if (!info) return;

            var episodeMap = _this.currentEpisodeMap(season, serial_choice.voice);
            var episodes = Lampa.Arrays.getKeys(episodeMap).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (n) {
                return !!n;
            }).sort(function (a, b) {
                return a - b;
            });

            if (!episodes.length) {
                Lampa.Noty.show('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0441\u0435\u0440\u0438\u0438 \u0434\u043b\u044f \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0439 \u043e\u0437\u0432\u0443\u0447\u043a\u0438');
                return;
            }

            Lampa.Select.show({
                title: season + ' \u0441\u0435\u0437\u043e\u043d',
                items: episodes.map(function (episode) {
                    var ep = episodeMap[episode] || {};
                    return {
                        title: episode + ' \u0441\u0435\u0440\u0438\u044f',
                        season: season,
                        episode: episode,
                        url: ep.url,
                        selected: parseInt(serial_choice.episode || 0, 10) === episode
                    };
                }),
                onSelect: function (a) {
                    Lampa.Select.close();
                    _this.selectSerialEpisode(a);
                },
                onBack: function () {
                    if (_this.currentVoiceList(serial_choice.season).length <= 1) {
                        _this.openSeasonFilter();
                    } else {
                        _this.openVoiceFilter();
                    }
                }
            });
        };

        this.prepareEpisodeVoices = function (call) {
            _this.syncEpisodeUrl();

            if (!serial_episode_url) {
                call();
                return;
            }

            var url = accountUrl(_this.normalizeUrl(serial_episode_url));

            Lampa.Loading.start();
            loadContent(
                url,
                { timeout: NEXUS_CONTENT_TIMEOUT },
                function (data) {
                    Lampa.Loading.stop();
                    _this.collectSerialOptions(_this.parseItems(data));
                    call();
                },
                function (e) {
                    Lampa.Loading.stop();
                    call();
                }
            );
        };

        this.openVoiceFilter = function () {
            var voices = _this.currentVoiceList();

            if (voices.length <= 1) {
                if (voices.length === 1) {
                    serial_choice.voice = voices[0].key;
                    serial_choice.voice_name = voices[0].title;
                    _this.saveSerialChoice();
                }
                _this.find();
                return;
            }

            Lampa.Select.show({
                title: 'Озвучка',
                items: voices.map(function (voice) {
                    return {
                        title: voice.title,
                        voice: voice.key,
                        voice_name: voice.title,
                        selected: serial_choice.voice === voice.key
                    };
                }),
                onSelect: function (a) {
                    Lampa.Select.close();
                    serial_choice.voice = a.voice;
                    serial_choice.voice_name = a.voice_name;
                    _this.saveSerialChoice();
                    _this.showLoading('Загружаем серию', serial_choice.season + ' сезон / ' + serial_choice.episode + ' серия');
                    _this.find();
                },
                onBack: function () {
                    _this.openEpisodeFilter(serial_choice.season);
                }
            });
        };

        this.openVoiceFilter = function () {
            var voices = _this.currentVoiceList(serial_choice.season);

            if (!voices.length) {
                Lampa.Noty.show('\u041e\u0437\u0432\u0443\u0447\u043a\u0438 \u0435\u0449\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u044e\u0442\u0441\u044f');
                return;
            }

            if (voices.length === 1) {
                _this.selectSerialVoice({
                    voice: voices[0].key,
                    voice_name: voices[0].title
                });
                return;
            }

            Lampa.Select.show({
                title: '\u041e\u0437\u0432\u0443\u0447\u043a\u0430',
                items: voices.map(function (voice) {
                    return {
                        title: voice.title,
                        voice: voice.key,
                        voice_name: voice.title,
                        selected: serial_choice.voice === voice.key
                    };
                }),
                onSelect: function (a) {
                    Lampa.Select.close();
                    _this.selectSerialVoice(a);
                },
                onBack: function () {
                    _this.openSeasonFilter();
                }
            });
        };

        this.loadSeasonEpisodes = function (season, call) {
            var info = serial_seasons[season];
            var hasEpisodes = info && Lampa.Arrays.getKeys(info.episodes).length;
            if (hasEpisodes) {
                call(true);
                return;
            }

            if (!info || !info.url) {
                call(false);
                return;
            }

            var url = accountUrl(_this.normalizeUrl(info.url));

            Lampa.Loading.start();
            loadContent(
                url,
                { timeout: NEXUS_CONTENT_TIMEOUT },
                function (data) {
                    Lampa.Loading.stop();
                    _this.collectSerialOptions(_this.parseItems(data));
                    call(true);
                },
                function (e) {
                    Lampa.Loading.stop();
                    call(false);
                }
            );
        };


        this.initialize = function () {
    _this.stopLoadingStatus();
    if (_this.activity) _this.activity.loader(false);

    filter.onBack = function () {
    Lampa.Controller.toggle('content');
};

    var filterRender = filter.render();
    filter_render = filterRender;
    var search = filterRender.find('.filter--search');
    var torrent = filterRender.find('.torrent-filter');

    if (search.length && torrent.length) {
        search.appendTo(torrent);
    }

    filter.onSelect = function (type, a) {
        if (type === 'sort') {
            Lampa.Select.close();
            object.nexus_custom_select = a.source;
            _this.changeBalanser(a.source);
        }
    };

    if (filter.addButtonBack) filter.addButtonBack();

    filterRender.find('.filter--sort span').text(
        Lampa.Lang.translate('lumio_balanser') || 'Источник'
    );

    scroll.body().addClass('torrent-list');
    files.appendFiles(scroll.render());
    files.appendHead(filterRender);
    scroll.minus(files.render().find('.explorer__files-head'));
    scroll.body().append(Lampa.Template.get('nexus_content_loading', {
        logo: NEXUS_LOGO_SVG,
        title: 'Запускаем просмотр',
        text: 'Подключение к серверу'
    }));
    _this.setControlsVisible(false);
    _this.startLoadingStatus('Запускаем просмотр', 'Подключение к серверу');

    if (object.balanser) {
        sources[object.balanser] = { name: object.balanser, url: object.url };
        balanser = object.balanser;
        source_url = object.url;
        filter_sources = [balanser];
        _this.request(accountUrl(object.url));
        return;
    }

    _this.createSource();
};

        this.createSource = function (attempt) {
    attempt = attempt || 0;

    var cached = readSourcesCache(object.movie, true);

    nexusLog('[Lumio] createSource attempt:', attempt + 1);

    if (cached && cached.length) {
        nexusLog('[Lumio] sources cache hit:', cached.length);
        _this.startSource(cached);

        loadSources(object.movie, function (json) {
            saveSourcesCache(object.movie, json);
            warmBestSource(object.movie, json);
        }, function () {}, true);

        return;
    }

    _this.showLoading('Запускаем просмотр', 'Подключение к серверу');

    loadSources(
        object.movie,
        function (json) {
            _this.startSource(json);
        },
        function (e) {
            console.error('[Lumio] createSource error:', e);
            if (attempt + 1 < NEXUS_OPEN_ATTEMPTS) {
                _this.showLoading('Пробуем снова', 'Сервер отвечает чуть дольше обычного');
                setTimeout(function () {
                    _this.createSource(attempt + 1);
                }, 1200 + attempt * 1400);
                return;
            }
            _this.doesNotAnswer({ msg: (e && e.msg) || 'Ошибка подключения к серверу' });
        },
        false
    );
};

        // ── startSource ─────────────────────────────────────────────────────
        this.resetSerialSourceState = function () {
            if (!is_serial) return;

            serial_seasons = {};
            serial_voices = {};
            serial_episode_url = '';
        };

        this.activateSource = function (name, saveChoice) {
            if (!sources[name]) return false;

            balanser = name;
            source_url = sources[name].url;
            if (saveChoice) {
                Lampa.Storage.set(NEXUS_BALANSER_STORAGE, name);
            }
            _this.updateSourceFilter();

            return true;
        };

        this.sourceRequestUrl = function (name) {
            if (!sources[name]) return '';

            return requestParams(sources[name].url, object.movie, _this.getSerialParams());
        };

        this.sourceNeedsRch = function (name) {
            return !!(sources[name] && sources[name].rch);
        };

        this.withSourceReady = function (name, success, error) {
            if (!_this.sourceNeedsRch(name)) {
                success();
                return;
            }

            nexusRchEnsure(success, error);
        };

        this.isVeoVeoSource = function () {
            return String(balanser || '').toLowerCase() === 'veoveo';
        };

        this.serialSeasonRequestUrl = function (season) {
            season = parseInt(season || 0, 10);
            if (!source_url || !season) return '';

            return requestParams(source_url, object.movie, {
                s: season,
                season: season
            });
        };

        this.previewItems = function (data) {
            var items = _this.parseItems(data);

            if (is_serial && serial_choice.season && serial_choice.episode) {
                items = _this.filterItemsBySerialChoice(items);
            }

            return items;
        };

        this.hasUsablePreview = function (items) {
            if (!items || !items.length) return false;
            if (is_serial && serial_choice.season && serial_choice.episode && _this.onlySerialFolders(items)) return false;

            return true;
        };

        this.findFast = function () {
            if (!source_url) return;

            if (is_serial && serial_episode_url) {
                _this.find();
                return;
            }

            var selected = balanser;
            var candidates = [];

            if (selected && sources[selected]) candidates.push(selected);

            filter_sources.forEach(function (name) {
                if (name !== selected && sources[name] && candidates.length < NEXUS_FAST_SOURCE_LIMIT) {
                    candidates.push(name);
                }
            });

            if (candidates.length <= 1) {
                _this.find();
                return;
            }

            var token = ++request_token;
            var settled = false;
            var finished = 0;

            function done() {
                finished++;

                if (!settled && finished >= candidates.length) {
                    _this.request(_this.sourceRequestUrl(selected), 1, token);
                }
            }

            candidates.forEach(function (name, index) {
                setTimeout(function () {
                    if (settled || token !== request_token) return;

                    var startedAt = Date.now();
                    _this.withSourceReady(name, function () {
                        var url = _this.sourceRequestUrl(name);
                        if (!url) {
                            done();
                            return;
                        }

                        loadContent(
                            url,
                            { timeout: 5000 },
                            function (data) {
                                if (settled || token !== request_token) return;

                                var items = _this.previewItems(data);
                                if (!_this.hasUsablePreview(items)) {
                                    done();
                                    return;
                                }

                                settled = true;
                                recordLatency(name, Date.now() - startedAt);
                                _this.resetSerialSourceState();
                                _this.activateSource(name, false);
                                _this.parse(data);
                            },
                            function () {
                                if (settled || token !== request_token) return;
                                done();
                            }
                        );
                    }, function () {
                        if (settled || token !== request_token) return;
                        done();
                    });
                }, index ? index * 40 : 0);
            });
        };

        this.startSource = function (json) {
            sources        = {};
            filter_sources = [];

            json.forEach(function (j) {
                if (!isWorkingSource(j)) return;
                var name = balanserName(j);
                sources[name] = {
                    url: _this.normalizeUrl(j.url),
                    name: sourceDisplayName(j, name),
                    show: true,
                    rch: !!j.rch
                };
            });

            filter_sources = sortSourceKeys(Lampa.Arrays.getKeys(sources));

            if (!filter_sources.length) {
                _this.doesNotAnswer({});
                return;
            }

            _this.showLoading('Ищем доступные источники', 'Проверяем варианты для этого видео');
            _this.probeSources(function () {
                if (!filter_sources.length) {
                    _this.doesNotAnswer({});
                    return;
                }

                var saved = Lampa.Storage.get(NEXUS_BALANSER_STORAGE, '');
                balanser = sources[saved] ? saved : (sources[NEXUS_DEFAULT_SOURCE] ? NEXUS_DEFAULT_SOURCE : filter_sources[0]);
                _this.resetSerialSourceState();
                _this.activateSource(balanser, false);
                _this.updateSourceFilter();
                _this.showLoading('Загружаем видео', 'Источник: ' + sources[balanser].name);
                _this.find();
            });
        };

        this.probeSources = function (done) {
            var queue = filter_sources.slice();
            var available = {};
            var active = 0;
            var finished = false;

            function complete() {
                if (finished) return;
                if (queue.length || active) return;

                finished = true;
                sources = available;
                filter_sources = sortSourceKeys(Lampa.Arrays.getKeys(sources));
                done();
            }

            function next() {
                while (active < NEXUS_SOURCE_PROBE_CONCURRENCY && queue.length) {
                    var nextName = queue.shift();

                    (function (name, source) {
                        active++;

                        function finish(ok) {
                            if (ok) available[name] = source;
                            active--;
                            next();
                            complete();
                        }

                        function probe() {
                            var url = _this.sourceRequestUrl(name);
                            if (!url) {
                                finish(false);
                                return;
                            }

                            loadContent(
                                url,
                                { timeout: NEXUS_SOURCE_PROBE_TIMEOUT },
                                function (data) {
                                    if (nexusRchResponse(data) && !source.rch) {
                                        source.rch = true;
                                        _this.withSourceReady(name, probe, function () {
                                            finish(false);
                                        });
                                        return;
                                    }

                                    finish(_this.hasUsablePreview(_this.previewItems(data)));
                                },
                                function () {
                                    finish(false);
                                }
                            );
                        }

                        _this.withSourceReady(name, probe, function () {
                            finish(false);
                        });
                    })(nextName, sources[nextName]);
                }

                complete();
            }

            next();
        };

        // ── changeBalanser ──────────────────────────────────────────────────
        this.changeBalanser = function (name) {
            if (!sources[name]) return;
            _this.activateSource(name, true);
            _this.resetSerialSourceState();
            serial_choice.season = 0;
            serial_choice.voice = '';
            serial_choice.voice_name = '';
            serial_choice.episode = 0;
            _this.saveSerialChoice();
            _this.updateSourceFilter();
            _this.showLoading('Загружаем видео', 'Источник: ' + sources[name].name);
            _this.find();
        };

        // ── find / request ──────────────────────────────────────────────────
        this.find = function () {
            var selected = balanser;

            _this.withSourceReady(selected, function () {
                var serialParams = _this.getSerialParams();
                var episodeUrl = _this.normalizeUrl(serial_episode_url);
                if (_this.sourceNeedsRch(selected)) episodeUrl = nexusRchRequestUrl(episodeUrl);
                var url = (is_serial && serial_episode_url) ? accountUrl(episodeUrl) : requestParams(source_url, object.movie, serialParams);
                _this.request(url);
            }, function () {
                _this.doesNotAnswer({ msg: 'Не удалось подключить источник' });
            });
        };

        this.request = function (url, attempt, token) {
    attempt = attempt || 0;
    token = token || (++request_token);

    nexusLog('[Lumio] request url:', url, 'attempt:', attempt + 1);
    number_requests++;

    if (number_requests >= 14) {
        _this.doesNotAnswer({ msg: 'Слишком много запросов' });
        return;
    }

    clearTimeout(number_requests_timer);
    number_requests_timer = setTimeout(function () { number_requests = 0; }, 5000);

    loadContent(
        url,
        { timeout: timeoutForAttempt(NEXUS_CONTENT_TIMEOUT, attempt) },
        function (data) {
            if (token !== request_token) return;

            var rch = nexusRchResponse(data);
            if (rch) {
                if (/[?&]rchtype=[^&]+/i.test(url)) {
                    _this.doesNotAnswer({ msg: 'Источник не завершил подключение RCH' });
                    return;
                }

                nexusLog('[Lumio] RCH requested by source');
                console.warn('[Lumio RCH] source requested RCH:', rch.nws || 'no nws address');
                nexusRchEnsure(function () {
                    _this.request(nexusRchRequestUrl(url), 0, token);
                }, function () {
                    _this.doesNotAnswer({ msg: 'Не удалось подключиться к источнику' });
                });
                return;
            }

            nexusLog('[Lumio] request success');
            _this.parse(data);
        },
        function (e) {
            if (token !== request_token) return;
            console.error('[Lumio] request error:', e);
            console.warn('[Lumio] source response details:', {
                status: e && e.status,
                text: String((e && (e.responseText || e.statusText)) || '').slice(0, 500),
                url: url
            });
            if (attempt < 1) {
                setTimeout(function () { _this.request(url, attempt + 1, token); }, 450 + attempt * 650);
                return;
            }
            _this.doesNotAnswer({ msg: 'Ошибка загрузки контента' });
        }
    );
};

        // ── parse ────────────────────────────────────────────────────────────
        this.parse = function (data) {
    last = null;
    scroll.clear();

    var items = _this.parseItems(data);

    if (is_serial) {
    _this.collectSerialOptions(items); // можно оставить, просто не используется для гейтинга
}

    if (is_serial) {
        var serialItems = _this.serialStepItems(items);
        if (serialItems) items = serialItems;
        else if (serial_choice.season && serial_choice.episode) {
            items = _this.filterItemsBySerialChoice(items);
        }
    }

    if (is_serial && serial_auto_transition && !items.length) {
        serial_auto_transition = false;
        _this.loading(true);
        return;
    }

    if (!items.length) {
        scroll.append(Lampa.Template.get('nexus_doesnotanswer', {
            title: Lampa.Lang.translate('lumio_error_title') || 'Ничего не найдено',
            text: Lampa.Lang.translate('lumio_no_sources') || 'Нет источников'
        }));
        _this.loading(false);
        return;
    }

    items.forEach(function (item) {
        var title = item.text || item.title || 'Видео';
        var media = mediaTemplateData(object.movie);
var qBadge = qualityBadge(item.quality);
var resolutionText = (item.quality && typeof item.quality === 'object') ? Object.keys(item.quality).join(', ') : '';
 var sourceText = nexusPlainText(sources[balanser] ? sources[balanser].name : '');
 var pidtorInfo = balanser === 'pidtor' ? nexusPidtorDetails(item) : '';
 var infoText = pidtorInfo || resolutionText || nexusPlainText(item.info) || sourceText;
var badgeText = qBadge ? qBadge.label : (item.badge || '');
var badgeClass = qBadge ? qBadge.css : (item.badge_class || '');
var timeText = item.episode !== undefined ? ('\u00b7 ' + item.episode) : '';

if (is_serial && item.nexus_serial_action === 'voice') {
    media = voiceMediaTemplateData(item.voice_name || title, item.voice_tone);
    infoText = item.info || '';
    badgeText = item.badge || '\u041e\u0437\u0432\u0443\u0447\u043a\u0430';
    badgeClass = item.badge_class || 'nexus-badge--voice';
    timeText = '';
}

var el = Lampa.Template.get('nexus_prestige_folder', {
    title: escapeHtml(title),
    time: escapeHtml(timeText),
    info: escapeHtml(infoText),
    badge: escapeHtml(badgeText),
    badge_class: badgeClass,
    media_class: media.media_class,
    media_style: media.media_style
});

        el.on('hover:enter', (function (it) {
            return function () {
                _this.open(it);
            };
        })(item)).on('hover:focus', function (e) {
    var current = $(e.currentTarget || e.target).closest('.selector');
    last = current.length ? current[0] : e.target;

    try {
        scroll.update(current.length ? current : $(e.target), true);
    } catch (err) {
        console.error('[Lumio] hover:focus scroll.update error:', err);
    }
});
            

        scroll.append(el);

        if (item.active) last = el[0];
    });

    var first = scroll.render().find('.selector').first();
var target = null;

if (last && $(last).closest(scroll.render()).length) {
    target = $(last).closest('.selector')[0];
}

if (!target && first.length) {
    target = first[0];
}

_this.loading(false);

setTimeout(function () {
    try {
        Lampa.Controller.toggle('content');
        Lampa.Controller.collectionSet(scroll.render(), files.render());

        if (target) {
            Lampa.Controller.collectionFocus(target, scroll.render());
            last = target;
            scroll.update($(target), true);
        }
    } catch (e) {
        console.error('[Lumio] parse focus error:', e);
    }
}, 50);
};
        
                // ── orUrlReserve ────────────────────────────────────────────────────
        this.orUrlReserve = function (data) {
            if (data && data.url && typeof data.url === 'string' && data.url.indexOf(' or ') !== -1) {
                var urls = data.url.split(' or ');
                data.url = urls[0];
                data.url_reserve = urls[1] || '';
            }
            return data;
        };
        
                // ── getFileUrl ──────────────────────────────────────────────────────
        this.getFileUrl = function (file, call) {
            if (!file) {
                call(false);
                return;
            }

            if (file.method === 'play' && file.url) {
    var direct = Lampa.Arrays.clone(file);
    direct.url = _this.normalizeUrl(direct.url);
    direct = _this.orUrlReserve(direct);
    call(direct, file);
    return;
}

if (file.url) {
    Lampa.Loading.start();
    file = _this.orUrlReserve(Lampa.Arrays.clone(file));

    network.clear();
    network.timeout(timeoutForAttempt(NEXUS_CONTENT_TIMEOUT, 1));
    network['native'](
        accountUrl(_this.normalizeUrl(file.url)),
        function (stream) {
            Lampa.Loading.stop();

            if (typeof stream === 'string') {
                try {
                    stream = JSON.parse(stream);
                } catch (e) {}
            }

            if (stream && stream.rch) {
                if (file._nexus_rch_retry) {
                    call(false, file);
                    return;
                }

                file._nexus_rch_retry = true;
                nexusRchEnsure(function () {
                    file.url = nexusRchRequestUrl(file.url);
                    _this.getFileUrl(file, call);
                }, function () {
                    call(false, file);
                });
                return;
            }

            if (stream && stream.url) {
                stream.url = _this.normalizeUrl(stream.url);
                stream = _this.orUrlReserve(stream);
                call(stream, file);
            } else {
                if (file.url_reserve) {
                    file.url = file.url_reserve;
                    file.url_reserve = '';
                    _this.getFileUrl(file, call);
                    return;
                }
                call(false, file);
            }
        },
        function () {
            Lampa.Loading.stop();
            if (file.url_reserve) {
                file.url = file.url_reserve;
                file.url_reserve = '';
                _this.getFileUrl(file, call);
                return;
            }
            call(false, file);
        },
        false,
        {
            dataType: 'text',
            headers: addHeaders()
        }
    );

    return;
}

if (file.stream) {
    var prepared = Lampa.Arrays.clone(file);
    prepared.url = _this.normalizeUrl(file.stream);
    prepared.method = 'play';
    prepared = _this.orUrlReserve(prepared);
    call(prepared, file);
    return;
}

call(false, file);
};

                // ── normalizeUrl ─────────────────────────────────────────────────────
        this.normalizeUrl = function (url) {
    if (!url) return '';

    url = String(url).trim();

    url = url.replace(/^https?:\/\/127\.0\.0\.1:9118/i, NEXUS_HOST);
    url = url.replace(/^https?:\/\/localhost:9118/i, NEXUS_HOST);

    return url;
};

        this.qualityUrl = function (value) {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'object') return value.url || value.link || value.file || value.src || '';
            return '';
        };

        this.normalizeQuality = function (quality) {
            if (!quality || typeof quality !== 'object') return {};

            var normalized = {};

            Object.keys(quality).forEach(function (q) {
                var value = quality[q];
                var url = _this.qualityUrl(value);
                if (!url) return;

                url = _this.normalizeUrl(url);

                if (typeof value === 'object') {
                    var copy = Lampa.Arrays.clone(value);
                    copy.url = url;
                    normalized[q] = copy;
                } else {
                    normalized[q] = url;
                }
            });

            return normalized;
        };

        this.qualityScore = function (name) {
            name = String(name || '').toLowerCase();

            if (/2160|4k|uhd/.test(name)) return 2160;
            if (/1440|2k/.test(name)) return 1440;
            if (/1080|fhd|full/.test(name)) return 1080;
            if (/720|hd/.test(name)) return 720;
            if (/480/.test(name)) return 480;
            if (/360/.test(name)) return 360;
            if (/240/.test(name)) return 240;

            var n = parseInt(name, 10);
            return isNaN(n) ? 0 : n;
        };

        this.bestQualityUrl = function (quality) {
            if (!quality || typeof quality !== 'object') return '';

            var keys = Object.keys(quality).sort(function (a, b) {
                return _this.qualityScore(b) - _this.qualityScore(a);
            });

            for (var i = 0; i < keys.length; i++) {
                var url = _this.qualityUrl(quality[keys[i]]);
                if (url) return _this.normalizeUrl(url);
            }

            return '';
        };

        this.timelineHash = function (item) {
            if (!Lampa.Timeline || !Lampa.Utils || !Lampa.Utils.hash) return 0;

            item = item || {};

            var movie = object.movie || {};
            var season = parseInt(item.season || serial_choice.season || 0, 10);
            var episode = parseInt(item.episode || serial_choice.episode || 0, 10);

            if (is_serial && season && episode) {
                var serialName = movie.original_name || movie.original_title || movie.name || movie.title || movie.id || '';
                return serialName ? Lampa.Utils.hash([season, season > 10 ? ':' : '', episode, serialName].join('')) : 0;
            }

            var movieName = movie.original_title || movie.original_name || movie.title || movie.name || movie.id || '';
            return movieName ? Lampa.Utils.hash(movieName) : 0;
        };

        this.timelineForItem = function (item) {
            var hash = _this.timelineHash(item);
            return hash && Lampa.Timeline && Lampa.Timeline.view ? Lampa.Timeline.view(hash) : null;
        };

        this.pickEpisodeItem = function (items, season, episode) {
            if (!items || !items.length) return null;

            var filtered = items.filter(function (item) {
                var s = parseInt(item.season || 0, 10);
                var e = parseInt(item.episode || 0, 10);

                if (s && e) return s === season && e === episode;
                return true;
            }).filter(function (item) {
                return !item.folder && (item.url || item.method || item.stream || item.quality);
            });

            if (!filtered.length) filtered = items.filter(function (item) {
                return !item.folder && (item.url || item.method || item.stream || item.quality);
            });

            if (serial_choice.voice) {
                var voiced = filtered.filter(function (item) {
                    return _this.voiceKey(item) === serial_choice.voice;
                });

                if (voiced.length) filtered = voiced;
            }

            filtered.sort(function (a, b) {
                var aq = a.quality && typeof a.quality === 'object' ? Object.keys(a.quality).sort(function (x, y) {
                    return _this.qualityScore(y) - _this.qualityScore(x);
                })[0] : '';
                var bq = b.quality && typeof b.quality === 'object' ? Object.keys(b.quality).sort(function (x, y) {
                    return _this.qualityScore(y) - _this.qualityScore(x);
                })[0] : '';

                return _this.qualityScore(bq) - _this.qualityScore(aq);
            });

            return filtered[0] || null;
        };

        this.makePlayData = function (item, stream, original) {
            item = item || {};
            stream = stream || {};
            original = original || {};

            var quality = _this.normalizeQuality(stream.quality || original.quality || item.quality || {});
            var bestUrl = _this.bestQualityUrl(quality);
            var title = item.text || item.title || object.movie.title || object.movie.name || 'Video';

            var play = {
                url: bestUrl || _this.normalizeUrl(stream.url || original.url || item.url || ''),
                title: title,
                quality: quality,
                headers: original.headers || stream.headers,
                segments: original.segments || stream.segments,
                hls_manifest_timeout: original.hls_manifest_timeout || stream.hls_manifest_timeout,
                subtitle: stream.subtitle || item.subtitle || '',
                subtitles: stream.subtitles || item.subtitles,
                subtitles_call: original.subtitles_call || stream.subtitles_call,
                timeline: original.timeline || stream.timeline || _this.timelineForItem(item),
                url_reserve: stream.url_reserve || original.url_reserve || item.url_reserve || '',
                card: object.movie,
                isonline: true
            };

            if (!play.url && stream.url) play.url = _this.normalizeUrl(stream.url);
            if (play.subtitle) play.subtitle = _this.normalizeUrl(play.subtitle);
            if (play.url_reserve) play.url_reserve = _this.normalizeUrl(play.url_reserve);

            if (stream.subtitles && Array.isArray(stream.subtitles)) {
                play.subtitles = stream.subtitles.map(function (s) {
                    return {
                        label: s.label || '',
                        url: _this.normalizeUrl(s.url || ''),
                        method: s.method || 'link'
                    };
                });
            }

            return play;
        };

        this.resolveEpisodePlaylistEntry = function (entry, done) {
            var season = parseInt(entry.season || 0, 10);
            var episode = parseInt(entry.episode || 0, 10);
            var episodeUrl = entry.nexus_episode_url || '';

            serial_choice.season = season;
            serial_choice.episode = episode;
            serial_episode_url = episodeUrl;
            _this.saveSerialChoice();

            var url = episodeUrl ?
                accountUrl(_this.normalizeUrl(episodeUrl)) :
                requestParams(source_url, object.movie, { s: season, e: episode, season: season, episode: episode });

            loadContent(
                url,
                { timeout: timeoutForAttempt(NEXUS_CONTENT_TIMEOUT, 1), cache: false },
                function (data) {
                    var items = _this.parseItems(data);
                    _this.collectSerialOptions(items);
                    _this.collectSerialVoices(items);

                    var item = _this.pickEpisodeItem(items, season, episode);

                    if (!item) {
                        Lampa.Noty.show('Video was not found for this episode');
                        return;
                    }

                    _this.getFileUrl(item, function (stream, original) {
                        if (!stream || !stream.url) {
                            Lampa.Noty.show('Could not get video link');
                            return;
                        }

                        var play = _this.makePlayData(item, stream, original);
                        play.playlist = _this.buildEpisodePlaylist(item, play);

                        Object.keys(play).forEach(function (key) {
                            entry[key] = play[key];
                        });

                        entry.nexus_episode_url = episodeUrl || item.url || '';

                        if (done) done();
                    });
                },
                function () {
                    Lampa.Noty.show('Episode loading error');
                }
            );
        };

        this.buildEpisodePlaylist = function (item, play) {
            if (!is_serial || !serial_choice.season) return null;

            var season = parseInt((item && item.season) || serial_choice.season || 0, 10);
            var currentEpisode = parseInt((item && item.episode) || serial_choice.episode || 0, 10);
            var info = serial_seasons[season];

            if (!info || !info.episodes) return null;

            var episodeMap = _this.currentEpisodeMap(season, serial_choice.voice);
            var episodes = Lampa.Arrays.getKeys(episodeMap).map(function (k) {
                return parseInt(k, 10);
            }).filter(function (n) {
                return !!n;
            }).sort(function (a, b) {
                return a - b;
            });

            if (episodes.length < 2) return null;

            return episodes.map(function (episode) {
                var ep = episodeMap[episode] || {};
                var entry = {
                    title: episode + ' \u0441\u0435\u0440\u0438\u044f',
                    season: season,
                    episode: episode,
                    nexus_episode_url: ep.url || '',
                    timeline: _this.timelineForItem({ season: season, episode: episode }),
                    card: object.movie,
                    isonline: true,
                    callback: function () {
                        serial_choice.season = season;
                        serial_choice.episode = episode;
                        serial_episode_url = ep.url || '';
                        _this.saveSerialChoice();
                    }
                };

                if (episode === currentEpisode) {
                    entry.url = play.url;
                    entry.quality = play.quality;
                    entry.subtitles = play.subtitles;
                    entry.subtitle = play.subtitle;
                    entry.headers = play.headers;
                    entry.segments = play.segments;
                    entry.url_reserve = play.url_reserve;
                } else {
                    entry.url = function (next) {
                        _this.resolveEpisodePlaylistEntry(entry, next);
                    };
                }

                return entry;
            });
        };

        // ── open ─────────────────────────────────────────────────────────────
                // ── open ─────────────────────────────────────────────────────────────
        this.open = function (item) {

            if (is_serial && item && item.nexus_serial_action) {
                if (item.nexus_serial_action === 'season') {
                    _this.selectSerialSeason(item.season);
                } else if (item.nexus_serial_action === 'voice') {
                    _this.selectSerialVoice(item);
                } else if (item.nexus_serial_action === 'episode') {
                    _this.selectSerialEpisode(item);
                }
                return;
            }

            if (item.folder || (!item.url && !item.method && !item.stream)) {
                Lampa.Activity.push({
                    url:          item.url || '',
                    title:        NEXUS_TITLE,
                    component:    NEXUS_COMPONENT,
                    movie:        object.movie,
                    page:         1,
                    balanser:     balanser,
                    nexus_folder: true
                });
                return;
            }

            _this.getFileUrl(item, function (stream, original) {
                nexusLog('[Lumio] PLAY item:', item);
                nexusLog('[Lumio] PLAY stream:', stream);
                original = original || {};

                if (!stream || !stream.url) {
                    Lampa.Noty.show('Не удалось получить ссылку на видео');
                    return;
                }

                var play = {
    url: stream.url || '',
    title: item.text || item.title || object.movie.title || object.movie.name || 'Видео',
    quality: stream.quality || original.quality || item.quality || {},
    headers: original.headers || stream.headers,
    segments: original.segments || stream.segments,
    hls_manifest_timeout: original.hls_manifest_timeout || stream.hls_manifest_timeout,
    subtitle: stream.subtitle || item.subtitle || '',
    subtitles: stream.subtitles || item.subtitles,
    subtitles_call: original.subtitles_call || stream.subtitles_call,
    timeline: original.timeline || stream.timeline,
    isonline: true
};

                if (play.quality && typeof play.quality === 'object') {
                    play.quality = _this.normalizeQuality(play.quality);
                }

                var playlist = [];

                if (play.quality && typeof play.quality === 'object') {
                    var keys = Object.keys(play.quality);
                    if (keys.length > 1) {
                        keys.forEach(function (q) {
                            playlist.push({
                                url: play.quality[q],
                                title: q
                            });
                        });
                    }
                }

                if (playlist.length) {
                    play.playlist = playlist;
                }

                play.isonline = true;

                nexusLog('[Lumio] FINAL URL:', play.url);
                                if (play.subtitle) {
                    play.subtitle = _this.normalizeUrl(play.subtitle);
                }

                if (play.quality && typeof play.quality === 'object') {
                    Object.keys(play.quality).forEach(function (q) {
                        play.quality[q] = _this.normalizeUrl(play.quality[q]);
                    });
                }

                if (stream.subtitles && Array.isArray(stream.subtitles)) {
                    play.subtitles = stream.subtitles.map(function (s) {
                        return {
                            label: s.label || '',
                            url: _this.normalizeUrl(s.url || ''),
                            method: s.method || 'link'
                        };
                    });
                }

                play = _this.makePlayData(item, stream, original);

                var episodePlaylist = _this.buildEpisodePlaylist(item, play);
                if (episodePlaylist && episodePlaylist.length) {
                    play.playlist = episodePlaylist;
                }
                
                nexusLog('[Lumio] FINAL URL:', play.url);
nexusLog('[Lumio] FINAL SUBTITLE:', play.subtitle);
nexusLog('[Lumio] FINAL QUALITY:', play.quality);

if (/^https?:\/\/(127\.0\.0\.1|localhost):9118/i.test(play.url)) {
    Lampa.Noty.show('Осталась локальная ссылка Lampac: ' + play.url);
    return;
}
                
                Lampa.Player.play(play);
            });
        };
        // ── parseItems ───────────────────────────────────────────────────────
        this.parseItems = function (str) {
            if (!str) return [];

            function finish(items) {
                if (balanser !== 'pidtor') return items;

                var seen = {};
                return items.filter(function (item) {
                    var key = nexusPidtorKey(item);
                    if (!key || seen[key]) return false;
                    seen[key] = true;
                    return true;
                });
            }

            try {
    var j = (typeof str === 'object') ? str : JSON.parse(str);
    if (Array.isArray(j)) {
        return finish(j.map(function (data) {
            data = data || {};

            var season  = parseInt(data.season || data.s || 0, 10);
var episode = parseInt(data.episode || data.e || 0, 10);
var titleText = data.text || data.title || '';

if (!season && titleText) {
    var sm = titleText.match(/(\d+)\s*(?:сезон|season)/i);
    if (sm) season = parseInt(sm[1], 10);
}
if (!episode && titleText) {
    var em = titleText.match(/(\d+)\s*(?:серия|episode)/i);
    if (em) episode = parseInt(em[1], 10);
}

if (season)  data.season  = season;
if (episode) data.episode = episode;

if (object.movie.name && data.season && !data.episode) {
    data.folder = true;
}

            if (data.url)     data.url     = _this.normalizeUrl(data.url);
            if (data.stream)  data.stream  = _this.normalizeUrl(data.stream);
            if (data.subtitle) data.subtitle = _this.normalizeUrl(data.subtitle);

            if (data.quality && typeof data.quality === 'object') {
                Object.keys(data.quality).forEach(function (q) {
                    data.quality[q] = _this.normalizeUrl(data.quality[q]);
                });
            }

            if (balanser === 'pidtor' && data.maxquality && !data.quality) {
                data.quality = {};
                data.quality[String(data.maxquality) + 'p'] = data.url || data.stream || '';
            }

            return data;
        }));
    }
} catch (e1) {}

            var result = [];
            try {
                var html = $('<div>' + str + '</div>');
                html.find('[data-json]').each(function () {
                    var el   = $(this);
                    var data = {};
                    try { data = JSON.parse(el.attr('data-json') || '{}'); } catch (e2) {}
                    var s    = el.attr('s');
                    var ep   = el.attr('e');
                    var text = el.text();

                    if (!object.movie.name) {
                        if (text && /\d+p/i.test(text)) {
                            if (!data.quality) { data.quality = {}; data.quality[text] = data.url; }
                            text = object.movie.title;
                        }
                        if (text === 'По умолчанию') text = object.movie.title;
                    }

                    if (ep)   data.episode = parseInt(ep, 10);
if (s)    data.season  = parseInt(s, 10);
if (text) data.text    = text;

if (!data.season && text) {
    var smh = text.match(/(\d+)\s*(?:сезон|season)/i);
    if (smh) data.season = parseInt(smh[1], 10);
}
if (!data.episode && text) {
    var emh = text.match(/(\d+)\s*(?:серия|episode)/i);
    if (emh) data.episode = parseInt(emh[1], 10);
}

if (object.movie.name && data.season && !data.episode) {
    data.folder = true;
}
                    data.active = el.hasClass('active');

                    if (data.url) data.url = _this.normalizeUrl(data.url);
if (data.stream) data.stream = _this.normalizeUrl(data.stream);
if (data.subtitle) data.subtitle = _this.normalizeUrl(data.subtitle);

if (data.quality && typeof data.quality === 'object') {
    Object.keys(data.quality).forEach(function (q) {
        data.quality[q] = _this.normalizeUrl(data.quality[q]);
    });
}

if (balanser === 'pidtor' && data.maxquality && !data.quality) {
    data.quality = {};
    data.quality[String(data.maxquality) + 'p'] = data.url || data.stream || '';
}

if (data.url || data.method || data.stream) result.push(data);
                });
            } catch (e3) {}

            return finish(result);
        };

        // ── doesNotAnswer ────────────────────────────────────────────────────
        this.doesNotAnswer = function (er) {
    er = er || {};

    var msg = 'Нет соединения';

    if (er.readyState === 0) {
        msg = 'Запрос к Lampac заблокирован (CORS) или сервер недоступен';
    } else if (er.msg) {
        msg = er.msg;
    }

    scroll.clear();
    var html = Lampa.Template.get('nexus_doesnotanswer', {
        title: Lampa.Lang.translate('lumio_error_title') || 'Ошибка',
        text: msg
    });

    scroll.append(html);
    _this.loading(false);
};
        var controller_ready = false;
        
        this.create = function () {
            return this.render();
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== _this.activity) return;

            if (!initialized) {
                initialized = true;
                _this.initialize();
            }

            Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));

            if (!controller_ready) {
                controller_ready = true;

                Lampa.Controller.add('content', {
    toggle: function () {
        try {
            var first = scroll.render().find('.selector').first();
            var target = null;

            if (last && $(last).closest(scroll.render()).length) {
                target = $(last).closest('.selector')[0];
            }

            if (!target && first.length) {
                target = first[0];
            }

            Lampa.Controller.collectionSet(scroll.render(), files.render());

            if (target) {
                Lampa.Controller.collectionFocus(target, scroll.render());
                last = target;
                scroll.update($(target), true);
            }
        } catch (e) {
            console.error('[Lumio] controller toggle error:', e);
        }
    },
    gone: function () {},
    up: function () {
        if (Navigator.canmove('up')) {
            Navigator.move('up');
        } else {
            Lampa.Controller.toggle('head');
        }
    },
    down: function () {
        Navigator.move('down');
    },
    right: function () {
        if (Navigator.canmove('right')) {
            Navigator.move('right');
        } else {
            filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        }
    },
    left: function () {
        if (Navigator.canmove('left')) {
            Navigator.move('left');
        } else {
            Lampa.Controller.toggle('menu');
        }
    },
    back: function () {
        try {
            _this.back();
        } catch (e) {
            console.error('[Lumio] back error:', e);
        }
    }
});
}

            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return files.render();
        };

        this.pause = function () {};

        this.stop = function () {
            _this.destroy();
        };

        this.destroy = function () {
            network.clear();
            try { files.destroy(); } catch (e) {}
            try { scroll.destroy(); } catch (e) {}
            try { filter.destroy(); } catch (e) {}
        };

        this.back = function () {
            if (is_serial) {
                if (serial_choice.episode) {
                    serial_choice.episode = 0;
                    serial_episode_url = '';
                    _this.saveSerialChoice();
                    _this.parse([]);
                    return;
                }

                if (serial_choice.voice) {
                    if (_this.currentVoiceList(serial_choice.season).length <= 1) {
                        serial_choice.season = 0;
                    }

                    serial_choice.voice = '';
                    serial_choice.voice_name = '';
                    serial_choice.episode = 0;
                    serial_episode_url = '';
                    _this.saveSerialChoice();
                    _this.parse([]);
                    return;
                }

                if (serial_choice.season) {
                    serial_choice.season = 0;
                    serial_choice.voice = '';
                    serial_choice.voice_name = '';
                    serial_choice.episode = 0;
                    serial_episode_url = '';
                    _this.saveSerialChoice();
                    _this.parse([]);
                    return;
                }
            }

            try {
                Lampa.Activity.backward();
            } catch (e) {
                console.error('[Lumio] backward error:', e);
            }
        };

        this.getChoice = function (name) {
            return Lampa.Storage.get('lumio_choice_' + (name || balanser), {
                season: 0,
                voice: 0,
                voice_url: '',
                voice_name: ''
            });
        };

        this.saveChoice = function (val, name) {
            Lampa.Storage.set('lumio_choice_' + (name || balanser), val);
        };

        this.replaceChoice = function (val) {
            _this.saveChoice(val);
        };

}

    Lampa.Component.add(NEXUS_COMPONENT, component);

    function openNexus(movie) {
        if (!movie) return;
        Lampa.Activity.push({
            url:       '',
            title:     NEXUS_TITLE,
            component: NEXUS_COMPONENT,
            movie:     movie,
            page:      1
        });
    }


var nexusCardButtonHtml =
    '<div class="full-start__button selector view--nexus nexus--button" data-stable-id="nexus_online_button" data-subtitle="V' + NEXUS_VERSION + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
            '<path d="M32 4 58 18v28L32 60 6 46V18L32 4Z" fill="#12D6DF"></path>' +
            '<path d="M32 4 58 18 32 33 6 18 32 4Z" fill="#9B5CFF"></path>' +
            '<path d="M25 21v22l18-11-18-11Z" fill="#fff"></path>' +
        '</svg>' +
        '<span>' + NEXUS_TITLE + '</span>' +
    '</div>';

var nexusButtonObserverTimer = null;

function getActiveMovie() {
    try {
        var act = Lampa.Activity.active();
        if (!act) return null;
        return act.card || act.movie || (act.activity && act.activity.card) || null;
    } catch (e) {
        return null;
    }
}

function insertNexusButton() {
    try {
        var act = Lampa.Activity.active();
        if (!act || act.component !== 'full') return false;

        var anchor = $('.full-start__button.view--online:not(.nexus--button), .view--online:not(.nexus--button)').filter(function () {
            return !$(this).closest('.modal, .selectbox, .settings, .menu, .nexus-container').length;
        }).first();

        if (!anchor.length) return false;

        var holder = anchor.parent();
        var current = holder.children('.nexus--button');

        var movie = getActiveMovie();
        if (movie) preloadSources(movie);

        $('.full-start__button.nexus--button').not(current).remove();

        if (current.length) return true;

        var btn = $(nexusCardButtonHtml);

        btn.on('hover:enter', function () {
            var activeMovie = getActiveMovie();
            if (activeMovie) openNexus(activeMovie);
        });

        anchor.after(btn);
        nexusLog('[Lumio] button inserted after view--online');
        return true;
    } catch (e) {
        console.error('[Lumio] insertNexusButton error:', e);
        return false;
    }
}

function startNexusButtonWatcher() {
    try {
        if (nexusButtonObserverTimer) clearInterval(nexusButtonObserverTimer);

        var attempts = 0;

        nexusButtonObserverTimer = setInterval(function () {
            attempts++;

            var inserted = insertNexusButton();

            if (inserted || attempts >= 40) {
                clearInterval(nexusButtonObserverTimer);
                nexusButtonObserverTimer = null;
                nexusLog('[Lumio] watcher stop, inserted:', inserted, 'attempts:', attempts);
            }
        }, 250);
    } catch (e) {
        console.error('[Lumio] startNexusButtonWatcher error:', e);
    }
}

if (Lampa.Listener && Lampa.Listener.follow) {
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            setTimeout(startNexusButtonWatcher, 0);
            setTimeout(startNexusButtonWatcher, 500);
            setTimeout(startNexusButtonWatcher, 1500);
        }
    });

    Lampa.Listener.follow('full', function (e) {
        nexusLog('[Lumio] full event:', e.type);
        setTimeout(startNexusButtonWatcher, 0);
        setTimeout(startNexusButtonWatcher, 300);
        setTimeout(startNexusButtonWatcher, 1000);
    });

    Lampa.Listener.follow('activity', function (e) {
        setTimeout(startNexusButtonWatcher, 0);
        setTimeout(startNexusButtonWatcher, 500);
    });
    
var nexusCardPreloadTimer = null;

if (Lampa.Listener && Lampa.Listener.follow) {
    Lampa.Listener.follow('card', function (e) {
        if (e.type !== 'focus' || !e.data || !e.data.movie) return;

        clearTimeout(nexusCardPreloadTimer);
        nexusCardPreloadTimer = setTimeout(function () {
            preloadSources(e.data.movie);
        }, 350);
    });
}
}

    var manifst = {
        type:    'video',
        version: NEXUS_VERSION,
        name:    NEXUS_TITLE,
        description: 'Онлайн просмотр через Lampac',
        icon:    NEXUS_MENU_ICON,
        component: NEXUS_COMPONENT,
        onContextMenu: function (obj) {
            return {
                name:        NEXUS_TITLE,
                description: Lampa.Lang.translate('lumio_watch') || 'Смотреть онлайн',
                icon:        NEXUS_MENU_ICON
            };
        },
        onContextLauch: function (obj) {
            openNexus(obj);
        }
    };

    function registerNexusManifest() {
        var plugins = Lampa.Manifest.plugins;

        Lampa.Component.add(NEXUS_COMPONENT, component);
        resetTemplates();

        if (Object.prototype.toString.call(plugins) !== '[object Array]') {
            plugins = plugins ? plugins : [];
        }

        for (var i = plugins.length - 1; i >= 0; i--) {
            if (plugins[i] && plugins[i].component === manifst.component) {
                plugins.splice(i, 1);
            }
        }

        plugins.unshift(manifst);
        Lampa.Manifest.plugins = plugins;
    }

    registerNexusManifest();



    if (Lampa.Lang && Lampa.Lang.add) {
    Lampa.Lang.add({
        lumio_watch: {
            ru: 'Смотреть онлайн',
            uk: 'Дивитися онлайн',
            en: 'Watch online'
        },
        lumio_balanser: {
            ru: 'Источник',
            uk: 'Джерело',
            en: 'Source'
        },
        lumio_no_sources: {
            ru: 'Нет соединения с сервером или сервер не вернул источники',
            uk: 'Немає зʼєднання з сервером або сервер не повернув джерела',
            en: 'No connection to server or no sources returned'
        },
        lumio_error_title: {
            ru: 'Ошибка',
            uk: 'Помилка',
            en: 'Error'
        }
    });
}

    nexusLog('[Lumio] v' + NEXUS_VERSION + ' loaded | server: ' + NEXUS_HOST);

})();
