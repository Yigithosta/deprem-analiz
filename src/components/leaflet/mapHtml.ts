import { C, alpha, hazardColor, hazardLabel } from "../../theme/tokens";
import {
  GIS_AI_ZONES,
  GIS_CORRIDORS,
  GIS_FAULTS,
  GIS_HEAT,
  GIS_HOSPITALS,
  GIS_PORTS,
  GIS_SAFE_NODES,
  GIS_SEISMIC_RISK,
  GIS_WAREHOUSES,
  MAP_BOUNDS,
  MAP_FOCUS,
} from "../../data/mock";

/**
 * Leaflet (BSD-2, github.com/Leaflet/Leaflet) tabanlı OSM harita belgesi.
 * DSN-002 "OSM Servisi" gereksiniminin gerçeklemesi: karolar OpenStreetMap
 * verisinden üretilen CARTO Dark Matter setinden gelir, operasyonel katmanlar
 * (PF-DAT06 / PF-GET03) bunun üzerine vektör olarak bindirilir.
 *
 * Belge hem web'de <iframe srcDoc>, hem de iOS/Android'de react-native-webview
 * içinde aynı biçimde çalışır; katman aç/kapa mesajla iletilir, böylece kullanıcı
 * kaydırma/yakınlaştırma durumu korunur.
 */

const LEAFLET_VERSION = "1.9.4";

/** OSM türevi koyu karo seti — attribution OSM/ODbL lisansı gereği zorunludur. */
const TILES = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19,
};

const riskCol = (risk: string) =>
  risk === "critical" ? C.critical : risk === "high" ? C.warning : risk === "medium" ? "#F97316" : C.success;

const dashFor = (status: string) =>
  status === "risky" ? "6,5" : status === "constrained" ? "10,6" : undefined;

/**
 * Önem derecesi sıralaması — 2 kritik, 1 yüksek, 0 normal.
 * İstihbarat panelindeki "Önem Filtresi" bu sıraya göre eleme yapar; eşiğin
 * altında kalan nesneler katman açık olsa bile haritaya eklenmez.
 */
const RANK = { critical: 2, high: 1, normal: 0 };

const hospitalRank = (risk: string) => (risk === "critical" ? RANK.critical : risk === "high" ? RANK.high : RANK.normal);
const nodeRank = (days: number) => (days <= 3 ? RANK.critical : days <= 7 ? RANK.high : RANK.normal);
const corridorRank = (status: string) =>
  status === "risky" ? RANK.critical : status === "constrained" ? RANK.high : RANK.normal;

/** WebView/iframe'e gömülecek veri — enlem/boylam ve sunum nitelikleri birlikte. */
function payload() {
  return {
    bounds: MAP_BOUNDS,
    focus: MAP_FOCUS,
    hospitals: GIS_HOSPITALS.map((h) => ({ ...h, col: riskCol(h.risk), rank: hospitalRank(h.risk) })),
    safeNodes: GIS_SAFE_NODES.map((n) => ({
      ...n,
      col: n.days <= 3 ? C.danger : n.days <= 7 ? C.warning : C.gis,
      stock: Math.min(n.water, n.food, n.tents),
      rank: nodeRank(n.days),
    })),
    warehouses: GIS_WAREHOUSES,
    ports: GIS_PORTS,
    corridors: GIS_CORRIDORS.map((c) => ({
      id: c.id,
      label: c.label,
      coords: c.coords,
      color: c.color,
      status: c.status,
      load: c.load,
      risk: c.risk,
      international: c.international,
      dash: dashFor(c.status) ?? null,
      rank: corridorRank(c.status),
    })),
    heat: GIS_HEAT,
    seismic: GIS_SEISMIC_RISK.map((s) => ({
      ...s,
      color: hazardColor(s.score),
      level: hazardLabel(s.score),
      // Skor arttıkça çekirdek opaklığı artar; düşük riskli odaklar altlığı boğmaz.
      intensity: 0.16 + (s.score / 100) * 0.34,
    })),
    faults: GIS_FAULTS,
    aiZones: GIS_AI_ZONES,
    palette: { ai: C.ai, info: C.info, muted: C.muted, txt: C.txt, txt2: C.txt2, card: C.card, border: C.border },
  };
}

