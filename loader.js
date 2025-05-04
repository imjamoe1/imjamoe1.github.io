(function () {
  'use strict';

  /**
   * LoaderPlugin
   * Пример: const loader = new LoaderPlugin('.my-block');
   *         loader.show();
   *         loader.hide();
   */
  class LoaderPlugin {
    constructor(selector, options = {}) {
      this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;

      if (!this.container) {
        throw new Error('LoaderPlugin: контейнер не найден.');
      }

      this.options = Object.assign({
        loaderUrl: 'https://imjamoe1.github.io/ring-resize.svg',
        backgroundColor: 'rgba(255,255,255,0.7)',
        size: '60px',
      }, options);

      this.loader = document.createElement('div');
      this.loader.className = 'activity__loader';
      this.loader.style.position = 'absolute';
      this.loader.style.top = '0';
      this.loader.style.left = '0';
      this.loader.style.width = '100%';
      this.loader.style.height = '100%';
      this.loader.style.display = 'none';
      this.loader.style.background = `url('${this.options.loaderUrl}') no-repeat 50% 50%`;
      this.loader.style.backgroundColor = this.options.backgroundColor;
      this.loader.style.backgroundSize = this.options.size;
      this.loader.style.zIndex = '1000';

      // Убедимся, что контейнер имеет position: relative
      const style = window.getComputedStyle(this.container);
      if (style.position === 'static') {
        this.container.style.position = 'relative';
      }

      this.container.appendChild(this.loader);
    }

    show() {
      this.loader.style.display = 'block';
    }

    hide() {
      this.loader.style.display = 'none';
    }

    remove() {
      this.loader.remove();
    }
  }

  // Экспортируем глобально
  window.LoaderPlugin = LoaderPlugin;

})();
