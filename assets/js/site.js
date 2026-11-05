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
// Speed: the first film loads right away and starts in a quality that starts fast
// (what the screen needs, at most 1080p), then steps up to the best quality after
// 5 s of playing. Films marked data-defer load once the first film plays, when
// they come near the screen, or after 6 s, so they don't slow down the first one.
// Autoplay films (class "vimeo-auto") show a still (poster) until they play,
// start muted when half on screen, pause when scrolled away, and show a
// "sound on" button. No autoplay for people who ask for reduced motion.
(function () {
  document.querySelectorAll('iframe[data-src]:not([data-defer])').forEach(function (f) {
    var m = f.getAttribute('data-media');
    if (!m || !window.matchMedia || window.matchMedia(m).matches) f.src = f.getAttribute('data-src');
  });
  var deferred = [].slice.call(document.querySelectorAll('iframe[data-defer]'));
  if (!document.querySelector('iframe[src*="player.vimeo.com"]') && !deferred.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Quality names describe the short side of the picture.
  var SHORT = { '360p': 360, '540p': 540, '720p': 720, '1080p': 1080, '2K': 1440, '4K': 2160 };
  function ladder(qs) {
    return (qs || []).map(function (q) { return q.id; })
      .filter(function (id) { return SHORT[id]; })
      .sort(function (a, b) { return SHORT[a] - SHORT[b]; });
  }
  function ideal(have, f) {
    var r = f.getBoundingClientRect();
    var need = Math.min(r.width, r.height) * (window.devicePixelRatio || 1);
    for (var i = 0; i < have.length; i++) if (SHORT[have[i]] >= need && SHORT[have[i]] >= 720) return have[i];
    return have[have.length - 1];
  }
  function reveal(f) { var box = f.closest('.is-loading'); if (box) box.classList.remove('is-loading'); }

  var io = null, api = false, queue = [];
  function setup(f) {
    if (!api) { queue.push(f); return; }
    var p = new Vimeo.Player(f);
    f._vp = p;
    setTimeout(function () { reveal(f); }, 5000);
    p.on('playing', function () { reveal(f); loadDeferred(); });
    p.ready().then(function () { return p.getQualities(); }).then(function (qs) {
      var have = ladder(qs);
      if (!have.length) return;
      var best = ideal(have, f);
      var start = SHORT[best] > 1080 && have.indexOf('1080p') > -1 ? '1080p' : best;
      p.setQuality(start).catch(function () {});
      if (start !== best) {
        var up = false;
        p.on('timeupdate', function (d) {
          if (!up && d && d.seconds >= 5) { up = true; p.setQuality(best).catch(function () {}); }
        });
      }
    }).catch(function () {});

    var btn = f.parentNode.querySelector('.sound-on');
    if (!f.classList.contains('vimeo-auto') || still || !io) { if (btn) btn.remove(); reveal(f); return; }
    io.observe(f);
    if (!btn) return;
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      // Only one film with sound at a time: pause the others.
      document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach(function (o) {
        if (o !== f && o._vp) { o._vp.pause().catch(function () {}); }
      });
      p.setMuted(false)
        .then(function () { return p.setVolume(1); })
        .then(function () { return p.play(); })
        .then(function () { btn.remove(); })
        .catch(function () { btn.textContent = f.getAttribute('data-sound-fallback') || label; });
    });
    p.on('volumechange', function (d) {
      if (d && d.volume > 0) p.getMuted().then(function (m) { if (!m) btn.remove(); }).catch(function () {});
    });
  }

  function loadOne(f) {
    if (f.src) return;
    f.src = f.getAttribute('data-src');
    setup(f);
  }
  function loadDeferred() { deferred.forEach(loadOne); deferred = []; }
  if (deferred.length) {
    setTimeout(loadDeferred, 6000);
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { near.unobserve(e.target); loadOne(e.target); } });
      }, { rootMargin: '600px 0px' });
      deferred.forEach(function (f) { near.observe(f); });
    }
  }

  var s = document.createElement('script');
  s.src = 'https://player.vimeo.com/api/player.js';
  s.onload = function () {
    io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var p = e.target._vp;
        if (!p) return;
        if (e.isIntersecting) { p.play().catch(function () {}); }
        else { p.pause().catch(function () {}); }
      });
    }, { threshold: 0.5 }) : null;
    api = true;
    document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach(function (f) { if (!f._vp && queue.indexOf(f) < 0) setup(f); });
    queue.splice(0).forEach(setup);
  };
  s.onerror = function () { document.querySelectorAll('.is-loading').forEach(function (b) { b.classList.remove('is-loading'); }); };
  document.head.appendChild(s);
})();
