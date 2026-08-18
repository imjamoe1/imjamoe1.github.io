const GITHUB_USER = "imjamoe1";
const REPO_NAME = "imjamoe1.github.io";
const BRANCH = "main"; // Или "master"

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
      const fileName = file.path.split('/').pop(); // Берем только имя файла
      const url = `https://${GITHUB_USER}.github.io/${fileName}`;
      
      const container = document.createElement("div");
      container.className = "bg-black p-4 rounded shadow flex justify-between items-center";

      const link = document.createElement("a");
      link.href = url;
      link.textContent = fileName;
      link.className = "text-white-600 hover:underline break-all";

      const button = document.createElement("button");
      button.textContent = "📋 Копировать";
      button.className = "bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded";
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
