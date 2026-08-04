/* Meme-stock lists explorer. Static JSON produced by scripts/build_meme_stock_data.py. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'];

  var manifest = null;          // manifest.json
  var byKey = {};               // dataset key -> dataset object (with id)
  var idxCache = {};            // key -> periods array
  var chunkCache = {};          // key/year -> chunk object
  var shardCache = {};          // shard id -> shard object
  var searchIndex = null;       // search.json (lazy)

  var state = { family: 'Mmax', label: 'state', cadence: 'monthly', period: null };
  var selfHash = null;

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
      return r.json();
    });
  }

  function dsKey() { return state.family + '_' + state.label + '_' + state.cadence; }

  function getPeriods(key) {
    if (idxCache[key]) return Promise.resolve(idxCache[key]);
    return getJSON('idx/' + key + '.json').then(function (o) {
      idxCache[key] = o.periods;
      return o.periods;
    });
  }

  function getChunk(key, year) {
    var ck = key + '/' + year;
    if (chunkCache[ck]) return Promise.resolve(chunkCache[ck]);
    return getJSON('d/' + key + '/' + year + '.json').then(function (o) {
      chunkCache[ck] = o;
      return o;
    });
  }

  function dateInt(period) {
    return period.length === 6 ? +period * 100 + 28 : +period.replace(/-/g, '');
  }

  function periodLabel(period) {
    if (period.length === 6) {
      return MONTHS[+period.slice(4) - 1] + ' ' + period.slice(0, 4);
    }
    return 'Week ending ' + MONTHS_SHORT[+period.slice(5, 7) - 1] + ' ' +
      (+period.slice(8)) + ', ' + period.slice(0, 4);
  }

  function shortLabel(period) {
    if (period.length === 6) return MONTHS[+period.slice(4) - 1];
    return MONTHS_SHORT[+period.slice(5, 7) - 1] + ' ' + (+period.slice(8));
  }

  function fmtInt(n) { return (+n).toLocaleString('en-US'); }

  function fmtPeriod(p) {
    return p.length === 6 ? p.slice(0, 4) + '-' + p.slice(4) : p;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- hash routing ---------- */

  function browseHash() {
    return '#b/' + state.family + '/' + state.label + '/' + state.cadence +
      (state.period ? '/' + state.period : '');
  }

  function setHash(h, replace) {
    selfHash = h;
    if (replace && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search + h);
    } else {
      location.hash = h;
    }
  }

  function parseHash() {
    var h = decodeURIComponent(location.hash || '');
    var m = h.match(/^#b\/(\w+)\/(state|entry)\/(monthly|weekly)(?:\/([\d-]+))?/);
    if (m && byKey[m[1] + '_' + m[2] + '_' + m[3]]) {
      state.family = m[1]; state.label = m[2]; state.cadence = m[3];
      state.period = m[4] || null;
      return { view: 'browse' };
    }
    m = h.match(/^#s\/(\d+)/);
    if (m) return { view: 'stock', permno: +m[1] };
    return { view: 'browse' };
  }

  /* ---------- browse view ---------- */

  function syncControls(periods) {
    $('family').value = state.family;
    var radios = document.querySelectorAll('input[name=label]');
    radios.forEach(function (r) { r.checked = r.value === state.label; });
    document.querySelectorAll('input[name=cadence]').forEach(function (r) {
      r.checked = r.value === state.cadence;
    });

    var years = [];
    periods.forEach(function (p) {
      var y = p.slice(0, 4);
      if (years[years.length - 1] !== y) years.push(y);
    });
    var curYear = state.period.slice(0, 4);
    $('year').innerHTML = years.map(function (y) {
      return '<option value="' + y + '"' + (y === curYear ? ' selected' : '') + '>' + y + '</option>';
    }).join('');

    var inYear = periods.filter(function (p) { return p.slice(0, 4) === curYear; });
    $('period').innerHTML = inYear.map(function (p) {
      return '<option value="' + p + '"' + (p === state.period ? ' selected' : '') + '>' +
        shortLabel(p) + '</option>';
    }).join('');

    var i = periods.indexOf(state.period);
    var slider = $('slider');
    slider.max = periods.length - 1;
    slider.value = i;
    $('prev').disabled = i <= 0;
    $('next').disabled = i >= periods.length - 1;
  }

  function renderBrowse() {
    var key = dsKey();
    var ds = byKey[key];
    getPeriods(key).then(function (periods) {
      if (!state.period || periods.indexOf(state.period) < 0) {
        // keep chronological place when switching datasets, else latest
        if (state.period) {
          var d = dateInt(state.period), best = periods[periods.length - 1];
          for (var i = periods.length - 1; i >= 0; i--) {
            if (dateInt(periods[i]) <= d) { best = periods[i]; break; }
            best = periods[i];
          }
          state.period = best;
        } else {
          state.period = periods[periods.length - 1];
        }
      }
      syncControls(periods);
      setHash(browseHash(), true);
      return getChunk(key, state.period.slice(0, 4));
    }).then(function (chunk) {
      var per = chunk[state.period];
      var year = +state.period.slice(0, 4);

      var meta = '<strong>' + periodLabel(state.period) + '</strong>' +
        ' &middot; universe: ' + fmtInt(per.n) + ' stocks';
      if (per.tier) meta += ' &middot; source: <span class="tier-badge">' + esc(per.tier) + '</span>';
      meta += ' &middot; <a href="../../meme_stocks_website_lists/' + ds.csv + '" download>Download CSV</a>' +
        ' <span class="muted">(' + (ds.csv_bytes / 1048576).toFixed(1) + ' MB, full series)</span>';
      $('meta').innerHTML = meta;

      var notes = [];
      if (year < 1950) {
        notes.push('1926&ndash;1949 lists carry the largest concept-transfer stretch ' +
          '(2020s meme behavior mapped onto a pre-options, pre-retail-broker market): suggestive, not a headline claim.');
      }
      if (year < 1962) {
        notes.push('Pre-1962 universe is NYSE-only, so the cross-section is small (' +
          fmtInt(per.n) + ' stocks scored this period).');
      }
      $('notice').innerHTML = notes.length
        ? '<div class="data-notice">' + notes.join('<br>') + '</div>' : '';

      var html = '<table class="rank-table"><thead><tr>' +
        '<th class="num">Rank</th><th>Ticker</th><th>Company</th>' +
        '<th class="num">PERMNO</th><th class="num">Score</th><th class="num">Pctile</th>' +
        '</tr></thead><tbody>';
      per.rows.forEach(function (r) {
        html += '<tr><td class="num">' + r[0] + '</td>' +
          '<td class="tick">' + (r[1] ? esc(r[1]) : '<span class="muted">&mdash;</span>') + '</td>' +
          '<td><a href="#s/' + r[3] + '">' + esc(r[2]) + '</a></td>' +
          '<td class="num">' + r[3] + '</td>' +
          '<td class="num">' + r[4].toFixed(2) + '</td>' +
          '<td class="num">' + r[5].toFixed(4) + '</td></tr>';
      });
      html += '</tbody></table>';
      $('table-wrap').innerHTML = html;
    }).catch(function (e) {
      $('table-wrap').innerHTML = '<p class="muted">Failed to load data: ' + esc(e.message) + '</p>';
    });
  }

  function step(delta) {
    var periods = idxCache[dsKey()];
    var i = periods.indexOf(state.period) + delta;
    if (i < 0 || i >= periods.length) return;
    state.period = periods[i];
    renderBrowse();
  }

  /* ---------- stock lookup ---------- */

  function loadSearch() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return getJSON('search.json').then(function (s) { searchIndex = s; return s; });
  }

  function runSearch(q) {
    q = q.trim().toUpperCase();
    var box = $('search-results');
    if (q.length < 1) { box.innerHTML = ''; box.hidden = true; return; }
    loadSearch().then(function (idx) {
      var exact = [], prefix = [], name = [];
      for (var i = 0; i < idx.length; i++) {
        var e = idx[i]; // [permno, "T1 T2", [names]]
        var ticks = e[1] ? e[1].split(' ') : [];
        if (ticks.indexOf(q) >= 0) exact.push(e);
        else if (ticks.some(function (t) { return t.indexOf(q) === 0; })) prefix.push(e);
        else if (e[2].some(function (n) { return n.toUpperCase().indexOf(q) >= 0; })) name.push(e);
      }
      var hits = exact.concat(prefix, name).slice(0, 20);
      if (!hits.length) {
        box.innerHTML = '<li class="muted">No matches</li>'; box.hidden = false; return;
      }
      box.innerHTML = hits.map(function (e) {
        var latest = e[2][e[2].length - 1] || '';
        return '<li><a href="#s/' + e[0] + '"><span class="tick">' +
          (e[1] ? esc(e[1].split(' ').join(', ')) : '&mdash;') + '</span> ' +
          esc(latest) + ' <span class="muted">permno ' + e[0] + '</span></a></li>';
      }).join('');
      box.hidden = false;
    });
  }

  function asOf(timeline, d) {
    var cur = timeline[0];
    for (var i = 0; i < timeline.length; i++) {
      if (timeline[i][0] <= d) cur = timeline[i]; else break;
    }
    return cur;
  }

  function renderStock(permno) {
    $('search-results').hidden = true;
    var view = $('stock-view');
    view.hidden = false;
    view.innerHTML = '<p class="muted">Loading&hellip;</p>';
    var shard = permno % manifest.n_shards;
    var p = shardCache[shard]
      ? Promise.resolve(shardCache[shard])
      : getJSON('p/' + shard + '.json').then(function (s) { shardCache[shard] = s; return s; });
    p.then(function (s) {
      var e = s[String(permno)];
      if (!e) { view.innerHTML = '<p class="muted">No appearances for permno ' + permno + '.</p>'; return; }
      var latest = e.n[e.n.length - 1];
      var tickers = [];
      e.n.forEach(function (t) { if (t[1] && tickers.indexOf(t[1]) < 0) tickers.push(t[1]); });

      var groups = {};
      e.a.forEach(function (a) { (groups[a[0]] = groups[a[0]] || []).push(a); });

      var html = '<h3 class="stock-title">' + esc(latest[2]) +
        (tickers.length ? ' <span class="tick">(' + esc(tickers.join(', ')) + ')</span>' : '') +
        ' <span class="muted sans">permno ' + permno + '</span></h3>' +
        '<p class="stock-note muted">' + fmtInt(e.a.length) + ' top-25 appearances across all lists. ' +
        'Identity is joined on PERMNO; ticker and company are shown as of each date ' +
        '(tickers are reused across history).</p>';

      manifest.datasets.forEach(function (ds, dsId) {
        var g = groups[dsId];
        if (!g) return;
        html += '<details class="stock-group" data-ds="' + dsId + '">' +
          '<summary><strong>' + ds.family + '</strong> &middot; ' + ds.label +
          ' &middot; ' + ds.cadence + ' <span class="muted">&mdash; ' + fmtInt(g.length) +
          ' appearance' + (g.length === 1 ? '' : 's') + ', ' + fmtPeriod(g[0][1]) +
          ' &rarr; ' + fmtPeriod(g[g.length - 1][1]) +
          '</span></summary><div class="stock-group-body"></div></details>';
      });
      view.innerHTML = html;

      view.querySelectorAll('details.stock-group').forEach(function (det) {
        det.addEventListener('toggle', function () {
          var body = det.querySelector('.stock-group-body');
          if (!det.open || body.dataset.done) return;
          body.dataset.done = '1';
          var dsId = +det.dataset.ds;
          var ds = manifest.datasets[dsId];
          var rows = groups[dsId].map(function (a) {
            var id = asOf(e.n, dateInt(a[1]));
            return '<tr><td><a href="#b/' + ds.family + '/' + ds.label + '/' + ds.cadence +
              '/' + a[1] + '">' + fmtPeriod(a[1]) + '</a></td>' +
              '<td class="num">' + a[2] + '</td><td class="num">' + a[3].toFixed(4) + '</td>' +
              '<td class="tick">' + (id[1] ? esc(id[1]) : '<span class="muted">&mdash;</span>') + '</td>' +
              '<td>' + esc(id[2]) + '</td></tr>';
          }).join('');
          body.innerHTML = '<div class="table-scroll"><table class="rank-table">' +
            '<thead><tr><th>Period</th><th class="num">Rank</th><th class="num">Pctile</th>' +
            '<th>Ticker</th><th>Company</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
        });
      });
      var first = view.querySelector('details.stock-group');
      if (first) first.open = true;
      view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (err) {
      view.innerHTML = '<p class="muted">Failed to load: ' + esc(err.message) + '</p>';
    });
  }

  /* ---------- wiring ---------- */

  function route() {
    var r = parseHash();
    if (r.view === 'stock') {
      renderStock(r.permno);
    } else {
      renderBrowse();
    }
  }

  function init() {
    getJSON('manifest.json').then(function (m) {
      manifest = m;
      m.datasets.forEach(function (ds, i) { ds.id = i; byKey[ds.key] = ds; });

      var fams = [];
      m.datasets.forEach(function (ds) { if (fams.indexOf(ds.family) < 0) fams.push(ds.family); });
      $('family').innerHTML = fams.map(function (f) {
        var ds = byKey[f + '_state_monthly'];
        var span = (f === 'Mmax' ? 'composite, ' : '') +
          ds.first.slice(0, 4) + '–' + ds.last.slice(0, 4);
        return '<option value="' + f + '">' + f + ' (' + span + ')</option>';
      }).join('');

      $('family').addEventListener('change', function () {
        state.family = this.value; renderBrowse();
      });
      document.querySelectorAll('input[name=label]').forEach(function (r) {
        r.addEventListener('change', function () { state.label = this.value; renderBrowse(); });
      });
      document.querySelectorAll('input[name=cadence]').forEach(function (r) {
        r.addEventListener('change', function () { state.cadence = this.value; renderBrowse(); });
      });
      $('year').addEventListener('change', function () {
        var y = this.value;
        var periods = idxCache[dsKey()].filter(function (p) { return p.slice(0, 4) === y; });
        state.period = periods[periods.length - 1];
        renderBrowse();
      });
      $('period').addEventListener('change', function () {
        state.period = this.value; renderBrowse();
      });
      $('prev').addEventListener('click', function () { step(-1); });
      $('next').addEventListener('click', function () { step(1); });
      var sliderTimer = null;
      $('slider').addEventListener('input', function () {
        var periods = idxCache[dsKey()];
        state.period = periods[+this.value];
        clearTimeout(sliderTimer);
        sliderTimer = setTimeout(renderBrowse, 120);
      });

      var searchTimer = null;
      var input = $('search');
      input.addEventListener('focus', loadSearch);
      input.addEventListener('input', function () {
        clearTimeout(searchTimer);
        var v = this.value;
        searchTimer = setTimeout(function () { runSearch(v); }, 120);
      });
      document.addEventListener('click', function (ev) {
        if (!$('search-wrap').contains(ev.target)) $('search-results').hidden = true;
      });

      window.addEventListener('hashchange', function () {
        if (location.hash === selfHash) return;
        route();
      });
      route();
    }).catch(function (e) {
      $('table-wrap').innerHTML = '<p class="muted">Failed to load manifest: ' + esc(e.message) + '</p>';
    });
  }

  init();
})();
