/* ═══════════════════════════════════════════════════════
   SKYLINE — Dynamic Weather Dashboard
   ═══════════════════════════════════════════════════════ */

/* ── State ─────────────────────────────────────────────── */
let currentUnit = 'C';
let currentWeatherData = null;
let searchTimeout = null;

/* ── DOM refs ───────────────────────────────────────────── */
const searchInput    = document.getElementById('searchInput');
const searchBtn      = document.getElementById('searchBtn');
const suggestions    = document.getElementById('suggestions');
const errorMsg       = document.getElementById('errorMsg');
const weatherDisplay = document.getElementById('weatherDisplay');
const emptyState     = document.getElementById('emptyState');
const skyBg          = document.querySelector('.sky-bg');
const skyLayer       = document.querySelector('.sky-layer');

/* ══════════════════════════════════════════════════════════
   THEME ENGINE
   Maps weather conditions → full atmospheric scenes
   ══════════════════════════════════════════════════════════ */

const THEMES = {
  clear_day: {
    gradient: 'linear-gradient(180deg, #0d6ecc 0%, #2a8fea 45%, #7ec8f5 80%, #b8e4ff 100%)',
    elements: ['sun', 'clouds_sparse'],
    label: 'clear_day'
  },
  clear_night: {
    gradient: 'linear-gradient(180deg, #050a1a 0%, #0a1535 40%, #0f2050 80%, #1a3060 100%)',
    elements: ['moon', 'stars'],
    label: 'clear_night'
  },
  partly_cloudy_day: {
    gradient: 'linear-gradient(180deg, #1575cc 0%, #3090e0 50%, #85c8f0 85%, #c0dff5 100%)',
    elements: ['sun_partial', 'clouds_medium'],
    label: 'partly_cloudy_day'
  },
  partly_cloudy_night: {
    gradient: 'linear-gradient(180deg, #080f22 0%, #0c1a38 45%, #142448 80%, #1e3260 100%)',
    elements: ['moon', 'stars_sparse', 'clouds_medium_dark'],
    label: 'partly_cloudy_night'
  },
  overcast_day: {
    gradient: 'linear-gradient(180deg, #546070 0%, #6e7f90 40%, #8a9aaa 75%, #a8b8c5 100%)',
    elements: ['clouds_heavy'],
    label: 'overcast_day'
  },
  overcast_night: {
    gradient: 'linear-gradient(180deg, #1a1e25 0%, #22282f 45%, #2c333c 80%, #363d47 100%)',
    elements: ['clouds_heavy_dark'],
    label: 'overcast_night'
  },
  rain_day: {
    gradient: 'linear-gradient(180deg, #2e3e50 0%, #3d5060 40%, #526070 75%, #6a7c8a 100%)',
    elements: ['clouds_heavy', 'rain_light'],
    label: 'rain_day'
  },
  rain_night: {
    gradient: 'linear-gradient(180deg, #0e1520 0%, #141d28 40%, #1c2530 75%, #242e38 100%)',
    elements: ['clouds_heavy_dark', 'rain_light'],
    label: 'rain_night'
  },
  heavy_rain_day: {
    gradient: 'linear-gradient(180deg, #1e2a35 0%, #263240 40%, #303e4c 75%, #3e4e5c 100%)',
    elements: ['clouds_heavy', 'rain_heavy'],
    label: 'heavy_rain_day'
  },
  heavy_rain_night: {
    gradient: 'linear-gradient(180deg, #080e14 0%, #0e1520 40%, #141c26 75%, #1c2530 100%)',
    elements: ['clouds_heavy_dark', 'rain_heavy'],
    label: 'heavy_rain_night'
  },
  thunderstorm: {
    gradient: 'linear-gradient(180deg, #0e1018 0%, #161820 40%, #1e2028 75%, #262830 100%)',
    elements: ['clouds_heavy_dark', 'rain_heavy', 'lightning'],
    label: 'thunderstorm'
  },
  snow_day: {
    gradient: 'linear-gradient(180deg, #7090a8 0%, #8aa8be 45%, #aac0d0 78%, #c8d8e4 100%)',
    elements: ['clouds_medium', 'snow'],
    label: 'snow_day'
  },
  snow_night: {
    gradient: 'linear-gradient(180deg, #1c2535 0%, #242e40 45%, #2e3a4e 78%, #38465a 100%)',
    elements: ['clouds_medium_dark', 'snow'],
    label: 'snow_night'
  },
  fog: {
    gradient: 'linear-gradient(180deg, #5a6a75 0%, #707e88 45%, #8a9aa4 78%, #a0aeb8 100%)',
    elements: ['fog'],
    label: 'fog'
  },
  drizzle_day: {
    gradient: 'linear-gradient(180deg, #4a5e6e 0%, #5c7080 45%, #708090 78%, #88989e 100%)',
    elements: ['clouds_medium', 'rain_light'],
    label: 'drizzle_day'
  },
  drizzle_night: {
    gradient: 'linear-gradient(180deg, #141c24 0%, #1c2430 45%, #242c38 78%, #2c3440 100%)',
    elements: ['clouds_medium_dark', 'rain_light'],
    label: 'drizzle_night'
  },
};

