(function () {
    'use strict';

    // Константы плагина
    const STYLE_TAG = 'cardbtn-style';           // ID для тега стилей
    const ORDER_STORAGE = 'cardbtn_order';       // Ключ для хранения порядка кнопок
    const HIDE_STORAGE = 'cardbtn_hidden';       // Ключ для хранения скрытых кнопок
    const RENAME_STORAGE = 'cardbtn_renamed';    // Ключ для хранения переименованных кнопок
    let currentCard = null;                      // Текущий контейнер открытой карточки
    let currentActivity = null;                  // Текущая активность (для фокуса)
    let renameModalActive = false;               // Флаг активности модального окна переименования

    // Метки по умолчанию (для кнопок без текста)
    const DEFAULT_LABELS = {
      'button--play': () => Lampa.Lang.translate('title_watch'),
      'button--book': () => Lampa.Lang.translate('settings_input_links'),
      'button--reaction': () => Lampa.Lang.translate('title_reactions'),
      'button--subscribe': () => Lampa.Lang.translate('title_subscribe'),
      'button--options': () => Lampa.Lang.translate('more'),
      'view--torrent': () => Lampa.Lang.translate('full_torrents'),
      'view--trailer': () => Lampa.Lang.translate('full_trailers')
    };

    // Добавляет стили плагина в <head>
    function addStyles() {
      if (document.getElementById(STYLE_TAG)) return;
      const css = `
        .card-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .card-button-hidden {
            display: none !important;
        }
        .card-icons-only span {
            display: none;
        }
        .card-always-text span {
            display: block !important;
        }
        .head__action.edit-card svg {
            width: 26px;
            height: 26px;
        }
        .menu-edit-list__rename {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            margin-right: 10px;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .menu-edit-list__rename:hover {
            opacity: 1;
        }
        .menu-edit-list__rename svg {
            width: 18px;
            height: 18px;
        }
        .rename-modal-content {
            padding: 20px;
        }
        .rename-input {
            width: 100%;
            padding: 12px 16px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            margin-bottom: 20px;
            outline: none;
        }
        .rename-input:focus {
            border-color: rgba(255, 255, 255, 0.4);
        }
        .rename-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .rename-button {
            padding: 10px 20px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: background 0.2s;
        }
        .rename-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .rename-button.save {
            background: #3498db;
        }
        .rename-button.save:hover {
            background: #2980b9;
        }
        .rename-input.input--focus {
            border-color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.15);
        }
        .rename-input-container {
            position: relative;
        }
    `;
      $('head').append(`<style id="${STYLE_TAG}">${css}</style>`);
    }

    // Читает массив из Storage (поддерживает JSON и строку через запятую)
    function getStoredArray(key) {
      const data = Lampa.Storage.get(key);
      if (Array.isArray(data)) return data.slice();
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return data.split(',').map(v => v.trim()).filter(Boolean);
        }
      }
      return [];
    }

    // Читает объект переименований из Storage
    function getRenamedButtons() {
      const data = Lampa.Storage.get(RENAME_STORAGE);
      return data && typeof data === 'object' ? data : {};
    }

    // Получает контейнер карточки из события full
    function getCardContainer(e) {
      if (e && e.body) return e.body;
      if (e && e.link && e.link.html) return e.link.html;
      if (e && e.object && e.object.activity && typeof e.object.activity.render === 'function') return e.object.activity.render();
      return null;
    }

    // Находит активную карточку на экране
    function findActiveCard() {
      const active = $('.full-start-new').first();
      return active.length ? active : null;
    }

    // Извлекает уникальный ключ кнопки (по классу, data или хэшу)
    function extractButtonKey($element) {
      const classes = ($element.attr('class') || '').split(/\s+/);
      const keyClass = classes.find(c => c.startsWith('button--') && c !== 'button--priority') ||
                       classes.find(c => c.startsWith('view--'));
      if (keyClass) return keyClass;
      const dataKey = $element.data('id') || $element.data('name') || $element.attr('data-name');
      if (dataKey) return `data:${dataKey}`;
      const textKey = $element.text().trim();
      if (textKey) return `text:${textKey}`;
      return `hash:${Lampa.Utils.hash($element.clone().removeClass('focus').prop('outerHTML'))}`;
    }

    // Извлекает текст кнопки (или из fallback)
    function extractButtonLabel(key, $element) {
      const renamed = getRenamedButtons();
      if (renamed[key]) return renamed[key];
      
      const text = $element.find('span').first().text().trim() || $element.text().trim();
      if (text) return text;
      if (DEFAULT_LABELS[key]) return DEFAULT_LABELS[key]();
      return key;
    }

    // Собирает все кнопки действий из карточки
    function collectButtons(container, remove) {
      const mainArea = container.find('.full-start-new__buttons');
      const extraArea = container.find('.buttons--container');
      const keys = [];
      const elements = {};
      function process($items) {
        $items.each(function () {
          const $item = $(this);
          if ($item.hasClass('button--play') || $item.hasClass('button--priority')) return;
          const key = extractButtonKey($item);
          if (!key || elements[key]) return;
          elements[key] = remove ? $item.detach() : $item;
          keys.push(key);
        });
      }
      process(mainArea.find('.full-start__button'));
      process(extraArea.find('.full-start__button'));
      return {
        keys,
        elements,
        mainArea,
        extraArea
      };
    }

    // Формирует порядок кнопок (сохранённый + новые в конце)
    function buildOrder(saved, available) {
      const result = [];
      const known = new Set(available);
      saved.forEach(k => {
        if (known.has(k)) result.push(k);
      });
      available.forEach(k => {
        if (!result.includes(k)) result.push(k);
      });
      return result;
    }

    // Применяет скрытие кнопок из настроек
    function hideButtons(elements) {
      const hidden = new Set(getStoredArray(HIDE_STORAGE));
      Object.keys(elements).forEach(k => {
        elements[k].toggleClass('card-button-hidden', hidden.has(k));
      });
    }

    // Основная функция перестройки кнопок в карточке
    function rebuildCard(container) {
      if (Lampa.Storage.get('cardbtn_showall') !== true) return;

      if (!container || !container.length) return;

      addStyles();

      // Добавляет кнопку-карандаш в хедер карточки
      const header = container.find('.head__actions');
      if (header.length) {
        let pencil = header.find('.edit-card');
        if (pencil.length === 0) {
          pencil = $(`
            <div class="head__action selector edit-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          `);

          header.find('.open--settings').after(pencil);

          pencil.on('hover:enter', () => {
            startEditor(container, false);
          });
        }
      }

      // Убирает стандартные кнопки и собирает все действия
      const priorityBtn = container.find('.full-start-new__buttons .button--priority').detach();
      container.find('.full-start-new__buttons .button--play').remove();

      const collected = collectButtons(container, true);
      const { keys, elements, mainArea } = collected;

      // Формирует порядок (сохранённый или дефолтный: онлайн → торренты)
      const saved = getStoredArray(ORDER_STORAGE);
      let ordered = buildOrder(saved, keys);

      if (saved.length === 0) {
        ordered.sort((a, b) => {
          const aOnline = a.startsWith('button--');
          const bOnline = b.startsWith('button--');
          if (aOnline && !bOnline) return -1;
          if (!aOnline && bOnline) return 1;
          return 0;
        });
      }

      // Заполняет контейнер кнопками в нужном порядке
      mainArea.empty();
      if (priorityBtn.length) mainArea.append(priorityBtn);
      ordered.forEach(k => {
        if (elements[k]) mainArea.append(elements[k]);
      });

      // Применяет режим отображения текста
      const mode = Lampa.Storage.get('cardbtn_viewmode', 'default');
      mainArea.removeClass('card-icons-only card-always-text');
      if (mode === 'icons') mainArea.addClass('card-icons-only');
      if (mode === 'always') mainArea.addClass('card-always-text');

      mainArea.addClass('card-buttons');
      hideButtons(elements);

      Lampa.Controller.toggle("full_start");

      // Корректирует фокус после перестройки
      if (currentActivity && currentActivity.html && container[0] === currentActivity.html[0]) {
        const first = mainArea.find('.full-start__button.selector').not('.hide').not('.card-button-hidden').first();
        if (first.length) currentActivity.last = first[0];
      }
    }

    // Создает кастомное поле ввода с нормальной навигацией
    function createRenameInput(currentValue) {
      const input = $(`
        <div class="rename-input-wrapper">
          <input type="text" class="rename-input" value="${currentValue.replace(/"/g, '&quot;')}" placeholder="Введите новое название">
        </div>
      `);

      const inputElement = input.find('input')[0];
      
      return {
        element: input,
        inputElement: inputElement
      };
    }

    // Обработчик глобальных клавиш для модального окна переименования
    function setupGlobalKeyHandler(inputElement, callback, cancelCallback) {
      const keyHandler = function(e) {
        if (!renameModalActive) return;
        
        // Enter - сохранить
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          
          const newName = inputElement.value.trim();
          if (newName) {
            callback(newName);
            removeGlobalKeyHandler();
            Lampa.Modal.close();
          }
          return false;
        }
        
        // Escape - отмена
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          
          cancelCallback();
          removeGlobalKeyHandler();
          Lampa.Modal.close();
          return false;
        }
        
        // Back - отмена (кнопка назад на пульте)
        if (e.key === 'Back' || e.keyCode === 8) {
          // Не блокируем Back, если курсор в начале текста
          if (inputElement.selectionStart === 0 && inputElement.selectionEnd === 0) {
            e.preventDefault();
            e.stopPropagation();
            
            cancelCallback();
            removeGlobalKeyHandler();
            Lampa.Modal.close();
            return false;
          }
        }
        
        // Разрешаем все остальные клавиши для редактирования текста
        return true;
      };
      
      // Добавляем обработчик
      document.addEventListener('keydown', keyHandler, true);
      
      // Функция для удаления обработчика
      function removeGlobalKeyHandler() {
        document.removeEventListener('keydown', keyHandler, true);
        renameModalActive = false;
      }
      
      return removeGlobalKeyHandler;
    }

    // Открывает модальное окно для переименования кнопки
    function openRenameModal(key, currentLabel, callback) {
      renameModalActive = true;
      
      const content = $(`
        <div class="rename-modal-content">
          <div class="rename-input-container"></div>
          <div class="rename-buttons">
            <div class="rename-button selector cancel">Отмена</div>
            <div class="rename-button selector save">Сохранить</div>
          </div>
        </div>
      `);

      const inputContainer = content.find('.rename-input-container');
      const inputObj = createRenameInput(currentLabel);
      inputContainer.append(inputObj.element);

      const modal = Lampa.Modal.open({
        title: 'Переименовать кнопку',
        html: content,
        size: 'small',
        scroll_to_center: true,
        onBack: () => {
          removeGlobalKeyHandler();
          renameModalActive = false;
          Lampa.Modal.close();
        }
      });

      const inputElement = inputObj.inputElement;
      
      // Устанавливаем фокус без выделения текста
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          // Устанавливаем курсор в конец текста, без выделения
          const len = inputElement.value.length;
          inputElement.setSelectionRange(len, len);
          
          // Добавляем класс focus для стилизации
          $(inputElement).addClass('input--focus');
        }
      }, 100);

      // Обработчик потери фокуса
      $(inputElement).on('blur', function() {
        $(this).removeClass('input--focus');
      });

      // Обработчик получения фокуса
      $(inputElement).on('focus', function() {
        $(this).addClass('input--focus');
      });

      // Глобальный обработчик клавиш
      const removeGlobalKeyHandler = setupGlobalKeyHandler(
        inputElement,
        (newName) => {
          callback(newName);
        },
        () => {
          // Отмена
        }
      );

      // Обработчики для кнопок
      content.find('.cancel').on('hover:enter', () => {
        removeGlobalKeyHandler();
        renameModalActive = false;
        Lampa.Modal.close();
      });

      content.find('.save').on('hover:enter', () => {
        const newName = $(inputElement).val().trim();
        if (newName) {
          callback(newName);
          removeGlobalKeyHandler();
          renameModalActive = false;
          Lampa.Modal.close();
        }
      });
      
      // Обработчик клика по модальному окну - возвращаем фокус на input
      content.on('click', function(e) {
        if (e.target === this || $(e.target).hasClass('rename-modal-content')) {
          if (inputElement) {
            inputElement.focus();
          }
        }
      });
      
      // Обработчик закрытия модального окна
      $(document).on('modal.closed', function() {
        removeGlobalKeyHandler();
        renameModalActive = false;
      });
    }

    // Открывает модальное окно редактора кнопок
    function startEditor(container, fromSettings = false) {
      if (!container || !container.length) return;

      const collected = collectButtons(container, false);
      const { keys, elements } = collected;

      const ordered = buildOrder(getStoredArray(ORDER_STORAGE), keys);
      const hidden = new Set(getStoredArray(HIDE_STORAGE));
      const renamed = getRenamedButtons();

      const editorList = $('<div class="menu-edit-list"></div>');

      // Формирует список кнопок в редакторе
      ordered.forEach(k => {
        const $elem = elements[k];
        if (!$elem || !$elem.length) return;

        const label = extractButtonLabel(k, $elem);
        const svg = $elem.find('svg').first().prop('outerHTML') || '';

        const row = $(`
          <div class="menu-edit-list__item" data-id="${k}">
            <div class="menu-edit-list__icon"></div>
            <div class="menu-edit-list__title">${label}</div>
            <div class="menu-edit-list__rename selector" title="Переименовать">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div class="menu-edit-list__move move-up selector">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="menu-edit-list__move move-down selector">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="menu-edit-list__toggle toggle selector">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/>
                <path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" opacity="0" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        `);

        if (svg) row.find('.menu-edit-list__icon').append(svg);

        row.toggleClass('menu-edit-list__item-hidden', hidden.has(k));
        row.find('.dot').attr('opacity', hidden.has(k) ? 0 : 1);

        // Обработчик переименования
        row.find('.menu-edit-list__rename').on('hover:enter', (e) => {
          e.stopPropagation();
          openRenameModal(k, label, (newName) => {
            const renamedButtons = getRenamedButtons();
            renamedButtons[k] = newName;
            Lampa.Storage.set(RENAME_STORAGE, renamedButtons);
            row.find('.menu-edit-list__title').text(newName);
          });
        });

        row.find('.move-up').on('hover:enter', () => {
          const prev = row.prev();
          if (prev.length) row.insertBefore(prev);
        });

        row.find('.move-down').on('hover:enter', () => {
          const next = row.next();
          if (next.length) row.insertAfter(next);
        });

        row.find('.toggle').on('hover:enter', () => {
          row.toggleClass('menu-edit-list__item-hidden');
          row.find('.dot').attr('opacity', row.hasClass('menu-edit-list__item-hidden') ? 0 : 1);
        });

        editorList.append(row);
      });

      // Открывает модальное окно
      Lampa.Modal.open({
        title: 'Редактировать кнопки',
        html: editorList,
        size: 'small',
        scroll_to_center: true,
        onBack: () => {
          const newOrder = [];
          const newHidden = [];
          editorList.find('.menu-edit-list__item').each(function () {
            const k = $(this).data('id');
            if (!k) return;
            newOrder.push(k);
            if ($(this).hasClass('menu-edit-list__item-hidden')) newHidden.push(k);
          });
          Lampa.Storage.set(ORDER_STORAGE, newOrder);
          Lampa.Storage.set(HIDE_STORAGE, newHidden);
          Lampa.Modal.close();
          rebuildCard(container);
          setTimeout(() => {
            if (fromSettings) {
              Lampa.Controller.toggle("settings_component");
            } else {
              Lampa.Controller.toggle("full_start");
            }
          }, 100);
        }
      });
    }

    // Открывает редактор из настроек плагина (с проверкой на открытую карточку)
    function startEditorFromSettings() {
      if (!currentCard || !currentCard.length || !document.body.contains(currentCard[0])) {
        const active = findActiveCard();
        if (active && active.length) {
          currentCard = active;
        }
      }

      if (!currentCard || !currentCard.length) {
        Lampa.Modal.open({
          title: Lampa.Lang.translate('title_error'),
          html: Lampa.Template.get('error', {
            title: Lampa.Lang.translate('title_error'),
            text: 'Редактировать кнопки можно только после открытия карточки фильма'
          }),
          size: 'small',
          onBack: () => {
            Lampa.Modal.close();
            setTimeout(() => {
              Lampa.Controller.toggle("settings_component");
            }, 100);
          }
        });
        return;
      }

      startEditor(currentCard, true);
    }

    // Функция сброса всех настроек плагина
    function resetAllSettings() {
      Lampa.Modal.open({
        title: 'Сбросить настройки кнопок',
        html: Lampa.Template.get('confirm', {
          title: 'Вы уверены?',
          text: 'Это действие сбросит ВСЕ настройки кнопок:<br>• Порядок кнопок<br>• Скрытые кнопки<br>• Переименованные кнопки<br>• Режим отображения',
          apply: 'Сбросить',
          cancel: 'Отмена'
        }),
        size: 'small',
        onBack: () => {
          Lampa.Modal.close();
        },
        onSelect: (event, item) => {
          if (item.data().id === 'apply') {
            // Сбрасываем все настройки
            Lampa.Storage.set(ORDER_STORAGE, []);
            Lampa.Storage.set(HIDE_STORAGE, []);
            Lampa.Storage.set(RENAME_STORAGE, {});
            Lampa.Storage.set('cardbtn_viewmode', 'default');
            
            Lampa.Noty.show('Все настройки кнопок сброшены');
            Lampa.Modal.close();
            
            // Если есть открытая карточка - перестраиваем её
            if (currentCard && currentCard.length) {
              setTimeout(() => {
                rebuildCard(currentCard);
              }, 300);
            }
            
            // Обновляем настройки
            setTimeout(() => {
              Lampa.Settings.update();
            }, 500);
          } else {
            Lampa.Modal.close();
          }
        }
      });
    }

    // Слушатель событий full (строит/обновляет карточку)
    function cardListener() {
      Lampa.Listener.follow('full', e => {
        if (e.type === 'build' && e.name === 'start' && e.item && e.item.html) {
          currentActivity = e.item;
        }
        if (e.type === 'complite') {
          const container = getCardContainer(e);
          if (!container) return;
          currentCard = container;
          rebuildCard(container);
        }
      });
    }

    const CardHandler = {
      run: cardListener,
      fromSettings: startEditorFromSettings
    };

    // Настраивает параметры в меню настроек Lampa
    function setupSettings() {
      Lampa.SettingsApi.addComponent({
        component: "cardbtn",
        name: 'Кнопки в карточке',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
      });

      Lampa.SettingsApi.addParam({
        component: "cardbtn",
        param: {
          name: "cardbtn_showall",
          type: "trigger",
          default: false
        },
        field: {
          name: 'Все кнопки в карточке',
          description: 'Требуется перезагрузить приложение после включения'
        },
        onChange: () => {
          Lampa.Settings.update();
        }
      });

      if (Lampa.Storage.get('cardbtn_showall') === true) {
        Lampa.SettingsApi.addParam({
          component: "cardbtn",
          param: {
            name: "cardbtn_viewmode",
            type: "select",
            values: {
              default: 'Стандартный',
              icons: 'Только иконки кнопок',
              always: 'Текст в кнопках'
            },
            default: 'default'
          },
          field: {
            name: 'Режим отображения кнопок'
          },
          onChange: () => {
            Lampa.Settings.update();
          }
        });

        Lampa.SettingsApi.addParam({
          component: "cardbtn",
          param: {
            name: "cardbtn_editor",
            type: "button"
          },
          field: {
            name: 'Редактировать кнопки',
            description: 'Изменить порядок, скрыть или переименовать кнопки'
          },
          onChange: () => {
            CardHandler.fromSettings();
          }
        });

        Lampa.SettingsApi.addParam({
          component: "cardbtn",
          param: {
            name: "cardbtn_reset_all",
            type: "button"
          },
          field: {
            name: 'Сбросить все настройки',
            description: 'Вернуть оригинальные настройки кнопок'
          },
          onChange: () => {
            resetAllSettings();
          }
        });
      }
    }

    const SettingsConfig = {
      run: setupSettings
    };

    const pluginInfo = {
      type: "other",
      version: "1.1.1",
      author: '@custom',
      name: "Кастомные кнопки карточки",
      description: "Управление кнопками действий в карточке фильма/сериала",
      component: "cardbtn"
    };

    // Загружает плагин (манифест, настройки, обработчики)
    function loadPlugin() {
      Lampa.Manifest.plugins = pluginInfo;
      SettingsConfig.run();
      if (Lampa.Storage.get('cardbtn_showall') === true) {
        CardHandler.run();
      }
    }

    // Инициализация плагина при готовности приложения
    function init() {
      window.plugin_cardbtn_ready = true;
      if (window.appready) loadPlugin();
      else {
        Lampa.Listener.follow("app", e => {
          if (e.type === "ready") loadPlugin();
        });
      }
    }

    if (!window.plugin_cardbtn_ready) init();

})();
