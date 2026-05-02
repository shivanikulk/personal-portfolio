/**
 * portfolio/app.js
 *
 * Loads profile.json, links.json, projects.json from /data/
 * and renders the full portfolio page.
 *
 * To customise content: edit the JSON files in /data/ — no code changes needed.
 */

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Fetch a local JSON file. Returns parsed object or throws.
 * @param {string} path - relative path e.g. "data/profile.json"
 */
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function formatText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

/**
 * Determine grid layout class based on item count.
 * 1 item  → layout-single
 * 2 items → layout-2col
 * 3 items → layout-1large-2small
 * 4 items → layout-2col (2×2)
 * 5+      → layout-3col
 */
function resolveGridLayout(count, items = []) {
  if (items.some(item => item && ['small', 'medium', 'large'].includes(item.size))) {
    return 'layout-manual';
  }

  if (count === 1) return 'layout-single';
  if (count === 2) return 'layout-2col';
  if (count === 3) return 'layout-1large-2small';
  if (count === 4) return 'layout-2col';
  return 'layout-3col';
}

/* ============================================================
   RENDER: PROFILE
   ============================================================ */
function renderProfile(profile) {
  const img  = document.getElementById('profileImg');
  const name = document.getElementById('profileName');
  const desc = document.getElementById('profileDesc');

  img.src  = profile.image || '';
  img.alt  = formatText(profile.name) || 'Profile photo';
  name.textContent = formatText(profile.name);
  desc.textContent = formatText(profile.description);
}

/* ============================================================
   RENDER: LINKS
   ============================================================ */
function renderLinks(links) {
  const container = document.getElementById('linksSection');
  container.innerHTML = '';

  links.forEach(link => {
    const hasLabel = typeof link.label === 'string' && link.label.trim() !== '';
    const a = document.createElement('a');
    a.href   = link.url   || '#';
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.className = 'link-btn';
    a.title  = hasLabel ? formatText(link.label).trim() : '';

    if (!hasLabel) {
      a.classList.add('icon-only');
      a.setAttribute('aria-label', link.url || 'Shortcut');
    }

    // Icon: supports image URL, local path, or inline SVG string
    if (link.icon) {
      if (link.icon.trim().startsWith('<svg')) {
        // Inline SVG string
        const wrapper = document.createElement('span');
        wrapper.className = 'link-icon-svg';
        wrapper.innerHTML = link.icon;
        a.appendChild(wrapper);
      } else {
        // Image path or URL
        const img = document.createElement('img');
        img.src = link.icon;
        img.alt = formatText(link.label) || '';
        img.onerror = () => img.remove(); // hide broken icons gracefully
        a.appendChild(img);
      }
    }

    // Label
    if (hasLabel) {
      const span = document.createElement('span');
      span.className = 'link-label';
      span.textContent = formatText(link.label).trim();
      a.appendChild(span);
    }

    container.appendChild(a);
  });
}

/* ============================================================
   RENDER: PROJECTS
   ============================================================ */
function renderProjects(sections) {
  const main = document.getElementById('mainContent');
  main.innerHTML = '';

  const normalizedSections = normalizeProjectSections(sections);

  normalizedSections.forEach(section => {
    const block = document.createElement('div');
    block.className = 'section-block';

    // Section title header
    if (section.section) {
      const header = document.createElement('div');
      header.className = 'section-header';
      header.textContent = formatText(section.section);
      block.appendChild(header);
    }

    // Grid
    const items = section.items || [];
    const grid = document.createElement('div');
    const layoutClass = resolveGridLayout(items.length, items);
    grid.className = `project-grid ${layoutClass}`;

    items.forEach(item => {
      const card = createProjectCard(item);
      grid.appendChild(card);
    });

    block.appendChild(grid);
    main.appendChild(block);
  });
}

function normalizeProjectSections(data) {
  if (!Array.isArray(data)) return [];

  const normalized = [];
  let looseItems = [];

  data.forEach(entry => {
    if (entry && Array.isArray(entry.items)) {
      if (looseItems.length) {
        normalized.push({ items: looseItems });
        looseItems = [];
      }

      normalized.push({
        section: entry.section,
        items: entry.items,
      });
      return;
    }

    if (entry) {
      looseItems.push(entry);
    }
  });

  if (looseItems.length) {
    normalized.push({ items: looseItems });
  }

  return normalized;
}

/**
 * Build a single project card element.
 * @param {Object} item - { caption, description, image, url }
 */
function createProjectCard(item) {
  const a = document.createElement('a');
  a.className = 'project-card';
  a.href      = item.url || '#';
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.title     = formatText(item.description || item.caption || '');

  // Image / GIF
  const img = document.createElement('img');
  img.className = 'card-img';
  img.src       = item.image || '';
  img.alt       = formatText(item.caption) || '';
  img.loading   = 'lazy';

  // Description pill
  const desc = document.createElement('span');
  desc.className = 'card-description';
  desc.textContent = formatText(item.description);

  // Caption pill
  const cap = document.createElement('span');
  cap.className   = 'card-caption';
  cap.textContent = formatText(item.caption);

  if (item.size === 'small') {
    a.classList.add('project-card-small');
  } else if (item.size === 'medium') {
    a.classList.add('project-card-medium');
  } else if (item.size === 'large') {
    a.classList.add('project-card-large');
  }

  a.appendChild(img);
  if (desc.textContent.trim()) {
    a.appendChild(desc);
  }
  a.appendChild(cap);

  return a;
}

/* ============================================================
   INIT — load all data and render
   ============================================================ */
async function init() {
  try {
    const [profile, links, projects] = await Promise.all([
      loadJSON('data/profile.json'),
      loadJSON('data/links.json'),
      loadJSON('data/projects.json'),
    ]);

    renderProfile(profile);
    renderLinks(links);
    renderProjects(projects);

  } catch (err) {
    console.error('[Portfolio] Failed to load data:', err);
    // Show a gentle error in the main area
    const main = document.getElementById('mainContent');
    if (main) {
      main.innerHTML = `
        <div style="padding:40px;color:#c00;font-family:monospace;font-size:0.85rem;">
          ⚠️ Could not load portfolio data.<br>
          Make sure the <code>/data/</code> JSON files exist and the page is served
          via a local server (e.g. <code>npx serve .</code> or VS Code Live Server).<br><br>
          Error: ${err.message}
        </div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
