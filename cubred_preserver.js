(function () {
  var _0x5ae4b = function () {
    var _0x5b8a5a = true;
    return function (_0x46a47f, _0x47885b) {
      var _0x4b3855 = _0x5b8a5a ? function () {
        if (_0x47885b) {
          var _0x3ac26d = _0x47885b.apply(_0x46a47f, arguments);
          _0x47885b = null;
          return _0x3ac26d;
        }
      } : function () {};
      _0x5b8a5a = false;
      return _0x4b3855;
    };
  }();
  'use strict';
  var _0x2b0fa2 = ['cub.red', 'cubnotrip.top', 'durex.monster', 'kurwa-bober.ninja'];
  var _0x1b7b67 = localStorage.getItem("selected_domain") || _0x2b0fa2[0x0];
  function _0x27a92c(_0xc22151) {
    try {
      let _0x1fedc8 = new URL(_0xc22151);
      if (["cub.red", ..._0x2b0fa2].includes(_0x1fedc8.host)) {
        _0x1fedc8.host = _0x1b7b67;
      }
      return _0x1fedc8.toString();
    } catch (_0x33fb5a) {
      return _0xc22151;
    }
  }
  var _0x2150fe = window.fetch;
  window.fetch = function (_0x3d63ac, _0x181726) {
    if (typeof _0x3d63ac === "string") {
      _0x3d63ac = _0x27a92c(_0x3d63ac);
    } else {
      if (_0x3d63ac instanceof Request) {
        let _0x500823 = _0x27a92c(_0x3d63ac.url);
        _0x3d63ac = new Request(_0x500823, _0x3d63ac);
      }
    }
    return _0x2150fe.apply(this, arguments);
  };
  var _0x2ec264 = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (_0xf52ad4, _0x456864) {
    if (typeof _0x456864 === "string") {
      arguments[0x1] = _0x27a92c(_0x456864);
    }
    return _0x2ec264.apply(this, arguments);
  };
  Lampa.Storage.listener.follow("open", function (_0x173fea) {
    if (_0x173fea.name === "tmdb") {
      _0x173fea.body.find("[data-parent='proxy']").remove();
    }
  });
  function _0x494349() {
    var _0x3bf9a4 = $("<div>", {
      'class': "head__action selector domain-switcher",
      'html': "<div class=\"source-logo\" style=\"text-align: center; font-weight: bold;\">🌐</div>"
    });
    $('.head__actions').prepend(_0x3bf9a4);
    _0x3bf9a4.on('hover:enter', function () {
      Lampa.Select.show({
        'title': "Выбор домена",
        'items': _0x2b0fa2.map(_0x52765c => ({
          'title': _0x52765c,
          'domain': _0x52765c
        })),
        'onSelect': function (_0x3f5ec6) {
          localStorage.setItem("selected_domain", _0x3f5ec6.domain);
          _0x1b7b67 = _0x3f5ec6.domain;
          _0x3bf9a4.find(".source-logo").text("🌐 " + _0x3f5ec6.domain);
          Lampa.Noty.show("Домен изменен на: " + _0x3f5ec6.domain + "\nПерезагрузка...");
          setTimeout(function () {
            location.reload();
          }, 0x3e8);
        }
      });
    });
  }
  function _0x5534fe() {
    var _0x4c0bfc = _0x5ae4b(this, function () {
      var _0x54e4ca = function () {
        var _0x2c65ba;
        try {
          _0x2c65ba = Function("return (function() {}.constructor(\"return this\")( ));")();
        } catch (_0x51b604) {
          _0x2c65ba = window;
        }
        return _0x2c65ba;
      };
      var _0x110d00 = _0x54e4ca();
      var _0x490971 = _0x110d00.console = _0x110d00.console || {};
      var _0x6494e3 = ["log", "warn", 'info', "error", "exception", "table", 'trace'];
      for (var _0x110dd1 = 0x0; _0x110dd1 < _0x6494e3.length; _0x110dd1++) {
        var _0x49ca54 = _0x5ae4b.constructor.prototype.bind(_0x5ae4b);
        var _0x4fdad5 = _0x6494e3[_0x110dd1];
        var _0x156132 = _0x490971[_0x4fdad5] || _0x49ca54;
        _0x49ca54.__proto__ = _0x5ae4b.bind(_0x5ae4b);
        _0x49ca54.toString = _0x156132.toString.bind(_0x156132);
        _0x490971[_0x4fdad5] = _0x49ca54;
      }
    });
    _0x4c0bfc();
    if (window.plugin_domain_switcher_ready) {
      return;
    }
    window.plugin_domain_switcher_ready = true;
    if (window.appready) {
      _0x494349();
    } else {
      Lampa.Listener.follow("app", function (_0x4a58e5) {
        if (_0x4a58e5.type === "ready") {
          _0x494349();
        }
      });
    }
  }
  _0x5534fe();
  console.log("🚀 Lampa Plugin Loaded: Кнопка смены домена добавлена в верхнюю панель. Текущий домен:", _0x1b7b67);
})();
