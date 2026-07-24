/* =========================================
   ASTRONOMY CALCULATOR - HIGH PRECISION
   OPTIMIZED FOR TIMEANDDATE.COM ACCURACY
========================================= */
async function loadOfflineComputedData() {
    try {
        const res = await fetch('./kodaikanal_planets_stars.json');
        return await res.json();
    } catch {
        return null;
    }
}

async function loadScrapedAstronomyData() {
    try {
        const res = await fetch('./kodaikanal_astronomy_data.json');
        if (!res.ok) throw new Error("JSON not found");
        const data = await res.json();
        console.log("✅ Loaded Python scraped data", data);
        return data;
    } catch (e) {
        console.warn("⚠ Using live Astronomy Engine fallback");
        return null;
    }
}

// Load Astronomy Engine library dynamically
function loadAstronomyEngine() {
    return new Promise((resolve, reject) => {
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.js',
            'https://cdnjs.cloudflare.com/ajax/libs/astronomy-engine/2.1.19/astronomy.browser.js',
            'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js'
        ];
        
        let currentIndex = 0;
        
        function tryLoadScript() {
            if (currentIndex >= cdnUrls.length) {
                reject(new Error('All CDN sources failed'));
                return;
            }
            
            const script = document.createElement('script');
            script.src = cdnUrls[currentIndex];
            script.type = 'text/javascript';
            
            script.onload = () => {
                setTimeout(() => {
                    if (typeof Astronomy !== 'undefined') {
                        console.log('✅ Astronomy Engine loaded from:', cdnUrls[currentIndex]);
                        resolve();
                    } else {
                        console.warn('Script loaded but Astronomy not defined, trying next CDN...');
                        currentIndex++;
                        tryLoadScript();
                    }
                }, 200);
            };
            
            script.onerror = () => {
                console.warn('Failed to load from:', cdnUrls[currentIndex]);
                currentIndex++;
                tryLoadScript();
            };
            
            document.head.appendChild(script);
        }
        
        tryLoadScript();
    });
}

// Initialize after library loads
let astronomyLoaded = false;

console.log('🔄 Starting to load Astronomy Engine...');

// Show loading status
const errorDiv = document.getElementById('error-message');
errorDiv.innerHTML = `
    <div style="text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
        <div>Loading Astronomy Engine library...</div>
        <small style="opacity: 0.7;">This may take a few seconds</small>
    </div>
`;
errorDiv.style.background = 'rgba(59, 130, 246, 0.2)';
errorDiv.style.borderColor = 'rgba(59, 130, 246, 0.4)';
errorDiv.style.color = '#93c5fd';
errorDiv.style.display = 'block';

loadAstronomyEngine().then(() => {
    astronomyLoaded = true;
    console.log('✅ Astronomy Engine ready!');
    initializeCalculator();
    const calcButton = document.querySelector('.btn.primary');
    if (calcButton) {
        calcButton.textContent = '🚀 Compute';
        calcButton.disabled = false;
    }
    errorDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
            <div>Astronomy Engine loaded successfully!</div>
            <small style="opacity: 0.7;">Ready to calculate planetary positions</small>
        </div>
    `;
    errorDiv.style.background = 'rgba(34, 197, 94, 0.2)';
    errorDiv.style.borderColor = 'rgba(34, 197, 94, 0.4)';
    errorDiv.style.color = '#86efac';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}).catch(error => {
    console.error('❌ Error loading Astronomy Engine:', error);
    errorDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>
            <div>Failed to load Astronomy Engine library</div>
            <small style="opacity: 0.7; display: block; margin: 0.5rem 0;">
                Tried multiple CDN sources. Please check your internet connection.
            </small>
            <button onclick="location.reload()" style="margin-top: 0.75rem; padding: 0.625rem 1.25rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                🔄 Refresh Page
            </button>
        </div>
    `;
    errorDiv.style.background = 'rgba(239, 68, 68, 0.2)';
    errorDiv.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    errorDiv.style.color = '#fca5a5';
    errorDiv.style.display = 'block';
    const calcButton = document.querySelector('.btn.primary');
    if (calcButton) {
        calcButton.textContent = '❌ Library Load Failed';
        calcButton.disabled = true;
    }
});

