(function () {
  'use strict';

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

  var Time = /*#__PURE__*/function () {
    function Time() {
      var _this = this;

      _classCallCheck(this, Time);

      this.time_offset = 0;
      this.updates = [];
      setInterval(function () {
        _this.updates.forEach(function (call) {
          call();
        });
      }, 1000 * 10);
    }

    _createClass(Time, [{
      key: "set",
      value: function set(time) {
        this.time_offset = time - Date.now();
      }
    }, {
      key: "get",
      value: function get() {
        var date = new Date(),
            time = date.getTime() + this.time_offset;
        date = new Date(time);
        return date.getTime();
      }
    }, {
      key: "left",
      value: function left(to) {
        return to - this.get();
      }
    }, {
      key: "addUpdate",
      value: function addUpdate(call) {
        this.updates.push(call);
      }
    }, {
      key: "removeUpdate",
      value: function removeUpdate(call) {
        Lampa.Arrays.remove(this.updates, call);
      }
    }]);

    return Time;
  }();

  var Time$1 = new Time();

  var Api = /*#__PURE__*/function () {
    function Api() {
      _classCallCheck(this, Api);

      this.network = new Lampa.Reguest();
    }

    _createClass(Api, [{
      key: "get",
      value: function get(successCallback, errorCallback) {
        var _this = this;

        var url = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/sport/get'; //url = Lampa.Utils.protocol() + 'localhost:3100/api/sport/get'

        this.network.silent(url, function (data) {
          if (data && data.results.length > 0) {
            Time$1.set(data.now);
            successCallback(data.results);
          } else {
            errorCallback ? errorCallback('No sport data available') : console.error('No sport data available');
          }
        }, function (e) {
          if (errorCallback) {
            errorCallback(_this.network.errorCode(e));
          }
        });
      }
    }]);

    return Api;
  }();

  var Api$1 = new Api();

  var Defined = {
    active: true,
    start_time: '2025-06-01T15:50:00',
    vast_url: 'https://a.utraff.com/vast/z0-Rz6yPuzoNpx8dz0YYyFggqzAs_B17tKzDtn7H6zE.xml',
    poster: '/img/other/broadcast_f1.jpg',
    hours: 4
  };

  var Stat = /*#__PURE__*/function () {
    function Stat() {
      _classCallCheck(this, Stat);

      this.ready_index = {};
    }

    _createClass(Stat, [{
      key: "send",
      value: function send(index) {
        if (this.ready_index[index]) return;
        this.ready_index[index] = true;
        var url = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/ad/view?index=' + index;
        $.get(url);
      }
    }]);

    return Stat;
  }();

  var Stat$1 = new Stat();

  var next = 0;

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  var Card = /*#__PURE__*/function () {
    function Card() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Card);

      this.data = data;
      this.params = params;
    }

    _createClass(Card, [{
      key: "create",
      value: function create() {
        var _this = this;

        this.card = $("<div class=\"card selector layer--visible layer--render card--small\">\n            <div class=\"card__view\" style=\"margin-bottom: 1em;\">\n                <img class=\"card__img\">\n                <div class=\"card__promo\">\n                    <div class=\"card__promo-title\"></div>\n                    <div class=\"card__promo-text\"></div>\n                </div>\n            </div>\n            <div class=\"card__title\"></div>\n            <div class=\"card__age\"></div>\n        </div>")[0];
        this.img = this.card.querySelector('.card__img') || {};
        var time_start = Lampa.Utils.parseTime(this.data.time_start);
        var time_now = Lampa.Utils.parseTime(Date.now());
        this.card.querySelector('.card__title').innerText = this.data.title;
        this.card.querySelector('.card__age').innerText = time_start.day == time_now.day ? 'В ' + time_start.time : time_start.briefly;
        this.card.querySelector('.card__promo-title').innerText = '';
        this.card.querySelector('.card__promo-text').innerText = '';

        if (this.params.type === 'watch') {
          this.card.classList.add('card--wide');
          this.card.addEventListener('hover:enter', function () {
            var resume = _this.data.status == 'live';

            if (Time$1.left(_this.data.time_end) < 0 && !resume) {
              Lampa.Bell.push({
                text: Lampa.Lang.translate('broadcast_final_end')
              });
            } else if (Time$1.left(_this.data.time_start) < 0 || resume) {
              var ad = next < Date.now() ? Defined.vast_url : false;
              next = Date.now() + 1000 * 60 * random(30, 80);
              var streams = Lampa.Arrays.getKeys(_this.data.streams).filter(function (a) {
                return a !== 'abr';
              });
              streams.sort(function (a, b) {
                var a_quality = parseInt(a);
                var b_quality = parseInt(b);
                return b_quality - a_quality;
              });
              var stream = _this.data.streams[streams[0]];
              Lampa.Player.iptv({
                title: Lampa.Lang.translate('broadcast_final_title'),
                url: Lampa.Utils.fixProtocolLink(stream),
                position: 0,
                total: 1,
                vast_url: ad,
                vast_msg: Lampa.Lang.translate('ad'),
                onGetChannel: function onGetChannel() {
                  var channel = {
                    url: Lampa.Utils.fixProtocolLink(stream),
                    name: _this.data.title,
                    group: _this.data.type || '',
                    icons: [],
                    position: 0,
                    total: 1
                  };
                  Lampa.Player.programReady({
                    channel: channel,
                    position: 0,
                    total: 1
                  });
                  return channel;
                },
                onGetProgram: function onGetProgram(channel, position, container) {
                  container[0].empty().text(Lampa.Lang.translate('broadcast_final_program'));
                }
              });
              Stat$1.send(0);
            } else {
              Lampa.Bell.push({
                text: Lampa.Lang.translate('broadcast_final_start_not_yet')
              });
            }
          });
          this.timeLeft = this.updateTimeLeft.bind(this);
          Time$1.addUpdate(this.timeLeft);
          this.updateTimeLeft();
        } else {
          var parse_time = Lampa.Utils.parseTime(this.data.time_start);
          var date = $("\n                <div style=\"position: absolute; left: 1em; top: 1em; background: #535353; padding: 0.7em; border-radius: 0.7em;\">\n                    <div style=\"font-size: 2.6em; font-weight: 900; line-height: 0.6; margin-bottom: 0.3em;\">".concat(parse_time.day, "</div>\n                    <div>").concat(parse_time.mouth, "</div>\n                </div>\n            "));
          this.card.querySelector('.card__view').append(date[0]);
          if (!this.data.image_vertical) this.img.style.display = 'none';
        }

        this.card.addEventListener('hover:focus', function () {
          if (_this.onFocus) _this.onFocus(_this.card, {});
        });
        this.card.addEventListener('hover:touch', function () {
          if (_this.onTouch) _this.onTouch(_this.card, {});
        });
        this.card.addEventListener('visible', this.visible.bind(this));
        this.image();
      }
    }, {
      key: "updateTimeLeft",
      value: function updateTimeLeft() {
        var seconds_left = Time$1.left(this.data.time_start);
        this.card.find('.card__promo-text').text(seconds_left > 1000 ? Lampa.Lang.translate('title_left') + ': ' + Lampa.Utils.secondsToTimeHuman(seconds_left / 1000) : Lampa.Lang.translate(seconds_left < -(1000 * 60 * 60 * Defined.hours) ? 'broadcast_final_end' : 'broadcast_final_started'));
      }
    }, {
      key: "image",
      value: function image() {
        var _this2 = this;

        this.img.onload = function () {
          _this2.card.classList.add('img--loaded');
        };

        this.img.onerror = function () {
          _this2.img.src = './img/img_broken.svg';
        };
      }
    }, {
      key: "visible",
      value: function visible() {
        var src = this.params.type === 'watch' ? this.data.image_horizontal : this.data.image_vertical;
        src = src ? src : './img/img_load.svg';
        this.img.src = src;
        if (this.onVisible) this.onVisible(this.card, {});
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.img.onerror = function () {};

        this.img.onload = function () {};

        this.img.src = '';
        this.card.remove();
        this.card = null;
        this.img = null;
        Time$1.removeUpdate(this.timeLeft);
      }
    }, {
      key: "render",
      value: function render(js) {
        return js ? this.card : $(this.card);
      }
    }]);

    return Card;
  }();

  function component(object) {
    var comp = new Lampa.InteractionMain(object);

    comp.create = function () {
      var _this = this;

      this.activity.loader(true);
      Api$1.get(function (results) {
        _this.activity.loader(false);

        var offset = 1000 * 60 * 60 * 24 * 1;
        var watch = results.filter(function (item) {
          return Time$1.left(item.time_start) <= offset || item.status == 'live';
        }).filter(function (item) {
          return Time$1.left(item.time_end) > 0 || item.status == 'live';
        });
        var soon = results.filter(function (item) {
          return Time$1.left(item.time_start) > offset;
        });
        var data = [];

        if (watch.length) {
          data.push({
            title: Lampa.Lang.translate('broadcast_final_now_watch'),
            nomore: true,
            results: watch.map(function (result) {
              return {
                cardClass: function cardClass() {
                  return new Card(result, {
                    type: 'watch'
                  });
                }
              };
            })
          });
        }

        if (soon.length) {
          data.push({
            title: Lampa.Lang.translate('broadcast_final_soon_watch'),
            nomore: true,
            results: soon.map(function (result) {
              return {
                cardClass: function cardClass() {
                  return new Card(result, {
                    type: 'soon'
                  });
                }
              };
            })
          });
        }

        _this.build(data);
      }, this.empty.bind(this));
      return this.render();
    };

    return comp;
  }

  function startPlugin() {
    Lampa.Lang.add({
      broadcast_name: {
        ru: 'Спорт',
        uk: 'Спорт',
        be: 'Спорт',
        en: 'Sport'
      },
      broadcast_final_program: {
        ru: 'Нет программы',
        uk: 'Немає програми',
        be: 'Няма праграмы',
        en: 'No program'
      },
      broadcast_final_bell_60: {
        ru: 'До начала трансляции осталось 60 минут.',
        uk: 'До початку трансляції залишилось 60 хвилин.',
        be: 'Да пачатку трансляцыі засталося 60 хвілін.',
        en: '60 minutes left until the broadcast starts.'
      },
      broadcast_final_bell_10: {
        ru: 'До начала трансляции осталось 10 минут.',
        uk: 'До початку трансляції залишилось 10 хвилин.',
        be: 'Да пачатку трансляцыі засталося 10 хвілін.',
        en: '10 minutes left until the broadcast starts.'
      },
      broadcast_final_start_not_yet: {
        ru: 'Трансляция еще не началась. Пожалуйста, подождите.',
        uk: 'Трансляція ще не почалася. Будь ласка, зачекайте.',
        be: 'Трансляцыя яшчэ не пачалася. Калі ласка, пачакайце.',
        en: 'The broadcast has not started yet. Please wait.'
      },
      broadcast_final_started: {
        ru: 'Трансляция началась! Присоединяйтесь к просмотру.',
        uk: 'Трансляція почалася! Приєднуйтесь до перегляду.',
        be: 'Трансляцыя пачалася! Далучайцеся да прагляду.',
        en: 'The broadcast has started! Join the viewing.'
      },
      broadcast_final_end: {
        ru: 'Трансляция завершена.',
        uk: 'Трансляція завершена.',
        be: 'Трансляцыя завершана.',
        en: 'The broadcast has ended.'
      },
      broadcast_final_nolink: {
        ru: 'Нет ссылки на трансляцию.',
        uk: 'Немає посилання на трансляцію.',
        be: 'Няма спасылкі на трансляцыю.',
        en: 'No link to the broadcast.'
      },
      broadcast_final_now_watch: {
        ru: 'В ближайшие время',
        uk: 'Найближчим часом',
        be: 'У бліжэйшы час',
        en: 'Coming up soon'
      },
      broadcast_final_soon_watch: {
        ru: 'Скоро начнется трансляция',
        uk: 'Скоро почнеться трансляція',
        be: 'Хутка пачнецца трансляцыя',
        en: 'The broadcast will start soon'
      }
    });
    var manifest = {
      type: 'video',
      version: '1.1.1',
      name: Lampa.Lang.translate('broadcast_name'),
      description: '',
      component: 'cub_sport'
    };
    Lampa.Manifest.plugins = manifest;
    Lampa.Component.add('cub_sport', component);

    function add() {
      var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg width=\"512\" height=\"512\" viewBox=\"0 0 512 512\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M256 0C114.617 0 0 114.617 0 256C0 397.383 114.617 512 256 512C397.383 512 512 397.383 512 256C511.842 114.684 397.316 0.157867 256 0ZM265.137 73.8037L354.133 38.2293C364.234 42.8001 374.004 48.0668 383.375 53.9915L383.609 54.1376C392.817 59.9718 401.618 66.4258 409.95 73.4549L410.667 74.0789C414.401 77.261 418.037 80.5557 421.571 83.9584C422.017 84.3957 422.483 84.8117 422.929 85.2587C426.632 88.874 430.221 92.6035 433.692 96.4416C433.98 96.7669 434.254 97.1083 434.542 97.4336C437.587 100.846 440.516 104.379 443.358 107.971C444.042 108.825 444.725 109.679 445.388 110.533C448.47 114.525 451.454 118.587 454.271 122.779L436.529 198.196L349.242 227.295L265.158 160.017L265.137 73.8037ZM66.6037 110.582C67.2661 109.729 67.9413 108.876 68.6251 108.025C71.4302 104.467 74.3355 100.989 77.3376 97.5957C77.6629 97.2373 77.9627 96.8704 78.2837 96.512C81.7313 92.6675 85.3063 88.9392 89.0027 85.3333C89.4283 84.9173 89.8528 84.48 90.2987 84.096C93.804 80.7151 97.4099 77.4401 101.111 74.2752L101.965 73.5584C110.222 66.5809 118.94 60.1665 128.058 54.3584L128.39 54.1451C137.706 48.2341 147.418 42.9732 157.458 38.4L246.863 73.8037V159.991L162.775 227.259L75.488 198.213L57.7461 122.796C60.5748 118.636 63.5286 114.563 66.6037 110.582ZM56.3211 386.945C53.8104 383.118 51.4108 379.22 49.1253 375.254L48.5707 374.295C46.2959 370.347 44.142 366.33 42.112 362.25L42.0416 362.122C37.7657 353.538 34.013 344.703 30.8043 335.666V335.583C29.2875 331.316 27.904 326.946 26.6251 322.55L26.1621 320.929C24.9867 316.784 23.9253 312.608 22.9792 308.404C22.896 307.991 22.7915 307.6 22.7083 307.191C20.6129 297.659 19.1071 288.006 18.1995 278.288L70.2955 215.775L156.979 244.667L182.138 345.292L140.8 400.291L56.3211 386.945ZM312.825 488.046C308.558 489.104 304.179 490.017 299.801 490.837C299.187 490.958 298.563 491.058 297.95 491.171C294.221 491.838 290.45 492.409 286.671 492.875C285.663 493.004 284.662 493.141 283.659 493.263C280.149 493.67 276.608 493.979 273.058 494.234C271.941 494.308 270.837 494.421 269.721 494.492C265.183 494.771 260.608 494.933 256 494.933C251.779 494.933 247.584 494.821 243.413 494.6C242.909 494.6 242.425 494.516 241.92 494.479C238.208 494.267 234.512 493.988 230.825 493.629L230.4 493.55C222.32 492.674 214.289 491.393 206.337 489.712L155.862 410.683L196.55 356.429H315.45L356.804 411.042L312.825 488.046ZM489.355 307.2C489.267 307.609 489.167 308.004 489.079 308.413C488.128 312.615 487.066 316.791 485.896 320.938L485.437 322.559C484.167 326.942 482.772 331.288 481.254 335.591V335.675C478.047 344.712 474.295 353.546 470.017 362.129L469.946 362.258C467.91 366.335 465.756 370.352 463.488 374.304L462.933 375.263C460.666 379.231 458.27 383.125 455.75 386.938L371.558 400.212L329.934 345.258L355.079 244.658L441.762 215.766L493.858 278.279C492.954 288.003 491.45 297.662 489.355 307.2Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
      button.on('hover:enter', function () {
        Lampa.Activity.push({
          url: '',
          title: manifest.name,
          component: 'cub_sport',
          page: 1
        });
      });
      $('.menu .menu__list').eq(0).append(button);
    }

    if (window.appready) add();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') add();
      });
    }
    window.cub_sport_ready = true;
  }

  if (!window.cub_sport_ready && Lampa.Manifest.app_digital) startPlugin();

})();
