
// Display names by iso3. They replace the geojson's own names (some are outdated,
// like "Swaziland") so tooltips match search. iso3 can be a list of candidate
// codes (Kosovo), and all of them map to the same name.
const ISO3_TO_NAME = {};
ALL_COUNTRIES.forEach(c=>{
  if(Array.isArray(c.iso3)) c.iso3.forEach(code=>{ ISO3_TO_NAME[code] = c.n; });
  else ISO3_TO_NAME[c.iso3] = c.n;
});

// Countries used to frame the map. Kept fixed, so adding countries to the quiz
// never moves the crop.
const FRAME_IDS = new Set([
  "GBR","IRL","IND","PAK","BGD","NPL","BTN","LKA","THA","MYS","IDN","JPN","AUS","NZL","ZAF",
  "KEN","TZA","UGA","ZMB","ZWE","NAM","BWA","MOZ","MWI","LSO","SWZ","GUY","SUR","PNG",
  "USA","CAN","MEX","BRA","ARG","CHL","COL","PER","VEN","ECU","BOL","PRY","URY","FRA","DEU","ESP",
  "ITA","PRT","NLD","BEL","CHE","AUT","POL","SWE","NOR","FIN","DNK","RUS","UKR","ROU","GRC","TUR",
  "CZE","HUN","CHN","KOR","PRK","VNM","PHL","MNG","KAZ","UZB","IRN","IRQ","SAU","ARE","ISR","EGY",
  "NGA","ETH","GHA","MAR","DZA","TUN","LBY","SEN","CIV","CMR","COD","AGO","SDN","ISL","CUB","PAN",
  "JOR","QAT","KWT","BLR","SRB","GRL","ATA"
]);

// iso3 codes of left-hand traffic countries, used for the map colours
const FULL_LEFT = new Set(ALL_COUNTRIES.filter(c => c.s === "L").map(c => c.iso3));

let COUNTRIES = [];         // filled in after the map data has loaded
let ISO2_TO_ISO3 = {};
let TOTAL = 0;

// Pinned to a commit so upstream edits can't change the map
const GEOJSON_URL = "https://raw.githubusercontent.com/johan/world.geo.json/34c96bba9c07d2ceb30696c599bb51a5b939b20f/countries.geo.json";
const FETCH_TIMEOUT_MS = 12000;
let worldDataPromise = null;
function loadWorldData(){
  if(!worldDataPromise){
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), FETCH_TIMEOUT_MS);
    worldDataPromise = fetch(GEOJSON_URL, {signal:controller.signal}).then(r=>{
      if(!r.ok) throw new Error('bad response: '+r.status);
      return r.json();
    }).then(data=>{
      // Réunion is missing or broken in the source, so it gets a rough hand-made outline.
      data.features = data.features.filter(f => f.id !== 'REU');
      data.features.push({
        type:"Feature", id:"REU", properties:{name:"Réunion"},
        geometry:{type:"Polygon", coordinates:[[
          [55.4550,-20.8720],[55.6150,-20.8790],[55.6850,-20.9080],[55.7550,-20.9520],
          [55.7980,-21.0080],[55.8280,-21.0750],[55.8380,-21.1450],[55.8200,-21.2150],
          [55.7850,-21.2800],[55.7350,-21.3350],[55.6750,-21.3780],[55.5900,-21.3920],
          [55.5100,-21.3760],[55.4400,-21.3380],[55.3700,-21.2850],[55.3050,-21.2200],
          [55.2550,-21.1450],[55.2280,-21.0650],[55.2350,-20.9850],[55.2750,-20.9150],
          [55.3450,-20.8780],[55.4550,-20.8720]
        ]]}
      });
      // Fiji crosses the antimeridian and draws badly, so its main islands
      // are replaced with two hand-made polygons.
      data.features = data.features.filter(f => f.id !== 'FJI');
      data.features.push({
        type:"Feature", id:"FJI", properties:{name:"Fiji"},
        geometry:{type:"MultiPolygon", coordinates:[
          [[[177.30,-17.35],[177.85,-17.02],[178.35,-17.15],[178.65,-17.65],
            [178.60,-18.05],[178.20,-18.28],[177.65,-18.20],[177.30,-17.85],[177.30,-17.35]]],
          [[[178.65,-16.55],[179.15,-16.15],[179.65,-16.20],[179.90,-16.55],
            [179.75,-16.85],[179.30,-16.90],[178.85,-16.85],[178.65,-16.55]]]
        ]}
      });
      // Cyprus comes as two shapes (CYP and Northern Cyprus), so they get merged.
      data.features = data.features.filter(f =>
        f.id !== 'CYP' && !(f.properties && f.properties.name === 'Northern Cyprus'));
      data.features.push({
        type:"Feature", id:"CYP", properties:{name:"Cyprus"},
        geometry:{type:"Polygon", coordinates:[[
          [33.973617,35.058506],[34.004881,34.978098],[32.979827,34.571869],
          [32.490296,34.701655],[32.256667,35.103232],[32.73178,35.140026],
          [32.802474,35.145504],[32.946961,35.386703],[33.667227,35.373216],
          [34.576474,35.671596],[33.900804,35.245756],[33.973617,35.058506]
        ]]}
      });
      // Kosovo's id is unreliable in the source, so match it by name and relabel it
      // XKX. If it's missing entirely, add a rough outline instead.
      const hasKosovoFeature = data.features.some(f =>
        f.properties && f.properties.name && /kosovo/i.test(f.properties.name));
      if(hasKosovoFeature){
        data.features = data.features.map(f =>
          (f.properties && f.properties.name && /kosovo/i.test(f.properties.name))
            ? {...f, id:"XKX"} : f);
      } else {
        data.features.push({
          type:"Feature", id:"XKX", properties:{name:"Kosovo"},
          geometry:{type:"Polygon", coordinates:[[
            [20.59023,41.85541],[20.52295,42.21787],[20.28374,42.32025],
            [20.0707,42.58863],[20.25758,42.81275],[20.49679,42.88469],
            [20.63508,43.21671],[20.81448,43.27205],[20.95651,43.13094],
            [21.143395,43.068685],[21.27421,42.90959],[21.43866,42.86255],
            [21.63302,42.67717],[21.77505,42.6827],[21.66292,42.43922],
            [21.54001,42.24638],[21.14655,42.09769],[20.76216,42.05186],
            [20.71731,41.84711],[20.59023,41.85541]
          ]]}
        });
      }
      // Somalia comes as two shapes (SOM and Somaliland), so they get merged.
      data.features = data.features.filter(f =>
        f.id !== 'SOM' && !(f.properties && f.properties.name && /somaliland/i.test(f.properties.name)));
      data.features.push({
        type:"Feature", id:"SOM", properties:{name:"Somalia"},
        geometry:{type:"Polygon", coordinates:[[
          [49.72862,11.5789],[50.25878,11.67957],[50.73202,12.0219],[51.1112,12.02464],
          [51.13387,11.74815],[51.04153,11.16651],[51.04531,10.6409],[50.83418,10.27972],
          [50.55239,9.19874],[50.07092,8.08173],[49.4527,6.80466],[48.59455,5.33911],
          [47.74079,4.2194],[46.56476,2.85529],[45.56399,2.04576],[44.06815,1.05283],
          [43.13597,0.2922],[42.04157,-0.91916],[41.81095,-1.44647],[41.58513,-1.68325],
          [40.993,-0.85829],[40.98105,2.78452],[41.855083,3.918912],[42.12861,4.23413],
          [42.76967,4.25259],[43.66087,4.95755],[44.9636,5.00162],[47.78942,8.003],
          [46.948328,7.996877],[43.67875,9.18358],[43.296975,9.540477],[42.92812,10.02194],
          [42.55876,10.57258],[42.776852,10.926879],[43.145305,11.46204],[43.47066,11.27771],
          [43.666668,10.864169],[44.117804,10.445538],[44.614259,10.442205],[45.556941,10.698029],
          [46.645401,10.816549],[47.525658,11.127228],[48.021596,11.193064],[48.378784,11.375482],
          [48.948206,11.410622],[48.942005,11.394266],[49.72862,11.5789]
        ]]}
      });
      return data;
    }).catch(err=>{
      // don't cache a failure, so Retry starts clean
      worldDataPromise = null;
      throw err;
    }).finally(()=>clearTimeout(timer));
  }
  return worldDataPromise;
}

// false if the geometry has missing or out-of-range coordinates
function isValidGeometry(geom){
  if(!geom || !geom.coordinates) return false;
  function walk(c){
    if(typeof c[0] === "number"){
      const lon=c[0], lat=c[1];
      return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon)<=180 && Math.abs(lat)<=90;
    }
    return c.every(walk);
  }
  try{ return walk(geom.coordinates); }catch(e){ return false; }
}

const BLACKLIST = new Set(["MLT"]);

