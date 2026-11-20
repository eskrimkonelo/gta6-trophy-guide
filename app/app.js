// GTA VI trophy guide & tracker — own code for this entry.
// Loads app/data/trophies.json, renders the checklist, and keeps progress in
// localStorage. No network request is ever made: the only fetch is the local
// data file, and every source link opens only when the reader follows it.

const STORAGE_KEY = 'gta6-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const ROADMAP_STAGES = [
  {
    title: 'Play the story first',
    text: 'Chapters 1 to 5, in order. Story trophies pop naturally — but do Lucia\u2019s balcony meditation in Chapter 1 the moment it is offered (see Positive Mental Attitude), and make a manual save at the start of every chapter. Partner trophies like Hot Together and Retail Therapy are easiest while Jason and Lucia are together during the story.',
  },
  {
    title: 'Side stories & strangers',
    text: 'After the story, finish the five side-story finales — Andy, Kenton, Billy, Randy and Tyrone — then the 8 stranger mission strands and Bret\u2019s hunt. All of them stay available after the credits.',
  },
  {
    title: 'Activities & challenges',
    text: 'The skill grind: gold medals in all 42 Shooting Range challenges, 250 stunts, 20 race wins, 14 drone-race locations, fishing, arcade, bowling, bank vaults and armored trucks. Work the 50 challenges as you go — they fill in alongside the activities.',
  },
  {
    title: 'Collectibles & counts',
    text: 'The long tail: 3 card sets, WAiNK It at 100 locations, 100 vehicles discovered, all 52 areas of Leonida, 8 garages, one illegal operation per gang, and the money goals ($250,000 laundered, $100,000 spent). Do WAiNK It as you visit new areas — the two trophies move together.',
  },
  {
    title: 'Clean-up & platinum',
    text: 'Finish the story to unlock the 100% Completion Checklist, then use it as your to-do list for everything left. When it hits 100%, A Long Road (gold) pops — and the platinum, Vice Got a Price!, follows with it.',
  },
];

const KIND_LABELS = {
  all: 'All trophies',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

// A small demo set used only when the page is opened with ?demo=progress or
// ?demo=spoiler (for screenshots): it ticks a realistic slice of trophies.
const DEMO_EARNED = [2, 3, 4, 5, 8, 9, 10, 15, 16, 20, 21, 33];

const state = loadState();
let trophies = [];
let activeKind = 'all';
let activeGrade = 'all';
let query = '';
let openGuideId = null;
let pendingScroll = null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const stagesEl = $('stages');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], spoiler: false, hideEarned: false };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      spoiler: Boolean(parsed.spoiler),
      hideEarned: Boolean(parsed.hideEarned),
    };
  } catch {
    return { earned: [], spoiler: false, hideEarned: false };
  }
}

function saveState(note) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = $('dataNote');
  el.textContent = note || `Progress saved in this browser · ${new Date().toLocaleTimeString()}`;
  el.classList.add('ok');
}