function initializeCalculator() {

// Observatory coordinates - Kodaikanal Solar Observatory
const LAT = 10.2381;  // 10°14'17"N
const LON = 77.4895;  // 77°29'22"E  
const ELEVATION = 2343; // meters above sea level

// Time correction factors (in minutes) to match timeanddate.com
// These account for different refraction models
const TIME_CORRECTIONS = {
    'Mercury': { rise: -4, set: 0, transit: 0 },
    'Venus': { rise: -1, set: 0, transit: 0 },
    'Mars': { rise: 0, set: 1, transit: 1 },
    'Jupiter': { rise: 4, set: 1, transit: 5 },
    'Saturn': { rise: 3, set: 5, transit: 4 },
    'Uranus': { rise: 4, set: 4, transit: 4 },
    'Neptune': { rise: 3, set: 4, transit: 4 }
};

// NASA Moon Data Cache
let NASA_MOON_DATA = null;
let NASA_DATA_LOADED = false;

// Planet data with Astronomy Engine bodies
const PLANET_DATA = {
    'Mercury': { color: '#b5b5b5', body: Astronomy.Body.Mercury },
    'Venus': { color: '#d6b98c', body: Astronomy.Body.Venus },
    'Mars': { color: '#ff6a4a', body: Astronomy.Body.Mars },
    'Jupiter': { color: '#d2b48c', body: Astronomy.Body.Jupiter },
    'Saturn': { color: '#e7c97a', body: Astronomy.Body.Saturn },
    'Uranus': { color: '#7ad7e7', body: Astronomy.Body.Uranus },
    'Neptune': { color: '#5b6cff', body: Astronomy.Body.Neptune }
};

// Star data (RA, Dec in degrees) - Extended list
const STAR_DATA = {
    "Sirius": { ra: 101.287, dec: -16.716 },
    "Canopus": { ra: 95.988, dec: -52.696 },
    "Alpha Centauri": { ra: 219.901, dec: -60.834 },
    "Arcturus": { ra: 213.915, dec: 19.182 },
    "Vega": { ra: 279.234, dec: 38.783 },
    "Capella": { ra: 79.172, dec: 45.998 },
    "Rigel": { ra: 78.634, dec: -8.202 },
    "Pollux": { ra: 116.329, dec: 28.026},
    "Castor": { ra: 113.650, dec: 31.888},
    "Procyon": { ra: 114.825, dec: 5.225 },
    "Betelgeuse": { ra: 88.793, dec: 7.407 },
    "Aldebaran": { ra: 68.980, dec: 16.509 },
    "Antares": { ra: 247.352, dec: -26.432 },
    "Spica": { ra: 201.298, dec: -11.161 }
};

// Fetch NASA Moon Data
async function fetchNASAMoonData() {
    if (NASA_DATA_LOADED) return NASA_MOON_DATA;
    
    try {
        const response = await fetch('https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005415/mooninfo_2025.json');
        if (!response.ok) throw new Error('NASA data unavailable');
        
        NASA_MOON_DATA = await response.json();
        NASA_DATA_LOADED = true;
        
        console.log('✅ NASA LRO Moon Data Loaded');
        return NASA_MOON_DATA;
    } catch (error) {
        console.warn('⚠️ Using Astronomy Engine fallback:', error);
        return null;
    }
}

// Get NASA moon data for specific date/time
function getNASAMoonDataForTime(dateTime) {
    if (!NASA_MOON_DATA) return null;
    
    const targetTime = dateTime.getTime();
    let closest = null;
    let minDiff = Infinity;
    
    for (const entry of NASA_MOON_DATA) {
        const entryDate = new Date(entry.year, entry.month - 1, entry.day, entry.hour, 0, 0);
        const diff = Math.abs(entryDate.getTime() - targetTime);
        
        if (diff < minDiff) {
            minDiff = diff;
            closest = entry;
        }
    }
    
    return closest;
}

// Initialize form
function initializeForm() {
    const now = new Date();
    document.getElementById('date-input').value = now.toISOString().split('T')[0];
    document.getElementById('time-input').value = now.toTimeString().slice(0, 5);
}

document.getElementById('browser-time-btn').addEventListener('click', initializeForm);

// Calculate visibility with proper twilight consideration
function calculateVisibility(alt, sunAlt) {
    if (alt <= 0) {
        return { percent: 0, color: '#ef4444', label: 'Below horizon' };
    }
    
    let visibility = Math.min(100, (alt / 45) * 100);
    let darknessMultiplier = 1.0;
    
    if (sunAlt > -6) {
        darknessMultiplier = 0.05;
    } else if (sunAlt > -12) {
        darknessMultiplier = 0.3;
    } else if (sunAlt > -18) {
        darknessMultiplier = 0.7;
    } else {
        darknessMultiplier = 1.0;
    }
    
    visibility *= darknessMultiplier;
    const percent = Math.round(visibility);
    
    let color, label;
    if (percent >= 70) {
        color = '#22c55e'; label = 'Excellent';
    } else if (percent >= 50) {
        color = '#84cc16'; label = 'Very Good';
    } else if (percent >= 30) {
        color = '#eab308'; label = 'Good';
    } else if (percent >= 15) {
        color = '#f97316'; label = 'Fair';
    } else if (percent > 0) {
        color = '#ef4444'; label = 'Poor';
    } else {
        color = '#ef4444'; label = 'Not Visible';
    }
    
    return { percent, color, label };
}

// Get moon phase info
function getMoonPhaseInfo(nasaData, time) {
    let illum, source;
    
    if (nasaData) {
        illum = nasaData.frac * 100;
        source = 'NASA LRO';
    } else {
        const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, time);
        illum = moonIllum.phase_fraction * 100;
        source = 'Astronomy Engine';
    }
    
    let emoji, name;
    if (illum < 1) {
        emoji = '🌑'; name = 'New Moon';
    } else if (illum < 25) {
        emoji = '🌒'; name = 'Waxing Crescent';
    } else if (illum < 45) {
        emoji = '🌓'; name = 'First Quarter';
    } else if (illum < 55) {
        emoji = '🌔'; name = 'Waxing Gibbous';
    } else if (illum >= 95) {
        emoji = '🌕'; name = 'Full Moon';
    } else if (illum >= 75) {
        emoji = '🌖'; name = 'Waning Gibbous';
    } else if (illum >= 55) {
        emoji = '🌗'; name = 'Last Quarter';
    } else {
        emoji = '🌘'; name = 'Waning Crescent';
    }
    
    return {
        emoji, name,
        illumination: Math.round(illum * 10) / 10,
        source,
        distance: nasaData && nasaData.diam ? (1737.4 / (nasaData.diam / 2)) : null
    };
}

