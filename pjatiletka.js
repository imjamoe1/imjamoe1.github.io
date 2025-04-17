(function () {
    function log(message) {
        console.log("[IPTV Plugin] " + message);
    }

    if (!window.Lampa || !Lampa.Player) {
        console.error("❌ Ошибка: Lampa или Lampa.Player не найдены!");
        return;
    }

    let playlists = JSON.parse(localStorage.getItem('my_iptv_playlists') || "[]");

    function savePlaylists() {
        localStorage.setItem('my_iptv_playlists', JSON.stringify(playlists));
        log("✅ Плейлисты сохранены.");
    }

    function openIPTVMenu() {
        let list = playlists.map((url, index) => ({
            title: "📺 Плейлист " + (index + 1),
            subtitle: url,
            action: () => playIPTV(url),
            remove: () => removePlaylist(index)
        }));

        list.push({
            title: "➕ Добавить новый плейлист",
            action: addNewPlaylist
        });

        Lampa.Select.show({
            title: "Мой IPTV",
            items: list,
            onBack: () => Lampa.Menu.show()
        });
    }

    function addNewPlaylist() {
        Lampa.Settings.show({
            title: "Введите M3U-ссылку",
            input: true,
            value: "",
            onBack: openIPTVMenu,
            onSelect: (value) => {
                if (value.trim()) {
                    playlists.push(value.trim());
                    savePlaylists();
                    Lampa.Noty.show("✅ Плейлист добавлен!");
                    openIPTVMenu();
                } else {
                    Lampa.Noty.show("⚠️ Ошибка: ссылка пустая.");
                }
            }
        });
    }

    function removePlaylist(index) {
        playlists.splice(index, 1);
        savePlaylists();
        Lampa.Noty.show("🗑️ Плейлист удалён.");
        openIPTVMenu();
    }

    function playIPTV(url) {
        if (!Lampa.Player || !Lampa.Player.play) {
            console.error("❌ Ошибка: Встроенный плеер не найден!");
            Lampa.Noty.show("⚠️ Ошибка: встроенный плеер не поддерживается.");
            return;
        }

        Lampa.Noty.show("🎬 Открываем IPTV: " + url);

        Lampa.Player.play({
            title: "📺 IPTV Плеер",
            url: url,
            method: "play"
        });

        log("✅ Поток запущен через встроенный плеер.");
    }

    Lampa.Listener.follow('app', (event) => {
        if (event.type === "ready") {
            if (!Lampa.Menu || !Lampa.Menu.addItem) {
                console.error("❌ Ошибка: Lampa.Menu.addItem не найден!");
                return;
            }

            log("✅ Lampa загружена, добавляем меню.");
            Lampa.Menu.addItem({
                title: "📺 Мой IPTV",
                icon: "icon iptv",
                action: openIPTVMenu
            });
        }
    });

    log("✅ IPTV-плагин загружен.");
})();