/* Map WMO weather code + is_day → theme key */
function getThemeKey(code, isDay) {
  const d = isDay ? '_day' : '_night';

  if (code === 0)              return 'clear' + d;
  if (code === 1)              return 'clear' + d;
  if (code === 2)              return 'partly_cloudy' + d;
  if (code === 3)              return 'overcast' + d;
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 55)   return 'drizzle' + d;
  if (code >= 61 && code <= 63)   return 'rain' + d;
  if (code === 65)             return 'heavy_rain' + d;
  if (code >= 71 && code <= 77)   return 'snow' + d;
  if (code >= 80 && code <= 82)   return (code === 82 ? 'heavy_rain' : 'rain') + d;
  if (code >= 85 && code <= 86)   return 'snow' + d;
  if (code >= 95)              return 'thunderstorm';
  return 'clear' + d;
}

/* ── Sky element builders ───────────────────────────────── */

function buildSun(partial = false) {
  const el = document.createElement('div');
  el.className = 'sun-glow';
  el.style.opacity = partial ? '0.7' : '1';
  if (partial) el.style.top = '-40px';
  return el;
}

function buildMoon() {
  const el = document.createElement('div');
  el.className = 'moon-glow';
  return el;
}

function buildStars(sparse = false) {
  const frag = document.createDocumentFragment();
  const count = sparse ? 40 : 120;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 70}%;
      width: ${size}px; height: ${size}px;
      animation-duration: ${2 + Math.random() * 4}s;
      animation-delay: ${Math.random() * 4}s;
    `;
    frag.appendChild(s);
  }
  return frag;
}

function buildClouds(count, dark = false, big = false) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'cloud' + (dark ? ' storm-cloud' : '');
    const w = big ? (180 + Math.random() * 220) : (100 + Math.random() * 160);
    const h = w * 0.38;
    const top = big ? (Math.random() * 30) : (5 + Math.random() * 35);
    const dur = 60 + Math.random() * 80;
    const delay = -Math.random() * dur;
    c.style.cssText = `
      width: ${w}px; height: ${h}px;
      top: ${top}%;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      opacity: ${dark ? (0.6 + Math.random() * 0.3) : (0.5 + Math.random() * 0.4)};
    `;
    frag.appendChild(c);
  }
  return frag;
}

function buildRain(heavy = false) {
  const frag = document.createDocumentFragment();
  const count = heavy ? 180 : 80;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'rain-drop' + (heavy ? ' heavy' : '');
    const h = heavy ? (18 + Math.random() * 22) : (12 + Math.random() * 16);
    d.style.cssText = `
      left: ${Math.random() * 105}%;
      top: ${-Math.random() * 20}%;
      height: ${h}px;
      animation-duration: ${heavy ? (0.5 + Math.random() * 0.4) : (0.8 + Math.random() * 0.6)}s;
      animation-delay: ${-Math.random() * 1.5}s;
      opacity: ${0.5 + Math.random() * 0.4};
    `;
    frag.appendChild(d);
  }
  return frag;
}

function buildSnow() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'snow-flake';
    const size = 3 + Math.random() * 6;
    s.style.cssText = `
      left: ${Math.random() * 102}%;
      top: ${-Math.random() * 10}%;
      width: ${size}px; height: ${size}px;
      animation-duration: ${4 + Math.random() * 6}s;
      animation-delay: ${-Math.random() * 8}s;
      opacity: ${0.6 + Math.random() * 0.4};
    `;
    frag.appendChild(s);
  }
  return frag;
}

function buildLightning() {
  const el = document.createElement('div');
  el.className = 'lightning';
  return el;
}

function buildFog() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 5; i++) {
    const f = document.createElement('div');
    f.className = 'fog-band';
    f.style.cssText = `
      top: ${10 + i * 15}%;
      animation-duration: ${10 + i * 3}s;
      animation-delay: ${-i * 2}s;
      opacity: ${0.4 + i * 0.06};
    `;
    frag.appendChild(f);
  }
  return frag;
}

/* ── Apply theme ────────────────────────────────────────── */
function applyTheme(code, isDay) {
  const key = getThemeKey(code, isDay);
  const theme = THEMES[key] || THEMES['clear_day'];

  // Transition gradient
  skyBg.style.background = theme.gradient;

  // Rebuild sky layer
  skyLayer.innerHTML = '';

  theme.elements.forEach(el => {
    switch (el) {
      case 'sun':               skyLayer.appendChild(buildSun(false)); break;
      case 'sun_partial':       skyLayer.appendChild(buildSun(true));  break;
      case 'moon':              skyLayer.appendChild(buildMoon());      break;
      case 'stars':             skyLayer.appendChild(buildStars(false)); break;
      case 'stars_sparse':      skyLayer.appendChild(buildStars(true));  break;
      case 'clouds_sparse':     skyLayer.appendChild(buildClouds(2, false, false)); break;
      case 'clouds_medium':     skyLayer.appendChild(buildClouds(4, false, false)); break;
      case 'clouds_heavy':      skyLayer.appendChild(buildClouds(7, false, true));  break;
      case 'clouds_medium_dark':skyLayer.appendChild(buildClouds(4, true, false));  break;
      case 'clouds_heavy_dark': skyLayer.appendChild(buildClouds(7, true, true));   break;
      case 'rain_light':        skyLayer.appendChild(buildRain(false)); break;
      case 'rain_heavy':        skyLayer.appendChild(buildRain(true));  break;
      case 'snow':              skyLayer.appendChild(buildSnow());       break;
      case 'lightning':         skyLayer.appendChild(buildLightning());  break;
      case 'fog':               skyLayer.appendChild(buildFog());        break;
    }
  });
}

/* ══════════════════════════════════════════════════════════
   WEATHER DATA
   ══════════════════════════════════════════════════════════ */

function interpretWeatherCode(code, isDay = 1) {
  const map = {
    0:  { label: 'Clear Sky',           icon: isDay ? '☀️' : '🌕' },
    1:  { label: 'Mainly Clear',        icon: isDay ? '🌤️' : '🌙' },
    2:  { label: 'Partly Cloudy',       icon: '⛅' },
    3:  { label: 'Overcast',            icon: '☁️' },
    45: { label: 'Foggy',               icon: '🌫️' },
    48: { label: 'Icy Fog',             icon: '🌫️' },
    51: { label: 'Light Drizzle',       icon: '🌦️' },
    53: { label: 'Drizzle',             icon: '🌦️' },
    55: { label: 'Heavy Drizzle',       icon: '🌧️' },
    61: { label: 'Light Rain',          icon: '🌧️' },
    63: { label: 'Rain',                icon: '🌧️' },
    65: { label: 'Heavy Rain',          icon: '🌧️' },
    71: { label: 'Light Snow',          icon: '🌨️' },
    73: { label: 'Snow',                icon: '❄️' },
    75: { label: 'Heavy Snow',          icon: '❄️' },
    77: { label: 'Snow Grains',         icon: '🌨️' },
    80: { label: 'Light Showers',       icon: '🌦️' },
    81: { label: 'Showers',             icon: '🌧️' },
    82: { label: 'Heavy Showers',       icon: '⛈️' },
    85: { label: 'Snow Showers',        icon: '🌨️' },
    86: { label: 'Heavy Snow Showers',  icon: '❄️' },
    95: { label: 'Thunderstorm',        icon: '⛈️' },
    96: { label: 'Thunderstorm + Hail', icon: '⛈️' },
    99: { label: 'Heavy Thunderstorm',  icon: '⛈️' },
  };
  return map[code] || { label: 'Unknown', icon: '🌡️' };
}

function toDisplay(celsius) {
  return currentUnit === 'F' ? Math.round(celsius * 9 / 5 + 32) : Math.round(celsius);
}
function unitLabel() { return `°${currentUnit}`; }

/* ── API calls ──────────────────────────────────────────── */
async function geocode(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function fetchWeather(lat, lon, timezone) {
  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${lat}&longitude=${lon}`,
    `&timezone=${encodeURIComponent(timezone)}`,
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,surface_pressure,visibility,uv_index,is_day`,
    `&hourly=temperature_2m,weather_code,precipitation_probability`,
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset`,
    `&forecast_days=7`,
    `&wind_speed_unit=kmh`
  ].join('');
  const res = await fetch(url);
  return res.json();
}

