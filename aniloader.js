(function () {
  'use strict';

  let svg_links = [
    'https://iamonefm.github.io/svg/dots.svg',
    'https://iamonefm.github.io/svg/dots_x2.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/90-ring-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/90-ring-with-bg-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/180-ring-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/180-ring-with-bg-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/270-ring-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/270-ring-with-bg-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/ring-resize-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/bars-rotate-fade-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/blocks-scale-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/blocks-shuffle-2-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/blocks-shuffle-3-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/blocks-wave-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-2-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-3-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-multiple-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-ring-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-rings-2-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-rings-3-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/pulse-rings-multiple-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/3-dots-bounce-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/3-dots-fade-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/3-dots-scale-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/dot-revolve-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/bouncing-ball-white-36.svg',
    'https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/main/preview/gooey-balls-2-white-36.svg'
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
    }
    .ani_svg img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .ani_svg.focus {
      background-color: #353535;
      justify-content: center;
      align-items: center;
      border: 1px solid #9e9e9e;
    }
  `;

  document.head.appendChild(style);

  function fetchSvgWithColor(src, color) {
    return fetch(src)
      .then(response => response.text())
      .then(svg => svg.replace(/fill="[^"]+"/g, `fill="${color}"`)
                      .replace(/stroke="[^"]+"/g, `stroke="${color}"`));
  }

  function createSvgHtml(src, color) {
    return fetchSvgWithColor(src, color).then(modifiedSvg => `
      <div class="ani_svg selector" tabindex="0">
        ${modifiedSvg}
      </div>
    `);
  }

  async function renderSvgGrid(svg_links, color) {
    const groupedSvgLinks = chunkArray(svg_links, 7);
    let svg_content = '';
    for (const group of groupedSvgLinks) {
      const groupContent = await Promise.all(
        group.map(link => createSvgHtml(link, color))
      );
      svg_content += `<div class="ani_row">${groupContent.join('')}</div>`;
    }
    return svg_content;
  }

  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  async function aniLoad() {
    const color = '#FF8C00'; // Цвет спиннера
    const svg_content = await renderSvgGrid(svg_links, color);

    let ani_templates = Lampa.Template.get('ani_modal', {
      ani_svg_content: svg_content
    });
    Lampa.Modal.open({
      title: '',
      size: 'medium',
      align: 'center',
      html: ani_templates,
      onBack: () => {
        Lampa.Modal.close();
        Lampa.Controller.toggle('settings_component');
      },
    });
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