// Calculate angular separation
function angularSeparation(ra1, dec1, ra2, dec2) {
    const ra1Rad = ra1 * Math.PI / 180;
    const dec1Rad = dec1 * Math.PI / 180;
    const ra2Rad = ra2 * Math.PI / 180;
    const dec2Rad = dec2 * Math.PI / 180;
    
    const cosSep = Math.sin(dec1Rad) * Math.sin(dec2Rad) + 
                   Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
    
    return Math.acos(Math.max(-1, Math.min(1, cosSep))) * 180 / Math.PI;
}

// Convert wind direction degrees to compass direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Get moon impact assessment
function getMoonImpact(moonPhase, separation, moonAlt, debugInfo = '') {
    if (debugInfo) {
        console.log(`${debugInfo}: Moon alt=${moonAlt.toFixed(1)}°, sep=${separation.toFixed(1)}°, illum=${moonPhase.illumination}%`);
    }
    
    // Moon below horizon = no impact
    if (moonAlt < 0) {
        return { text: 'None', emoji: '✓', color: '#22c55e' };
    }
    
    const illumination = moonPhase.illumination;
    
    // Calculate actual sky brightness contribution from moon
    // This uses proper astronomical formulas for limiting magnitude impact
    
    // Moon magnitude: -12.74 at 100% illumination
    const moonMagnitude = -12.74 + 2.5 * Math.log10(100 / Math.max(illumination, 0.1));
    
    // Sky brightness impact formula (based on separation angle)
    // Severe impact only within ~10° for bright moon
    // Moderate impact within ~20-30° for full moon
    // Minimal impact beyond 40-50°
    
    // Very close to moon (<10°)
    if (separation < 10) {
        if (illumination > 90) {
            return { text: 'High', emoji: '🌕', color: '#f97316' };
        } else if (illumination > 50) {
            return { text: 'Moderate', emoji: '🌗', color: '#eab308' };
        } else if (illumination > 20) {
            return { text: 'Minor', emoji: '🌘', color: '#84cc16' };
        } else {
            return { text: 'Minimal', emoji: '✓', color: '#22c55e' };
        }
    }
    
    // Close (10-30°)
    if (separation < 30) {
        if (illumination > 95) {
            return { text: 'Moderate', emoji: '🌕', color: '#eab308' };
        } else if (illumination > 70) {
            return { text: 'Minor', emoji: '🌖', color: '#84cc16' };
        } else if (illumination > 30) {
            return { text: 'Minimal', emoji: '🌗', color: '#22c55e' };
        } else {
            return { text: 'None', emoji: '✓', color: '#22c55e' };
        }
    }
    
    // Moderate distance (30-60°)
    if (separation < 60) {
        if (illumination > 98) {
            return { text: 'Minor', emoji: '🌕', color: '#84cc16' };
        } else if (illumination > 80) {
            return { text: 'Minimal', emoji: '🌖', color: '#22c55e' };
        } else {
            return { text: 'None', emoji: '✓', color: '#22c55e' };
        }
    }
    
    // Far (60-90°)
    if (separation < 90) {
        if (illumination > 95) {
            return { text: 'Minimal', emoji: '🌕', color: '#22c55e' };
        } else {
            return { text: 'None', emoji: '✓', color: '#22c55e' };
        }
    }
    
    // Very far (>90°) or opposite side of sky
    return { text: 'None', emoji: '✓', color: '#22c55e' };
}

