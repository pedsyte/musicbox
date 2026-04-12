/* ===== MusicBox Extension — Offscreen Audio Engine ===== */

const audio = new Audio();
let lastUpdate = 0;
let playAbort = null;

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
      // Abort previous play to avoid "play() interrupted by pause()" race
      if (playAbort) playAbort();
      audio.pause();
      audio.src = msg.url;
      audio.volume = msg.volume ?? 0.8;
      {
        let cancelled = false;
        playAbort = () => { cancelled = true; };
        audio.play().then(() => {
          if (cancelled) return;
          playAbort = null;
        }).catch(e => {
          if (cancelled) return;
          playAbort = null;
          // Ignore benign Chrome play/pause race
          if (e.message && e.message.includes('interrupted by a call to pause')) return;
          chrome.runtime.sendMessage({
            target: 'background',
            type: 'ERROR',
            error: e.message,
          });
        });
      }
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
