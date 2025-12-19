(function () {
  'use strict';

  Lampa.Platform.tv();
  if (Lampa.Manifest.app_digital >= 300) {
    (function () {
      var _0x151567 = function () {
        var _0x4fe004 = true;
        return function (_0x20d884, _0x989854) {
          var _0x2592bc = _0x4fe004 ? function () {
            if (_0x989854) {
              var _0x7113ff = _0x989854.apply(_0x20d884, arguments);
              _0x989854 = null;
              return _0x7113ff;
            }
          } : function () {};
          _0x4fe004 = false;
          return _0x2592bc;
        };
      }();
      'use strict';
      if (typeof Lampa === "undefined") {
        return;
      }
      function _0x24b4bd() {
        var _0x4feb34 = _0x151567(this, function () {
          var _0x5128ac = function () {
            var _0x4f96d8;
            try {
              _0x4f96d8 = Function("return (function() {}.constructor(\"return this\")( ));")();
            } catch (_0xed5f30) {
              _0x4f96d8 = window;
            }
            return _0x4f96d8;
          };
          var _0x136e7e = _0x5128ac();
          var _0x515ae9 = _0x136e7e.console = _0x136e7e.console || {};
          var _0x139ad7 = ["log", "warn", "info", "error", "exception", 'table', "trace"];
          for (var _0x4bb809 = 0x0; _0x4bb809 < _0x139ad7.length; _0x4bb809++) {
            var _0x537c51 = _0x151567.constructor.prototype.bind(_0x151567);
            var _0x52269a = _0x139ad7[_0x4bb809];
            var _0x37d851 = _0x515ae9[_0x52269a] || _0x537c51;
            _0x537c51.__proto__ = _0x151567.bind(_0x151567);
            _0x537c51.toString = _0x37d851.toString.bind(_0x37d851);
            _0x515ae9[_0x52269a] = _0x537c51;
          }
        });
        _0x4feb34();
        if (!Lampa.Maker || !Lampa.Maker.map || !Lampa.Utils) {
          return;
        }
        if (window.plugin_interface_ready_v3) {
          return;
        }
        window.plugin_interface_ready_v3 = true;
        _0x461c12();
        _0x161409();
        var _0x5dc71b = Lampa.Maker.map("Main");
        if (!_0x5dc71b || !_0x5dc71b.Items || !_0x5dc71b.Create) {
          return;
        }
        _0x2b72a3(_0x5dc71b.Items, "onInit", function (_0x588aa8, _0x23e1a3) {
          if (_0x588aa8) {
            _0x588aa8.apply(this, _0x23e1a3);
          }
          this.__newInterfaceEnabled = _0x2684ad(this && this.object);
        });
        _0x2b72a3(_0x5dc71b.Create, "onCreate", function (_0x270fcf, _0x37784c) {
          if (_0x270fcf) {
            _0x270fcf.apply(this, _0x37784c);
          }
          if (!this.__newInterfaceEnabled) {
            return;
          }
          var _0x20462d = _0x2b024f(this);
          _0x20462d.attach();
        });
        _0x2b72a3(_0x5dc71b.Create, 'onCreateAndAppend', function (_0x6bc25e, _0x3c16ed) {
          var _0x1f6770 = _0x3c16ed && _0x3c16ed[0x0];
          if (this.__newInterfaceEnabled && _0x1f6770) {
            _0x3e0908(_0x1f6770);
          }
          return _0x6bc25e ? _0x6bc25e.apply(this, _0x3c16ed) : undefined;
        });
        _0x2b72a3(_0x5dc71b.Items, "onAppend", function (_0x445413, _0xcb6008) {
          if (_0x445413) {
            _0x445413.apply(this, _0xcb6008);
          }
          if (!this.__newInterfaceEnabled) {
            return;
          }
          var _0x1cd954 = _0xcb6008 && _0xcb6008[0x0];
          var _0x167470 = _0xcb6008 && _0xcb6008[0x1];
          if (_0x1cd954 && _0x167470) {
            _0x49292a(this, _0x1cd954, _0x167470);
          }
        });
        _0x2b72a3(_0x5dc71b.Items, 'onDestroy', function (_0x518ca3, _0x58ab58) {
          if (this.__newInterfaceState) {
            this.__newInterfaceState.destroy();
            delete this.__newInterfaceState;
          }
          delete this.__newInterfaceEnabled;
          if (_0x518ca3) {
            _0x518ca3.apply(this, _0x58ab58);
          }
        });
      }
      function _0x2684ad(_0x2d5498) {
        if (!_0x2d5498) {
          return false;
        }
        if (!(_0x2d5498.source === "tmdb" || _0x2d5498.source === 'cub')) {
          return false;
        }
        if (window.innerWidth < 0x2ff) {
          return false;
        }
        if (Lampa.Platform.screen("mobile")) {
          return false;
        }
        if (_0x2d5498.title === "Избранное") {
          return false;
        }
        return true;
      }
      function _0x2b024f(_0x39cc69) {
        if (_0x39cc69.__newInterfaceState) {
          return _0x39cc69.__newInterfaceState;
        }
        var _0x48a821 = _0x1f511d(_0x39cc69);
        _0x39cc69.__newInterfaceState = _0x48a821;
        return _0x48a821;
      }
      function _0x1f511d(_0x141cee) {
        var _0x115afb = new _0x1a834f();
        _0x115afb.create();
        var _0x4b4c4a = document.createElement("img");
        _0x4b4c4a.className = "full-start__background";
        var _0x4c8a52 = {
          'main': _0x141cee,
          'info': _0x115afb,
          'background': _0x4b4c4a,
          'infoElement': null,
          'backgroundTimer': null,
          'backgroundLast': '',
          'attached': false,
          'attach': function () {
            if (this.attached) {
              return;
            }
            var _0x4beee0 = _0x141cee.render(true);
            if (!_0x4beee0) {
              return;
            }
            _0x4beee0.classList.add('new-interface');
            if (!_0x4b4c4a.parentElement) {
              _0x4beee0.insertBefore(_0x4b4c4a, _0x4beee0.firstChild || null);
            }
            var _0x22d5e2 = _0x115afb.render(true);
            this.infoElement = _0x22d5e2;
            if (_0x22d5e2 && _0x22d5e2.parentNode !== _0x4beee0) {
              if (_0x4b4c4a.parentElement === _0x4beee0) {
                _0x4beee0.insertBefore(_0x22d5e2, _0x4b4c4a.nextSibling);
              } else {
                _0x4beee0.insertBefore(_0x22d5e2, _0x4beee0.firstChild || null);
              }
            }
            _0x141cee.scroll.minus(_0x22d5e2);
            this.attached = true;
          },
          'update': function (_0x22736e) {
            if (!_0x22736e) {
              return;
            }
            _0x115afb.update(_0x22736e);
            this.updateBackground(_0x22736e);
          },
          'updateBackground': function (_0x5b04e2) {
            var _0x4fd933 = _0x5b04e2 && _0x5b04e2.backdrop_path ? Lampa.Api.img(_0x5b04e2.backdrop_path, 'w1280') : '';
            if (!_0x4fd933 || _0x4fd933 === this.backgroundLast) {
              return;
            }
            clearTimeout(this.backgroundTimer);
            var _0x1ad857 = this;
            this.backgroundTimer = setTimeout(function () {
              _0x4b4c4a.classList.remove("loaded");
              _0x4b4c4a.onload = function () {
                _0x4b4c4a.classList.add("loaded");
              };
              _0x4b4c4a.onerror = function () {
                _0x4b4c4a.classList.remove("loaded");
              };
              _0x1ad857.backgroundLast = _0x4fd933;
              setTimeout(function () {
                _0x4b4c4a.src = _0x1ad857.backgroundLast;
              }, 0x32);
            }, 0x64);
          },
          'reset': function () {
            _0x115afb.empty();
          },
          'destroy': function () {
            clearTimeout(this.backgroundTimer);
            _0x115afb.destroy();
            var _0x58c054 = _0x141cee.render(true);
            if (_0x58c054) {
              _0x58c054.classList.remove('new-interface');
            }
            if (this.infoElement && this.infoElement.parentNode) {
              this.infoElement.parentNode.removeChild(this.infoElement);
            }
            if (_0x4b4c4a && _0x4b4c4a.parentNode) {
              _0x4b4c4a.parentNode.removeChild(_0x4b4c4a);
            }
            this.attached = false;
          }
        };
        return _0x4c8a52;
      }
      function _0x3e0908(_0x2bc499) {
        if (!_0x2bc499) {
          return;
        }
        if (Array.isArray(_0x2bc499.results)) {
          Lampa.Utils.extendItemsParams(_0x2bc499.results, {
            'style': {
              'name': Lampa.Storage.get("wide_post") !== false ? "wide" : 'small'
            }
          });
        }
      }
      function _0x541f46(_0x3d5fc4, _0x1fd207) {
        if (!_0x1fd207 || _0x1fd207.__newInterfaceCard || typeof _0x1fd207.use !== "function" || !_0x1fd207.data) {
          return;
        }
        _0x1fd207.__newInterfaceCard = true;
        _0x1fd207.params = _0x1fd207.params || {};
        _0x1fd207.params.style = _0x1fd207.params.style || {};
        if (!_0x1fd207.params.style.name) {
          _0x1fd207.params.style.name = Lampa.Storage.get("wide_post") !== false ? "wide" : 'small';
        }
        _0x1fd207.use({
          'onFocus': function () {
            _0x3d5fc4.update(_0x1fd207.data);
          },
          'onHover': function () {
            _0x3d5fc4.update(_0x1fd207.data);
          },
          'onTouch': function () {
            _0x3d5fc4.update(_0x1fd207.data);
          },
          'onDestroy': function () {
            delete _0x1fd207.__newInterfaceCard;
          }
        });
      }
      function _0x5b32f7(_0x143432, _0x16bf30, _0x83d8b3) {
        _0x83d8b3 = _0x83d8b3 || 0x0;
        if (_0x143432 && _0x143432.data) {
          return _0x143432.data;
        }
        if (_0x16bf30 && Array.isArray(_0x16bf30.results)) {
          return _0x16bf30.results[_0x83d8b3] || _0x16bf30.results[0x0];
        }
        return null;
      }
      function _0x5eb285(_0x2267ae) {
        if (!_0x2267ae) {
          return null;
        }
        var _0x240bea = _0x2267ae && _0x2267ae.jquery ? _0x2267ae[0x0] : _0x2267ae;
        while (_0x240bea && !_0x240bea.card_data) {
          _0x240bea = _0x240bea.parentNode;
        }
        return _0x240bea && _0x240bea.card_data ? _0x240bea.card_data : null;
      }
      function _0x5c17e7(_0x41a934) {
        var _0x1f290a = _0x41a934 && typeof _0x41a934.render === "function" ? _0x41a934.render(true) : null;
        if (!_0x1f290a || !_0x1f290a.querySelector) {
          return null;
        }
        var _0x30073f = _0x1f290a.querySelector(".selector.focus") || _0x1f290a.querySelector(".focus");
        return _0x5eb285(_0x30073f);
      }
      function _0x49292a(_0x12e599, _0x95ded4, _0x4ff1ff) {
        if (_0x95ded4.__newInterfaceLine) {
          return;
        }
        _0x95ded4.__newInterfaceLine = true;
        var _0x37cfbf = _0x2b024f(_0x12e599);
        var _0x20d9e8 = function (_0x113fda) {
          _0x541f46(_0x37cfbf, _0x113fda);
        };
        _0x95ded4.use({
          'onInstance': function (_0x299a6f) {
            _0x20d9e8(_0x299a6f);
          },
          'onActive': function (_0x342f2f, _0x5ad40a) {
            var _0x3cb841 = _0x5b32f7(_0x342f2f, _0x5ad40a);
            if (_0x3cb841) {
              _0x37cfbf.update(_0x3cb841);
            }
          },
          'onToggle': function () {
            setTimeout(function () {
              var _0x1d5ce6 = _0x5c17e7(_0x95ded4);
              if (_0x1d5ce6) {
                _0x37cfbf.update(_0x1d5ce6);
              }
            }, 0x20);
          },
          'onMore': function () {
            _0x37cfbf.reset();
          },
          'onDestroy': function () {
            _0x37cfbf.reset();
            delete _0x95ded4.__newInterfaceLine;
          }
        });
        if (Array.isArray(_0x95ded4.items) && _0x95ded4.items.length) {
          _0x95ded4.items.forEach(_0x20d9e8);
        }
        if (_0x95ded4.last) {
          var _0x51be70 = _0x5eb285(_0x95ded4.last);
          if (_0x51be70) {
            _0x37cfbf.update(_0x51be70);
          }
        }
      }
      function _0x2b72a3(_0x5cb62e, _0x3fb48e, _0x5a267a) {
        if (!_0x5cb62e) {
          return;
        }
        var _0x1ddc4b = typeof _0x5cb62e[_0x3fb48e] === "function" ? _0x5cb62e[_0x3fb48e] : null;
        _0x5cb62e[_0x3fb48e] = function () {
          var _0x102faf = Array.prototype.slice.call(arguments);
          return _0x5a267a.call(this, _0x1ddc4b, _0x102faf);
        };
      }
      function _0x461c12() {
        if (_0x461c12.added) {
          return;
        }
        _0x461c12.added = true;
        var _0x1fcc04 = Lampa.Storage.get("wide_post") !== false ? "<style>.new-interface .card.card--wide {    width: 18.3em;}.new-interface .card.card--small {    width: 18.3em;}.new-interface .card--collection:not(.card--wide) {    width: 34.3em !important;}.new-interface .card--collection:not(.card--wide) .card__view {    padding-bottom: 56% !important;}.new-interface-info {    position: relative;    padding: 1.5em;    height: 26em;}.new-interface-info__body {    width: 80%;    padding-top: 1.1em;}.new-interface-info__head {    color: rgba(255, 255, 255, 0.6);    margin-bottom: 1em;    font-size: 1.3em;    min-height: 1em;}.new-interface-info__head span {    color: #fff;}.new-interface-info__title {    font-size: 4em;    font-weight: 600;    margin-bottom: 0.3em;    overflow: hidden;    -o-text-overflow: '.';    text-overflow: '.';    display: -webkit-box;    -webkit-line-clamp: 1;    line-clamp: 1;    -webkit-box-orient: vertical;    margin-left: -0.03em;    line-height: 1.3;}.new-interface-info__details {    margin-bottom: 1.6em;    display: flex;    align-items: center;    flex-wrap: wrap;    min-height: 1.9em;    font-size: 1.3em;}.new-interface-info__split {    margin: 0 1em;    font-size: 0.7em;}.new-interface-info__description {    font-size: 1.4em;    font-weight: 310;    line-height: 1.3;    overflow: hidden;    -o-text-overflow: '.';    text-overflow: '.';    display: -webkit-box;    -webkit-line-clamp: 3;    line-clamp: 3;    -webkit-box-orient: vertical;    width: 65%;}.new-interface .card-more__box {    padding-bottom: 95%;}.new-interface .full-start__background {    height: 108%;    top: -5em;}.new-interface .full-start__rate {    font-size: 1.3em;    margin-right: 0;}.new-interface .card__promo {    display: none;}.new-interface .card.card--wide + .card-more .card-more__box {    padding-bottom: 95%;}.new-interface .card.card--wide .card-watched {    display: none !important;}body.light--version .new-interface-info__body {    width: 69%;    padding-top: 1.5em;}body.light--version .new-interface-info {    height: 25.3em;}body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {    animation: animation-card-focus 0.2s;}body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {    animation: animation-trigger-enter 0.2s forwards;}body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {    animation: animation-card-focus 0.2s;}body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {    animation: animation-trigger-enter 0.2s forwards;}</style>" : "<style>.new-interface .card.card--wide {    width: 18.3em;}.new-interface .card.card--small {    width: 18.3em;}.card .card__age,.card .card__title {    display: none !important;}.new-interface-info {    position: relative;    padding: 1.5em;    height: 17.4em;}.new-interface-info__body {    width: 80%;    padding-top: 0.2em;}.new-interface-info__head {    color: rgba(255, 255, 255, 0.6);    margin-bottom: 0.3em;    font-size: 1.2em;    min-height: 1em;}.new-interface-info__head span {    color: #fff;}.new-interface-info__title {    font-size: 3em;    font-weight: 600;    margin-bottom: 0.2em;    overflow: hidden;    -o-text-overflow: '.';    text-overflow: '.';    display: -webkit-box;    -webkit-line-clamp: 1;    line-clamp: 1;    -webkit-box-orient: vertical;    margin-left: -0.03em;    line-height: 1.3;}.new-interface-info__details {    margin-bottom: 1.6em;    display: flex;    align-items: center;    flex-wrap: wrap;    min-height: 1.9em;    font-size: 1.2em;}.new-interface-info__split {    margin: 0 1em;    font-size: 0.7em;}.new-interface-info__description {    font-size: 1.3em;    font-weight: 310;    line-height: 1.3;    overflow: hidden;    -o-text-overflow: '.';    text-overflow: '.';    display: -webkit-box;    -webkit-line-clamp: 2;    line-clamp: 2;    -webkit-box-orient: vertical;    width: 70%;}.new-interface .card-more__box {    padding-bottom: 150%;}.new-interface .full-start__background {    height: 108%;    top: -5em;}.new-interface .full-start__rate {    font-size: 1.2em;    margin-right: 0;}.new-interface .card__promo {    display: none;}.new-interface .card.card--wide + .card-more .card-more__box {    padding-bottom: 95%;}.new-interface .card.card--wide .card-watched {    display: none !important;}body.light--version .new-interface-info__body {    width: 69%;    padding-top: 1.5em;}body.light--version .new-interface-info {    height: 25.3em;}body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.focus .card__view {    animation: animation-card-focus 0.2s;}body.advanced--animation:not(.no--animation) .new-interface .card.card--wide.animate-trigger-enter .card__view {    animation: animation-trigger-enter 0.2s forwards;}body.advanced--animation:not(.no--animation) .new-interface .card.card--small.focus .card__view {    animation: animation-card-focus 0.2s;}body.advanced--animation:not(.no--animation) .new-interface .card.card--small.animate-trigger-enter .card__view {    animation: animation-trigger-enter 0.2s forwards;}</style>";
        Lampa.Template.add("new_interface_style_v3", _0x1fcc04);
        $('body').append(Lampa.Template.get("new_interface_style_v3", {}, true));
      }
      function _0x1a834f() {
        this.html = null;
        this.timer = null;
        this.network = new Lampa.Reguest();
        this.loaded = {};
        this.currentUrl = null;
      }
      _0x1a834f.prototype.create = function () {
        this.html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
      };
      _0x1a834f.prototype.render = function (_0x4f6117) {
        if (!this.html) {
          this.create();
        }
        return _0x4f6117 ? this.html[0x0] : this.html;
      };
      _0x1a834f.prototype.update = function (_0x254205) {
        if (!_0x254205 || !this.html) {
          return;
        }
        this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
        if (Lampa.Storage.get("logo_card_style") !== false) {
          var _0x2a3ba8 = _0x254205.name ? 'tv' : "movie";
          var _0x4ae993 = Lampa.TMDB.key();
          var _0x46ce7c = Lampa.TMDB.api(_0x2a3ba8 + '/' + _0x254205.id + "/images?api_key=" + _0x4ae993 + "&language=" + Lampa.Storage.get('language'));
          var _0x2c0596 = this;
          $.get(_0x46ce7c, function (_0x274da6) {
            if (_0x274da6.logos && _0x274da6.logos[0x0]) {
              var _0x5ce190 = _0x274da6.logos[0x0].file_path;
              if (_0x5ce190 !== '') {
                if (Lampa.Storage.get("desc") !== false) {
                  _0x2c0596.html.find(".new-interface-info__title").html("<img style=\"margin-top: 0.3em; margin-bottom: 0.1em; max-height: 1.8em; max-width: 6.8em;\" src=\"" + Lampa.TMDB.image("t/p/w500" + _0x5ce190.replace('.svg', ".png")) + "\" />");
                } else {
                  _0x2c0596.html.find(".new-interface-info__title").html("<img style=\"margin-top: 0.3em; margin-bottom: 0.1em; max-height: 2.8em; max-width: 6.8em;\" src=\"" + Lampa.TMDB.image("t/p/w500" + _0x5ce190.replace(".svg", ".png")) + "\" />");
                }
              } else {
                _0x2c0596.html.find(".new-interface-info__title").text(_0x254205.title || _0x254205.name || '');
              }
            } else {
              _0x2c0596.html.find(".new-interface-info__title").text(_0x254205.title || _0x254205.name || '');
            }
          });
        } else {
          this.html.find('.new-interface-info__title').text(_0x254205.title || _0x254205.name || '');
        }
        if (Lampa.Storage.get("desc") !== false) {
          this.html.find(".new-interface-info__description").text(_0x254205.overview || Lampa.Lang.translate("full_notext"));
        }
        Lampa.Background.change(Lampa.Api.img(_0x254205.backdrop_path, 'w200'));
        this.load(_0x254205);
      };
      _0x1a834f.prototype.load = function (_0x5d9094) {
        if (!_0x5d9094 || !_0x5d9094.id) {
          return;
        }
        var _0x33b049 = _0x5d9094.source || "tmdb";
        if (_0x33b049 !== "tmdb" && _0x33b049 !== "cub") {
          return;
        }
        if (!Lampa.TMDB || typeof Lampa.TMDB.api !== "function" || typeof Lampa.TMDB.key !== "function") {
          return;
        }
        var _0x153ecf = _0x5d9094.media_type === 'tv' || _0x5d9094.name ? 'tv' : "movie";
        var _0x25f45e = Lampa.Storage.get("language");
        var _0x351e25 = Lampa.TMDB.api(_0x153ecf + '/' + _0x5d9094.id + '?api_key=' + Lampa.TMDB.key() + "&append_to_response=content_ratings,release_dates&language=" + _0x25f45e);
        this.currentUrl = _0x351e25;
        if (this.loaded[_0x351e25]) {
          this.draw(this.loaded[_0x351e25]);
          return;
        }
        clearTimeout(this.timer);
        var _0x5c778b = this;
        this.timer = setTimeout(function () {
          _0x5c778b.network.clear();
          _0x5c778b.network.timeout(0x1388);
          _0x5c778b.network.silent(_0x351e25, function (_0x56fca3) {
            _0x5c778b.loaded[_0x351e25] = _0x56fca3;
            if (_0x5c778b.currentUrl === _0x351e25) {
              _0x5c778b.draw(_0x56fca3);
            }
          });
        }, 0x12c);
      };
      _0x1a834f.prototype.draw = function (_0x50f4ba) {
        if (!_0x50f4ba || !this.html) {
          return;
        }
        var _0x4dc58a = ((_0x50f4ba.release_date || _0x50f4ba.first_air_date || "0000") + '').slice(0x0, 0x4);
        var _0x241187 = parseFloat((_0x50f4ba.vote_average || 0x0) + '').toFixed(0x1);
        var _0x487729 = [];
        var _0x26e686 = [];
        var _0x3c1a5d = Lampa.Api.sources.tmdb.parseCountries(_0x50f4ba);
        var _0x41fe3b = Lampa.Api.sources.tmdb.parsePG(_0x50f4ba);
        if (_0x4dc58a !== "0000") {
          _0x487729.push("<span>" + _0x4dc58a + "</span>");
        }
        if (_0x3c1a5d.length > 0x0) {
          _0x487729.push(_0x3c1a5d.join(", "));
        }
        if (Lampa.Storage.get("rat") !== false) {
          if (_0x241187 > 0x0) {
            _0x26e686.push("<div class=\"full-start__rate\"><div>" + _0x241187 + '</div><div>TMDB</div></div>');
          }
        }
        if (Lampa.Storage.get("ganr") !== false) {
          if (_0x50f4ba.genres && _0x50f4ba.genres.length > 0x0) {
            _0x26e686.push(_0x50f4ba.genres.map(function (_0x731ee9) {
              return Lampa.Utils.capitalizeFirstLetter(_0x731ee9.name);
            }).join(" | "));
          }
        }
        if (Lampa.Storage.get("vremya") !== false) {
          if (_0x50f4ba.runtime) {
            _0x26e686.push(Lampa.Utils.secondsToTime(_0x50f4ba.runtime * 0x3c, true));
          }
        }
        if (Lampa.Storage.get("seas") !== false) {
          if (_0x50f4ba.number_of_seasons) {
            _0x26e686.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">Сезонов " + _0x50f4ba.number_of_seasons + '</span>');
          }
        }
        if (Lampa.Storage.get('eps') !== false) {
          if (_0x50f4ba.number_of_episodes) {
            _0x26e686.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">Эпизодов " + _0x50f4ba.number_of_episodes + "</span>");
          }
        }
        if (Lampa.Storage.get("year_ogr") !== false) {
          if (_0x41fe3b) {
            _0x26e686.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">" + _0x41fe3b + '</span>');
          }
        }
        if (Lampa.Storage.get('status') !== false) {
          var _0x3d0ce9 = '';
          if (_0x50f4ba.status) {
            switch (_0x50f4ba.status.toLowerCase()) {
              case "released":
                _0x3d0ce9 = "Выпущенный";
                break;
              case "ended":
                _0x3d0ce9 = "Закончен";
                break;
              case "returning series":
                _0x3d0ce9 = "Онгоинг";
                break;
              case 'canceled':
                _0x3d0ce9 = "Отменено";
                break;
              case "post production":
                _0x3d0ce9 = "Скоро";
                break;
              case "planned":
                _0x3d0ce9 = 'Запланировано';
                break;
              case "in production":
                _0x3d0ce9 = "В производстве";
                break;
              default:
                _0x3d0ce9 = _0x50f4ba.status;
                break;
            }
          }
          if (_0x3d0ce9) {
            _0x26e686.push("<span class=\"full-start__status\" style=\"font-size: 0.9em;\">" + _0x3d0ce9 + '</span>');
          }
        }
        this.html.find(".new-interface-info__head").empty().append(_0x487729.join(", "));
        this.html.find(".new-interface-info__details").html(_0x26e686.join("<span class=\"new-interface-info__split\">&#9679;</span>"));
      };
      _0x1a834f.prototype.empty = function () {
        if (!this.html) {
          return;
        }
        this.html.find(".new-interface-info__head,.new-interface-info__details").text("---");
      };
      _0x1a834f.prototype.destroy = function () {
        clearTimeout(this.timer);
        this.network.clear();
        this.loaded = {};
        this.currentUrl = null;
        if (this.html) {
          this.html.remove();
          this.html = null;
        }
      };
      function _0x161409() {
        Lampa.Settings.listener.follow("open", function (_0x2fa2fc) {
          if (_0x2fa2fc.name == 'main') {
            if (Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").length == 0x0) {
              Lampa.SettingsApi.addComponent({
                'component': "style_interface",
                'name': "Стильный интерфейс"
              });
            }
            Lampa.Settings.main().update();
            Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").addClass("hide");
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "interface",
          'param': {
            'name': "style_interface",
            'type': "static",
            'default': true
          },
          'field': {
            'name': "Стильный интерфейс",
            'description': "Настройки элементов"
          },
          'onRender': function (_0x2c50c7) {
            setTimeout(function () {
              $(".settings-param > div:contains(\"Стильный интерфейс\")").parent().insertAfter($("div[data-name=\"interface_size\"]"));
            }, 0x14);
            _0x2c50c7.on("hover:enter", function () {
              Lampa.Settings.create("style_interface");
              Lampa.Controller.enabled().controller.back = function () {
                Lampa.Settings.create("interface");
              };
            });
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "wide_post",
            'type': 'trigger',
            'default': true
          },
          'field': {
            'name': "Широкие постеры"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "logo_card_style",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Логотип вместо названия"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "desc",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать описание"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "status",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать статус фильма/сериала"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': 'style_interface',
          'param': {
            'name': 'seas',
            'type': "trigger",
            'default': false
          },
          'field': {
            'name': "Показывать количество сезонов"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': 'eps',
            'type': "trigger",
            'default': false
          },
          'field': {
            'name': "Показывать количество эпизодов"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "year_ogr",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать возрастное ограничение"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': 'style_interface',
          'param': {
            'name': "vremya",
            'type': 'trigger',
            'default': true
          },
          'field': {
            'name': "Показывать время фильма"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "ganr",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать жанр фильма"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "rat",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать рейтинг фильма"
          }
        });
        var _0x3f46c0 = setInterval(function () {
          if (typeof Lampa !== "undefined") {
            clearInterval(_0x3f46c0);
            if (!Lampa.Storage.get("int_plug", "false")) {
              _0x392062();
            }
          }
        }, 0xc8);
        function _0x392062() {
          Lampa.Storage.set("int_plug", "true");
          Lampa.Storage.set("wide_post", "true");
          Lampa.Storage.set("logo_card_style", "true");
          Lampa.Storage.set("desc", 'true');
          Lampa.Storage.set("status", "true");
          Lampa.Storage.set("seas", "false");
          Lampa.Storage.set("eps", "false");
          Lampa.Storage.set("year_ogr", "true");
          Lampa.Storage.set("vremya", "true");
          Lampa.Storage.set("ganr", "true");
          Lampa.Storage.set("rat", 'true');
        }
      }
      if (!window.plugin_interface_ready_v3) {
        _0x24b4bd();
      }
    })();
  } else {
    (function () {
      'use strict';
      function _0x585d59() {
        var _0x213b60;
        var _0x5534d5;
        var _0x270e7e = new Lampa.Reguest();
        var _0x5454ff = {};
        this.create = function () {
          _0x213b60 = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
        };
        this.update = function (_0x278a47) {
          _0x213b60.find(".new-interface-info__head,.new-interface-info__details").text("---");
          if (Lampa.Storage.get("logo_card_style") !== false) {
            var _0x2f4cdf = _0x278a47.name ? 'tv' : "movie";
            var _0x6d9207 = Lampa.TMDB.key();
            var _0x125a3c = Lampa.TMDB.api(_0x2f4cdf + '/' + _0x278a47.id + "/images?api_key=" + _0x6d9207 + "&language=" + Lampa.Storage.get("language"));
            $.get(_0x125a3c, function (_0xe1bcdd) {
              if (_0xe1bcdd.logos && _0xe1bcdd.logos[0x0]) {
                var _0x1e975d = _0xe1bcdd.logos[0x0].file_path;
                if (_0x1e975d !== '') {
                  if (Lampa.Storage.get('desc') !== false) {
                    _0x213b60.find(".new-interface-info__title").html("<img style=\"margin-top: 0.3em; margin-bottom: 0.1em; max-height: 1.8em; max-width: 6.8em;\" src=\"" + Lampa.TMDB.image('t/p/w500' + _0x1e975d.replace(".svg", ".png")) + "\" />");
                  } else {
                    _0x213b60.find(".new-interface-info__title").html("<img style=\"margin-top: 0.3em; margin-bottom: 0.1em; max-height: 2.8em; max-width: 6.8em;\" src=\"" + Lampa.TMDB.image('t/p/w500' + _0x1e975d.replace(".svg", '.png')) + "\" />");
                  }
                } else {
                  _0x213b60.find(".new-interface-info__title").text(_0x278a47.title);
                }
              } else {
                _0x213b60.find('.new-interface-info__title').text(_0x278a47.title);
              }
            });
          } else {
            _0x213b60.find(".new-interface-info__title").text(_0x278a47.title);
          }
          if (Lampa.Storage.get("desc") !== false) {
            _0x213b60.find(".new-interface-info__description").text(_0x278a47.overview || Lampa.Lang.translate('full_notext'));
          }
          Lampa.Background.change(Lampa.Api.img(_0x278a47.backdrop_path, 'w200'));
          this.load(_0x278a47);
        };
        this.draw = function (_0x1aa94c) {
          var _0x1704fb = ((_0x1aa94c.release_date || _0x1aa94c.first_air_date || "0000") + '').slice(0x0, 0x4);
          var _0x4e33a3 = parseFloat((_0x1aa94c.vote_average || 0x0) + '').toFixed(0x1);
          var _0x4f8049 = [];
          var _0x2cc78d = [];
          var _0x21167d = Lampa.Api.sources.tmdb.parseCountries(_0x1aa94c);
          var _0x752333 = Lampa.Api.sources.tmdb.parsePG(_0x1aa94c);
          if (_0x1704fb !== "0000") {
            _0x4f8049.push("<span>" + _0x1704fb + "</span>");
          }
          if (_0x21167d.length > 0x0) {
            _0x4f8049.push(_0x21167d.join(", "));
          }
          if (Lampa.Storage.get("rat") !== false) {
            if (_0x4e33a3 > 0x0) {
              _0x2cc78d.push("<div class=\"full-start__rate\"><div>" + _0x4e33a3 + '</div><div>TMDB</div></div>');
            }
          }
          if (Lampa.Storage.get('ganr') !== false) {
            if (_0x1aa94c.genres && _0x1aa94c.genres.length > 0x0) {
              _0x2cc78d.push(_0x1aa94c.genres.map(function (_0x2d8b1a) {
                return Lampa.Utils.capitalizeFirstLetter(_0x2d8b1a.name);
              }).join(" | "));
            }
          }
          if (Lampa.Storage.get("vremya") !== false) {
            if (_0x1aa94c.runtime) {
              _0x2cc78d.push(Lampa.Utils.secondsToTime(_0x1aa94c.runtime * 0x3c, true));
            }
          }
          if (Lampa.Storage.get('seas') !== false) {
            if (_0x1aa94c.number_of_seasons) {
              _0x2cc78d.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">Сезонов " + _0x1aa94c.number_of_seasons + "</span>");
            }
          }
          if (Lampa.Storage.get("eps") !== false) {
            if (_0x1aa94c.number_of_episodes) {
              _0x2cc78d.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">Эпизодов " + _0x1aa94c.number_of_episodes + '</span>');
            }
          }
          if (Lampa.Storage.get("year_ogr") !== false) {
            if (_0x752333) {
              _0x2cc78d.push("<span class=\"full-start__pg\" style=\"font-size: 0.9em;\">" + _0x752333 + '</span>');
            }
          }
          if (Lampa.Storage.get("status") !== false) {
            var _0x1c0b85 = '';
            if (_0x1aa94c.status) {
              switch (_0x1aa94c.status.toLowerCase()) {
                case "released":
                  _0x1c0b85 = 'Выпущенный';
                  break;
                case 'ended':
                  _0x1c0b85 = "Закончен";
                  break;
                case "returning series":
                  _0x1c0b85 = 'Онгоинг';
                  break;
                case "canceled":
                  _0x1c0b85 = "Отменено";
                  break;
                case "post production":
                  _0x1c0b85 = 'Скоро';
                  break;
                case 'planned':
                  _0x1c0b85 = 'Запланировано';
                  break;
                case "in production":
                  _0x1c0b85 = "В производстве";
                  break;
                default:
                  _0x1c0b85 = _0x1aa94c.status;
                  break;
              }
            }
            if (_0x1c0b85) {
              _0x2cc78d.push("<span class=\"full-start__status\" style=\"font-size: 0.9em;\">" + _0x1c0b85 + "</span>");
            }
          }
          _0x213b60.find(".new-interface-info__head").empty().append(_0x4f8049.join(", "));
          _0x213b60.find(".new-interface-info__details").html(_0x2cc78d.join("<span class=\"new-interface-info__split\">&#9679;</span>"));
        };
        this.load = function (_0x32c8f2) {
          var _0x34f2ac = this;
          clearTimeout(_0x5534d5);
          var _0x21f366 = Lampa.TMDB.api((_0x32c8f2.name ? 'tv' : "movie") + '/' + _0x32c8f2.id + "?api_key=" + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get("language"));
          if (_0x5454ff[_0x21f366]) {
            return this.draw(_0x5454ff[_0x21f366]);
          }
          _0x5534d5 = setTimeout(function () {
            _0x270e7e.clear();
            _0x270e7e.timeout(0x1388);
            _0x270e7e.silent(_0x21f366, function (_0x5e2781) {
              _0x5454ff[_0x21f366] = _0x5e2781;
              _0x34f2ac.draw(_0x5e2781);
            });
          }, 0x12c);
        };
        this.render = function () {
          return _0x213b60;
        };
        this.empty = function () {};
        this.destroy = function () {
          _0x213b60.remove();
          _0x5454ff = {};
          _0x213b60 = null;
        };
      }
      function _0x3cc085(_0x2cc88c) {
        var _0xe4dc26 = new Lampa.Reguest();
        var _0x39bc03 = new Lampa.Scroll({
          'mask': true,
          'over': true,
          'scroll_by_item': true
        });
        var _0x563831 = [];
        var _0x2ff941 = $("<div class=\"new-interface\"><img class=\"full-start__background\"></div>");
        var _0x677b21 = 0x0;
        var _0x3fc4ef = Lampa.Manifest.app_digital >= 0xa6;
        var _0x49f458;
        var _0x24ebe1;
        var _0x159d18 = Lampa.Storage.field("card_views_type") == "view" || Lampa.Storage.field("navigation_type") == "mouse";
        var _0x3798d0 = _0x2ff941.find('.full-start__background');
        var _0x5ddcf0 = '';
        var _0x3ddfae;
        this.create = function () {};
        this.empty = function () {
          var _0x39db6b;
          if (_0x2cc88c.source == 'tmdb') {
            _0x39db6b = $("<div class=\"empty__footer\"><div class=\"simple-button selector\">" + Lampa.Lang.translate("change_source_on_cub") + '</div></div>');
            _0x39db6b.find(".selector").on('hover:enter', function () {
              Lampa.Storage.set("source", "cub");
              Lampa.Activity.replace({
                'source': 'cub'
              });
            });
          }
          var _0x27d5e5 = new Lampa.Empty();
          _0x2ff941.append(_0x27d5e5.render(_0x39db6b));
          this.start = _0x27d5e5.start;
          this.activity.loader(false);
          this.activity.toggle();
        };
        this.loadNext = function () {
          var _0x4483e8 = this;
          if (this.next && !this.next_wait && _0x563831.length) {
            this.next_wait = true;
            this.next(function (_0x81e773) {
              _0x4483e8.next_wait = false;
              _0x81e773.forEach(_0x4483e8.append.bind(_0x4483e8));
              Lampa.Layer.visible(_0x563831[_0x677b21 + 0x1].render(true));
            }, function () {
              _0x4483e8.next_wait = false;
            });
          }
        };
        this.push = function () {};
        this.build = function (_0x11f5c3) {
          var _0x231933 = this;
          _0x24ebe1 = _0x11f5c3;
          _0x49f458 = new _0x585d59(_0x2cc88c);
          _0x49f458.create();
          _0x39bc03.minus(_0x49f458.render());
          _0x11f5c3.slice(0x0, _0x159d18 ? _0x11f5c3.length : 0x2).forEach(this.append.bind(this));
          _0x2ff941.append(_0x49f458.render());
          _0x2ff941.append(_0x39bc03.render());
          if (_0x3fc4ef) {
            Lampa.Layer.update(_0x2ff941);
            Lampa.Layer.visible(_0x39bc03.render(true));
            _0x39bc03.onEnd = this.loadNext.bind(this);
            _0x39bc03.onWheel = function (_0x287c2f) {
              if (!Lampa.Controller.own(_0x231933)) {
                _0x231933.start();
              }
              if (_0x287c2f > 0x0) {
                _0x231933.down();
              } else {
                if (_0x677b21 > 0x0) {
                  _0x231933.up();
                }
              }
            };
          }
          this.activity.loader(false);
          this.activity.toggle();
        };
        this.background = function (_0x425fe9) {
          var _0x5e5637 = Lampa.Api.img(_0x425fe9.backdrop_path, "w1280");
          clearTimeout(_0x3ddfae);
          if (_0x5e5637 == _0x5ddcf0) {
            return;
          }
          _0x3ddfae = setTimeout(function () {
            _0x3798d0.removeClass("loaded");
            _0x3798d0[0x0].onload = function () {
              _0x3798d0.addClass("loaded");
            };
            _0x3798d0[0x0].onerror = function () {
              _0x3798d0.removeClass("loaded");
            };
            _0x5ddcf0 = _0x5e5637;
            setTimeout(function () {
              _0x3798d0[0x0].src = _0x5ddcf0;
            }, 0x32);
          }, 0x64);
        };
        this.append = function (_0x45cae0) {
          var _0x5442e7 = this;
          if (_0x45cae0.ready) {
            return;
          }
          _0x45cae0.ready = true;
          var _0x41a881 = new Lampa.InteractionLine(_0x45cae0, {
            'url': _0x45cae0.url,
            'card_small': true,
            'cardClass': _0x45cae0.cardClass,
            'genres': _0x2cc88c.genres,
            'object': _0x2cc88c,
            'card_wide': Lampa.Storage.field("wide_post"),
            'nomore': _0x45cae0.nomore
          });
          _0x41a881.create();
          _0x41a881.onDown = this.down.bind(this);
          _0x41a881.onUp = this.up.bind(this);
          _0x41a881.onBack = this.back.bind(this);
          _0x41a881.onToggle = function () {
            _0x677b21 = _0x563831.indexOf(_0x41a881);
          };
          if (this.onMore) {
            _0x41a881.onMore = this.onMore.bind(this);
          }
          _0x41a881.onFocus = function (_0x172dca) {
            _0x49f458.update(_0x172dca);
            _0x5442e7.background(_0x172dca);
          };
          _0x41a881.onHover = function (_0x3da8b7) {
            _0x49f458.update(_0x3da8b7);
            _0x5442e7.background(_0x3da8b7);
          };
          _0x41a881.onFocusMore = _0x49f458.empty.bind(_0x49f458);
          _0x39bc03.append(_0x41a881.render());
          _0x563831.push(_0x41a881);
        };
        this.back = function () {
          Lampa.Activity.backward();
        };
        this.down = function () {
          _0x677b21++;
          _0x677b21 = Math.min(_0x677b21, _0x563831.length - 0x1);
          if (!_0x159d18) {
            _0x24ebe1.slice(0x0, _0x677b21 + 0x2).forEach(this.append.bind(this));
          }
          _0x563831[_0x677b21].toggle();
          _0x39bc03.update(_0x563831[_0x677b21].render());
        };
        this.up = function () {
          _0x677b21--;
          if (_0x677b21 < 0x0) {
            _0x677b21 = 0x0;
            Lampa.Controller.toggle("head");
          } else {
            _0x563831[_0x677b21].toggle();
            _0x39bc03.update(_0x563831[_0x677b21].render());
          }
        };
        this.start = function () {
          var _0x1d5c0c = this;
          Lampa.Controller.add("content", {
            'link': this,
            'toggle': function _0x5a7480() {
              if (_0x1d5c0c.activity.canRefresh()) {
                return false;
              }
              if (_0x563831.length) {
                _0x563831[_0x677b21].toggle();
              }
            },
            'update': function _0x3fec66() {},
            'left': function _0x363ca6() {
              if (Navigator.canmove("left")) {
                Navigator.move('left');
              } else {
                Lampa.Controller.toggle("menu");
              }
            },
            'right': function _0x4456be() {
              Navigator.move("right");
            },
            'up': function _0x673565() {
              if (Navigator.canmove('up')) {
                Navigator.move('up');
              } else {
                Lampa.Controller.toggle("head");
              }
            },
            'down': function _0x2e930f() {
              if (Navigator.canmove('down')) {
                Navigator.move('down');
              }
            },
            'back': this.back
          });
          Lampa.Controller.toggle("content");
        };
        this.refresh = function () {
          this.activity.loader(true);
          this.activity.need_refresh = true;
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
          return _0x2ff941;
        };
        this.destroy = function () {
          _0xe4dc26.clear();
          Lampa.Arrays.destroy(_0x563831);
          _0x39bc03.destroy();
          if (_0x49f458) {
            _0x49f458.destroy();
          }
          _0x2ff941.remove();
          _0x563831 = null;
          _0xe4dc26 = null;
          _0x24ebe1 = null;
        };
      }
      function _0x201717() {
        if (Lampa.Manifest.origin !== "bylampa") {
          Lampa.Noty.show("Ошибка доступа");
          return;
        }
        window.plugin_interface_ready = true;
        var _0x892a7a = Lampa.InteractionMain;
        Lampa.InteractionMain = function (_0x48b7d2) {
          var _0x16496a = _0x3cc085;
          if (window.innerWidth < 0x2ff) {
            _0x16496a = _0x892a7a;
          }
          if (Lampa.Manifest.app_digital < 0x99) {
            _0x16496a = _0x892a7a;
          }
          if (Lampa.Platform.screen("mobile")) {
            _0x16496a = _0x892a7a;
          }
          if (_0x48b7d2.title === "Избранное") {
            _0x16496a = _0x892a7a;
          }
          return new _0x16496a(_0x48b7d2);
        };
        if (Lampa.Storage.get("wide_post") == true) {
          Lampa.Template.add("new_interface_style", "\n        <style>\n        .new-interface .card--small.card--wide {\n            width: 18.3em;\n        }\n        \n        .new-interface-info {\n            position: relative;\n            padding: 1.5em;\n            height: 26em;\n        }\n        \n        .new-interface-info__body {\n            width: 80%;\n            padding-top: 1.1em;\n        }\n        \n        .new-interface-info__head {\n            color: rgba(255, 255, 255, 0.6);\n            margin-bottom: 1em;\n            font-size: 1.3em;\n            min-height: 1em;\n        }\n        \n        .new-interface-info__head span {\n            color: #fff;\n        }\n        \n        .new-interface-info__title {\n            font-size: 4em;\n            font-weight: 600;\n            margin-bottom: 0.3em;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 1;\n            line-clamp: 1;\n            -webkit-box-orient: vertical;\n            margin-left: -0.03em;\n            line-height: 1.3;\n        }\n        \n        .new-interface-info__details {\n            margin-bottom: 1.6em;\n            display: -webkit-box;\n            display: -webkit-flex;\n            display: -moz-box;\n            display: -ms-flexbox;\n            display: flex;\n            -webkit-box-align: center;\n            -webkit-align-items: center;\n            -moz-box-align: center;\n            -ms-flex-align: center;\n            align-items: center;\n            -webkit-flex-wrap: wrap;\n            -ms-flex-wrap: wrap;\n            flex-wrap: wrap;\n            min-height: 1.9em;\n            font-size: 1.3em;\n        }\n        \n        .new-interface-info__split {\n            margin: 0 1em;\n            font-size: 0.7em;\n        }\n        \n        .new-interface-info__description {\n            font-size: 1.4em;\n            font-weight: 310;\n            line-height: 1.3;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 3;\n            line-clamp: 3;\n            -webkit-box-orient: vertical;\n            width: 65%;\n        }\n        \n        .new-interface .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .full-start__background {\n            height: 108%;\n            top: -5em;\n        }\n        \n        .new-interface .full-start__rate {\n            font-size: 1.3em;\n            margin-right: 0;\n        }\n        \n        .new-interface .card__promo {\n            display: none;\n        }\n        \n        .new-interface .card.card--wide+.card-more .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .card.card--wide .card-watched {\n            display: none !important;\n        }\n        \n        body.light--version .new-interface-info__body {\n            width: 69%;\n            padding-top: 1.5em;\n        }\n        \n        body.light--version .new-interface-info {\n            height: 25.3em;\n        }\n\n        body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view{\n            animation: animation-card-focus 0.2s\n        }\n        body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view{\n            animation: animation-trigger-enter 0.2s forwards\n        }\n        </style>\n    ");
          $("body").append(Lampa.Template.get('new_interface_style', {}, true));
        } else {
          Lampa.Template.add('new_interface_style', "\n        <style>\n        .new-interface .card--small.card--wide {\n            width: 18.3em;\n        }\n        \n        .new-interface-info {\n            position: relative;\n            padding: 1.5em;\n            height: 20.4em;\n        }\n        \n        .new-interface-info__body {\n            width: 80%;\n            padding-top: 0.2em;\n        }\n        \n        .new-interface-info__head {\n            color: rgba(255, 255, 255, 0.6);\n            margin-bottom: 0.3em;\n            font-size: 1.3em;\n            min-height: 1em;\n        }\n        \n        .new-interface-info__head span {\n            color: #fff;\n        }\n        \n        .new-interface-info__title {\n            font-size: 4em;\n            font-weight: 600;\n            margin-bottom: 0.2em;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 1;\n            line-clamp: 1;\n            -webkit-box-orient: vertical;\n            margin-left: -0.03em;\n            line-height: 1.3;\n        }\n        \n        .new-interface-info__details {\n            margin-bottom: 1.6em;\n            display: -webkit-box;\n            display: -webkit-flex;\n            display: -moz-box;\n            display: -ms-flexbox;\n            display: flex;\n            -webkit-box-align: center;\n            -webkit-align-items: center;\n            -moz-box-align: center;\n            -ms-flex-align: center;\n            align-items: center;\n            -webkit-flex-wrap: wrap;\n            -ms-flex-wrap: wrap;\n            flex-wrap: wrap;\n            min-height: 1.9em;\n            font-size: 1.3em;\n        }\n        \n        .new-interface-info__split {\n            margin: 0 1em;\n            font-size: 0.7em;\n        }\n        \n        .new-interface-info__description {\n            font-size: 1.4em;\n            font-weight: 310;\n            line-height: 1.3;\n            overflow: hidden;\n            -o-text-overflow: \".\";\n            text-overflow: \".\";\n            display: -webkit-box;\n            -webkit-line-clamp: 2;\n            line-clamp: 2;\n            -webkit-box-orient: vertical;\n            width: 70%;\n        }\n        \n        .new-interface .card-more__box {\n            padding-bottom: 150%;\n        }\n        \n        .new-interface .full-start__background {\n            height: 108%;\n            top: -5em;\n        }\n        \n        .new-interface .full-start__rate {\n            font-size: 1.3em;\n            margin-right: 0;\n        }\n        \n        .new-interface .card__promo {\n            display: none;\n        }\n        \n        .new-interface .card.card--wide+.card-more .card-more__box {\n            padding-bottom: 95%;\n        }\n        \n        .new-interface .card.card--wide .card-watched {\n            display: none !important;\n        }\n        \n        body.light--version .new-interface-info__body {\n            width: 69%;\n            padding-top: 1.5em;\n        }\n        \n        body.light--version .new-interface-info {\n            height: 25.3em;\n        }\n\n        body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view{\n            animation: animation-card-focus 0.2s\n        }\n        body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view{\n            animation: animation-trigger-enter 0.2s forwards\n        }\n        </style>\n    ");
          $("body").append(Lampa.Template.get("new_interface_style", {}, true));
        }
        Lampa.Settings.listener.follow('open', function (_0x74b35) {
          if (_0x74b35.name == 'main') {
            if (Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").length == 0x0) {
              Lampa.SettingsApi.addComponent({
                'component': "style_interface",
                'name': "Стильный интерфейс"
              });
            }
            Lampa.Settings.main().update();
            Lampa.Settings.main().render().find("[data-component=\"style_interface\"]").addClass('hide');
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "interface",
          'param': {
            'name': "style_interface",
            'type': "static",
            'default': true
          },
          'field': {
            'name': "Стильный интерфейс",
            'description': "Настройки элементов"
          },
          'onRender': function (_0x48f494) {
            setTimeout(function () {
              $(".settings-param > div:contains(\"Стильный интерфейс\")").parent().insertAfter($("div[data-name=\"interface_size\"]"));
            }, 0x14);
            _0x48f494.on('hover:enter', function () {
              Lampa.Settings.create('style_interface');
              Lampa.Controller.enabled().controller.back = function () {
                Lampa.Settings.create("interface");
              };
            });
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "wide_post",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Широкие постеры"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': 'style_interface',
          'param': {
            'name': "logo_card_style",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Логотип вместо названия"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': 'style_interface',
          'param': {
            'name': "desc",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать описание"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "status",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать статус фильма/сериала"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': 'seas',
            'type': "trigger",
            'default': false
          },
          'field': {
            'name': "Показывать количество сезонов"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': 'style_interface',
          'param': {
            'name': "eps",
            'type': 'trigger',
            'default': false
          },
          'field': {
            'name': "Показывать количество эпизодов"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "year_ogr",
            'type': "trigger",
            'default': true
          },
          'field': {
            'name': "Показывать возрастное ограничение"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "vremya",
            'type': 'trigger',
            'default': true
          },
          'field': {
            'name': "Показывать время фильма"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': 'ganr',
            'type': 'trigger',
            'default': true
          },
          'field': {
            'name': "Показывать жанр фильма"
          }
        });
        Lampa.SettingsApi.addParam({
          'component': "style_interface",
          'param': {
            'name': "rat",
            'type': 'trigger',
            'default': true
          },
          'field': {
            'name': "Показывать рейтинг фильма"
          }
        });
        var _0x5f272b = setInterval(function () {
          if (typeof Lampa !== "undefined") {
            clearInterval(_0x5f272b);
            if (!Lampa.Storage.get("int_plug", 'false')) {
              _0x156a90();
            }
          }
        }, 0xc8);
        function _0x156a90() {
          Lampa.Storage.set("int_plug", "true");
          Lampa.Storage.set("wide_post", 'true');
          Lampa.Storage.set("logo_card_style", "true");
          Lampa.Storage.set("desc", "true");
          Lampa.Storage.set("status", 'true');
          Lampa.Storage.set('seas', "false");
          Lampa.Storage.set('eps', "false");
          Lampa.Storage.set("year_ogr", "true");
          Lampa.Storage.set('vremya', 'true');
          Lampa.Storage.set('ganr', 'true');
          Lampa.Storage.set('rat', "true");
        }
      }
      if (!window.plugin_interface_ready) {
        _0x201717();
      }
    })();
  }
})();