/**
 * @param compact Gösterge paneli dar olduğunda etiketler gizlenir (Dashboard kartı).
 */
export function buildMapHtml(compact: boolean): string {
  const data = JSON.stringify(payload()).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#07101f; }
  .leaflet-container { background:#07101f; font-family: Inter, system-ui, -apple-system, sans-serif; outline:none; }
  .leaflet-control-attribution {
    background: ${alpha(C.card, 0.85)}; color: ${C.muted}; font-size: 9px; border-radius: 4px 0 0 0;
  }
  .leaflet-control-attribution a { color: ${C.info}; }
  .leaflet-control-zoom a {
    background: ${C.card}; color: ${C.txt}; border-color: ${C.border};
  }
  .leaflet-control-zoom a:hover { background: ${C.cardEl}; }
  .leaflet-control-scale-line {
    background: ${alpha(C.card, 0.85)}; color: ${C.muted}; border-color: ${C.border};
    font: 500 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background: ${C.card}; color: ${C.txt}; border: 1px solid ${C.border};
  }
  .leaflet-popup-content { margin: 9px 11px; font-size: 12px; line-height: 1.5; }
  .leaflet-popup-content b { color: ${C.txt}; }
  .leaflet-popup-content .k { color: ${C.muted}; }
  .leaflet-popup-close-button { color: ${C.muted} !important; }

  /* ── İşaretçiler ── */
  .mk { position:relative; }
  .mk .ring {
    position:absolute; inset:0; border-radius:50%;
    -webkit-mask: radial-gradient(circle, transparent 58%, #000 60%);
            mask: radial-gradient(circle, transparent 58%, #000 60%);
  }
  .mk .body {
    position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .mk .cap {
    position:absolute; top:100%; left:50%; transform:translateX(-50%);
    margin-top:3px; white-space:nowrap; text-align:center;
    font-size:10px; line-height:1.25; text-shadow:0 1px 3px #000, 0 0 6px #000;
  }
  .mk .cap .n { color:${C.txt2}; display:block; }
  .mk .cap .v { font-weight:700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .hexa { clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); }
  .diam { transform: translate(-50%,-50%) rotate(45deg); }
  .pulse { position:absolute; inset:-9px; border-radius:50%; border:1px solid currentColor; opacity:.45;
           animation: pl 2.4s ease-out infinite; }
  @keyframes pl { 0%{transform:scale(.7);opacity:.55} 100%{transform:scale(1.25);opacity:0} }
  .corLabel {
    font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space:nowrap; text-shadow:0 1px 3px #000, 0 0 6px #000;
  }
  .zoneLabel {
    font: 600 11px Inter, system-ui, sans-serif; white-space:nowrap;
    text-shadow:0 1px 3px #000, 0 0 6px #000;
  }
  .leaflet-div-icon { background:none; border:none; }

  /* Havza görünümünde (düşük yakınlaştırma) metinler üst üste binmesin diye
     kademeli açılır — yakınlaştıkça ayrıntı görünür. */
  .zoom-far .cap, .zoom-far .corLabel, .zoom-far .zoneLabel { display:none; }
  .zoom-far .mk { transform: scale(.72); transform-origin: center; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
<script>
(function () {
  var D = ${data};
  var COMPACT = ${compact ? "true" : "false"};

  var map = L.map('map', {
    zoomControl: !COMPACT,
    attributionControl: true,
    worldCopyJump: false,
    minZoom: 3,
    maxZoom: 12
  });
  map.setView([36.9, 26.0], 5);

  // Isı haritaları kendi panelinde (overlayPane'in altında) çizilir; böylece
  // koridorlar ve fay hatları yoğunluk dolgusunun altında kalmaz.
  map.createPane('heat');
  map.getPane('heat').style.zIndex = 350;
  map.getPane('heat').style.pointerEvents = 'none';

  /**
   * iframe/WebView ilk karede henüz ölçülmemiş olabiliyor; sıfır boyutlu bir
   * kapsayıcıda Leaflet'in getBoundsZoom'u en yüksek yakınlaştırmaya düşüyor ve
   * havza görünümü kayboluyor. Bu yüzden fitBounds gerçek boyut oluşana ertelenir.
   */
  var fitted = false;
  function fit() {
    map.invalidateSize({ animate: false });
    var s = map.getSize();
    if (fitted || s.x < 40 || s.y < 40) return;
    fitted = true;
    // Tam ekran GIS panelinde havzanın tamamı, panodaki dar kartta ise
    // okunabilirlik için operasyon bölgesi çerçevelenir.
    if (COMPACT) map.setView(D.focus.center, D.focus.zoom, { animate: false });
    else map.fitBounds(D.bounds, { padding: [10, 10], animate: false });
  }
  // Etiket yoğunluğu yakınlaştırma seviyesine bağlıdır (bkz. .zoom-far).
  function syncZoomClass() {
    document.body.classList.toggle('zoom-far', map.getZoom() < 6);
  }
  map.on('zoomend', syncZoomClass);
  syncZoomClass();

  window.addEventListener('resize', function () { fitted ? map.invalidateSize({ animate: false }) : fit(); });
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.getElementById('map'));
  fit();
  setTimeout(fit, 60);
  setTimeout(fit, 300);

  L.tileLayer(${JSON.stringify(TILES.url)}, {
    attribution: ${JSON.stringify(TILES.attribution)},
    subdomains: ${JSON.stringify(TILES.subdomains)},
    maxZoom: ${TILES.maxZoom}
  }).addTo(map);

  // Yakınlaştırmaya göre güncellenen gerçek ölçek — sabit "250 km" çubuğunun yerini alır.
  if (!COMPACT) L.control.scale({ imperial: false, position: 'bottomright', maxWidth: 120 }).addTo(map);

  // Katman adı → LayerGroup. GISScreen'deki onay kutularıyla birebir eşleşir.
  var G = {};
  ['hospitals','safeNodes','warehouses','corridors','resourceFlow',
   'international','aiOverlay','medicalDemand','resourceDeficit','population',
   'seismicRisk','faults']
    .forEach(function (k) { G[k] = L.layerGroup(); });

  /**
   * Önem filtresine tabi nesneler: {group, rank, layers[]}.
   * Eşik değiştiğinde nesne kendi grubundan çıkarılır/eklenir — grubun harita
   * üzerindeki açık/kapalı durumu bundan bağımsızdır.
   */
  var filterable = [];
  var minRank = 0;
  function track(group, rank, layers) {
    filterable.push({ group: group, rank: rank, layers: layers, on: true });
  }
  function applyFilter(threshold) {
    minRank = threshold;
    for (var i = 0; i < filterable.length; i++) {
      var f = filterable[i];
      var on = f.rank >= minRank;
      if (on === f.on) continue;
      f.on = on;
      for (var j = 0; j < f.layers.length; j++) {
        if (on) G[f.group].addLayer(f.layers[j]);
        else G[f.group].removeLayer(f.layers[j]);
      }
    }
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  /** Doluluk oranını conic-gradient halkayla gösteren div işaretçi. */
  function ringIcon(opts) {
    var size = opts.size, pct = Math.max(0, Math.min(1, opts.pct));
    var deg = pct * 360;
    var caption = (!COMPACT && opts.caption) ? opts.caption : '';
    var html =
      '<div class="mk" style="width:' + size + 'px;height:' + size + 'px;color:' + opts.color + '">' +
        (opts.pulse ? '<span class="pulse"></span>' : '') +
        '<span class="ring" style="background:conic-gradient(' + opts.color + ' ' + deg + 'deg, #1e3a5f 0)"></span>' +
        '<span class="body ' + (opts.shape || '') + '" style="width:' + (size - 10) + 'px;height:' + (size - 10) + 'px;' +
          'background:' + opts.fill + ';border:1px solid ' + opts.color + ';border-radius:' + (opts.radius || '3px') + ';' +
          'color:' + (opts.textColor || '#fff') + ';font-size:' + (opts.fontSize || 10) + 'px">' +
          (opts.text || '') +
        '</span>' +
        caption +
      '</div>';
    return L.divIcon({ html: html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
  }

  function cap(name, value, color) {
    return '<span class="cap"><span class="n">' + esc(name) + '</span>' +
           (value ? '<span class="v" style="color:' + color + '">' + esc(value) + '</span>' : '') + '</span>';
  }

  // ── HASTANELER (kapasite yayı + H ikonu) ──
  D.hospitals.forEach(function (h) {
    var m = L.marker([h.lat, h.lng], {
      icon: ringIcon({
        size: 34, pct: Math.min(h.load, 100) / 100, color: h.col, fill: h.col,
        text: 'H', fontSize: 12, radius: '4px', pulse: h.risk === 'critical',
        caption: cap(h.short, '%' + h.load, h.col)
      }),
      zIndexOffset: 400
    })
      .bindPopup('<b>' + esc(h.name) + '</b><br><span class="k">YBÜ doluluk:</span> <b style="color:' + h.col + '">%' +
                 h.load + '</b><br><span class="k">Risk:</span> ' + esc(h.risk))
      .addTo(G.hospitals);
    track('hospitals', h.rank, [m]);
  });

  // ── GÜVENLİ DÜĞÜMLER (stok halkası + altıgen, gün sayısı) ──
  D.safeNodes.forEach(function (n) {
    var m = L.marker([n.lat, n.lng], {
      icon: ringIcon({
        size: 34, pct: n.stock / 100, color: n.col, fill: 'rgba(255,255,255,0.06)',
        text: n.days + 'g', fontSize: 10, radius: '0', shape: 'hexa', textColor: n.col,
        pulse: n.days <= 3, caption: cap(n.id, n.stock + '%', n.col)
      }),
      zIndexOffset: 300
    })
      .bindPopup('<b>' + esc(n.id) + '</b><br><span class="k">Kalan gün:</span> <b style="color:' + n.col + '">' +
                 n.days + '</b><br><span class="k">Su/Gıda/Çadır:</span> %' + n.water + ' · %' + n.food + ' · %' + n.tents)
      .addTo(G.safeNodes);
    track('safeNodes', n.rank, [m]);
  });

  // ── İKMAL DEPOLARI ──
  D.warehouses.forEach(function (w) {
    L.marker([w.lat, w.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="mk" style="width:26px;height:26px">' +
              '<span class="body" style="width:22px;height:22px;border-radius:4px;font-size:14px;' +
              'background:' + ${JSON.stringify(alpha(C.ai, 0.18))} + ';border:1px solid ' + D.palette.ai +
              ';color:' + D.palette.ai + '">+</span>' +
              (COMPACT ? '' : cap(w.name, '', D.palette.ai)) + '</div>',
        iconSize: [26, 26], iconAnchor: [13, 13]
      })
    }).bindPopup('<b>' + esc(w.name) + '</b><br><span class="k">İkmal deposu</span>').addTo(G.warehouses);
  });

  // ── ULUSLARARASI GİRİŞ NOKTALARI ──
  D.ports.forEach(function (p) {
    L.marker([p.lat, p.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="mk" style="width:24px;height:24px">' +
              '<span class="body diam" style="width:17px;height:17px;border-radius:2px;' +
              'background:' + ${JSON.stringify(alpha(C.info, 0.2))} + ';border:1px solid ' + D.palette.info + '"></span>' +
              (COMPACT ? '' : cap(p.name, '', D.palette.info)) + '</div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      })
    }).bindPopup('<b>' + esc(p.name) + '</b><br><span class="k">Uluslararası giriş noktası</span>').addTo(G.international);
  });

  // ── LOJİSTİK KORİDORLAR ──
  var flows = [];
  D.corridors.forEach(function (c) {
    var target = c.international ? G.international : G.corridors;
    var pts = c.coords;

    // Parıltı halesi + ana çizgi
    var parts = [];
    parts.push(L.polyline(pts, { color: c.color, weight: 9, opacity: 0.12, smoothFactor: 1 }).addTo(target));
    parts.push(L.polyline(pts, {
      color: c.color,
      weight: c.international ? 2.5 : 3,
      opacity: c.international ? 0.85 : 0.95,
      dashArray: c.international ? '8,6' : c.dash
    })
      .bindPopup('<b>' + esc(c.label) + '</b><br><span class="k">Durum:</span> ' + esc(c.status) +
                 '<br><span class="k">Yük:</span> %' + c.load + ' · <span class="k">Risk:</span> ' + c.risk)
      .addTo(target));

    if (!COMPACT && !c.international) {
      var mid = pts[Math.floor(pts.length / 2)];
      var mark = c.status === 'operational' ? '✓' : c.status === 'risky' ? '⚠' : '~';
      parts.push(L.marker(mid, {
        icon: L.divIcon({
          className: '',
          html: '<span class="corLabel" style="color:' + c.color + '">' + esc(c.id) + ' ' + mark + ' %' + c.load + '</span>',
          iconSize: [0, 0], iconAnchor: [0, 14]
        }),
        interactive: false
      }).addTo(target));
    }
    // Uluslararası hatlar kendi katmanında; önem filtresi yalnızca yurt içi
    // koridorlara uygulanır (giriş noktaları her zaman görünür kalmalı).
    if (!c.international) track('corridors', c.rank, parts);

    // Akış parçacıkları (PF-GET03 kaynak hareketi görselleştirmesi)
    var dots = [0, 0.33, 0.66].map(function (off, i) {
      var m = L.circleMarker(pts[0], {
        radius: c.international ? 3 : 3.6, color: c.color, fillColor: c.color,
        fillOpacity: 0.95 - i * 0.2, weight: 0, interactive: false
      });
      m.addTo(G.resourceFlow);
      return { m: m, off: off };
    });
    if (!c.international) track('resourceFlow', c.rank, dots.map(function (d) { return d.m; }));
    flows.push({ pts: pts, dots: dots });
  });

  /** Polyline üzerinde t ∈ [0,1] konumu — parça uzunluklarına göre enterpolasyon. */
  function along(pts, t) {
    var segs = pts.length - 1;
    var s = Math.min(Math.floor(t * segs), segs - 1);
    var lt = t * segs - s;
    var a = pts[s], b = pts[s + 1];
    return [a[0] + (b[0] - a[0]) * lt, a[1] + (b[1] - a[1]) * lt];
  }

  var t0 = Date.now();
  function tick() {
    var t = ((Date.now() - t0) % 5000) / 5000;
    for (var i = 0; i < flows.length; i++) {
      var f = flows[i];
      for (var j = 0; j < f.dots.length; j++) {
        f.dots[j].m.setLatLng(along(f.pts, (t + f.dots[j].off) % 1));
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── ISI HARİTASI KATMANLARI ──
  function heat(list, group) {
    list.forEach(function (h) {
      // İç içe üç halka ile radyal gradyan hissi — Leaflet'te gradyan dolgu yok.
      [[1, 0.55], [0.62, 0.85], [0.32, 1]].forEach(function (step) {
        L.circle([h.lat, h.lng], {
          pane: 'heat',
          radius: h.radius * step[0],
          color: h.color, weight: 0,
          fillColor: h.color, fillOpacity: h.intensity * step[1] * 0.45,
          interactive: false
        }).addTo(group);
      });
    });
  }
  heat(D.heat.medicalDemand, G.medicalDemand);
  heat(D.heat.resourceDeficit, G.resourceDeficit);
  heat(D.heat.population, G.population);

  // ── DEPREM RİSK ISI HARİTASI (PF-AI01 Hazard × PF-AI02 Risk) ──
  // Beş kademeli iç içe halka, tek renkli ısı katmanlarına göre daha yumuşak bir
  // geçiş verir; her odak kendi skorundan türeyen rengi taşır.
  D.seismic.forEach(function (s) {
    [[1, 0.30], [0.78, 0.48], [0.56, 0.68], [0.36, 0.86], [0.18, 1]].forEach(function (step) {
      L.circle([s.lat, s.lng], {
        pane: 'heat',
        radius: s.radius * step[0],
        color: s.color, weight: 0,
        fillColor: s.color, fillOpacity: s.intensity * step[1],
        interactive: false
      }).addTo(G.seismicRisk);
    });
    // Yalnızca çekirdek tıklanabilir — popup, halkaların üst üste binmesinden etkilenmesin.
    L.circle([s.lat, s.lng], { radius: s.radius * 0.18, color: s.color, weight: 1, opacity: 0.5, fillOpacity: 0 })
      .bindPopup('<b>' + esc(s.name) + '</b><br><span class="k">Risk skoru:</span> <b style="color:' + s.color + '">' +
                 s.score + '/100 · ' + esc(s.level) + '</b><br><span class="k">PGA (475 yıl):</span> ' +
                 s.pga.toFixed(2) + 'g<br><span class="k">Model:</span> PF-AI01 × PF-AI02')
      .addTo(G.seismicRisk);
    if (!COMPACT) {
      L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: '',
          html: '<span class="zoneLabel" style="color:' + s.color + '">' + s.score + '</span>',
          iconSize: [0, 0], iconAnchor: [6, 7]
        }),
        interactive: false
      }).addTo(G.seismicRisk);
    }
  });

  // ── DİRİ FAY HATLARI ──
  D.faults.forEach(function (f) {
    L.polyline(f.coords, { color: '#F87171', weight: 6, opacity: 0.1 }).addTo(G.faults);
    L.polyline(f.coords, { color: '#F87171', weight: 1.6, opacity: 0.8, dashArray: '9,4' })
      .bindPopup('<b>' + esc(f.name) + '</b><br><span class="k">Diri fay zonu · yaklaşık yüzey izi</span>')
      .addTo(G.faults);
  });

  // ── YZ TAHMİN KATMANI (CON-007: yalnızca gösterim) ──
  D.aiZones.forEach(function (z) {
    var shape = z.kind === 'rect'
      ? L.rectangle(z.bounds, { color: z.color, weight: 1.5, dashArray: '7,5', fillColor: z.color, fillOpacity: 0.05 })
      : L.circle([z.lat, z.lng], { radius: z.radius, color: z.color, weight: 1.3, dashArray: '6,4', fillColor: z.color, fillOpacity: 0.05 });
    shape.addTo(G.aiOverlay);
    if (!COMPACT) {
      var c = z.kind === 'rect' ? L.latLngBounds(z.bounds).getCenter() : L.latLng(z.lat, z.lng);
      var top = z.kind === 'rect' ? L.latLngBounds(z.bounds).getNorth() : c.lat;
      L.marker([top, c.lng], {
        icon: L.divIcon({
          className: '',
          html: '<span class="zoneLabel" style="color:' + z.color + '">' + esc(z.label) + '</span>',
          iconSize: [0, 0], iconAnchor: [0, 8]
        }),
        interactive: false
      }).addTo(G.aiOverlay);
    }
  });

  // ── KATMAN DURUMU ──
  var state = {};
  function apply(next) {
    Object.keys(G).forEach(function (k) {
      var on = !!next[k];
      if (on === state[k]) return;
      state[k] = on;
      if (on) G[k].addTo(map); else map.removeLayer(G[k]);
    });
  }
  window.__setLayers = apply;
  window.__setFilters = function (f) { applyFilter((f && f.minRank) || 0); };

  // Web'de iframe postMessage, native'de injectJavaScript ile çağrılır.
  window.addEventListener('message', function (e) {
    try {
      var msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!msg) return;
      if (msg.type === 'layers') apply(msg.layers);
      if (msg.type === 'filters') window.__setFilters(msg.filters);
    } catch (err) {}
  });

  // Ana bileşene hazır olduğunu bildir; ilk katman durumu bunun ardından gelir.
  function ready() {
    var m = JSON.stringify({ type: 'ready' });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);
    else if (window.parent !== window) window.parent.postMessage(m, '*');
  }
  map.whenReady(function () { setTimeout(ready, 0); });
})();
</script>
</body>
</html>`;
}
