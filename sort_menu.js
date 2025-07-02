(function() {
  // Конфигурация
  const PLUGIN_NAME = 'MenuDragPlugin';
  const STORAGE_KEY = 'lampa_menu_order';
  const DRAG_CLASS = 'menu-item--dragging';
  const PLACEHOLDER_CLASS = 'menu-item--placeholder';

  // Инициализация плагина
  function init() {
    console.log(`[${PLUGIN_NAME}] Initializing...`);

    // Ждём загрузки приложения
    Lampa.Listener.follow('app', e => {
      if (e.type !== 'ready') return;

      // Загружаем сохранённый порядок
      loadMenuOrder();
      
      // Добавляем функционал перетаскивания
      setupDragAndDrop();
    });
  }

  // Загружает сохранённый порядок меню
  function loadMenuOrder() {
    const savedOrder = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!savedOrder) return;

    const $menu = $('.settings-folder').parent();
    savedOrder.forEach(id => {
      const $item = $(`.settings-folder[data-component="${id}"]`);
      if ($item.length) $menu.append($item);
    });

    console.log(`[${PLUGIN_NAME}] Menu order loaded`);
  }

  // Сохраняет текущий порядок меню
  function saveMenuOrder() {
    const order = [];
    $('.settings-folder').each(function() {
      order.push($(this).data('component'));
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    console.log(`[${PLUGIN_NAME}] Menu order saved`);
  }

  // Настраивает перетаскивание
  function setupDragAndDrop() {
    const $items = $('.settings-folder');
    let $draggedItem = null;
    let $placeholder = null;
    let pressTimer = null;

    // Долгое нажатие для начала перетаскивания
    $items.on('mousedown touchstart', function(e) {
      const $item = $(this);
      pressTimer = setTimeout(() => {
        startDrag($item);
      }, 500); // 500ms = долгое нажатие
    });

    // Отмена при быстром отпускании
    $(document).on('mouseup touchend', () => {
      clearTimeout(pressTimer);
    });

    // Начало перетаскивания
    function startDrag($item) {
      $draggedItem = $item;
      $draggedItem.addClass(DRAG_CLASS);

      // Создаём плейсхолдер
      $placeholder = $('<div>').addClass(PLACEHOLDER_CLASS);
      $draggedItem.after($placeholder);

      // Обработчики движения
      $(document).on('mousemove touchmove', handleMove);
      $(document).on('mouseup touchend', handleRelease);
    }

    // Обработчик движения
    function handleMove(e) {
      if (!$draggedItem) return;

      const y = e.pageY || e.originalEvent.touches[0].pageY;
      $draggedItem.css('transform', `translateY(${y - $draggedItem.offset().top - $draggedItem.outerHeight()/2}px)`);

      // Определяем новую позицию
      const $items = $('.settings-folder').not($draggedItem);
      let $newPosition = null;

      $items.each(function() {
        const $this = $(this);
        const top = $this.offset().top;
        const height = $this.outerHeight();

        if (y > top && y < top + height/2) {
          $newPosition = $this;
        } else if (y > top + height/2 && y < top + height) {
          $newPosition = $this.next();
        }
      });

      if ($newPosition && $newPosition.length) {
        $placeholder.insertBefore($newPosition);
      } else {
        $('.settings-folder').parent().append($placeholder);
      }
    }

    // Обработчик отпускания
    function handleRelease() {
      if (!$draggedItem) return;

      $draggedItem.insertBefore($placeholder)
        .removeClass(DRAG_CLASS)
        .css('transform', '');

      $placeholder.remove();
      $draggedItem = null;
      $placeholder = null;

      saveMenuOrder();

      $(document).off('mousemove touchmove', handleMove);
      $(document).off('mouseup touchend', handleRelease);
    }
  }

  // Стили для плагина
  const css = `
    .${DRAG_CLASS} {
      opacity: 0.7;
      background-color: rgba(255, 255, 255, 0.2) !important;
      transition: transform 0.1s;
      z-index: 1000;
    }
    .${PLACEHOLDER_CLASS} {
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      margin: 5px 0;
      border-radius: 6px;
    }
  `;

  // Добавляем стили в DOM
  $('<style>').html(css).appendTo('head');

  // Запускаем плагин
  init();
})();