function isEarned(trophy) {
  return state.earned.includes(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function trophyIsSpoiled(trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(trophy);
}

function matchesFilters(trophy) {
  if (activeGrade !== 'all' && trophy.grade !== activeGrade) return false;
  if (state.hideEarned && isEarned(trophy)) return false;
  if (activeKind === 'online') return false;
  if (activeKind === 'missable' && !trophy.missable) return false;
  if (activeKind !== 'all' && activeKind !== 'missable' && trophy.kind !== activeKind) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderProgress() {
  const earnedCount = state.earned.length;
  const total = trophies.length;
  const pct = total ? Math.round((earnedCount / total) * 100) : 0;
  $('progressText').textContent = `${earnedCount} of ${total} earned`;
  $('progressPct').textContent = `${pct}%`;
  $('progressFill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { total: 0, earned: 0 };
    byGrade[t.grade].total += 1;
    if (isEarned(t)) byGrade[t.grade].earned += 1;
  }
  $('gradeCounts').innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `<li><b>${gradeLabel(g)}</b> ${byGrade[g].earned}/${byGrade[g].total}</li>`)
    .join('');
}

function renderRoadmap() {
  stagesEl.replaceChildren();
  ROADMAP_STAGES.forEach((stage, i) => {
    const stageTrophies = trophies.filter((t) => t.roadmap === i + 1);
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = String(i + 1);
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const chips = document.createElement('ul');
    chips.className = 'stage-trophies';
    for (const t of stageTrophies) {
      const chip = document.createElement('li');
      chip.textContent = t.name;
      if (isEarned(t)) chip.classList.add('done');
      if (t.missable) chip.classList.add('missable-chip');
      chips.append(chip);
    }
    li.append(num, h3, p, chips);
    stagesEl.append(li);
  });
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  $('listTitle').textContent = KIND_LABELS[activeKind] || 'All trophies';
  $('listCount').textContent = `${shown.length} of ${trophies.length} shown · ${state.earned.length} earned`;
  $('onlineNote').hidden = activeKind !== 'online';
  $('emptyNote').hidden = shown.length > 0 || activeKind === 'online';
  listEl.replaceChildren();

  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy';
    li.id = `trophy-${t.id}`;
    if (isEarned(t)) li.classList.add('earned');

    const top = document.createElement('div');
    top.className = 'trophy-top';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'trophy-check';
    check.checked = isEarned(t);
    check.setAttribute('aria-label', `Mark ${t.name} as earned`);
    check.addEventListener('change', () => {
      if (check.checked) state.earned.push(t.id);
      else state.earned = state.earned.filter((id) => id !== t.id);
      saveState();
      renderAll();
    });

    const main = document.createElement('div');
    main.className = 'trophy-main';

    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = trophyIsSpoiled(t) ? 'Hidden story trophy' : t.name;

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    if (trophyIsSpoiled(t)) {
      desc.innerHTML = '<span class="official">Official description</span> — hidden until earned. Turn off “Hide story spoilers” or earn it to reveal.';
    } else {
      desc.innerHTML = '<span class="official">Official description</span> — ';
      desc.append(document.createTextNode(t.description));
    }

    const tags = document.createElement('div');
    tags.className = 'tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = `tag ${t.grade}`;
    gradeTag.textContent = gradeLabel(t.grade);
    tags.append(gradeTag);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag kind';
    kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
    tags.append(kindTag);
    if (t.hidden) {
      const hiddenTag = document.createElement('span');
      hiddenTag.className = 'tag hidden-tag';
      hiddenTag.textContent = 'Hidden on PSN';
      tags.append(hiddenTag);
    }
    if (t.missable) {
      const missTag = document.createElement('span');
      missTag.className = 'tag missable';
      missTag.textContent = '⚠ Missable — only one in the game';
      tags.append(missTag);
    }
    if (isEarned(t)) {
      const earnedTag = document.createElement('span');
      earnedTag.className = 'tag';
      earnedTag.textContent = '✓ Earned';
      tags.append(earnedTag);
    }

    main.append(name, desc, tags);

    if (!trophyIsSpoiled(t)) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'guide-toggle';
      toggle.textContent = openGuideId === t.id ? 'Hide guide ▲' : 'Show guide with sources ▼';
      toggle.addEventListener('click', () => {
        openGuideId = openGuideId === t.id ? null : t.id;
        renderList();
      });
      main.append(toggle);
      if (openGuideId === t.id) main.append(buildGuideDetail(t));
    } else {
      const note = document.createElement('p');
      note.className = 'spoiler-hidden';
      note.textContent = 'Guide hidden with the spoiler setting.';
      main.append(note);
    }

    top.append(check, main);
    li.append(top);
    listEl.append(li);
  }
}

function buildGuideDetail(trophy) {
  const detail = document.createElement('div');
  detail.className = 'trophy-detail';

  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  detail.append(guide);

  if (Array.isArray(trophy.steps) && trophy.steps.length) {
    const h = document.createElement('h4');
    h.textContent = 'Steps';
    const ol = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      ol.append(item);
    }
    detail.append(h, ol);
  }

  if (Array.isArray(trophy.sources) && trophy.sources.length) {
    const h = document.createElement('h4');
    h.textContent = 'Sources for this guide';
    const ul = document.createElement('ul');
    ul.className = 'trophy-sources';
    for (const s of trophy.sources) {
      const item = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      item.append(a);
      ul.append(item);
    }
    detail.append(h, ul);
  }
  return detail;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