/* ── Search ─────────────────────────────────────────────── */
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { hideSuggestions(); return; }
  searchTimeout = setTimeout(() => loadSuggestions(q), 300);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { hideSuggestions(); doSearch(); }
});
searchBtn.addEventListener('click', () => { hideSuggestions(); doSearch(); });
document.addEventListener('click', e => {
  if (!e.target.closest('.search-bar') && !e.target.closest('.suggestions')) hideSuggestions();
});

async function loadSuggestions(q) {
  try {
    const results = await geocode(q);
    if (!results.length) { hideSuggestions(); return; }
    suggestions.innerHTML = '';
    results.slice(0, 5).forEach(r => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      const parts = [r.admin1, r.country].filter(Boolean).join(', ');
      div.innerHTML = `<div class="city-name">${r.name}</div><div class="city-detail">${parts}</div>`;
      div.addEventListener('click', () => {
        searchInput.value = r.name;
        hideSuggestions();
        loadCity(r);
      });
      suggestions.appendChild(div);
    });
    suggestions.classList.remove('hidden');
  } catch { hideSuggestions(); }
}

function hideSuggestions() { suggestions.classList.add('hidden'); }

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  showError('');
  try {
    const results = await geocode(q);
    if (!results.length) { showError(`No results for "${q}"`); return; }
    loadCity(results[0]);
  } catch { showError('Could not fetch location data. Try again.'); }
}

