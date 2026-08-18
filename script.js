<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JS Plugins</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Глобальные стили для черного фона */
    * {
      box-sizing: border-box;
    }
    
    html, body {
      background-color: #0a0a0a !important;
      color: #ffffff !important;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    
    /* Все контейнеры с белым фоном меняем на темный */
    .bg-white {
      background-color: #1a1a1a !important;
      border: 1px solid #2a2a2a;
    }
    
    .shadow {
      box-shadow: 0 4px 6px -1px rgba(255, 255, 255, 0.05) !important;
    }
    
    .text-blue-600 {
      color: #60a5fa !important;
    }
    
    .text-blue-600:hover {
      color: #93bbfc !important;
    }
    
    .bg-gray-200 {
      background-color: #2a2a2a !important;
      color: #ffffff !important;
    }
    
    .bg-gray-200:hover {
      background-color: #3a3a3a !important;
    }
    
    .text-red-600 {
      color: #f87171 !important;
    }
    
    /* Заголовки */
    h1, h2, h3 {
      color: #ffffff !important;
    }
    
    /* Список */
    #script-list {
      background-color: transparent !important;
    }
  </style>
</head>
<body>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">📦 JS Plugins</h1>
    <div id="script-list"></div>
  </div>

  <script>
    const GITHUB_USER = "imjamoe1";
    const REPO_NAME = "imjamoe1.github.io";
    const BRANCH = "main";

    const scriptList = document.getElementById("script-list");

    async function fetchJSFiles() {
      const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;

      try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        const jsFiles = data.tree.filter(file => 
          file.path.endsWith(".js") && 
          !file.path.includes("script.js") &&
          file.path.split('/').length === 1
        );

        jsFiles.forEach(file => {
          const fileName = file.path.split('/').pop();
          const url = `https://${GITHUB_USER}.github.io/${fileName}`;
          
          const container = document.createElement("div");
          container.className = "bg-white p-4 rounded shadow flex justify-between items-center mb-3";
          
          // Добавляем стили для контейнера
          container.style.backgroundColor = '#1a1a1a';
          container.style.color = '#ffffff';
          container.style.border = '1px solid #2a2a2a';

          const link = document.createElement("a");
          link.href = url;
          link.textContent = fileName;
          link.className = "text-blue-600 hover:underline break-all";
          link.style.color = '#60a5fa';

          const button = document.createElement("button");
          button.textContent = "📋 Копировать";
          button.className = "bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded ml-2 flex-shrink-0";
          button.style.backgroundColor = '#2a2a2a';
          button.style.color = '#ffffff';
          button.style.border = 'none';
          button.onclick = () => {
            navigator.clipboard.writeText(url);
            button.textContent = "✅ Скопировано!";
            setTimeout(() => button.textContent = "📋 Копировать", 2000);
          };

          container.append(link, button);
          scriptList.appendChild(container);
        });

      } catch (err) {
        scriptList.innerHTML = `<p class="text-red-600">Ошибка загрузки: ${err.message}</p>`;
      }
    }

    fetchJSFiles();
  </script>
</body>
</html>