// Keeps only the countries the map data can actually draw.
// A failed attempt (offline, say) isn't cached, so it can be retried.
let countriesReadyPromise = null;
function ensureCountriesReady(){
  if(!countriesReadyPromise){
    countriesReadyPromise = loadWorldData().then(data=>{
      // For entries with several iso3 candidates (Kosovo), pick the one that has a
      // valid feature, so the rest of the app only sees one code.
      COUNTRIES = ALL_COUNTRIES.map(c=>{
        if(!Array.isArray(c.iso3)) return c;
        const hit = c.iso3.find(code=>{
          const f = data.features.find(x=>x.id===code);
          return f && !BLACKLIST.has(f.id) && isValidGeometry(f.geometry);
        });
        return {...c, iso3: hit || c.iso3[0]};
      }).filter(c=>{
        const f = data.features.find(x=>x.id===c.iso3);
        return f && !BLACKLIST.has(f.id) && isValidGeometry(f.geometry);
      });
      ISO2_TO_ISO3 = Object.fromEntries(COUNTRIES.map(c=>[c.iso, c.iso3]));
      TOTAL = COUNTRIES.length;
      const tv1 = document.getElementById('totalVal'), tv2 = document.getElementById('totalVal2');
      if(tv1) tv1.textContent = TOTAL;
      if(tv2) tv2.textContent = TOTAL;
      updateRecordGold();
      return COUNTRIES;
    }).catch(err=>{
      countriesReadyPromise = null; // so it can be retried
      COUNTRIES = []; TOTAL = 0;
      throw err;
    });
  }
  return countriesReadyPromise;
}
// Start loading right away. The screens that need the data handle failures,
// so the error is ignored here to avoid an unhandled rejection warning.
ensureCountriesReady().then(()=>warmUpFlags()).catch(()=>{});

/* ================= COMMON ================= */
const SCREEN_TITLES = { menu:'LRHT — Main', mapScreen:'LRHT — Map', quizScreen:'LRHT — Quiz' };
/* Error boxes fade the same way as the screens (0.3s) */
function showErrorBox(el){
  el.classList.add('show');
  void el.offsetWidth; // force a reflow so the fade actually runs
  el.classList.add('in');
}
function hideErrorBox(el){ el.classList.remove('in'); el.classList.remove('show'); }
// Fades the box out (0.3s) and resolves once it is gone. Resolves right away if it isn't showing.
function fadeOutErrorBox(el){
  if(!el.classList.contains('show')) return Promise.resolve();
  el.classList.remove('in');
  return new Promise(resolve => setTimeout(() => { el.classList.remove('show'); resolve(); }, 300));
}

let screenTransitioning = false; // ignore clicks while a fade is running
function showScreen(id){
  const cur = document.querySelector('.screen.active');
  const next = document.getElementById(id);
  if(cur === next || screenTransitioning) return;
  screenTransitioning = true;
  document.title = SCREEN_TITLES[id] || 'LRHT';
  if(window.setParticleFieldVisible) window.setParticleFieldVisible(id === 'menu');
  function activate(){
    if(cur) cur.classList.remove('active');
    next.classList.add('active');
    next.style.opacity = 0;
    void next.offsetWidth; // force a reflow so the fade runs
    next.style.opacity = 1;
    if(id==='mapScreen'){ buildMap({instant:true}); relayoutMap(); setTimeout(relayoutMap, 350); }
    if(id==='menu') warmUpFlags();
    setTimeout(()=>{ screenTransitioning = false; }, 300);
  }
  if(cur){
    cur.style.opacity = 0;
    setTimeout(activate, 300);
  } else {
    activate();
  }
}

/* Back asks for confirmation only mid-round (streak > 0).
   Otherwise there's nothing to lose, so it goes straight to the menu. */
const leaveConfirmEl = document.getElementById('leaveConfirm');
function handleQuizBack(){
  const roundFinished = document.getElementById('resultCard').style.display === 'block';
  if(streak === 0 || roundFinished){ showScreen('menu'); return; }
  document.getElementById('leaveConfirmText').textContent = recordBroken
    ? `Leaving now keeps your saved new record of ${streak} in a row but resets this attempt`
    : `Leaving now will reset your current streak of ${streak}`;
  openLeaveConfirm();
}
function openLeaveConfirm(){
  leaveConfirmEl.classList.add('show');
  void leaveConfirmEl.offsetWidth; // force a reflow so the fade runs
  leaveConfirmEl.classList.add('visible');
}
function closeLeaveConfirm(){
  leaveConfirmEl.classList.remove('visible');
  setTimeout(()=>{ leaveConfirmEl.classList.remove('show'); }, 300);
}
function confirmLeaveQuiz(){
  // Three 300ms steps: the dialog fades out, then the quiz fades out and the
  // menu fades in (showScreen does the last two).
  closeLeaveConfirm();
  setTimeout(()=>{ showScreen('menu'); }, 300);
}
leaveConfirmEl.addEventListener('click', e=>{
  if(e.target === leaveConfirmEl) closeLeaveConfirm(); // backdrop click = stay
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape' && leaveConfirmEl.classList.contains('show')) closeLeaveConfirm();
});

/* ================= THEME ================= */
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

const themeWipe = document.getElementById('themeWipe');
const earthEl = document.querySelector('.earth');
const ORBIT_MS = 900; // keep in sync with the CSS transition on .orbit-icon and #themeWipe

// Sun and moon positions on the shared orbit, in percent
// (0 = top and visible, 50 = bottom and hidden).
// Each toggle moves both by 50: half a lap clockwise, never backwards.
let sunPos = 0, moonPos = 50;
let wipeAngle = 0; // same as sunPos * 3.6, but in degrees
let themeAnimating = false; // ignore clicks while the animation runs

function placeIcons(instant){
  if(instant){
    sunIcon.style.transition = 'none';
    moonIcon.style.transition = 'none';
    themeWipe.style.transition = 'none';
    earthEl.style.transition = 'none';
  }
  sunIcon.style.offsetDistance = sunPos + '%';
  moonIcon.style.offsetDistance = moonPos + '%';
  themeWipe.style.setProperty('--wipe-angle', wipeAngle + 'deg');
  earthEl.style.setProperty('--wipe-angle', wipeAngle + 'deg');
  if(instant){
    void sunIcon.offsetWidth; // force a reflow before turning transitions back on
    sunIcon.style.transition = '';
    moonIcon.style.transition = '';
    themeWipe.style.transition = '';
    earthEl.style.transition = '';
  }
}

function toggleTheme(){
  if(themeAnimating) return;
  themeAnimating = true;
  const dark = !document.body.classList.contains('dark');

  // Switch the theme right away so page transitions run during the 0.9s orbit.
  document.body.classList.toggle('dark', dark);
  if(window.setParticleTheme) window.setParticleTheme(dark);

  sunPos += 50; moonPos += 50; wipeAngle += 180; // always clockwise
  placeIcons(false);

  setTimeout(()=>{
    // wrap the values back into a small range (same spot on the loop, so no visible jump)
    sunPos %= 100; moonPos %= 100; wipeAngle %= 360;
    placeIcons(true);
    themeAnimating = false;
  }, ORBIT_MS + 30);
}

// The app always starts in the dark theme (see <body class="dark">).
// The toggle only changes it for this visit, it isn't saved.
sunPos = 50; moonPos = 0; wipeAngle = 180;
placeIcons(true);

/* ---- Watermark: keeps its size and position when the browser zooms ----
   vw/vh/vmin don't change with zoom, unlike px. Uses outerWidth/outerHeight
   because innerWidth is already affected by zoom. */
(function(){
  const marks = document.querySelectorAll('.watermark');
  if(!marks.length) return;
  const cs0 = getComputedStyle(marks[0]);
  const baseRight = parseFloat(cs0.right) || 14;
  const baseBottom = parseFloat(cs0.bottom) || 10;
  const baseFont = parseFloat(cs0.fontSize) || 12;
  const outerW = window.outerWidth, outerH = window.outerHeight;
  const dpr0 = window.devicePixelRatio || 1;
  let w0, h0;
  if (dpr0 < 1) {
    // A devicePixelRatio below 1 means the page is zoomed out by that factor,
    // so undo it directly instead of guessing from outer/inner sizes.
    w0 = window.innerWidth * dpr0;
    h0 = window.innerHeight * dpr0;
  } else {
    w0 = outerW > 0 ? outerW : window.innerWidth;
    h0 = outerH > 0 ? outerH : window.innerHeight;
  }
  const vmin0 = Math.min(w0, h0);
  const rightVW = (baseRight / w0) * 100;
  const bottomVH = (baseBottom / h0) * 100;
  const fontVMIN = (baseFont / vmin0) * 100;
  marks.forEach(m => {
    m.style.right = `${rightVW}vw`;
    m.style.bottom = `${bottomVH}vh`;
    m.style.fontSize = `${fontVMIN}vmin`;
  });

  // Reserve space for the watermark in vw instead of px, so it stays matched
  // to .screen's width at any zoom level.
  const rect = marks[0].getBoundingClientRect();
  const clearancePx = Math.ceil(rect.width + baseRight + 14); // text width + its own right offset + a small buffer
  const clearanceVW = (clearancePx / w0) * 100;
  document.documentElement.style.setProperty('--wm-clearance', clearanceVW + 'vw');
})();