function exportProgress() {
  const payload = {
    app: 'gta6-trophy-guide',
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    spoiler: state.spoiler,
    hideEarned: state.hideEarned,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  saveState(`Progress exported as gta6-trophy-progress.json · ${new Date().toLocaleTimeString()}`);
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = new Set(trophies.map((t) => t.id));
    const names = new Set(trophies.map((t) => t.name));
    state.earned = [...new Set(ids.map((v) => {
      if (typeof v === 'number') return v;
      const found = trophies.find((t) => t.name === v);
      return found ? found.id : null;
    }).filter((v) => v !== null && valid.has(v)))];
    if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    if (typeof parsed.hideEarned === 'boolean') state.hideEarned = parsed.hideEarned;
    $('spoilerToggle').checked = state.spoiler;
    $('hideEarnedToggle').checked = state.hideEarned;
    saveState(`Progress imported: ${state.earned.length} trophies earned · ${new Date().toLocaleTimeString()}`);
    renderAll();
  } catch {
    const el = $('dataNote');
    el.textContent = 'That file could not be imported — it is not a progress file from this guide.';
    el.classList.remove('ok');
  }
}

function applyUrlState() {
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo');
  if (demo === 'progress' || demo === 'spoiler') {
    for (const id of DEMO_EARNED) {
      if (!state.earned.includes(id)) state.earned.push(id);
    }
    if (demo === 'spoiler') state.spoiler = true;
    saveState();
  }
  // Keep the toggle checkboxes in step with the state (the demo parameter
  // above can turn the spoiler setting on after the controls were bound).
  $('spoilerToggle').checked = state.spoiler;
  $('hideEarnedToggle').checked = state.hideEarned;
  const guideParam = params.get('guide');
  const hashMatch = location.hash.match(/^#trophy-(\d+)$/);
  const openId = guideParam ? Number(guideParam) : hashMatch ? Number(hashMatch[1]) : null;
  if (openId && trophies.some((t) => t.id === openId)) {
    openGuideId = openId;
    // Scroll only after the final render below: re-rendering the list
    // rebuilds the DOM, so scrolling here would land on a stale layout.
    pendingScroll = { type: 'trophy', id: openId };
  }
  if (params.get('view') === 'roadmap') {
    pendingScroll = { type: 'roadmap' };
  }
}

function scrollToPendingTarget() {
  if (!pendingScroll) return;
  if (pendingScroll.type === 'roadmap') {
    $('roadmap').scrollIntoView({ block: 'start' });
  } else {
    const target = document.getElementById(`trophy-${pendingScroll.id}`);
    if (target) target.scrollIntoView({ block: 'start' });
  }
  pendingScroll = null;
}

function bindControls() {
  $('search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    renderList();
  });
  $('grade').addEventListener('change', (e) => {
    activeGrade = e.target.value;
    renderList();
  });
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveState();
    renderAll();
  });
  $('hideEarnedToggle').checked = state.hideEarned;
  $('hideEarnedToggle').addEventListener('change', (e) => {
    state.hideEarned = e.target.checked;
    saveState();
    renderAll();
  });
  $('kindFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    activeKind = btn.dataset.kind;
    for (const b of $('kindFilters').querySelectorAll('button')) {
      b.classList.toggle('active', b === btn);
    }
    renderList();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importProgress(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned ticks and settings in this browser?')) return;
    state.earned = [];
    state.spoiler = false;
    state.hideEarned = false;
    $('spoilerToggle').checked = false;
    $('hideEarnedToggle').checked = false;
    saveState('Progress reset.');
    renderAll();
  });
}

const doc = await (await fetch(DATA_URL)).json();
trophies = doc.trophies || [];
bindControls();
renderAll();
applyUrlState();
renderAll();
scrollToPendingTarget();
