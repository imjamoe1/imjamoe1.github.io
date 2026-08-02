"use strict";
(() => {
  var Me = Object.defineProperty,
    Ue = Object.defineProperties;
  var ze = Object.getOwnPropertyDescriptors;
  var ne = Object.getOwnPropertySymbols;
  var Fe = Object.prototype.hasOwnProperty,
    Ye = Object.prototype.propertyIsEnumerable;
  var se = (a, e, t) => e in a ? Me(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t,
    A = (a, e) => {
      for (var t in e || (e = {})) Fe.call(e, t) && se(a, t, e[t]);
      if (ne)
        for (var t of ne(e)) Ye.call(e, t) && se(a, t, e[t]);
      return a
    },
    D = (a, e) => Ue(a, ze(e));
  var l = (a, e, t) => new Promise((o, n) => {
    var r = c => {
        try { i(t.next(c)) } catch (g) { n(g) }
      },
      s = c => {
        try { i(t.throw(c)) } catch (g) { n(g) }
      },
      i = c => c.done ? o(c.value) : Promise.resolve(c.value).then(r, s);
    i((t = t.apply(a, e)).next())
  });

  // Android TV Network Helper с улучшенной обработкой
  class AndroidTVNetwork {
    static async fetchWithTimeout(url, options = {}, timeout = 45000) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const headers = {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Android TV) Lampa/2.0',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers
        };

        // Для Android TV добавляем специальные настройки
        const fetchOptions = {
          ...options,
          headers,
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'include'
        };

        // Для POST запросов с FormData убираем Content-Type
        if (options.body && options.body instanceof FormData) {
          delete fetchOptions.headers['Content-Type'];
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout for ${url}`);
        }
        throw error;
      }
    }

    static async postFormData(url, formData, options = {}) {
      return this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          ...options.headers
        },
        body: formData,
        ...options
      });
    }

    static async postJSON(url, data, options = {}) {
      return this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
    }

    static async getJSON(url, options = {}) {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return response.text();
    }
  }

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

  var y = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="4 4 16 16">
    <path fill="currentcolor" d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z" />
</svg>`;

  var d = { type: "other", version: "2.6.0", author: "https://github.com/kvart714", name: "Torrent Downloader", description: "Transmission RPC client", component: "t-downloader" };

  var ie = d.component + ".torrents.data.v2",
    w = class {
      static getData() { return this.data }
      static getMovie(e) {
        if (!e) return null;
        let t = this.data.torrents.filter(o => o.id === e);
        return t.length > 0 ? t.reduce((o, n) => o.percentDone >= n.percentDone ? o : n) : null
      }
      static getByHash(e) { var t; return (t = this.data.torrents.find(o => o.hash === e)) != null ? t : null }
      static ensureMovie(e) {
        let t = this.data.torrents.filter(o => o.externalId === e.externalId);
        return t.length > 0 ? t.reduce((o, n) => o.percentDone >= n.percentDone ? o : n) : e
      }
      static setData(e) {
        return l(this, null, function*() {
          this.data = e, Lampa.Storage.set(ie, this.data)
        })
      }
    };
  w.data = Lampa.Storage.get(ie, { torrents: [], info: { freeSpace: 0 } });

  var de = `<div class="selector download-card full-start__button d-updatable" id="download-card-{id}">
  <div class="download-card__file-info">
    <span class="file-name">
      <span data-key="fileName">{fileName}</span>
    </span>
    <span class="speed">
      <span data-key="speed">{speed}</span>
    </span>
  </div>
  <div class="download-card__progress-bar">
    <div class="download-card__progress-bar-progress" style="width: {percent}"></div>
  </div>
  <div class="download-card__stats">
    <span class="downloaded">
      <span data-key="downloadedSize">{downloadedSize}</span> / 
      <span data-key="totalSize">{totalSize}</span>
    </span>
    <span class="percent">
      <span data-key="percent">{percent}</span>
    </span>
    <span class="eta">
      <span data-key="eta">{eta}</span>
    </span>
  </div>
</div>
`;

  var le = `.download-card {
  all: unset;
  display: block;
  width: 80%;
  height: auto;
  margin: 0;
  margin-top: 0.75em;
  padding: 0.75em;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  transition: background-color 0.3s;
  border-radius: 1em;
}
.download-card__file-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5em;
}
.download-card__file-info .file-name, .download-card__file-info .speed {
  font-size: 1.5em;
}
.download-card__progress-bar {
  height: 6px;
  background: #ddd;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 0.7em;
  margin-bottom: 0.5em;
}
.download-card__progress-bar-progress {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #357ab8);
  transition: width 0.5s ease;
}
.download-card__stats {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  font-size: 1.1em;
}
.download-card__stats .speed {
  position: absolute;
  top: 0;
  right: 0;
  font-size: inherit;
}
.download-card__stats .percent {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: inherit;
}
.download-card__stats .downloaded {
  text-align: left;
  font-size: inherit;
}
.download-card__stats .eta {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: inherit;
}`;

  function h(...a) { console.log(d.name, ...a) }

  function ce(...a) { console.warn(d.name, ...a) }

  var pe = d.component + ".movieinfo.data.v4",
    b = class {
      static getMovieInfo(e) {
        if (!e.id) return null;
        let t = `${e.type}_${e.id}`;
        if (this.memoryCache[t]) return this.memoryCache[t];
        if (!this.requestedIds.has(t)) {
          this.requestedIds.add(t);
          this.loadContentInfo(e.id, e.type).then(o => {
            if (o) {
              this.memoryCache[t] = o;
              this.diskCache[t] = o;
              Lampa.Storage.set(pe, this.diskCache);
            } else {
              this.requestedIds.delete(t);
            }
          }).catch(() => { this.requestedIds.delete(t) });
        }
        return this.diskCache[t] || null;
      }
      static loadContentInfo(e, t, o = !0) {
        return l(this, null, function*() {
          let n = Lampa.Storage.field("tmdb_lang") || Lampa.Storage.field("language") || "ru",
            r = Lampa.Utils.addUrlComponent(Lampa.TMDB.api(`${t}/${e}?email=`), `api_key=${Lampa.TMDB.key()}&language=${n}&certification_country=ru&certification.lte=18`);
          try {
            let s = yield AndroidTVNetwork.fetchWithTimeout(r);
            if (s.ok) {
              let i = yield s.json();
              if ((i != null && i.title) || (i != null && i.name)) return i
            } else if (o) {
              h(`Failed to load '${t}_${e}', status: ${s.status}. Trying fallback type.`);
              let i = t === "movie" ? "tv" : "movie";
              return yield this.loadContentInfo(e, i, !1)
            }
          } catch (s) { ce(`Failed to load ${t} info for id ${e}:`, s) }
          return null
        })
      }
    };
  b.requestedIds = new Set;
  b.diskCache = Lampa.Storage.get(pe, {});
  b.memoryCache = {};

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

  function L(a, e = 2) {
    if (a === 0) return "0";
    let t = 1024,
      o = e < 0 ? 0 : e,
      n = Math.floor(Math.log(a) / Math.log(t));
    return parseFloat((a / Math.pow(t, n)).toFixed(o)) + " " + Lampa.Lang.translate(`download-card.size.${n}`)
  }

  function Be(a) {
    let e = Lampa.Lang.translate("download-card.time.3");
    return `${L(a)}/${e}`
  }

  function Ve(a) {
    let e = Math.floor(a / 86400),
      t = Math.floor(a % 86400 / 3600),
      o = Math.floor(a % 3600 / 60),
      n = Math.floor(a % 60);
    return [e, t, o, n].map((s, i) => s ? s + Lampa.Lang.translate(`download-card.time.${i}`) : null).filter(Boolean).slice(0, 2).join(" ")
  }

  function je(a) {
    let e = new Date(a || "");
    return isNaN(e.getTime()) ? "" : e.getFullYear()
  }

  function v(a) {
    let e = b.getMovieInfo(a),
      t = q[Lampa.Storage.get(K)] || q[1];
    return {
      id: a.id + "_" + a.externalId,
      torrentName: a.name,
      title: (e == null ? void 0 : e.title) || (e == null ? void 0 : e.name) || (a.status === p.INITIALIZATION ? "Initialization" : a.name),
      poster: (e != null && e.poster_path) ? Lampa.TMDB.image(`t/p/${t}${e.poster_path}`) : "",
      year: je((e == null ? void 0 : e.release_date) || (e == null ? void 0 : e.first_air_date)),
      fileName: (e != null && e.title) || (e != null && e.name) ? a.name : "",
      percent: (100 * a.percentDone).toFixed(2) + "%",
      speed: a.speed > 0 ? Be(a.speed) : "",
      downloadedSize: L(a.percentDone * a.totalSize),
      totalSize: L(a.totalSize),
      eta: a.status === p.DOWNLOADING ? Ve(a.eta) : a.status === p.STALLED && a.percentDone === 1 ? Lampa.Lang.translate("download-card.status.14") : Lampa.Lang.translate(`download-card.status.${a.status}`),
      status: a.status === p.DOWNLOADING ? "downloading" : a.percentDone === 1 ? "completed" : "paused",
      seeders: `${a.seeders||0} (${a.activeSeeders||0})`
    }
  }

  var fe = d.component + ".torrents.data.views.",
    T = class a {
      static getViews(e) {
        let t = Lampa.Storage.get(fe + e.externalId);
        return t && typeof t == "object" ? t : {}
      }
      static rememberView(e, t) {
        let o = a.getViews(e);
        o.last = t, o[t] = !0, Lampa.Storage.set(fe + e.externalId, o)
      }
    };

  function G(a, e, t) {
    return l(this, null, function*() {
      let o = m.getClient(),
        n = yield o.getFiles(e),
        r = `${o.url}/downloads/${encodeURI(e.path)}/`;
      if (n.length < 1) throw new Error("No files found in torrent");
      if (n.length === 1 && ge({ title: t || e.name, url: r + encodeURI(n[0].name), torrent_hash: e.hash }), n.length > 1) {
        let g, s = T.getViews(e),
          c = n.sort((f, E) => f.name.localeCompare(E.name, void 0, { numeric: !0, sensitivity: "base" })).map((f, E) => ({ title: f.name.split(/[\\/]/).pop() || f.name, name: f.name, url: r + encodeURI(f.name), picked: !!s[f.name], selected: s.last === f.name, torrent_hash: e.hash }));
        Lampa.Select.show({
          title: Lampa.Lang.translate("actions.select-file"),
          items: c,
          onSelect(f) {
            return l(this, null, function*() {
              T.rememberView(e, f.name), ge({ playlist: c, title: t || e.name, url: f.url, torrent_hash: e.hash })
            })
          },
          onBack: function() { Lampa.Controller.toggle(a) }
        })
      }
    })
  }

  function ge(a) { var e; h(`Player request ${a.url}`, a), Lampa.Player.play(a), Lampa.Player.playlist((e = a.playlist) != null ? e : []) }

  function W(a) { a.status === p.STOPPED ? m.getClient().startTorrent(a) : m.getClient().stopTorrent(a) }

  function S(a, e, t, o) {
    e = w.ensureMovie(e), Lampa.Select.show({
      title: Lampa.Lang.translate("actions.title"),
      items: [
        { title: Lampa.Lang.translate("actions.open"), onSelect() { return l(this, null, function*() { G(a, e, t) }) } },
        ...(a === "downloads-tab" && e.id ? [{ title: Lampa.Lang.translate("actions.open-card"), onSelect() { return l(this, null, function*() { Lampa.Activity.push({ component: "full", id: e.id, method: e.type, card: e }) }) } }] : []),
        { title: e.status === p.STOPPED ? Lampa.Lang.translate("actions.resume") : Lampa.Lang.translate("actions.pause"), onSelect() { W(e), Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.hide"), onSelect() { m.getClient().hideTorrent(e), o == null || o(e), Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.delete"), subtitle: Lampa.Lang.translate("actions.delete-with-file"), onSelect() { m.getClient().removeTorrent(e, !0), o == null || o(e), Lampa.Controller.toggle(a) } },
        { title: Lampa.Lang.translate("actions.delete-torrent"), subtitle: Lampa.Lang.translate("actions.delete-torrent-keep-file"), onSelect() { m.getClient().removeTorrent(e, !1), o == null || o(e), Lampa.Controller.toggle(a) } }
      ],
      onBack: function() { Lampa.Controller.toggle(a) }
    })
  }

  function C(a, e, t, o) { var r; e = (r = w.getByHash(e.hash)) != null ? r : e; let n = Lampa.Storage.field(B); n == 1 ? e.percentDone === 1 ? G(a, e, t) : W(e) : n == 2 ? G(a, e, t) : n == 3 ? W(e) : S(a, e, t, o) }

  function V(a, e) {
    let t = $(Lampa.Template.get("download-card", v(a)));
    $(".full-start-new__right").append(t), t.on("hover:enter", () => { C("full_start", a, (e == null ? void 0 : e.title) || (e == null ? void 0 : e.original_title)) }), t.on("hover:long", () => { S("full_start", a, (e == null ? void 0 : e.title) || (e == null ? void 0 : e.original_title)) })
  }

  function we(a) {
    let e = v(a),
      t = document.getElementById(`download-card-${e.id}`);
    if (t) {
      for (let o in e) { let n = t.querySelector(`[data-key="${o}"]`); n && (n.textContent = e[o]) }
      t.querySelector(".download-card__progress-bar-progress").setAttribute("style", `width: ${e.percent};`)
    }
  }

  function he() {
    Lampa.Template.add("download-card", de), $("body").append(`<style>${le}</style>`), Lampa.Listener.follow("full", a => { if (a.type === "complite") { let e = w.getMovie(a.data.movie.id); e && V(e, a.data.movie) } })
  }

  var _e = `<div class="download-circle d-updatable download-circle-{status}-{id}">
    <div class="download-circle__circle">
        <svg class="download-circle__circle-svg" xmlns="http://www.w3.org/2000/svg">
            <circle
                fill="rgba(0, 0, 0, 0.60)"
                r="17px"
                cx="20"
                cy="20"
            ></circle>
            <circle
                class="download-circle__full_{status}"
                stroke-width="2px"
                r="12px"
                cx="20"
                cy="20"
            ></circle>
            <circle
                class="download-circle__partial_{status}"
                fill="none"
                stroke="#fff"
                stroke-width="2px"
                stroke-dasharray="100"
                stroke-dashoffset="{progress}"
                transition="stroke-dasharray 0.7s linear 0s"
                r="12px"
                cx="20"
                cy="20"
                pathlength="100"
            ></circle>
        </svg>
    </div>
    <div class="download-circle__down-arrow">
        <svg
            class="download-circle__down-arrow-svg_{status}"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z"
            />
        </svg>
        <svg
            class="download-circle__down-arrow-svg-animated_{status}"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M17.71,12.71a1,1,0,0,0-1.42,0L13,16V6a1,1,0,0,0-2,0V16L7.71,12.71a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.3,4.29A2,2,0,0,0,12,19h0a2,2,0,0,0,1.4-.59l4.3-4.29A1,1,0,0,0,17.71,12.71Z"
            />
        </svg>
    </div>
</div>
`;

  var be = `.download-complete,
.download-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(2);
}
.download-complete__circle,
.download-circle__circle {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  position: relative;
}
.download-complete__circle-svg,
.download-circle__circle-svg {
  transform: rotate(-90deg);
  display: flex;
  justify-content: center;
  align-items: center;
}
.download-complete__full_in-progress,
.download-circle__full_in-progress {
  fill: none;
  stroke: rgba(255, 255, 255, 0.5);
}
.download-complete__full_complete,
.download-circle__full_complete {
  fill: white;
  stroke: none;
}
.download-complete__partial_complete,
.download-circle__partial_complete {
  display: none;
}
.download-complete__partial_in-progress,
.download-circle__partial_in-progress {
  transition: stroke-dashoffset 0.5s ease;
}
.download-complete__down-arrow,
.download-circle__down-arrow {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
}
.download-complete__down-arrow svg,
.download-circle__down-arrow svg {
  width: 24px;
  height: 24px;
}
.download-complete__down-arrow-svg_in-progress,
.download-circle__down-arrow-svg_in-progress {
  fill: rgba(255, 255, 255, 0.5);
}
.download-complete__down-arrow-svg_complete,
.download-circle__down-arrow-svg_complete {
  fill: "white";
}
.download-complete__down-arrow-svg-animated_in-progress,
.download-circle__down-arrow-svg-animated_in-progress {
  position: absolute;
  clip-path: inset(0 0 100% 0);
  animation: pulseColor 2s ease-out infinite;
}
.download-complete__down-arrow-svg-animated_complete,
.download-circle__down-arrow-svg-animated_complete {
  display: none;
}

@keyframes pulseColor {
  0% {
    clip-path: inset(0 0 100% 0);
  }
  30% {
    clip-path: inset(0 0 0 0);
  }
  70% {
    clip-path: inset(0 0 0 0);
  }
  100% {
    clip-path: inset(100% 0 0 0);
  }
}`;

  function ve(a, e) { var o; let t = $(e); if (!t.find(".download-circle").length) { let n = (o = a.percentDone) != null ? o : 0, r = Lampa.Template.get("download-circle", { id: a.id, status: n === 1 ? "complete" : "in-progress", progress: 100 * (1 - n) }); t.find(".card__vote").after(r) } }

  function Je(a, e) { let t = w.getMovie(a); t && ve(t, e) }

  function ye(a) { var o; let e = document.querySelectorAll(`.download-circle-in-progress-${a.id}`); if (!e.length) return; let t = (o = a.percentDone) != null ? o : 0; e.forEach(n => { if (t === 1) { let r = n.parentElement; n.remove(), ve(a, r) } else { let r = n.querySelector(".download-circle__partial_in-progress"); r == null || r.setAttribute("stroke-dashoffset", `${100*(1-t)}`) } }) }

  function Le() {
    Lampa.Template.add("download-circle", _e), $("body").append(`<style>${be}</style>`), Lampa.Listener.follow("line", a => { var e, t; if (a.type === "append")
        for (let o of a.items)(e = o == null ? void 0 : o.data) != null && e.id && Je((t = o == null ? void 0 : o.data) == null ? void 0 : t.id, o.card) })
  }

  var Te = `<div class="downloads-tab__item downloads-tab__item--mini selector {status}" data-id="{id}">
  <div class="downloads-tab__main">
    <div class="downloads-tab__file"><span data-field="torrentName">{torrentName}</span></div>

    <div class="downloads-tab__footer">
      <div class="downloads-tab__meta-top">
        <div class="downloads-tab__meta-left">
          <span class="downloads-tab__meta-text" data-field="percent">{percent}</span>
          <span> • </span>
          <span class="downloads-tab__meta-text" data-field="seeders">{seeders}</span>
        </div>
        <span class="downloads-tab__speed"><span data-field="speed">{speed}</span></span>
      </div>

      <div class="downloads-tab__progress-wrapper">
        <div class="downloads-tab__progress-fill" style="width: {percent};"></div>
      </div>

      <div class="downloads-tab__meta-bottom">
        <div class="downloads-tab__sizes">
          <span class="downloads-tab__meta-downloaded" data-field="downloadedSize">{downloadedSize}</span>
          <span class="downloads-tab__meta-slash"> / </span>
          <span class="downloads-tab__meta-total" data-field="totalSize">{totalSize}</span>
        </div>
        <span class="downloads-tab__eta" data-field="eta">{eta}</span>
      </div>
    </div>
  </div>
</div>
`;

  var Se = `<div class="downloads-tab__item selector {status}" data-id="{id}">
  <div class="downloads-tab__poster" style="background-image: url('{poster}')"></div>
  <div class="downloads-tab__main">
    <div class="downloads-tab__movie"><span data-field="title">{title}</span></div>
    <div class="downloads-tab__year"><span data-field="year">{year}</span></div>
    <div class="downloads-tab__file"><span data-field="fileName">{fileName}</span></div>

    <div class="downloads-tab__footer">
      <div class="downloads-tab__meta-top">
        <div class="downloads-tab__meta-left">
          <span class="downloads-tab__meta-text" data-field="percent">{percent}</span>
          <span> • </span>
          <span class="downloads-tab__meta-text" data-field="seeders">{seeders}</span>
        </div>
        <span class="downloads-tab__speed"><span data-field="speed">{speed}</span></span>
      </div>

      <div class="downloads-tab__progress-wrapper">
        <div class="downloads-tab__progress-fill" style="width: {percent};"></div>
      </div>

      <div class="downloads-tab__meta-bottom">
        <div class="downloads-tab__sizes">
          <span class="downloads-tab__meta-downloaded" data-field="downloadedSize">{downloadedSize}</span>
          <span class="downloads-tab__meta-slash"> / </span>
          <span class="downloads-tab__meta-total" data-field="totalSize">{totalSize}</span>
        </div>
        <span class="downloads-tab__eta" data-field="eta">{eta}</span>
      </div>
    </div>
  </div>
</div>
`;

  var Ie = `<div class="downloads-tab__list d-updatable">
  <div class="downloads-tab__header-title-wrapper">
    <div class="downloads-tab__header-title">{server}</div>
    <div class="downloads-tab__header-size">{freeSpace}</div>
  </div>
  <div class="downloads-tab__rows"></div>
</div>
`;

  var xe = `@charset "UTF-8";
.downloads-tab__list {
  --color-text-primary: #dbdbdb;
  --color-text-muted: #b1b1b1;
  --fs-header: 1.4em;
  --fs-title: 1.6em;
  --fs-file: 1em;
  --fs-body: 1.2em;
  --sp-after-title: 0.3em;
  --sp-between-text-and-progress: 0.5em;
  --accent-violet: #b67dff;
  --accent-violet-light: #c698ff;
  --card-bg-color: 24, 24, 24;
  --card-bg-alpha: 0.8;
  --card-bg-alpha-hover: 0.6;
  --poster-scale-hover: 1.04;
  color: var(--color-text-muted);
  padding: 1em;
}
.downloads-tab__list .downloads-tab__header-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
  font-size: var(--fs-header);
  font-weight: 700;
  color: var(--color-text-primary);
}
.downloads-tab__list .downloads-tab__rows {
  display: flex;
  gap: 1em;
  align-items: flex-start;
}
.downloads-tab__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1em;
}
.downloads-tab__group {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
}
.downloads-tab__group > .downloads-tab__item:first-child {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.downloads-tab__group > .downloads-tab__item--mini {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.downloads-tab__group > .downloads-tab__item--mini:last-child {
  border-bottom-left-radius: 0.6em;
  border-bottom-right-radius: 0.6em;
}
.downloads-tab__item {
  display: grid;
  grid-template-columns: 9em 1fr;
  gap: 1em;
  padding: 0.8em;
  border-radius: 0.6em;
  background: rgba(var(--card-bg-color), var(--card-bg-alpha));
  box-shadow: 0 0.5em 1.2em rgba(0, 0, 0, 0.5);
  transition: background 0.15s ease, box-shadow 0.15s ease;
  outline: 1px solid rgba(255, 255, 255, 0.062745098);
}
.downloads-tab__item:hover, .downloads-tab__item.focus, .downloads-tab__item:focus-visible {
  outline: 3px solid var(--accent-violet);
  background: rgba(var(--card-bg-color), var(--card-bg-alpha-hover));
}
.downloads-tab__item.downloading .downloads-tab__meta-left {
  display: inline;
}
.downloads-tab__item.completed .downloads-tab__meta-downloaded,
.downloads-tab__item.completed .downloads-tab__meta-slash {
  display: none;
}
.downloads-tab__item:hover .downloads-tab__poster, .downloads-tab__item.focus .downloads-tab__poster, .downloads-tab__item:focus-visible .downloads-tab__poster {
  transform: scale(var(--poster-scale-hover));
}
.downloads-tab__item--mini {
  grid-template-columns: 1fr;
  padding-left: 10.8em;
}
.downloads-tab__item--mini .downloads-tab__main {
  min-height: unset;
  grid-template-rows: auto auto;
}
.downloads-tab__poster {
  position: relative;
  width: 9em;
  height: 13.5em;
  border-radius: 0.6em;
  overflow: hidden;
  background-color: rgb(35, 35, 35);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transition: transform 0.2s ease;
}
.downloads-tab__poster::after {
  content: "POSTER";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1em;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.08);
  pointer-events: none;
  user-select: none;
}
.downloads-tab__main {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr auto;
  min-height: 13.5em;
}
.downloads-tab__movie {
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: var(--sp-after-title);
  word-break: break-word;
  overflow-wrap: break-word;
}
.downloads-tab__year {
  color: var(--color-text-muted);
  margin-bottom: 0.8em;
  font-weight: bold;
}
.downloads-tab__file {
  font-size: var(--fs-file);
  font-weight: 500;
  color: #727272;
  margin-bottom: var(--sp-between-text-and-progress);
  overflow-wrap: anywhere;
}
.downloads-tab__footer {
  align-self: end;
  display: grid;
  row-gap: var(--sp-between-text-and-progress);
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--color-text-muted);
}
.downloads-tab__meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8em;
}
.downloads-tab__meta-left {
  display: none;
  white-space: nowrap;
}
.downloads-tab__speed {
  font-weight: 600;
  color: var(--accent-violet);
}
.downloads-tab__progress-wrapper {
  height: 0.5em;
  border-radius: 10px;
  overflow: hidden;
  background: #2a2a2a;
}
.downloads-tab__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-violet), var(--accent-violet-light));
  will-change: width;
  transition: width 0.25s ease;
}
.downloads-tab__meta-bottom {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  column-gap: 0.8em;
}
.downloads-tab__sizes {
  white-space: nowrap;
}
.downloads-tab__eta {
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}
.downloads-tab__meta-total {
  color: var(--accent-violet);
}
@media (orientation: portrait) {
  .downloads-tab__list .downloads-tab__rows {
    flex-direction: column;
    align-items: stretch;
  }
  .downloads-tab__list .downloads-tab__header-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3em;
  }
}
@media (prefers-reduced-motion: reduce) {
  .downloads-tab__item, .downloads-tab__poster, .downloads-tab__progress-fill {
    transition: none;
  }
}`;

  var Ee = `<li class="menu__item selector">
    <div class="menu__ico">{icon}</div>
    <div class="menu__text">{text}</div>
</li>
`;

  function tt(a) {
    let e = new Map;
    return a.forEach((t, o) => {
      let n = t.id > 0 ? String(t.id) : `solo_${t.externalId}`;
      e.has(n) || e.set(n, { torrents: [], lastIndex: o });
      let r = e.get(n);
      r.torrents.push(t), r.lastIndex = Math.max(r.lastIndex, o)
    }), [...e.values()].sort((t, o) => t.lastIndex - o.lastIndex).map(t => [...t.torrents].sort((o, n) => n.totalSize - o.totalSize))
  }

  var j = class {
    constructor() {
      this.html = $("<div></div>");
      this.lastFocusedElement = null
    }
    create() {
      m.isConnected || _.start(), this.scroll = new Lampa.Scroll({ mask: !0, over: !0, step: 200 });
      let e = w.getData(),
        t = m.isConnected ? Lampa.Lang.translate("downloads-tab.connected") + " (" + m.getClient().url + ")" : Lampa.Lang.translate("downloads-tab.disconnected"),
        o = $(Lampa.Template.get("downloads-tab", { server: t, freeSpace: Lampa.Lang.translate("downloads-tab.freespace") + L(e.info.freeSpace) }));
      this.$rows = o.find(".downloads-tab__rows");
      let n = window.innerWidth <= window.innerHeight,
        r = tt(e.torrents);
      if (n) r.forEach(s => this.$rows.append(this.buildElement(s)));
      else {
        let s = [$('<div class="downloads-tab__col"></div>'), $('<div class="downloads-tab__col"></div>')];
        this.$rows.append(s[0]).append(s[1]);
        let i = [0, 0];
        r.forEach(c => { let g = i[0] <= i[1] ? 0 : 1; i[g] += c.length, s[g].append(this.buildElement(c)) })
      }
      this.scroll.minus(), this.scroll.append(o.get(0)), this.html.append(this.scroll.render())
    }
    buildElement(e) {
      let t = e.map((o, n) => {
        let r = v(o);
        return $(Lampa.Template.get(n === 0 ? "downloads-row" : "downloads-mini-row", r)).on("hover:focus", s => { this.lastFocusedElement = s.currentTarget, this.scroll.update(s.currentTarget, !0) }).on("hover:enter", () => C("downloads-tab", o, void 0, s => this.removeTorrentFromUI(s))).on("hover:long", () => S("downloads-tab", o, void 0, s => this.removeTorrentFromUI(s)))
      });
      if (e.length > 1) { let o = $('<div class="downloads-tab__group"></div>'); return t.forEach(n => o.append(n)), o }
      return t[0]
    }
    removeTorrentFromUI(e) {
      let t = `${e.id}_${e.externalId}`,
        o = this.html.find(`.downloads-tab__item[data-id="${t}"]`);
      if (!o.length) return;
      let n = o.closest(".downloads-tab__group"),
        r = n.length > 0,
        s = r && n.find(".downloads-tab__item").first().is(o),
        i = o.nextAll(".downloads-tab__item").first();
      if (i.length || (i = o.prevAll(".downloads-tab__item").first()), !i.length) { let c = r ? n : o; i = c.nextAll(".downloads-tab__item, .downloads-tab__group").first(), i.length || (i = c.prevAll(".downloads-tab__item, .downloads-tab__group").first()) }
      if (o.remove(), r) { let c = n.find(".downloads-tab__item"); if (c.length === 0) n.remove();
        else if (s) { let g = c.first(),
            f = g.attr("data-id") || "",
            E = f.substring(f.indexOf("_") + 1),
            ae = w.getData().torrents.find(Y => String(Y.externalId) === E);
          if (ae) { let Y = v(ae),
              oe = $(Lampa.Template.get("downloads-row", Y));
            g.attr("class", oe.attr("class") || ""), g.empty().append(oe.contents()) } } }
      if (Lampa.Controller.collectionSet(this.scroll.render()), i != null && i.length) { let c = i.is(".downloads-tab__item") ? i.get(0) : i.find(".downloads-tab__item").first().get(0); c && (Lampa.Controller.collectionFocus(c, this.scroll.render()), this.lastFocusedElement = c) }
    }
    render(e = !1) { return this.html }
    start() {
      Lampa.Controller.add("downloads-tab", {
        toggle: () => { var e; Lampa.Controller.collectionSet(this.scroll.render()), Lampa.Controller.collectionFocus((e = this.lastFocusedElement) != null ? e : !1, this.scroll.render()) },
        left: () => Navigator.canmove("left") ? Navigator.move("left") : Lampa.Controller.toggle("menu"),
        right: () => Navigator.move("right"),
        up: () => Navigator.canmove("up") ? Navigator.move("up") : Lampa.Controller.toggle("head"),
        down: () => Navigator.canmove("down") && Navigator.move("down"),
        back: () => Lampa.Activity.backward()
      }), Lampa.Controller.toggle("downloads-tab")
    }
    build(e) {}
    bind(e) {}
    empty() {}
    next() {}
    append(e, t) {}
    limit() {}
    refresh() {}
    pause() {}
    stop() {}
    destroy() { this.scroll.destroy(), this.html.remove() }
  };

  function Ae(a) {
    let e = v(a),
      t = $(document).find(`.downloads-tab__item[data-id="${e.id}"]`);
    t.length && (t.removeClass("downloading completed paused").addClass(e.status), t.find(".downloads-tab__progress-fill").css("width", e.percent), t.find(".downloads-tab__poster").css("background-image", `url(${e.poster})`), Object.keys(e).forEach(o => { t.find(`[data-field="${o}"]`).each(function() { $(this).text(e[o]) }) }))
  }

  function De() {
    Lampa.Template.add("menu-button", Ee), Lampa.Template.add("downloads-row", Se), Lampa.Template.add("downloads-mini-row", Te), Lampa.Template.add("downloads-tab", Ie), $("body").append(`<style>${xe}</style>`), Lampa.Component.add("downloads-tab", j);
    let a = Lampa.Lang.translate("downloads"),
      e = $(Lampa.Template.get("menu-button", { icon: y, text: a }));
    e.on("hover:enter", function() { Lampa.Activity.push({ url: "", title: a, component: "downloads-tab", page: 1 }) }), $(".menu .menu__list").eq(0).append(e)
  }

  var at = 10,
    u = class u {
      static start() {
        var o;
        let e = Lampa.Storage.field(J),
          t = (o = H[e]) != null ? o : H[0];
        u.subscription && clearInterval(u.subscription), u.consecutiveErrors = 0, u.wasConnected = null, u.subscription = setInterval(u.tick, t * 1e3)
      }
      static tick() {
        return l(this, null, function*() {
          try {
            let e = yield m.getClient().getData();
            if (e && e.torrents) {
              yield w.setData(e);
              if ($(".d-updatable").length)
                for (let o of e.torrents) we(o), ye(o), Ae(o);
              let t = m.getClient().url;
              u.consecutiveErrors = 0, m.isConnected = !0, u.wasConnected !== !0 && (h("Connected to " + t), Lampa.Noty.show(Lampa.Lang.translate("background-worker.connection-success") + ": " + t), u.wasConnected = !0)
            }
          } catch (e) {
            h("Error:", e), m.isConnected = !1, u.consecutiveErrors++, u.wasConnected !== !1 && (Lampa.Noty.show(Lampa.Lang.translate("background-worker.error-detected")), u.wasConnected = !1), u.consecutiveErrors > at && (clearInterval(u.subscription), h("Stopping background worker due to too many consecutive errors"))
          }
        })
      }
    };
  u.consecutiveErrors = 0, u.wasConnected = null;
  var _ = u;

  var J = `${d.component}.interval`,
    B = `${d.component}.default-action`,
    Q = `${d.component}.allow-multiple-marks`,
    K = `${d.component}.poster-quality`,
    I = `${d.component}.server.url`,
    Z = `${d.component}.server.login`,
    X = `${d.component}.server.password`,
    ee = `${d.component}.server.type`,
    te = `${d.component}.jellyfin.separate-movies-tv`,
    P = `${d.component}.jellyfin.subfolder`,
    N = `${d.component}.jellyfin.include-year`,
    k = `${d.component}.jellyfin.include-tmdbid`,
    H = [2, 5, 10, 30, 60, 5 * 60, 15 * 60],
    q = ["w200", "w342", "w500", "w780", "w1280"];

  function Ce() {
    Lampa.SettingsApi.addComponent({ component: d.component, name: d.name, icon: y }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: J, type: "select", placeholder: "2s", values: ["2s", "5s", "10s", "30s", "1m", "5m", "15m"], default: 0 }, field: { name: "Update interval" }, onChange(a) { Lampa.Settings.update(), _.start() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: B, type: "select", placeholder: "", values: ["Open actions menu", "Play if done, Resume if in progress", "Play", "Resume / Pause download"], default: 0 }, field: { name: "Default press action", description: "Long press always opens the actions menu." }, onChange(a) { Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: Q, type: "trigger", default: !1 }, field: { name: "Keep torrents screen open after download", description: "After selecting a torrent, the app does not return back and keeps the add screen open, allowing you to add multiple torrents in a row." }, onChange(a) { Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: K, type: "select", placeholder: "", values: ["Low", "Medium", "High", "Very High", "Ultra"], default: 1 }, field: { name: "Poster quality" }, onChange(a) { Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: "transmission-title", type: "title", default: "" }, field: { name: "Server settings:" } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: ee, type: "select", placeholder: "", values: ["Transmission", "qBitTorrent"], default: "0" }, field: { name: "Torrent Client" }, onChange(a) { Lampa.Settings.update(), m.reset() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: I, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Url" }, onChange(a) { Lampa.Settings.update(), m.reset() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: Z, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Login" }, onChange(a) { Lampa.Settings.update(), m.reset() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: X, type: "input", placeholder: "", values: "", default: "" }, field: { name: "Password" }, onChange(a) { Lampa.Settings.update(), m.reset() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: "jellyfin-title", type: "title", default: "" }, field: { name: "Jellyfin / Plex integration:" } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: te, type: "trigger", default: !1 }, field: { name: "Download movies and TV shows into separate directories" }, onChange() { Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: P, type: "trigger", default: !1 }, field: { name: "Download into a subfolder with title" }, onChange() { Lampa.Storage.field(P) !== !0 && (Lampa.Storage.set(N, !1), Lampa.Storage.set(k, !1)), Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: N, type: "trigger", default: !1 }, field: { name: "Add (year) to folder name" }, onRender(a) { Lampa.Storage.field(P) === !0 ? a.show() : a.hide() }, onChange() { Lampa.Settings.update() } }), Lampa.SettingsApi.addParam({ component: d.component, param: { name: k, type: "trigger", default: !1 }, field: { name: "Add [tmdbid-***] to folder name" }, onRender(a) { Lampa.Storage.field(P) === !0 ? a.show() : a.hide() }, onChange() { Lampa.Settings.update() } }))
  }

  var Pe = "lampa:";

  function Ne(a) { return Array.isArray(a) ? a : typeof a == "string" ? a.split(",").map(e => e.trim()).filter(Boolean) : [] }

  function O(a) { var n; let t = (n = Ne(a).find(r => r.startsWith(Pe))) == null ? void 0 : n.split(":")[1]; if (!t) return 0; let o = parseInt(t, 10); return Number.isFinite(o) && o > 0 ? o : 0 }

  function R(a) { return Ne(a).indexOf("tv") !== -1 ? "tv" : "movie" }

  function x(a) { let e = [Pe + a.id]; return ke(a) && e.push("tv"), e }

  function M(a) {
    let e = (a.title || a.name).trim(),
      t = a.release_year || (a.release_date ? a.release_date.slice(0, 4) : "") || (a.first_air_date ? a.first_air_date.slice(0, 4) : ""),
      o = "";
    return Lampa.Storage.field(te) && (o += `/${ke(a)?"tv":"movie"}`), o += `/${e}`, Lampa.Storage.field(N) && t && (o += ` (${t})`), Lampa.Storage.field(k) && (o += ` [tmdbid-${a.id}]`), o
  }

  function ke(a) { return Array.isArray(a.seasons) || a.season !== void 0 || a.episode_number !== void 0 }

  // Исправленный класс qBittorrent для Android TV
  var U = class {
    constructor(e, t, o, n) {
      this.url = e;
      this.login = t || '';
      this.password = o || '';
      this.cookie = n;
      this.network = AndroidTVNetwork;
      this.isAuthorized = false;
    }
    
    fetchWithAuth(e, t = {}) {
      return l(this, arguments, function*(e, t = {}) {
        try {
          // Проверяем авторизацию перед запросом
          if (!this.isAuthorized) {
            yield this.authorize();
          }

          let response = yield this.network.fetchWithTimeout(this.url + e, {
            ...t,
            credentials: 'include',
            headers: {
              'Accept': '*/*',
              ...t.headers
            }
          });

          // Если 403, пробуем авторизоваться снова
          if (response.status === 403) {
            this.isAuthorized = false;
            yield this.authorize();
            response = yield this.network.fetchWithTimeout(this.url + e, {
              ...t,
              credentials: 'include',
              headers: {
                'Accept': '*/*',
                ...t.headers
              }
            });
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return yield response.json();
          }
          return yield response.text();
        } catch (error) {
          console.error('Network error:', error);
          throw error;
        }
      });
    }

    authorize() {
      return l(this, null, function*() {
        try {
          if (!this.login || !this.password) {
            throw new Error('Login and password required');
          }

          let formData = new URLSearchParams();
          formData.append('username', this.login);
          formData.append('password', this.password);

          let response = yield this.network.fetchWithTimeout(this.url + '/api/v2/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString(),
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
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
    }

    getTorrents() {
      return l(this, null, function*() {
        try {
          let e = yield this.fetchWithAuth('/api/v2/torrents/info');
          let t = yield this.fetchWithAuth('/api/v2/app/preferences');
          return this.formatTorrents(e, t);
        } catch (error) {
          console.error('Get torrents error:', error);
          return [];
        }
      });
    }

    getData() {
      return l(this, null, function*() {
        var n;
        try {
          let e = yield this.fetchWithAuth('/api/v2/sync/maindata');
          let t = (n = e.torrents) != null ? n : [];
          t = Array.isArray(t) ? t : Object.keys(t).map(r => D(A({}, t[r]), { hash: r }));
          let o = yield this.fetchWithAuth('/api/v2/app/preferences');
          return { torrents: this.formatTorrents(t, o), info: { freeSpace: e.server_state.free_space_on_disk || 0 } };
        } catch (error) {
          console.error('Get data error:', error);
          return { torrents: [], info: { freeSpace: 0 } };
        }
      });
    }

    addTorrent(e, t) {
      return l(this, null, function*() {
        try {
          // Для Android TV используем простой метод добавления
          let url = t.MagnetUri || t.Link;
          if (!url) {
            throw new Error('No torrent URL provided');
          }

          // Очищаем URL от параметров
          try {
            let urlObj = new URL(url);
            urlObj.searchParams.delete('dn');
            url = urlObj.toString();
          } catch (e) {
            // Если не удалось парсить URL, используем как есть
          }

          let formData = new FormData();
          formData.append('urls', url);
          formData.append('sequentialDownload', 'true');
          
          // Добавляем теги
          let tags = x(e);
          if (tags && tags.length) {
            formData.append('tags', tags.join(','));
          }

          // Добавляем путь сохранения
          let savePath = M(e);
          if (savePath) {
            try {
              let prefs = yield this.fetchWithAuth('/api/v2/app/preferences');
              if (prefs && prefs.save_path) {
                let basePath = prefs.save_path.replace(/[\\/]+$/g, '');
                formData.append('savepath', basePath + savePath);
              }
            } catch (err) {
              console.warn('Could not get save path:', err);
            }
          }

          console.log('Adding torrent:', url, 'with tags:', tags);

          let response = yield this.network.postFormData(this.url + '/api/v2/torrents/add', formData, {
            credentials: 'include'
          });

          if (!response.ok) {
            let errorText = yield response.text();
            throw new Error(`Add torrent failed: ${response.status} - ${errorText}`);
          }

          console.log('Torrent added successfully');
          return true;
        } catch (error) {
          console.error('Add torrent error:', error);
          throw error;
        }
      });
    }

    startTorrent(e) {
      return l(this, null, function*() {
        let t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        yield this.fetchWithAuth('/api/v2/torrents/start', { method: 'POST', body: t });
      });
    }

    stopTorrent(e) {
      return l(this, null, function*() {
        let t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        yield this.fetchWithAuth('/api/v2/torrents/stop', { method: 'POST', body: t });
      });
    }

    hideTorrent(e) {
      return l(this, null, function*() {
        let t = new URLSearchParams();
        t.append('hashes', String(e.externalId));
        t.append('tags', 'hide');
        yield this.fetchWithAuth('/api/v2/torrents/addTags', { method: 'POST', body: t });
      });
    }

    removeTorrent(e, t = !1) {
      return l(this, null, function*() {
        let o = new URLSearchParams();
        o.append('hashes', String(e.externalId));
        o.append('deleteFiles', t ? 'true' : 'false');
        yield this.fetchWithAuth('/api/v2/torrents/delete', { method: 'POST', body: o });
      });
    }

    getFiles(e) {
      return l(this, null, function*() {
        let t = new URLSearchParams();
        t.append('hash', String(e.externalId));
        return (yield this.fetchWithAuth(`/api/v2/torrents/files?${t.toString()}`)).map(n => {
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
    }

    formatTorrents(e, t) {
      return e.sort((o, n) => n.added_on - o.added_on).filter(o => !o.tags || !o.tags.includes('hide')).map(o => ({
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
      }));
    }
  };

  // Исправленный класс Transmission для Android TV
  var z = class {
    constructor(e, t, o, n) {
      this.url = e;
      this.login = t;
      this.password = o;
      this.sessionId = n;
      this.network = AndroidTVNetwork;
    }
    
    POST(e) {
      return l(this, null, function*() {
        try {
          let response = yield this.network.postJSON(this.url, e, {
            headers: {
              Authorization: `Basic ${btoa(this.login + ':' + this.password)}`,
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
            throw new Error(`Transmission RPC error: ${response.statusText}`);
          }

          return yield response.json();
        } catch (error) {
          console.error('Transmission POST error:', error);
          throw error;
        }
      });
    }

    getSession() {
      let e = { method: 'session-get' };
      return this.POST(e);
    }

    addTorrent(e) {
      let t = { method: 'torrent-add', arguments: e };
      return this.POST(t);
    }

    getTorrents(e) {
      let t = { method: 'torrent-get', arguments: e };
      return this.POST(t);
    }

    setTorrent(e) {
      let t = { method: 'torrent-set', arguments: e };
      return this.POST(t);
    }

    startTorrent(e) {
      let t = { method: 'torrent-start', arguments: e };
      return this.POST(t);
    }

    stopTorrent(e) {
      let t = { method: 'torrent-stop', arguments: e };
      return this.POST(t);
    }

    removeTorrent(e) {
      let t = { method: 'torrent-remove', arguments: e };
      return this.POST(t);
    }
  };

  var F = class {
    constructor(e, t, o) {
      this.url = e;
      this.login = t;
      this.password = o;
      this.client = new z(e + '/transmission/rpc', t, o);
      this.network = AndroidTVNetwork;
    }

    getTorrents() {
      return l(this, null, function*() {
        var n, r;
        try {
          let e = yield this.client.getSession();
          let t = ((n = e == null ? void 0 : e.arguments) == null ? void 0 : n['download-dir']) || '';
          return ((r = (yield this.client.getTorrents({
            fields: ['id', 'name', 'status', 'percentDone', 'sizeWhenDone', 'rateDownload', 'eta', 'labels', 'files', 'peersConnected', 'peersSendingToUs', 'trackerStats', 'hashString', 'downloadDir']
          })).arguments) == null ? void 0 : r.torrents.filter(s => !Array.isArray(s.labels) || s.labels.indexOf('hide') === -1).map(s => {
            var g;
            let i = 0,
              c = 0;
            if (Array.isArray(s.trackerStats)) {
              i = Math.max(...s.trackerStats.map(f => f.seederCount || 0), 0);
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
          }).filter(s => s.id)) || [];
        } catch (error) {
          console.error('Get torrents error:', error);
          return [];
        }
      });
    }

    addTorrent(e, t) {
      return l(this, null, function*() {
        var s, i;
        try {
          let o = {
            paused: !1,
            sequential_download: !0,
            filename: t.MagnetUri || t.Link,
            labels: x(e)
          };
          
          let n = M(e);
          if (n) {
            let c = yield this.client.getSession();
            let g = (s = c == null ? void 0 : c.arguments) == null ? void 0 : s['download-dir'];
            if (g) {
              o['download-dir'] = g.replace(/[\\/]+$/g, '') + n;
            }
          }

          console.log('Adding torrent:', o);
          let r = yield this.client.addTorrent(o);
          
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
    }

    startTorrent(e) {
      return l(this, null, function*() {
        yield this.client.startTorrent({ ids: [e.externalId] });
      });
    }

    stopTorrent(e) {
      return l(this, null, function*() {
        yield this.client.stopTorrent({ ids: [e.externalId] });
      });
    }

    hideTorrent(e) {
      return l(this, null, function*() {
        var n, r;
        let o = ((r = (n = (yield this.client.getTorrents({ ids: [e.externalId], fields: ['labels'] })).arguments) == null ? void 0 : n.torrents[0]) == null ? void 0 : r.labels) || [];
        yield this.client.setTorrent({ ids: [e.externalId], labels: [...o, 'hide'] });
      });
    }

    removeTorrent(e, t = !1) {
      return l(this, null, function*() {
        yield this.client.removeTorrent({ ids: [e.externalId], 'delete-local-data': t });
      });
    }

    getFiles(e) {
      return l(this, null, function*() {
        return e.files || [];
      });
    }

    getData() {
      return l(this, null, function*() {
        try {
          return { torrents: yield this.getTorrents(), info: { freeSpace: 0 } };
        } catch (error) {
          console.error('Get data error:', error);
          return { torrents: [], info: { freeSpace: 0 } };
        }
      });
    }
  };

  var m = class {
    static getClient() {
      if (!this.client) {
        let t = (Lampa.Storage.field(I) || '').split(';').map(o => o.trim()).filter(Boolean);
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
    }

    static reset() {
      this.client = void 0;
      this.selectionInFlight = !1;
    }

    static buildClient(e) {
      let t = Lampa.Storage.field(ee) === 1;
      let o = Lampa.Storage.field(Z) || '';
      let n = Lampa.Storage.field(X) || '';
      this.client = t ? new U(e, o, n) : new F(e, o, n);
      console.log('Client built for:', e);
    }

    static selectUrl(e) {
      if (this.selectionInFlight) return;
      this.selectionInFlight = !0;
      let t = e.map(r => AndroidTVNetwork.fetchWithTimeout(r + '/ping', { cache: 'no-cache' }).then(s => s.ok ? r : Promise.reject()));
      let o = 0,
        n = !1;
      t.forEach(r => r.then(s => {
        if (!n) {
          n = !0;
          this.selectionInFlight = !1;
          if (!this.client || this.client.url !== s) {
            this.buildClient(s);
          }
        }
      }).catch(() => {
        ++o === t.length && !n && (n = !0, this.selectionInFlight = !1);
      }));
    }
  };
  m.selectionInFlight = !1;
  m.isConnected = !1;

  var $e = `<div class="full-start__button selector button--download">
    {icon}
    <span>{text}</span>
</div>`;

  function nt(a) {
    let e = $('.full-start-new__buttons');
    if (e.find('.button--download').length) return;
    let t = $(Lampa.Template.get('download-button', { icon: y, text: Lampa.Lang.translate('download') }));
    t.on('hover:enter', o => {
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
    
    Lampa.Listener.follow('full', a => {
      if (a.type === 'complite') {
        let e = a.data;
        nt(e);
      }
    });

    Lampa.Listener.follow('torrent', a => {
      let e = Lampa.Activity.active();
      if (a.type === 'render' && e.component === 'torrents-download') {
        $(a.item).off('hover:enter');
        $(a.item).on('hover:enter', t => l(this, null, function*() {
          try {
            let client = m.getClient();
            if (!client) {
              Lampa.Noty.show('Please configure server URL in settings');
              return;
            }

            // Показываем уведомление о начале добавления
            Lampa.Noty.show('Adding torrent...');
            console.log('Adding torrent for movie:', e.movie);

            yield client.addTorrent(e.movie, a.element);
            Lampa.Noty.show(Lampa.Lang.translate('download-button.added'));
            
            // Отмечаем как добавленный
            if (e.activity && e.activity.component) {
              e.activity.component.mark(a.element, a.item, !0);
            }

            // Если не нужно оставаться на экране добавления
            if (!Lampa.Storage.get(Q, !1)) {
              Lampa.Activity.back();
              // Пытаемся получить добавленный торрент
              try {
                let torrents = yield client.getTorrents();
                let r = torrents.find(s => s.id === e.movie.id);
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
        }));
      }
    });
  }

  function initPlugin() {
    try {
      console.log('Initializing Torrent Downloader for Android TV...');

      // Проверяем настройки
      const url = Lampa.Storage.field(I);
      if (!url) {
        console.warn('Server URL not configured');
        setTimeout(() => {
          Lampa.SettingsApi.open(d.component);
        }, 2000);
        return;
      }

      window.plugin_transmission_ready = !0;
      Lampa.Manifest.plugins = d;
      Lampa.Lang.add(re);
      
      // Инициализируем компоненты
      Ce();
      Oe();
      he();
      De();
      Le();

      // Запускаем фоновый процесс с задержкой
      setTimeout(() => {
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

  // Точка входа
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
