(function() {
    const PLUGIN_NAME = 'SettingsMenuEditorPro';
    const STORAGE_KEY = 'lampa_settings_custom_order';
    const HIDDEN_KEY = 'lampa_hidden_settings_items';
    const ACTIVE_CLASS = 'settings-folder--active';
    const EDIT_MODE_CLASS = 'settings--edit-mode';
    const HIDDEN_CLASS = 'settings-folder--hidden';

    let editMode = false;
    let currentItem = null;
    let settingsContainer = null;
    let longPressTimer = null;

    function init() {
        console.log(`[${PLUGIN_NAME}] Initializing...`);

        Settings.listener.follow('open', (e) => {
            if (!settingsContainer && e.body) {
                settingsContainer = e.body.find('.scroll__body > div');
                setupEditor();
            }
        });

        Controller.add('settings_editor', {
            up: () => editMode && moveSelection(-1),
            down: () => editMode && moveSelection(1),
            left: () => editMode && toggleVisibility(currentItem),
            right: () => editMode && toggleVisibility(currentItem),
            back: () => editMode && toggleEditMode(false),
            ok: () => editMode && showItemActions()
        });
    }

    function setupEditor() {
        addStyles();
        bindLongPress();
        loadSettings();
    }

    function bindLongPress() {
        settingsContainer.find('.settings-folder').on('hover:long', function() {
            if (!editMode) {
                toggleEditMode(true);
                currentItem = $(this);
                highlightItem(currentItem);
            }
        });
    }

    function toggleEditMode(enable) {
        editMode = enable;
        $('body').toggleClass(EDIT_MODE_CLASS, editMode);
        
        if (editMode) {
            Controller.toggle('settings_editor');
            console.log(`[${PLUGIN_NAME}] Edit mode activated`);
        } else {
            Controller.toggle('settings');
            saveSettings();
            console.log(`[${PLUGIN_NAME}] Edit mode deactivated`);
        }
    }

    // Остальные функции остаются без изменений (moveSelection, highlightItem и т.д.)
    // ... 

    function addStyles() {
        const css = `
            .${EDIT_MODE_CLASS} .settings-folder {
                position: relative;
                transition: all 0.2s;
            }
            .${ACTIVE_CLASS} {
                background: rgba(255,165,0,0.3) !important;
                border-left: 3px solid orange !important;
            }
            .${HIDDEN_CLASS} {
                opacity: 0.4;
                filter: grayscale(80%);
            }
            .${EDIT_MODE_CLASS} .settings-folder::after {
                content: "✓";
                position: absolute;
                right: 15px;
                color: orange;
                font-size: 20px;
            }
            .${EDIT_MODE_CLASS} .${HIDDEN_CLASS}::after {
                content: "✕";
                color: #ff3d3d;
            }
        `;
        $('<style>').html(css).appendTo('head');
    }

    Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') init();
    });
})();
