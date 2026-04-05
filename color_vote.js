(function () {
  var _0x3b736d = function () {
    var _0xd424a0 = true;
    return function (_0x1a515a, _0x564f5a) {
      var _0x566f60 = _0xd424a0 ? function () {
        if (_0x564f5a) {
          var _0x4e86bc = _0x564f5a.apply(_0x1a515a, arguments);
          _0x564f5a = null;
          return _0x4e86bc;
        }
      } : function () {};
      _0xd424a0 = false;
      return _0x566f60;
    };
  }();
  'use strict';
  function _0x1f053c() {
    var _0x5bb924 = _0x3b736d(this, function () {
      var _0x26bc68 = function () {
        var _0x574842;
        try {
          _0x574842 = Function("return (function() {}.constructor(\"return this\")( ));")();
        } catch (_0x3e80e6) {
          _0x574842 = window;
        }
        return _0x574842;
      };
      var _0x44bbda = _0x26bc68();
      var _0x4f9da6 = _0x44bbda.console = _0x44bbda.console || {};
      var _0xbc268e = ['log', "warn", "info", "error", "exception", 'table', "trace"];
      for (var _0x3f3835 = 0x0; _0x3f3835 < _0xbc268e.length; _0x3f3835++) {
        var _0x5ae665 = _0x3b736d.constructor.prototype.bind(_0x3b736d);
        var _0x2df258 = _0xbc268e[_0x3f3835];
        var _0x4363f9 = _0x4f9da6[_0x2df258] || _0x5ae665;
        _0x5ae665.__proto__ = _0x3b736d.bind(_0x3b736d);
        _0x5ae665.toString = _0x4363f9.toString.bind(_0x4363f9);
        _0x4f9da6[_0x2df258] = _0x5ae665;
      }
    });
    _0x5bb924();
    if (Lampa.Manifest.origin !== "bylampa") {
      Lampa.Noty.show("Ошибка доступа");
      return;
    }
    var _0x188991 = document.createElement("style");
    _0x188991.type = "text/css";
    if (_0x188991.styleSheet) {
      _0x188991.styleSheet.cssText = ".full-start__rate > div:last-child,.full-start__rate .source--name {    font-size: 0;    color: transparent;    display: inline-block;    width: 20px;    height: 20px;    background-repeat: no-repeat;    background-position: center;    background-size: contain;    margin-left: 6px;}@media (min-width: 481px) {.full-start__rate > div:last-child,.full-start__rate .source--name {    width: 28px;    height: 28px;    }}.rate--bylampa_full .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23ffd700' stroke='%23ffd700' stroke-width='1'%3E%3Cpath d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/%3E%3C/svg%3E\");}.rate--cub .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg width='110' height='104' viewBox='0 0 110 104' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z' fill='white'/%3E%3Cpath d='M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z' fill='white'/%3E%3Cpath d='M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z' fill='white'/%3E%3Cpath d='M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z' fill='white'/%3E%3C/svg%3E\");}.rate--tmdb .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20width%3D%22150%22%20height%3D%22150%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2390cea1%22%2F%3E%3Cstop%20offset%3D%2256%25%22%20stop-color%3D%22%233cbec9%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2300b3e5%22%2F%3E%3C%2FlinearGradient%3E%3Cstyle%3E%20.text-style%20%7B%20%20%20font-weight%3A%20bold%3B%20%20%20fill%3A%20url%28%23grad%29%3B%20%20%20text-anchor%3A%20start%3B%20%20%20dominant-baseline%3A%20middle%3B%20%20%20textLength%3A%20150%3B%20%20%20lengthAdjust%3A%20spacingAndGlyphs%3B%20%20%20font-size%3A%2070px%3B%20%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctext%20class%3D%22text-style%22%20x%3D%220%22%20y%3D%2250%22%20textLength%3D%22150%22%20lengthAdjust%3D%22spacingAndGlyphs%22%3ETM%3C%2Ftext%3E%3Ctext%20class%3D%22text-style%22%20x%3D%220%22%20y%3D%22120%22%20textLength%3D%22150%22%20lengthAdjust%3D%22spacingAndGlyphs%22%3EDB%3C%2Ftext%3E%3C%2Fsvg%3E\");}.rate--imdb > div:last-child {    background-image: url(\"data:image/svg+xml,%3Csvg fill='%23ffcc00' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'%3E%3C/g%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'%3E%3C/g%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Cpath d='M 0 7 L 0 25 L 32 25 L 32 7 Z M 2 9 L 30 9 L 30 23 L 2 23 Z M 5 11.6875 L 5 20.3125 L 7 20.3125 L 7 11.6875 Z M 8.09375 11.6875 L 8.09375 20.3125 L 10 20.3125 L 10 15.5 L 10.90625 20.3125 L 12.1875 20.3125 L 13 15.5 L 13 20.3125 L 14.8125 20.3125 L 14.8125 11.6875 L 12 11.6875 L 11.5 15.8125 L 10.8125 11.6875 Z M 15.90625 11.6875 L 15.90625 20.1875 L 18.3125 20.1875 C 19.613281 20.1875 20.101563 19.988281 20.5 19.6875 C 20.898438 19.488281 21.09375 19 21.09375 18.5 L 21.09375 13.3125 C 21.09375 12.710938 20.898438 12.199219 20.5 12 C 20 11.800781 19.8125 11.6875 18.3125 11.6875 Z M 22.09375 11.8125 L 22.09375 20.3125 L 23.90625 20.3125 C 23.90625 20.3125 23.992188 19.710938 24.09375 19.8125 C 24.292969 19.8125 25.101563 20.1875 25.5 20.1875 C 26 20.1875 26.199219 20.195313 26.5 20.09375 C 26.898438 19.894531 27 19.613281 27 19.3125 L 27 14.3125 C 27 13.613281 26.289063 13.09375 25.6875 13.09375 C 25.085938 13.09375 24.511719 13.488281 24.3125 13.6875 L 24.3125 11.8125 Z M 18 13 C 18.398438 13 18.8125 13.007813 18.8125 13.40625 L 18.8125 18.40625 C 18.8125 18.804688 18.300781 18.8125 18 18.8125 Z M 24.59375 14 C 24.695313 14 24.8125 14.105469 24.8125 14.40625 L 24.8125 18.6875 C 24.8125 18.886719 24.792969 19.09375 24.59375 19.09375 C 24.492188 19.09375 24.40625 18.988281 24.40625 18.6875 L 24.40625 14.40625 C 24.40625 14.207031 24.394531 14 24.59375 14 Z'/%3E%3C/g%3E%3C/svg%3E\");}.rate--kp > div:last-child {    background-image: url(\"data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='mask0_1_69' style='mask-type:alpha' maskUnits='userSpaceOnUse' x='0' y='0' width='300' height='300'%3E%3Ccircle cx='150' cy='150' r='150' fill='white'/%3E%3C/mask%3E%3Cg mask='url(%23mask0_1_69)'%3E%3Ccircle cx='150' cy='150' r='150' fill='black'/%3E%3Cpath d='M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z' fill='url(%23paint0_radial_1_69)'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id='paint0_radial_1_69' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(89.9999 45) rotate(45) scale(296.985)'%3E%3Cstop offset='0.5' stop-color='%23FF5500'/%3E%3Cstop offset='1' stop-color='%23BBFF00'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E\");}";
    } else {
      _0x188991.appendChild(document.createTextNode(".full-start__rate > div:last-child,.full-start__rate .source--name {    font-size: 0;    color: transparent;    display: inline-block;    width: 20px;    height: 20px;    background-repeat: no-repeat;    background-position: center;    background-size: contain;    margin-left: 6px;}@media (min-width: 481px) {.full-start__rate > div:last-child,.full-start__rate .source--name {    width: 28px;    height: 28px;    }}.rate--bylampa_full .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23ffd700' stroke='%23ffd700' stroke-width='1'%3E%3Cpath d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/%3E%3C/svg%3E\");}.rate--cub .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg width='110' height='104' viewBox='0 0 110 104' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M81.6744 103.11C98.5682 93.7234 110 75.6967 110 55C110 24.6243 85.3757 0 55 0C24.6243 0 0 24.6243 0 55C0 75.6967 11.4318 93.7234 28.3255 103.11C14.8869 94.3724 6 79.224 6 62C6 34.938 27.938 13 55 13C82.062 13 104 34.938 104 62C104 79.224 95.1131 94.3725 81.6744 103.11Z' fill='white'/%3E%3Cpath d='M92.9546 80.0076C95.5485 74.5501 97 68.4446 97 62C97 38.804 78.196 20 55 20C31.804 20 13 38.804 13 62C13 68.4446 14.4515 74.5501 17.0454 80.0076C16.3618 77.1161 16 74.1003 16 71C16 49.4609 33.4609 32 55 32C76.5391 32 94 49.4609 94 71C94 74.1003 93.6382 77.1161 92.9546 80.0076Z' fill='white'/%3E%3Cpath d='M55 89C69.3594 89 81 77.3594 81 63C81 57.9297 79.5486 53.1983 77.0387 49.1987C82.579 54.7989 86 62.5 86 71C86 88.1208 72.1208 102 55 102C37.8792 102 24 88.1208 24 71C24 62.5 27.421 54.7989 32.9613 49.1987C30.4514 53.1983 29 57.9297 29 63C29 77.3594 40.6406 89 55 89Z' fill='white'/%3E%3Cpath d='M73 63C73 72.9411 64.9411 81 55 81C45.0589 81 37 72.9411 37 63C37 53.0589 45.0589 45 55 45C64.9411 45 73 53.0589 73 63Z' fill='white'/%3E%3C/svg%3E\");}.rate--tmdb .source--name {    background-image: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20width%3D%22150%22%20height%3D%22150%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2390cea1%22%2F%3E%3Cstop%20offset%3D%2256%25%22%20stop-color%3D%22%233cbec9%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2300b3e5%22%2F%3E%3C%2FlinearGradient%3E%3Cstyle%3E%20.text-style%20%7B%20%20%20font-weight%3A%20bold%3B%20%20%20fill%3A%20url%28%23grad%29%3B%20%20%20text-anchor%3A%20start%3B%20%20%20dominant-baseline%3A%20middle%3B%20%20%20textLength%3A%20150%3B%20%20%20lengthAdjust%3A%20spacingAndGlyphs%3B%20%20%20font-size%3A%2070px%3B%20%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ctext%20class%3D%22text-style%22%20x%3D%220%22%20y%3D%2250%22%20textLength%3D%22150%22%20lengthAdjust%3D%22spacingAndGlyphs%22%3ETM%3C%2Ftext%3E%3Ctext%20class%3D%22text-style%22%20x%3D%220%22%20y%3D%22120%22%20textLength%3D%22150%22%20lengthAdjust%3D%22spacingAndGlyphs%22%3EDB%3C%2Ftext%3E%3C%2Fsvg%3E\");}.rate--imdb > div:last-child {    background-image: url(\"data:image/svg+xml,%3Csvg fill='%23ffcc00' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'%3E%3C/g%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'%3E%3C/g%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Cpath d='M 0 7 L 0 25 L 32 25 L 32 7 Z M 2 9 L 30 9 L 30 23 L 2 23 Z M 5 11.6875 L 5 20.3125 L 7 20.3125 L 7 11.6875 Z M 8.09375 11.6875 L 8.09375 20.3125 L 10 20.3125 L 10 15.5 L 10.90625 20.3125 L 12.1875 20.3125 L 13 15.5 L 13 20.3125 L 14.8125 20.3125 L 14.8125 11.6875 L 12 11.6875 L 11.5 15.8125 L 10.8125 11.6875 Z M 15.90625 11.6875 L 15.90625 20.1875 L 18.3125 20.1875 C 19.613281 20.1875 20.101563 19.988281 20.5 19.6875 C 20.898438 19.488281 21.09375 19 21.09375 18.5 L 21.09375 13.3125 C 21.09375 12.710938 20.898438 12.199219 20.5 12 C 20 11.800781 19.8125 11.6875 18.3125 11.6875 Z M 22.09375 11.8125 L 22.09375 20.3125 L 23.90625 20.3125 C 23.90625 20.3125 23.992188 19.710938 24.09375 19.8125 C 24.292969 19.8125 25.101563 20.1875 25.5 20.1875 C 26 20.1875 26.199219 20.195313 26.5 20.09375 C 26.898438 19.894531 27 19.613281 27 19.3125 L 27 14.3125 C 27 13.613281 26.289063 13.09375 25.6875 13.09375 C 25.085938 13.09375 24.511719 13.488281 24.3125 13.6875 L 24.3125 11.8125 Z M 18 13 C 18.398438 13 18.8125 13.007813 18.8125 13.40625 L 18.8125 18.40625 C 18.8125 18.804688 18.300781 18.8125 18 18.8125 Z M 24.59375 14 C 24.695313 14 24.8125 14.105469 24.8125 14.40625 L 24.8125 18.6875 C 24.8125 18.886719 24.792969 19.09375 24.59375 19.09375 C 24.492188 19.09375 24.40625 18.988281 24.40625 18.6875 L 24.40625 14.40625 C 24.40625 14.207031 24.394531 14 24.59375 14 Z'/%3E%3C/g%3E%3C/svg%3E\");}.rate--kp > div:last-child {    background-image: url(\"data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='mask0_1_69' style='mask-type:alpha' maskUnits='userSpaceOnUse' x='0' y='0' width='300' height='300'%3E%3Ccircle cx='150' cy='150' r='150' fill='white'/%3E%3C/mask%3E%3Cg mask='url(%23mask0_1_69)'%3E%3Ccircle cx='150' cy='150' r='150' fill='black'/%3E%3Cpath d='M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z' fill='url(%23paint0_radial_1_69)'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id='paint0_radial_1_69' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(89.9999 45) rotate(45) scale(296.985)'%3E%3Cstop offset='0.5' stop-color='%23FF5500'/%3E%3Cstop offset='1' stop-color='%23BBFF00'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E\");}"));
    }
    document.head.appendChild(_0x188991);
    function _0xa00231() {}

    function _0x47a093() {
      var _0xbb435e = document.querySelectorAll(".full-start__rate > div, .info__rate > span");
      for (var _0x26909f = 0x0; _0x26909f < _0xbb435e.length; _0x26909f++) {
        var _0x368716 = _0xbb435e[_0x26909f];
        var _0x8559d3 = parseFloat(_0x368716.textContent.trim());
        if (_0x8559d3 >= 0x0 && _0x8559d3 <= 0x3) {
          _0x368716.style.color = "#e74c3c";
        } else {
          if (_0x8559d3 > 0x3 && _0x8559d3 <= 0x5) {
            _0x368716.style.color = "#e67e22";
          } else {
            if (_0x8559d3 > 0x5 && _0x8559d3 <= 6.5) {
              _0x368716.style.color = "#f1c40f";
            } else {
              if (_0x8559d3 > 6.5 && _0x8559d3 < 0x8) {
                _0x368716.style.color = "#3498db";
              } else if (_0x8559d3 >= 0x8 && _0x8559d3 <= 0xa) {
                _0x368716.style.color = '#2ecc71';
              }
            }
          }
        }
      }
    }
    var _0x299109 = Lampa.Maker.map("Card");
    var _0x382572 = _0x299109.Card.onVisible;
    _0x299109.Card.onVisible = function () {
      _0x382572.apply(this, arguments);
      _0xa00231();
    };
    Lampa.Listener.follow('full', function (_0x2697b5) {
      if (_0x2697b5.type === "complite") {
        _0x47a093();
      }
    });
    var _0x40e97e;
    var _0x148ca7 = new MutationObserver(function (_0x5119e9) {
      clearTimeout(_0x40e97e);
      _0x40e97e = setTimeout(function () {
        _0xa00231();
        _0x47a093();
      }, 0x32);
    });
    _0x148ca7.observe(document.body, {
      'childList': true,
      'subtree': true
    });
  }
  if (window.appready) {
    _0x1f053c();
  } else {
    Lampa.Listener.follow('app', function (_0xc6564c) {
      if (_0xc6564c.type == "ready") {
        _0x1f053c();
      }
    });
  }
})();
