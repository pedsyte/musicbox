/* ===== MusicBox Extension — Background Service Worker ===== */

const API = 'https://musicbox.gornich.fun';

let state = {
  token: null,
  user: null,
  playlist: [],
  currentIndex: -1,
  playing: false,
  volume: 0.8,
  shuffle: false,
  radio: true,
  currentTime: 0,
  duration: 0,
};

let popupPort = null;

/* ---------- Init ---------- */

const initPromise = (async () => {
  const stored = await chrome.storage.local.get([
    'token', 'user', 'volume', 'shuffle', 'radio', 'playlist', 'currentIndex',
  ]);
  if (stored.token) state.token = stored.token;
  if (stored.user) state.user = stored.user;
  if (stored.volume !== undefined) state.volume = stored.volume;
  if (stored.shuffle !== undefined) state.shuffle = stored.shuffle;
  if (stored.radio !== undefined) state.radio = stored.radio;
  if (stored.playlist) state.playlist = stored.playlist;
  if (stored.currentIndex !== undefined) state.currentIndex = stored.currentIndex;

  // Sync with offscreen if it's still alive
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    if (contexts.length > 0) {
      const resp = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'GET_STATE' });
      if (resp) {
        state.playing = resp.playing;
        state.currentTime = resp.currentTime;
        state.duration = resp.duration || 0;
      }
    }
  } catch (_) { /* offscreen not running */ }
})();

/* ---------- Offscreen ---------- */

async function ensureOffscreen() {
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    if (contexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing music from MusicBox',
      });
    }
  } catch (e) {
    console.error('[bg] offscreen error:', e);
  }
}

function sendToOffscreen(msg) {
  chrome.runtime.sendMessage({ target: 'offscreen', ...msg }).catch(() => {});
}

/* ---------- State helpers ---------- */

function getPublicState() {
  return {
    playing: state.playing,
    currentTrack: state.playlist[state.currentIndex] || null,
    volume: state.volume,
    shuffle: state.shuffle,
    radio: state.radio,
    currentTime: state.currentTime,
    duration: state.duration,
    hasNext: state.currentIndex < state.playlist.length - 1 || state.radio,
    hasPrev: state.currentIndex > 0,
    user: state.user,
    loggedIn: !!state.token,
  };
}

function notifyPopup() {
  if (popupPort) {
    try { popupPort.postMessage({ type: 'STATE', ...getPublicState() }); } catch (_) {}
  }
}

function persist() {
  chrome.storage.local.set({
    token: state.token,
    user: state.user,
    volume: state.volume,
    shuffle: state.shuffle,
    radio: state.radio,
    playlist: state.playlist,
    currentIndex: state.currentIndex,
  });
}

/* ---------- Playback ---------- */

async function playTrack(index) {
  if (index < 0 || index >= state.playlist.length) return;
  state.currentIndex = index;
  state.playing = true;
  state.currentTime = 0;
  state.duration = 0;

  const track = state.playlist[index];
  const url = `${API}/api/tracks/${track.id}/stream`;

  await ensureOffscreen();
  sendToOffscreen({ type: 'PLAY', url, volume: state.volume });
  persist();
  notifyPopup();
}

async function playTrackFromList(track, trackList) {
  state.playlist = trackList;
  const idx = trackList.findIndex(t => t.id === track.id);
  await playTrack(idx >= 0 ? idx : 0);
}

function pause() {
  state.playing = false;
  sendToOffscreen({ type: 'PAUSE' });
  notifyPopup();
}

function resume() {
  state.playing = true;
  sendToOffscreen({ type: 'RESUME' });
  notifyPopup();
}

async function next() {
  if (state.playlist.length === 0) return;
  if (state.shuffle) {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * state.playlist.length);
    } while (nextIdx === state.currentIndex && state.playlist.length > 1);
    await playTrack(nextIdx);
  } else if (state.currentIndex < state.playlist.length - 1) {
    await playTrack(state.currentIndex + 1);
  } else if (state.radio) {
    await playTrack(0);
  }
}

async function prev() {
  if (state.currentTime > 3) {
    sendToOffscreen({ type: 'SEEK', time: 0 });
    state.currentTime = 0;
    notifyPopup();
  } else if (state.currentIndex > 0) {
    await playTrack(state.currentIndex - 1);
  }
}

/* ---------- Popup port ---------- */

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'popup') return;
  popupPort = port;

  initPromise.then(() => {
    port.postMessage({ type: 'STATE', ...getPublicState() });
  });

  port.onMessage.addListener(async (msg) => {
    await initPromise;
    switch (msg.type) {
      case 'GET_STATE':
        port.postMessage({ type: 'STATE', ...getPublicState() });
        break;
      case 'PLAY':
        await playTrackFromList(msg.track, msg.playlist);
        break;
      case 'PAUSE':
        pause();
        break;
      case 'RESUME':
        resume();
        break;
      case 'NEXT':
        await next();
        break;
      case 'PREV':
        await prev();
        break;
      case 'SET_VOLUME':
        state.volume = msg.volume;
        sendToOffscreen({ type: 'SET_VOLUME', volume: msg.volume });
        persist();
        notifyPopup();
        break;
      case 'TOGGLE_SHUFFLE':
        state.shuffle = !state.shuffle;
        persist();
        notifyPopup();
        break;
      case 'TOGGLE_RADIO':
        state.radio = !state.radio;
        persist();
        notifyPopup();
        break;
      case 'SEEK':
        sendToOffscreen({ type: 'SEEK', time: msg.time });
        break;
      case 'LOGIN':
        try {
          const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: msg.username, password: msg.password }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            port.postMessage({ type: 'LOGIN_ERROR', error: err.detail || 'Ошибка входа' });
            return;
          }
          const data = await res.json();
          state.token = data.token;
          state.user = data.user;
          persist();
          port.postMessage({ type: 'LOGIN_OK', user: data.user });
          notifyPopup();
        } catch (_) {
          port.postMessage({ type: 'LOGIN_ERROR', error: 'Нет соединения с сервером' });
        }
        break;
      case 'LOGOUT':
        state.token = null;
        state.user = null;
        persist();
        notifyPopup();
        break;
    }
  });

  port.onDisconnect.addListener(() => { popupPort = null; });
});

/* ---------- Messages from offscreen ---------- */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== 'background') return;
  switch (msg.type) {
    case 'TIME_UPDATE':
      state.currentTime = msg.currentTime;
      state.duration = msg.duration;
      notifyPopup();
      break;
    case 'ENDED':
      state.playing = false;
      if (state.radio || state.shuffle) {
        next();
      } else {
        notifyPopup();
      }
      break;
    case 'ERROR':
      // Ignore benign Chrome play/pause race condition
      if (msg.error && msg.error.includes('interrupted by a call to pause')) break;
      console.error('[bg] audio error:', msg.error);
      state.playing = false;
      // Auto-skip on error when in radio mode
      if (state.radio) {
        next();
      } else {
        notifyPopup();
      }
      break;
  }
});
