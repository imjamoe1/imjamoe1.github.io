(function () {
  'use strict';

  let svg_links = [
    // SVG ссылки...
  ];

  Lampa.Template.add('ani_modal', `
    <div class="ani_modal_root">
      <div class="ani_grid">
        {ani_svg_content}
      </div>
    </div>
  `);

  let style = document.createElement('style');
  style.id = 'aniload';
  style.textContent = `
    .ani_row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: 1fr;
      gap: 40px;
      justify-items: center;
      width: 100%;
      height: 72px;
      padding: 10px;
    }
    .ani_svg {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: transparent;
      border-radius: 10px;
    }
    .ani_svg:nth-child(1) img { filter: hue-rotate(180deg) saturate(3) brightness(1.2); }
    .ani_svg:nth-child(2) img { filter: hue-rotate(280deg) saturate(2.5) brightness(1.1); }
    .ani_svg:nth-child(3) img { filter: hue-rotate(30deg) saturate(3) brightness(1.1); }
    .ani_svg:nth-child(4) img { filter: hue-rotate(0deg) saturate(2.5) brightness(1); }
    .ani_svg:nth-child(5) img { filter: hue-rotate(90deg) saturate(2.2) brightness(1); }
    .ani_svg:nth-child(6) img { filter: grayscale(1) brightness(1.5); }
    .ani_svg:nth-child(7) img { filter: hue-rotate(120deg) saturate(2.5) brightness(1.1); }
    .ani_svg:nth-child(8) img { filter: hue-rotate(200deg) saturate(3) brightness(1.2); }
    .ani_svg:nth-child(9) img { filter: hue-rotate(320deg) saturate(3) brightness(1.1); }
    .ani_svg:nth-child(10) img { filter: hue-rotate(160deg) saturate(2.5) brightness(1.2); }
    .ani_svg:nth-child(11) img { filter: hue-rotate(240deg) saturate(2.8) brightness(1); }
    .ani_svg:nth-child(12) img { filter: hue-rotate(45deg) saturate(2.5) brightness(1.3); }
    .ani_svg:nth-child(13) img { filter: hue-rotate(330deg) saturate(2.6) brightness(1.1); }
    .ani_svg:nth-child(14) img { filter: hue-rotate(100deg) saturate(2.9) brightness(1); }
    .ani_svg:nth-child(15) img { filter: hue-rotate(60deg) saturate(2.5) brightness(1.2); }
    .ani_svg:nth-child(16) img { filter: hue-rotate(0deg) saturate(2.5) brightness(1.2); }
    .ani_svg:nth-child(17) img { filter: hue-rotate(270deg) saturate(3) brightness(1.1); }
    .ani_svg:nth-child(18) img { filter: hue-rotate(150deg) saturate(2.4) brightness(1); }
    .ani_svg:nth-child(19) img { filter: hue-rotate(210deg) saturate(2.6) brightness(1.3); }
    .ani_svg:nth-child(20) img { filter: hue-rotate(75deg) saturate(2.7) brightness(1.1); }
    .ani_svg:nth-child(21) img { filter: hue-rotate(300deg) saturate(3) brightness(1.2); }

    .ani_svg.focus {
      background-color: #1a1a1a;
      justify-content: center;
      align-items: center;
      border: 1px solid #3a3a3a;
    }
    .ani_preview_box {
      position: absolute;
      top: 10%;
      right: 5%;
      width: 100px;
      height: 100px;
      background-color: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      z-index: 99999;
      border: 1px solid #2a2a2a;
    }
    .ani_preview_box img {
      width: 80%;
      height: 80%;
      object-fit: contain;
      filter: brightness(1.2);
    }
  `;
  document.head.appendChild(style);

  let previewBox = document.createElement('div');
  previewBox.className = 'ani_preview_box';
  previewBox.style.display = 'none';
  document.body.appendChild(previewBox);

  function insert_activity_loader(src) {
    let activity_loader_style = document.createElement('style');
    activity_loader_style.id = 'aniload_activity__loader';
    activity_loader_style.textContent = `
      .activity__loader {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        background: url(${src}) no-repeat 50% 50%;
        zoom: 3;
      }
      .activity__loader_prv {
        position: absolute;
        top: 0;
        left: 0;
        width: 145%;
        height: 86%;
        background: url(${src}) no-repeat 50% 50%;
        z-index: 9999; 
      }
    `;
    document.head.appendChild(activity_loader_style);
  }

  function remove_activity_loader() {
    let styleElement = document.getElementById('aniload_activity__loader');
    if (styleElement) styleElement.remove();
  }

  function createSvgHtml(src) {
    return `
      <div class="ani_svg selector" tabindex="0">
        <picture>
          <img src="${src}" style="visibility:visible; max-width:100%;">
        </picture>
      </div>
    `;
  }

  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  function aniLoad() {
    let icon_plugin = '<svg height="32" viewBox="0 0 24 26" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"/></svg>';

    Lampa.SettingsApi.addComponent({ component: 'ani_load_menu', name: 'Load animation ', icon: icon_plugin });

    Lampa.SettingsApi.addParam({
      component: 'ani_load_menu',
      param: { name: 'select_color', type: 'select', values: ['#ffffff', '#ff5733', '#33c7ff', '#28a745'] },
      field: { name: ' Включить' },
      onChange: function (item) {
        if (item == 'true') insert_activity_loader(Lampa.Storage.get("ani_load"));
        else if (item == 'false') remove_activity_loader();
      }
    });

    Lampa.SettingsApi.addParam({
      component: 'ani_load_menu',
      param: { name: 'theme_color', type: 'select', values: ['light', 'dark'] },
      field: { name: 'Тема' },
      onChange: function (theme) { Lampa.Storage.set('ani_theme', theme); }
    });

    Lampa.SettingsApi.addParam({
      component: 'ani_load_menu',
      param: { name: 'select_ani_mation', type: 'button' },
      field: { name: ' Выбор анимации загрузки ', description: '<div class="activity__loader_prv"></div>' },
      onChange: function (item) {
        const groupedSvgLinks = chunkArray(svg_links, 7);
        let svg_content = groupedSvgLinks.map(group => {
          const groupContent = group.map(createSvgHtml).join('');
          return `<div class="ani_row">${groupContent}</div>`;
        }).join('');

        let ani_templates = Lampa.Template.get('ani_modal', { ani_svg_content: svg_content });
        Lampa.Modal.open({
          title: '',
          size: 'medium',
          align: 'center',
          html: ani_templates,
          onBack: () => {
            Lampa.Modal.close();
            Lampa.Controller.toggle('settings_component');
          },
          onSelect: function onSelect(a) {
            Lampa.Modal.close();
            Lampa.Controller.toggle('settings_component');
            if (a.length > 0 && a[0] instanceof HTMLElement) {
              const element = a[0];
              const imgElement = element.querySelector('img');
              if (imgElement) {
                const srcValue = imgElement.getAttribute('src');
                Lampa.Storage.set("ani_load", srcValue);
                remove_activity_loader();
                insert_activity_loader(srcValue);
              }
            }
          },
        });

        // Обработчики предпросмотра
        setTimeout(() => {
          document.querySelectorAll('.ani_svg').forEach(item => {
            item.addEventListener('mouseenter', () => {
              const img = item.querySelector('img');
              if (img) {
                previewBox.innerHTML = `<img src="${img.src}" alt="preview">`;
                previewBox.style.display = 'flex';
              }
            });
            item.addEventListener('mouseleave', () => {
              previewBox.style.display = 'none';
            });
          });
        }, 100);
      }
    });

    if (Lampa.Storage.get("ani_load") !== null && Lampa.Storage.get("active_ani") !== false) {
      insert_activity_loader(Lampa.Storage.get("ani_load"));
    }
  }

  if (window.appready) {
    aniLoad();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type == 'ready') {
        aniLoad();
      }
    });
  }
})();