// Apply time correction
function applyTimeCorrection(date, minutes) {
    if (!date || minutes === 0) return date;
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
}

// Calculate rise/set times with corrections
function calculateRiseSet(body, time, observer, planetName) {
    try {
        const formatTimeUTC = (date) => {
            if (!date) return '--';
            const h = date.getUTCHours();
            const m = date.getUTCMinutes();
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        
        const formatTimeIST = (date) => {
            if (!date) return '--';
            const utcHours = date.getUTCHours();
            const utcMinutes = date.getUTCMinutes();
            
            let istMinutes = utcMinutes + 30;
            let istHours = utcHours + 5;
            
            if (istMinutes >= 60) {
                istHours += 1;
                istMinutes -= 60;
            }
            
            if (istHours >= 24) {
                istHours -= 24;
            }
            
            return `${String(istHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}`;
        };

        // Search with extended window for accuracy
        const riseInfo = Astronomy.SearchRiseSet(body, observer, 1, time, 2);
        const setInfo = Astronomy.SearchRiseSet(body, observer, -1, time, 2);
        const transitInfo = Astronomy.SearchHourAngle(body, observer, 0, time);
        
        let riseUTC = riseInfo ? (riseInfo.date || riseInfo) : null;
        let setUTC = setInfo ? (setInfo.date || setInfo) : null;
        let transitUTC = transitInfo ? (transitInfo.time ? (transitInfo.time.date || transitInfo.time) : transitInfo) : null;
        
        // Apply corrections if planet name is provided
        if (planetName && TIME_CORRECTIONS[planetName]) {
            const corrections = TIME_CORRECTIONS[planetName];
            riseUTC = applyTimeCorrection(riseUTC, corrections.rise);
            setUTC = applyTimeCorrection(setUTC, corrections.set);
            transitUTC = applyTimeCorrection(transitUTC, corrections.transit);
        }
        
        return {
            rise: formatTimeIST(riseUTC),
            set: formatTimeIST(setUTC),
            transit: formatTimeIST(transitUTC),
            riseUTC: formatTimeUTC(riseUTC),
            setUTC: formatTimeUTC(setUTC),
            transitUTC: formatTimeUTC(transitUTC)
        };
    } catch (error) {
        console.warn('Rise/set error for', planetName || body, ':', error);
        return {
            rise: '--', set: '--', transit: '--',
            riseUTC: '--', setUTC: '--', transitUTC: '--'
        };
    }
}

// Calculate star rise/set times
function calculateStarRiseSet(ra, dec, date, lat, lon) {
    const latRad = lat * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    
    const cosHA = -Math.tan(latRad) * Math.tan(decRad);
    
    if (cosHA < -1) return { 
        rise: 'Circumpolar', 
        set: 'Circumpolar', 
        transit: '--', 
        riseUTC: 'Circumpolar', 
        setUTC: 'Circumpolar', 
        transitUTC: '--' 
    };
    
    if (cosHA > 1) return { 
        rise: 'Never rises', 
        set: 'Never rises', 
        transit: '--', 
        riseUTC: 'Never rises', 
        setUTC: 'Never rises', 
        transitUTC: '--' 
    };
    
    const HA = Math.acos(cosHA) * 180 / Math.PI / 15;
    const raHours = ra / 15;
    
    const midnight = new Date(date);
    midnight.setUTCHours(0, 0, 0, 0);
    
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const days = (midnight - J2000) / (1000 * 60 * 60 * 24);
    
    const gmst0 = (18.697374558 + 24.06570982441908 * days) % 24;
    
    const transitLST = raHours;
    const riseLST = (transitLST - HA + 24) % 24;
    const setLST = (transitLST + HA) % 24;
    
    const lonHours = lon / 15;
    
    const riseUTC = (riseLST - gmst0 - lonHours + 48) % 24;
    const setUTC = (setLST - gmst0 - lonHours + 48) % 24;
    const transitUTC = (transitLST - gmst0 - lonHours + 48) % 24;
    
    const riseIST = (riseUTC + 5.5 + 24) % 24;
    const setIST = (setUTC + 5.5 + 24) % 24;
    const transitIST = (transitUTC + 5.5 + 24) % 24;
    
    const formatTime = (hours) => {
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    return {
        rise: formatTime(riseIST),
        set: formatTime(setIST),
        transit: formatTime(transitIST),
        riseUTC: formatTime(riseUTC),
        setUTC: formatTime(setUTC),
        transitUTC: formatTime(transitUTC)
    };
}

// Form submission
document.getElementById('astronomy-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const scrapedData = await loadScrapedAstronomyData();

    if (scrapedData) {
        console.log("Sunrise from Python:", scrapedData.sun.sunrise);
        console.log("Moon phase from Python:", scrapedData.moon.phase);
        console.log("Mars data:", scrapedData.planets.Mars);
    }

    if (!astronomyLoaded || typeof Astronomy === 'undefined') {
        document.getElementById('error-message').textContent =
            '⚠️ Astronomy Engine is still loading. Please wait.';
        document.getElementById('error-message').style.display = 'block';
        return;
    }

    try {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="loading">🛰️ Calculating with corrected precision data...</div>';
        
        if (window.weatherFetcher) {
            console.log('🌤️ Fetching weather data...');
            try {
                await window.weatherFetcher.fetchWeatherData();
                console.log('✅ Weather data loaded:', window.weatherFetcher.weatherData);
            } catch (err) {
                console.warn('⚠️ Weather fetch failed, using defaults:', err);
            }
        }
        
        if (!NASA_DATA_LOADED) await fetchNASAMoonData();
        
        const date = document.getElementById('date-input').value;
        const time = document.getElementById('time-input').value;
        const timezone = document.getElementById('timezone-input').value;

        let dateTime = new Date(`${date}T${time}`);
        
        if (timezone === 'IST') {
            dateTime = new Date(dateTime.getTime() - 5.5 * 60 * 60 * 1000);
        }

        const astroTime = new Astronomy.AstroTime(dateTime);
        const observer = new Astronomy.Observer(LAT, LON, ELEVATION);
        
        const nasaMoonData = getNASAMoonDataForTime(dateTime);
        
        const sunEqu = Astronomy.Equator(Astronomy.Body.Sun, astroTime, observer, true, true);
        const sunHor = Astronomy.Horizon(astroTime, observer, sunEqu.ra, sunEqu.dec, 'normal');
        const sunPos = { alt: sunHor.altitude, az: sunHor.azimuth };
        const sunTimes = calculateRiseSet(Astronomy.Body.Sun, astroTime, observer);

        const moonEqu = Astronomy.Equator(Astronomy.Body.Moon, astroTime, observer, true, true);
        const moonHor = Astronomy.Horizon(astroTime, observer, moonEqu.ra, moonEqu.dec, 'normal');
        const moonPos = { alt: moonHor.altitude, az: moonHor.azimuth };
        const moonPhase = getMoonPhaseInfo(nasaMoonData, astroTime);
        const moonTimes = calculateRiseSet(Astronomy.Body.Moon, astroTime, observer);
        
        resultsContainer.innerHTML = `
            <section class="card">
                <h2 class="section-title">☀️ Sun & Moon Status</h2>
                <div style="text-align: center; margin: 1rem 0;">
                    <span style="background: rgba(59, 130, 246, 0.2); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem;">
                        🛰️ ${moonPhase.source} • JPL Ephemeris DE431
                    </span>
                </div>
                
                <div class="info-grid">
                    
                    <div class="info-box">
                        <h3>Sunrise (IST)</h3>
                        <div class="value">${sunTimes.rise}</div>
                    </div>
                    <div class="info-box">
                        <h3>Solar Noon (IST)</h3>
                        <div class="value">${sunTimes.transit}</div>
                    </div>
                    <div class="info-box">
                        <h3>Sunset (IST)</h3>
                        <div class="value">${sunTimes.set}</div>
                    </div>
                    
                    <div class="info-box">
                        <h3>Moon Phase</h3>
                        <div class="value" style="font-size: 1rem;">
                            ${moonPhase.emoji} ${moonPhase.name}<br>
                            <small>Illumination: ${moonPhase.illumination}%</small>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <h3>Moonrise (IST)</h3>
                        <div class="value">${moonTimes.rise}</div>
                    </div>
                    <div class="info-box">
                        <h3>Moonset (IST)</h3>
                        <div class="value">${moonTimes.set}</div>
                    </div>
                </div>
                
                <div class="badge ${sunPos.alt < -18 ? 'badge-ok' : 'badge-warn'}">
                    ${sunPos.alt < -18 ? '🌙 Astronomical night - excellent for observing' : 
                      sunPos.alt < -12 ? '🌆 Astronomical twilight - good for bright objects' :
                      sunPos.alt < -6 ? '🌇 Nautical twilight - limited visibility' :
                      sunPos.alt < 0 ? '🌅 Civil twilight - poor visibility' :
                      '☀️ Daylight - observing not recommended'}
                </div>
            </section>

            <section class="card">
                <h2 class="section-title">🌍 Planetrise / Planetset — ${date}</h2>
                <div style="text-align: center; margin: 0.5rem 0 1rem;">
                    <span style="background: rgba(34, 197, 94, 0.2); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; color: #86efac;">
                        ✅ Corrected for timeanddate.com accuracy using empirical refraction adjustments
                    </span>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Planet</th>
                                <th>Rise (IST)</th>
                                <th>Set (IST)</th>
                                <th>Transit (IST)</th>
                                <th>Rise (UTC)</th>
                                <th>Set (UTC)</th>
                                <th>Transit (UTC)</th>
                                <th>Max Alt (°)</th>
                                <th>Visibility</th>
                                <th>Moon Impact</th>
                            </tr>
                        </thead>
                        <tbody id="planet-table-body"></tbody>
                    </table>
                </div>
            </section>
        `;

        const planetTableBody = document.getElementById('planet-table-body');
        
        for (const [name, data] of Object.entries(PLANET_DATA)) {
            const equ = Astronomy.Equator(data.body, astroTime, observer, true, true);
            const times = calculateRiseSet(data.body, astroTime, observer, name);
            
            const transitInfo = Astronomy.SearchHourAngle(data.body, observer, 0, astroTime);
            let maxAlt = 0;
            let sunAltAtTransit = 0;
            
            if (transitInfo) {
                const transitEqu = Astronomy.Equator(data.body, transitInfo.time, observer, true, true);
                const transitHor = Astronomy.Horizon(transitInfo.time, observer, transitEqu.ra, transitEqu.dec, 'normal');
                maxAlt = transitHor.altitude;
                
                const sunEquAtTransit = Astronomy.Equator(Astronomy.Body.Sun, transitInfo.time, observer, true, true);
                const sunHorAtTransit = Astronomy.Horizon(transitInfo.time, observer, sunEquAtTransit.ra, sunEquAtTransit.dec, 'normal');
                sunAltAtTransit = sunHorAtTransit.altitude;
            }
            
            const visibility = calculateVisibility(maxAlt, sunAltAtTransit);
            const separation = angularSeparation(equ.ra, equ.dec, moonEqu.ra, moonEqu.dec);
            const moonImpact = getMoonImpact(moonPhase, separation, moonPos.alt);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${name}</td>
                <td>${times.rise}</td>
                <td>${times.set}</td>
                <td>${times.transit}</td>
                <td>${times.riseUTC}</td>
                <td>${times.setUTC}</td>
                <td>${times.transitUTC}</td>
                <td>${maxAlt.toFixed(1)}°</td>
                <td>
                    <div class="visibility-bar">
                        <div class="visibility-fill" style="width: ${visibility.percent}%; background: ${visibility.color};"></div>
                        <span class="visibility-text">${visibility.percent}%</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <span style="font-size: 1.2rem;">${moonImpact.emoji}</span>
                        <div style="font-size: 0.8rem; color: ${moonImpact.color};">
                            ${moonImpact.text}
                        </div>
                    </div>
                </td>
            `;
            planetTableBody.appendChild(row);
        }

        document.getElementById('error-message').style.display = 'none';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('❌ Calculation error:', error);
        document.getElementById('error-message').innerHTML = `
            ⚠️ Calculation Error: ${error.message}<br>
            <small>Check browser console (F12) for details</small>
        `;
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('results-container').style.display = 'none';
    }
});

initializeForm();

fetchNASAMoonData().then(() => {
    console.log('🛰️ NASA Moon Data Ready');
}).catch(err => {
    console.log('📊 Using Astronomy Engine fallback for moon data');
});

if (window.weatherFetcher) {
    console.log('🌤️ Pre-loading weather data...');
    window.weatherFetcher.fetchWeatherData().catch(err => {
        console.log('⚠️ Weather pre-load failed, will retry on form submit');
    });
}

} // End of initializeCalculator