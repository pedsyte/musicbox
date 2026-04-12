/* ===== MusicBox Extension — Popup UI ===== */

const API = 'https://musicbox.gornich.fun';

let port = null;
let currentState = {};
let tracks = [];
let currentTab = 'all';
let searchTimeout = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- Connect to background ---------- */

function connect() {
  port = chrome.runtime.connect({ name: 'popup' });
  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'STATE':
        currentState = msg;
        renderPlayer();
        renderHeader();
        updateActiveTrack();
        break;
      case 'LOGIN_OK':
        currentState.user = msg.user;
        currentState.loggedIn = true;
        hideLogin();
        renderHeader();
        break;
      case 'LOGIN_ERROR':
        showLoginError(msg.error);
        break;
    }
  });
}

/* ---------- API ---------- */

async function apiFetch(path) {
  const headers = {};
  const stored = await chrome.storage.local.get('token');
  if (stored.token) headers['Authorization'] = `Bearer ${stored.token}`;
  return fetch(`${API}${path}`, { headers });
}

async function fetchTracks(search = '') {
  try {
    const params = new URLSearchParams({ limit: '100', sort: 'newest' });
    if (search) params.set('search', search);
    const res = await apiFetch(`/api/tracks?${params}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    tracks = data.tracks || [];
    renderTrackList();
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Не удалось загрузить треки</div>';
  }
}

async function fetchFavorites() {
  try {
    const res = await apiFetch('/api/favorites');
    if (!res.ok) throw new Error(res.statusText);
    tracks = await res.json();
    renderTrackList();
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Не удалось загрузить избранное</div>';
  }
}

/* ---------- Render: Header ---------- */

function renderHeader() {
  const area = $('#user-area');
  if (currentState.loggedIn && currentState.user) {
    area.innerHTML = `
      <span class="username">${esc(currentState.user.username)}</span>
      <button id="btn-logout" class="btn-icon" title="Выйти">⏻</button>
    `;
    $('#btn-logout').onclick = () => {
      port.postMessage({ type: 'LOGOUT' });
      currentState.loggedIn = false;
      currentState.user = null;
      renderHeader();
      if (currentTab === 'favorites') {
        currentTab = 'all';
        updateTabs();
        fetchTracks();
      }
    };
    $('#tab-favorites').style.display = '';
  } else {
    area.innerHTML = '<button id="btn-login" class="btn-small">Войти</button>';
    $('#btn-login').onclick = showLogin;
    $('#tab-favorites').style.display = 'none';
    if (currentTab === 'favorites') {
      currentTab = 'all';
      updateTabs();
    }
  }
}

/* ---------- Render: Track List ---------- */

function renderTrackList() {
  const list = $('#track-list');
  if (!tracks.length) {
    list.innerHTML = '<div class="empty">Треки не найдены</div>';
    return;
  }

  list.innerHTML = tracks.map((t, i) => {
    const active = currentState.currentTrack?.id === t.id;
    const cover = t.cover_path ? `${API}${t.cover_path}` : '';
    const dur = fmt(t.duration_seconds);
    return `
      <div class="track-row${active ? ' active' : ''}" data-idx="${i}">
        <div class="track-cover">
          ${cover ? `<img src="${cover}" loading="lazy" alt="">` : '<div class="no-cover">♪</div>'}
          <div class="play-overlay">${active && currentState.playing ? '⏸' : '▶'}</div>
        </div>
        <div class="track-info">
          <div class="track-title">${esc(t.title)}</div>
          <div class="track-artist">${esc(t.artist || 'Unknown')}</div>
        </div>
        <div class="track-duration">${dur}</div>
      </div>`;
  }).join('');

  list.querySelectorAll('.track-row').forEach(row => {
    row.onclick = () => {
      const track = tracks[+row.dataset.idx];
      if (!track) return;
      if (currentState.currentTrack?.id === track.id && currentState.playing) {
        port.postMessage({ type: 'PAUSE' });
      } else if (currentState.currentTrack?.id === track.id) {
        port.postMessage({ type: 'RESUME' });
      } else {
        port.postMessage({ type: 'PLAY', track, playlist: tracks });
      }
    };
  });
}

/* ---------- Update active track highlight (lightweight) ---------- */

function updateActiveTrack() {
  $$('.track-row').forEach(row => {
    const track = tracks[+row.dataset.idx];
    if (!track) return;
    const active = currentState.currentTrack?.id === track.id;
    row.classList.toggle('active', active);
    const overlay = row.querySelector('.play-overlay');
    if (overlay) overlay.textContent = active && currentState.playing ? '⏸' : '▶';
  });
}

/* ---------- Render: Player ---------- */

function renderPlayer() {
  const player = $('#player');
  const track = currentState.currentTrack;

  if (!track) {
    player.classList.add('hidden');
    return;
  }

  player.classList.remove('hidden');

  const cover = track.cover_path ? `${API}${track.cover_path}` : '';
  const coverEl = $('#player-cover');
  coverEl.innerHTML = cover
    ? `<img src="${cover}" alt="">`
    : '<div class="no-cover">♪</div>';

  $('#player-title').textContent = track.title;
  $('#player-artist').textContent = track.artist || 'Unknown';

  $('#btn-play').textContent = currentState.playing ? '⏸' : '▶';

  const pct = currentState.duration > 0
    ? (currentState.currentTime / currentState.duration) * 100
    : 0;
  $('#progress-fill').style.width = `${pct}%`;
  $('#time-current').textContent = fmt(currentState.currentTime);
  $('#time-total').textContent = fmt(currentState.duration);

  $('#btn-shuffle').classList.toggle('active', !!currentState.shuffle);
  $('#btn-radio').classList.toggle('active', !!currentState.radio);
  $('#volume-slider').value = Math.round((currentState.volume ?? 0.8) * 100);
}

/* ---------- Login ---------- */

function showLogin() {
  $('#login-overlay').classList.remove('hidden');
  $('#login-username').focus();
}

function hideLogin() {
  $('#login-overlay').classList.add('hidden');
  $('#login-error').textContent = '';
  $('#login-username').value = '';
  $('#login-password').value = '';
}

function showLoginError(msg) {
  $('#login-error').textContent = msg;
}

function doLogin() {
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  if (!username || !password) {
    showLoginError('Введите логин и пароль');
    return;
  }
  port.postMessage({ type: 'LOGIN', username, password });
}

/* ---------- Tabs ---------- */

function updateTabs() {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
}

/* ---------- Helpers ---------- */

function fmt(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  // Search
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (currentTab === 'all') fetchTracks(e.target.value);
    }, 300);
  });

  // Tabs
  $$('.tab').forEach(tab => {
    tab.onclick = () => {
      currentTab = tab.dataset.tab;
      updateTabs();
      if (currentTab === 'all') fetchTracks($('#search-input').value);
      else if (currentTab === 'favorites') fetchFavorites();
    };
  });

  // Player controls
  $('#btn-play').onclick = () => port.postMessage({ type: currentState.playing ? 'PAUSE' : 'RESUME' });
  $('#btn-prev').onclick = () => port.postMessage({ type: 'PREV' });
  $('#btn-next').onclick = () => port.postMessage({ type: 'NEXT' });
  $('#btn-shuffle').onclick = () => port.postMessage({ type: 'TOGGLE_SHUFFLE' });
  $('#btn-radio').onclick = () => port.postMessage({ type: 'TOGGLE_RADIO' });

  $('#volume-slider').addEventListener('input', (e) => {
    port.postMessage({ type: 'SET_VOLUME', volume: +e.target.value / 100 });
  });

  // Progress seek
  $('#progress-bar').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (currentState.duration > 0) {
      port.postMessage({ type: 'SEEK', time: pct * currentState.duration });
    }
  };

  // Login
  $('#btn-do-login').onclick = doLogin;
  $('#login-password').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
  $('#login-username').onkeydown = (e) => { if (e.key === 'Enter') $('#login-password').focus(); };
  $('#btn-cancel-login').onclick = hideLogin;
  $('#btn-guest').onclick = hideLogin;

  // Connect & fetch
  connect();
  fetchTracks();
});
