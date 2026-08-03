"use strict";
(function() {
  var Me = Object.defineProperty,
    Ue = Object.defineProperties;
  var ze = Object.getOwnPropertyDescriptors;
  var ne = Object.getOwnPropertySymbols;
  var Fe = Object.prototype.hasOwnProperty,
    Ye = Object.prototype.propertyIsEnumerable;
  var se = function(a, e, t) { return e in a ? Me(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t },
    A = function(a, e) {
      for (var t in e || (e = {})) Fe.call(e, t) && se(a, t, e[t]);
      if (ne)
        for (var t of ne(e)) Ye.call(e, t) && se(a, t, e[t]);
      return a
    },
    D = function(a, e) { return Ue(a, ze(e)) };
  var l = function(a, e, t) {
    return new Promise(function(o, n) {
      var r = function(c) {
          try { i(t.next(c)) } catch (g) { n(g) }
        },
        s = function(c) {
          try { i(t.throw(c)) } catch (g) { n(g) }
        },
        i = function(c) { return c.done ? o(c.value) : Promise.resolve(c.value).then(r, s) };
      i((t = t.apply(a, e)).next())
    })
  };

  // Android TV Network Helper
  var AndroidTVNetwork = {
    fetchWithTimeout: function(url, options, timeout) {
      if (options === void 0) options = {};
      if (timeout === void 0) timeout = 45000;
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort() }, timeout);

      try {
        var host = url.match(/^https?:\/\/[^\/]+/);
        host = host ? host[0] : '';

        var headers = {
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };

        if (Lampa.Platform && Lampa.Platform.is && Lampa.Platform.is('android')) {
          headers['Origin'] = host;
          headers['Referer'] = host + '/';
          headers['User-Agent'] = 'Mozilla/5.0 (Android TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
        }

        if (options.headers) {
          for (var key in options.headers) {
            if (options.headers.hasOwnProperty(key)) {
              headers[key] = options.headers[key];
            }
          }
        }

        var fetchOptions = {
          method: options.method || 'GET',
          headers: headers,
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'include'
        };

        if (options.body) {
          fetchOptions.body = options.body;
          if (!(options.body instanceof FormData)) {
            fetchOptions.headers['Content-Type'] = 'application/json';
          } else {
            delete fetchOptions.headers['Content-Type'];
          }
        }

        var response = fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout for ' + url);
        }
        throw error;
      }
    },

    postFormData: function(url, formData, options) {
      if (options === void 0) options = {};
      return this.fetchWithTimeout(url, {
        method: 'POST',
        headers: options.headers || {},
        body: formData
      });
    },

    postJSON: function(url, data, options) {
      if (options === void 0) options = {};
      return this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },

    getJSON: function(url, options) {
      if (options === void 0) options = {};
      return this.fetchWithTimeout(url, {
        method: 'GET'
      }).then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        var contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        }
        return response.text();
      });
    }
  };

  var re = {
    downloads: { ru: "Загрузки", en: "Downloads" },
    download: { ru: "Скачать", en: "Download" },
    "download-button.added": { ru: "Торрент добавлен", en: "Torrent added" },
    "downloads-tab.connected": { ru: "Подключено", en: "Connected" },
    "downloads-tab.disconnected": { ru: "Нет подключения", en: "Disconnected" },
    "downloads-tab.freespace": { ru: "Свободное место: ", en: "Free space: " },
    "download-card.time.0": { en: "d", ru: "д" },
    "download-card.time.1": { en: "h", ru: "ч" },
    "download-card.time.2": { en: "min", ru: "мин" },
    "download-card.time.3": { en: "s", ru: "сек" },
    "download-card.status.0": { en: "stopped", ru: "пауза" },
    "download-card.status.1": { en: "queued to verify local data", ru: "ждёт проверки" },
    "download-card.status.2": { en: "verifying local data", ru: "проверка данных" },
    "download-card.status.3": { en: "queued to download", ru: "ждёт загрузки" },
    "download-card.status.4": { en: "downloading", ru: "загрузка" },
    "download-card.status.5": { en: "queued to seed", ru: "ждёт раздачи" },
    "download-card.status.6": { en: "seeding", ru: "раздаёт" },
    "download-card.status.7": { en: "isolated", ru: "нет пиров" },
    "download-card.status.8": { en: "stalled", ru: "простаивает" },
    "download-card.status.9": { en: "error", ru: "ошибка" },
    "download-card.status.10": { en: "allocating", ru: "выделение места" },
    "download-card.status.11": { en: "moving", ru: "перемещение" },
    "download-card.status.12": { en: "unknown", ru: "неизвестно" },
    "download-card.status.13": { en: "initializing", ru: "инициализация" },
    "download-card.status.14": { en: "completed", ru: "завершено" },
    "download-card.size.0": { en: "B", ru: "Б" },
    "download-card.size.1": { en: "KB", ru: "КБ" },
    "download-card.size.2": { en: "MB", ru: "МБ" },
    "download-card.size.3": { en: "GB", ru: "ГБ" },
    "download-card.size.4": { en: "TB", ru: "ТБ" },
    "actions.title": { ru: "Действия", en: "Actions" },
    "actions.open": { ru: "Воспроизвести", en: "Play" },
    "actions.open-card": { ru: "Открыть карточку фильма", en: "Open movie card" },
    "actions.select-file": { ru: "Файлы:", en: "Files:" },
    "actions.pause": { ru: "Пауза", en: "Pause" },
    "actions.resume": { ru: "Продолжить", en: "Resume" },
    "actions.hide": { ru: "Скрыть", en: "Hide" },
    "actions.delete": { ru: "Удалить", en: "Delete" },
    "actions.delete-with-file": { ru: "Удалить торрент и файл", en: "Delete torrent and file" },
    "actions.delete-torrent": { ru: "Удалить торрент", en: "Delete torrent" },
    "actions.delete-torrent-keep-file": { ru: "Удалить торрент, но оставить файл", en: "Delete torrent but keep file" },
    "background-worker.connection-success": { ru: "Подключение к серверу успешно установлено", en: "Connection to server successfully established" },
    "background-worker.error-detected": { ru: "Обнаружена ошибка. Подробнее в консоли", en: "An error has been detected. See console for details" }
  };

  var y = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="4 4 16 16">\n    <path fill="currentcolor" d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z" />\n</svg>';

  var d = { type: "other", version: "2.6.0", author: "https://github.com/kvart714", name: "Torrent Downloader", description: "Transmission RPC client", component: "t-downloader" };

  var ie = d.component + ".torrents.data.v2",
    w = {
      data: Lampa.Storage.get(ie, { torrents: [], info: { freeSpace: 0 } }),
      getData: function() { return this.data },
      getMovie: function(e) {
        if (!e) return null;
        var t = this.data.torrents.filter(function(o) { return o.id === e });
        return t.length > 0 ? t.reduce(function(o, n) { return o.percentDone >= n.percentDone ? o : n }) : null
      },
      getByHash: function(e) { var t; return (t = this.data.torrents.find(function(o) { return o.hash === e })) != null ? t : null },
      ensureMovie: function(e) {
        var t = this.data.torrents.filter(function(o) { return o.externalId === e.externalId });
        return t.length > 0 ? t.reduce(function(o, n) { return o.percentDone >= n.percentDone ? o : n }) : e
      },
      setData: function(e) {
        return l(this, null, function*() {
          this.data = e;
          Lampa.Storage.set(ie, this.data);
        })
      }
    };

  var de = '<div class="selector download-card full-start__button d-updatable" id="download-card-{id}">\n  <div class="download-card__file-info">\n    <span class="file-name">\n      <span data-key="fileName">{fileName}</span>\n    </span>\n    <span class="speed">\n      <span data-key="speed">{speed}</span>\n    </span>\n  </div>\n  <div class="download-card__progress-bar">\n    <div class="download-card__progress-bar-progress" style="width: {percent}"></div>\n  </div>\n  <div class="download-card__stats">\n    <span class="downloaded">\n      <span data-key="downloadedSize">{downloadedSize}</span> / \n      <span data-key="totalSize">{totalSize}</span>\n    </span>\n    <span class="percent">\n      <span data-key="percent">{percent}</span>\n    </span>\n    <span class="eta">\n      <span data-key="eta">{eta}</span>\n    </span>\n  </div>\n</div>\n';

  var le = '.download-card {\n  all: unset;\n  display: block;\n  width: 80%;\n  height: auto;\n  margin: 0;\n  margin-top: 0.75em;\n  padding: 0.75em;\n  background-color: rgba(0, 0, 0, 0.3);\n  color: white;\n  transition: background-color 0.3s;\n  border-radius: 1em;\n}\n.download-card__file-info {\n  display: flex;\n  justify-content: space-between;\n  margin-bottom: 0.5em;\n}\n.download-card__file-info .file-name, .download-card__file-info .speed {\n  font-size: 1.5em;\n}\n.download-card__progress-bar {\n  height: 6px;\n  background: #ddd;\n  border-radius: 6px;\n  overflow: hidden;\n  margin-top: 0.7em;\n  margin-bottom: 0.5em;\n}\n.download-card__progress-bar-progress {\n  height: 100%;\n  background: linear-gradient(90deg, #4a90e2, #357ab8);\n  transition: width 0.5s ease;\n}\n.download-card__stats {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  gap: 0.5em;\n  font-size: 1.1em;\n}\n.download-card__stats .speed {\n  position: absolute;\n  top: 0;\n  right: 0;\n  font-size: inherit;\n}\n.download-card__stats .percent {\n  position: absolute;\n  bottom: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  font-size: inherit;\n}\n.download-card__stats .downloaded {\n  text-align: left;\n  font-size: inherit;\n}\n.download-card__stats .eta {\n  position: absolute;\n  bottom: 0;\n  right: 0;\n  font-size: inherit;\n}';

  function h() {
    var a = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      a[_i] = arguments[_i];
    }
    console.log.apply(console, [d.name].concat(a));
  }

  function ce() {
    var a = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      a[_i] = arguments[_i];
    }
    console.warn.apply(console, [d.name].concat(a));
  }

  var pe = d.component + ".movieinfo.data.v4",
    b = {
      requestedIds: new Set(),
      diskCache: Lampa.Storage.get(pe, {}),
      memoryCache: {},
      getMovieInfo: function(e) {
        if (!e.id) return null;
        var t = e.type + "_" + e.id;
        if (this.memoryCache[t]) return this.memoryCache[t];
        if (!this.requestedIds.has(t)) {
          this.requestedIds.add(t);
          this.loadContentInfo(e.id, e.type).then(function(o) {
            if (o) {
              this.memoryCache[t] = o;
              this.diskCache[t] = o;
              Lampa.Storage.set(pe, this.diskCache);
            } else {
              this.requestedIds.delete(t);
            }
          }.bind(this)).catch(function() { this.requestedIds.delete(t) }.bind(this));
        }
        return this.diskCache[t] || null;
      },
      loadContentInfo: function(e, t, o) {
        if (o === void 0) o = !0;
        return l(this, null, function*() {
          var n = Lampa.Storage.field("tmdb_lang") || Lampa.Storage.field("language") || "ru",
            r = Lampa.Utils.addUrlComponent(Lampa.TMDB.api(t + "/" + e + "?email="), "api_key=" + Lampa.TMDB.key() + "&language=" + n + "&certification_country=ru&certification.lte=18");
          try {
            var s = yield AndroidTVNetwork.fetchWithTimeout(r);
            if (s.ok) {
              var i = yield s.json();
              if ((i != null && i.title) || (i != null && i.name)) return i
            } else if (o) {
              h("Failed to load '" + t + "_" + e + "', status: " + s.status + ". Trying fallback type.");
              var i2 = t === "movie" ? "tv" : "movie";
              return yield this.loadContentInfo(e, i2, !1)
            }
          } catch (s) { ce("Failed to load " + t + " info for id " + e + ":", s) }
          return null
        })
      }
    };

  var p = { STOPPED: 0, CHECK_PENDING: 1, CHECKING: 2, DOWNLOAD_PENDING: 3, DOWNLOADING: 4, SEED_PENDING: 5, SEEDING: 6, ISOLATED: 7, STALLED: 8, ERROR: 9, ALLOCATING: 10, MOVING: 11, UNKNOWN: 12, INITIALIZATION: 13 };

  function me(a) {
    switch (a) {
      case 0:
        return p.STOPPED;
      case 1:
        return p.CHECK_PENDING;
      case 2:
        return p.CHECKING;
      case 3:
        return p.DOWNLOAD_PENDING;
      case 4:
        return p.DOWNLOADING;
      case 5:
        return p.SEED_PENDING;
      case 6:
        return p.SEEDING;
      default:
        return p.UNKNOWN
    }
  }

  function ue(a) {
    switch (a) {
      case "allocating":
        return p.ALLOCATING;
      case "checkingDL":
      case "checkingUP":
      case "checkingResumeData":
        return p.CHECKING;
      case "queuedDL":
        return p.DOWNLOAD_PENDING;
      case "queuedUP":
        return p.SEED_PENDING;
      case "downloading":
      case "forcedMetaDL":
        return p.DOWNLOADING;
      case "uploading":
      case "forcedUP":
        return p.SEEDING;
      case "pausedDL":
      case "pausedUP":
      case "stoppedDL":
      case "stoppedUP":
        return p.STOPPED;
      case "stalledDL":
      case "stalledUP":
        return p.STALLED;
      case "missingFiles":
        return p.ISOLATED;
      case "moving":
        return p.MOVING;
      case "error":
        return p.ERROR;
      case "metaDL":
      case "forcedDL":
        return p.INITIALIZATION;
      default:
        return p.UNKNOWN
    }
  }

  function L(a, e) {
    if (e === void 0) e = 2;
    if (a === 0) return "0";
    var t = 1024,
      o = e < 0 ? 0 : e,
      n = Math.floor(Math.log(a) / Math.log(t));
    return parseFloat((a / Math.pow(t, n)).toFixed(o)) + " " + Lampa.Lang.translate("download-card.size." + n)
  }

  function Be(a) {
    var e = Lampa.Lang.translate("download-card.time.3");
    return L(a) + "/" + e
  }

  function Ve(a) {
    var e = Math.floor(a / 86400),
      t = Math.floor(a % 86400 / 3600),
      o = Math.floor(a % 3600 / 60),
      n = Math.floor(a % 60);
    return [e, t, o, n].map(function(s, i) { return s ? s + Lampa.Lang.translate("download-card.time." + i) : null }).filter(Boolean).slice(0, 2).join(" ")
  }

  function je(a) {
    var e = new Date(a || "");
    return isNaN(e.getTime()) ? "" : e.getFullYear()
  }

  function v(a) {
    var e = b.getMovieInfo(a),
      t = q[Lampa.Storage.get(K)] || q[1];
    return {
      id: a.id + "_" + a.externalId,
      torrentName: a.name,
      title: (e == null ? void 0 : e.title) || (e == null ? void 0 : e.name) || (a.status === p.INITIALIZATION ? "Initialization" : a.name),
      poster: (e != null && e.poster_path) ? Lampa.TMDB.image("t/p/" + t + e.poster_path) : "",
      year: je((e == null ? void 0 : e.release_date) || (e == null ? void 0 : e.first_air_date)),
      fileName: (e != null && e.title) || (e != null && e.name) ? a.name : "",
      percent: (100 * a.percentDone).toFixed(2) + "%",
      speed: a.speed > 0 ? Be(a.speed) : "",
      downloadedSize: L(a.percentDone * a.totalSize),
      totalSize: L(a.totalSize),
      eta: a.status === p.DOWNLOADING ? Ve(a.eta) : a.status === p.STALLED && a.percentDone === 1 ? Lampa.Lang.translate("download-card.status.14") : Lampa.Lang.translate("download-card.status." + a.status),
      status: a.status === p.DOWNLOADING ? "downloading" : a.percentDone === 1 ? "completed" : "paused",
      seeders: (a.seeders || 0) + " (" + (a.activeSeeders || 0) + ")"
    }
  }

  var fe = d.component + ".torrents.data.views.",
    T = {
      getViews: function(e) {
        var t = Lampa.Storage.get(fe + e.externalId);
        return t && typeof t == "object" ? t : {}
      },
      rememberView: function(e, t) {
        var o = this.getViews(e);
        o.last = t;
        o[t] = !0;
        Lampa.Storage.set(fe + e.externalId, o);
      }
    };

  function G(a, e, t) {
    return l(this, null, function*() {
      var o = m.getClient(),
        n = yield o.getFiles(e),
        r = o.url + "/downloads/" + encodeURI(e.path) + "/";
      if (n.length < 1) throw new Error("No files found in torrent");
      if (n.length === 1) {
        ge({ title: t || e.name, url: r + encodeURI(n[0].name), torrent_hash: e.hash });
      } else if (n.length > 1) {
        var g, s = T.getViews(e),
          c = n.sort(function(f, E) { return f.name.localeCompare(E.name, void 0, { numeric: !0, sensitivity: "base" }) }).map(function(f, E) { return { title: f.name.split(/[\\/]/).pop() || f.name, name: f.name, url: r + encodeURI(f.name), picked: !!s[f.name], selected: s.last === f.name, torrent_hash: e.hash } });
        Lampa.Select.show({
          title: Lampa.Lang.translate("actions.select-file"),
          items: c,
          onSelect: function(f) {
            return l(this, null, function*() {
              T.rememberView(e, f.name);
              ge({ playlist: c, title: t || e.name, url: f.url, torrent_hash: e.hash });
            })
          },
          onBack: function() { Lampa.Controller.toggle(a) }
        });
      }
    })
  }

  function ge(a) { var e; h("Player request " + a.url, a); Lampa.Player.play(a); Lampa.Player.playlist((e = a.playlist) != null ? e : []) }

  function W(a) { a.status === p.STOPPED ? m.getClient().startTorrent(a) : m.getClient().stopTorrent(a) }

  function S(a, e, t, o) {
    e = w.ensureMovie(e);
    Lampa.Select.show({
      title: Lampa.Lang.translate("actions.title"),
      items: [
        { title: Lampa.Lang.translate("actions.open"), onSelect: function() { return l(this, null, function*() { G(a, e, t) }) } },
        (a === "downloads-tab" && e.id ? [{ title: Lampa.Lang.translate("actions.open-card"), onSelect: function() { return l(this, null, function*() { Lampa.Activity.push({ component: "full", id: e.id, method: e.type, card: e }) }) } }] : []),
        { title: e.status === p.STOPPED ? Lampa.Lang.translate("actions.resume") : Lampa.Lang.translate("actions.pause"), onSelect: function() { W(e);
            Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.hide"), onSelect: function() { m.getClient().hideTorrent(e);
            o == null || o(e);
            Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.delete"), subtitle: Lampa.Lang.translate("actions.delete-with-file"), onSelect: function() { m.getClient().removeTorrent(e, !0);
            o == null || o(e);
            Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.delete-torrent"), subtitle: Lampa.Lang.translate("actions.delete-torrent-keep-file"), onSelect: function() { m.getClient().removeTorrent(e, !1);
            o == null || o(e);
            Lampa.Controller.toggle(a) } }
      ],
      onBack: function() { Lampa.Controller.toggle(a) }
    });
  }

  function C(a, e, t, o) { var r; e = (r = w.getByHash(e.hash)) != null ? r : e; var n = Lampa.Storage.field(B); n == 1 ? e.percentDone === 1 ? G(a, e, t) : W(e) : n == 2 ? G(a, e, t) : n == 3 ? W(e) : S(a, e, t, o) }

  function V(a, e) {
    var t = $(Lampa.Template.get("download-card", v(a)));
    $(".full-start-new__right").append(t);
    t.on("hover:enter", function() { C("full_start", a, (e == null ? void 0 : e.title) || (e == null ? void 0 : e.original_title)) });
    t.on("hover:long", function() { S("full_start", a, (e == null ? void 0 : e.title) || (e == null ? void 0 : e.original_title)) });
  }

  function we(a) {
    var e = v(a),
      t = document.getElementById("download-card-" + e.id);
    if (t) {
      for (var o in e) { var n = t.querySelector('[data-key="' + o + '"]');
        n && (n.textContent = e[o]) }
      t.querySelector(".download-card__progress-bar-progress").setAttribute("style", "width: " + e.percent + ";");
    }
  }

  function he() {
    Lampa.Template.add("download-card", de);
    $("body").append("<style>" + le + "</style>");
    Lampa.Listener.follow("full", function(a) { if (a.type === "complite") { var e = w.getMovie(a.data.movie.id);
        e && V(e, a.data.movie) } });
  }

  var _e = '<div class="download-circle d-updatable download-circle-{status}-{id}">\n    <div class="download-circle__circle">\n        <svg class="download-circle__circle-svg" xmlns="http://www.w3.org/2000/svg">\n            <circle\n                fill="rgba(0, 0, 0, 0.60)"\n                r="17px"\n                cx="20"\n                cy="20"\n            ></circle>\n            <circle\n                class="download-circle__full_{status}"\n                stroke-width="2px"\n                r="12px"\n                cx="20"\n                cy="20"\n            ></circle>\n            <circle\n                class="download-circle__partial_{status}"\n                fill="none"\n                stroke="#fff"\n                stroke-width="2px"\n                stroke-dasharray="100"\n                stroke-dashoffset="{progress}"\n                transition="stroke-dasharray 0.7s linear 0s"\n                r="12px"\n                cx="20"\n                cy="20"\n                pathlength="100"\n            ></circle>\n        </svg>\n    </div>\n    <div class="download-circle__down-arrow">\n        <svg\n            class="download-circle__down-arrow-svg_{status}"\n            xmlns="http://www.w3.org/2000/svg"\n        >\n            <path\n                d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z"\n            />\n        </svg>\n        <svg\n            class="download-circle__down-arrow-svg-animated_{status}"\n            fill="white"\n            xmlns="http://www.w3.org/2000/svg"\n        >\n            <path\n                d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z"\n            />\n        </svg>\n    </div>\n</div>\n';

  var be = '.download-complete,\n.download-circle {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 40px;\n  height: 40px;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%) scale(2);\n}\n.download-complete__circle,\n.download-circle__circle {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 40px;\n  height: 40px;\n  cursor: pointer;\n  position: relative;\n}\n.download-complete__circle-svg,\n.download-circle__circle-svg {\n  transform: rotate(-90deg);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.download-complete__full_in-progress,\n.download-circle__full_in-progress {\n  fill: none;\n  stroke: rgba(255, 255, 255, 0.5);\n}\n.download-complete__full_complete,\n.download-circle__full_complete {\n  fill: white;\n  stroke: none;\n}\n.download-complete__partial_complete,\n.download-circle__partial_complete {\n  display: none;\n}\n.download-complete__partial_in-progress,\n.download-circle__partial_in-progress {\n  transition: stroke-dashoffset 0.5s ease;\n}\n.download-complete__down-arrow,\n.download-circle__down-arrow {\n  position: absolute;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  overflow: hidden;\n}\n.download-complete__down-arrow svg,\n.download-circle__down-arrow svg {\n  width: 24px;\n  height: 24px;\n}\n.download-complete__down-arrow-svg_in-progress,\n.download-circle__down-arrow-svg_in-progress {\n  fill: rgba(255, 255, 255, 0.5);\n}\n.download-complete__down-arrow-svg_complete,\n.download-circle__down-arrow-svg_complete {\n  fill: "white";\n}\n.download-complete__down-arrow-svg-animated_in-progress,\n.download-circle__down-arrow-svg-animated_in-progress {\n  position: absolute;\n  clip-path: inset(0 0 100% 0);\n  animation: pulseColor 2s ease-out infinite;\n}\n.download-complete__down-arrow-svg-animated_complete,\n.download-circle__down-arrow-svg-animated_complete {\n  display: none;\n}\n\n@keyframes pulseColor {\n  0% {\n    clip-path: inset(0 0 100% 0);\n  }\n  30% {\n    clip-path: inset(0 0 0 0);\n  }\n  70% {\n    clip-path: inset(0 0 0 0);\n  }\n  100% {\n    clip-path: inset(100% 0 0 0);\n  }\n}';

  function ve(a, e) { var o; var t = $(e); if (!t.find(".download-circle").length) { var n = (o = a.percentDone) != null ? o : 0, r = Lampa.Template.get("download-circle", { id: a.id, status: n === 1 ? "complete" : "in-progress", progress: 100 * (1 - n) });
      t.find(".card__vote").after(r) } }

  function Je(a, e) { var t = w.getMovie(a);
    t && ve(t, e) }

  function ye(a) { var o; var e = document.querySelectorAll(".download-circle-in-progress-" + a.id); if (!e.length) return; var t = (o = a.percentDone) != null ? o : 0;
    e.forEach(function(n) { if (t === 1) { var r = n.parentElement;
        n.remove();
        ve(a, r) } else { var r = n.querySelector(".download-circle__partial_in-progress");
        r == null || r.setAttribute("stroke-dashoffset", "" + (100 * (1 - t))) } }) }

  function Le() {
    Lampa.Template.add("download-circle", _e);
    $("body").append("<style>" + be + "</style>");
    Lampa.Listener.follow("line", function(a) { var e, t; if (a.type === "append")
        for (var o = 0; o < a.items.length; o++) { var item = a.items[o];
          (e = item == null ? void 0 : item.data) != null && e.id && Je((t = item == null ? void 0 : item.data) == null ? void 0 : t.id, item.card) } });
  }

  var Te = '<div class="downloads-tab__item downloads-tab__item--mini selector {status}" data-id="{id}">\n  <div class="downloads-tab__main">\n    <div class="downloads-tab__file"><span data-field="torrentName">{torrentName}</span></div>\n\n    <div class="downloads-tab__footer">\n      <div class="downloads-tab__meta-top">\n        <div class="downloads-tab__meta-left">\n          <span class="downloads-tab__meta-text" data-field="percent">{percent}</span>\n          <span> • </span>\n          <span class="downloads-tab__meta-text" data-field="seeders">{seeders}</span>\n        </div>\n        <span class="downloads-tab__speed"><span data-field="speed">{speed}</span></span>\n      </div>\n\n      <div class="downloads-tab__progress-wrapper">\n        <div class="downloads-tab__progress-fill" style="width: {percent};"></div>\n      </div>\n\n      <div class="downloads-tab__meta-bottom">\n        <div class="downloads-tab__sizes">\n          <span class="downloads-tab__meta-downloaded" data-field="downloadedSize">{downloadedSize}</span>\n          <span class="downloads-tab__meta-slash"> / </span>\n          <span class="downloads-tab__meta-total" data-field="totalSize">{totalSize}</span>\n        </div>\n        <span class="downloads-tab__eta" data-field="eta">{eta}</span>\n      </div>\n    </div>\n  </div>\n</div>\n';

  var Se = '<div class="downloads-tab__item selector {status}" data-id="{id}">\n  <div class="downloads-tab__poster" style="background-image: url(\'{poster}\')"></div>\n  <div class="downloads-tab__main">\n    <div class="downloads-tab__movie"><span data-field="title">{title}</span></div>\n    <div class="downloads-tab__year"><span data-field="year">{year}</span></div>\n    <div class="downloads-tab__file"><span data-field="fileName">{fileName}</span></div>\n\n    <div class="downloads-tab__footer">\n      <div class="downloads-tab__meta-top">\n        <div class="downloads-tab__meta-left">\n          <span class="downloads-tab__meta-text" data-field="percent">{percent}</span>\n          <span> • </span>\n          <span class="downloads-tab__meta-text" data-field="seeders">{seeders}</span>\n        </div>\n        <span class="downloads-tab__speed"><span data-field="speed">{speed}</span></span>\n      </div>\n\n      <div class="downloads-tab__progress-wrapper">\n        <div class="downloads-tab__progress-fill" style="width: {percent};"></div>\n      </div>\n\n      <div class="downloads-tab__meta-bottom">\n        <div class="downloads-tab__sizes">\n          <span class="downloads-tab__meta-downloaded" data-field="downloadedSize">{downloadedSize}</span>\n          <span class="downloads-tab__meta-slash"> / </span>\n          <span class="downloads-tab__meta-total" data-field="totalSize">{totalSize}</span>\n        </div>\n        <span class="downloads-tab__eta" data-field="eta">{eta}</span>\n      </div>\n    </div>\n  </div>\n</div>\n';

  var Ie = '<div class="downloads-tab__list d-updatable">\n  <div class="downloads-tab__header-title-wrapper">\n    <div class="downloads-tab__header-title">{server}</div>\n    <div class="downloads-tab__header-size">{freeSpace}</div>\n  </div>\n  <div class="downloads-tab__rows"></div>\n</div>\n';

  var xe = '@charset "UTF-8";\n.downloads-tab__list {\n  --color-text-primary: #dbdbdb;\n  --color-text-muted: #b1b1b1;\n  --fs-header: 1.4em;\n  --fs-title: 1.6em;\n  --fs-file: 1em;\n  --fs-body: 1.2em;\n  --sp-after-title: 0.3em;\n  --sp-between-text-and-progress: 0.5em;\n  --accent-violet: #b67dff;\n  --accent-violet-light: #c698ff;\n  --card-bg-color: 24, 24, 24;\n  --card-bg-alpha: 0.8;\n  --card-bg-alpha-hover: 0.6;\n  --poster-scale-hover: 1.04;\n  color: var(--color-text-muted);\n  padding: 1em;\n}\n.downloads-tab__list .downloads-tab__header-title-wrapper {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1em;\n  font-size: var(--fs-header);\n  font-weight: 700;\n  color: var(--color-text-primary);\n}\n.downloads-tab__list .downloads-tab__rows {\n  display: flex;\n  gap: 1em;\n  align-items: flex-start;\n}\n.downloads-tab__col {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 1em;\n}\n.downloads-tab__group {\n  display: flex;\n  flex-direction: column;\n  gap: 0.6em;\n}\n.downloads-tab__group > .downloads-tab__item:first-child {\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.downloads-tab__group > .downloads-tab__item--mini {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.downloads-tab__group > .downloads-tab__item--mini:last-child {\n  border-bottom-left-radius: 0.6em;\n  border-bottom-right-radius: 0.6em;\n}\n.downloads-tab__item {\n  display: grid;\n  grid-template-columns: 9em 1fr;\n  gap: 1em;\n  padding: 0.8em;\n  border-radius: 0.6em;\n  background: rgba(var(--card-bg-color), var(--card-bg-alpha));\n  box-shadow: 0 0.5em 1.2em rgba(0, 0, 0, 0.5);\n  transition: background 0.15s ease, box-shadow 0.15s ease;\n  outline: 1px solid rgba(255, 255, 255, 0.062745098);\n}\n.downloads-tab__item:hover, .downloads-tab__item.focus, .downloads-tab__item:focus-visible {\n  outline: 3px solid var(--accent-violet);\n  background: rgba(var(--card-bg-color), var(--card-bg-alpha-hover));\n}\n.downloads-tab__item.downloading .downloads-tab__meta-left {\n  display: inline;\n}\n.downloads-tab__item.completed .downloads-tab__meta-downloaded,\n.downloads-tab__item.completed .downloads-tab__meta-slash {\n  display: none;\n}\n.downloads-tab__item:hover .downloads-tab__poster, .downloads-tab__item.focus .downloads-tab__poster, .downloads-tab__item:focus-visible .downloads-tab__poster {\n  transform: scale(var(--poster-scale-hover));\n}\n.downloads-tab__item--mini {\n  grid-template-columns: 1fr;\n  padding-left: 10.8em;\n}\n.downloads-tab__item--mini .downloads-tab__main {\n  min-height: unset;\n  grid-template-rows: auto auto;\n}\n.downloads-tab__poster {\n  position: relative;\n  width: 9em;\n  height: 13.5em;\n  border-radius: 0.6em;\n  overflow: hidden;\n  background-color: rgb(35, 35, 35);\n  background-position: center;\n  background-repeat: no-repeat;\n  background-size: cover;\n  transition: transform 0.2s ease;\n}\n.downloads-tab__poster::after {\n  content: "POSTER";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  font-size: 1em;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  color: rgba(255, 255, 255, 0.08);\n  pointer-events: none;\n  user-select: none;\n}\n.downloads-tab__main {\n  display: grid;\n  grid-template-columns: 1fr;\n  grid-template-rows: auto auto 1fr auto;\n  min-height: 13.5em;\n}\n.downloads-tab__movie {\n  font-size: var(--fs-title);\n  font-weight: 700;\n  color: var(--color-text-primary);\n  line-height: 1.2;\n  margin-bottom: var(--sp-after-title);\n  word-break: break-word;\n  overflow-wrap: break-word;\n}\n.downloads-tab__year {\n  color: var(--color-text-muted);\n  margin-bottom: 0.8em;\n  font-weight: bold;\n}\n.downloads-tab__file {\n  font-size: var(--fs-file);\n  font-weight: 500;\n  color: #727272;\n  margin-bottom: var(--sp-between-text-and-progress);\n  overflow-wrap: anywhere;\n}\n.downloads-tab__footer {\n  align-self: end;\n  display: grid;\n  row-gap: var(--sp-between-text-and-progress);\n  font-size: var(--fs-body);\n  font-weight: 500;\n  color: var(--color-text-muted);\n}\n.downloads-tab__meta-top {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 0.8em;\n}\n.downloads-tab__meta-left {\n  display: none;\n  white-space: nowrap;\n}\n.downloads-tab__speed {\n  font-weight: 600;\n  color: var(--accent-violet);\n}\n.downloads-tab__progress-wrapper {\n  height: 0.5em;\n  border-radius: 10px;\n  overflow: hidden;\n  background: #2a2a2a;\n}\n.downloads-tab__progress-fill {\n  height: 100%;\n  background: linear-gradient(90deg, var(--accent-violet), var(--accent-violet-light));\n  will-change: width;\n  transition: width 0.25s ease;\n}\n.downloads-tab__meta-bottom {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  align-items: center;\n  column-gap: 0.8em;\n}\n.downloads-tab__sizes {\n  white-space: nowrap;\n}\n.downloads-tab__eta {\n  font-weight: 600;\n  color: var(--color-text-primary);\n  white-space: nowrap;\n}\n.downloads-tab__meta-total {\n  color: var(--accent-violet);\n}\n@media (orientation: portrait) {\n  .downloads-tab__list .downloads-tab__rows {\n    flex-direction: column;\n    align-items: stretch;\n  }\n  .downloads-tab__list .downloads-tab__header-title-wrapper {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 0.3em;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .downloads-tab__item, .downloads-tab__poster, .downloads-tab__progress-fill {\n    transition: none;\n  }\n}';

  var Ee = '<li class="menu__item selector">\n    <div class="menu__ico">{icon}</div>\n    <div class="menu__text">{text}</div>\n</li>\n';

  function tt(a) {
    var e = new Map();
    return a.forEach(function(t, o) {
      var n = t.id > 0 ? String(t.id) : "solo_" + t.externalId;
      e.has(n) || e.set(n, { torrents: [], lastIndex: o });
      var r = e.get(n);
      r.torrents.push(t);
      r.lastIndex = Math.max(r.lastIndex, o);
    }), Array.from(e.values()).sort(function(t, o) { return t.lastIndex - o.lastIndex }).map(function(t) { return Array.from(t.torrents).sort(function(o, n) { return n.totalSize - o.totalSize }) });
  }

  var j = function() {
    function j() {
      this.html = $("<div></div>");
      this.lastFocusedElement = null;
    }
    j.prototype.create = function() {
      m.isConnected || _.start();
      this.scroll = new Lampa.Scroll({ mask: !0, over: !0, step: 200 });
      var e = w.getData(),
        t = m.isConnected ? Lampa.Lang.translate("downloads-tab.connected") + " (" + m.getClient().url + ")" : Lampa.Lang.translate("downloads-tab.disconnected"),
        o = $(Lampa.Template.get("downloads-tab", { server: t, freeSpace: Lampa.Lang.translate("downloads-tab.freespace") + L(e.info.freeSpace) }));
      this.$rows = o.find(".downloads-tab__rows");
      var n = window.innerWidth <= window.innerHeight,
        r = tt(e.torrents);
      if (n) {
        for (var s = 0; s < r.length; s++) {
          this.$rows.append(this.buildElement(r[s]));
        }
      } else {
        var cols = [$('<div class="downloads-tab__col"></div>'), $('<div class="downloads-tab__col"></div>')];
        this.$rows.append(cols[0]).append(cols[1]);
        var counts = [0, 0];
        for (var s = 0; s < r.length; s++) {
          var group = r[s];
          var idx = counts[0] <= counts[1] ? 0 : 1;
          counts[idx] += group.length;
          cols[idx].append(this.buildElement(group));
        }
      }
      this.scroll.minus();
      this.scroll.append(o.get(0));
      this.html.append(this.scroll.render());
    };
    j.prototype.buildElement = function(e) {
      var _this = this;
      var t = e.map(function(o, n) {
        var r = v(o);
        return $(Lampa.Template.get(n === 0 ? "downloads-row" : "downloads-mini-row", r)).on("hover:focus", function(s) { _this.lastFocusedElement = s.currentTarget;
          _this.scroll.update(s.currentTarget, !0) }).on("hover:enter", function() { C("downloads-tab", o, void 0, function(s) { _this.removeTorrentFromUI(s) }) }).on("hover:long", function() { S("downloads-tab", o, void 0, function(s) { _this.removeTorrentFromUI(s) }) });
      });
      if (e.length > 1) { var o = $('<div class="downloads-tab__group"></div>');
        t.forEach(function(n) { return o.append(n) });
        return o }
      return t[0];
    };
    j.prototype.removeTorrentFromUI = function(e) {
      var t = e.id + "_" + e.externalId,
        o = this.html.find('.downloads-tab__item[data-id="' + t + '"]');
      if (!o.length) return;
      var n = o.closest(".downloads-tab__group"),
        r = n.length > 0,
        s = r && n.find(".downloads-tab__item").first().is(o),
        i = o.nextAll(".downloads-tab__item").first();
      if (i.length || (i = o.prevAll(".downloads-tab__item").first()), !i.length) { var c = r ? n : o;
        i = c.nextAll(".downloads-tab__item, .downloads-tab__group").first();
        i.length || (i = c.prevAll(".downloads-tab__item, .downloads-tab__group").first()) }
      if (o.remove(), r) { var c2 = n.find(".downloads-tab__item"); if (c2.length === 0) n.remove();
        else if (s) { var g = c2.first(),
            f = g.attr("data-id") || "",
            E = f.substring(f.indexOf("_") + 1),
            ae = w.getData().torrents.find(function(Y) { return String(Y.externalId) === E });
          if (ae) { var Y = v(ae),
              oe = $(Lampa.Template.get("downloads-row", Y));
            g.attr("class", oe.attr("class") || "");
            g.empty().append(oe.contents()); } } }
      if (Lampa.Controller.collectionSet(this.scroll.render()), i != null && i.length) { var c3 = i.is(".downloads-tab__item") ? i.get(0) : i.find(".downloads-tab__item").first().get(0);
        c3 && (Lampa.Controller.collectionFocus(c3, this.scroll.render()), this.lastFocusedElement = c3) }
    };
    j.prototype.render = function(e) { if (e === void 0) e = !1; return this.html };
    j.prototype.start = function() {
      var _this = this;
      Lampa.Controller.add("downloads-tab", {
        toggle: function() { var e;
          Lampa.Controller.collectionSet(_this.scroll.render());
          Lampa.Controller.collectionFocus((e = _this.lastFocusedElement) != null ? e : !1, _this.scroll.render()) },
        left: function() { return Navigator.canmove("left") ? Navigator.move("left") : Lampa.Controller.toggle("menu") },
        right: function() { return Navigator.move("right") },
        up: function() { return Navigator.canmove("up") ? Navigator.move("up") : Lampa.Controller.toggle("head") },
        down: function() { return Navigator.canmove("down") && Navigator.move("down") },
        back: function() { return Lampa.Activity.backward() }
      });
      Lampa.Controller.toggle("downloads-tab");
    };
    j.prototype.build = function(e) {};
    j.prototype.bind = function(e) {};
    j.prototype.empty = function() {};
    j.prototype.next = function() {};
    j.prototype.append = function(e, t) {};
    j.prototype.limit = function() {};
    j.prototype.refresh = function() {};
    j.prototype.pause = function() {};
    j.prototype.stop = function() {};
    j.prototype.destroy = function() { this.scroll.destroy();
      this.html.remove() };
    return j;
  }();

  function Ae(a) {
    var e = v(a),
      t = $(document).find('.downloads-tab__item[data-id="' + e.id + '"]');
    t.length && (t.removeClass("downloading completed paused").addClass(e.status), t.find(".downloads-tab__progress-fill").css("width", e.percent), t.find(".downloads-tab__poster").css("background-image", "url(" + e.poster + ")"), Object.keys(e).forEach(function(o) { t.find('[data-field="' + o + '"]').each(function() { $(this).text(e[o]) }) }));
  }

  function De() {
    Lampa.Template.add("menu-button", Ee);
    Lampa.Template.add("downloads-row", Se);
    Lampa.Template.add("downloads-mini-row", Te);
    Lampa.Template.add("downloads-tab", Ie);
    $("body").append("<style>" + xe + "</style>");
    Lampa.Component.add("downloads-tab", j);
    var a = Lampa.Lang.translate("downloads"),
      e = $(Lampa.Template.get("menu-button", { icon: y, text: a }));
    e.on("hover:enter", function() { Lampa.Activity.push({ url: "", title: a, component: "downloads-tab", page: 1 }) });
    $(".menu .menu__list").eq(0).append(e);
  }

  var at = 10,
    u = {
      consecutiveErrors: 0,
      wasConnected: null,
      subscription: null,
      start: function() {
        var o;
        var e = Lampa.Storage.field(J),
          t = (o = H[e]) != null ? o : H[0];
        this.subscription && clearInterval(this.subscription);
        this.consecutiveErrors = 0;
        this.wasConnected = null;
        this.subscription = setInterval(this.tick.bind(this), t * 1e3);
      },
      tick: function() {
        return l(this, null, function*() {
          try {
            var e = yield m.getClient().getData();
            if (e && e.torrents) {
              yield w.setData(e);
              if ($(".d-updatable").length) {
                for (var o = 0; o < e.torrents.length; o++) {
                  we(e.torrents[o]);
                  ye(e.torrents[o]);
                  Ae(e.torrents[o]);
                }
              }
              var t = m.getClient().url;
              this.consecutiveErrors = 0;
              m.isConnected = !0;
              if (this.wasConnected !== !0) {
                h("Connected to " + t);
                Lampa.Noty.show(Lampa.Lang.translate("background-worker.connection-success") + ": " + t);
                this.wasConnected = !0;
              }
            }
          } catch (e) {
            h("Error:", e);
            m.isConnected = !1;
            this.consecutiveErrors++;
            if (this.wasConnected !== !1) {
              Lampa.Noty.show(Lampa.Lang.translate("background-worker.error-detected"));
              this.wasConnected = !1;
            }
            if (this.consecutiveErrors > at) {
              clearInterval(this.subscription);
              h("Stopping background worker due to too many consecutive errors");
            }
          }
        });
      }
    };
  var _ = u;

  var J = d.component + ".interval",
    B = d.component + ".default-action",
    Q = d.component + ".allow-multiple-marks",
    K = d.component + ".poster-quality",
    I = d.component + ".server.url",
    Z = d.component + ".server.login",
    X = d.component + ".server.password",
    ee = d.component + ".server.type",
    te = d.component + ".jellyfin.separate-movies-tv",
    P = d.component + ".jellyfin.subfolder",
    N = d.component + ".jellyfin.include-year",
    k = d.component + ".jellyfin.include-tmdbid",
    H = [2, 5, 10, 30, 60, 5 * 60, 15 * 60],
    q = ["w200", "w342", "w500", "w780", "w1280"];

  function Ce() {
    Lampa.SettingsApi.addComponent({ component: d.component, name: d.name, icon: y });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: J, type: "select", placeholder: "2s", values: ["2s", "5s", "10s", "30s", "1m", "5m", "15m"], default: 0 }, field: { name: "Update interval" }, onChange: function(a) { Lampa.Settings.update();
        _.start() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: B, type: "select", placeholder: "", values: ["Open actions menu", "Play if done, Resume if in progress", "Play", "Resume / Pause download"], default: 0 }, field: { name: "Default press action", description: "Long press always opens the actions menu." }, onChange: function(a) { Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: Q, type: "trigger", default: !1 }, field: { name: "Keep torrents screen open after download", description: "After selecting a torrent, the app does not return back and keeps the add screen open, allowing you to add multiple torrents in a row." }, onChange: function(a) { Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: K, type: "select", placeholder: "", values: ["Low", "Medium", "High", "Very High", "Ultra"], default: 1 }, field: { name: "Poster quality" }, onChange: function(a) { Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: "transmission-title", type: "title", default: "" }, field: { name: "Server settings:" } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: ee, type: "select", placeholder: "", values: ["Transmission", "qBitTorrent"], default: "0" }, field: { name: "Torrent Client" }, onChange: function(a) { Lampa.Settings.update();
        m.reset() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: I, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Url" }, onChange: function(a) { Lampa.Settings.update();
        m.reset() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: Z, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Login" }, onChange: function(a) { Lampa.Settings.update();
        m.reset() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: X, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Password" }, onChange: function(a) { Lampa.Settings.update();
        m.reset() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: "jellyfin-title", type: "title", default: "" }, field: { name: "Jellyfin / Plex integration:" } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: te, type: "trigger", default: !1 }, field: { name: "Download movies and TV shows into separate directories" }, onChange: function() { Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: P, type: "trigger", default: !1 }, field: { name: "Download into a subfolder with title" }, onChange: function() { if (Lampa.Storage.field(P) !== !0) { Lampa.Storage.set(N, !1);
        Lampa.Storage.set(k, !1) }
        Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: N, type: "trigger", default: !1 }, field: { name: "Add (year) to folder name" }, onRender: function(a) { Lampa.Storage.field(P) === !0 ? a.show() : a.hide() }, onChange: function() { Lampa.Settings.update() } });
    Lampa.SettingsApi.addParam({ component: d.component, param: { name: k, type: "trigger", default: !1 }, field: { name: "Add [tmdbid-***] to folder name" }, onRender: function(a) { Lampa.Storage.field(P) === !0 ? a.show() : a.hide() }, onChange: function() { Lampa.Settings.update() } });
  }

  var Pe = "lampa:";

  function Ne(a) { return Array.isArray(a) ? a : typeof a == "string" ? a.split(",").map(function(e) { return e.trim() }).filter(function(e) { return e }) : [] }

  function O(a) { var n; var t = (n = Ne(a).find(function(r) { return r.startsWith(Pe) })) == null ? void 0 : n.split(":")[1]; if (!t) return 0; var o = parseInt(t, 10); return Number.isFinite(o) && o > 0 ? o : 0 }

  function R(a) { return Ne(a).indexOf("tv") !== -1 ? "tv" : "movie" }

  function x(a) { var e = [Pe + a.id]; return ke(a) && e.push("tv"), e }

  function M(a) {
    var e = (a.title || a.name).trim(),
      t = a.release_year || (a.release_date ? a.release_date.slice(0, 4) : "") || (a.first_air_date ? a.first_air_date.slice(0, 4) : ""),
      o = "";
    if (Lampa.Storage.field(te)) { o += "/" + (ke(a) ? "tv" : "movie") }
    o += "/" + e;
    if (Lampa.Storage.field(N) && t) { o += " (" + t + ")" }
    if (Lampa.Storage.field(k)) { o += " [tmdbid-" + a.id + "]" }
    return o;
  }

  function ke(a) { return Array.isArray(a.seasons) || a.season !== void 0 || a.episode_number !== void 0 }

  var U = function() {
    function U(e, t, o, n) {
      this.url = e;
      this.login = t || '';
      this.password = o || '';
      this.cookie = n;
      this.network = AndroidTVNetwork;
      this.isAuthorized = false;
    }
    U.prototype.fetchWithAuth = function(e, t) {
      if (t === void 0) t = {};
      return l(this, arguments, function*(e, t) {
        if (t === void 0) t = {};
        try {
          if (!this.isAuthorized) {
            yield this.authorize();
          }
          var response = yield this.network.fetchWithTimeout(this.url + e, {
            credentials: 'include',
            headers: { 'Accept': '*/*' }
          });
          if (response.status === 403) {
            this.isAuthorized = false;
            yield this.authorize();
            response = yield this.network.fetchWithTimeout(this.url + e, {
              credentials: 'include',
              headers: { 'Accept': '*/*' }
            });
          }
          if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
          }
          var contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return yield response.json();
          }
          return yield response.text();
        } catch (error) {
          console.error('Network error:', error);
          throw error;
        }
      });
    };
    U.prototype.authorize = function() {
      return l(this, null, function*() {
        try {
          if (!this.login || !this.password) {
            throw new Error('Login and password required');
          }
          var formData = new URLSearchParams();
          formData.append('username', this.login);
          formData.append('password', this.password);
          var response = yield this.network.fetchWithTimeout(this.url + '/api/v2/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error('Login failed: ' + response.status);
          }
          this.cookie = response.headers.get('set-cookie') || undefined;
          this.isAuthorized = true;
          console.log('qBittorrent authorized successfully');
        } catch (error) {
          console.error('Authorization error:', error);
          this.isAuthorized = false;
          throw error;
        }
      });
    };
    U.prototype.getTorrents = function() {
      return l(this, null, function*() {
        try {
          var e = yield this.fetchWithAuth('/api/v2/torrents/info');
          var t = yield this.fetchWithAuth('/api/v2/app/preferences');
          return this.formatTorrents(e, t);
        } catch (error) {
          console.error('Get torrents error:', error);
          return [];
        }
      });
    };
    U.prototype.getData = function() {
      return l(this, null, function*() {
        var n;
        try {
          var e = yield this.fetchWithAuth('/api/v2/sync/maindata');
          var t = (n = e.torrents) != null ? n : [];
          t = Array.isArray(t) ? t : Object.keys(t).map(function(r) { return D(A({}, t[r]), { hash: r }) });
          var o = yield this.fetchWithAuth('/api/v2/app/preferences');
          return { torrents: this.formatTorrents(t, o), info: { freeSpace: e.server_state.free_space_on_disk || 0 } };
        } catch (error) {
          console.error('Get data error:', error);
          return { torrents: [], info: { freeSpace: 0 } };
        }
      });
    };
    U.prototype.addTorrent = function(e, t) {
      return l(this, null, function*() {
        try {
          var url = t.MagnetUri || t.Link;
          if (!url) {
            throw new Error('No torrent URL provided');
          }
          try {
            var urlObj = new URL(url);
            urlObj.searchParams.delete('dn');
            url = urlObj.toString();
          } catch (e2) {}
          var formData = new FormData();
          formData.append('urls', url);
          formData.append('sequentialDownload', 'true');
          var tags = x(e);
          if (tags && tags.length) {
            formData.append('tags', tags.join(','));
          }
          var savePath = M(e);
          if (savePath) {
            try {
              var prefs = yield this.fetchWithAuth('/api/v2/app/preferences');
              if (prefs && prefs.save_path) {
                var basePath = prefs.save_path.replace(/[\\/]+$/g, '');
                formData.append('savepath', basePath + savePath);
              }
            } catch (err) {
              console.warn('Could not get save path:', err);
            }
          }
          console.log('Adding torrent:', url, 'with tags:', tags);
          var response = yield this.network.postFormData(this.url + '/api/v2/torrents/add', formData, { credentials: 'include' });
          if (!response.ok) {
            var errorText = yield response.text();
            throw new Error('Add torrent failed: ' + response.status + ' - ' + errorText);
          }
          console.log('Torrent added successfully');
          return true;
        } catch (error) {
          console.error('Add torrent error:', error);
          throw error;
        }
      });
    };
    U.prototype.startTorrent = function(e) {
      return l(this, null, function*() {
        var t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        yield this.fetchWithAuth('/api/v2/torrents/start', { method: 'POST', body: t });
      });
    };
    U.prototype.stopTorrent = function(e) {
      return l(this, null, function*() {
        var t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        yield this.fetchWithAuth('/api/v2/torrents/stop', { method: 'POST', body: t });
      });
    };
    U.prototype.hideTorrent = function(e) {
      return l(this, null, function*() {
        var t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        t.append('tags', 'hide');
        yield this.fetchWithAuth('/api/v2/torrents/addTags', { method: 'POST', body: t });
      });
    };
    U.prototype.removeTorrent = function(e, t) {
      if (t === void 0) t = !1;
      return l(this, null, function*() {
        var o = new URLSearchParams();
        o.append('hashes', String(e.externalId));
        o.append('deleteFiles', t ? 'true' : 'false');
        yield this.fetchWithAuth('/api/v2/torrents/delete', { method: 'POST', body: o });
      });
    };
    U.prototype.getFiles = function(e) {
      return l(this, null, function*() {
        var t = new URLSearchParams();
        t.append('hash', String(e.externalId));
        return (yield this.fetchWithAuth('/api/v2/torrents/files?' + t.toString())).map(function(n) {
          var r, s;
          return {
            bytesCompleted: Math.floor(n.progress * n.size),
            length: n.size,
            name: n.name,
            begin_piece: (r = n.piece_range) == null ? void 0 : r[0],
            end_piece: (s = n.piece_range) == null ? void 0 : s[1]
          };
        });
      });
    };
    U.prototype.formatTorrents = function(e, t) {
      return e.sort(function(o, n) { return n.added_on - o.added_on }).filter(function(o) { return !o.tags || !o.tags.includes('hide') }).map(function(o) {
        return {
          id: O(o.tags),
          type: R(o.tags),
          externalId: o.hash,
          name: o.name,
          status: ue(o.state),
          percentDone: o.progress || 0,
          totalSize: o.size || 0,
          eta: o.eta || 0,
          speed: o.dlspeed || 0,
          files: [],
          seeders: o.num_seeds || 0,
          activeSeeders: o.num_complete || 0,
          hash: o.hash,
          path: (o.save_path || '').replace(t.save_path || '', '')
        };
      });
    };
    return U;
  }();

  var z = function() {
    function z(e, t, o, n) {
      this.url = e;
      this.login = t;
      this.password = o;
      this.sessionId = n;
      this.network = AndroidTVNetwork;
    }
    z.prototype.POST = function(e) {
      return l(this, null, function*() {
        try {
          var response = yield this.network.postJSON(this.url, e, {
            headers: {
              Authorization: 'Basic ' + btoa(this.login + ':' + this.password),
              'X-Transmission-Session-Id': this.sessionId || ''
            }
          });
          if (response.status === 409) {
            this.sessionId = response.headers.get('X-Transmission-Session-Id');
            if (!this.sessionId) {
              throw new Error('Cannot get Transmission session ID');
            }
            return this.POST(e);
          }
          if (!response.ok) {
            throw new Error('Transmission RPC error: ' + response.statusText);
          }
          return yield response.json();
        } catch (error) {
          console.error('Transmission POST error:', error);
          throw error;
        }
      });
    };
    z.prototype.getSession = function() {
      var e = { method: 'session-get' };
      return this.POST(e);
    };
    z.prototype.addTorrent = function(e) {
      var t = { method: 'torrent-add', arguments: e };
      return this.POST(t);
    };
    z.prototype.getTorrents = function(e) {
      var t = { method: 'torrent-get', arguments: e };
      return this.POST(t);
    };
    z.prototype.setTorrent = function(e) {
      var t = { method: 'torrent-set', arguments: e };
      return this.POST(t);
    };
    z.prototype.startTorrent = function(e) {
      var t = { method: 'torrent-start', arguments: e };
      return this.POST(t);
    };
    z.prototype.stopTorrent = function(e) {
      var t = { method: 'torrent-stop', arguments: e };
      return this.POST(t);
    };
    z.prototype.removeTorrent = function(e) {
      var t = { method: 'torrent-remove', arguments: e };
      return this.POST(t);
    };
    return z;
  }();

  var F = function() {
    function F(e, t, o) {
      this.url = e;
      this.login = t;
      this.password = o;
      this.client = new z(e + '/transmission/rpc', t, o);
      this.network = AndroidTVNetwork;
    }
    F.prototype.getTorrents = function() {
      return l(this, null, function*() {
        var n, r;
        try {
          var e = yield this.client.getSession();
          var t = ((n = e == null ? void 0 : e.arguments) == null ? void 0 : n['download-dir']) || '';
          return ((r = (yield this.client.getTorrents({
            fields: ['id', 'name', 'status', 'percentDone', 'sizeWhenDone', 'rateDownload', 'eta', 'labels', 'files', 'peersConnected', 'peersSendingToUs', 'trackerStats', 'hashString', 'downloadDir']
          })).arguments) == null ? void 0 : r.torrents.filter(function(s) { return !Array.isArray(s.labels) || s.labels.indexOf('hide') === -1 }).map(function(s) {
            var g;
            var i = 0,
              c = 0;
            if (Array.isArray(s.trackerStats)) {
              var maxVal = 0;
              for (var idx = 0; idx < s.trackerStats.length; idx++) {
                if (s.trackerStats[idx].seederCount > maxVal) {
                  maxVal = s.trackerStats[idx].seederCount;
                }
              }
              i = maxVal;
            }
            c = s.peersSendingToUs || 0;
            return {
              id: O(s.labels),
              type: R(s.labels),
              externalId: s.id,
              name: s.name,
              status: me(s.status),
              percentDone: s.percentDone || 0,
              totalSize: s.sizeWhenDone || 0,
              eta: s.eta || 0,
              speed: s.rateDownload || 0,
              files: s.files || [],
              seeders: i,
              activeSeeders: c,
              hash: s.hashString,
              path: ((g = s.downloadDir) == null ? void 0 : g.replace(t, '')) || ''
            };
          }).filter(function(s) { return s.id })) || [];
        } catch (error) {
          console.error('Get torrents error:', error);
          return [];
        }
      });
    };
    F.prototype.addTorrent = function(e, t) {
      return l(this, null, function*() {
        var s, i;
        try {
          var o = {
            paused: !1,
            sequential_download: !0,
            filename: t.MagnetUri || t.Link,
            labels: x(e)
          };
          var n = M(e);
          if (n) {
            var c = yield this.client.getSession();
            var g = (s = c == null ? void 0 : c.arguments) == null ? void 0 : s['download-dir'];
            if (g) {
              o['download-dir'] = g.replace(/[\\/]+$/g, '') + n;
            }
          }
          console.log('Adding torrent:', o);
          var r = yield this.client.addTorrent(o);
          if ((i = r.arguments) != null && i['torrent-added']) {
            yield this.client.setTorrent({
              ids: [r.arguments['torrent-added'].id],
              labels: x(e)
            });
          }
          console.log('Torrent added successfully');
        } catch (error) {
          console.error('Add torrent error:', error);
          throw error;
        }
      });
    };
    F.prototype.startTorrent = function(e) {
      return l(this, null, function*() {
        yield this.client.startTorrent({ ids: [e.externalId] });
      });
    };
    F.prototype.stopTorrent = function(e) {
      return l(this, null, function*() {
        yield this.client.stopTorrent({ ids: [e.externalId] });
      });
    };
    F.prototype.hideTorrent = function(e) {
      return l(this, null, function*() {
        var n, r;
        var o = ((r = (n = (yield this.client.getTorrents({ ids: [e.externalId], fields: ['labels'] })).arguments) == null ? void 0 : n.torrents[0]) == null ? void 0 : r.labels) || [];
        yield this.client.setTorrent({ ids: [e.externalId], labels: o.concat(['hide']) });
      });
    };
    F.prototype.removeTorrent = function(e, t) {
      if (t === void 0) t = !1;
      return l(this, null, function*() {
        yield this.client.removeTorrent({ ids: [e.externalId], 'delete-local-data': t });
      });
    };
    F.prototype.getFiles = function(e) {
      return l(this, null, function*() {
        return e.files || [];
      });
    };
    F.prototype.getData = function() {
      return l(this, null, function*() {
        try {
          return { torrents: yield this.getTorrents(), info: { freeSpace: 0 } };
        } catch (error) {
          console.error('Get data error:', error);
          return { torrents: [], info: { freeSpace: 0 } };
        }
      });
    };
    return F;
  }();

  var m = {
    client: null,
    selectionInFlight: !1,
    isConnected: !1,
    getClient: function() {
      if (!this.client) {
        var t = (Lampa.Storage.field(I) || '').split(';').map(function(o) { return o.trim() }).filter(function(o) { return o });
        if (!t.length) {
          console.warn('No server URL configured');
          return null;
        }
        this.buildClient(t[0] || '');
        if (t.length > 1) {
          this.selectUrl(t);
        }
      }
      return this.client;
    },
    reset: function() {
      this.client = void 0;
      this.selectionInFlight = !1;
    },
    buildClient: function(e) {
      var t = Lampa.Storage.field(ee) === 1;
      var o = Lampa.Storage.field(Z) || '';
      var n = Lampa.Storage.field(X) || '';
      this.client = t ? new U(e, o, n) : new F(e, o, n);
      console.log('Client built for:', e);
    },
    selectUrl: function(e) {
      if (this.selectionInFlight) return;
      this.selectionInFlight = !0;
      var _this = this;
      var t = e.map(function(r) {
        return AndroidTVNetwork.fetchWithTimeout(r + '/ping', { cache: 'no-cache' }).then(function(s) { return s.ok ? r : Promise.reject() });
      });
      var o = 0,
        n = !1;
      t.forEach(function(r) {
        return r.then(function(s) {
          if (!n) {
            n = !0;
            _this.selectionInFlight = !1;
            if (!_this.client || _this.client.url !== s) {
              _this.buildClient(s);
            }
          }
        }).catch(function() {
          ++o === t.length && !n && (n = !0, _this.selectionInFlight = !1);
        });
      });
    }
  };

  var $e = '<div class="full-start__button selector button--download">\n    {icon}\n    <span>{text}</span>\n</div>';

  function nt(a) {
    var e = $('.full-start-new__buttons');
    if (e.find('.button--download').length) return;
    var t = $(Lampa.Template.get('download-button', { icon: y, text: Lampa.Lang.translate('download') }));
    t.on('hover:enter', function(o) {
      Lampa.Activity.push({
        url: '',
        title: Lampa.Lang.translate('download'),
        component: 'torrents-download',
        search_one: a.movie.title,
        search_two: a.movie.original_title,
        movie: a.movie,
        page: 1
      });
    });
    e.children().first().after(t);
  }

  function Oe() {
    Lampa.Template.add('download-button', $e);
    Lampa.Component.add('torrents-download', Lampa.Component.get('torrents'));
    Lampa.Listener.follow('full', function(a) {
      if (a.type === 'complite') {
        var e = a.data;
        nt(e);
      }
    });
    Lampa.Listener.follow('torrent', function(a) {
      var e = Lampa.Activity.active();
      if (a.type === 'render' && e.component === 'torrents-download') {
        $(a.item).off('hover:enter');
        $(a.item).on('hover:enter', function(t) {
          return l(this, null, function*() {
            try {
              var client = m.getClient();
              if (!client) {
                Lampa.Noty.show('Please configure server URL in settings');
                return;
              }
              Lampa.Noty.show('Adding torrent...');
              console.log('Adding torrent for movie:', e.movie);
              yield client.addTorrent(e.movie, a.element);
              Lampa.Noty.show(Lampa.Lang.translate('download-button.added'));
              if (e.activity && e.activity.component) {
                e.activity.component.mark(a.element, a.item, !0);
              }
              if (!Lampa.Storage.get(Q, !1)) {
                Lampa.Activity.back();
                try {
                  var torrents = yield client.getTorrents();
                  var r = null;
                  for (var idx = 0; idx < torrents.length; idx++) {
                    if (torrents[idx].id === e.movie.id) {
                      r = torrents[idx];
                      break;
                    }
                  }
                  if (r) {
                    V(r, e.movie);
                  }
                } catch (err) {
                  console.warn('Could not fetch torrent after add:', err);
                }
              }
            } catch (error) {
              console.error('Add torrent error:', error);
              Lampa.Noty.show('Failed to add torrent: ' + (error.message || 'Unknown error'));
            }
          });
        });
      }
    });
  }

  function initPlugin() {
    try {
      console.log('Initializing Torrent Downloader for Android TV...');
      var url = Lampa.Storage.field(I);
      if (!url) {
        console.warn('Server URL not configured');
        setTimeout(function() {
          Lampa.SettingsApi.open(d.component);
        }, 2000);
        return;
      }
      window.plugin_transmission_ready = !0;
      Lampa.Manifest.plugins = d;
      Lampa.Lang.add(re);
      Ce();
      Oe();
      he();
      De();
      Le();
      setTimeout(function() {
        try {
          _.start();
        } catch (error) {
          console.error('Failed to start background worker:', error);
        }
      }, 2000);
      console.log('Plugin initialized successfully');
    } catch (error) {
      console.error('Plugin initialization error:', error);
    }
  }

  if (window.plugin_transmission_ready) {
    return;
  }
  if (window.appready) {
    initPlugin();
  } else {
    Lampa.Listener.follow('app', function(a) {
      if (a.type === 'ready') {
        initPlugin();
      }
    });
  }
})();
