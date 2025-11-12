(function(){
  const els = {
    y: document.getElementById('y'),
    themeToggle: document.getElementById('themeToggle'),
    rootPath: document.getElementById('rootPath'),
    templateSelect: document.getElementById('templateSelect'),
    reloadTemplates: document.getElementById('reloadTemplates'),

    // Folder picker buttons (File System Access API)
    browseFolder: document.getElementById('browseFolder'),
    newFolder: document.getElementById('newFolder'),

    catalogGroups: document.getElementById('catalogGroups'),

    includeTreeCmd: document.getElementById('includeTreeCmd'),
    dryRunOnly: document.getElementById('dryRunOnly'),

    generateBtn: document.getElementById('generateBtn'),
    resetBtn: document.getElementById('resetBtn'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),

    treePreview: document.getElementById('treePreview'),
    templatePreview: document.getElementById('templatePreview'), // preview panel
    scriptOutput: document.getElementById('scriptOutput'),
    console: document.getElementById('console'),

    // Template modal (minimal, no search)
    openTemplatePicker: document.getElementById('openTemplatePicker'),
    templateModal: document.getElementById('templateModal'),
    tpClose: document.getElementById('tpClose'),
    tpGrid: document.getElementById('tpGrid')
  };

  // Make Google Fonts non-blocking: flip media after first paint
const gf = document.getElementById('gf');
if (gf) {
  // No inline 'onload' (CSP-safe). Flipping immediately is fine—the CSS will apply when ready.
  requestAnimationFrame(() => { gf.media = 'all'; });
}
// Defer manifest so it doesn't sit on the critical path
window.addEventListener('load', () => {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = 'manifest.json';
  document.head.appendChild(link);
});


  // ===== Footer year =====
  if (els.y) els.y.textContent = new Date().getFullYear();

// ===== Theme (icon-only) =====
const THEME_KEY = 'scaffold.theme';

function setThemeIcon(mode){
  if (!els.themeToggle) return;
  els.themeToggle.textContent = mode === 'dark' ? '🌕' : '🌑';
  // make it bigger + remove chrome inline so no extra CSS needed
  Object.assign(els.themeToggle.style, {
    fontSize: '22px',
    lineHeight: '1',
    padding: '0',
    border: '0',
    background: 'transparent',
    cursor: 'pointer'
  });
}

function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
  setThemeIcon(mode);
}

// init + click
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
els.themeToggle?.addEventListener('click', ()=>{
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});



  // ===== File System Access (folder handle state) =====
  let selectedDirHandle = null;
  const FS_SUPPORTED = !!window.showDirectoryPicker;
  // Safari and non-Chromium browsers: show clear fallback message
  if (!FS_SUPPORTED) {
    const notice = document.createElement('div');
    notice.className = 'fs-warning';
    notice.textContent =
      'Folder selection is unavailable in this browser. You can still type or paste a full path manually.';
    const rootStatus = document.getElementById('rootStatus');
    if (rootStatus) rootStatus.insertAdjacentElement('afterend', notice);
  }


  function labelForHandle(handle){
    return `[Folder] ${handle?.name || ''}`.trim();
  }

  async function pickFolder(){
    if(!FS_SUPPORTED){
      log('Folder picker not supported in this browser. Type the path or paste from Explorer.', 'warn');
      return;
    }
    try{
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      selectedDirHandle = handle;
      setRootToHandleLabel(handle); // always reflect
      log(`Selected folder: ${handle.name}`, 'success');
    }catch(err){
      if(err?.name !== 'AbortError'){
        log(`Folder selection failed: ${err.message}`, 'error');
      }
    }
  }

  async function createNewFolder(){
    if(!FS_SUPPORTED){
      log('New folder requires File System Access API (Chromium).', 'warn');
      return;
    }
    try{
      if(!selectedDirHandle){
        await pickFolder();
        if(!selectedDirHandle) return;
      }
      const name = prompt('New folder name:');
      if(!name) return;

      const child = await selectedDirHandle.getDirectoryHandle(name, { create: true });
      selectedDirHandle = child;
      setRootToHandleLabel(child); // always reflect
      log(`Created folder: ${name}`, 'success');
    }catch(err){
      log(`Create folder failed: ${err.message}`, 'error');
    }
  }

  if(els.browseFolder){
    if(!FS_SUPPORTED){
      els.browseFolder.disabled = true;
      els.browseFolder.title = 'Not supported in this browser';
    }else{
      els.browseFolder.addEventListener('click', pickFolder);
    }
  }
  if(els.newFolder){
    if(!FS_SUPPORTED){
      els.newFolder.disabled = true;
      els.newFolder.title = 'Not supported in this browser';
    }else{
      els.newFolder.addEventListener('click', createNewFolder);
    }
  }

  // ===== Grouped catalog =====
  const TYPE_TINTS = {
    common: 'var(--muted)',
    html:   '#ff8a50',
    css:    '#6ab7ff',
    js:     '#ffd166',
    php:    '#9fa8da',
    json:   '#a0e67a',
    img:    '#f06292',
    docs:   '#c7b6ff',
    conf:   '#90a4ae',
    tools:  '#f0ce39ff'
  };

  // Category keys -> colours
  const CATEGORY_COLORS = {
    'Static Site':        '#4dabf7',
    'SPA / PWA':          '#ffb100',
    'Docs':               '#b388ff',
    'Design System':      '#22c6b8',
    'PHP / Backend':      '#7c9cff',
    'Tools / Build':      '#ff8f3d'
  };

  // Template label -> category key
  const CATEGORY_BY_LABEL = new Map([
    // Static Site
    ['Minimal HTML Starter','Static Site'],
    ['Micro-Site (Ultra Minimal)','Static Site'],
    ['Marketing Site','Static Site'],
    ['Content-Heavy Site','Static Site'],
    ['Photography Portfolio (Static)','Static Site'],
    ['Landing Page — Fast Deploy','Static Site'],

    // SPA / PWA
    ['Vanilla SPA','SPA / PWA'],
    ['JSON-Driven SPA','SPA / PWA'],
    ['Progressive Web App (PWA) Basic','SPA / PWA'],
    ['Full SPA + API','SPA / PWA'],
    ['Frontend Prototype Lab','SPA / PWA'],

    // Docs
    ['Docs Site','Docs'],

    // Design System
    ['Component Library (CSS/JS)','Design System'],
    ['Design System Seed','Design System'],

    // PHP / Backend
    ['PHP — Public + API','PHP / Backend'],
    ['PHP Admin + Public (JSON CMS)','PHP / Backend'],
    ['API Mock Server (JSON)','PHP / Backend'],

    // Tools / Build
    ['Static + Build Tools','Tools / Build'],
    ['Node Tooling (Vite/Webpack)','Tools / Build'],
    ['Utility Toolkit','Tools / Build']
  ]);

  // Expanded CATALOG
  const CATALOG = {
    common: {
      label: 'Common',
      folders: ['src','dist','public','assets','fonts','icons','vendor'],
      files: [
        '.gitignore','.editorconfig','.prettierrc','.eslintrc.json',
        'README.md','LICENSE','robots.txt','humans.txt','manifest.json'
      ]
    },

    html: {
      label: 'HTML',
      folders: ['partials','layouts','templates'],
      files: ['index.html','about.html','contact.html','privacy.html','terms.html','404.html']
    },

    css: {
      label: 'CSS',
      folders: ['css','css/base','css/components','css/layouts','css/themes','css/tokens'],
      files: ['css/style.css','css/reset.css','css/variables.css','css/utilities.css','css/dark.css','css/light.css']
    },

    js: {
      label: 'JavaScript',
      folders: ['js','js/modules','js/utils','js/components','js/vendor'],
      files: ['js/main.js','js/app.js','js/router.js','js/ui.js','js/helpers.js','js/storage.js','js/theme.js','js/api.js']
    },

    php: {
      label: 'PHP',
      folders: ['public','api','includes','templates','config','classes'],
      files: [
        'public/index.php','api/index.php',
        'includes/config.php','includes/session_bootstrap.php','includes/security.php','includes/functions.php',
        'config.php','.htaccess'
      ]
    },

    json: {
      label: 'JSON / Data',
      folders: ['data','data/collections','data/config'],
      files: ['data/settings.json','data/catalog.json','data/projects.json','data/users.json','data/manifest.json','data/localization.json']
    },

    img: {
      label: 'Images',
      folders: ['images','images/icons','images/ui','images/gallery','images/backgrounds'],
      files: ['images/logo.webp','images/placeholder.webp','images/favicon.webp','images/hero.webp']
    },

    docs: {
      label: 'Docs',
      folders: ['docs','docs/api','docs/specs','docs/assets'],
      files: ['docs/README.md','docs/CHANGELOG.md','docs/API_REFERENCE.md','docs/CONTRIBUTING.md','docs/LICENSE.md']
    },

    conf: {
      label: 'Config',
      folders: ['.vscode','.github/workflows'],
      files: [
        'package.json','package-lock.json','vite.config.js','webpack.config.js',
        'tsconfig.json','composer.json','.env.example',
        '.htaccess' // added here
      ]
    },

    tools: {
      label: 'Build / Tools / Scripts',
      folders: ['scripts','scripts/build','scripts/deploy','scripts/tools','tools','bin','ci'],
      files: [
        // cross-platform helpers
        'scripts/build.sh','scripts/deploy.sh','scripts/watch.sh',
        // Windows / PowerShell
        'scripts/bundle.ps1','scripts/run-tests.ps1','scripts/lint.ps1','scripts/setup.ps1',
        // Node tooling
        'tools/optimize-images.js',
        // runtime helpers
        'bin/postinstall',
        // environment hints
        '.nvmrc','.npmrc'
      ]
    }
  };

  let state = { folders: [], files: [] };
  let TEMPLATES_CACHE = []; // cache loaded templates for modal

  // Default inline template (resilient fallback)
  const INLINE_DEFAULT = {
    label: "Default Web Project",
    description: "HTML + CSS + JS stack with core folders and pages",
    folders: ["css","js","data","images","models","docs"],
    files: [
      "index.html","bestiary.html","anatomy.html","myths.html",
      "css/style.css",
      "js/main.js","js/dragon-hero.js","js/dragon-anatomy.js","js/dragon-cards.js",
      "data/breeds.json","data/anatomy.json","data/myths.json",
      "docs/README.md"
    ]
  };

  // ===== Templates loader (multi-template) =====
  async function loadTemplates() {
    try {
      const resp = await fetch('data/templates/templates.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Template fetch failed (' + resp.status + ')');
      const json = await resp.json();
      if (!json.templates || !Array.isArray(json.templates))
        throw new Error('Invalid templates.json format');

      const list = json.templates;
      TEMPLATES_CACHE = list; // cache for modal
      renderTemplateSelect(list);
      applyTemplate(list[0]);
      renderTemplatePreview(list[0]); // seed preview
      log(`Loaded ${list.length} templates successfully.`, 'success');
    } catch (err) {
      log('Falling back to inline default: ' + err.message, 'warn');
      TEMPLATES_CACHE = [INLINE_DEFAULT]; // cache fallback
      renderTemplateSelect([INLINE_DEFAULT]);
      applyTemplate(INLINE_DEFAULT);
      renderTemplatePreview(INLINE_DEFAULT); // seed preview
    }
  }

  function renderTemplateSelect(templates) {
    const sel = els.templateSelect;
    if(!sel) return;
    sel.innerHTML = '';
    templates.forEach((t, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${t.label} — ${t.description}`;
      opt.dataset.payload = JSON.stringify(t);
      sel.appendChild(opt);
    });
    sel.addEventListener('change', (e) => {
      const t = JSON.parse(e.target.selectedOptions[0].dataset.payload);
      applyTemplate(t);
      renderTemplatePreview(t);
    });
  }

  function applyTemplate(t){
    state.folders = normalizeUnique(t.folders || []);
    state.files   = normalizeUnique(t.files || []);
    renderCatalogGroups();
    renderTreeNested(true);
    persist();
  }

  // ===== Catalog rendering =====
  const GROUP_ICONS = {
    common: 'default_folder.svg',
    html:   'file_type_html.svg',
    css:    'file_type_css.svg',
    js:     'file_type_js.svg',
    php:    'file_type_php.svg',
    json:   'file_type_json.svg',
    img:    'file_type_image.svg',
    docs:   'file_type_markdown.svg',
    conf:   'file_type_config.svg',
    tools:  'file_type_shell.svg'
  };
  function getGroupIconPath(key){ return 'icons/' + (GROUP_ICONS[key] || 'default_file.svg'); }

  function renderCatalogGroups(){
    const container = els.catalogGroups;
    if(!container) return;
    container.innerHTML = '';

    Object.entries(CATALOG).forEach(([key, group])=>{
      const sec = document.createElement('section');
      sec.className = `picker-sec tint-${key}`;
      sec.style.setProperty('--tint', TYPE_TINTS[key] || 'var(--muted)');

      const head = document.createElement('div');
      head.className = 'picker-head';

      const span = document.createElement('span');
      span.style.display = 'flex';
      span.style.alignItems = 'center';
      span.style.gap = '6px';

      const ico = document.createElement('img');
      ico.className = 'group-ico';
      ico.src = getGroupIconPath(key);
      ico.alt = "";   
      ico.setAttribute('aria-hidden', 'true');

      const text = document.createTextNode(group.label);
      span.appendChild(ico);
      span.appendChild(text);
      head.appendChild(span);
      sec.appendChild(head);

      const lists = document.createElement('div');
      lists.className = 'lists' + ((group.folders?.length && group.files?.length) ? '' : ' single');

      if (group.folders?.length){
        const col = document.createElement('div');
        const h = document.createElement('div'); h.className = 'subhead'; h.textContent = 'Folders';
        col.appendChild(h);
        const ul = document.createElement('ul'); ul.className = 'list';
        group.folders.forEach(p => ul.appendChild(makeCatalogItem('folder', p)));
        col.appendChild(ul);
        lists.appendChild(col);
      }

      if (group.files?.length){
        const col = document.createElement('div');
        const h = document.createElement('div'); h.className = 'subhead'; h.textContent = 'Files';
        col.appendChild(h);
        const ul = document.createElement('ul'); ul.className = 'list';
        group.files.forEach(p => ul.appendChild(makeCatalogItem('file', p)));
        col.appendChild(ul);
        lists.appendChild(col);
      }

      sec.appendChild(lists);
      container.appendChild(sec);
    });
  }

  function makeCatalogItem(kind, path){
    const li = document.createElement('li');
    li.className = 'item';
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';

    const list = (kind==='folder') ? state.folders : state.files;
    cb.checked = list.some(x => x.toLowerCase() === path.toLowerCase());
    cb.addEventListener('change', ()=> toggleSelection(kind, path, cb.checked));

    const code = document.createElement('code');
    code.textContent = (kind==='folder') ? `${path}/` : path;

    label.appendChild(cb);
    label.appendChild(code);
    li.appendChild(label);
    return li;
  }

  // ===== Selection + normalization =====
  function toggleSelection(kind, path, enabled){
    const list = (kind==='folder') ? state.folders : state.files;
    const i = list.findIndex(x => x.toLowerCase() === path.toLowerCase());
    if (enabled && i === -1) list.push(path);
    else if (!enabled && i !== -1) list.splice(i, 1);

    if (kind==='folder') state.folders = normalizeUnique(state.folders);
    else state.files = normalizeUnique(state.files);

    renderTreeNested(true);
    persist();
    renderCatalogGroups(); // sync other groups
  }

  function normalizeUnique(arr){
    const cleaned = arr
      .map(s => s.replace(/\\/g,'/').replace(/^\/+|\/+$/g,'').trim())
      .filter(Boolean);
    const seen = new Set(); const out = [];
    for(const s of cleaned){
      const k = s.toLowerCase();
      if(!seen.has(k)){ seen.add(k); out.push(s); }
    }
    return out;
  }

  // ===== Tree rendering =====
  function buildTree(folders, files){
    const root = { name:'', type:'folder', children:new Map() };
    for(const f of folders){ addPath(root, f.split('/')); }
    for(const fp of files){
      const parts = fp.split('/'); const fname = parts.pop();
      const parent = addPath(root, parts);
      if (!parent.children.has(fname)){
        parent.children.set(fname, { name: fname, type:'file' });
      }
    }
    return root;
  }
  function addPath(node, parts){
    let cur = node;
    for(const part of parts){
      if(!part) continue;
      if(!cur.children.has(part)){
        cur.children.set(part, { name: part, type:'folder', children:new Map() });
      }
      cur = cur.children.get(part);
    }
    return cur;
  }

  const ICONS = {
    'folder':'default_folder.svg','folder-open':'default_folder_opened.svg',
    'html':'file_type_html.svg','css':'file_type_css.svg','js':'file_type_js.svg','ts':'file_type_typescript.svg',
    'jsx':'file_type_reactjs.svg','vue':'file_type_vue.svg','json':'file_type_json.svg','yaml':'file_type_yaml.svg',
    'xml':'file_type_xml.svg','csv':'file_type_csv.svg','md':'file_type_markdown.svg','pdf':'file_type_pdf.svg',
    'txt':'file_type_text.svg','ps1':'file_type_powershell.svg','shell':'file_type_shell.svg','python':'file_type_python.svg',
    'ruby':'file_type_ruby.svg','php':'file_type_php.svg','java':'file_type_java.svg','cpp':'file_type_cpp.svg',
    'csharp':'file_type_csharp.svg','go':'file_type_go.svg','rust':'file_type_rust.svg','swift':'file_type_swift.svg',
    'img':'file_type_image.svg','archive':'file_type_zip.svg','model':'file_type_obj.svg','conf':'file_type_config.svg','file':'default_file.svg'
  };
  function getIconPath(kind){ return 'icons/' + (ICONS[kind] || ICONS.file); }

  function renderTreeNested(openAllOnRender=false){
    const tree = buildTree(state.folders, state.files);
    const container = document.createElement('div');
    container.className = 'tree';
    container.appendChild(renderNodeUL(tree, openAllOnRender));
    els.treePreview.innerHTML = '';
    els.treePreview.appendChild(container);
  }

  function renderNodeUL(node, openAllOnRender){
    const ul = document.createElement('ul');
    const entries = Array.from(node.children.values()).sort((a,b)=>{
      if (a.type !== b.type) return a.type==='folder' ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    for (const child of entries){
      const li = document.createElement('li');
      const isFolder = child.type === 'folder';
      const kind = isFolder ? 'folder' : getKindFor(child.name);

      const row = makeRow(kind, child.name);
      li.appendChild(row);

if (isFolder){
  // Build sub-list first so we can link it via aria-controls
  const sub = renderNodeUL(child, openAllOnRender);
  const subId = 'sub-' + Math.random().toString(36).slice(2);
  sub.id = subId;

  const startOpen = openAllOnRender || (child.children?.size > 0);
  sub.style.display = startOpen ? 'block' : 'none';

  // Make the folder row an interactive disclosure control
  row.classList.add('folder-row');
  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '0');
  row.setAttribute('aria-controls', subId);
  row.setAttribute('aria-expanded', startOpen ? 'true' : 'false');

  // Mouse toggle (existing behavior)
  row.addEventListener('click', (e)=>{
    if (e.target.tagName === 'INPUT') return;
    const open = sub.style.display === 'none';
    sub.style.display = open ? 'block' : 'none';
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
    const img = row.querySelector('img.icon');
    if (img) img.src = getIconPath(open ? 'folder-open' : 'folder');
  });

  // Keyboard toggle (Enter/Space)
  row.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      row.click();
    }
  });

  // Initial icon state
  const img = row.querySelector('img.icon');
  if (img) img.src = getIconPath(startOpen ? 'folder-open' : 'folder');

  li.appendChild(sub);
}


      ul.appendChild(li);
    }
    return ul;
  }

  function makeRow(kind, name){
    const row = document.createElement('div');
    row.className = 'tree-row';
    const img = document.createElement('img');
    img.className = 'icon';
    img.src = getIconPath(kind);
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'name';
    label.textContent = (kind === 'folder') ? `${name}/` : name;
    row.appendChild(img);
    row.appendChild(label);
    return row;
  }

  function getKindFor(filename){
    const n = filename.toLowerCase();
    if (n === '.gitignore' || n === '.editorconfig' || n === '.prettierrc' ||
        n.endsWith('.config') || n.endsWith('.conf') || n.endsWith('.ini') ||
        n.endsWith('.env') || n.endsWith('.env.local') || n.endsWith('.env.production')) return 'conf';

    if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
    if (n.endsWith('.css') || n.endsWith('.scss') || n.endsWith('.less')) return 'css';
    if (n.endsWith('.js') || n.endsWith('.mjs') || n.endsWith('.cjs')) return 'js';
    if (n.endsWith('.ts') || n.endsWith('.tsx')) return 'ts';
    if (n.endsWith('.jsx')) return 'jsx';
    if (n.endsWith('.vue') || n.endsWith('.svelte')) return 'vue';

    if (n.endsWith('.json') || n.endsWith('.jsonc')) return 'json';
    if (n.endsWith('.yaml') || n.endsWith('.yml')) return 'yaml';
    if (n.endsWith('.xml')) return 'xml';
    if (n.endsWith('.csv')) return 'csv';

    if (n.endsWith('.md') || n.endsWith('.markdown')) return 'md';
    if (n.endsWith('.pdf')) return 'pdf';
    if (n.endsWith('.txt') || n.endsWith('.log')) return 'txt';

    if (n.endsWith('.ps1') || n.endsWith('.bat') || n.endsWith('.cmd')) return 'ps1';
    if (n.endsWith('.sh') || n.endsWith('.bash')) return 'shell';
    if (n.endsWith('.py')) return 'python';
    if (n.endsWith('.rb')) return 'ruby';
    if (n.endsWith('.php')) return 'php';
    if (n.endsWith('.java')) return 'java';
    if (n.endsWith('.c') || n.endsWith('.cpp') || n.endsWith('.h') || n.endsWith('.hpp')) return 'cpp';
    if (n.endsWith('.cs')) return 'csharp';
    if (n.endsWith('.go')) return 'go';
    if (n.endsWith('.rs')) return 'rust';
    if (n.endsWith('.swift')) return 'swift';

    if (/\.(png|jpg|jpeg|gif|webp|bmp|tiff|ico|svg)$/.test(n)) return 'img';
    if (/\.(obj|fbx|stl|gltf|glb)$/.test(n)) return 'model';
    if (/\.(zip|rar|7z|tar|gz|bz2)$/.test(n)) return 'archive';
    return 'file';
  }

  // ===== Validation & generation =====
function validate(preferScriptRoot=false){
  const raw = els.rootPath.value;
  const rootTyped = (raw || '').trim().replace(/^["']|["']$/g, '');

  // Treat folder label as *definitive* script-root regardless of handle presence
  if (isHandleLabel(rootTyped) || (preferScriptRoot && selectedDirHandle && rootTyped === '')){
    if (state.folders.length === 0 && state.files.length === 0){
      throw new Error('Add at least one folder or file.');
    }
    return { root: '$PSScriptRoot', folders: state.folders, files: state.files, mode: 'script-root' };
  }

  // Otherwise we require a real Windows path
  if(!rootTyped) throw new Error('Root path is required.');
  const isUNC  = /^\\\\/.test(rootTyped);
  const isDrive = /^[A-Za-z]:\\/.test(rootTyped);
  if (/[<>\"|?*]/.test(rootTyped)) throw new Error('Invalid characters in path.');
  const colonIdx = rootTyped.indexOf(':');
  if (colonIdx !== -1 && !(isDrive && colonIdx === 1)) throw new Error('Invalid colon placement.');
  if (!isUNC && !isDrive) throw new Error('Enter a full Windows path.');
  if (state.folders.length === 0 && state.files.length === 0) throw new Error('Add at least one folder or file.');

  return { root: rootTyped, folders: state.folders, files: state.files, mode: 'typed-path' };
}



function generate(){
  try{
    const typed = (els.rootPath.value || '').trim();

    // Script-root if the input is the folder label OR we have a picked handle with empty input.
    const preferScriptRoot = isHandleLabel(typed) || (!!selectedDirHandle && typed === '');
log(`gen: typed="${(els.rootPath.value||'').trim()}" handle=${!!selectedDirHandle} preferScriptRoot=${preferScriptRoot}`, 'warn');

    const { root, folders, files } = validate(preferScriptRoot);

    const script = window.Generator.buildScript({
      root,
      folders,
      files,
      includeTreeCmd: els.includeTreeCmd.checked,
      dryRunHeader: els.dryRunOnly.checked
    });

    els.scriptOutput.value = script;
    log('Script generated successfully.', 'success');
    persist();
  }catch(err){
    log(err.message, 'error');
    els.scriptOutput.value = '';
  }
}



  // ===== Actions =====
  els.generateBtn?.addEventListener('click', generate);

  els.copyBtn?.addEventListener('click', ()=>{
    const text = els.scriptOutput.value;
    if(!text){ log('No script to copy.', 'warn'); return; }
    navigator.clipboard.writeText(text)
      .then(()=> log('Copied to clipboard.', 'success'))
      .catch(()=> log('Clipboard write failed.', 'error'));
  });

  els.downloadBtn?.addEventListener('click', async ()=>{
    const text = els.scriptOutput.value;
    if(!text){ log('No script to download.', 'warn'); return; }

    try{
      if(selectedDirHandle && FS_SUPPORTED){
        const fileHandle = await selectedDirHandle.getFileHandle('create-stack.ps1', { create:true });
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();
        log('Saved create-stack.ps1 into the selected folder.', 'success');
        return;
      }

      const blob = new Blob([text], { type:'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'create-stack.ps1';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      log('Downloaded create-stack.ps1', 'success');
    }catch(err){
      log(`Save failed: ${err.message}`, 'error');
    }
  });

  els.resetBtn?.addEventListener('click', ()=>{
    els.rootPath.value = '';
    selectedDirHandle = null;
    state.folders = [];
    state.files   = [];
    els.scriptOutput.value = '';
    if (els.includeTreeCmd) els.includeTreeCmd.checked = true;
    if (els.dryRunOnly) els.dryRunOnly.checked = false;
    if (els.treePreview) els.treePreview.innerHTML = '';
    localStorage.removeItem('scaffold.state');
    renderCatalogGroups();
    renderTreeNested(true);
    renderTemplatePreview(null); // clear
    updateRootStatus();
    log('Form reset.', 'warn');
  });

  // ===== Persistence =====
  function persist(){
    const payload = {
      root: els.rootPath.value,
      folders: state.folders,
      files: state.files,
      includeTree: els.includeTreeCmd?.checked ?? true,
      dryRun: els.dryRunOnly?.checked ?? false,
      hasHandle: !!selectedDirHandle,
      handleLabel: selectedDirHandle ? labelForHandle(selectedDirHandle) : ''
    };
    localStorage.setItem('scaffold.state', JSON.stringify(payload));
  }


(function restore(){
  try{
    const raw = localStorage.getItem('scaffold.state');
    if(!raw) return initDefault();
    const s = JSON.parse(raw);

    // MIGRATION: discard the old personal default if present
    if (s.root === 'C:\\Users\\Phil\\Desktop\\website' && !s.hasHandle) {
      s.root = '';
      localStorage.setItem('scaffold.state', JSON.stringify(s)); // write back sanitized state
    }

    // Prefer handle label if we had a picked folder last time
    if (s.hasHandle && s.handleLabel){
      els.rootPath.value = s.handleLabel;
    } else {
      els.rootPath.value = s.root || '';
    }

    state.folders = Array.isArray(s.folders) ? s.folders : [];
    state.files   = Array.isArray(s.files) ? s.files : [];
    if(els.includeTreeCmd) els.includeTreeCmd.checked = !!s.includeTree;
    if(els.dryRunOnly) els.dryRunOnly.checked = !!s.dryRun;

    if(state.folders.length === 0 && state.files.length === 0) initDefault();
    renderCatalogGroups(); renderTreeNested(true);
    if (state.folders.length || state.files.length){
      renderTemplatePreview({label:'Custom Selection',description:'Your current selections',folders:state.folders,files:state.files});
    }
  }catch{
    initDefault();
  }
  updateRootStatus();
})();



function initDefault(){
  els.rootPath.value = '';
  els.rootPath.placeholder = "Choose a folder or enter a path";
  applyTemplate(INLINE_DEFAULT);
  renderTemplatePreview(INLINE_DEFAULT);
  updateRootStatus();
}


  // ===== Logging =====
  function log(msg, level=''){
    const t = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.textContent = `[${t}] ${msg}`;
    line.className = level || '';
    els.console?.appendChild(line);
    if(els.console) els.console.scrollTop = els.console.scrollHeight;
  }

  // ===== Template Preview helpers =====
  function getTemplateCategory(t){
    const mapped = CATEGORY_BY_LABEL.get(t?.label || '');
    if (mapped) return mapped;
    const name = (t?.label || '').toLowerCase();
    if (name.includes('php') || name.includes('api')) return 'PHP / Backend';
    if (name.includes('spa') || name.includes('pwa')) return 'SPA / PWA';
    if (name.includes('doc')) return 'Docs';
    if (name.includes('design') || name.includes('component')) return 'Design System';
    if (name.includes('tool') || name.includes('build')) return 'Tools / Build';
    return 'Static Site';
  }

  function estimateDepth(folders=[], files=[]){
    let maxD = 1;
    const scan = (p)=> {
      const d = (p.replace(/^\/*|\/*$/g,'').split('/').filter(Boolean).length) || 1;
      if (d > maxD) maxD = d;
    };
    folders.forEach(scan);
    files.forEach(fp => {
      const parts = fp.split('/'); parts.pop();
      if (parts.length) scan(parts.join('/'));
    });
    return maxD;
  }

  function purposeNote(category){
    switch(category){
      case 'SPA / PWA': return 'Single-page app scaffold with client-side routing.';
      case 'PHP / Backend': return 'Public + API endpoints with PHP includes.';
      case 'Docs': return 'Documentation structure with pages/sections.';
      case 'Design System': return 'Component tokens, utilities, and demo pages.';
      case 'Tools / Build': return 'Scripts and tooling for build/deploy tasks.';
      default: return 'Static site foundation with HTML/CSS/JS.';
    }
  }

  function renderTemplatePreview(t){
    const el = els.templatePreview;
    if(!el){ return; }
    if(!t){ el.innerHTML = ''; return; }

    const folders = Array.isArray(t.folders) ? t.folders : [];
    const files   = Array.isArray(t.files)   ? t.files   : [];

    const cat     = getTemplateCategory(t);
    const tint    = CATEGORY_COLORS[cat] || 'var(--accent)';
    const depth   = estimateDepth(folders, files);

    const fCount  = folders.length;
    const fileCnt = files.length;
    const scripts = countScripts(files);

    const stacks  = detectStacks(folders, files);
    const prereqs = detectPrereqs(files);
    const flags   = detectFlags(files);
    const warns   = findPathWarnings([...folders, ...files], depth);

    el.style.setProperty('--cat', tint);
    el.innerHTML = `
      <div class="tpl-row">
        <h3 class="tpl-title">${escapeHTML(t.label || 'Template')}</h3>
        <span class="tpl-pill">${escapeHTML(cat)}</span>
      </div>

      <p class="tpl-desc">${escapeHTML(t.description || purposeNote(cat))}</p>

      <div class="tpl-badges">
        <span class="tpl-badge">Folders: ${fCount}</span>
        <span class="tpl-badge">Files: ${fileCnt}</span>
        <span class="tpl-badge">Depth: ${depth}</span>
        <span class="tpl-badge">Scripts: ${scripts}</span>
        ${warns.length ? `<span class="tpl-badge warn" title="${escapeHTML(warns.join('\n'))}">Warnings: ${warns.length}</span>` : ''}
      </div>

      <p class="tpl-meta">
        <strong>Stacks:</strong> ${stacks.join(', ') || '—'}
        ${prereqs.length ? `<span class="sep">·</span> <strong>Prereqs:</strong> ${prereqs.join(', ')}` : ''}
        ${flags.length ? `<span class="sep">·</span> <strong>Flags:</strong> ${flags.join(', ')}` : ''}
      </p>

      <p class="tpl-note">
        Depth = deepest folder nesting level (root = 1). Example: <code>css/components/buttons</code> → depth 3.
      </p>
    `;
  }

  /* ===== minimal helpers ===== */
  function countScripts(files){
    return files.filter(f => /\.(ps1|bat|cmd|sh|bash|zsh)$/.test(f) || /^scripts\//i.test(f)).length;
  }

  function detectStacks(folders, files){
    const has = (re, arr) => arr.some(p => re.test(p));
    const out = [];
    if (has(/\.html?$/i, files)) out.push('HTML');
    if (has(/\.css$/i, files) || has(/^css(\/|$)/i, folders)) out.push('CSS');
    if (has(/\.m?js$/i, files) || has(/^js(\/|$)/i, folders)) out.push('JS');
    if (has(/\.php$/i, files) || has(/^(api|public|includes|templates|classes)(\/|$)/i, folders)) out.push('PHP');
    if (has(/\.json$/i, files) || has(/^data(\/|$)/i, folders)) out.push('JSON');
    if (has(/^(scripts|tools|ci|bin)(\/|$)/i, folders) || has(/\.(ps1|bat|cmd|sh|bash|zsh)$/i, files)) out.push('Tools');
    return out;
  }

  function detectPrereqs(files){
    const out = [];
    if (files.includes('package.json') || files.some(f => /(vite|webpack)\.config\.js$/i.test(f))) out.push('Node');
    if (files.includes('composer.json')) { out.push('PHP', 'Composer'); }
    if (files.some(f => /\.gitignore$/i.test(f))) out.push('Git');
    if (files.some(f => /\.(ps1|bat|cmd)$/i.test(f))) out.push('PowerShell/Windows');
    if (files.some(f => /\.(sh|bash|zsh)$/i.test(f))) out.push('Bash');
    return Array.from(new Set(out));
  }

  function detectFlags(files){
    const flags = [];
    if (files.includes('.env.example')) flags.push('.env example');
    if (files.includes('.htaccess')) flags.push('Apache .htaccess');
    if (files.some(f => /^api\//i.test(f))) flags.push('API endpoints');
    if (files.some(f => /manifest\.json$/i.test(f))) flags.push('Web manifest');
    return flags;
  }

  function findPathWarnings(paths, depth){
    const msgs = [];
    if (depth > 8) msgs.push('Deep nesting (>8) may cause Windows/tool limits.');
    const bad = /[<>:"|?*]/;
    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
    for (const p of paths){
      const name = p.split('/').pop();
      if (bad.test(p)) msgs.push(`Invalid character: ${p}`);
      if (reserved.test(name)) msgs.push(`Reserved DOS name: ${name}`);
      if (p.length > 200) msgs.push(`Very long path (${p.length} chars).`);
    }
    return Array.from(new Set(msgs));
  }

  // ===== Modal scrollbar compensation (no layout shift) =====
  function setScrollbarCompensation(enable){
    const d = document;
    const sbw = window.innerWidth - d.documentElement.clientWidth;
    if (enable){
      d.documentElement.style.setProperty('--sbw', sbw > 0 ? `${sbw}px` : '0px');
      d.body.classList.add('modal-open');
      d.body.style.overflow = 'hidden';
      d.body.style.paddingRight = `var(--sbw, 0px)`;
    }else{
      d.body.classList.remove('modal-open');
      d.body.style.overflow = '';
      d.body.style.paddingRight = '';
      d.documentElement.style.removeProperty('--sbw');
    }
  }

  // ===== Template Modal =====
  function openTemplatePicker(){
    const list = TEMPLATES_CACHE.length ? TEMPLATES_CACHE : [INLINE_DEFAULT];
    els.templateModal?.setAttribute('aria-hidden', 'false');
    setScrollbarCompensation(true); // prevent CLS
    renderTemplateCards(list);
  }

  function closeTemplatePicker(){
    els.templateModal?.setAttribute('aria-hidden', 'true');
    setScrollbarCompensation(false);
  }

  function renderTemplateCards(list){
    const grid = els.tpGrid;
    if(!grid) return;
    grid.innerHTML = '';

    list.forEach(t=>{
      const card = document.createElement('article');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', t.label || 'Template');
      card.className = 'tp-card';
      card.setAttribute('tabindex','0');

      const category = CATEGORY_BY_LABEL.get(t.label) || 'Static Site';
      const tint = CATEGORY_COLORS[category] || 'var(--accent)';
      card.style.setProperty('--cat', tint);

      card.innerHTML = `
        <div class="tp-pillrow"><span class="tp-pill">${escapeHTML(category)}</span></div>
        <h3>${escapeHTML(t.label || 'Template')}</h3>
        <p>${escapeHTML(t.description || '')}</p>
      `;

      card.addEventListener('mouseenter', ()=> renderTemplatePreview(t));
      card.addEventListener('focusin',   ()=> renderTemplatePreview(t));

      card.addEventListener('click', ()=> chooseTemplate(t));
      card.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); chooseTemplate(t); }
      });

      grid.appendChild(card);
    });
  }

  function chooseTemplate(t){
    applyTemplate(t);
    renderTemplatePreview(t);
    closeTemplatePicker();
    log(`Template applied: ${t.label}`, 'success');

    if(els.templateSelect && TEMPLATES_CACHE.length){
      const idx = TEMPLATES_CACHE.findIndex(x=>x.label===t.label && x.description===t.description);
      if(idx > -1) els.templateSelect.selectedIndex = idx;
    }
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Wire modal controls
  els.openTemplatePicker?.addEventListener('click', openTemplatePicker);
  els.tpClose?.addEventListener('click', closeTemplatePicker);
  els.templateModal?.addEventListener('click', (e)=>{
    if(e.target && e.target.getAttribute('data-close') === 'true'){
      closeTemplatePicker();
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && els.templateModal?.getAttribute('aria-hidden') === 'false'){
      closeTemplatePicker();
    }
  });

  // Footer Back-to-Top
  const btt = document.getElementById('backToTop');
  if (btt){
    btt.addEventListener('click', ()=>{
      const fast = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (fast) window.scrollTo(0,0);
      else window.scrollTo({ top:0, behavior:"smooth" });
    });
  }

  // --- Handle label helpers (UI + semantics) ---
  function isHandleLabel(s){
    return /^\[Folder\]/.test(s || '');
  }

  function setRootToHandleLabel(handle){
    const label = `[Folder] ${handle?.name || ''}`.trim();
    els.rootPath.value = label;
    persist();
    updateRootStatus();
  }

  function clearHandleIfTyped(){
    // If user types anything not starting with [Folder], treat as typed path
    if (!isHandleLabel(els.rootPath.value)){
      // no-op; validate() branches based on label vs typed
    }
  }

  function updateRootStatus(){
    const el = document.getElementById('rootStatus');
    if (!el) return;
    const v = els.rootPath.value.trim();
    if (selectedDirHandle && (isHandleLabel(v) || v === '')) {
      el.textContent = 'Using selected folder (script-root mode: $PSScriptRoot).';
    } else {
      el.textContent = v ? `Using typed path: ${v}` : 'Enter a full Windows path or pick a folder.';
    }
  }

  // reflect semantics when user types
  els.rootPath?.addEventListener('input', ()=>{
    clearHandleIfTyped();
    persist();
    updateRootStatus();
  });

  // ===== Init =====
  loadTemplates();
})();
