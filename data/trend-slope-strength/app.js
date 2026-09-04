/* Trend Slope and Strength explorer. Static JSON produced by scripts/build_ts_data.py. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var SPECS = ['full_vw', 'full_ew', 'top500_vw', 'top500_ew'];
  var SPEC_SHORT = { full_vw: 'Full VW', full_ew: 'Full EW', top500_vw: 'Top-500 VW', top500_ew: 'Top-500 EW' };
  var SPEC_LONG = {
    full_vw: 'full universe, value weight', full_ew: 'full universe, equal weight',
    top500_vw: 'top 500, value weight', top500_ew: 'top 500, equal weight'
  };
  /* Categorical palettes validated for CVD separation on the site's paper surface.
     Overlays are dashed so they never read as a TS series even where hues are close. */
  var COLORS = { full_vw: '#b8322e', full_ew: '#2a78d6', top500_ew: '#c98500', top500_vw: '#199e70' };
  var OVERLAY_COLORS = ['#4a3aa7', '#eb6834', '#1baf7a', '#e87ba4', '#2a78d6', '#eda100', '#008300', '#e34948'];
  var INDEX_KEYS = ['sp500_vw', 'sp500_ew', 'nasdaq_vw', 'nasdaq_ew'];
  var INDEX_SHORT = { sp500_vw: 'S&P 500 VW', sp500_ew: 'S&P 500 EW', nasdaq_vw: 'NASDAQ VW', nasdaq_ew: 'NASDAQ EW' };
  var CELL_COLOR = '#1c1917';
  var STATS = {
    alpha: { label: 'FF6 alpha', fmt: function (v) { return pct(v, 1); }, unit: 'annualized %' },
    t: { label: 't-stat', fmt: function (v) { return num(v, 2); }, unit: 'Newey–West, 21 lags' },
    sharpe: { label: 'Sharpe', fmt: function (v) { return num(v, 2); }, unit: 'annualized' },
    ret: { label: 'Ann. return', fmt: function (v) { return pct(v, 1); }, unit: 'annualized %' }
  };
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var manifest = null, summary = null, ts = null, rolling = null;
  var cellCache = {};   // spec -> p/{spec}.json
  var benchCache = {};  // 'ew' | 'vw' -> b/{w}.json ; 'index' -> b/index.json
  var signals = [];     // benchmark signal names, fixed order from the manifest

  var state = {
    spec: 'full_vw',
    shown: { full_vw: true, full_ew: false, top500_vw: false, top500_ew: false },
    stat: 'alpha',
    overlays: [],           // index keys and/or signal names, in selection order
    ow: 'vw',               // weighting for the signal spreads
    cell: null              // 'RQi_SQj' plotted from the heat map, or null
  };
  var selfHash = null;

  /* ---------- helpers ---------- */

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
      return r.json();
    });
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(v, d) {
    var a = Math.abs(v).toFixed(d);
    return (v < 0 && +a !== 0 ? '−' : '') + a;
  }
  function pct(v, d) { return num(v, d) + '%'; }
  function money(v) {
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 100) return '$' + v.toFixed(0);
    if (v >= 10) return '$' + v.toFixed(1);
    if (v >= 0.1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(v >= 0.01 ? 3 : 4);
  }
  function xval(ym) { return +ym.slice(0, 4) + (+ym.slice(5, 7)) / 12; }
  function ymLabel(ym) { return MONTHS_SHORT[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4); }
  function isIndex(key) { return INDEX_KEYS.indexOf(key) >= 0; }
  function isSignal(key) { return signals.indexOf(key) >= 0; }

  /* color and dash follow the entity, never its position in the selection */
  function overlayStyle(key) {
    if (isIndex(key)) {
      return { color: OVERLAY_COLORS[INDEX_KEYS.indexOf(key)], dash: '7 3', width: 1.75 };
    }
    var i = signals.indexOf(key);
    return { color: OVERLAY_COLORS[(i + 4) % OVERLAY_COLORS.length], dash: i < 4 ? '7 3' : '2 3', width: 1.5 };
  }
  function overlayLabel(key) {
    if (isIndex(key)) return manifest.index_benchmarks[key].label;
    return (manifest.signal_labels[key] || key) + ' D10−D1, ' + state.ow.toUpperCase();
  }
  function overlayShort(key) {
    return isIndex(key) ? INDEX_SHORT[key] : key + ' ' + state.ow.toUpperCase();
  }

  /* ---------- hash routing ---------- */

  function writeHash() {
    var parts = ['spec=' + state.spec, 'stat=' + state.stat];
    var shown = SPECS.filter(function (s) { return state.shown[s]; });
    if (shown.length !== 1 || shown[0] !== state.spec) parts.push('show=' + shown.join(','));
    if (state.overlays.length) parts.push('o=' + state.overlays.join(','), 'ow=' + state.ow);
    if (state.cell) parts.push('cell=' + state.cell);
    var h = '#' + parts.join('&');
    selfHash = h;
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + h);
    else location.hash = h;
  }

  function readHash() {
    var h = decodeURIComponent(location.hash || '').replace(/^#/, '');
    if (!h) return;
    var q = {};
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) q[kv.slice(0, i)] = kv.slice(i + 1);
    });
    if (q.spec && SPECS.indexOf(q.spec) >= 0) state.spec = q.spec;
    if (q.stat && STATS[q.stat]) state.stat = q.stat;
    SPECS.forEach(function (s) { state.shown[s] = false; });
    if (q.show) {
      q.show.split(',').forEach(function (s) { if (SPECS.indexOf(s) >= 0) state.shown[s] = true; });
    }
    state.shown[state.spec] = true;
    state.overlays = [];
    if (q.o) {
      q.o.split(',').forEach(function (k) {
        if ((isIndex(k) || isSignal(k)) && state.overlays.indexOf(k) < 0) state.overlays.push(k);
      });
    }
    if (q.ow === 'ew' || q.ow === 'vw') state.ow = q.ow;
    if (q.cell && /^RQ[1-5]_SQ[1-5]$/.test(q.cell)) state.cell = q.cell;
  }

  /* ---------- generic stacked-panel SVG line chart ---------- */

  function logTicks(lo, hi) {
    var t = [], k = Math.floor(Math.log(lo) / Math.LN10) - 1;
    for (; k < 12; k++) {
      var base = Math.pow(10, k);
      if (base > hi) break;
      [1, 2, 5].forEach(function (m) {
        var v = +(m * base).toPrecision(12);
        if (v >= lo && v <= hi) t.push(v);
      });
    }
    if (t.length > 8) {
      t = t.filter(function (v) {
        var m = v / Math.pow(10, Math.floor(Math.log(v) / Math.LN10 + 1e-9));
        return Math.abs(m - 1) < 1e-6 || Math.abs(m - 10) < 1e-6;
      });
    }
    return t;
  }

  function linTicks(lo, hi, target) {
    var range = hi - lo || 1;
    var raw = range / (target || 5);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var step = [1, 2, 5, 10].map(function (m) { return m * mag; }).filter(function (s) { return s >= raw; })[0];
    var t = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) t.push(+v.toPrecision(12));
    return t;
  }

  function yearTicks(x0, x1, width) {
    var every = width < 480 ? 20 : 10;
    var t = [];
    for (var y = Math.ceil(x0 / every) * every; y <= x1; y += every) t.push(y);
    return t;
  }

  function nearestIndex(xs, x) {
    var lo = 0, hi = xs.length - 1;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (xs[mid] < x) lo = mid + 1; else hi = mid;
    }
    if (lo > 0 && Math.abs(xs[lo - 1] - x) < Math.abs(xs[lo] - x)) lo--;
    return lo;
  }

  /*
   * opts.panels: [{ series: [{label, short, color, dates, values, dash, width}],
   *                 log, height, yFmt, title, refLines: [{y, label}], band: [lo, hi] }]
   * Panels share the x axis; one crosshair + tooltip spans all panels.
   */
  function drawChart(el, opts) {
    var width = Math.max(320, el.clientWidth || 640);
    var panels = opts.panels;
    /* y domains and ticks first, so the pads can fit the widest labels */
    var maxLabel = 4, maxShort = 6;
    panels.forEach(function (p) {
      var lo = Infinity, hi = -Infinity;
      p.series.forEach(function (s) {
        s.values.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; });
        maxShort = Math.max(maxShort, (s.short || s.label).length);
      });
      if (p.band) { lo = Math.min(lo, p.band[0]); hi = Math.max(hi, p.band[1]); }
      (p.refLines || []).forEach(function (r) { lo = Math.min(lo, r.y); hi = Math.max(hi, r.y); });
      if (p.log) {
        lo = lo * 0.9; hi = hi * 1.15;
        p.ticks = logTicks(lo, hi);
      } else {
        var padY = (hi - lo) * 0.08 || 1;
        lo -= padY; hi += padY;
        p.ticks = linTicks(lo, hi, p.height > 150 ? 5 : 3);
      }
      p.lo = lo; p.hi = hi;
      p.ticks.forEach(function (v) { maxLabel = Math.max(maxLabel, p.yFmt(v).length); });
    });
    var padL = 14 + maxLabel * 6.5, padR = 12 + maxShort * 6.5, padT = 20, padB = 26, gap = 34;
    var plotW = width - padL - padR;
    var x0 = Infinity, x1 = -Infinity;
    panels.forEach(function (p) {
      p.series.forEach(function (s) {
        s.xs = s.dates.map(xval);
        x0 = Math.min(x0, s.xs[0]); x1 = Math.max(x1, s.xs[s.xs.length - 1]);
      });
    });
    var sx = function (x) { return padL + (x - x0) / (x1 - x0) * plotW; };
    var totalH = padT + padB;
    panels.forEach(function (p, i) { totalH += p.height + (i ? gap : 0); });

    var svg = '<svg class="ts-svg" width="' + width + '" height="' + totalH + '" viewBox="0 0 ' + width + ' ' + totalH +
      '" role="img" aria-label="' + esc(opts.ariaLabel || 'Chart') + '">';
    var top = padT;
    var xt = yearTicks(x0, x1, width);
    panels.forEach(function (p) {
      var lo = p.lo, hi = p.hi, ticks = p.ticks;
      var sy = p.log
        ? function (v) { return top + p.height - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * p.height; }
        : function (v) { return top + p.height - (v - lo) / (hi - lo) * p.height; };
      p.sy = sy; p.top = top; p.bottom = top + p.height;

      if (p.band) {
        svg += '<rect class="ts-band" x="' + padL + '" y="' + sy(p.band[1]) + '" width="' + plotW +
          '" height="' + (sy(p.band[0]) - sy(p.band[1])) + '"/>';
      }
      ticks.forEach(function (v) {
        var y = sy(v);
        svg += '<line class="ts-grid" x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + y + '" y2="' + y + '"/>' +
          '<text class="ts-tick" x="' + (padL - 8) + '" y="' + (y + 3.5) + '" text-anchor="end">' + esc(p.yFmt(v)) + '</text>';
      });
      (p.refLines || []).forEach(function (r) {
        var y = sy(r.y);
        svg += '<line class="ts-ref" x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + y + '" y2="' + y + '"/>';
        if (r.label) svg += '<text class="ts-tick ts-ref-label" x="' + (padL + 4) + '" y="' + (y - 4) + '">' + esc(r.label) + '</text>';
      });
      if (p.title) svg += '<text class="ts-panel-title" x="' + padL + '" y="' + (top - 7) + '">' + esc(p.title) + '</text>';

      p.series.forEach(function (s) {
        var d = '';
        for (var i = 0; i < s.xs.length; i++) {
          d += (i ? 'L' : 'M') + sx(s.xs[i]).toFixed(1) + ' ' + sy(s.values[i]).toFixed(1);
        }
        svg += '<path class="ts-line" d="' + d + '" stroke="' + s.color + '" stroke-width="' + (s.width || 2) + '"' +
          (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + ' fill="none"/>';
      });
      /* direct end labels, nudged apart to avoid collisions */
      var labels = p.series.map(function (s) {
        return { s: s, y: sy(s.values[s.values.length - 1]), text: s.short || s.label };
      }).sort(function (a, b) { return a.y - b.y; });
      for (var li = 1; li < labels.length; li++) {
        if (labels[li].y - labels[li - 1].y < 12) labels[li].y = labels[li - 1].y + 12;
      }
      for (li = labels.length - 1; li > 0; li--) {
        if (labels[li].y > p.bottom + 4) labels[li].y = p.bottom + 4;
        if (labels[li].y - labels[li - 1].y < 12) labels[li - 1].y = labels[li].y - 12;
      }
      labels.forEach(function (l) {
        svg += '<text class="ts-endlabel" x="' + (padL + plotW + 6) + '" y="' + (l.y + 3.5) + '" fill="' + l.s.color + '">' + esc(l.text) + '</text>';
      });
      svg += '<line class="ts-axis" x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + p.bottom + '" y2="' + p.bottom + '"/>';
      top += p.height + gap;
    });
    var axisY = totalH - padB;
    xt.forEach(function (y) {
      var x = sx(y);
      svg += '<text class="ts-tick" x="' + x + '" y="' + (axisY + 16) + '" text-anchor="middle">' + y + '</text>';
    });
    svg += '<g class="ts-hover" hidden><line class="ts-crosshair" y1="' + padT + '" y2="' + axisY + '"/>';
    panels.forEach(function (p, pi) {
      p.series.forEach(function (s, si) {
        svg += '<circle class="ts-dot" r="4" data-p="' + pi + '" data-s="' + si + '" fill="' + s.color + '"/>';
      });
    });
    svg += '</g><rect class="ts-hit" x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + (axisY - padT) + '" fill="transparent"/></svg>' +
      '<div class="ts-tooltip sans" hidden></div>';
    el.innerHTML = svg;

    var svgEl = el.querySelector('svg'), hover = el.querySelector('.ts-hover'), tip = el.querySelector('.ts-tooltip');
    var cross = el.querySelector('.ts-crosshair');
    function move(clientX) {
      var rect = svgEl.getBoundingClientRect();
      var px = clientX - rect.left;
      var x = x0 + (px - padL) / plotW * (x1 - x0);
      if (x < x0 || x > x1) { hide(); return; }
      var rows = [], xr = null, cx = null;
      panels.forEach(function (p, pi) {
        p.series.forEach(function (s, si) {
          var dot = el.querySelector('.ts-dot[data-p="' + pi + '"][data-s="' + si + '"]');
          if (x < s.xs[0] - 1 / 24) { dot.setAttribute('hidden', ''); return; }
          var i = nearestIndex(s.xs, x);
          dot.removeAttribute('hidden');
          dot.setAttribute('cx', sx(s.xs[i])); dot.setAttribute('cy', p.sy(s.values[i]));
          if (cx === null) { cx = sx(s.xs[i]); xr = s.dates[i]; }
          rows.push('<span class="ts-sw" style="background:' + s.color + '"></span>' + esc(s.label) +
            ' <b>' + esc(p.yFmt(s.values[i], true)) + '</b>');
        });
      });
      if (cx === null) { hide(); return; }
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx);
      hover.removeAttribute('hidden');
      tip.innerHTML = '<div class="ts-tip-date">' + ymLabel(xr) + '</div>' + rows.join('<br>');
      tip.removeAttribute('hidden');
      var tw = tip.offsetWidth;
      var left = cx + 12;
      if (left + tw > width - 4) left = cx - tw - 12;
      tip.style.left = left + 'px';
      tip.style.top = (padT + 4) + 'px';
    }
    function hide() { hover.setAttribute('hidden', ''); tip.setAttribute('hidden', ''); }
    svgEl.addEventListener('mousemove', function (ev) { move(ev.clientX); });
    svgEl.addEventListener('mouseleave', hide);
    svgEl.addEventListener('touchstart', function (ev) { move(ev.touches[0].clientX); }, { passive: true });
    svgEl.addEventListener('touchmove', function (ev) { move(ev.touches[0].clientX); }, { passive: true });
  }

  /* table twin: December values (plus the last month) for each series */
  function tableView(el, series, fmt, colLabel) {
    var months = {};
    series.forEach(function (s) {
      s.dates.forEach(function (d, i) {
        if (d.slice(5) === '12' || i === s.dates.length - 1) months[d] = true;
      });
    });
    var keys = Object.keys(months).sort();
    var html = '<table class="rank-table"><thead><tr><th>' + esc(colLabel || 'Month') + '</th>' +
      series.map(function (s) { return '<th class="num">' + esc(s.label) + '</th>'; }).join('') + '</tr></thead><tbody>';
    keys.forEach(function (d) {
      html += '<tr><td>' + d + '</td>' + series.map(function (s) {
        var i = s.dates.indexOf(d);
        return '<td class="num">' + (i < 0 ? '<span class="muted">—</span>' : esc(fmt(s.values[i]))) + '</td>';
      }).join('') + '</tr>';
    });
    el.innerHTML = html + '</tbody></table>';
  }

  /* ---------- cumulative chart ---------- */

  function renderCumulative() {
    var series = [];
    SPECS.forEach(function (s) {
      if (!state.shown[s]) return;
      series.push({ label: 'TS ' + SPEC_SHORT[s], short: SPEC_SHORT[s], color: COLORS[s], dates: ts.dates, values: ts.growth[s], width: s === state.spec ? 2.25 : 1.5 });
    });
    var extra = [];
    state.overlays.forEach(function (key) {
      var st = overlayStyle(key), src;
      if (isIndex(key)) {
        src = benchCache.index && benchCache.index[key];
      } else {
        var b = benchCache[state.ow];
        src = b && { dates: b.dates, growth: b.growth[key] };
      }
      if (!src) return;
      extra.push({ key: key, label: overlayLabel(key), short: overlayShort(key), color: st.color, dash: st.dash, width: st.width, dates: src.dates, values: src.growth });
    });
    if (state.cell) {
      var c = cellCache[state.spec];
      if (c) extra.push({
        key: 'cell', label: state.cell.replace('_', '/') + ' cell, ' + SPEC_SHORT[state.spec] + ' (long-only)',
        short: state.cell.replace('_', '/'), color: CELL_COLOR, dash: '2 3',
        dates: c.dates, values: c.growth[state.cell], width: 1.5
      });
    }
    var all = series.concat(extra);
    if (!all.length) {
      $('cum-chart').innerHTML = '<p class="muted">Select at least one series.</p>';
      $('cum-table').innerHTML = '';
    } else {
      drawChart($('cum-chart'), {
        ariaLabel: 'Growth of one dollar, log scale',
        panels: [{ series: all, log: true, height: 320, yFmt: function (v) { return money(v); } }]
      });
      tableView($('cum-table'), all, money);
    }
    /* legend for overlays and the plotted cell, each removable */
    $('cum-extra').innerHTML = extra.map(function (s) {
      return '<span class="ts-legend-item"><span class="ts-sw ts-sw--dash" style="border-color:' + s.color +
        (s.dash === '2 3' ? ';border-top-style:dotted' : '') + '"></span>' +
        esc(s.label) + ' <button type="button" class="ts-x" data-clear="' + esc(s.key) + '" aria-label="Remove ' + esc(s.label) + '">×</button></span>';
    }).join('');
  }

  /* ---------- heat map: R² quintiles across, slope quintiles down (SQ5 on top) ---------- */

  function mix(hex, t) {
    /* blend paper -> hex by t in [0,1] (t capped so ink stays legible) */
    var paper = [0xf0, 0xef, 0xec];
    var c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    t = Math.min(1, Math.max(0, t)) * 0.82;
    return 'rgb(' + c.map(function (v, i) { return Math.round(paper[i] + (v - paper[i]) * t); }).join(',') + ')';
  }

  function cellKey(rq, sq) { return 'RQ' + rq + '_SQ' + sq; }

  function renderHeat() {
    var st = STATS[state.stat];
    var maxAbs = 0, rq, sq;
    for (rq = 1; rq <= 5; rq++) for (sq = 1; sq <= 5; sq++) {
      maxAbs = Math.max(maxAbs, Math.abs(summary[cellKey(rq, sq) + '_' + state.spec][state.stat]));
    }
    var html = '<table class="heat-table" aria-label="5 by 5 double-sort grid, ' + esc(st.label) + '"><thead><tr><th class="heat-corner">' +
      '<span class="heat-axis">slope ↑ &nbsp; R² →</span></th>';
    for (rq = 1; rq <= 5; rq++) {
      html += '<th scope="col">RQ' + rq + (rq === 1 ? '<span class="heat-sub">noisiest</span>' : rq === 5 ? '<span class="heat-sub">smoothest</span>' : '') + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (sq = 5; sq >= 1; sq--) {
      html += '<tr><th scope="row">SQ' + sq + (sq === 1 ? '<span class="heat-sub">steepest down</span>' : sq === 5 ? '<span class="heat-sub">steepest up</span>' : '') + '</th>';
      for (rq = 1; rq <= 5; rq++) {
        var key = cellKey(rq, sq);
        var v = summary[key + '_' + state.spec][state.stat];
        var bg = mix(v >= 0 ? '#2a78d6' : '#e34948', maxAbs ? Math.abs(v) / maxAbs : 0);
        var role = key === 'RQ5_SQ5' ? ' heat-long' : key === 'RQ1_SQ1' ? ' heat-short' : '';
        var sel = key === state.cell ? ' heat-selected' : '';
        html += '<td class="heat-cell' + role + sel + '" data-cell="' + key + '" style="background:' + bg + '" tabindex="0" role="button" ' +
          'aria-label="' + key.replace('_', ' ') + ': ' + esc(st.fmt(v)) + '">' + esc(st.fmt(v)) +
          (role ? '<span class="heat-role">' + (key === 'RQ5_SQ5' ? 'long' : 'short') + '</span>' : '') + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    $('heat-wrap').innerHTML = html;

    var tsRow = summary['ts_' + state.spec];
    $('heat-spread').innerHTML = '<strong>TS spread</strong> (RQ5/SQ5 − RQ1/SQ1, ' + SPEC_LONG[state.spec] + '): ' +
      st.label + ' <b>' + esc(st.fmt(tsRow[state.stat])) + '</b>' +
      (state.stat === 'alpha' ? ' <span class="muted">(t = ' + esc(num(tsRow.t, 2)) + ')</span>' : '') +
      ' <span class="muted">&middot; ' + st.unit + '</span>';
    heatDetail(state.cell || 'RQ5_SQ5');

    $('heat-wrap').querySelectorAll('.heat-cell').forEach(function (td) {
      td.addEventListener('mouseenter', function () { heatDetail(td.dataset.cell); });
      td.addEventListener('focus', function () { heatDetail(td.dataset.cell); });
      td.addEventListener('mouseleave', function () { heatDetail(state.cell || 'RQ5_SQ5'); });
      var act = function () {
        state.cell = state.cell === td.dataset.cell ? null : td.dataset.cell;
        writeHash();
        renderHeat();
        loadCells().then(renderCumulative);
      };
      td.addEventListener('click', act);
      td.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
    });
  }

  function heatDetail(key) {
    var r = summary[key + '_' + state.spec];
    $('heat-detail').innerHTML = '<span class="tick">' + key.replace('_', '/') + '</span> &middot; ' + SPEC_LONG[state.spec] +
      ': return ' + pct(r.ret, 1) + ', vol ' + pct(r.vol, 1) + ', Sharpe ' + num(r.sharpe, 2) +
      ', FF6 alpha ' + pct(r.alpha, 1) + ' (t = ' + num(r.t, 2) + '), max drawdown ' + pct(r.mdd, 1) +
      '. <span class="muted">' + (state.cell === key ? 'Plotted above; click to remove.' : 'Click to plot its growth of $1 above.') + '</span>';
  }

  /* ---------- rolling alpha ---------- */

  function renderRolling() {
    var r = rolling[state.spec];
    var alpha = { label: 'FF6 alpha, trailing 60m', short: 'alpha', color: COLORS[state.spec], dates: rolling.dates, values: r.alpha };
    var tstat = { label: 't-stat', short: 't', color: COLORS[state.spec], dates: rolling.dates, values: r.t, width: 1.5 };
    drawChart($('roll-chart'), {
      ariaLabel: 'Rolling 60-month FF6 alpha and t-statistic',
      panels: [
        { title: 'FF6 alpha, annualized %', series: [alpha], height: 200, refLines: [{ y: 0 }], yFmt: function (v, tip) { return tip ? pct(v, 1) : num(v, 0) + '%'; } },
        { title: 't-statistic (band: |t| < 1.96)', series: [tstat], height: 110, refLines: [{ y: 0 }], band: [-1.96, 1.96], yFmt: function (v, tip) { return num(v, tip ? 2 : 0); } }
      ]
    });
    tableView($('roll-table'), [alpha, tstat], function (v) { return num(v, 2); }, 'Window end');
    var n = r.t.filter(function (v) { return v > 1.96; }).length;
    $('roll-note').innerHTML = 'TS ' + SPEC_SHORT[state.spec] + ': trailing 60-month window at each month-end, ' +
      rolling.dates[0] + ' to ' + rolling.dates[rolling.dates.length - 1] + '. t &gt; 1.96 in ' + n + ' of ' + r.t.length +
      ' windows (' + Math.round(100 * n / r.t.length) + '%).';
  }

  /* ---------- summary table ---------- */

  function renderSummary() {
    var cols = [
      { key: 'ts_' + state.spec, label: 'TS spread' },
      { key: 'RQ5_SQ5_' + state.spec, label: 'RQ5/SQ5 (long leg)' },
      { key: 'RQ1_SQ1_' + state.spec, label: 'RQ1/SQ1 (short leg)' }
    ];
    var rows = [
      ['Annualized return', function (r) { return pct(r.ret, 1); }],
      ['Annualized volatility', function (r) { return pct(r.vol, 1); }],
      ['Sharpe ratio', function (r) { return num(r.sharpe, 2); }],
      ['Max drawdown', function (r) { return pct(r.mdd, 1); }],
      ['FF6 alpha (annualized)', function (r) { return pct(r.alpha, 1); }],
      ['t-stat of alpha', function (r) { return num(r.t, 2); }],
      ['FF6 momentum beta', function (r) { return num(r.mom_beta, 2); }],
      ['FF6 R²', function (r) { return num(r.r2, 2); }],
      ['Sample span', function (r) { return r.start.slice(0, 7) + ' → ' + r.end.slice(0, 7); }],
      ['Trading days', function (r) { return r.n_days.toLocaleString('en-US'); }]
    ];
    var html = '<table class="rank-table"><thead><tr><th>' + SPEC_LONG[state.spec] + '</th>' +
      cols.map(function (c) { return '<th class="num">' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (row) {
      html += '<tr><td>' + row[0] + '</td>' + cols.map(function (c) {
        return '<td class="num nowrap">' + esc(row[1](summary[c.key])) + '</td>';
      }).join('') + '</tr>';
    });
    $('summary-wrap').innerHTML = html + '</tbody></table>';

    var chk = manifest.checks['ts_' + state.spec], r = summary['ts_' + state.spec];
    var ok = chk && Math.abs(+r.ret.toFixed(1) - chk.ret) < 1e-9 && Math.abs(+r.sharpe.toFixed(2) - chk.sharpe) < 1e-9 &&
      Math.abs(+r.alpha.toFixed(1) - chk.alpha) < 1e-9 && Math.abs(+r.t.toFixed(2) - chk.t) < 1e-9;
    $('summary-check').innerHTML = ok
      ? 'Matches the paper’s headline numbers for this specification: return ' + pct(chk.ret, 1) + ', Sharpe ' + num(chk.sharpe, 2) +
        ', FF6 alpha ' + pct(chk.alpha, 1) + ' (t = ' + num(chk.t, 2) + ').'
      : 'Headline check not available for this specification.';
  }

  /* ---------- loading ---------- */

  function loadCells() {
    if (!state.cell) return Promise.resolve();
    var spec = state.spec;
    if (cellCache[spec]) return Promise.resolve();
    return getJSON('p/' + spec + '.json').then(function (o) { cellCache[spec] = o; });
  }
  function loadOverlays() {
    var need = [];
    if (state.overlays.some(isIndex) && !benchCache.index) need.push('index');
    if (state.overlays.some(isSignal) && !benchCache[state.ow]) need.push(state.ow);
    return Promise.all(need.map(function (k) {
      return getJSON('b/' + k + '.json').then(function (o) { benchCache[k] = o; });
    }));
  }

  function renderAll() {
    syncControls();
    writeHash();
    renderHeat();
    renderRolling();
    renderSummary();
    Promise.all([loadCells(), loadOverlays()]).then(renderCumulative).catch(function (e) {
      $('cum-chart').innerHTML = '<p class="muted">Failed to load: ' + esc(e.message) + '</p>';
    });
  }

  function syncControls() {
    document.querySelectorAll('input[name=spec]').forEach(function (r) { r.checked = r.value === state.spec; });
    document.querySelectorAll('input[name=show]').forEach(function (c) { c.checked = !!state.shown[c.value]; });
    document.querySelectorAll('input[name=stat]').forEach(function (r) { r.checked = r.value === state.stat; });
    document.querySelectorAll('input[name=overlay]').forEach(function (c) { c.checked = state.overlays.indexOf(c.value) >= 0; });
    document.querySelectorAll('input[name=ow]').forEach(function (r) { r.checked = r.value === state.ow; });
  }

  function buildOverlayPicker() {
    var sw = function (key) {
      var st = overlayStyle(key);
      return '<span class="ts-sw ts-sw--dash" style="border-color:' + st.color + (st.dash === '2 3' ? ';border-top-style:dotted' : '') + '"></span> ';
    };
    $('overlay-index').innerHTML = INDEX_KEYS.map(function (k) {
      return '<label><input type="checkbox" name="overlay" value="' + k + '"> ' + sw(k) + esc(INDEX_SHORT[k]) + '</label>';
    }).join('');
    $('overlay-signals').innerHTML = signals.map(function (k) {
      return '<label><input type="checkbox" name="overlay" value="' + k + '"> ' + sw(k) + esc(manifest.signal_labels[k] || k) + '</label>';
    }).join('');
  }

  function setOverlay(key, on) {
    var i = state.overlays.indexOf(key);
    if (on && i < 0) state.overlays.push(key);
    if (!on && i >= 0) state.overlays.splice(i, 1);
  }

  function init() {
    Promise.all([getJSON('manifest.json'), getJSON('summary.json'), getJSON('ts.json'), getJSON('rolling.json')])
      .then(function (res) {
        manifest = res[0]; summary = res[1]; ts = res[2]; rolling = res[3];
        signals = manifest.benchmarks.vw.signals;
        buildOverlayPicker();
        readHash();

        document.querySelectorAll('input[name=spec]').forEach(function (r) {
          r.addEventListener('change', function () {
            state.spec = this.value; state.shown[state.spec] = true;
            renderAll();
          });
        });
        document.querySelectorAll('input[name=show]').forEach(function (c) {
          c.addEventListener('change', function () { state.shown[this.value] = this.checked; writeHash(); renderCumulative(); });
        });
        document.querySelectorAll('input[name=stat]').forEach(function (r) {
          r.addEventListener('change', function () { state.stat = this.value; writeHash(); renderHeat(); });
        });
        document.querySelectorAll('input[name=overlay]').forEach(function (c) {
          c.addEventListener('change', function () {
            setOverlay(this.value, this.checked); writeHash();
            loadOverlays().then(renderCumulative);
          });
        });
        document.querySelectorAll('input[name=ow]').forEach(function (r) {
          r.addEventListener('change', function () {
            state.ow = this.value; writeHash();
            loadOverlays().then(renderCumulative);
          });
        });
        $('cum-extra').addEventListener('click', function (ev) {
          var b = ev.target.closest('button[data-clear]');
          if (!b) return;
          if (b.dataset.clear === 'cell') state.cell = null; else setOverlay(b.dataset.clear, false);
          syncControls(); writeHash(); renderHeat(); renderCumulative();
        });
        var resizeTimer = null;
        window.addEventListener('resize', function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () { renderCumulative(); renderRolling(); }, 150);
        });
        window.addEventListener('hashchange', function () {
          if (location.hash === selfHash) return;
          readHash(); renderAll();
        });
        renderAll();
      })
      .catch(function (e) {
        $('cum-chart').innerHTML = '<p class="muted">Failed to load data: ' + esc(e.message) + '</p>';
      });
  }

  init();
})();
