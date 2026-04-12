/* ===== MusicBox Extension — Popup UI v3 ===== */

const API = 'https://musicbox.gornich.fun';
const SITE = 'https://musicbox.gornich.fun';

let port = null;
let currentState = {};
let tracks = [];
let playlists = [];
let genres = [];
let activeGenre = null;
let currentTab = 'all';
let currentSort = 'newest';
let searchTimeout = null;
let playlistViewTracks = [];

// Genre filter state: { slug: 'include' | 'exclude' }
let genreFilter = {};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- Open site links ---------- */

function openSite(path = '/') {
  chrome.tabs.create({ url: `${SITE}${path}` });
}

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
        if (currentTab === 'playlists') fetchPlaylists();
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
  showLoading('#track-list');
  try {
    const params = new URLSearchParams({ limit: '100', sort: currentSort });
    if (search) params.set('search', search);

    // Apply genre filters
    const included = Object.entries(genreFilter).filter(([, v]) => v === 'include').map(([k]) => k);
    const excluded = Object.entries(genreFilter).filter(([, v]) => v === 'exclude').map(([k]) => k);
    if (activeGenre) params.set('genres', activeGenre);
    else if (included.length) params.set('genres', included.join(','));
    if (excluded.length) params.set('exclude', excluded.join(','));

    const res = await apiFetch(`/api/tracks?${params}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    tracks = data.tracks || [];
    renderTrackList('#track-list', tracks);
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Не удалось загрузить треки</div>';
  }
}

async function fetchPopular() {
  showLoading('#track-list');
  try {
    const res = await apiFetch('/api/tracks/popular?period=all&limit=50');
    if (!res.ok) throw new Error(res.statusText);
    tracks = await res.json();
    renderTrackList('#track-list', tracks);
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Не удалось загрузить популярные</div>';
  }
}

async function fetchFavorites() {
  showLoading('#track-list');
  try {
    const res = await apiFetch('/api/favorites');
    if (!res.ok) throw new Error(res.statusText);
    tracks = await res.json();
    renderTrackList('#track-list', tracks);
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Не удалось загрузить избранное</div>';
  }
}

async function fetchGenres() {
  try {
    const res = await apiFetch('/api/genres');
    if (!res.ok) throw new Error(res.statusText);
    genres = await res.json();
    renderGenreChips();
    renderGenreFilterPanel();
  } catch (_) {
    genres = [];
    renderGenreChips();
    renderGenreFilterPanel();
  }
}

async function fetchTracksByGenre(genreSlug) {
  showLoading('#track-list');
  try {
    const params = new URLSearchParams({ genres: genreSlug, limit: '100', sort: currentSort });
    const res = await apiFetch(`/api/tracks?${params}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    tracks = data.tracks || [];
    renderTrackList('#track-list', tracks);
  } catch (e) {
    $('#track-list').innerHTML = '<div class="empty">Ошибка загрузки</div>';
  }
}

async function fetchPlaylists() {
  try {
    const [userRes, publicRes] = await Promise.all([
      currentState.loggedIn ? apiFetch('/api/playlists') : Promise.resolve(null),
      apiFetch('/api/playlists/public'),
    ]);
    const userPlaylists = userRes && userRes.ok ? await userRes.json() : [];
    const publicPlaylists = publicRes.ok ? await publicRes.json() : [];
    const userIds = new Set(userPlaylists.map(p => p.id));
    playlists = [...userPlaylists, ...publicPlaylists.filter(p => !userIds.has(p.id))];
    renderPlaylistGrid();
  } catch (e) {
    $('#playlist-list').innerHTML = '<div class="empty">Не удалось загрузить плейлисты</div>';
  }
}

async function fetchPlaylistTracks(playlistId) {
  try {
    const res = await apiFetch(`/api/playlists/${playlistId}`);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    return null;
  }
}

/* ---------- Show / hide sections ---------- */

function showTracksView() {
  $('#track-list').classList.remove('hidden');
  $('#playlist-list').classList.add('hidden');
  $('#playlist-view').classList.add('hidden');
  $('#search-input').parentElement.classList.remove('hidden');
  $('#sort-bar').classList.remove('hidden');
}

