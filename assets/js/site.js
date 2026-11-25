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
// Quality: the first film starts in 1080p so it starts fast, and switches to the
// best quality (4K) after 2 s of playing. Films marked data-defer (the phone
// film) load once the first film has buffered a good part in 4K, when they come
// near the screen, or after 8 s, and they play in 4K from the start. If a film
// really stalls (buffering longer than 0.8 s), it steps down one quality
// (4K → 2K → 1080p), never below 1080p.
// Autoplay films (class "vimeo-auto") show a still (poster) until they play,
// start muted when a quarter is on screen, pause when scrolled away, and show a
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
  var FLOOR = 1080, STEP_UP_AT = 2, STALL_MS = 800, GRACE_MS = 3000;
  function ladder(qs) {
    return (qs || []).map(function (q) { return q.id; })
      .filter(function (id) { return SHORT[id]; })
      .sort(function (a, b) { return SHORT[a] - SHORT[b]; });
  }
  // Windows: many PCs decode Vimeo's high qualities (AV1) in software, which
  // makes playback stutter. So on Windows we ask the browser which resolutions
  // its graphics hardware decodes ("powerEfficient") and allow the highest of
  // those: 4K, else 2K, else 1080p. Mac, iPhone and Android play 4K.
  var WIN = /Windows/i.test(navigator.userAgent), CAP = WIN ? 1080 : 2160, capWhy = WIN ? 'Windows default' : 'not Windows';
  var capReady = (function () {
    var mc = navigator.mediaCapabilities;
    if (!WIN || !mc || !mc.decodingInfo) return Promise.resolve(CAP);
    function ask(codec, w, h, rate) {
      return mc.decodingInfo({ type: 'media-source', video: { contentType: 'video/mp4; codecs="' + codec + '"', width: w, height: h, bitrate: rate, framerate: 60 } })
        .catch(function () { return { supported: false }; });
    }
    var AV1 = 'av01.0.13M.08', H264 = 'avc1.640033';
    return ask(AV1, 3840, 2160, 25e6).then(function (av1) {
      // If the browser can play AV1 at all, Vimeo usually sends AV1.
      var codec = av1.supported ? AV1 : H264, name = av1.supported ? 'AV1' : 'H.264';
      return Promise.all([av1.supported ? av1 : ask(H264, 3840, 2160, 25e6), ask(codec, 2560, 1440, 12e6)]).then(function (r) {
        if (r[0].powerEfficient) { CAP = 2160; capWhy = name + ' 4K in hardware'; }
        else if (r[1].powerEfficient) { CAP = 1440; capWhy = name + ' 2K in hardware'; }
        else if (r[1].smooth && (navigator.hardwareConcurrency || 0) >= 8) { CAP = 1440; capWhy = name + ' 2K smooth, 8+ cores'; }
        else { CAP = 1080; capWhy = name + ' software only'; }
        return CAP;
      });
    }).catch(function () { return CAP; });
  })();
  // Add ?videodebug to the address to see which quality each film plays in.
  var dbg = /[?&]videodebug/.test(location.search) ? document.createElement('pre') : null;
  var dbgRows = {};
  function debug(name, text) {
    if (!dbg) return;
    if (!dbg.parentNode) { dbg.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;background:rgba(0,0,0,.8);color:#7CFC00;font:12px/1.4 monospace;border-radius:6px;pointer-events:none'; document.body.appendChild(dbg); }
    dbgRows[name] = text;
    dbg.textContent = 'cap ' + CAP + 'p (' + capWhy + ')\n' + Object.keys(dbgRows).map(function (k) { return k + ': ' + dbgRows[k]; }).join('\n');
  }
  var players = [], soundOn = null;
  function reveal(f) { var box = f.closest('.is-loading'); if (box) box.classList.remove('is-loading'); }

  // Picks the quality, steps up after 2 s (first film only) and steps down on real stalls.
  function tune(p, f, first) {
    var have = [], cur = null, best = null, up = false, playing = false, switchedAt = 0, stallT = null;
    var label = f.hasAttribute('data-defer') ? 'phone film' : 'main film';
    function set(q, why) { if (!q || q === cur) return; cur = q; switchedAt = Date.now(); p.setQuality(q).catch(function () {}); debug(label, q + (why ? ' (' + why + ')' : '')); }
    function lower(q) {
      var i = have.indexOf(q);
      return (i > 0 && SHORT[have[i - 1]] >= FLOOR) ? have[i - 1] : null;
    }
    var picked = Promise.all([p.ready().then(function () { return p.getQualities(); }), capReady]).then(function (r) {
      have = ladder(r[0]);
      if (!have.length) return;
      best = have[have.length - 1];
      while (SHORT[best] > CAP && have.indexOf(best) > 0) best = have[have.indexOf(best) - 1];
      var start = first && SHORT[best] > 1080 && have.indexOf('1080p') > -1 ? '1080p' : best;
      up = start === best;
      if (up && first) setTimeout(loadDeferred, 4000);
      set(start, first && !up ? 'fast start' : 'best');
    }).catch(function () {});
    p.on('playing', function () { playing = true; });
    p.on('timeupdate', function (d) {
      if (!up && best && d && d.seconds >= STEP_UP_AT) {
        up = true; set(best, 'after ' + STEP_UP_AT + ' s');
        // Phone film starts loading 4 s after the first film switched to 4K.
        if (first) setTimeout(loadDeferred, 4000);
      }
    });
    if (first) p.on('progress', function (d) { if (up && d && d.percent >= 0.4) loadDeferred(); });
    p.on('bufferstart', function () {
      if (!playing || Date.now() - switchedAt < GRACE_MS) return;
      clearTimeout(stallT);
      stallT = setTimeout(function () { var q = lower(cur); if (q) { best = q; set(q, 'stalled, stepped down'); } }, STALL_MS);
    });
    p.on('bufferend', function () { clearTimeout(stallT); });
    return picked;
  }

  var io = null, api = false, queue = [], firstDone = false;
  function setup(f) {
    if (!api) { queue.push(f); return; }
    var p = new Vimeo.Player(f);
    f._vp = p;
    players.push(p);
    setTimeout(function () { reveal(f); }, 5000);
    p.on('playing', function () { reveal(f); });
    var first = !firstDone && !f.hasAttribute('data-defer');
    if (first) firstDone = true;
    var picked = tune(p, f, first);
    // Phone film: once 4K is set, start it muted for a moment and pause it again,
    // so it buffers in 4K before it is scrolled to.
    if (f.hasAttribute('data-defer') && !still) {
      picked.then(function () {
        if (isVisible(f)) return;
        var warm = function () { p.off('playing', warm); if (!isVisible(f)) p.pause().catch(function () {}); };
        p.on('playing', warm);
        p.setMuted(true).then(function () { return p.play(); }).catch(function () {});
      }).catch(function () {});
    }

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
        .then(function () { btn.remove(); soloSound(p); })
        .catch(function () { btn.textContent = f.getAttribute('data-sound-fallback') || label; });
    });
    p.on('volumechange', function (d) {
      if (d && d.volume > 0) p.getMuted().then(function (m) { if (!m) { btn.remove(); soloSound(p); } }).catch(function () {});
    });
  }

  // Once a film plays with sound, the other films pause and stop autoplaying,
  // so only one video plays at a time.
  function soloSound(p) {
    soundOn = p;
    players.forEach(function (o) { if (o !== p) o.pause().catch(function () {}); });
  }
  function loadOne(f) {
    if (f.src) return;
    f.src = f.getAttribute('data-src');
    setup(f);
  }
  function isVisible(f) { var r = f.getBoundingClientRect(); return r.bottom > 0 && r.top < (window.innerHeight || 0); }
  function loadDeferred() { deferred.forEach(loadOne); deferred = []; }
  if (deferred.length) {
    setTimeout(loadDeferred, 8000);
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
        if (e.isIntersecting && e.intersectionRatio >= 0.25) { if (!soundOn || soundOn === p) p.play().catch(function () {}); }
        else { p.pause().catch(function () {}); if (soundOn === p) soundOn = null; }
      });
    }, { threshold: [0, 0.25] }) : null;
    api = true;
    document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach(function (f) { if (!f._vp && queue.indexOf(f) < 0) setup(f); });
    queue.splice(0).forEach(setup);
  };
  s.onerror = function () { document.querySelectorAll('.is-loading').forEach(function (b) { b.classList.remove('is-loading'); }); };
  document.head.appendChild(s);
})();
