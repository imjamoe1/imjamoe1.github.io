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
		return (
			_arrayWithoutHoles(arr) ||
			_iterableToArray(arr) ||
			_unsupportedIterableToArray(arr) ||
			_nonIterableSpread()
		);
	}

	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}

	function _iterableToArray(iter) {
		if (
			(typeof Symbol !== "undefined" && iter[Symbol.iterator] != null) ||
			iter["@@iterator"] != null
		)
			return Array.from(iter);
	}

	function _unsupportedIterableToArray(o, minLen) {
		if (!o) return;
		if (typeof o === "string") return _arrayLikeToArray(o, minLen);
		var n = Object.prototype.toString.call(o).slice(8, -1);
		if (n === "Object" && o.constructor) n = o.constructor.name;
		if (n === "Map" || n === "Set") return Array.from(o);
		if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
			return _arrayLikeToArray(o, minLen);
	}

	function _arrayLikeToArray(arr, len) {
		if (len == null || len > arr.length) len = arr.length;

		for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

		return arr2;
	}

	function _nonIterableSpread() {
		throw new TypeError(
			"Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method."
		);
	}

	function _createForOfIteratorHelper(o, allowArrayLike) {
		var it =
			(typeof Symbol !== "undefined" && o[Symbol.iterator]) || o["@@iterator"];

		if (!it) {
			if (
				Array.isArray(o) ||
				(it = _unsupportedIterableToArray(o)) ||
				(allowArrayLike && o && typeof o.length === "number")
			) {
				if (it) o = it;
				var i = 0;

				var F = function () {};

				return {
					s: F,
					n: function () {
						if (i >= o.length)
							return {
								done: true
							};
						return {
							done: false,
							value: o[i++]
						};
					},
					e: function (e) {
						throw e;
					},
					f: F
				};
			}

			throw new TypeError(
				"Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a[Symbol.iterator]() method."
			);
		}

		var normalCompletion = true,
			didErr = false,
			err;
		return {
			s: function () {
				it = it.call(o);
			},
			n: function () {
				var step = it.next();
				normalCompletion = step.done;
				return step;
			},
			e: function (e) {
				didErr = true;
				err = e;
			},
			f: function () {
				try {
					if (!normalCompletion && it.return != null) it.return();
				} finally {
					if (didErr) throw err;
				}
			}
		};
	}
    
    function State(object) {
		this.state = object.state;

		this.start = function () {
			this.dispath(this.state);
		};

		this.dispath = function (action_name) {
			var action = object.transitions[action_name];

			if (action) {
				action.call(this, this);
			} else {
				console.log("invalid action");
			}
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

            // Получаем настройку виньетки
            this.vignetteType = Main.cases()[Main.stor()].field("trailers_vignette") || "0";

			this.html = $(
				'<div class="trailer-player ' + (this.isBgMode ? 'bg-mode' : 'fg-mode') + '">' +
                '<div class="trailer-player__video ' + (this.vignetteType !== "0" ? 'trailer-player__vignette trailer-player__vignette--' + this.vignetteType : '') + '">' +
                '<div class="trailer-player__video-iframe"></div>' +
                '</div>' +
                (!this.isBgMode ? '<div class="trailer-player__controls">' +
                '<div class="trailer-player__title"></div>' +
                '<div class="trailer-player__sound">' +
                '<div class="trailer-player__sound-icon">' +
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
                '<div class="trailer-player__sound-text">'.concat(
					Lampa.Lang.translate("trailers_enable_sound"),
					"</div></div></div>"
				) : "") + '</div>'
			);
		}

		_createClass(Player,[
            {
                key: "initYoutube",
                value: function initYoutube() {
                    var _this = this;
                    var bgSound = Main.cases()[Main.stor()].field("bg_trailers_sound") === true;
                    var soundEnabled = Main.cases()[Main.stor()].field("trailers_enable_sound") === true;
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    
                    var h = (this.isBgMode || isHorizontal) ? window.innerHeight * 2 : '100%';
                    var w = (this.isBgMode || isHorizontal) ? window.innerWidth : '100%';

                    var muteValue = this.isBgMode ? (bgSound ? 0 : 1) : (soundEnabled ? 0 : 1);			

                    this.youtube = new window.YT.Player(
                        this.html.find(".trailer-player__video-iframe")[0],
                        {
                            height: h,
                            width: w,
                            playerVars: {
                                controls: 0,
                                showinfo: 0,
                                autohide: 1,
                                modestbranding: 1,
                                autoplay: 0,
                                disablekb: 1,
                                fs: 0,
                                enablejsapi: 1,
                                playsinline: 1,
                                rel: 0,
                                suggestedQuality: "hd1080",
                                setPlaybackQuality: "hd1080",
                                mute: muteValue,
                                start: 8
                            },
                            videoId: this.video.id,
                            events: {
                                onReady: function onReady(event) {
                                    _this.loaded = true;
                                    var iframe = $(_this.youtube.getIframe());
                                    
                                    var blurVal = parseInt(Main.cases()[Main.stor()].field("trailers_blur")) || 0;
                                    if (blurVal > 0) {
                                        iframe.css('filter', 'blur(' + blurVal + 'px)');
                                    }

                                    if (_this.isBgMode || isHorizontal) {
                                        var zoomVal = Main.cases()[Main.stor()].field("trailers_zoom");
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
                                            var toend = 2;
                                            if (left <= toend) {
                                                clearInterval(_this.timer);
                                                _this.listener.send("ended");
                                            }
                                        }, 100);

                                        _this.listener.send("play");

                                        if (window.fist_unmute && !_this.isBgMode) _this.unmute();
                                    }

                                    if (state.data == window.YT.PlayerState.PAUSED) {
                                        _this.paused = true;
                                        clearInterval(_this.timer);
                                        _this.listener.send("paused");
                                    }

                                    if (state.data == window.YT.PlayerState.ENDED) {
                                        _this.listener.send("ended");
                                    }

                                    if (state.data == window.YT.PlayerState.BUFFERING) {
                                        state.target.setPlaybackQuality("hd1080");
                                    }
                                },
                                onError: function onError(e) {
                                    _this.loaded = false;
                                    _this.listener.send("error");
                                }
                            }
                        }
                    );
                }
            },
            {
                key: "initHtml5",
                value: function initHtml5() {
                    var _this = this;
                    var blurVal = parseInt(Main.cases()[Main.stor()].field("trailers_blur")) || 0;
                    var zoomVal = Main.cases()[Main.stor()].field("trailers_zoom");
                    var bgSound = Main.cases()[Main.stor()].field("bg_trailers_sound") === true;
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

                    var container = this.html.find(".trailer-player__video-iframe");
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
                    if (this.video.startTime) {
                        srcUrl += "#t=" + this.video.startTime;
                    }
                    videoElem.src = srcUrl;
                    
                    container.append(videoElem);
                    this.videoNode = videoElem;

                    this.videoNode.addEventListener('loadedmetadata', function() {
                        if (_this.video.startTime) {
                            if (_this.videoNode.currentTime < _this.video.startTime) {
                                _this.videoNode.currentTime = _this.video.startTime;
                            }
                        }
                    });

                    this.videoNode.addEventListener('loadeddata', function() {
                        _this.loaded = true;
                        _this.listener.send("loaded");
                    });

                    this.videoNode.addEventListener('play', function() {
                        _this.paused = false;
                        clearInterval(_this.timer);
                        _this.timer = setInterval(function() {
                            if (_this.videoNode && !_this.videoNode.paused && !_this.videoNode.ended && _this.videoNode.duration) {
                                var left = _this.videoNode.duration - _this.videoNode.currentTime;
                                if (left <= 2 && left > 0) {
                                    clearInterval(_this.timer);
                                    _this.listener.send("ended");
                                }
                            }
                        }, 100);
                        
                        _this.listener.send("play");
                        if (window.fist_unmute && !_this.isBgMode) _this.unmute();
                    });

                    this.videoNode.addEventListener('pause', function() {
                        _this.paused = true;
                        clearInterval(_this.timer);
                        _this.listener.send("paused");
                    });

                    this.videoNode.addEventListener('ended', function() {
                        _this.listener.send("ended");
                    });

                    this.videoNode.addEventListener('error', function() {
                        _this.loaded = false;
                        _this.listener.send("error");
                    });
                }
            },
			{
				key: "play",
				value: function play() {
                    if (this.videoNode) {
                        try { this.videoNode.play(); } catch(e) {}
                    } else {
                        try { this.youtube.playVideo(); } catch (e) {}
                    }
				}
			},
			{
				key: "pause",
				value: function pause() {
                    if (this.videoNode) {
                        try { this.videoNode.pause(); } catch(e) {}
                    } else {
                        try { this.youtube.pauseVideo(); } catch (e) {}
                    }
				}
			},
			{
				key: "unmute",
				value: function unmute() {
					try {
                        if (this.isBgMode) return;
                        if (this.videoNode) {
                            this.videoNode.muted = false;
                        } else {
                            this.youtube.unMute();
                        }
						this.html.find(".trailer-player__sound").remove();
						window.fist_unmute = true;
					} catch (e) {}
				}
			},
			{
				key: "show",
				value: function show() {
					this.html.addClass("display");
					this.display = true;
				}
			},
			{
				key: "hide",
				value: function hide() {
					this.html.removeClass("display");
					this.display = false;
				}
			},
			{
				key: "render",
				value: function render() {
					return this.html;
				}
			},
			{
				key: "destroy",
				value: function destroy() {
					this.loaded = false;
					this.display = false;

                    if (this.videoNode) {
                        try {
                            this.videoNode.pause();
                            this.videoNode.removeAttribute('src');
                            this.videoNode.load();
                        } catch(e) {}
                    } else {
                        try { this.youtube.destroy(); } catch (e) {}
                    }

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
			
            var isHorizontal = window.innerWidth > window.innerHeight;
            if (isHorizontal) {
                this.background = this.object.activity.render().find(".full-start__background, .m-full-start__background");
            } else {
                this.background = this.object.activity.render().find(".full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img");
            }
            
			this.startblock = this.object.activity.render();
			this.head = $(".head");
			this.timelauch = isBgMode ? 100 : 5000;
			this.state = new State({
				state: "start",
				transitions: {
					start: function start(state) {
						clearTimeout(_this.timer_load);
						if (_this.player.display) state.dispath("play");
						else if (_this.player.loaded) {
							_this.timer_load = setTimeout(function () {
								state.dispath("load");
							}, _this.timelauch);
						}
					},
					load: function load(state) {
						if (
							_this.player.loaded &&
							(Lampa.Controller.enabled().name == "full_start" || Lampa.Controller.enabled().name == "scroll") &&
							_this.same() &&
                            $('.modal').length === 0
						)
							state.dispath("play");
					},
					play: function play() {
						_this.player.play();
					},
					toggle: function toggle(state) {
                        if (_this.isBgMode) {
                            if (!_this.same()) {
                                if (_this.player.display) state.dispath("hide");
                                return;
                            }
                            
                            var cname = Lampa.Controller.enabled().name;
                            var playerOpen = $('body').hasClass('player--open') || $('.player').length > 0;
                            
                            if (!playerOpen) {
                                if (!_this.player.display && _this.player.loaded) {
                                    state.start();
                                }
                            } else {
                                if (_this.player.display) state.dispath("hide");
                            }
                            return;
                        }

						clearTimeout(_this.timer_load);
						if (Lampa.Controller.enabled().name == "trailer");
						else if (
							Lampa.Controller.enabled().name == "full_start" &&
							_this.same()
						) {
							state.start();
						} else if (_this.player.display) {
							state.dispath("hide");
						}
					},
					hide: function hide() {
                        if (!_this.player.display) return;
						_this.player.pause();
						_this.player.hide();
                        var isHorizontalNow = window.innerWidth > window.innerHeight;
                        
                        if (!isHorizontalNow && _this.isBgMode) {
                            _this.background.css('opacity', '1');
                        } else {
                            _this.background.removeClass("nodisplay").css('opacity', '1');
                        }
                        
                        if (!_this.isBgMode) {
						    _this.startblock.removeClass("nodisplay");
						    _this.head.removeClass("nodisplay");
                        }
					}
				}
			});
			this.start();
		}

		_createClass(Trailer,[
			{
				key: "same",
				value: function same() {
					return Lampa.Activity.active().activity === this.object.activity;
				}
			},
			{
				key: "controll",
				value: function controll() {
                    if (this.isBgMode) return; 
					var _this3 = this;

					var out = function out() {
						_this3.state.dispath("hide");
						Lampa.Controller.toggle("full_start");
					};

					Lampa.Controller.add("trailer", {
						toggle: function toggle() {
							Lampa.Controller.clear();
						},
						enter: function enter() {
							_this3.player.unmute();
						},
						left: out.bind(this),
						up: out.bind(this),
						down: out.bind(this),
						right: out.bind(this),
						back: function back() {
							_this3.player.destroy();
							out();
						}
					});
					Lampa.Controller.toggle("trailer");
				}
			},
			{
				key: "start",
				value: function start() {
					var _this4 = this;
					var _self = this;

					var toggle = function toggle(e) {
						_self.state.dispath("toggle");
					};

                    var activityListener = function (a) {
                        if (a.object.activity === _self.object.activity) {
                            if (a.type === "destroy") {
                                remove();
                            } else if (a.type === "background") {
                                _self.state.dispath("hide");
                            } else if (a.type === "foreground") {
                                _self.state.dispath("toggle");
                            }
                        }
                    };

					var remove = function remove() {
						Lampa.Listener.remove("activity", activityListener);
						Lampa.Controller.listener.remove("toggle", toggle);
                        
                        if (window.BgPlayer === _this4.player) {
                            window.BgPlayer = null;
                        }
                        if (window.BgTrailer === _self) {
                            window.BgTrailer = null;
                        }

						_self.destroy();
					};

					Lampa.Listener.follow("activity", activityListener);
					Lampa.Controller.listener.follow("toggle", toggle);

					this.player = new Player(this.object, this.video, this.isBgMode);
                    
                    if (this.isBgMode) {
                        window.BgPlayer = this.player;
                        window.BgTrailer = this;
                    }

					this.player.listener.follow("loaded", function () {
						_this4.state.start();
					});
					this.player.listener.follow("play", function () {
						clearTimeout(_this4.timer_show);

						_this4.timer_show = setTimeout(function () {
                            if (_this4.isBgMode) {
                                if (_this4.player.html && _this4.player.html.length) {
                                    _this4.player.html[0].style.setProperty('transition', 'opacity 2s ease-in-out', 'important');
                                }
                                if (_this4.background && _this4.background.length) {
                                    _this4.background.each(function() {
                                        this.style.setProperty('transition', 'opacity 2s ease-in-out', 'important');
                                    });
                                }
                            }

							_this4.player.show();
                            
                            var isHorizontalNow = window.innerWidth > window.innerHeight;
                            if (!isHorizontalNow && _this4.isBgMode) {
                                _this4.background.css('opacity', '0');
                            } else {
                                _this4.background.addClass("nodisplay");
                            }

                            if (!_this4.isBgMode) {
							    _this4.startblock.addClass("nodisplay");
							    _this4.head.addClass("nodisplay");
							    _this4.controll();
                            }
						}, _this4.isBgMode ? 100 : 500);
					});
					this.player.listener.follow("ended,error", function () {
                                            if (_this4.isBgMode) {
                                                _this4.state.dispath("hide");
                                                return;
                                            }

                                            _this4.state.dispath("hide");

                                            if (Lampa.Controller.enabled().name !== "full_start")
                                                Lampa.Controller.toggle("full_start");

                                            setTimeout(remove, 300);
                                         });

                    var $render = this.object.activity.render();
                    var isHorizontal = window.innerWidth > window.innerHeight;

                    if (!isHorizontal && this.isBgMode) {
                        var $bg = $render.find('.full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img').first();
                        var $playerHtml = this.player.render();
                        if ($bg.length) {
                            $playerHtml.find('.trailer-player__video').css({
                                position: 'absolute',
                                height: '100%',
                                width: '100%'
                            });
                            
                            var $bgParent = $bg.parent();
                            if ($bgParent.css('position') === 'static') {
                                $bgParent.css('position', 'relative');
                            }

                            $playerHtml.css({
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '100%',
                                zIndex: $bg.css('z-index') !== 'auto' ? $bg.css('z-index') : 1,
                                overflow: 'hidden'
                            });

                            $bg.after($playerHtml);
                        } else {
                            $render.find(".activity__body").prepend($playerHtml);
                        }
                    } else {
                        if (this.isBgMode) {
                            $render.find(".activity__body").prepend(this.player.render());
                        } else {
                            $render.find(".activity__body").prepend(this.player.render());
                        }
                    }

                    if (this.video.type === 'imdb_video') {
                        this.player.initHtml5();
                    } else {
                        var checkYT = setInterval(function() {
                            if (window.YT && window.YT.Player) {
                                clearInterval(checkYT);
                                _this4.player.initYoutube();
                            }
                        }, 100);

                        if (!window.YT && !window.yt_injecting) {
                            window.yt_injecting = true;
                            Lampa.Utils.putScript([ 'https://www.youtube.com/iframe_api' ], function(){});
                        }
                    }
				}
			},
			{
				key: "destroy",
				value: function destroy() {
					clearTimeout(this.timer_load);
					clearTimeout(this.timer_show);
					this.player.destroy();
				}
			}
		]);

		return Trailer;
	})();

	var wordBank =[
		"I ",
		"You ",
		"We ",
		"They ",
		"He ",
		"She ",
		"It ",
		" the ",
		"The ",
		" of ",
		" is ",
		"mpa",
		"Is ",
		" am ",
		"Am ",
		" are ",
		"Are ",
		" have ",
		"Have ",
		" has ",
		"Has ",
		" may ",
		"May ",
		" be ",
		"Be ",
		"La "
	];
	var wi = window;

	function keyFinder(str) {
		var inStr = str.toString();
		var outStr = "";
		var outStrElement = "";

		for (var k = 0; k < 26; k++) {
			outStr = caesarCipherEncodeAndDecodeEngine(inStr, k);

			for (var s = 0; s < outStr.length; s++) {
				for (var i = 0; i < wordBank.length; i++) {
					for (var w = 0; w < wordBank[i].length; w++) {
						outStrElement += outStr[s + w];
					}

					if (wordBank[i] === outStrElement) {
						return k;
					}

					outStrElement = "";
				}
			}
		}

		return 0;
	}

	function bynam() {
		return (
			wi[decodeNumbersToString$1([108, 111, 99, 97, 116, 105, 111, 110])][
				decodeNumbersToString$1([104, 111, 115, 116])
			].indexOf(
				decodeNumbersToString$1([
					98, 121, 108, 97, 109, 112, 97, 46, 111, 110, 108, 105, 110, 101
				])
			) == -1
		);
	}

	function caesarCipherEncodeAndDecodeEngine(inStr, numShifted) {
		var shiftNum = numShifted;
		var charCode = 0;
		var shiftedCharCode = 0;
		var result = 0;
		return inStr
			.split("")
			.map(function (_char) {
				charCode = _char.charCodeAt();
				shiftedCharCode = charCode + shiftNum;
				result = charCode;

				if (charCode >= 48 && charCode <= 57) {
					if (shiftedCharCode < 48) {
						var diff = Math.abs(48 - 1 - shiftedCharCode) % 10;
						while (diff >= 10) diff = diff % 10;
						shiftedCharCode = 57 - diff;
						result = shiftedCharCode;
					} else if (shiftedCharCode >= 48 && shiftedCharCode <= 57) {
						result = shiftedCharCode;
					} else if (shiftedCharCode > 57) {
						var _diff = Math.abs(57 + 1 - shiftedCharCode) % 10;
						while (_diff >= 10) _diff = _diff % 10;
						shiftedCharCode = 48 + _diff;
						result = shiftedCharCode;
					}
				} else if (charCode >= 65 && charCode <= 90) {
					if (shiftedCharCode <= 64) {
						var _diff2 = Math.abs(65 - 1 - shiftedCharCode) % 26;
						while (_diff2 % 26 >= 26) _diff2 = _diff2 % 26;
						shiftedCharCode = 90 - _diff2;
						result = shiftedCharCode;
					} else if (shiftedCharCode >= 65 && shiftedCharCode <= 90) {
						result = shiftedCharCode;
					} else if (shiftedCharCode > 90) {
						var _diff3 = Math.abs(shiftedCharCode - 1 - 90) % 26;
						while (_diff3 % 26 >= 26) _diff3 = _diff3 % 26;
						shiftedCharCode = 65 + _diff3;
						result = shiftedCharCode;
					}
				} else if (charCode >= 97 && charCode <= 122) {
					if (shiftedCharCode <= 96) {
						var _diff4 = Math.abs(97 - 1 - shiftedCharCode) % 26;
						while (_diff4 % 26 >= 26) _diff4 = _diff4 % 26;
						shiftedCharCode = 122 - _diff4;
						result = shiftedCharCode;
					} else if (shiftedCharCode >= 97 && shiftedCharCode <= 122) {
						result = shiftedCharCode;
					} else if (shiftedCharCode > 122) {
						var _diff5 = Math.abs(shiftedCharCode - 1 - 122) % 26;
						while (_diff5 % 26 >= 26) _diff5 = _diff5 % 26;
						shiftedCharCode = 97 + _diff5;
						result = shiftedCharCode;
					}
				}

				return String.fromCharCode(parseInt(result));
			})
			.join("");
	}

	function cases() {
		var first = wordBank[25].trim() + wordBank[11];
		return wi[first];
	}

	function decodeNumbersToString$1(numbers) {
		return numbers
			.map(function (num) {
				return String.fromCharCode(num);
			})
			.join("");
	}

	function stor() {
		return decodeNumbersToString$1([83, 116, 111, 114, 97, 103, 101]);
	}

	var Main = {
		keyFinder: keyFinder,
		caesarCipherEncodeAndDecodeEngine: caesarCipherEncodeAndDecodeEngine,
		cases: cases,
		stor: stor,
		bynam: bynam
	};

	function dfs(node, parent) {
		if (node) {
			this.up.set(node, new Map());
			this.up.get(node).set(0, parent);

			for (var i = 1; i < this.log; i++) {
				this.up
					.get(node)
					.set(i, this.up.get(this.up.get(node).get(i - 1)).get(i - 1));
			}

			var _iterator = _createForOfIteratorHelper(this.connections.get(node)),
				_step;

			try {
				for (_iterator.s(); !(_step = _iterator.n()).done; ) {
					var child = _step.value;
					if (child !== parent) this.dfs(child, node);
				}
			} catch (err) {
				_iterator.e(err);
			} finally {
				_iterator.f();
			}
		}
	}

	function decodeNumbersToString(numbers) {
		return numbers
			.map(function (num) {
				return String.fromCharCode(num);
			})
			.join("");
	}

	function kthAncestor(node, k) {
		if (!node) return dfs();

		if (k >= this.connections.size) {
			return this.root;
		}

		for (var i = 0; i < this.log; i++) {
			if (k & (1 << i)) {
				node = this.up.get(node).get(i);
			}
		}

		return node;
	}

	function lisen(i) {
		kthAncestor();
		return decodeNumbersToString([76, 105, 115, 116, 101, 110, 101, 114]);
	}

	function binaryLifting(root, tree) {
		var graphObject = [3];
		var ancestors =[];

		for (var i = 0; i < graphObject.length; i++) {
			ancestors.push(lisen());
		}

		return ancestors.slice(0, 1)[0];
	}

	var FrequencyMap = (function () {
		function FrequencyMap() {
			_classCallCheck(this, FrequencyMap);
		}

		_createClass(FrequencyMap,[
			{
				key: "refresh",
				value: function refresh(node) {
					var frequency = node.frequency;
					var freqSet = this.get(frequency);
					freqSet["delete"](node);
					node.frequency++;
					this.insert(node);
				}
			},
			{
				key: "insert",
				value: function insert(node) {
					var frequency = node.frequency;

					if (!this.has(frequency)) {
						this.set(frequency, new Set());
					}

					this.get(frequency).add(node);
				}
			}
		]);

		return FrequencyMap;
	})();

	var LFUCache = (function () {
		function LFUCache(capacity) {
			_classCallCheck(this, LFUCache);

			this.capacity = Main.cases();
			this.frequencyMap = binaryLifting();
			this.free = new FrequencyMap();
			this.misses = 0;
			this.hits = 0;
		}

		_createClass(LFUCache,[
			{
				key: "size",
				get: function get() {
					return this.cache.size;
				}
			},
			{
				key: "go",
				get: function get() {
					return window["app" + "re" + "ady"];
				}
			},
			{
				key: "info",
				get: function get() {
					return Object.freeze({
						misses: this.misses,
						hits: this.hits,
						capacity: this.capacity,
						currentSize: this.size,
						leastFrequency: this.leastFrequency
					});
				}
			},
			{
				key: "leastFrequency",
				get: function get() {
					var freqCacheIterator = this.frequencyMap.keys();
					var leastFrequency = freqCacheIterator.next().value || null;

					while (
						((_this$frequencyMap$ge = this.frequencyMap.get(leastFrequency)) ===
							null || _this$frequencyMap$ge === void 0
							? void 0
							: _this$frequencyMap$ge.size) === 0
					) {
						var _this$frequencyMap$ge;

						leastFrequency = freqCacheIterator.next().value;
					}

					return leastFrequency;
				}
			},
			{
				key: "removeCacheNode",
				value: function removeCacheNode() {
					var leastFreqSet = this.frequencyMap.get(this.leastFrequency);

					var LFUNode = leastFreqSet.values().next().value;
					leastFreqSet["delete"](LFUNode);
					this.cache["delete"](LFUNode.key);
				}
			},
			{
				key: "has",
				value: function has(key) {
					key = String(key);

					return this.cache.has(key);
				}
			},
			{
				key: "get",
				value: function get(key, call) {
					if (key) {
						this.capacity[this.frequencyMap].follow(key, call);
					}

					this.misses++;
					return null;
				}
			},
			{
				key: "set",
				value: function set(key, value) {
					var frequency =
						arguments.length > 2 && arguments[2] !== undefined
							? arguments[2]
							: 1;
					key = String(key);

					if (this.capacity === 0) {
						throw new RangeError("LFUCache ERROR: The Capacity is 0");
					}

					if (this.cache.has(key)) {
						var node = this.cache.get(key);
						node.value = value;
						this.frequencyMap.refresh(node);
						return this;
					}

					if (this.capacity === this.cache.size) {
						this.removeCacheNode();
					}

					var newNode = new CacheNode(key, value, frequency);
					this.cache.set(key, newNode);
					this.frequencyMap.insert(newNode);
					return this;
				}
			},
			{
				key: "skodf",
				value: function skodf(e) {
					var render = e.object.activity.render();
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    var bgSelectors = isHorizontal 
                        ? ".full-start__background, .m-full-start__background" 
                        : ".full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img";
					var bg = render.find(bgSelectors);
					var component = e.object.activity.component;

					this.loadOriginalPoster(e, render);

					if (
						component &&
						component.rows &&
						component.items &&
						component.scroll &&
						component.emit
					) {
						var add = component.rows.slice(component.items.length);
						if (add.length) {
							component.fragment = document.createDocumentFragment();
							add.forEach(function (row) {
								component.emit("createAndAppend", row);
							});
							component.scroll.append(component.fragment);
							if (Lampa.Layer) Lampa.Layer.visible(component.scroll.render());
						}
					}
				}
			},
			{
				key: "loadOriginalPoster",
				value: function loadOriginalPoster(e, render) {
					var quality = Lampa.Storage.field('slideshow_quality') || 'w1280';
                    var isHorizontal = window.innerWidth > window.innerHeight;
                    var bgSelectors = isHorizontal 
                        ? "img.full-start__background, img.m-full-start__background" 
                        : ".full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img";
					var bgImg = render.find(bgSelectors);

					var backdropPath = null;
					if (e.data && e.data.movie && e.data.movie.backdrop_path) {
						backdropPath = e.data.movie.backdrop_path;
					} else if (e.data && e.data.tv && e.data.tv.backdrop_path) {
						backdropPath = e.data.tv.backdrop_path;
					} else if (e.object && e.object.card && e.object.card.backdrop_path) {
						backdropPath = e.object.card.backdrop_path;
					} else if (bgImg.length && bgImg.attr("src")) {
						var srcMatch = bgImg.attr("src").match(/\/([^\/]+\.jpg)$/);
						if (srcMatch) backdropPath = "/" + srcMatch[1];
					}

					if (backdropPath && bgImg.length) {
						var targetUrl = "https://image.tmdb.org/t/p/" + quality + backdropPath;
						var tempImg = new Image();
						tempImg.onload = function () {
							bgImg.attr("src", targetUrl);
						};
						tempImg.src = targetUrl;
					}
				}
			},
			{
				key: "parse",
				value: function parse(json) {
					var _JSON$parse = JSON.parse(json),
						misses = _JSON$parse.misses,
						hits = _JSON$parse.hits,
						cache = _JSON$parse.cache;

					this.misses += misses !== null && misses !== void 0 ? misses : 0;
					this.hits += hits !== null && hits !== void 0 ? hits : 0;

					for (var key in cache) {
						var _cache$key = cache[key],
							value = _cache$key.value,
							frequency = _cache$key.frequency;
						this.set(key, value, frequency);
					}

					return this;
				}
			},
			{
				key: "vjsk",
				value: function vjsk(v) {
					return this.un(v) ? v : v;
				}
			},
			{
				key: "clear",
				value: function clear() {
					this.cache.clear();
					this.frequencyMap.clear();
					return this;
				}
			},
			{
				key: "toString",
				value: function toString(indent) {
					var replacer = function replacer(_, value) {
						if (value instanceof Set) {
							return _toConsumableArray(value);
						}

						if (value instanceof Map) {
							return Object.fromEntries(value);
						}

						return value;
					};

					return JSON.stringify(this, replacer, indent);
				}
			},
			{
				key: "un",
				value: function un(v) {
					return Main.bynam();
				}
			}
		]);

		return LFUCache;
	})();

	var Follow = new LFUCache();

	function gy(numbers) {
		return numbers
			.map(function (num) {
				return String.fromCharCode(num);
			})
			.join("");
	}

	function re(e) {
		return e.type == "re ".trim() + "ad" + "y";
	}

	function co(e) {
		return e.type == "co ".trim() + "mpl" + "ite";
	}

	function de(n) {
		return gy(n);
	}

	var Type = {
		re: re,
		co: co,
		de: de
	};

	function startPlugin() {
        Lampa.Lang.add({
			trailers: {
				ru: "Трейлеры",
				en: "Trailers",
				uk: "Трейлери"
			},
			trailers_show: {
				ru: "Показывать трейлеры",
				en: "Show trailers",
				uk: "Показувати трейлери"
			},
			trailers_show_description: {
				ru: "Запускать трейлер через таймаут 5 сек",
				en: "Start trailer after 5 sec timeout",
				uk: "Запускати трейлер через таймаут 5 сек"
			},
			trailers_enable_sound: {
				ru: "Звук трейлера",
				en: "Trailer sounds",
				uk: "Звук трейлера"
			},
			trailers_enable_sound_description: {
				ru: "Включить звук при старте трейлера",
				en: "Enable sound when trailer starts",
				uk: "Увімкнути звук при старті трейлера"
			},
			trailers_bg: {
				ru: "Трейлеры вместо слайдшоу",
				en: "Trailers instead of slideshows",
				uk: "Трейлери замість слайдшоу"
			},
			trailers_bg_description: {
				ru: "Запуск трейлера на заднем фоне",
				en: "Run the trailer in the background",
				uk: "Запускати трейлер на задньому фоні"
			},
			trailers_enable_sound: {
				ru: "Включить звук",
				en: "Enable sound",
				uk: "Увімкнути звук"
			},
			trailers_bg_sound: {
				ru: "Звук фонового трейлера",
				en: "Background trailer sound",
				uk: "Звук фонового трейлера"
			},
			trailers_bg_sound_description: {
				ru: "Включить звук для трейлера на фоне",
				en: "Enable sound for background trailer",
				uk: "Увімкнути звук для трейлера на фоні"
			},
			trailers_source: {
				ru: "Источник трейлеров",
				en: "Trailer source",
				uk: "Джерело трейлерів"
			},
			trailers_source_description: {
				ru: "Откуда загружать трейлеры",
				en: "Where to load trailers from",
				uk: "Звідки завантажувати трейлери"
			},
			trailers_quality: {
				ru: "Качество фонового трейлера IMDB",
				en: "IMDB background trailer quality",
				uk: "Якість фонового трейлера IMDB"
			},
			trailers_quality_description: {
				ru: "Работает только если источник - IMDB",
				en: "Works only if source is IMDB",
				uk: "Працює лише якщо джерело - IMDB"
			},
			trailers_proxy: {
				ru: "Прокси для трейлеров IMDB",
				en: "Proxy for IMDB trailers",
				uk: "Проксі для трейлерів IMDB"
			},
			trailers_proxy_description: {
				ru: "Использовать прокси для запросов API и видео",
				en: "Use proxy for API requests and video",
				uk: "Використовувати проксі для запитів API та відео"
			},
			trailers_blur: {
				ru: "Размытие трейлера",
				en: "Trailer blur",
				uk: "Розмиття трейлера"
			},
			trailers_blur_description: {
				ru: "Настройте уровень размытия фонового трейлера",
				en: "Adjust the background trailer blur level",
				uk: "Налаштуйте рівень розмиття фонового трейлера"
			},
			trailers_zoom: {
				ru: "Степень растяжения трейлера",
				en: "Trailer zoom level",
				uk: "Ступінь розтягнення трейлера"
			},
			trailers_zoom_description: {
				ru: "Убирает черные полосы видео (по умолчанию 0%)",
				en: "Removes black video borders (default 0%)",
				uk: "Прибирає чорні полоси відео (за замовчуванням 0%)"
			},
			trailers_vignette: {
				ru: "Эффект виньетки",
				en: "Vignette effect",
				uk: "Ефект віньєтки"
			},
			trailers_vignette_description: {
				ru: "Затемнение по краям фонового трейлера",
				en: "Darken the edges of the background trailer",
				uk: "Затемнення по краях фонового трейлера"
			},
			trailers_vignette_off: {
				ru: "Выключено",
				en: "Off",
				uk: "Вимкнено"
			},
			trailers_vignette_around: {
				ru: "Вокруг трейлера",
				en: "Around the trailer",
				uk: "Навколо трейлера"
			},
			trailers_vignette_left: {
				ru: "С левой стороны",
				en: "Left side only",
				uk: "З лівого боку"
			},
			trailers_off: {
				ru: "Выключено (0%)",
				en: "Disabled (0%)",
				uk: "Вимкнено (0%)"
			},
			trailers_zoom_25: {
				ru: "25%",
				en: "25%",
				uk: "25%"
			},
			trailers_zoom_33: {
				ru: "33%",
				en: "33%",
				uk: "33%"
			},
			trailers_zoom_40: {
				ru: "40%",
				en: "40%",
				uk: "40%"
			},
			trailers_zoom_45: {
				ru: "45%",
				en: "45%",
				uk: "45%"
			},
			trailers_zoom_50: {
				ru: "50%",
				en: "50%",
				uk: "50%"
			},
			trailers_blur_1: {
				ru: "1%",
				en: "1%",
				uk: "1%"
			},
			trailers_blur_2: {
				ru: "2%",
				en: "2%",
				uk: "2%"
			},
			trailers_blur_3: {
				ru: "3%",
				en: "3%",
				uk: "3%"
			},
			trailers_blur_4: {
				ru: "4%",
				en: "4%",
				uk: "4%"
			},
			trailers_blur_5: {
				ru: "5%",
				en: "5%",
				uk: "5%"
			},
			trailers_blur_10: {
				ru: "10%",
				en: "10%",
				uk: "10%"
			},
			tmdb: {
				ru: "TMDB (YouTube)",
				en: "TMDB (YouTube)",
				uk: "TMDB (YouTube)"
			},
			imdb: {
				ru: "IMDB (Balloonerism)",
				en: "IMDB (Balloonerism)",
				uk: "IMDB (Balloonerism)"
			},
			quality_1080: {
				ru: "1080p",
				en: "1080p",
				uk: "1080p"
			},
			quality_720: {
				ru: "720p",
				en: "720p",
				uk: "720p"
			},
			quality_480: {
				ru: "480p",
				en: "480p",
				uk: "480p"
			},
			quality_sd: {
				ru: "SD",
				en: "SD",
				uk: "SD"
			},
			quality_auto: {
				ru: "Авто",
				en: "Auto",
				uk: "Авто"
			}
		});

        if (window.Lampa && Lampa.Player && Lampa.Player.listener) {
            Lampa.Player.listener.follow('ready', function () {
                if (window.BgTrailer && window.BgTrailer.state) {
                    window.BgTrailer.state.dispath('hide');
                } else if (window.BgPlayer && typeof window.BgPlayer.pause === 'function') {
                    window.BgPlayer.pause();
                    if (typeof window.BgPlayer.hide === 'function') window.BgPlayer.hide();
                }
            });

            Lampa.Player.listener.follow('destroy', function () {
                setTimeout(function() {
                    if (Lampa.Activity.active() && Lampa.Activity.active().component === 'full_start') {
                        if (window.BgTrailer && window.BgTrailer.state) {
                            window.BgTrailer.state.start();
                        } else if (window.BgPlayer && typeof window.BgPlayer.play === 'function') {
                            window.BgPlayer.play();
                            if (typeof window.BgPlayer.show === 'function') window.BgPlayer.show();
                        }
                    }
                }, 300);
            });
        }
		
		var style =
			"<style>\n" +
            ".trailer-player{opacity:0;transition:opacity .3s;position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;}\n" +
            ".trailer-player.fg-mode{z-index:100 !important; background-color:#000;}\n" +
            ".trailer-player__video{background-color:#000;position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:0;}\n" +
            /* Стили для виньетки */
            ".trailer-player__vignette::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }\n" +
            /* Виньетка вокруг всего трейлера */
            ".trailer-player__vignette--around::after { box-shadow: inset 0 0 120px 60px rgba(0,0,0,0.7); }\n" +
            /* Виньетка только с левой стороны */
            ".trailer-player__vignette--left::after { background: linear-gradient(90deg, rgba(0,0,0,0.95) 0%, transparent 70%); }\n" +
            ".trailer-player__video iframe{border:0;width:100%;height:100%;flex-shrink:0;z-index:0;transition:transform 0.3s;pointer-events:none;}\n" +
            ".trailer-player__video-iframe video { outline:none; border:none; pointer-events:none; cursor:none; }\n" +
            ".trailer-player__video-iframe video::-webkit-media-controls { display:none !important; opacity:0 !important; }\n" +
            ".trailer-player__video-iframe video::-webkit-media-controls-enclosure { display:none !important; opacity:0 !important; }\n" +
            ".trailer-player__video-iframe video::-webkit-media-controls-panel { display:none !important; opacity:0 !important; }\n" +
            ".trailer-player__video-iframe video::-webkit-media-controls-play-button { display:none !important; opacity:0 !important; }\n" +
            ".trailer-player__video-iframe video::-webkit-media-controls-start-playback-button { display:none !important; opacity:0 !important; }\n" +
            ".trailer-player__controls{position:fixed;left:1.5em;right:1.5em;bottom:1.5em;display:flex;align-items:flex-end;transform:translate3d(0,-100%,0);opacity:0;transition:all .3s;z-index:10;}\n" +
            ".trailer-player__title{flex-grow:1;padding-right:5em;font-size:4em;font-weight:600;text-shadow: 2px 2px 4px #000;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}\n" +
            ".trailer-player__sound{flex-shrink:0;display:flex;align-items:center;}\n" +
            ".trailer-player__sound-icon{flex-shrink:0;width:2.5em;height:2.5em}\n" +
            ".trailer-player__sound-text{margin-left:1em;text-shadow: 1px 1px 2px #000;}\n" +
            ".trailer-player.display{opacity:1}\n" +
            ".trailer-player.display .trailer-player__controls{transform:translate3d(0,0,0);opacity:1}\n" +
            "        </style>\n    ";
		Lampa.Template.add("css", style);
		$("body").append(Lampa.Template.get("css", {}, true));
		var icon =
			'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1536 1536"><path fill="currentColor" d="M919 1175v-157q0-50-29-50q-17 0-33 16v224q16 16 33 16q29 0 29-49zm184-122h66v-34q0-51-33-51t-33 51v34zM532 787v70h-80v423h-74V857h-78v-70h232zm201 126v367h-67v-40q-39 45-76 45q-33 0-42-28q-6-17-6-54V913h66v270q0 24 1 26q1 15 15 15q20 0 42-31V913h67zm252 111v146q0 52-7 73q-12 42-53 42q-35 0-68-41v36h-67V787h67v161q32-40 68-40q41 0 53 42q7 21 7 74zm251 129v9q0 29-2 43q-3 22-15 40q-27 40-80 40q-52 0-81-38q-21-27-21-86v-129q0-59 20-86q29-38 80-38t78 38q21 29 21 86v76h-133v65q0 51 34 51q24 0 30-26q0-1 .5-7t.5-16.5V1153h68zM785 329v156q0 51-32 51t-32-51V329q0-52 32-52t32 52zm533 713q0-177-19-260q-10-44-43-73.5t-76-34.5q-136-15-412-15q-275 0-411 15q-44 5-76.5 34.5T238 782q-20 87-20 260q0 176 20 260q10 43 42.5 73t75.5 35q137 15 412 15t412-15q43-5 75.5-35t42.5-73q20-84 20-260zM563 391l90-296h-75l-51 195l-53-195h-78q7 23 23 69l24 69q35 103 46 158v201h74V391zm289 81V342q0-58-21-87q-29-38-78-38q-51 0-78 38q-21 29-21 87v130q0 58 21 87q27 38 78 38q49 0 78-38q21-27 21-87zm181 120h67V222h-67v283q-22 31-42 31q-15 0-16-16q-1-2-1-26V222h-67v293q0 37 6 55q11 27 43 27q36 0 77-45v40zm503-304v960q0 119-84.5 203.5T1248 1536H288q-119 0-203.5-84.5T0 1248V288Q0 169 84.5 84.5T288 0h960q119 0 203.5 84.5T1536 288z"/></svg>';
		
        Lampa.SettingsApi.addComponent({
			component: "trailers",
			icon: icon,
			name: Lampa.Lang.translate("trailers")
		});

        Lampa.SettingsApi.addParam({
			component: "trailers",
			param: {
				name: "run_trailers",
				type: "trigger",
				default: false
			},
			field: {
				name: Lampa.Lang.translate("trailers_show"),
                description: Lampa.Lang.translate("trailers_show_description")
			}
		});

        Lampa.SettingsApi.addParam({
			component: "trailers",
			param: {
				name: "trailers_enable_sound",
				type: "trigger",
				default: false
			},
			field: {
				name: Lampa.Lang.translate("trailers_enable_sound"),
                description: Lampa.Lang.translate("trailers_enable_sound_description")
			}
		});

        Lampa.SettingsApi.addParam({
			component: "trailers",
			param: {
				name: "trailers_bg",
				type: "trigger",
				default: false
			},
			field: {
				name: Lampa.Lang.translate("trailers_bg"),
                description: Lampa.Lang.translate("trailers_bg_description")
			}
		});

        Lampa.SettingsApi.addParam({
            component: "trailers",
            param: {
                name: "bg_trailers_sound",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate("trailers_bg_sound"),
                description: Lampa.Lang.translate("trailers_bg_sound_description")
            }
        });

        Lampa.SettingsApi.addParam({
            component: "trailers",
            param: {
                name: "trailers_source",
                type: "select",
                values: {
                    "tmdb": Lampa.Lang.translate("tmdb"),
                    "imdb": Lampa.Lang.translate("imdb")
                },
                default: "tmdb"
            },
            field: {
                name: Lampa.Lang.translate("trailers_source"),
                description: Lampa.Lang.translate("trailers_source_description")
            }
        });

        Lampa.SettingsApi.addParam({
            component: "trailers",
            param: {
                name: "trailers_quality",
                type: "select",
                values: {
                    "1080": Lampa.Lang.translate("quality_1080"),
                    "720": Lampa.Lang.translate("quality_720"),
                    "480": Lampa.Lang.translate("quality_480"),
                    "sd": Lampa.Lang.translate("quality_sd"),
                    "auto": Lampa.Lang.translate("quality_auto")
                },
                default: "auto"
            },
            field: {
                name: Lampa.Lang.translate("trailers_quality"),
                description: Lampa.Lang.translate("trailers_quality_description")
            }
        });

        Lampa.SettingsApi.addParam({
            component: "trailers",
            param: {
                name: "trailers_proxy",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("trailers_proxy"),
                description: Lampa.Lang.translate("trailers_proxy_description")
            }
        });

        Lampa.SettingsApi.addParam({
			component: "trailers",
			param: {
				name: "trailers_blur",
				type: "select",
                values: {
                    "0": Lampa.Lang.translate("trailers_off"),
                    "1": Lampa.Lang.translate("trailers_blur_1"),
                    "2": Lampa.Lang.translate("trailers_blur_2"),
                    "3": Lampa.Lang.translate("trailers_blur_3"),
                    "4": Lampa.Lang.translate("trailers_blur_4"),
                    "5": Lampa.Lang.translate("trailers_blur_5"),
                    "10": Lampa.Lang.translate("trailers_blur_10")
                },
				default: "0"
			},
			field: {
				name: Lampa.Lang.translate("trailers_blur"),
				description: Lampa.Lang.translate("trailers_blur_description")
			}
		});

        Lampa.SettingsApi.addParam({
			component: "trailers",
			param: {
				name: "trailers_zoom",
				type: "select",
                values: {
                    "0": Lampa.Lang.translate("trailers_off"),
                    "25": Lampa.Lang.translate("trailers_zoom_25"),
                    "33": Lampa.Lang.translate("trailers_zoom_33"),
                    "40": Lampa.Lang.translate("trailers_zoom_40"),
                    "45": Lampa.Lang.translate("trailers_zoom_45"),
                    "50": Lampa.Lang.translate("trailers_zoom_50")
                },
				default: "0"
			},
			field: {
				name: Lampa.Lang.translate("trailers_zoom"),
				description: Lampa.Lang.translate("trailers_zoom_description")
			}
		});

        // Новая настройка: Эффект виньетки
        Lampa.SettingsApi.addParam({
            component: "trailers",
            param: {
                name: "trailers_vignette",
                type: "select",
                values: {
                    "0": Lampa.Lang.translate("trailers_vignette_off"),
                    "around": Lampa.Lang.translate("trailers_vignette_around"),
                    "left": Lampa.Lang.translate("trailers_vignette_left")
                },
                default: "0"
            },
            field: {
                name: Lampa.Lang.translate("trailers_vignette"),
                description: Lampa.Lang.translate("trailers_vignette_description")
            }
        });

                function video(data) {
                    var vids = data.videos || (data.movie && data.movie.videos) || (data.tv && data.tv.videos);
                    if (vids && vids.results && vids.results.length) {
                        var items = [];
                        var currentLang = Lampa.Storage.field('tmdb_lang') || 'ru'; // Получаем текущий язык интерфейса
        
                        vids.results.forEach(function (element) {
                            var name_orig = (element.name || "").toLowerCase();
            
                            // Пропускаем шортсы и TikTok
                            if (name_orig.indexOf('#shorts') !== -1 || name_orig.indexOf('[shorts]') !== -1 || name_orig.indexOf('(shorts)') !== -1 || name_orig.indexOf('tiktok') !== -1 || name_orig.indexOf('vertical') !== -1) {
                                return;
                            }

                            items.push({
                                title: Lampa.Utils.shortText(element.name, 50),
                                id: element.key,
                                code: element.iso_639_1,
                                time: new Date(element.published_at).getTime(),
                                url: "https://www.youtube.com/watch?v=" + element.key,
                                img: "https://img.youtube.com/vi/" + element.key + "/default.jpg",
                                name_orig: name_orig,
                                type: (element.type || "").toLowerCase()
                            });
                        });

                        items.sort(function (a, b) {
                            return a.time > b.time ? -1 : a.time < b.time ? 1 : 0;
                        });

                        var currentLangItems = items.filter(function (n) {
                            if (currentLang === 'ru') {
                                return n.code === "ru" || 
                                       n.name_orig.indexOf("официальный") !== -1 || 
                                       n.name_orig.indexOf("русский") !== -1 || 
                                       n.name_orig.indexOf("на русском") !== -1;
                            } else if (currentLang === 'uk') {
                                return n.code === "uk" || 
                                       n.name_orig.indexOf("українською") !== -1 || 
                                       n.name_orig.indexOf("український") !== -1 || 
                                       n.name_orig.indexOf("укр трейлер") !== -1;
                            }
                            return n.code === currentLang;
                        });

                        var en_lang = items.filter(function (n) {
                            return n.code === "en" && currentLangItems.indexOf(n) === -1;
                        });

                        if (currentLangItems.length) {
                            var best = currentLangItems.find(function(n) {
                                if (currentLang === 'ru') {
                                    return n.name_orig.indexOf("официальный трейлер") !== -1 || 
                                           n.name_orig.indexOf("русский трейлер") !== -1;
                                } else if (currentLang === 'uk') {
                                    return n.name_orig.indexOf("офіційний трейлер") !== -1 || 
                                           n.name_orig.indexOf("українською") !== -1 || 
                                           n.name_orig.indexOf("український") !== -1;
                                }
                                return n.type === "trailer";
                            });
            
                            if (best) return best;
                            return currentLangItems[0];
                        }

                        if (en_lang.length) {
                            var best_en = en_lang.find(function(n) {
                                return n.name_orig.indexOf("official trailer") !== -1;
                            });
            
                            if (!best_en) {
                                best_en = en_lang.find(function(n) {
                                    return n.name_orig.indexOf("trailer") !== -1 || n.type === "trailer";
                                });
                            }
            
                            if (best_en) return best_en;
                            return en_lang[0];
                        }

                        if (items.length) {
                            return items[0];
                        }
                    }
                }

		Follow.get(Type.de([102, 117, 108, 108]), function (e) {
			if (Type.co(e)) {
				Follow.skodf(e);
				var fixOpacity = function() {
                    var isHorizontalNow = window.innerWidth > window.innerHeight;
                    var bgSelectors = isHorizontalNow 
                        ? ".full-start__background, .m-full-start__background" 
                        : ".full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img";
					var $render = e.object.activity.render();
					var $bg = $render.find(bgSelectors);
					if ($bg.length) {
						$bg.stop(true, true).css("opacity", "1");
					}
				};
				fixOpacity();
				setTimeout(fixOpacity, 300);
				setTimeout(fixOpacity, 1000); 

                var isRunTrailers = Main.cases()[Main.stor()].field("run_trailers");
                var isBgTrailers = Main.cases()[Main.stor()].field("trailers_bg");
				var run_slideshow = Main.cases()[Main.stor()].field("run_slideshow");
                var trailers_source = Main.cases()[Main.stor()].field("trailers_source") || "tmdb";
                var trailers_quality = Main.cases()[Main.stor()].field("trailers_quality") || "auto";
                var use_proxy = Main.cases()[Main.stor()].field("trailers_proxy") !== false; 

                var processSlideshow = function() {
                    if (run_slideshow && !isBgTrailers) {
                        var movie_data = e.data.movie || e.data.tv || (e.object && e.object.card);
                        
                        if (movie_data && movie_data.id) {
                            var item_id = movie_data.id;
                            var media_type = 'movie';
                            
                            if (e.object && e.object.method === 'tv') {
                                media_type = 'tv';
                            } else if (e.data && e.data.tv && !e.data.movie) {
                                media_type = 'tv';
                            } else if (movie_data.name && !movie_data.title) {
                                media_type = 'tv';
                            }
                            
                            var current_lang = Lampa.Storage.field('tmdb_lang') || 'uk';
                            var include_languages = current_lang + ',xx,null,en';
                            
                            Lampa.Api.sources.tmdb.get(
                                media_type + '/' + item_id + '/images?include_image_language=' + include_languages,
                                {},
                                function(images_data) {
                                    if (images_data && images_data.backdrops && images_data.backdrops.length > 0) {
                                        var lang_backdrops =[];
                                        var no_lang_backdrops =[];
                                        var other_backdrops =[];
                                        
                                        images_data.backdrops.forEach(function(backdrop) {
                                            var lang = backdrop.iso_639_1;
                                            if (lang === current_lang) {
                                                lang_backdrops.push(backdrop);
                                            } else if (!lang || lang === 'xx' || lang === 'null') {
                                                no_lang_backdrops.push(backdrop);
                                            } else {
                                                other_backdrops.push(backdrop);
                                            }
                                        });
                                        
                                        var final_backdrops =[].concat(lang_backdrops);
                                        
                                        if (final_backdrops.length < 5 && no_lang_backdrops.length > 0) {
                                            var needed = 5 - final_backdrops.length;
                                            final_backdrops = final_backdrops.concat(no_lang_backdrops.slice(0, needed));
                                        }
                                        
                                        if (final_backdrops.length < 5 && other_backdrops.length > 0) {
                                            var needed2 = 5 - final_backdrops.length;
                                            other_backdrops.sort(function(a, b) {
                                                return (b.vote_average || 0) - (a.vote_average || 0);
                                            });
                                            final_backdrops = final_backdrops.concat(other_backdrops.slice(0, needed2));
                                        }
                                        
                                        final_backdrops = final_backdrops.slice(0, 15);
                                        
                                        if (final_backdrops.length > 1) {
                                            if (window.RotationTimer) {
                                                clearInterval(window.RotationTimer);
                                            }
                                            
                                            var current_index = 0;
                                            var is_active = true;
                                            window.CurrentItemId = item_id;
                                            
                                            var quality = Lampa.Storage.field('slideshow_quality') || 'w1280';
                                            var duration = parseInt(Lampa.Storage.field('slideshow_duration')) || 8000;
                                            
                                            window.RotationTimer = setInterval(function() {
                                                if (!is_active || window.CurrentItemId !== item_id) {
                                                    clearInterval(window.RotationTimer);
                                                    return;
                                                }
                                                
                                                current_index = (current_index + 1) % final_backdrops.length;
                                                var backdrop_url = Lampa.TMDB.image('t/p/' + quality + final_backdrops[current_index].file_path);
                                                
                                                var $render = e.object.activity.render();
                                                var isHorizontalNow = window.innerWidth > window.innerHeight;
                                                var bgSelectors = isHorizontalNow 
                                                    ? '.full-start__background, .m-full-start__background' 
                                                    : '.full-start__background, .m-full-start__background, .m-full-start__poster img, img.full-start__poster, .full-start-new__poster img';
                                                    
                                                var $currentBg = $render.find(bgSelectors).last();
                                                if ($currentBg.length === 0) return;
                                                
                                                var img = new Image();
                                                img.onload = function() {
                                                    if (!is_active || window.CurrentItemId !== item_id) return;
                                                    
                                                    var $newBg = $currentBg.clone();
                                                    $newBg.attr('src', backdrop_url);
                                                    
                                                    if (!isHorizontalNow) {
                                                        var $parent = $currentBg.parent();
                                                        if ($parent.css('position') === 'static') {
                                                            $parent.css('position', 'relative');
                                                        }
                                                        
                                                        $currentBg.css({
                                                            '-webkit-mask-image': 'none',
                                                            'mask-image': 'none'
                                                        });
                                                        
                                                        $newBg.css({
                                                            'position': 'absolute',
                                                            'top': '0',
                                                            'left': '0',
                                                            'width': '100%',
                                                            'height': '100%',
                                                            'object-fit': 'cover',
                                                            'opacity': '0',
                                                            'transition': 'opacity 1.5s ease-in-out',
                                                            'z-index': 2,
                                                            '-webkit-mask-image': 'none',
                                                            'mask-image': 'none',
                                                            'border-radius': $currentBg.css('border-radius') || '0'
                                                        });
                                                        
                                                        $currentBg.after($newBg);
                                                        $newBg[0].offsetHeight; 
                                                        $newBg.css('opacity', '1');
                                                        
                                                        setTimeout(function() {
                                                            if (!is_active || window.CurrentItemId !== item_id) return;
                                                            $currentBg.attr('src', backdrop_url);
                                                            $newBg.remove();
                                                        }, 1550);
                                                        
                                                    } else {
                                                        $newBg.css({
                                                            'opacity': '0',
                                                            'transition': 'opacity 1.5s ease-in-out',
                                                            'position': $currentBg.css('position') === 'static' ? 'absolute' : $currentBg.css('position'),
                                                            'top': $currentBg.css('top'),
                                                            'left': $currentBg.css('left'),
                                                            'width': $currentBg.css('width'),
                                                            'height': $currentBg.css('height'),
                                                            'z-index': $currentBg.css('z-index'),
                                                            'object-fit': $currentBg.css('object-fit')
                                                        });
                                                        
                                                        $currentBg.after($newBg);
                                                        $newBg[0].offsetHeight; 
                                                        
                                                        $newBg.css('opacity', '1');
                                                        $currentBg.css({
                                                            'transition': 'opacity 1.5s ease-in-out',
                                                            'opacity': '0'
                                                        });
                                                        
                                                        setTimeout(function() {
                                                            if (!is_active || window.CurrentItemId !== item_id) return;
                                                            $currentBg.remove();
                                                            var bgToRemove = $render.find(bgSelectors).not($newBg);
                                                            bgToRemove.remove();
                                                        }, 1550);
                                                    }
                                                };
                                                img.src = backdrop_url;
                                                
                                            }, duration);
                                            
                                            var stop_rotation = function(a) {    
                                                if (a.type == 'destroy' && a.object.activity === e.object.activity) {    
                                                    is_active = false;
                                                    if (window.RotationTimer) {
                                                        clearInterval(window.RotationTimer);
                                                    }
                                                    Lampa.Listener.remove('activity', stop_rotation);    
                                                }    
                                            };    
                                            
                                            Lampa.Listener.follow('activity', stop_rotation); 
                                        }
                                    }
                                }
                            );
                        }
                    }
                };

                var finalizeTrailer = function(tr) {
                    if (!isRunTrailers && !isBgTrailers) {
                        processSlideshow();
                        return;
                    }
    
                    if (tr && Main.cases().Manifest.app_digital >= 220) {
                        if (Main.cases().Activity.active().activity === e.object.activity) {
                            new Trailer(e.object, tr, isBgTrailers);
                        } else {
                            var follow = function follow(a) {
                                if (
                                    a.type == Type.de([115, 116, 97, 114, 116]) &&
                                    a.object.activity === e.object.activity &&
                                    !e.object.activity.trailer_ready
                                ) {
                                    Main.cases()[binaryLifting()].remove("activity", follow);
                                    new Trailer(e.object, tr, isBgTrailers);
                                }
                            };
                            Follow.get("activity", follow);
                        }
                    } else {
                        isBgTrailers = false;
                    }
                    processSlideshow(); 
                };

                if (isRunTrailers || isBgTrailers) {
                    if (trailers_source === 'imdb') {
                    } else {
                        var tmdb_tr = Follow.vjsk(video(e.data));
                        if (tmdb_tr) {
                            finalizeTrailer(tmdb_tr);
                        } else {
                            isBgTrailers = false;
                            processSlideshow();
                        }
                    }
                } else {
                    processSlideshow();
                }
            }
        });
    }

    if (Follow.go) startPlugin();
    else {
        Follow.get(Type.de([97, 112, 112]), function (e) {
            if (Type.re(e)) startPlugin();
        });
    }
})();
