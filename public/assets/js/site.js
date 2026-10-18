/* STRICTLY NYIGOS — interactions */
(function () {
  // year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // billboard-style chart: live filter
  var filter = document.querySelector('.chart-filter');
  if (filter) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.chart-row'));
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      rows.forEach(function (row) {
        row.hidden = q !== '' && row.getAttribute('data-search').indexOf(q) === -1;
      });
    });
  }

  // gallery lightbox
  var gal = document.querySelector('[data-gallery]');
  var box = document.querySelector('.lightbox');
  if (gal && box) {
    var items = JSON.parse(box.querySelector('[data-lightbox-items]').textContent);
    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var i = 0;
    function show(n) {
      i = (n + items.length) % items.length;
      img.src = items[i].src;
      img.alt = items[i].caption;
      cap.textContent = items[i].caption;
    }
    function open(n) { show(n); box.hidden = false; document.body.style.overflow = 'hidden'; }
    function close() { box.hidden = true; document.body.style.overflow = ''; }
    gal.querySelectorAll('.gal-item').forEach(function (fig) {
      fig.addEventListener('click', function () { open(parseInt(fig.getAttribute('data-i'), 10)); });
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(i - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(i + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
  }
})();
