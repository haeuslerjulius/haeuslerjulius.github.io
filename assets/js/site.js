// Turnaround: drag (or swipe) across the photo to turn. Frames are
// assets/me/turn/01.jpg ... NN.jpg, count set in _data/me.yml (turn_frames).
(function () {
  var fig = document.querySelector('.turn');
  if (!fig) return;
  var n = parseInt(fig.getAttribute('data-frames'), 10) || 0;
  if (n < 2) return;
  var path = fig.getAttribute('data-path');
  var img = fig.querySelector('.turn-img');
  var readout = fig.querySelector('.turn-readout');
  var frames = [], preload = [];
  for (var i = 1; i <= n; i++) {
    var src = path + (i < 10 ? '0' + i : i) + '.jpg';
    var im = new Image();
    im.src = src;
    frames.push(src);
    preload.push(im);
  }
  var cur = 0;
  function show(k) {
    cur = ((k % n) + n) % n;
    img.src = frames[cur];
    if (readout) readout.textContent = 'frame ' + (cur + 1) + '/' + n + ' · ' + Math.round(cur * 360 / n) + '°';
  }
  show(0);

  // Loops like a GIF. Pauses while someone drags or uses the arrow keys,
  // picks up again 2.5 s later. Stays still if the visitor prefers less motion.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FRAME_MS = 110;
  var auto = null, resumeT = null;
  function play() { if (!reduce && !auto) auto = setInterval(function () { show(cur + 1); }, FRAME_MS); }
  function pause() { clearInterval(auto); auto = null; clearTimeout(resumeT); }
  function resumeLater() { clearTimeout(resumeT); resumeT = setTimeout(play, 2500); }

  // Start looping once every frame is loaded, so it never flickers.
  var loaded = 0;
  preload.forEach(function (im) {
    var done = function () { if (++loaded === n) play(); };
    if (im.complete) done(); else { im.onload = done; im.onerror = done; }
  });

  // Don't burn battery while the photo is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { if (loaded === n && startX === null) play(); } else pause(); });
    }).observe(fig);
  }

  var startX = null, startFrame = 0;
  var pxPerFrame = function () { return Math.max(6, fig.clientWidth / n); };
  fig.addEventListener('pointerdown', function (e) {
    pause();
    startX = e.clientX; startFrame = cur;
    fig.classList.add('dragging');
  });
  window.addEventListener('pointermove', function (e) {
    if (startX === null) return;
    show(startFrame - Math.round((e.clientX - startX) / pxPerFrame()));
  });
  function end() {
    if (startX === null) return;
    startX = null; fig.classList.remove('dragging'); resumeLater();
  }
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  // Keyboard: arrow keys turn too.
  fig.tabIndex = 0;
  fig.setAttribute('aria-label', img.alt + '. Use left and right arrow keys or drag to turn.');
  fig.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { pause(); show(cur - 1); resumeLater(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { pause(); show(cur + 1); resumeLater(); e.preventDefault(); }
  });
})();

// Copy email
document.querySelectorAll('.copy').forEach(function (b) {
  b.addEventListener('click', function () {
    var t = b.getAttribute('data-copy');
    var label = b.textContent; var done = function () { b.textContent = b.getAttribute('data-done') || 'Copied'; setTimeout(function () { b.textContent = label; }, 1600); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(t).then(done, function () { select(b); });
    } else { select(b); }
  });
});
function select(b) {
  var span = b.parentNode.querySelector('.copy-text');
  var r = document.createRange(); r.selectNodeContents(span);
  var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
}

// Vimeo films.
// All players: start in the highest quality (1080p on phones), never below 1080p
// (Vimeo may ignore this on some plans; then the player stays on Auto).
// Players with class "vimeo-auto": start muted when at least half on screen,
// pause when scrolled away, and show a "sound on" button until the viewer unmutes.
// Its label comes from data-sound on the iframe. No autoplay for people who ask
// for reduced motion.
(function () {
  // Films with data-src load only on the screen size in their data-media,
  // so a phone never downloads the desktop film and the other way round.
  document.querySelectorAll('iframe[data-src]').forEach(function (f) {
    var m = f.getAttribute('data-media');
    if (!m || !window.matchMedia || window.matchMedia(m).matches) f.src = f.getAttribute('data-src');
  });
  var all = document.querySelectorAll('iframe[src*="player.vimeo.com"]');
  if (!all.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Desktop and tablet: the highest quality the video has (4K for these films).
  // Phones (under 760 px wide): 1080p, which is all a phone screen shows and
  // avoids stalling on mobile data. Never below 1080p.
  var WIDTH = { '4K': 3840, '2K': 2560, '1080p': 1920 };
  function pickQuality(qs) {
    var have = (qs || []).map(function (q) { return q.id; }).filter(function (id) { return WIDTH[id]; });
    have.sort(function (a, b) { return WIDTH[b] - WIDTH[a]; });
    if (!have.length) return '1080p';
    if (window.innerWidth < 760 && have.indexOf('1080p') > -1) return '1080p';
    return have[0];
  }
  var s = document.createElement('script');
  s.src = 'https://player.vimeo.com/api/player.js';
  s.onload = function () {
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var p = e.target._vp;
        if (!p) return;
        if (e.isIntersecting) { p.play().catch(function () {}); }
        else { p.pause().catch(function () {}); }
      });
    }, { threshold: 0.5 }) : null;

    all.forEach(function (f) {
      var p = new Vimeo.Player(f);
      f._vp = p;
      p.ready().then(function () { return p.getQualities(); })
        .then(function (qs) { return p.setQuality(pickQuality(qs)); })
        .catch(function () { p.setQuality('1080p').catch(function () {}); });
      var btn = f.parentNode.querySelector('.sound-on');
      if (!f.classList.contains('vimeo-auto') || still || !io) { if (btn) btn.remove(); return; }
      io.observe(f);

      var label = f.getAttribute('data-sound');
      if (!btn && !label) return;
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sound-on';
        btn.textContent = label;
        f.parentNode.appendChild(btn);
      }
      label = btn.textContent;
      btn.addEventListener('click', function () {
        p.setMuted(false)
          .then(function () { return p.setVolume(1); })
          .then(function () { return p.play(); })
          .then(function () { btn.remove(); })
          .catch(function () { btn.textContent = f.getAttribute('data-sound-fallback') || label; });
      });
      p.on('volumechange', function (d) {
        if (d && d.volume > 0) {
          p.getMuted().then(function (m) { if (!m) btn.remove(); }).catch(function () {});
        }
      });
    });
  };
  document.head.appendChild(s);
})();