/* ── Load city ──────────────────────────────────────────── */
async function loadCity(location) {
  searchBtn.textContent = '...';
  searchBtn.disabled = true;
  showError('');
  try {
    const tz = location.timezone || 'auto';
    const data = await fetchWeather(location.latitude, location.longitude, tz);
    currentWeatherData = { data, location };
    renderWeather(data, location);
  } catch { showError('Could not fetch weather. Please try again.'); }
  finally {
    searchBtn.textContent = 'Search';
    searchBtn.disabled = false;
  }
}

/* ── Render ─────────────────────────────────────────────── */
function renderWeather(data, location) {
  const c = data.current;
  const h = data.hourly;
  const d = data.daily;

  // Apply dynamic sky theme first
  applyTheme(c.weather_code, c.is_day);

  // Show panel
  weatherDisplay.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // Location
  const parts = [location.name, location.admin1, location.country].filter(Boolean);
  document.getElementById('locationLabel').textContent = parts.join(' · ').toUpperCase();

  // Temp
  document.getElementById('tempValue').textContent = toDisplay(c.temperature_2m) + unitLabel();
  document.getElementById('feelsLike').textContent = `Feels ${toDisplay(c.apparent_temperature)}${unitLabel()}`;

  // Condition
  const cond = interpretWeatherCode(c.weather_code, c.is_day);
  document.getElementById('conditionIcon').textContent = cond.icon;
  document.getElementById('conditionText').textContent = cond.label;

  // Stats
  document.getElementById('humidity').textContent   = `${c.relative_humidity_2m}%`;
  document.getElementById('wind').textContent       = `${Math.round(c.wind_speed_10m)} km/h`;
  document.getElementById('precip').textContent     = `${c.precipitation} mm`;
  document.getElementById('uvIndex').textContent    = c.uv_index ?? '—';
  document.getElementById('visibility').textContent = c.visibility != null
    ? `${(c.visibility / 1000).toFixed(1)} km` : '—';
  document.getElementById('pressure').textContent   = `${Math.round(c.surface_pressure)} hPa`;

  renderHourly(h);
  renderDaily(d);
  renderSun(d.sunrise[0], d.sunset[0]);
}

