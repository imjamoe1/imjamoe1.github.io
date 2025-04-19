// === AniLoad Plugin: Offline SVG Spinner Integration ===

let svg_data = [
  {
    name: 'Spiral',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" stroke="#fff305" stroke-width="10" fill="none" stroke-dasharray="283" stroke-dashoffset="75" transform="rotate(0 50 50)"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/></circle></svg>`
  },
  {
    name: 'Oval Fast',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="45" ry="25" stroke="#00fff2" stroke-width="10" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.8s" repeatCount="indefinite"/></ellipse></svg>`
  },
  {
    name: 'Oval Slow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="20" stroke="#cddedd" stroke-width="8" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite"/></ellipse></svg>`
  },
  {
    name: 'Rect Fast',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" stroke="#ff85ff" stroke-width="6" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.4s" repeatCount="indefinite"/></rect></svg>`
  },
  {
    name: 'Rect Slow',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" stroke="#a2ff99" stroke-width="6" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite"/></rect></svg>`
  },
  {
    name: 'RoundRect',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" rx="10" ry="10" stroke="#ff7700" stroke-width="6" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite"/></rect></svg>`
  }
];

function createSvgHtml(item) {
  return `
    <div class="ani_svg selector" tabindex="0" data-name="${item.name}">
      <div style="width: 36px; height: 36px;">${item.svg}</div>
    </div>
  `;
}

function chunkArray(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

function insert_activity_loader(svgHtml) {
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
      background: none;
    }
    .activity__loader::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .activity__loader_prv {
      position: absolute;
      top: 0;
      left: 0;
      width: 145%;
      height: 86%;
      z-index: 9999;
    }
  `;
  document.head.appendChild(activity_loader_style);

  document.querySelectorAll('.activity__loader, .activity__loader_prv').forEach(el => {
    el.innerHTML = svgHtml;
  });
}

// Example usage in settings interface
document.addEventListener('DOMContentLoaded', () => {
  const groupedSvgLinks = chunkArray(svg_data, 7);
  const container = document.querySelector('#ani_spinner_container');
  groupedSvgLinks.forEach(group => {
    const row = document.createElement('div');
    row.className = 'ani_spinner_row';
    row.innerHTML = group.map(createSvgHtml).join('');
    container.appendChild(row);
  });

  container.addEventListener('click', event => {
    const el = event.target.closest('.ani_svg');
    if (el) {
      const html = el.innerHTML;
      Lampa.Storage.set("ani_load", html);
      insert_activity_loader(html);
    }
  });
});