/* ---- Particle field ----
   Slow moving dots behind the menu. The colour follows the theme. */
(function(){
  const canvas = document.getElementById('particleField');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const DEPTH = 1200;      // how far back a particle starts
  const BASE_SPEED = 0.65; // depth units per frame at 60fps, kept low for a slow drift

  function spawn(fresh){
    return {
      x: (Math.random()*2 - 1),           // -1..1, spread multiplied by W/H below
      y: (Math.random()*2 - 1),
      z: fresh ? (DEPTH*0.15 + Math.random()*DEPTH*0.85) : (Math.random()*DEPTH + 20)
    };
  }

  let particles = [];
  function initParticles(){
    const count = Math.round(Math.min(85, Math.max(38, (W*H)/15000)));
    particles = [];
    for(let i=0;i<count;i++) particles.push(spawn(false));
  }

  resize();
  initParticles();
  // Resizing a canvas clears it. The loop repaints by itself, but a frozen
  // backdrop needs this manual redraw.
  function repaintFrozenFrame(){
    if(running) return; // the loop redraws on its own
    ctx.clearRect(0, 0, W, H);
    const mix = currentThemeMix(performance.now());
    const cx = W/2, cy = H/2;
    const spreadX = W*0.6, spreadY = H*0.6;
    for(const p of particles){
      const scale = DEPTH / (p.z * 4);
      const sx = cx + p.x * spreadX * scale;
      const sy = cy + p.y * spreadY * scale;
      if(sx < -40 || sx > W+40 || sy < -40 || sy > H+40) continue;
      const depthFactor = Math.min(1, scale * 1.3);
      const size = Math.max(0.4, depthFactor * 2.1);
      const alpha = depthFactor * 0.5;
      const shade = Math.round(25 + (255 - 25) * mix);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
      ctx.arc(sx, sy, size, 0, Math.PI*2);
      ctx.fill();
    }
  }
  function handleFieldResize(){
    resize();
    repaintFrozenFrame();
  }
  window.addEventListener('resize', handleFieldResize);
  if(window.visualViewport) window.visualViewport.addEventListener('resize', handleFieldResize);

  // With reduced motion, draw the field once and don't animate it.
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let running = true;
  // speedMult moves toward targetSpeed each frame, so the drift slows to a stop
  // when leaving the menu and speeds back up when returning.
  let speedMult = reduceMotion ? 0 : 1, targetSpeed = speedMult;

  // Fades the particle colour between palettes, taking as long as the theme transition.
  const THEME_MS = 900;
  let themeFrom = document.body.classList.contains('dark') ? 1 : 0;
  let themeTo = themeFrom;
  let themeStart = 0;

  function currentThemeMix(now){
    if(themeFrom === themeTo) return themeTo;
    const t = Math.min(1, (now - themeStart) / THEME_MS);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out curve
    return themeFrom + (themeTo - themeFrom) * eased;
  }

  // Exposed so toggleTheme() can start the colour fade.
  window.setParticleTheme = function(dark){
    const to = dark ? 1 : 0;
    if(to === themeTo) return;
    themeFrom = currentThemeMix(performance.now());
    themeTo = to;
    themeStart = performance.now();
    if(reduceMotion){ themeFrom = themeTo; repaintFrozenFrame(); }
  };

  let lastFrameTime = null;

  function frame(now){
    if(lastFrameTime === null) lastFrameTime = now;
    // Scales speed to a 60fps frame whatever the refresh rate, and caps the step
    // so particles don't jump after the tab was in the background.
    const dtFactor = Math.min(3, (now - lastFrameTime) / (1000/60));
    lastFrameTime = now;

    ctx.clearRect(0, 0, W, H);
    const mix = currentThemeMix(now);
    const cx = W/2, cy = H/2;
    const spreadX = W*0.6, spreadY = H*0.6;

    speedMult += (targetSpeed - speedMult) * 0.045 * dtFactor;
    if(Math.abs(targetSpeed - speedMult) < 0.001) speedMult = targetSpeed;

    for(const p of particles){
      const accel = 1 + (1 - p.z/DEPTH) * 0.5; // speeds up slightly near the viewer
      p.z -= BASE_SPEED * accel * speedMult * dtFactor;

      if(p.z < 12){
        Object.assign(p, spawn(true));
        continue;
      }

      const scale = DEPTH / (p.z * 4);
      const sx = cx + p.x * spreadX * scale;
      const sy = cy + p.y * spreadY * scale;

      if(sx < -40 || sx > W+40 || sy < -40 || sy > H+40){
        Object.assign(p, spawn(true));
        continue;
      }

      const depthFactor = Math.min(1, scale * 1.3);
      const size = Math.max(0.4, depthFactor * 2.1);
      const alpha = depthFactor * 0.5;
      const shade = Math.round(25 + (255 - 25) * mix);
      const colour = `${shade},${shade},${shade}`;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${colour},${alpha})`;
      ctx.arc(sx, sy, size, 0, Math.PI*2);
      ctx.fill();
    }

    // fully stopped, so stop scheduling frames
    if(targetSpeed === 0 && speedMult === 0){
      running = false;
      return;
    }

    if(running) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Exposed so showScreen() can slow the field to a stop off the menu and speed it
  // back up on the menu. screenBackdrop covers the colour wipe at the same time.
  window.setParticleFieldVisible = function(onMenu){
    targetSpeed = onMenu && !reduceMotion ? 1 : 0;
    if(onMenu && !running && !reduceMotion){
      running = true;
      requestAnimationFrame(frame);
    }
    const backdrop = document.getElementById('screenBackdrop');
    if(backdrop) backdrop.classList.toggle('visible', !onMenu);
  };
})();

// Features that project far too big are skipped as broken geometry
// (they would cover the ocean). Countries that really are huge are exempt.
const KNOWN_HUGE = new Set(["RUS","CAN","USA","CHN","BRA","AUS","IND","ARG","KAZ","DZA","GRL","ATA","FRA","MNG","SAU","SDN","IDN"]);

/* ================= WORLD MAP (real borders via d3 + geojson) ================= */
let mapBuilt = false;
let mapPathGen = null;
let lastVBW = 1000, lastVBH = 499; // 499 is what renderMap works out for the pinned data, so the frame doesn't resize when the map appears
const MAPWRAP_BORDER = 3; // keep in sync with the border width of #mapWrap in the CSS

// Sizes #mapWrap in pixels to match the SVG viewBox ratio. CSS aspect-ratio plus
// max-height can't do it: once max-height kicks in, the width doesn't shrink with it
// and the SVG ends up with extra ocean at the edges.
function sizeMapWrap(vbW, vbH){
  const wrap = document.getElementById('mapWrap');
  if(!wrap) return;
  const parentW = wrap.parentElement ? wrap.parentElement.clientWidth : wrap.clientWidth;
  // If the screen is hidden or mid-reflow (browser zoom), measuring gives 0 and
  // would collapse the map and controls. Keep the last good size instead.
  if(!(parentW > MAPWRAP_BORDER*2 + 20) || !(vbW > 0) || !(vbH > 0)) return false;
  const maxH = Math.max(window.innerHeight * 0.78, 120);
  const ratio = vbW / vbH;
  // use the inner box (inside the border) so the ratio matches the viewBox
  let innerW = parentW - MAPWRAP_BORDER*2, innerH = innerW/ratio;
  if(innerH + MAPWRAP_BORDER*2 > maxH){ innerH = maxH - MAPWRAP_BORDER*2; innerW = innerH*ratio; }
  const outerW = innerW + MAPWRAP_BORDER*2;
  wrap.style.width = outerW + 'px';
  wrap.style.height = (innerH + MAPWRAP_BORDER*2) + 'px';
  // The search and zoom row should end at the map's right edge, even when the
  // 78vh cap makes the map narrower, so give it the same width.
  const row = document.getElementById('mapControlsRow');
  if(row) row.style.width = outerW + 'px';
  return true;
}
// Re-lays out the map. Safe to call any time, it does nothing while hidden or not built.
function relayoutMap(){
  try{
    if(!sizeMapWrap(lastVBW, lastVBH)) return;
    if(mapBuilt){
      updateMinScale();
      if(!(scale >= MIN_SCALE)) scale = MIN_SCALE;
      clampPan();
      applyTransform();
    }
  }catch(e){ /* not built yet */ }
}
function handleMapResize(){
  requestAnimationFrame(relayoutMap);
  setTimeout(relayoutMap, 150);
  setTimeout(relayoutMap, 500);
}
window.addEventListener('resize', handleMapResize);
if(window.visualViewport) window.visualViewport.addEventListener('resize', handleMapResize);
window.addEventListener('pageshow', handleMapResize);
window.addEventListener('orientationchange', handleMapResize);
if(window.ResizeObserver){
  const ro = new ResizeObserver(()=>relayoutMap());
  const outer = document.getElementById('mapWrapOuter');
  if(outer) ro.observe(outer);
}

let countryIndex = {}; // iso2 -> {feature, bounds, centroid, labeled, name}, filled by buildMap and used by search

// The three map states (loading text, error box, the map itself) sit on top of each
// other in #mapWrap. Only one shows at a time: the old one fades out, then the new one fades in.
let mapSwapId = 0;
function showMapLayer(name, instant){
  const layers = {
    loading: document.getElementById('mapLoading'),
    error: document.getElementById('mapError'),
    ready: document.getElementById('worldSvg')
  };
  const target = layers[name];
  const others = Object.keys(layers).filter(k => k !== name).map(k => layers[k]);
  const fadingOut = others.filter(el => el.classList.contains('in'));
  if(target.classList.contains('in') && fadingOut.length === 0) return;
  const id = ++mapSwapId; // a newer call cancels this one's pending reveal
  fadingOut.forEach(el => el.classList.remove('in'));
  function reveal(){
    if(id !== mapSwapId) return;
    others.forEach(el => {
      if(el === layers.ready) el.style.display = 'none';
      else el.classList.remove('show');
    });
    if(target === layers.ready) target.style.display = 'block';
    else target.classList.add('show');
    if(!instant) void target.offsetWidth; // reflow so the fade runs
    target.classList.add('in');
  }
  if(fadingOut.length && !instant) setTimeout(reveal, 300);
  else reveal();
}

async function buildMap(opts){
  if(mapBuilt) return;
  // Coming back to the screen passes instant, because the screen is already fading in
  const instant = !!(opts && opts.instant);
  document.getElementById('mapLoading').textContent = 'Loading world map…';
  showMapLayer('loading', instant);

  let data;
  try{
    data = await loadWorldData();
    await ensureCountriesReady(); // COUNTRIES and ISO2_TO_ISO3 must match what the geojson can draw
  }catch(err){
    showMapLayer('error');
    return; // mapBuilt stays false, so reopening the screen or Retry tries again
  }
  if(mapBuilt) return; // another call finished building while this one waited
  try{
    renderMap(data);
  }catch(err){
    document.getElementById('worldSvg').innerHTML = '';
    countryIndex = {};
    showMapLayer('error');
    return; // mapBuilt stays false, so reopening the screen or Retry tries again
  }
  mapBuilt = true;
  showMapLayer('ready');
}

function renderMap(data){
  const svg = document.getElementById('worldSvg');
  const NS = "http://www.w3.org/2000/svg";
  // Show it before building: getBBox() (used for the Antarctica patch below)
  // doesn't work on a display:none SVG. The build is synchronous, so no flicker.
  svg.style.display = 'block';

  // The crop uses the fixed FRAME_IDS set, not the full country list, so the framing
  // stays put. For this measurement only, tiny far-away islands (MultiPolygon pieces)
  // are dropped so they don't leave odd gaps.
  const MIN_PIECE_AREA_FRACTION = 0.02;
  function mainLandOnly(feature){
    const geom = feature.geometry;
    if(!geom || geom.type !== "MultiPolygon" || geom.coordinates.length <= 1) return feature;
    const bboxArea = poly=>{
      const ring = poly[0];
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(const pt of ring){
        if(pt[0]<minX) minX=pt[0]; if(pt[0]>maxX) maxX=pt[0];
        if(pt[1]<minY) minY=pt[1]; if(pt[1]>maxY) maxY=pt[1];
      }
      return (maxX-minX)*(maxY-minY);
    };
    const areas = geom.coordinates.map(bboxArea);
    const maxArea = Math.max(...areas);
    if(!(maxArea > 0)) return feature;
    const kept = geom.coordinates.filter((_,i)=>areas[i] >= maxArea*MIN_PIECE_AREA_FRACTION);
    if(kept.length === 0 || kept.length === geom.coordinates.length) return feature;
    return Object.assign({}, feature, {geometry:{type:"MultiPolygon", coordinates:kept}});
  }
  const rawBoundsFeatures = data.features.filter(f => isValidGeometry(f.geometry) && FRAME_IDS.has(f.id));
  const boundsFeatures = rawBoundsFeatures.map(mainLandOnly);
  const fc = {type:"FeatureCollection", features:boundsFeatures};

  // Get the aspect ratio from d3.geoBounds (lon/lat) instead of projecting first.
  // Russia crosses the antimeridian, and measuring projected pixels reads that as
  // the full -180..180 range, which adds width that isn't there.
  const geoBounds = d3.geoBounds(fc);
  // Small top margin above Greenland (the northernmost point)
  // so the frame doesn't touch its coastline.
  const TOP_MARGIN_DEG = 6;
  geoBounds[1][1] = Math.min(90, geoBounds[1][1] + TOP_MARGIN_DEG);
  // Small bottom margin so Antarctica's outline isn't cut off.
  const BOTTOM_MARGIN_DEG = 1.5;
  geoBounds[0][1] = Math.max(-90, geoBounds[0][1] - BOTTOM_MARGIN_DEG);
  const contentW = geoBounds[1][0]-geoBounds[0][0];
  const contentH = geoBounds[1][1]-geoBounds[0][1];
  const VB_W = 1000;
  const VB_H = VB_W * (contentH/contentW);

  svg.setAttribute("viewBox", `0 0 ${VB_W} ${VB_H}`);
  lastVBW = VB_W; lastVBH = VB_H;
  sizeMapWrap(VB_W, VB_H);
  // Recalculate MIN_SCALE for this container width and start at that scale,
  // centred, so the CROP_PX crop is the same on both sides from the start.
  updateMinScale();
  scale = MIN_SCALE;
  tx = -CROP_PX; ty = 0;
  clampPan();
  applyTransform();


  // Build the projection by hand from geoBounds. d3's fitSize measures projected
  // pixels again, which brings back the antimeridian problem we avoided above.
  const centerLon = (geoBounds[0][0]+geoBounds[1][0])/2;
  const centerLat = (geoBounds[0][1]+geoBounds[1][1])/2;
  const projScale = VB_W / (contentW * Math.PI/180);
  // Recentre with .rotate(), not .center(). d3 clips at the real antimeridian, which
  // cuts through land. .rotate() moves that seam into the open Pacific.
  const projection = d3.geoEquirectangular()
    .scale(projScale)
    .rotate([-centerLon, 0])
    .translate([VB_W/2, VB_H/2]);
  // .rotate() doesn't cover latitude, so nudge it with translate instead.
  const [cx, cy] = projection([centerLon, centerLat]);
  projection.translate([VB_W - cx, VB_H - cy]);
  const pathGen = d3.geoPath(projection);
  mapPathGen = pathGen;

  // ocean background, so water reads as blue and not as land
  const ocean = document.createElementNS(NS,"rect");
  ocean.setAttribute("x",0); ocean.setAttribute("y",0);
  ocean.setAttribute("width",VB_W); ocean.setAttribute("height",VB_H);
  ocean.setAttribute("fill","var(--ocean)");
  svg.appendChild(ocean);

  // Scales a feature up around its own centroid, keeping its shape.
  // Used below for countries so small that the border stroke covers the fill.
  function scaleFeatureAroundCentroid(feature, factor){
    const centroid = d3.geoCentroid(feature); // [lon, lat], before projecting
    const scalePoint = pt => [
      centroid[0] + (pt[0]-centroid[0])*factor,
      centroid[1] + (pt[1]-centroid[1])*factor
    ];
    const scaleRing = ring => ring.map(scalePoint);
    const geom = feature.geometry;
    let coordinates;
    if(geom.type === "Polygon") coordinates = geom.coordinates.map(scaleRing);
    else if(geom.type === "MultiPolygon") coordinates = geom.coordinates.map(poly => poly.map(scaleRing));
    else return feature; // unknown geometry type, return it unscaled rather than risk breaking it
    return {...feature, geometry:{...geom, coordinates}};
  }

  function drawCountryPath(feature, fill, labelText){
    const b = pathGen.bounds(feature);
    const bw = b[1][0]-b[0][0], bh = b[1][1]-b[0][1];
    if(!KNOWN_HUGE.has(feature.id) && (bw > 700 || bh > 380)) return; // skip broken or oversized geometry

    // Tiny countries (Vatican City) draw so small that the border stroke hides
    // the fill colour. Scale just this one up a bit around its centroid,
    // keeping its proportions.
    const STROKE_W = 0.6, inset = STROKE_W/2, minVisible = 1.4;
    const minDim = Math.min(bw, bh);
    let drawFeature = feature;
    if(minDim > 0 && minDim < inset*2 + minVisible){
      const factor = (inset*2 + minVisible) / minDim;
      drawFeature = scaleFeatureAroundCentroid(feature, factor);
    }

    const d = pathGen(drawFeature);
    if(!d) return;
    const path = document.createElementNS(NS,"path");
    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", "#4a4a4a");
    path.setAttribute("stroke-width", "0.6");
    path.setAttribute("data-iso3", feature.id);
    const title = document.createElementNS(NS,"title");
    title.textContent = labelText;
    path.appendChild(title);
    svg.appendChild(path);
  }

  data.features.forEach(f=>{
    if(!isValidGeometry(f.geometry)) return;
    if(BLACKLIST.has(f.id)) return;
    drawCountryPath(f, FULL_LEFT.has(f.id) ? "var(--green)" : "var(--yellow)",
      ISO3_TO_NAME[f.id] || (f.properties && f.properties.name ? f.properties.name : f.id));
  });

  // Antarctica isn't a rectangle, so a tight crop leaves gaps beside it.
  // The patch is sized from the path's own getBBox().
  const ataPathEl = svg.querySelector('path[data-iso3="ATA"]');
  if(ataPathEl){
    const bb = ataPathEl.getBBox();
    const ataRight = bb.x + bb.width;
    const ataBottom = bb.y + bb.height;
    const ataFill = FULL_LEFT.has("ATA") ? "var(--green)" : "var(--yellow)";
    // Tiny overlap so the patch sits under the coastline with no seam.
    const OVERLAP = 0.4;
    if(ataBottom < VB_H){
      const bottomPatch = document.createElementNS(NS,"rect");
      bottomPatch.setAttribute("x", 0);
      bottomPatch.setAttribute("y", ataBottom - OVERLAP);
      bottomPatch.setAttribute("width", VB_W);
      bottomPatch.setAttribute("height", (VB_H - ataBottom) + OVERLAP);
      bottomPatch.setAttribute("fill", ataFill);
      svg.appendChild(bottomPatch);
    }
    if(ataRight < VB_W){
      const rightPatch = document.createElementNS(NS,"rect");
      rightPatch.setAttribute("x", ataRight - OVERLAP);
      rightPatch.setAttribute("y", 0);
      rightPatch.setAttribute("width", (VB_W - ataRight) + OVERLAP);
      rightPatch.setAttribute("height", VB_H);
      rightPatch.setAttribute("fill", ataFill);
      svg.appendChild(rightPatch);
    }
  }

  // The Malaysia/Indonesia border stroke sticks out into the sea at Tanjung Datu,
  // so a tiny ocean-coloured patch covers it.
  const tanjungDatu = projection([109.66, 2.05]);
  if(tanjungDatu){
    const cx = tanjungDatu[0] - 0.1, cy = tanjungDatu[1] - 0.4, r = 0.4;
    const patch = document.createElementNS(NS,"rect");
    patch.setAttribute("x", cx - r);
    patch.setAttribute("y", cy - r);
    patch.setAttribute("width", r*2);
    patch.setAttribute("height", r*2);
    patch.setAttribute("fill","var(--ocean)");
    svg.appendChild(patch);
  }

  // ---- labels: one small fixed size, no overlaps ----
  // Countries that are too small or collide get no label on the map. Their name
  // still shows in the hover tooltip and in search.
  const FONT = 3.0;
  const placed = []; // boxes already taken, in svg coordinates
  countryIndex = {};

  // Hand-picked label spots for countries whose real centroid lands in an odd place
  // (the US gets pulled west by Alaska, Canada north by its Arctic islands).
  const LABEL_OVERRIDES = {
    RE: [55.5364, -21.1151],
    US: [-98.35, 39.5],
    CA: [-98, 56],
    VN: [108.3, 14.3],
    PG: [147.0, -6.3],
    MY: [111.5, 3.3],
    GB: [-3.3, 55.0],
    ZA: [23.7, -29.2],
    SO: [47.7, 6.2],
    CL: [-71.8, -35.0],
    NO: [9.0, 61.3],
    BG: [25.5, 42.7],
    LR: [-9.5, 6.4],
    MW: [34.0, -13.2],
    CG: [15.8, -1.0],
    OM: [57.0, 20.5],
    SE: [15.3, 62.5],
    FI: [26.0, 63.5],
    IE: [-8.0, 53.3],
    TN: [9.4, 34.0],
    NZ: [173.2, -41.5],
    CM: [11.7, 5.5],
    BF: [-1.3, 12.3],
    PT: [-8.3, 39.6]
  };

  // Countries that always get a label, even if the automatic fit/overlap check
  // would skip them. Positions come from LABEL_OVERRIDES above.
  const FORCE_LABEL_ISOS = new Set(["BG","LR","MW","CG","IE","TN","PT","CD","CF","CI"]);

  // Long names drawn on two lines, centred on the country.
  const LABEL_LINES = {
    CD: ["Democratic Republic", "of the Congo"],
    CF: ["Central African", "Republic"],
    CI: ["Côte", "d'Ivoire"]
  };

  // Small manual label shifts in map units (x right, y down)
  const LABEL_NUDGE = {
    CD: [-FONT * 0.55, 0],  // about the width of one letter "o"
    CF: [0, FONT * 0.26]    // about half the height of a lowercase letter
  };

  const withBounds = COUNTRIES.map(c=>{
    const iso3 = ISO2_TO_ISO3[c.iso];
    const feature = data.features.find(f=>f.id===iso3);
    if(!feature || !isValidGeometry(feature.geometry)) return null;
    let bounds, centroid;
    try{
      bounds = pathGen.bounds(feature);
      centroid = LABEL_OVERRIDES[c.iso] ? projection(LABEL_OVERRIDES[c.iso]) : pathGen.centroid(feature);
    }catch(e){ return null; }
    if(!bounds || !centroid) return null;
    const w = bounds[1][0]-bounds[0][0], h = bounds[1][1]-bounds[0][1];
    if(!Number.isFinite(w) || !Number.isFinite(h) || w<=0 || h<=0) return null;
    if(!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
    const nudge = LABEL_NUDGE[c.iso];
    if(nudge) centroid = [centroid[0] + nudge[0], centroid[1] + nudge[1]];
    return {c, feature, centroid, area:w*h};
  }).filter(Boolean);

  // smallest countries pick their label spots first, so big neighbours don't push them out
  withBounds.sort((a,b)=>a.area-b.area);

  withBounds.forEach(item=>{
    const {c, centroid} = item;
    const lines = LABEL_LINES[c.iso] || [c.n];
    const textW = Math.max(...lines.map(l => l.length)) * FONT * 0.6;
    const textH = FONT * 1.15 * lines.length;
    const box = {x0:centroid[0]-textW/2, y0:centroid[1]-textH/2, x1:centroid[0]+textW/2, y1:centroid[1]+textH/2};

    const bounds = mapPathGen.bounds(item.feature);
    // Réunion is too small for a label, hover and search cover it
    const fitsCountry = item.feature.id !== "REU"
      && (bounds[1][0]-bounds[0][0]) >= textW*0.95 && (bounds[1][1]-bounds[0][1]) >= textH*1.3;
    const overlaps = placed.some(p=> box.x0 < p.x1+1 && box.x1 > p.x0-1 && box.y0 < p.y1+1 && box.y1 > p.y0-1);

    let labeled = false;
    if((fitsCountry && !overlaps) || FORCE_LABEL_ISOS.has(c.iso)){
      placed.push(box);
      lines.forEach((line, i)=>{
        const label = document.createElementNS(NS,"text");
        label.setAttribute("x", centroid[0]);
        label.setAttribute("y", centroid[1] + (i - (lines.length-1)/2) * FONT * 1.15);
        label.setAttribute("font-size", FONT);
        label.setAttribute("text-anchor","middle");
        label.setAttribute("dominant-baseline","middle");
        label.setAttribute("fill", "#141414");
        label.textContent = line;
        svg.appendChild(label);
      });
      labeled = true;
    }
    // Zoom framing ignores tiny far-away pieces (like Russia's Chukotka sliver on the
    // opposite edge of the map), but only when the full bounds are too wide.
    let zoomBounds = bounds, tight = false;
    try{
      const zb = mapPathGen.bounds(mainLandOnly(item.feature));
      const fullW = bounds[1][0]-bounds[0][0], zW = zb[1][0]-zb[0][0];
      if(zW > 0 && Number.isFinite(zW) && fullW > zW*1.5){ zoomBounds = zb; tight = true; }
    }catch(e){}
    countryIndex[c.iso] = {feature:item.feature, bounds, zoomBounds, tight, centroid, labeled, name:c.n};
  });

  // Run the layout again a bit later, in case a browser zoom or font reflow
  // was still settling during the first measurement.
  requestAnimationFrame(()=>requestAnimationFrame(relayoutMap));
  setTimeout(relayoutMap, 300);
}

/* ---- zoom (centred on cursor) and pan ---- */
// CROP_PX pixels are always hidden past the left and right edges, so the border stroke never shows.
const CROP_PX = 5;
let MIN_SCALE = 1.02; // a bit above 1 to leave the crop overhang, set by updateMinScale()
let scale=MIN_SCALE, tx=0, ty=0, dragging=false, sx=0, sy=0;
const mapWrap = document.getElementById('mapWrap');
const svgEl = document.getElementById('worldSvg');

// The pannable area is smaller than the border box by 2 × MAPWRAP_BORDER.
function mapViewportSize(){
  const rect = mapWrap.getBoundingClientRect();
  return { width: rect.width - MAPWRAP_BORDER*2, height: rect.height - MAPWRAP_BORDER*2 };
}

// MIN_SCALE needs 2 × CROP_PX of overhang so clampPan can hide CROP_PX on both
// sides. Recalculated whenever the container width changes.
function updateMinScale(){
  const {width} = mapViewportSize();
  if(width > 0) MIN_SCALE = 1 + (2*CROP_PX)/width;
}

function applyTransform(){
  if(!Number.isFinite(scale) || !Number.isFinite(tx) || !Number.isFinite(ty)){ scale = MIN_SCALE; tx = -CROP_PX; ty = 0; }
  // scaleX keeps the horizontal overhang that hides the raw border. scaleY removes it
  // so the SVG height matches the viewport exactly at minimum zoom.
  const scaleY = scale / MIN_SCALE;
  svgEl.style.transform = `translate(${tx}px,${ty}px) scale(${scale}, ${scaleY})`;
}
function zoomBy(factor, cx, cy){
  const {width, height} = mapViewportSize();
  // +/- buttons (no cursor point): animate over 0.3s, building on the pending target if clicked fast.
  // Wheel/pinch (cursor point given): instant, so it feels responsive.
  const animated = cx === undefined;
  const base = (animated && mapAnimTarget) ? mapAnimTarget : {scale, tx, ty};
  if(!animated) cancelMapAnim();
  const mx = cx !== undefined ? cx : width/2;
  const my = cy !== undefined ? cy : height/2;
  const newScale = Math.min(9, Math.max(MIN_SCALE, base.scale*factor));
  const nTx = mx - (mx - base.tx) * (newScale/base.scale);
  const nTy = my - (my - base.ty) * (newScale/base.scale);
  if(animated){ animateMapTo(newScale, nTx, nTy, ZOOM_BTN_MS); return; }
  scale = newScale; tx = nTx; ty = nTy;
  clampPan();
  applyTransform();
}

function clampPan(){
  const {width, height} = mapViewportSize();
  if(!(width > 0) || !(height > 0)) return; // hidden: keep existing pan state
  if(!Number.isFinite(tx)) tx = -CROP_PX;
  if(!Number.isFinite(ty)) ty = 0;
  const scaledW = width * scale;
  // The left/right edges must never come closer than CROP_PX to the frame, at any
  // scale. Both are pushed CROP_PX past the viewport so overflow:hidden clips them
  // instead of showing a strip of bare ocean.
  const minTx = width - scaledW + CROP_PX;
  tx = Math.min(-CROP_PX, Math.max(minTx, tx));
  // Vertical: uses the real rendered height, so at MIN_SCALE it fills the viewport
  // exactly (minTy = 0) and there's no panning until you zoom in.
  const scaledHReal = height * (scale / MIN_SCALE);
  const minTy = Math.min(0, height - scaledHReal);
  ty = Math.min(0, Math.max(minTy, ty));
}

mapWrap.addEventListener('wheel', e=>{
  e.preventDefault();
  const rect = mapWrap.getBoundingClientRect();
  const mx = e.clientX - rect.left - MAPWRAP_BORDER;
  const my = e.clientY - rect.top - MAPWRAP_BORDER;
  zoomBy(e.deltaY<0 ? 1.15 : 1/1.15, mx, my);
}, {passive:false});

/* ---- pinch to zoom (mobile), next to single-pointer drag ---- */
const activePointers = new Map();
let pinching = false, pinchStartDist = 0, pinchStartScale = 1;

function pointerDist(p1, p2){ return Math.hypot(p1.x-p2.x, p1.y-p2.y); }
function pointerMid(p1, p2){ return {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2}; }

mapWrap.addEventListener('pointerdown', e=>{
  if(document.getElementById('mapError').classList.contains('show')) return; // offline error showing: allow normal text selection
  cancelMapAnim();
  activePointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(activePointers.size === 2){
    dragging = false;
    mapWrap.classList.remove('dragging');
    pinching = true;
    const pts = Array.from(activePointers.values());
    pinchStartDist = pointerDist(pts[0], pts[1]);
    pinchStartScale = scale;
  } else if(activePointers.size === 1){
    dragging=true; sx=e.clientX-tx; sy=e.clientY-ty;
    mapWrap.classList.add('dragging');
    const sel = window.getSelection();
    if(sel) sel.removeAllRanges();
    document.body.classList.add('map-panning');
  }
});
window.addEventListener('pointermove', e=>{
  if(activePointers.has(e.pointerId)){
    activePointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  }
  if(pinching && activePointers.size >= 2){
    const pts = Array.from(activePointers.values());
    const dist = pointerDist(pts[0], pts[1]);
    if(pinchStartDist > 0){
      const targetScale = Math.min(9, Math.max(MIN_SCALE, pinchStartScale * (dist / pinchStartDist)));
      const rect = mapWrap.getBoundingClientRect();
      const mid = pointerMid(pts[0], pts[1]);
      const mx = mid.x - rect.left - MAPWRAP_BORDER;
      const my = mid.y - rect.top - MAPWRAP_BORDER;
      zoomBy(targetScale/scale, mx, my);
    }
    return;
  }
  if(!dragging) return;
  tx = e.clientX-sx; ty = e.clientY-sy;
  clampPan();
  applyTransform();
  const sel = window.getSelection();
  if(sel && sel.toString()) sel.removeAllRanges();
});
function releasePointer(e){
  activePointers.delete(e.pointerId);
  if(activePointers.size < 2) pinching = false;
  if(activePointers.size === 0){
    dragging=false; mapWrap.classList.remove('dragging');
    document.body.classList.remove('map-panning');
  } else if(activePointers.size === 1 && !pinching){
    const [remaining] = activePointers.values();
    sx = remaining.x - tx; sy = remaining.y - ty;
    dragging = true;
    mapWrap.classList.add('dragging');
  }
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);

/* ================= COUNTRY SEARCH (map screen) ================= */
let searchMarker = null;
// The search box gets a focus ring only after keyboard (Tab) use, never for mouse or touch.
document.addEventListener('keydown', e => { if(e.key === 'Tab') document.body.classList.add('kbd-nav'); });
document.addEventListener('pointerdown', () => document.body.classList.remove('kbd-nav'));

const searchInput = document.getElementById('countrySearch');
const searchClearBtn = document.getElementById('searchClear');
const suggestionsBox = document.getElementById('searchSuggestions');
const suggestionsScroll = document.getElementById('suggestionsScroll');
const suggestionsThumbTrack = document.getElementById('suggestionsThumbTrack');
const suggestionsThumb = document.getElementById('suggestionsThumb');

const FADE_MS = 300;   // same speed as the screen fades
const CAMERA_MS = 900; // camera move: 0-300 old ring fades out, 300-600 travel only, 600-900 new ring fades in
let ringTimer = null;
const ZOOM_BTN_MS = 300; // +/- button zoom duration
let mapAnimTarget = null; // where the current animation is heading, if any
let mapAnimId = 0;

function cancelMapAnim(){ mapAnimId++; mapAnimTarget = null; }

// Animates scale and pan from the current view to the target. A newer animation
// or any manual input (wheel, drag, buttons) cancels it.
function animateMapTo(tScale, tTx, tTy, dur = CAMERA_MS){
  const myId = ++mapAnimId;
  // clamp the destination with the regular pan rules, then restore the live state
  const cur = {scale, tx, ty};
  scale = tScale; tx = tTx; ty = tTy;
  clampPan();
  const to = {scale, tx, ty};
  mapAnimTarget = to;
  scale = cur.scale; tx = cur.tx; ty = cur.ty;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || (Math.abs(to.scale-cur.scale) < 1e-3 && Math.abs(to.tx-cur.tx) < 0.5 && Math.abs(to.ty-cur.ty) < 0.5)){
    scale = to.scale; tx = to.tx; ty = to.ty; mapAnimTarget = null; applyTransform(); return;
  }
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; // easeInOutCubic
  const start = performance.now();
  function frame(now){
    if(myId !== mapAnimId) return;
    const t = Math.min(1, (now - start) / dur);
    const e = ease(t);
    scale = cur.scale + (to.scale - cur.scale) * e;
    tx = cur.tx + (to.tx - cur.tx) * e;
    ty = cur.ty + (to.ty - cur.ty) * e;
    applyTransform();
    if(t < 1) requestAnimationFrame(frame); else mapAnimTarget = null;
  }
  requestAnimationFrame(frame);
}

// Old ring fades out and is removed afterwards.
function clearSearchMarker(){
  if(ringTimer){ clearTimeout(ringTimer); ringTimer = null; }
  if(!searchMarker) return;
  const old = searchMarker;
  searchMarker = null;
  old.style.opacity = 0;
  setTimeout(()=>old.remove(), FADE_MS + 30);
}

// Centres and zooms the map on a country (by iso2) with a smooth animation. If the country
// has no label on the map (too small), a black ring fades in at its spot instead,
// and fades out on the next search or when ✕ is pressed.
function zoomToCountry(iso2){
  const info = countryIndex[iso2];
  clearSearchMarker();
  if(!info || !mapBuilt) return;

  if(!info.labeled){
    // the new ring only fades in during the last third of the animation
    ringTimer = setTimeout(()=>{
      ringTimer = null;
      const NS = "http://www.w3.org/2000/svg";
      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", info.centroid[0]);
      ring.setAttribute("cy", info.centroid[1]);
      ring.setAttribute("r", 7);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "#111");
      ring.setAttribute("stroke-width", "0.4");
      ring.style.opacity = 0;
      ring.style.transition = `opacity ${FADE_MS}ms ease`;
      const title = document.createElementNS(NS, "title");
      title.textContent = info.name;
      ring.appendChild(title);
      document.getElementById('worldSvg').appendChild(ring);
      void ring.getBoundingClientRect(); // commit opacity:0 so the fade-in runs
      ring.style.opacity = 1;
      searchMarker = ring;
    }, CAMERA_MS - FADE_MS);
  }

  const {width, height} = mapViewportSize();
  const pxPerUnit = width / lastVBW;
  const [[x0,y0],[x1,y1]] = info.zoomBounds || info.bounds;
  const w = Math.max(x1-x0, 6), h = Math.max(y1-y0, 6);
  const fill = info.tight ? 0.92 : 0.55;
  const newScale = Math.min(9, Math.max(MIN_SCALE, Math.min(
    (width*fill) / (w*pxPerUnit),
    (height*fill) / (h*pxPerUnit)
  )));
  const cx0 = ((x0+x1)/2) * pxPerUnit, cy0 = ((y0+y1)/2) * pxPerUnit;
  animateMapTo(newScale, width/2 - cx0*newScale, height/2 - cy0*newScale);
}

// Custom scroll thumb that replaces the hidden native scrollbar. Its size matches
// the visible part of the list and it moves on scroll.
function updateSuggestionsThumb(){
  const scrollH = suggestionsScroll.scrollHeight;
  const clientH = suggestionsScroll.clientHeight;
  const overflowing = scrollH > clientH + 1;
  suggestionsThumbTrack.classList.toggle('show', overflowing);
  if(!overflowing) return;
  const trackH = suggestionsThumbTrack.clientHeight; // measured once it's visible
  if(trackH <= 0) return;
  const thumbH = Math.max(20, trackH * (clientH / scrollH));
  const maxTop = trackH - thumbH;
  const scrollableDist = scrollH - clientH;
  const top = scrollableDist > 0 ? maxTop * (suggestionsScroll.scrollTop / scrollableDist) : 0;
  suggestionsThumb.style.height = thumbH + 'px';
  suggestionsThumb.style.top = top + 'px';
}
suggestionsScroll.addEventListener('scroll', updateSuggestionsThumb);
window.addEventListener('resize', updateSuggestionsThumb);

// Lowercases and strips accents, so "cote" finds Côte d'Ivoire and "reunion" finds Réunion.
function normalizeSearch(str){
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function matchesQuery(text, q){
  const t = normalizeSearch(text);
  return t.startsWith(q) || t.split(/[\s']+/).some(w => w.startsWith(q));
}

function renderSuggestions(query){
  const q = normalizeSearch(query.trim());
  if(!q){
    suggestionsBox.classList.remove('show');
    suggestionsScroll.innerHTML = '';
    suggestionsThumbTrack.classList.remove('show');
    return;
  }
  const matches = COUNTRIES.filter(c=>
    matchesQuery(c.n, q) || (SEARCH_ALIASES[c.iso] || []).some(a => matchesQuery(a, q))
  ).sort((a,b)=>a.n.localeCompare(b.n)).slice(0,8);

  suggestionsScroll.innerHTML = matches.length
    ? matches.map(c=>`<div class="suggestion-item" data-iso="${c.iso}">${c.n}</div>`).join('')
    : '<div class="suggestion-empty">No matches</div>';
  suggestionsScroll.scrollTop = 0;
  suggestionsBox.classList.add('show');
  updateSuggestionsThumb();
}

searchInput.addEventListener('input', ()=>{
  searchClearBtn.classList.toggle('show', searchInput.value.trim().length > 0);
  renderSuggestions(searchInput.value);
});

suggestionsScroll.addEventListener('click', e=>{
  const item = e.target.closest('.suggestion-item');
  if(!item || !item.dataset.iso) return;
  const c = COUNTRIES.find(x=>x.iso===item.dataset.iso);
  if(!c) return;
  searchInput.value = c.n;
  suggestionsBox.classList.remove('show');
  suggestionsScroll.innerHTML = '';
  suggestionsThumbTrack.classList.remove('show');
  zoomToCountry(c.iso);
});

searchClearBtn.addEventListener('click', ()=>{
  searchInput.value = '';
  searchClearBtn.classList.remove('show');
  suggestionsBox.classList.remove('show');
  suggestionsScroll.innerHTML = '';
  suggestionsThumbTrack.classList.remove('show');
  clearSearchMarker();
  searchInput.focus();
});

document.addEventListener('click', e=>{
  if(!e.target.closest('#searchWrap')) suggestionsBox.classList.remove('show');
});

/* ================= MINI-MAP HIGHLIGHTING THE CURRENT COUNTRY (quiz) ================= */
function drawMiniMapFallback(svg, NS){
  // No usable geometry: draw a placeholder so the mini-map isn't blank.
  const dot = document.createElementNS(NS,"circle");
  dot.setAttribute("cx", 150); dot.setAttribute("cy", 75); dot.setAttribute("r", 32);
  dot.setAttribute("fill", "#9fb8c9");
  dot.setAttribute("stroke", "#161616");
  dot.setAttribute("stroke-width", "1.6");
  svg.appendChild(dot);
}

async function updateMiniMap(c){
  const svg = document.getElementById('miniMap');
  svg.innerHTML = "";
  const NS = "http://www.w3.org/2000/svg";
  let data;
  try{ data = await loadWorldData(); }catch(e){ drawMiniMapFallback(svg, NS); return; }
  const iso3 = ISO2_TO_ISO3[c.iso];
  const feature = data.features.find(f=>f.id===iso3);
  if(!feature || !isValidGeometry(feature.geometry)){ drawMiniMapFallback(svg, NS); return; }

  try{
    const proj = d3.geoMercator().fitExtent([[12,12],[288,138]], feature);
    const pathGen = d3.geoPath(proj);
    const d = pathGen(feature);
    if(!d){ drawMiniMapFallback(svg, NS); return; }
    const p = document.createElementNS(NS,"path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "#9fb8c9");
    p.setAttribute("stroke", "#161616");
    p.setAttribute("stroke-width", "1.6");
    svg.appendChild(p);
  }catch(e){
    drawMiniMapFallback(svg, NS);
  }
}

/* ================= QUIZ ================= */
// The best streak is saved in localStorage, so it survives closing the tab or browser.
const BEST_STREAK_KEY = 'lrht_best_streak_v1';
function loadBestStreak(){
  try{
    const v = parseInt(localStorage.getItem(BEST_STREAK_KEY), 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  }catch(e){
    // localStorage can throw (private mode, disabled storage, some webviews),
    // so fall back to a record kept only for this session.
    return 0;
  }
}
function saveBestStreak(v){
  try{ localStorage.setItem(BEST_STREAK_KEY, String(v)); }catch(e){ /* storage unavailable */ }
}

let queue=[], current=null, streak=0, best=loadBestStreak();
let recordBroken = false;  // this round beat the saved record
let answerLocked = true;   // no answers while the card is fading
let quizStarting = false;
// Show the restored record right away; the markup starts with a hardcoded "0".
document.getElementById('recordVal').textContent = best;
document.getElementById('best').textContent = best;

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function failQuiz(quizError){
  const qc = document.getElementById('quizCard'), rc = document.getElementById('resultCard');
  const loading = document.getElementById('quizLoading');
  const dotsShowing = loading.classList.contains('show');
  loading.classList.remove('show');
  const vis = (qc.style.display !== 'none' && qc.style.opacity !== '0') ? qc
    : (rc.style.display !== 'none' && rc.style.opacity !== '0') ? rc : null;
  function done(){
    qc.style.display = 'none'; rc.style.display = 'none';
    showErrorBox(quizError);
  }
  if(vis){ vis.style.opacity = 0; setTimeout(done, 300); }
  else if(dotsShowing) setTimeout(done, 300); // let the dots fade out first
  else done();
}

async function startQuiz(){
  if(quizStarting) return;
  quizStarting = true;
  const quizError = document.getElementById('quizError');
  const loading = document.getElementById('quizLoading');
  const rcEl = document.getElementById('resultCard');
  const cardEl = document.getElementById('quizCard');
  // On Retry the error box fades out first instead of vanishing
  const errorGone = fadeOutErrorBox(quizError);
  document.getElementById('countryName').textContent = 'Loading…';
  if(cardEl.style.display !== 'none') cardEl.style.opacity = 0; // no half-filled card while waiting

  // Same dots as the flag wait, shown only if the data takes a moment
  let dataDone = false;
  setTimeout(() => errorGone.then(() => {
    if(dataDone) return;
    if(cardEl.style.display === 'none' && rcEl.style.display !== 'block'){
      cardEl.style.display = 'block'; // gives the dots some room
      cardEl.style.opacity = 0;
    }
    loading.classList.add('show');
  }), FLAG_LOADER_DELAY_MS);

  let loaded = true;
  try{
    await ensureCountriesReady();
  }catch(err){
    loaded = false; // offline, say: show the error, not an empty 0/0 round
  }
  dataDone = true;
  await errorGone;
  if(!loaded || TOTAL === 0){
    quizStarting = false;
    failQuiz(quizError);
    return;
  }

  queue = shuffle(COUNTRIES.slice());
  // countries with flags that are already loaded go first
  warmPicks.filter(w => flagCache[w.iso.toLowerCase()]).forEach(w => {
    const i = queue.findIndex(x => x.iso === w.iso);
    if(i >= 0) queue.push(queue.splice(i, 1)[0]);
  });
  warmPicks = [];
  streak = 0;
  recordBroken = false;
  flagsOff = false; // every new attempt tries flags again
  document.getElementById('streak').textContent = 0;
  const rc = document.getElementById('resultCard');
  const card = document.getElementById('quizCard');
  function activate(){
    rc.style.display = 'none';
    card.style.display = 'block';
    card.style.opacity = 0;
    quizStarting = false;
    nextQuestion();
  }
  if(rc.style.display === 'block'){
    rc.style.opacity = 0;
    setTimeout(activate, 300);
  } else {
    activate();
  }
}

/* ---- FLAGS: several independent CDNs, tried one after another ---- */
const FLAG_SOURCES = [
  c => `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${c}.svg`,
  c => `https://flagcdn.com/w320/${c}.png`,
  c => `https://raw.githubusercontent.com/lipis/flag-icons/v7.2.3/flags/4x3/${c}.svg`,
  c => `https://flagsapi.com/${c.toUpperCase()}/flat/64.png`
];
const FLAG_STAGGER_MS = 1500; // start the next source if the current one hasn't answered by then
const FLAG_LIMIT_MS = 8000;   // give up on a flag after this long
const flagCache = {};
let flagToken = 0;
let flagsOff = false; // set when a flag fails to load, so the rest of the attempt doesn't wait for flags
// The next source starts early when one fails. The first image to load wins.
function loadFlagUrl(code, onOk, onFail){
  let settled = false, started = 0, failed = 0, stagger = null;
  const imgs = [];
  const done = url => {
    if(settled) return;
    settled = true;
    clearTimeout(stagger); clearTimeout(limit);
    imgs.forEach(im => { im.onload = im.onerror = null; });
    if(url){ flagCache[code] = url; onOk(url); } else onFail();
  };
  const limit = setTimeout(() => done(null), FLAG_LIMIT_MS);
  const startNext = () => {
    clearTimeout(stagger);
    if(settled || started >= FLAG_SOURCES.length) return;
    const url = FLAG_SOURCES[started++](code);
    const im = new Image();
    im.referrerPolicy = 'no-referrer';
    const fail = () => {
      im.onload = im.onerror = null;
      if(++failed === FLAG_SOURCES.length) done(null); else startNext();
    };
    im.onload = () => im.naturalWidth > 0 ? done(url) : fail();
    im.onerror = fail;
    imgs.push(im);
    im.src = url;
    stagger = setTimeout(startNext, FLAG_STAGGER_MS);
  };
  startNext();
}
// ready() runs once the flag is shown or every source has failed.
function setFlag(c, ready){
  const el = document.getElementById('flagImg');
  const code = c.iso.toLowerCase();
  const my = ++flagToken;
  el.alt = c.n;
  el.style.visibility = 'hidden';
  const show = url => {
    if(my !== flagToken) return;
    el.src = url;
    // Wait for the image to decode so the old flag doesn't flash.
    const done = () => { if(my === flagToken){ el.style.visibility = 'visible'; if(ready) ready(); } };
    if(el.decode) el.decode().then(done, done); else done();
  };
  if(flagCache[code]){ show(flagCache[code]); return; }
  if(flagsOff){
    // Flags are off for this attempt, so show the card without waiting.
    el.removeAttribute('src');
    if(ready) ready();
    return;
  }
  loadFlagUrl(code, show,
    () => { if(my === flagToken){ flagsOff = true; el.removeAttribute('src'); if(ready) ready(); } });
}

function prefetchFlag(c){
  const code = c.iso.toLowerCase();
  if(!flagCache[code]) loadFlagUrl(code, ()=>{}, ()=>{});
}

// Preloads two random flags so the next round can start with one already loaded.
let warmPicks = [];
function warmUpFlags(){
  if(warmPicks.length || !COUNTRIES.length) return;
  warmPicks = shuffle(COUNTRIES.slice()).slice(0, 2);
  warmPicks.forEach(prefetchFlag);
}

const FLAG_LOADER_DELAY_MS = 250; // only show the loading dots if a flag takes longer than this

function nextQuestion(){
  if(queue.length===0){ finishRound(true); return; }
  answerLocked = true;
  current = queue.pop();
  const card = document.getElementById('quizCard');
  const loading = document.getElementById('quizLoading');
  card.style.opacity = 0;
  loading.classList.remove('show');
  setTimeout(()=>{
    document.getElementById('countryName').textContent = current.n;
    updateMiniMap(current);
    if(!flagsOff) queue.slice(-2).forEach(prefetchFlag);
    let resolved = false;
    // Delayed so a fast or already-resolved flag never flashes the dots on screen.
    const loaderTimer = setTimeout(() => {
      if(!resolved) loading.classList.add('show');
    }, FLAG_LOADER_DELAY_MS);
    // Show the card only when the flag is ready.
    setFlag(current, ()=>{
      resolved = true;
      clearTimeout(loaderTimer);
      loading.classList.remove('show');
      card.style.opacity = 1;
      answerLocked = false;
    });
  }, 300);
}

function updateRecordGold(){
  const maxed = best === TOTAL && TOTAL > 0;
  document.getElementById('best').classList.toggle('maxed', maxed);
  document.getElementById('totalVal').classList.toggle('maxed', maxed);
  document.getElementById('totalVal2').classList.toggle('maxed', maxed);
}

function answer(choice){
  if(answerLocked) return;
  if(choice===current.s){
    streak++;
    if(streak>best){
      best=streak;
      recordBroken = true;
      saveBestStreak(best);
      document.getElementById('best').textContent=best;
      document.getElementById('recordVal').textContent=best;
      updateRecordGold();
    }
    document.getElementById('streak').textContent = streak;
    nextQuestion();
  } else {
    finishRound(false, current);
  }
}

function finishRound(perfect, missed){
  answerLocked = true;
  warmUpFlags();
  const card = document.getElementById('quizCard');
  const rc = document.getElementById('resultCard');
  card.style.opacity = 0;
  setTimeout(()=>{
    card.style.display = 'none';
    const rt = document.getElementById('resultText');
    if(perfect){
      rt.innerHTML = `<div class="gold">${TOTAL}/${TOTAL}</div><p>🎉 You beat the game — you know the driving side of every country in the app</p>`;
    } else {
      rt.innerHTML = `<div class="score">${streak} / ${TOTAL}</div>
        <p>Wrong on "${missed.n}" because it actually has ${missed.s==='L' ? 'left-hand' : 'right-hand'} traffic</p>`;
    }
    rc.style.display = 'block';
    rc.style.opacity = 0;
    void rc.offsetWidth;
    rc.style.opacity = 1;
  }, 300);
}