function showPlaylistsView() {
  $('#track-list').classList.add('hidden');
  $('#playlist-list').classList.remove('hidden');
  $('#playlist-view').classList.add('hidden');
  $('#search-input').parentElement.classList.add('hidden');
  $('#sort-bar').classList.add('hidden');
}

function showPlaylistDetail() {
  $('#playlist-view').classList.remove('hidden');
}

function hidePlaylistDetail() {
  $('#playlist-view').classList.add('hidden');
}

function showLoading(sel) {
  $(sel).innerHTML = '<div class="empty loading-dots">Загрузка</div>';
}

/* ---------- Genre chips (genres tab) ---------- */

function renderGenreChips() {
  const container = $('#genre-chips');
  if (!genres.length) {
    container.innerHTML = '<div class="empty" style="padding:12px">Нет жанров</div>';
    return;
  }
  container.innerHTML = genres.map(g => `
    <button class="genre-chip${activeGenre === g.slug ? ' active' : ''}" data-slug="${esc(g.slug)}">
      ${esc(g.name)} <span class="genre-count">${g.track_count}</span>
    </button>
  `).join('');

  container.querySelectorAll('.genre-chip').forEach(btn => {
    btn.onclick = () => {
      const slug = btn.dataset.slug;
      if (activeGenre === slug) {
        activeGenre = null;
        btn.classList.remove('active');
        fetchTracks();
      } else {
        activeGenre = slug;
        container.querySelectorAll('.genre-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchTracksByGenre(slug);
      }
    };
  });
}

/* ---------- Genre filter panel (include/exclude) ---------- */

function renderGenreFilterPanel() {
  const container = $('#gf-chips');
  if (!container) return;
  if (!genres.length) {
    container.innerHTML = '<span style="color:var(--text-dim)">Загрузка жанров...</span>';
    return;
  }
  container.innerHTML = genres.map(g => {
    const state = genreFilter[g.slug] || '';
    const cls = state === 'include' ? ' gf-include' : state === 'exclude' ? ' gf-exclude' : '';
    return `<button class="gf-chip${cls}" data-slug="${esc(g.slug)}">${esc(g.name)}</button>`;
  }).join('');

  container.querySelectorAll('.gf-chip').forEach(btn => {
    btn.onclick = (e) => {
      const slug = btn.dataset.slug;
      if (e.shiftKey) {
        // Shift+click = toggle exclude
        if (genreFilter[slug] === 'exclude') delete genreFilter[slug];
        else genreFilter[slug] = 'exclude';
      } else {
        // Click = toggle include
        if (genreFilter[slug] === 'include') delete genreFilter[slug];
        else genreFilter[slug] = 'include';
      }
      renderGenreFilterPanel();
    };
  });
}

function toggleGenreFilterPanel() {
  const panel = $('#genre-filter-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden') && genres.length === 0) {
    fetchGenres();
  }
}

function applyGenreFilter() {
  $('#genre-filter-panel').classList.add('hidden');
  updateFilterBtnState();
  reloadCurrentTab();
}

function resetGenreFilter() {
  genreFilter = {};
  renderGenreFilterPanel();
  updateFilterBtnState();
}

function updateFilterBtnState() {
  const active = Object.keys(genreFilter).length > 0;
  $('#btn-genre-filter').classList.toggle('active', active);
}

/* ---------- Render: Playlist grid ---------- */

