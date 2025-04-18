(function () {
  'use strict';

  let svg_links = [
    'https://iamonefm.github.io/svg/dots.svg',
    'https://iamonefm.github.io/svg/dots_x2.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/90-ring-white-36.svg',
    // Добавьте другие ссылки
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
    .ani_svg img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  `;

  document.head.appendChild(style);

  function insert_activity_loader(src, color) {
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
        filter: drop-shadow(0 0 5px ${color});
      }
    `;
    document.head.appendChild(activity_loader_style);
  }

  function applySvgColor(color) {
    const svgElements = document.querySelectorAll('.ani_svg img');
    svgElements.forEach(svg => {
      svg.style.filter = `drop-shadow(0px 0px 5px ${color})`;
      svg.style.fill = color;
    });
  }

  function createSvgHtml(src) {
    return `
      <div class="ani_svg selector" tabindex="0">
        <img src="${src}" style="visibility:visible; max-width:100%;">
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
    Lampa.SettingsApi.addParam({
      component: 'ani_load_menu',
      param: {
        name: 'select_color',
        type: 'select',
        values: ['#ffffff', '#ff5733', '#33c7ff', '#28a745', '#29cc4f'],
      },
      field: {
        name: 'Выберите цвет для анимации',
        description: 'Настройте цвет SVG',
      },
      onChange: function (selectedColor) {
        Lampa.Storage.set("svg_color", selectedColor);
        applySvgColor(selectedColor);
      },
    });

    const groupedSvgLinks = chunkArray(svg_links, 7);
    let svg_content = groupedSvgLinks.map(group => {
      return `<div class="ani_row">${group.map(createSvgHtml).join('')}</div>`;
    }).join('');

    let ani_templates = Lampa.Template.get('ani_modal', {
      ani_svg_content: svg_content
    });

    if (Lampa.Storage.get("svg_color")) {
      applySvgColor(Lampa.Storage.get("svg_color"));
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