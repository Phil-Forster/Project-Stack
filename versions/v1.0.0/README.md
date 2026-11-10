# Project Stack

**Local-first project scaffolding dashboard** — generate complete, structured folder and file templates for web, SPA, PHP, docs, or tooling projects.  
Runs entirely offline in the browser, exports idempotent PowerShell scripts, and provides a live tree preview of your project before creation.

---

## 🚀 Features

- **Template Catalog:** 18+ categorized scaffolds (HTML, CSS/JS, SPA, PHP, Docs, Tooling).
- **Live Preview:** Instantly visualize the folder and file hierarchy.
- **PowerShell Export:** One-click generation of idempotent Windows-safe scripts.
- **Local-Only:** Uses File System Access API — no uploads, telemetry, or external APIs.
- **Smart Validation:** Detects invalid paths, reserved names, and deep nesting.
- **Theme Toggle:** Clean light/dark modes with persistent localStorage setting.
- **Template Picker:** Searchable modal with color-coded project categories.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | HTML5, CSS3 (custom tokens, responsive grid), Vanilla JS |
| Icons & Fonts | Manrope / Inter (Google Fonts) |
| Script Engine | PowerShell (idempotent file/folder creation) |
| Browser APIs | File System Access API, Local Storage |
| Security | Strict CSP, no network dependencies |
| Hosting | Static – compatible with GitHub Pages, Netlify, or local use |

---

## 🖥️ How It Works

1. **Choose a Template:** Select from grouped scaffolds (Static Site, SPA/PWA, PHP Backend, Docs, Tools).  
2. **Preview Structure:** A nested tree shows every folder and file to be generated.  
3. **Adjust Options:** Include verification command, toggle dry-run mode, or edit path manually.  
4. **Generate Script:** Produces a full PowerShell script for reproducible setup.  
5. **Copy / Download:** Save the `.ps1` file and run it locally to create your project.

---

## 🧱 Folder Overview

```
Project-Stack/
├── index.html              # Main UI
├── style.css               # Theming, layout, tokens
├── app.js                  # Main logic + state
├── generator.js            # PowerShell script builder
├── templates.json          # Catalog of project scaffolds
├── manifest.json           # PWA manifest
└── .htaccess               # Security & caching headers
```

---

## ⚙️ Local Development

1. Clone this repository:
   ```bash
   git clone git@github.com:Phil-Forster/Project-Stack.git
   cd Project-Stack
   ```
2. Open in VS Code or run a local server:
   ```bash
   npx serve
   ```
3. Open [`http://localhost:5000`](http://localhost:5000) (or whichever port shows).

---

## 🧭 PowerShell Script Example

```powershell
# Create all folders & files for your chosen template
New-Item -ItemType Directory -Force -Path "css","js","data","images"
New-Item -ItemType File -Force -Path "index.html","css/style.css","js/app.js"
Write-Host "Scaffold created successfully!" -ForegroundColor Green
```

---

## 🔐 Privacy & Security

- 100% local execution (no cloud services or external APIs).  
- No analytics, telemetry, or tracking.  
- All data stays in your browser’s sandbox.

---

## 🧑‍💻 Author

**Phil Forster**  
[philforster.co.uk](https://philforster.co.uk)  
_Web Developer • Software Engineering Manager • Branding Specialist_

---

## 🪪 License

This project is released under the **MIT License**.  
Feel free to fork, adapt, and reuse with attribution.

---

## 🧠 Inspiration

Built to eliminate repetitive boilerplate creation and bring order to new project setups —  
**Project-Stack** simplifies structure so you can focus on building, not scaffolding.
