(function () {
    "use strict";

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
    }

    function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
    }

    function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    }

    function _iterableToArray(iter) {
        if ((typeof Symbol !== "undefined" && iter[Symbol.iterator] != null) || iter["@@iterator"] != null) return Array.from(iter);
    }

    function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }

    function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
    }

    function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method.");
    }

    function _createForOfIteratorHelper(o, allowArrayLike) {
        var it = (typeof Symbol !== "undefined" && o[Symbol.iterator]) || o["@@iterator"];
        if (!it) {
            if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || (allowArrayLike && o && typeof o.length === "number")) {
                if (it) o = it;
                var i = 0;
                var F = function () { };
                return {
                    s: F,
                    n: function () {
                        if (i >= o.length) return { done: true };
                        return { done: false, value: o[i++] };
                    },
                    e: function (e) { throw e; },
                    f: F
                };
            }
            throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method.");
        }
        var normalCompletion = true, didErr = false, err;
        return {
            s: function () { it = it.call(o); },
            n: function () { var step = it.next(); normalCompletion = step.done; return step; },
            e: function (e) { didErr = true; err = e; },
            f: function () { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } }
        };
    }

    function State(object) {
        this.state = object.state;
        this.start = function () { this.dispath(this.state); };
        this.dispath = function (action_name) {
            var action = object.transitions[action_name];
            if (action) { action.call(this, this); }
            else { console.log("invalid action"); }
        };
    }

    var Player = (function () {
        function Player(object, video, isBgMode) {
            var _this = this;
            _classCallCheck(this, Player);
            this.paused = false;
            this.display = false;
            this.ended = false;
            this.isBgMode = isBgMode;
            this.video = video;
            this.listener = Lampa.Subscribe();
            this.html = $(
                '<div class="cardify-trailer ' + (this.isBgMode ? 'bg-mode' : 'fg-mode') + '">' +
                '<div class="cardify-trailer__youtube">' +
                '<div class="cardify-trailer__youtube-iframe"></div>' +
                '<div class="cardify-trailer__youtube-line one"></div>' +
                '<div class="cardify-trailer__youtube-line two"></div>' +
                '</div>' +
                (!this.isBgMode ? '<div class="cardify-trailer__controlls">' +
                '<div class="cardify-trailer__title"></div>' +
                '<div class="cardify-trailer__remote">' +
                '<div class="cardify-trailer__remote-icon">' +
                '<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M32.5196 7.22042L26.7992 12.9408C27.8463 14.5217 28.4561 16.4175 28.4561 18.4557C28.4561 20.857 27.6098 23.0605 26.1991 24.7844L31.8718 30.457C34.7226 27.2724 36.4561 23.0667 36.4561 18.4561C36.4561 14.2059 34.983 10.2998 32.5196 7.22042Z" fill="white" fill-opacity="0.28"/>' +
                '<path d="M31.262 31.1054L31.1054 31.262C31.158 31.2102 31.2102 31.158 31.262 31.1054Z" fill="white" fill-opacity="0.28"/>' +
                '<path d="M29.6917 32.5196L23.971 26.7989C22.3901 27.846 20.4943 28.4557 18.4561 28.4557C16.4179 28.4557 14.5221 27.846 12.9412 26.7989L7.22042 32.5196C10.2998 34.983 14.2059 36.4561 18.4561 36.4561C22.7062 36.4561 26.6123 34.983 29.6917 32.5196Z" fill="white" fill-opacity="0.28"/>' +
                '<path d="M5.81349 31.2688L5.64334 31.0986C5.69968 31.1557 5.7564 31.2124 5.81349 31.2688Z" fill="white" fill-opacity="0.28"/>' +
                '<path d="M5.04033 30.4571L10.7131 24.7844C9.30243 23.0605 8.4561 20.857 8.4561 18.4557C8.4561 16.4175 9.06588 14.5217 10.113 12.9408L4.39251 7.22037C1.9291 10.2998 0.456055 14.2059 0.456055 18.4561C0.456054 23.0667 2.18955 27.2724 5.04033 30.4571Z" fill="white" fill-opacity="0.28"/>' +
                '<path d="M6.45507 5.04029C9.63973 2.18953 13.8455 0.456055 18.4561 0.456055C23.0667 0.456054 27.2724 2.18955 30.4571 5.04034L24.7847 10.7127C23.0609 9.30207 20.8573 8.45575 18.4561 8.45575C16.0549 8.45575 13.8513 9.30207 12.1275 10.7127L6.45507 5.04029Z" fill="white" fill-opacity="0.28"/>' +
                '<circle cx="18.4565" cy="18.4561" r="7" fill="white"/>' +
                '</svg>' +
                '</div>' +
                '<div class="cardify-trailer__remote-text">' + Lampa.Lang.translate("cardify_enable_sound") + '</div>' +
                '</div>' +
                '</div>' : '') +
                '</div>'
            );
        }

        _createClass(Player, [
            {
                key: "initYoutube",
                value: function initYoutube() {
                    var _this = this;
                    var bgSound = Main.cases()[Main.stor()].field("cardify_bg_trailer_sound") === true;
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    var h = (this.isBgMode || isHorizontal) ? window.innerHeight * 2 : '100%';
                    var w = (this.isBgMode || isHorizontal) ? window.innerWidth : '100%';

                    this.youtube = new window.YT.Player(
                        this.html.find(".cardify-trailer__youtube-iframe")[0],
                        {
                            height: h,
                            width: w,
                            playerVars: {
                                controls: 0, showinfo: 0, autohide: 1, modestbranding: 1, autoplay: 0, disablekb: 1, fs: 0,
                                enablejsapi: 1, playsinline: 1, rel: 0, suggestedQuality: "hd1080", setPlaybackQuality: "hd1080",
                                mute: (this.isBgMode && !bgSound) ? 1 : 0, start: 8
                            },
                            videoId: this.video.id,
                            events: {
                                onReady: function onReady(event) {
                                    _this.loaded = true;
                                    var iframe = $(_this.youtube.getIframe());
                                    var blurVal = parseInt(Main.cases()[Main.stor()].field("cardify_trailers_blur")) || 0;
                                    if (blurVal > 0) iframe.css('filter', 'blur(' + blurVal + 'px)');
                                    if (_this.isBgMode || isHorizontal) {
                                        var zoomVal = Main.cases()[Main.stor()].field("cardify_trailers_zoom");
                                        if (zoomVal === true) zoomVal = "33";
                                        if (zoomVal === false) zoomVal = "0";
                                        zoomVal = zoomVal || "0";
                                        if (zoomVal !== "0") {
                                            var scale = 1;
                                            if (zoomVal == "25") scale = 1.25;
                                            else if (zoomVal == "33") scale = 1.33;
                                            else if (zoomVal == "40") scale = 1.40;
                                            else if (zoomVal == "45") scale = 1.45;
                                            else if (zoomVal == "50") scale = 1.50;
                                            iframe.css('transform', 'scale(' + scale + ')');
                                        }
                                    }
                                    _this.listener.send("loaded");
                                },
                                onStateChange: function onStateChange(state) {
                                    if (state.data == window.YT.PlayerState.PLAYING) {
                                        _this.paused = false;
                                        clearInterval(_this.timer);
                                        _this.timer = setInterval(function () {
                                            var left = _this.youtube.getDuration() - _this.youtube.getCurrentTime();
                                            if (left <= 2) { clearInterval(_this.timer); _this.listener.send("ended"); }
                                        }, 100);
                                        _this.listener.send("play");
                                        if (window.cardify_fist_unmute && !_this.isBgMode) _this.unmute();
                                    }
                                    if (state.data == window.YT.PlayerState.PAUSED) {
                                        _this.paused = true;
                                        clearInterval(_this.timer);
                                        _this.listener.send("paused");
                                    }
                                    if (state.data == window.YT.PlayerState.ENDED) _this.listener.send("ended");
                                    if (state.data == window.YT.PlayerState.BUFFERING) state.target.setPlaybackQuality("hd1080");
                                },
                                onError: function onError(e) { _this.loaded = false; _this.listener.send("error"); }
                            }
                        }
                    );
                }
            },
            {
                key: "initHtml5",
                value: function initHtml5() {
                    var _this = this;
                    var blurVal = parseInt(Main.cases()[Main.stor()].field("cardify_trailers_blur")) || 0;
                    var zoomVal = Main.cases()[Main.stor()].field("cardify_trailers_zoom");
                    var bgSound = Main.cases()[Main.stor()].field("cardify_bg_trailer_sound") === true;
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    if (zoomVal === true) zoomVal = "33";
                    if (zoomVal === false) zoomVal = "0";
                    zoomVal = zoomVal || "0";
                    var scale = 1;
                    if (zoomVal == "25") scale = 1.25;
                    else if (zoomVal == "33") scale = 1.33;
                    else if (zoomVal == "40") scale = 1.40;
                    else if (zoomVal == "45") scale = 1.45;
                    else if (zoomVal == "50") scale = 1.50;
                    var container = this.html.find(".cardify-trailer__youtube-iframe");
                    container.empty();
                    var videoElem = document.createElement('video');
                    videoElem.autoplay = true;
                    videoElem.playsInline = true;
                    videoElem.controls = false;
                    videoElem.disablePictureInPicture = true;
                    videoElem.disableRemotePlayback = true;
                    if (this.isBgMode && !bgSound) videoElem.muted = true;
                    else videoElem.muted = false;
                    videoElem.style.width = '100%';
                    videoElem.style.height = '100%';
                    videoElem.style.objectFit = (!this.isBgMode && !isHorizontal) ? 'contain' : 'cover';
                    videoElem.style.border = 'none';
                    videoElem.style.pointerEvents = 'none';
                    videoElem.style.outline = 'none';
                    videoElem.style.background = 'transparent';
                    videoElem.tabIndex = -1;
                    if (blurVal > 0) videoElem.style.filter = 'blur(' + blurVal + 'px)';
                    if (scale > 1 && (this.isBgMode || isHorizontal)) videoElem.style.transform = 'scale(' + scale + ')';
                    var srcUrl = this.video.url;
                    if (this.video.startTime) srcUrl += "#t=" + this.video.startTime;
                    videoElem.src = srcUrl;
                    container.append(videoElem);
                    this.videoNode = videoElem;
                    this.videoNode.addEventListener('loadedmetadata', function () { if (_this.video.startTime && _this.videoNode.currentTime < _this.video.startTime) _this.videoNode.currentTime = _this.video.startTime; });
                    this.videoNode.addEventListener('loadeddata', function () { _this.loaded = true; _this.listener.send("loaded"); });
                    this.videoNode.addEventListener('play', function () {
                        _this.paused = false;
                        clearInterval(_this.timer);
                        _this.timer = setInterval(function () {
                            if (_this.videoNode && !_this.videoNode.paused && !_this.videoNode.ended && _this.videoNode.duration) {
                                if (_this.videoNode.duration - _this.videoNode.currentTime <= 2) { clearInterval(_this.timer); _this.listener.send("ended"); }
                            }
                        }, 100);
                        _this.listener.send("play");
                        if (window.cardify_fist_unmute && !_this.isBgMode) _this.unmute();
                    });
                    this.videoNode.addEventListener('pause', function () { _this.paused = true; clearInterval(_this.timer); _this.listener.send("paused"); });
                    this.videoNode.addEventListener('ended', function () { _this.listener.send("ended"); });
                    this.videoNode.addEventListener('error', function () { _this.loaded = false; _this.listener.send("error"); });
                }
            },
            { key: "play", value: function play() { if (this.videoNode) { try { this.videoNode.play(); } catch (e) { } } else { try { this.youtube.playVideo(); } catch (e) { } } } },
            { key: "pause", value: function pause() { if (this.videoNode) { try { this.videoNode.pause(); } catch (e) { } } else { try { this.youtube.pauseVideo(); } catch (e) { } } } },
            {
                key: "unmute",
                value: function unmute() {
                    try {
                        if (this.isBgMode) return;
                        if (this.videoNode) this.videoNode.muted = false;
                        else this.youtube.unMute();
                        this.html.find(".cardify-trailer__remote").remove();
                        window.cardify_fist_unmute = true;
                    } catch (e) { }
                }
            },
            { key: "show", value: function show() { this.html.addClass("display"); this.display = true; } },
            { key: "hide", value: function hide() { this.html.removeClass("display"); this.display = false; } },
            { key: "render", value: function render() { return this.html; } },
            {
                key: "destroy",
                value: function destroy() {
                    this.loaded = false;
                    this.display = false;
                    if (this.videoNode) { try { this.videoNode.pause(); this.videoNode.removeAttribute('src'); this.videoNode.load(); } catch (e) { } }
                    else { try { this.youtube.destroy(); } catch (e) { } }
                    clearInterval(this.timer);
                    this.html.remove();
                }
            }
        ]);
        return Player;
    })();

    var Trailer = (function () {
        function Trailer(object, video, isBgMode) {
            var _this = this;
            _classCallCheck(this, Trailer);
            object.activity.trailer_ready = true;
            this.object = object;
            this.video = video;
            this.isBgMode = isBgMode;
            this.player;
            this.background = this.object.activity.render().find(".full-start__background, .m-full-start__background");
            this.startblock = this.object.activity.render().find(".cardify");
            this.head = $(".head");
            this.timelauch = isBgMode ? 100 : 5000;
            this.state = new State({
                state: "start",
                transitions: {
                    start: function start(state) {
                        clearTimeout(_this.timer_load);
                        if (_this.player.display) state.dispath("play");
                        else if (_this.player.loaded) _this.timer_load = setTimeout(function () { state.dispath("load"); }, _this.timelauch);
                    },
                    load: function load(state) {
                        if (_this.player.loaded && (Lampa.Controller.enabled().name == "full_start" || Lampa.Controller.enabled().name == "scroll") && _this.same() && $('.modal').length === 0)
                            state.dispath("play");
                    },
                    play: function play() { _this.player.play(); },
                    toggle: function toggle(state) {
                        if (_this.isBgMode) {
                            if (!_this.same()) { if (_this.player.display) state.dispath("hide"); return; }
                            var cname = Lampa.Controller.enabled().name;
                            var playerOpen = $('body').hasClass('player--open') || $('.player').length > 0;
                            if (!playerOpen) { if (!_this.player.display && _this.player.loaded) state.start(); }
                            else { if (_this.player.display) state.dispath("hide"); }
                            return;
                        }
                        clearTimeout(_this.timer_load);
                        if (Lampa.Controller.enabled().name == "cardify_trailer");
                        else if (Lampa.Controller.enabled().name == "full_start" && _this.same()) state.start();
                        else if (_this.player.display) state.dispath("hide");
                    },
                    hide: function hide() {
                        if (!_this.player.display) return;
                        _this.player.pause();
                        _this.player.hide();
                        _this.background.removeClass("nodisplay").css('opacity', '1');
                        if (!_this.isBgMode) {
                            _this.startblock.removeClass("nodisplay");
                            _this.head.removeClass("nodisplay");
                        }
                    }
                }
            });
            this.start();
        }

        _createClass(Trailer, [
            { key: "same", value: function same() { return Lampa.Activity.active().activity === this.object.activity; } },
            {
                key: "controll",
                value: function controll() {
                    if (this.isBgMode) return;
                    var _this3 = this;
                    var out = function out() { _this3.state.dispath("hide"); Lampa.Controller.toggle("full_start"); };
                    Lampa.Controller.add("cardify_trailer", {
                        toggle: function toggle() { Lampa.Controller.clear(); },
                        enter: function enter() { _this3.player.unmute(); },
                        left: out.bind(this), up: out.bind(this), down: out.bind(this), right: out.bind(this),
                        back: function back() { _this3.player.destroy(); out(); }
                    });
                    Lampa.Controller.toggle("cardify_trailer");
                }
            },
            {
                key: "start",
                value: function start() {
                    var _this4 = this;
                    var _self = this;
                    var toggle = function toggle(e) { _self.state.dispath("toggle"); };
                    var activityListener = function (a) {
                        if (a.object.activity === _self.object.activity) {
                            if (a.type === "destroy") remove();
                            else if (a.type === "background") _self.state.dispath("hide");
                            else if (a.type === "foreground") _self.state.dispath("toggle");
                        }
                    };
                    var remove = function remove() {
                        Lampa.Listener.remove("activity", activityListener);
                        Lampa.Controller.listener.remove("toggle", toggle);
                        if (window.cardifyBgPlayer === _this4.player) window.cardifyBgPlayer = null;
                        if (window.cardifyBgTrailer === _self) window.cardifyBgTrailer = null;
                        _self.destroy();
                    };
                    Lampa.Listener.follow("activity", activityListener);
                    Lampa.Controller.listener.follow("toggle", toggle);
                    this.player = new Player(this.object, this.video, this.isBgMode);
                    if (this.isBgMode) { window.cardifyBgPlayer = this.player; window.cardifyBgTrailer = this; }
                    this.player.listener.follow("loaded", function () { _this4.state.start(); });
                    this.player.listener.follow("play", function () {
                        clearTimeout(_this4.timer_show);
                        _this4.timer_show = setTimeout(function () {
                            _this4.player.show();
                            _this4.background.addClass("nodisplay");
                            if (!_this4.isBgMode) {
                                _this4.startblock.addClass("nodisplay");
                                _this4.head.addClass("nodisplay");
                                _this4.controll();
                            }
                        }, _this4.isBgMode ? 100 : 500);
                    });
                    this.player.listener.follow("ended,error", function () {
                        if (_this4.isBgMode) {
                            try {
                                if (_this4.player.videoNode) _this4.player.videoNode.currentTime = 8;
                                else if (_this4.player.youtube && typeof _this4.player.youtube.seekTo === 'function') _this4.player.youtube.seekTo(8);
                            } catch (err) { }
                            _this4.player.play();
                            return;
                        }
                        _this4.state.dispath("hide");
                        if (Lampa.Controller.enabled().name !== "full_start") Lampa.Controller.toggle("full_start");
                        setTimeout(remove, 300);
                    });
                    if (this.video.type === 'imdb_video') this.player.initHtml5();
                    else {
                        var checkYT = setInterval(function () { if (window.YT && window.YT.Player) { clearInterval(checkYT); _this4.player.initYoutube(); } }, 100);
                        if (!window.YT && !window.cardify_yt_injecting) {
                            window.cardify_yt_injecting = true;
                            Lampa.Utils.putScript(['https://www.youtube.com/iframe_api'], function () { });
                        }
                    }
                }
            },
            { key: "destroy", value: function destroy() { clearTimeout(this.timer_load); clearTimeout(this.timer_show); this.player.destroy(); } }
        ]);
        return Trailer;
    })();

    var wordBank = ["I ", "You ", "We ", "They ", "He ", "She ", "It ", " the ", "The ", " of ", " is ", "mpa", "Is ", " am ", "Am ", " are ", "Are ", " have ", "Have ", " has ", "Has ", " may ", "May ", " be ", "Be ", "La "];
    var wi = window;

    function keyFinder(str) {
        var inStr = str.toString();
        var outStr = "";
        var outStrElement = "";
        for (var k = 0; k < 26; k++) {
            outStr = caesarCipherEncodeAndDecodeEngine(inStr, k);
            for (var s = 0; s < outStr.length; s++) {
                for (var i = 0; i < wordBank.length; i++) {
                    for (var w = 0; w < wordBank[i].length; w++) outStrElement += outStr[s + w];
                    if (wordBank[i] === outStrElement) return k;
                    outStrElement = "";
                }
            }
        }
        return 0;
    }

    function bynam() { return wi[decodeNumbersToString$1([108, 111, 99, 97, 116, 105, 111, 110])][decodeNumbersToString$1([104, 111, 115, 116])].indexOf(decodeNumbersToString$1([98, 121, 108, 97, 109, 112, 97, 46, 111, 110, 108, 105, 110, 101])) == -1; }

    function caesarCipherEncodeAndDecodeEngine(inStr, numShifted) {
        var shiftNum = numShifted;
        var charCode = 0, shiftedCharCode = 0, result = 0;
        return inStr.split("").map(function (_char) {
            charCode = _char.charCodeAt();
            shiftedCharCode = charCode + shiftNum;
            result = charCode;
            if (charCode >= 48 && charCode <= 57) {
                if (shiftedCharCode < 48) { var diff = Math.abs(48 - 1 - shiftedCharCode) % 10; while (diff >= 10) diff = diff % 10; shiftedCharCode = 57 - diff; result = shiftedCharCode; }
                else if (shiftedCharCode >= 48 && shiftedCharCode <= 57) result = shiftedCharCode;
                else if (shiftedCharCode > 57) { var _diff = Math.abs(57 + 1 - shiftedCharCode) % 10; while (_diff >= 10) _diff = _diff % 10; shiftedCharCode = 48 + _diff; result = shiftedCharCode; }
            } else if (charCode >= 65 && charCode <= 90) {
                if (shiftedCharCode <= 64) { var _diff2 = Math.abs(65 - 1 - shiftedCharCode) % 26; while (_diff2 % 26 >= 26) _diff2 = _diff2 % 26; shiftedCharCode = 90 - _diff2; result = shiftedCharCode; }
                else if (shiftedCharCode >= 65 && shiftedCharCode <= 90) result = shiftedCharCode;
                else if (shiftedCharCode > 90) { var _diff3 = Math.abs(shiftedCharCode - 1 - 90) % 26; while (_diff3 % 26 >= 26) _diff3 = _diff3 % 26; shiftedCharCode = 65 + _diff3; result = shiftedCharCode; }
            } else if (charCode >= 97 && charCode <= 122) {
                if (shiftedCharCode <= 96) { var _diff4 = Math.abs(97 - 1 - shiftedCharCode) % 26; while (_diff4 % 26 >= 26) _diff4 = _diff4 % 26; shiftedCharCode = 122 - _diff4; result = shiftedCharCode; }
                else if (shiftedCharCode >= 97 && shiftedCharCode <= 122) result = shiftedCharCode;
                else if (shiftedCharCode > 122) { var _diff5 = Math.abs(shiftedCharCode - 1 - 122) % 26; while (_diff5 % 26 >= 26) _diff5 = _diff5 % 26; shiftedCharCode = 97 + _diff5; result = shiftedCharCode; }
            }
            return String.fromCharCode(parseInt(result));
        }).join("");
    }

    function cases() { var first = wordBank[25].trim() + wordBank[11]; return wi[first]; }
    function decodeNumbersToString$1(numbers) { return numbers.map(function (num) { return String.fromCharCode(num); }).join(""); }
    function stor() { return decodeNumbersToString$1([83, 116, 111, 114, 97, 103, 101]); }

    var Main = { keyFinder: keyFinder, caesarCipherEncodeAndDecodeEngine: caesarCipherEncodeAndDecodeEngine, cases: cases, stor: stor, bynam: bynam };

    function dfs(node, parent) {
        if (node) {
            this.up.set(node, new Map());
            this.up.get(node).set(0, parent);
            for (var i = 1; i < this.log; i++) this.up.get(node).set(i, this.up.get(this.up.get(node).get(i - 1)).get(i - 1));
            var _iterator = _createForOfIteratorHelper(this.connections.get(node)), _step;
            try { for (_iterator.s(); !(_step = _iterator.n()).done;) { var child = _step.value; if (child !== parent) this.dfs(child, node); } } catch (err) { _iterator.e(err); } finally { _iterator.f(); }
        }
    }

    function decodeNumbersToString(numbers) { return numbers.map(function (num) { return String.fromCharCode(num); }).join(""); }
    function kthAncestor(node, k) { if (!node) return dfs(); if (k >= this.connections.size) return this.root; for (var i = 0; i < this.log; i++) if (k & (1 << i)) node = this.up.get(node).get(i); return node; }
    function lisen(i) { kthAncestor(); return decodeNumbersToString([76, 105, 115, 116, 101, 110, 101, 114]); }
    function binaryLifting(root, tree) { var graphObject = [3]; var ancestors = []; for (var i = 0; i < graphObject.length; i++) ancestors.push(lisen()); return ancestors.slice(0, 1)[0]; }

    var FrequencyMap = (function () {
        function FrequencyMap() { _classCallCheck(this, FrequencyMap); }
        _createClass(FrequencyMap, [
            { key: "refresh", value: function refresh(node) { var frequency = node.frequency; var freqSet = this.get(frequency); freqSet["delete"](node); node.frequency++; this.insert(node); } },
            { key: "insert", value: function insert(node) { var frequency = node.frequency; if (!this.has(frequency)) this.set(frequency, new Set()); this.get(frequency).add(node); } }
        ]);
        return FrequencyMap;
    })();

    var LFUCache = (function () {
        function LFUCache(capacity) { _classCallCheck(this, LFUCache); this.capacity = Main.cases(); this.frequencyMap = binaryLifting(); this.free = new FrequencyMap(); this.misses = 0; this.hits = 0; }
        _createClass(LFUCache, [
            { key: "size", get: function get() { return this.cache.size; } },
            { key: "go", get: function get() { return window["app" + "re" + "ady"]; } },
            { key: "info", get: function get() { return Object.freeze({ misses: this.misses, hits: this.hits, capacity: this.capacity, currentSize: this.size, leastFrequency: this.leastFrequency }); } },
            { key: "leastFrequency", get: function get() { var freqCacheIterator = this.frequencyMap.keys(); var leastFrequency = freqCacheIterator.next().value || null; while (((_this$frequencyMap$ge = this.frequencyMap.get(leastFrequency)) === null || _this$frequencyMap$ge === void 0 ? void 0 : _this$frequencyMap$ge.size) === 0) { var _this$frequencyMap$ge; leastFrequency = freqCacheIterator.next().value; } return leastFrequency; } },
            { key: "removeCacheNode", value: function removeCacheNode() { var leastFreqSet = this.frequencyMap.get(this.leastFrequency); var LFUNode = leastFreqSet.values().next().value; leastFreqSet["delete"](LFUNode); this.cache["delete"](LFUNode.key); } },
            { key: "has", value: function has(key) { key = String(key); return this.cache.has(key); } },
            { key: "get", value: function get(key, call) { if (key) this.capacity[this.frequencyMap].follow(key, call); this.misses++; return null; } },
            { key: "set", value: function set(key, value) { var frequency = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1; key = String(key); if (this.capacity === 0) throw new RangeError("LFUCache ERROR: The Capacity is 0"); if (this.cache.has(key)) { var node = this.cache.get(key); node.value = value; this.frequencyMap.refresh(node); return this; } if (this.capacity === this.cache.size) this.removeCacheNode(); var newNode = new CacheNode(key, value, frequency); this.cache.set(key, newNode); this.frequencyMap.insert(newNode); return this; } },
            { key: "skodf", value: function skodf(e) { var render = e.object.activity.render(); var bg = render.find(".full-start__background, .m-full-start__background"); bg.addClass("cardify__background"); } },
            { key: "parse", value: function parse(json) { var _JSON$parse = JSON.parse(json), misses = _JSON$parse.misses, hits = _JSON$parse.hits, cache = _JSON$parse.cache; this.misses += misses !== null && misses !== void 0 ? misses : 0; this.hits += hits !== null && hits !== void 0 ? hits : 0; for (var key in cache) { var _cache$key = cache[key], value = _cache$key.value, frequency = _cache$key.frequency; this.set(key, value, frequency); } return this; } },
            { key: "vjsk", value: function vjsk(v) { return this.un(v) ? v : v; } },
            { key: "clear", value: function clear() { this.cache.clear(); this.frequencyMap.clear(); return this; } },
            { key: "toString", value: function toString(indent) { var replacer = function replacer(_, value) { if (value instanceof Set) return _toConsumableArray(value); if (value instanceof Map) return Object.fromEntries(value); return value; }; return JSON.stringify(this, replacer, indent); } },
            { key: "un", value: function un(v) { return Main.bynam(); } }
        ]);
        return LFUCache;
    })();

    var Follow = new LFUCache();

    function gy(numbers) { return numbers.map(function (num) { return String.fromCharCode(num); }).join(""); }
    function re(e) { return e.type == "re " + "ad" + "y"; }
    function co(e) { return e.type == "co " + "mpl" + "ite"; }
    function de(n) { return gy(n); }
    var Type = { re: re, co: co, de: de };

    function startPlugin() {
        Lampa.Lang.add({ cardify_enable_sound: { ru: "Включить звук", en: "Enable sound", uk: "Увімкнути звук", be: "Уключыць гук", zh: "启用声音", pt: "Ativar som", bg: "Включване на звук" } });

        if (window.Lampa && Lampa.Player && Lampa.Player.listener) {
            Lampa.Player.listener.follow('ready', function () {
                if (window.cardifyBgTrailer && window.cardifyBgTrailer.state) window.cardifyBgTrailer.state.dispath('hide');
                else if (window.cardifyBgPlayer && typeof window.cardifyBgPlayer.pause === 'function') { window.cardifyBgPlayer.pause(); if (typeof window.cardifyBgPlayer.hide === 'function') window.cardifyBgPlayer.hide(); }
            });
            Lampa.Player.listener.follow('destroy', function () { setTimeout(function () { if (Lampa.Activity.active() && Lampa.Activity.active().component === 'full_start') { if (window.cardifyBgTrailer && window.cardifyBgTrailer.state) window.cardifyBgTrailer.state.start(); else if (window.cardifyBgPlayer && typeof window.cardifyBgPlayer.play === 'function') { window.cardifyBgPlayer.play(); if (typeof window.cardifyBgPlayer.show === 'function') window.cardifyBgPlayer.show(); } } }, 300); });
        }

        Lampa.SettingsApi.addComponent({ component: "cardify", icon: '<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="33" height="25" rx="3.5" stroke="white" stroke-width="3"/><rect x="5" y="14" width="17" height="4" rx="2" fill="white"/><rect x="5" y="20" width="10" height="3" rx="1.5" fill="white"/><rect x="25" y="20" width="6" height="3" rx="1.5" fill="white"/></svg>', name: "Трейлери" });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_run_trailers", type: "trigger", default: false }, field: { name: "Показувати трейлери", description: "Запускати трейлер через таймаут 5 сек (замість фону та інтерфейсу)" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailers_bg", type: "trigger", default: false }, field: { name: "Трейлери замість слайдшоу", description: "Завантажити трейлер на задній фон одразу" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_bg_trailer_sound", type: "trigger", default: false }, field: { name: "Звук фонового трейлеру", description: "Увімкнути звук для трейлеру, що грає на фоні" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailer_source", type: "select", values: { "tmdb": "TMDB (YouTube)", "imdb": "IMDB (Balloonerism)" }, default: "tmdb" }, field: { name: "Джерело трейлерів", description: "Звідки завантажувати трейлери" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailer_quality", type: "select", values: { "1080": "1080p", "720": "720p", "480": "480p", "sd": "SD", "auto": "Auto" }, default: "auto" }, field: { name: "Якість фонового трейлеру IMDB", description: "Працює лише якщо джерело - IMDB" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailer_proxy", type: "trigger", default: true }, field: { name: "Проксі для трейлерів IMDB", description: "Використовувати проксі для запитів API та відео" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailers_blur", type: "select", values: { "0": "Вимкнено", "1": "1%", "2": "2%", "3": "3%", "4": "4%", "5": "5%", "10": "10%" }, default: "0" }, field: { name: "Розмиття трейлеру", description: "Рівень розмиття фонового трейлеру" } });
        Lampa.SettingsApi.addParam({ component: "cardify", param: { name: "cardify_trailers_zoom", type: "select", values: { "0": "Вимкнено", "25": "25%", "33": "33%", "40": "40%", "45": "45%", "50": "50%" }, default: "0" }, field: { name: "Розтягнення трейлеру", description: "Прибирає чорні полоси відео" } });

        function video(data) {
            var vids = data.videos || (data.movie && data.movie.videos) || (data.tv && data.tv.videos);
            if (vids && vids.results && vids.results.length) {
                var items = [];
                vids.results.forEach(function (element) {
                    var name_orig = (element.name || "").toLowerCase();
                    if (element.iso_639_1 === 'ru' || name_orig.indexOf('официальный') !== -1 || name_orig.indexOf('русский') !== -1 || name_orig.indexOf('на русском') !== -1) return;
                    if (name_orig.indexOf('#shorts') !== -1 || name_orig.indexOf('[shorts]') !== -1 || name_orig.indexOf('(shorts)') !== -1 || name_orig.indexOf('tiktok') !== -1 || name_orig.indexOf('vertical') !== -1) return;
                    items.push({ title: Lampa.Utils.shortText(element.name, 50), id: element.key, code: element.iso_639_1, time: new Date(element.published_at).getTime(), url: "https://www.youtube.com/watch?v=" + element.key, img: "https://img.youtube.com/vi/" + element.key + "/default.jpg", name_orig: name_orig, type: (element.type || "").toLowerCase() });
                });
                items.sort(function (a, b) { return a.time > b.time ? -1 : a.time < b.time ? 1 : 0; });
                var uk_lang = items.filter(function (n) { return n.code === "uk" || n.name_orig.indexOf("українською") !== -1 || n.name_orig.indexOf("український") !== -1 || n.name_orig.indexOf("укр трейлер") !== -1; });
                var en_lang = items.filter(function (n) { return n.code === "en" && uk_lang.indexOf(n) === -1; });
                if (uk_lang.length) { var best_uk = uk_lang.find(function (n) { return n.name_orig.indexOf("офіційний трейлер") !== -1 || n.name_orig.indexOf("українською") !== -1 || n.name_orig.indexOf("український") !== -1; }); if (!best_uk) best_uk = uk_lang.find(function (n) { return n.name_orig.indexOf("трейлер") !== -1 || n.type === "trailer"; }); if (best_uk) return best_uk; return uk_lang[0]; }
                if (en_lang.length) { var best_en = en_lang.find(function (n) { return n.name_orig.indexOf("official trailer") !== -1; }); if (!best_en) best_en = en_lang.find(function (n) { return n.name_orig.indexOf("trailer") !== -1 || n.type === "trailer"; }); if (best_en) return best_en; return en_lang[0]; }
                if (items.length) return items[0];
            }
        }

        Follow.get(Type.de([102, 117, 108, 108]), function (e) {
            if (Type.co(e)) {
                Follow.skodf(e);
                var isRunTrailers = Main.cases()[Main.stor()].field("cardify_run_trailers");
                var isBgTrailers = Main.cases()[Main.stor()].field("cardify_trailers_bg");
                var trailer_source = Main.cases()[Main.stor()].field("cardify_trailer_source") || "tmdb";
                var trailer_quality = Main.cases()[Main.stor()].field("cardify_trailer_quality") || "auto";
                var use_proxy = Main.cases()[Main.stor()].field("cardify_trailer_proxy") !== false;

                var finalizeTrailer = function (tr) {
                    if (tr && Main.cases().Manifest.app_digital >= 220 && Main.cases().Activity.active().activity === e.object.activity) new Trailer(e.object, tr, isBgTrailers);
                };

                if (isRunTrailers || isBgTrailers) {
                    if (trailer_source === 'imdb') {
                        var imdb_id = e.data.imdb_id || (e.data.external_ids ? e.data.external_ids.imdb_id : null) || (e.data.movie ? e.data.movie.imdb_id : null) || (e.data.tv ? e.data.tv.imdb_id : null) || (e.object && e.object.card ? e.object.card.imdb_id : null);
                        if (imdb_id) {
                            var api_url = "https://api.balloonerismm.workers.dev/movie/" + imdb_id;
                            if (use_proxy) api_url = "https://cors.lampa.stream/" + api_url;
                            $.ajax({
                                url: api_url, type: 'GET', dataType: 'json',
                                success: function (data) {
                                    var tr = null;
                                    if (data && data.trailer && data.trailer.playback) {
                                        var p = {};
                                        for (var k in data.trailer.playback) p[k.toLowerCase().replace('p', '')] = data.trailer.playback[k];
                                        var order = ['1080', '720', '480', 'sd', 'auto'];
                                        var startIndex = order.indexOf(trailer_quality);
                                        if (startIndex === -1) startIndex = 0;
                                        var video_url = null;
                                        for (var i = startIndex; i < order.length; i++) { if (p[order[i]]) { video_url = p[order[i]]; break; } }
                                        if (!video_url) for (var i = 0; i < order.length; i++) { if (p[order[i]]) { video_url = p[order[i]]; break; } }
                                        if (!video_url) { var keys = Object.keys(p); if (keys.length > 0) video_url = p[keys[0]]; }
                                        if (video_url) tr = { type: 'imdb_video', url: use_proxy ? "https://cors.lampa.stream/" + video_url : video_url, id: imdb_id, startTime: 10 };
                                    }
                                    finalizeTrailer(tr);
                                }, error: function () { finalizeTrailer(null); }
                            });
                        } else finalizeTrailer(null);
                    } else { var tmdb_tr = Follow.vjsk(video(e.data)); finalizeTrailer(tmdb_tr); }
                }
            }
        });
    }

    if (Follow.go) startPlugin();
    else { Follow.get(Type.de([97, 112, 112]), function (e) { if (Type.re(e)) startPlugin(); }); }
})();
