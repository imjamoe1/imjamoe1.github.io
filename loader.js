(function () {
  'use strict';

  let svg_svgs = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 38 38" stroke="#00ffff"><g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2"><circle stroke-opacity=".3" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" stroke="#ff33cc" stroke-width="8" fill="none"><animateTransform attributeName="transform" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatCount="indefinite"/></circle></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><g fill="#ffaa00"><circle cx="30" cy="50" r="10"><animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" begin="0s"/></circle><circle cx="50" cy="50" r="10"><animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" begin="0.2s"/></circle><circle cx="70" cy="50" r="10"><animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" begin="0.4s"/></circle></g></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 135 140" fill="#00ff66"><rect y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.5s" dur="1s" values="120;30;120" repeatCount="indefinite"/></rect><rect x="30" y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.25s" dur="1s" values="120;30;120" repeatCount="indefinite"/></rect><rect x="60" y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0s" dur="1s" values="120;30;120" repeatCount="indefinite"/></rect></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" stroke="#ffcc00" stroke-width="10" fill="none" stroke-dasharray="164.93361431346415 56.97787143782138"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50"/></circle></svg>`
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
      grid-template-columns: repeat(5, 1fr);
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
    }
    .ani_svg svg {
      max-width: 100%;
      max-height: 100%;
    }
    .ani_svg.focus {
      background-color: #353535;
      border: 1px solid #9e9e9e;
    }
  `;
  document.head.appendChild(style);

  function insert_activity_loader(svg) {
    let container = document.createElement('div');
    container.className = 'activity__loader';
    container.style.position = 'absolute';
    container.style.top = 0;
    container.style.left = 0;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.innerHTML = svg;
    container.id = 'aniload_activity__loader';
    document.body.appendChild(container);
  }

  function remove_activity_loader() {
    let el = document.getElementById('aniload_activity__loader');
    if (el) el.remove();
  }

  function createSvgHtml(svg) {
    return `<div class="ani_svg selector" tabindex="0">${svg}</div>`;
  }

  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  function aniLoad() {
    const groupedSvg = chunkArray(svg_svgs, 5);
    let svg_content = groupedSvg.map(group => {
      const groupHtml = group.map(createSvgHtml).join('');
      return `<div class="ani_row">${groupHtml}</div>`;
    }).join('');

    Lampa.SettingsApi.addComponent({
      component: 'ani_load_menu',
      name: "Load animation ",
      icon: '<svg height="32" viewBox="0 0 24 26" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"/></svg>'
    });

    Lampa.SettingsApi.addParam({
      component: 'ani_load_menu',
      param: { name: 'select_ani_mation', type: 'button' },
      field: { name: ' Выбор анимации загрузки ', description: '<div class="activity__loader"></div>' },
      onChange: () => {
        let modal_content = Lampa.Template.get('ani_modal', { ani_svg_content: svg_content });
        Lampa.Modal.open({
          title: '',
          size: 'medium',
          align: 'center',
          html: modal_content,
          onBack: () => {
            Lampa.Modal.close();
            Lampa.Controller.toggle('settings_component');
          },
          onSelect: function (a) {
            Lampa.Modal.close();
            Lampa.Controller.toggle('settings_component');
            if (a.length > 0 && a[0] instanceof HTMLElement) {
              const svgEl = a[0].querySelector('svg');
              if (svgEl) {
                const svgCode = svgEl.outerHTML;
                Lampa.Storage.set("ani_load", svgCode);
                remove_activity_loader();
                insert_activity_loader(svgCode);
              }
            }
          },
        });
      }
    });

    const storedSvg = Lampa.Storage.get("ani_load");
    if (storedSvg) {
      insert_activity_loader(storedSvg);
    }
  }

  if (window.appready) {
    aniLoad();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') {
        aniLoad();
      }
    });
  }
})();