function renderHourly(h) {
  const container = document.getElementById('hourlyScroll');
  container.innerHTML = '';
  const now = new Date();
  let startIdx = 0;
  for (let i = 0; i < h.time.length; i++) {
    if (new Date(h.time[i]) >= now) { startIdx = i; break; }
  }
  for (let i = startIdx; i < Math.min(startIdx + 24, h.time.length); i++) {
    const t = new Date(h.time[i]);
    const isNow = i === startIdx;
    const label = isNow ? 'Now' : t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const icon = interpretWeatherCode(h.weather_code[i]).icon;
    const temp = toDisplay(h.temperature_2m[i]);
    const precip = h.precipitation_probability[i];
    const card = document.createElement('div');
    card.className = 'hour-card' + (isNow ? ' now' : '');
    card.innerHTML = `
      <div class="hour-time">${label}</div>
      <div class="hour-icon">${icon}</div>
      <div class="hour-temp">${temp}${unitLabel()}</div>
      ${precip > 0 ? `<div class="hour-precip">💧${precip}%</div>` : ''}
    `;
    container.appendChild(card);
  }
}

function renderDaily(d) {
  const container = document.getElementById('dailyGrid');
  container.innerHTML = '';
  const absMin = Math.min(...d.temperature_2m_min);
  const absMax = Math.max(...d.temperature_2m_max);
  const range  = absMax - absMin || 1;

  d.time.forEach((dateStr, i) => {
    const date    = new Date(dateStr + 'T12:00:00');
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : date.toLocaleDateString([], { weekday: 'long' });
    const icon    = interpretWeatherCode(d.weather_code[i]).icon;
    const tMin    = toDisplay(d.temperature_2m_min[i]);
    const tMax    = toDisplay(d.temperature_2m_max[i]);
    const precip  = d.precipitation_sum[i];
    const barLeft = ((d.temperature_2m_min[i] - absMin) / range) * 100;
    const barW    = ((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / range) * 100;
    const row = document.createElement('div');
    row.className = 'day-row';
    row.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${icon}</div>
      <div class="day-bar-container">
        <span class="day-temp-min">${tMin}°</span>
        <div class="day-bar-track">
          <div class="day-bar-fill" style="margin-left:${barLeft}%;width:${Math.max(barW,8)}%"></div>
        </div>
        <span class="day-temp-max">${tMax}°</span>
      </div>
      <div class="day-precip-col">${precip > 0 ? `💧 ${precip.toFixed(1)}mm` : '—'}</div>
    `;
    container.appendChild(row);
  });
}

function renderSun(sunriseISO, sunsetISO) {
  const rise = new Date(sunriseISO);
  const set  = new Date(sunsetISO);
  const now  = new Date();
  document.getElementById('sunrise').textContent = rise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('sunset').textContent  = set.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const total   = set - rise;
  const elapsed = now - rise;
  const pct     = Math.max(0, Math.min(1, elapsed / total));
  const t = pct;
  const cx = 2*(1-t)*t*100 + t*t*190 + (1-t)*(1-t)*10;
  const cy = 2*(1-t)*t*10  + t*t*90  + (1-t)*(1-t)*90;
  const dot = document.getElementById('sunPosition');
  if (dot) { dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); }
}

/* ── Unit toggle ────────────────────────────────────────── */
function setUnit(unit) {
  currentUnit = unit;
  document.getElementById('btnC').classList.toggle('active', unit === 'C');
  document.getElementById('btnF').classList.toggle('active', unit === 'F');
  if (currentWeatherData) renderWeather(currentWeatherData.data, currentWeatherData.location);
}

/* ── Clock ──────────────────────────────────────────────── */
function updateClock() {
  const el = document.getElementById('localTime');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

/* ── Error ──────────────────────────────────────────────── */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.toggle('hidden', !msg);
}

/* ── Init ───────────────────────────────────────────────── */
// Set a default sky while loading
applyTheme(0, new Date().getHours() >= 6 && new Date().getHours() < 20 ? 1 : 0);

loadCity({
  name: 'Toronto', admin1: 'Ontario', country: 'Canada',
  latitude: 43.7001, longitude: -79.4163, timezone: 'America/Toronto'
});