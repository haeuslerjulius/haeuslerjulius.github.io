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
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
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