function renderPlaylistGrid() {
  const list = $('#playlist-list');
  if (!playlists.length) {
    list.innerHTML = '<div class="empty">Нет плейлистов</div>';
    return;
  }
  list.innerHTML = playlists.map((p, i) => {
    const covers = (p.covers || []).slice(0, 4);
    const count = p.track_count || 0;
    const isPublic = p.is_public;
    return `
      <div class="playlist-card" data-idx="${i}">
        <div class="playlist-cover-grid covers-${Math.min(covers.length, 4)}">
          ${covers.length === 0 ? '<div class="playlist-cover-empty">📋</div>' :
            covers.map(c => `<img src="${API}${c}" loading="lazy" alt="">`).join('')}
        </div>
        <div class="playlist-card-info">
          <div class="playlist-card-name">${esc(p.name)}</div>
          <div class="playlist-card-meta">${count} трек${plural(count)} ${isPublic ? '· 🌐' : ''}</div>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.playlist-card').forEach(card => {
    card.onclick = async () => {
      const pl = playlists[+card.dataset.idx];
      if (!pl) return;
      showPlaylistDetail();
      $('#pv-name').textContent = pl.name;
      $('#pv-count').textContent = `${pl.track_count || 0} треков`;
      $('#playlist-tracks').innerHTML = '<div class="empty loading-dots">Загрузка</div>';

      const data = await fetchPlaylistTracks(pl.id);
      if (!data || !data.tracks?.length) {
        $('#playlist-tracks').innerHTML = '<div class="empty">Плейлист пуст</div>';
        return;
      }
      playlistViewTracks = data.tracks;
      renderTrackList('#playlist-tracks', playlistViewTracks);

      $('#btn-play-playlist').onclick = () => {
        if (playlistViewTracks.length) {
          port.postMessage({ type: 'PLAY', track: playlistViewTracks[0], playlist: playlistViewTracks });
        }
      };
    };
  });
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
      if (currentTab === 'favorites') switchTab('all');
    };
    $('#tab-favorites').style.display = '';
  } else {
    area.innerHTML = '<button id="btn-login" class="btn-small">Войти</button>';
    $('#btn-login').onclick = showLogin;
    $('#tab-favorites').style.display = 'none';
    if (currentTab === 'favorites') switchTab('all');
  }
}

/* ---------- Render: Track List ---------- */

function renderTrackList(containerSel, trackArray) {
  const list = $(containerSel);
  if (!trackArray.length) {
    list.innerHTML = '<div class="empty">Треки не найдены</div>';
    return;
  }

  list.innerHTML = trackArray.map((t, i) => {
    const active = currentState.currentTrack?.id === t.id;
    const cover = t.cover_path ? `${API}${t.cover_path}` : '';
    const dur = fmt(t.duration_seconds);
    const genreTags = (t.genres || []).slice(0, 2).map(g =>
      `<span class="track-genre clickable" data-genre-slug="${esc(g.slug)}">${esc(g.name)}</span>`
    ).join('');
    const artistLink = t.artist
      ? `<span class="track-artist clickable" data-artist="${esc(t.artist)}">${esc(t.artist)}</span>`
      : '<span class="track-artist">Unknown</span>';
    return `
      <div class="track-row${active ? ' active' : ''}" data-idx="${i}" data-container="${containerSel}">
        <div class="track-cover" data-play="1">
          ${cover ? `<img src="${cover}" loading="lazy" alt="">` : '<div class="no-cover">♪</div>'}
          <div class="play-overlay">${active && currentState.playing ? '⏸' : '▶'}</div>
        </div>
        <div class="track-info">
          <div class="track-title-row">
            <span class="track-title">${esc(t.title)}</span>
            <button class="btn-open-site" data-track-id="${t.id}" title="Открыть на сайте">↗</button>
          </div>
          <div class="track-meta">
            ${artistLink}
            ${genreTags}
          </div>
        </div>
        <div class="track-duration">${dur}</div>
      </div>`;
  }).join('');

  // Play/pause on cover click or row click
  list.querySelectorAll('.track-row').forEach(row => {
    row.querySelector('.track-cover').onclick = (e) => {
      e.stopPropagation();
      playTrackFromRow(row);
    };
    row.onclick = (e) => {
      if (e.target.closest('.clickable, .btn-open-site')) return;
      playTrackFromRow(row);
    };
  });

  // Track -> open on site
  list.querySelectorAll('.btn-open-site').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openSite(`/track/${btn.dataset.trackId}`);
    };
  });

  // Artist name -> open site filtered by artist
  list.querySelectorAll('.track-artist.clickable').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      openSite(`/browse?artist=${encodeURIComponent(el.dataset.artist)}`);
    };
  });

  // Genre tag -> filter by genre in extension
  list.querySelectorAll('.track-genre.clickable').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const slug = el.dataset.genreSlug;
      if (currentTab !== 'genres') {
        currentTab = 'genres';
        $$('#main-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'genres'));
        $('#genre-chips').classList.remove('hidden');
        showTracksView();
      }
      activeGenre = slug;
      fetchGenres().then(() => fetchTracksByGenre(slug));
    };
  });
}

function playTrackFromRow(row) {
  const src = row.dataset.container === '#playlist-tracks' ? playlistViewTracks : tracks;
  const track = src[+row.dataset.idx];
  if (!track) return;
  if (currentState.currentTrack?.id === track.id && currentState.playing) {
    port.postMessage({ type: 'PAUSE' });
  } else if (currentState.currentTrack?.id === track.id) {
    port.postMessage({ type: 'RESUME' });
  } else {
    port.postMessage({ type: 'PLAY', track, playlist: src });
  }
}

/* ---------- Update active track highlight ---------- */

function updateActiveTrack() {
  $$('.track-row').forEach(row => {
    const src = row.dataset.container === '#playlist-tracks' ? playlistViewTracks : tracks;
    const track = src[+row.dataset.idx];
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

function switchTab(tab) {
  currentTab = tab;
  activeGenre = null;
  $$('#main-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));

  if (tab === 'genres') {
    $('#genre-chips').classList.remove('hidden');
    showTracksView();
    fetchGenres();
    fetchTracks();
  } else {
    $('#genre-chips').classList.add('hidden');
  }

  if (tab === 'playlists') {
    showPlaylistsView();
    fetchPlaylists();
  } else {
    showTracksView();
    hidePlaylistDetail();
  }

  if (tab === 'all') fetchTracks($('#search-input').value);
  if (tab === 'popular') fetchPopular();
  if (tab === 'favorites') fetchFavorites();
}

function reloadCurrentTab() {
  if (currentTab === 'all') fetchTracks($('#search-input').value);
  else if (currentTab === 'popular') fetchPopular();
  else if (currentTab === 'favorites') fetchFavorites();
  else if (currentTab === 'genres') {
    if (activeGenre) fetchTracksByGenre(activeGenre);
    else fetchTracks();
  }
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

function plural(n) {
  const m = n % 10;
  const h = n % 100;
  if (m === 1 && h !== 11) return '';
  if (m >= 2 && m <= 4 && (h < 10 || h >= 20)) return 'а';
  return 'ов';
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  // Logo click -> open site
  $('#logo-link').onclick = () => openSite('/');

  // Search
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (currentTab === 'all') fetchTracks(e.target.value);
      else if (currentTab === 'genres' && !activeGenre) fetchTracks(e.target.value);
    }, 300);
  });

  // Sort
  $('#sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    reloadCurrentTab();
  });

  // Genre filter button
  $('#btn-genre-filter').onclick = () => toggleGenreFilterPanel();
  $('#btn-close-gf').onclick = () => $('#genre-filter-panel').classList.add('hidden');
  $('#btn-gf-reset').onclick = () => { resetGenreFilter(); reloadCurrentTab(); };
  $('#btn-gf-apply').onclick = () => applyGenreFilter();

  // Tabs
  $$('#main-tabs .tab').forEach(tab => {
    tab.onclick = () => switchTab(tab.dataset.tab);
  });

  // Back from playlist detail
  $('#btn-back-from-playlist').onclick = () => hidePlaylistDetail();

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

  // Player track title click -> open on site
  $('#player-title').onclick = () => {
    if (currentState.currentTrack?.id) openSite(`/track/${currentState.currentTrack.id}`);
  };
  $('#player-artist').onclick = () => {
    if (currentState.currentTrack?.artist) openSite(`/browse?artist=${encodeURIComponent(currentState.currentTrack.artist)}`);
  };

  // Preload genres for filter panel
  fetchGenres();

  // Connect & fetch
  connect();
  fetchTracks();
});
