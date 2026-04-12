/* ===== MusicBox Extension — Offscreen Audio Engine ===== */

const audio = new Audio();
let lastUpdate = 0;

audio.addEventListener('ended', () => {
  chrome.runtime.sendMessage({ target: 'background', type: 'ENDED' });
});

audio.addEventListener('error', () => {
  chrome.runtime.sendMessage({
    target: 'background',
    type: 'ERROR',
    error: audio.error?.message || 'Playback error',
  });
});

audio.addEventListener('timeupdate', () => {
  const now = Date.now();
  if (now - lastUpdate < 500) return;
  lastUpdate = now;
  chrome.runtime.sendMessage({
    target: 'background',
    type: 'TIME_UPDATE',
    currentTime: audio.currentTime,
    duration: audio.duration || 0,
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'offscreen') return;

  switch (msg.type) {
    case 'PLAY':
      audio.src = msg.url;
      audio.volume = msg.volume ?? 0.8;
      audio.play().catch(e => {
        chrome.runtime.sendMessage({
          target: 'background',
          type: 'ERROR',
          error: e.message,
        });
      });
      break;
    case 'PAUSE':
      audio.pause();
      break;
    case 'RESUME':
      audio.play().catch(() => {});
      break;
    case 'SET_VOLUME':
      audio.volume = msg.volume;
      break;
    case 'SEEK':
      if (isFinite(msg.time)) audio.currentTime = msg.time;
      break;
    case 'GET_STATE':
      sendResponse({
        playing: !audio.paused && !audio.ended && audio.readyState > 0,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      });
      return true; // keep channel open for async response
  }
});
