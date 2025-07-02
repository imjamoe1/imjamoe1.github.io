(function() {
  // Конфигурация
  const PLUGIN_NAME = 'MenuDragTVPlugin';
  const STORAGE_KEY = 'lampa_menu_order_tv';
  const ACTIVE_CLASS = 'menu-item--active';
  const HIGHLIGHT_CLASS = 'menu-item--highlight';

  // Инициализация
  function init() {
    console.log(`[${PLUGIN_NAME}] Initializing TV control...`);

    Lampa.Listener.follow('app', e => {
      if (e.type !== 'ready') return;

      // Ждём загрузки меню
      setTimeout(() => {
        loadMenuOrder();
        setupTVControls();
        addStyles();
      }, 1000);
    });
  }

  // Загрузка сохранённого порядка
  function loadMenuOrder() {
    const savedOrder = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!savedOrder) return;

    const $menu = $('.settings-folder').parent();
    savedOrder.forEach(id => {
      const $item = $(`.settings-folder[data-component="${id}"]`);
      if ($item.length) $menu.append($item);
    });
  }

  // Сохранение порядка
  function saveMenuOrder() {
    const order = [];
    $('.settings-folder').each(function() {
      order.push($(this).data('component'));
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }

  // Настройка TV-управления
  function setupTVControls() {
    const $items = $('.settings-folder');
    let currentIndex = -1;
    let isEditMode = false;

    // Активация режима редактирования
    $items.on('hover:enter', function() {
      if (isEditMode) return;
      
      isEditMode = true;
      currentIndex = $items.index(this);
      updateHighlight();
      
      console.log(`[${PLUGIN_NAME}] Edit mode activated`);
    });

    // Обработка кнопок пульта
    Lampa.Listener.follow('keyboard', e => {
      if (!isEditMode) return;

      const key = e.key;
      
      if (key === 'up') {
        moveItem(-1); // Вверх
      } 
      else if (key === 'down') {
        moveItem(1); // Вниз
      }
      else if (key === 'back') {
        exitEditMode(); // Выход
      }
    });

    // Перемещение пункта
    function moveItem(direction) {
      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= $items.length) return;

      const $current = $items.eq(currentIndex);
      const $target = $items.eq(newIndex);

      if (direction === -1) {
        $current.insertBefore($target);
      } else {
        $current.insertAfter($target);
      }

      currentIndex = newIndex;
      updateHighlight();
      saveMenuOrder();
    }

    // Обновление подсветки
    function updateHighlight() {
      $items.removeClass(HIGHLIGHT_CLASS)
             .eq(currentIndex)
             .addClass(HIGHLIGHT_CLASS);
    }

    // Выход из режима редактирования
    function exitEditMode() {
      isEditMode = false;
      $items.removeClass(HIGHLIGHT_CLASS);
      currentIndex = -1;
      console.log(`[${PLUGIN_NAME}] Edit mode deactivated`);
    }
  }

  // Добавление стилей
  function addStyles() {
    const css = `
      .${HIGHLIGHT_CLASS} {
        background-color: rgba(255, 165, 0, 0.3) !important;
        border: 2px solid orange !important;
        box-shadow: 0 0 10px orange !important;
      }
      .${ACTIVE_CLASS} {
        transform: scale(1.02);
      }
    `;
    $('<style>').html(css).appendTo('head');
  }

  // Запуск плагина
  init();
})();
