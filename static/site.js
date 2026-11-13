(function(){
  var root = document.body.getAttribute('data-root') || './';
  var EN = document.documentElement.lang === 'en';
  // Menü auf kleinen Bildschirmen
  var mk = document.querySelector('.menuknopf'), nav = document.getElementById('hauptnav');
  if (mk) mk.addEventListener('click', function(){ var o = nav.classList.toggle('offen'); mk.setAttribute('aria-expanded', o); });
  // Suche
  var box = document.getElementById('suche'), feld = document.getElementById('suchfeld'), liste = document.getElementById('suchtreffer');
  function oeffnen(){ box.hidden = false; feld.focus(); window.scrollTo(0,0); }
  function schliessen(){ box.hidden = true; }
  document.querySelectorAll('.suchknopf').forEach(function(b){ b.addEventListener('click', oeffnen); });
  document.querySelector('.suche-zu').addEventListener('click', schliessen);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') schliessen();
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); oeffnen(); }
  });
  function norm(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function esc(s){ return s.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  feld.addEventListener('input', function(){
    var q = norm(feld.value.trim()); liste.innerHTML = '';
    if (q.length < 2) return;
    var worte = q.split(/\s+/), treffer = [];
    (window.SUCHINDEX || []).forEach(function(s){
      var t = norm(s.t), x = norm(s.x), score = 0, ok = true;
      worte.forEach(function(w){ if (t.indexOf(w) > -1) score += 10; else if (x.indexOf(w) > -1) score += 1; else ok = false; });
      if (ok) treffer.push([score, s]);
    });
    treffer.sort(function(a,b){ return b[0]-a[0]; });
    treffer.slice(0, 25).forEach(function(tr){
      var s = tr[1], i = norm(s.x).indexOf(worte[0]), aus = '';
      if (i > -1) { var a = Math.max(0, i - 60); aus = (a ? '… ' : '') + esc(s.x.substr(a, 160)) + ' …'; }
      var re = new RegExp('(' + worte.map(function(w){ return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|') + ')', 'ig');
      liste.insertAdjacentHTML('beforeend', '<li><a href="' + root + s.u + 'index.html">' + esc(s.t) + (s.b ? ' <small>' + esc(s.b) + '</small>' : '') + '<small>' + aus.replace(re, '<mark>$1</mark>') + '</small></a></li>');
    });
    if (!treffer.length) liste.innerHTML = (EN ? '<li style="padding:10px 14px">Nothing found. Appointments: +49 241 80-88773</li>' : '<li style="padding:10px 14px">Nichts gefunden. Terminvergabe: 0241 80-88773</li>');
  });
  // Feed als Mauerwerk: Beiträge in Spalten verteilen, Reihenfolge bleibt erhalten
  var feed = document.getElementById('feed'), alle = feed ? Array.prototype.slice.call(feed.querySelectorAll('.post')) : [];
  function legen(){
    if (!feed) return;
    var n = window.innerWidth >= 980 ? 3 : (window.innerWidth >= 640 ? 2 : 1), sp = [];
    feed.innerHTML = '';
    for (var i = 0; i < n; i++){ var d = document.createElement('div'); d.className = 'spalte'; feed.appendChild(d); sp.push(d); }
    alle.forEach(function(p){
      if (p.style.display === 'none') return;
      var z = sp.reduce(function(a, b){ return b.offsetHeight < a.offsetHeight ? b : a; });
      z.appendChild(p);
    });
  }
  var lastN = 0;
  window.addEventListener('resize', function(){ var n = window.innerWidth >= 980 ? 3 : (window.innerWidth >= 640 ? 2 : 1); if (n !== lastN){ lastN = n; legen(); } });
  // Feed-Filter
  document.querySelectorAll('.filter button[data-filter]').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.filter button[data-filter]').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
      var f = b.getAttribute('data-filter');
      alle.forEach(function(p){ p.style.display = (f === 'alle' || p.getAttribute('data-k') === f) ? '' : 'none'; });
      legen();
      try { history.replaceState(null, '', f === 'alle' ? location.pathname : '#' + f); } catch(e){}
    });
  });
  legen();
  if (location.hash && document.querySelector('.filter button[data-filter="' + location.hash.slice(1) + '"]')) document.querySelector('.filter button[data-filter="' + location.hash.slice(1) + '"]').click();
  // Krankheitsbild-Finder
  var fe = document.getElementById('finder-eingabe');
  if (fe) {
    var daten = JSON.parse(document.getElementById('finder-daten').textContent), ziel = document.getElementById('finder-treffer');
    fe.addEventListener('input', function(){
      var q = norm(fe.value.trim()); ziel.innerHTML = '';
      if (q.length < 2) return;
      var gesehen = {}, n = 0;
      daten.forEach(function(d){
        if ((norm(d[0]).indexOf(q) > -1 || norm(d[1]).indexOf(q) > -1) && n < 14 && !gesehen[d[0]+d[2]]) {
          gesehen[d[0]+d[2]] = 1; n++;
          ziel.insertAdjacentHTML('beforeend', '<a href="' + root + d[2].replace(/^\//,'') + 'index.html">' + esc(d[0]) + ' → ' + esc(d[1]) + '</a>');
        }
      });
      if (!n) ziel.innerHTML = (EN ? '<span style="color:var(--grau);font-size:14px">No match. Please call our appointment service: +49 241 80-88773</span>' : '<span style="color:var(--grau);font-size:14px">Kein Treffer. Rufen Sie gerne die Terminvergabe an: 0241 80-88773</span>');
    });
  }
})();
(function(){
  var ein = document.getElementById('teamsuche'); if (!ein) return;
  var knoepfe = document.querySelectorAll('.teamfilter button'), zahl = document.querySelector('.teamzahl'), gruppe = 'alle';
  function norm(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function zeigen(){
    var q = norm(ein.value.trim()), n = 0;
    document.querySelectorAll('.teamgruppe').forEach(function(g){
      var sichtbar = 0, passt = gruppe === 'alle' || g.getAttribute('data-gruppe') === gruppe;
      g.querySelectorAll('.tperson').forEach(function(p){
        var ok = passt && (!q || norm(p.getAttribute('data-such')).indexOf(q) > -1);
        p.style.display = ok ? '' : 'none'; if (ok) sichtbar++;
      });
      g.style.display = sichtbar ? '' : 'none'; n += sichtbar;
    });
    var en = document.documentElement.lang === 'en';
    zahl.textContent = n + (en ? (n === 1 ? ' person' : ' people') : (n === 1 ? ' Person' : ' Personen'));
  }
  knoepfe.forEach(function(b){ b.addEventListener('click', function(){
    knoepfe.forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true');
    gruppe = b.getAttribute('data-tf'); zeigen();
  }); });
  ein.addEventListener('input', zeigen); zeigen();
})();
