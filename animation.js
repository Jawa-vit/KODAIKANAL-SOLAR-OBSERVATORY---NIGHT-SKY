/* =========================================
   CLIMATE-ADAPTIVE ANIMATIONS
   Changes based on season - DYNAMICALLY UPDATED
========================================= */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let currentTheme = null;
let weatherEffects = [];

// Store intervals so we can clear them on theme change
let weatherInterval = null;
let shootingStarInterval = null;
let emojiInterval = null;

/* ---------- CANVAS SETUP ---------- */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ---------- WAIT FOR THEME ---------- */
function waitForTheme() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.seasonTheme) {
                currentTheme = window.seasonTheme;
                resolve(currentTheme);
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

/* ---------- STARS (SEASONAL) ---------- */
let stars = [];

function createStars() {
    stars = [];
    const density = currentTheme?.effects.starDensity || 1;
    const STAR_COUNT = Math.floor(350 * density);
    
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.6 + 0.4,
            alpha: Math.random(),
            speed: Math.random() * 0.15 + 0.05
        });
    }
}

function drawStars() {
    const starColor = currentTheme?.colors.starColor || "white";
    
    stars.forEach(s => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = starColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        s.alpha += (Math.random() - 0.5) * 0.05;
        s.alpha = Math.max(0.2, Math.min(1, s.alpha));
    });
}

/* ---------- RAIN EFFECT ---------- */
let rainDrops = [];

function createRainDrop() {
    rainDrops.push({
        x: Math.random() * canvas.width,
        y: -10,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 5 + 5,
        opacity: Math.random() * 0.5 + 0.3
    });
}

function drawRain() {
    ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    ctx.lineWidth = 1;
    
    rainDrops.forEach((drop, i) => {
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
        
        drop.y += drop.speed;
        
        if (drop.y > canvas.height) {
            rainDrops.splice(i, 1);
        }
    });
}

/* ---------- SNOW EFFECT ---------- */
let snowFlakes = [];

function createSnowFlake() {
    snowFlakes.push({
        x: Math.random() * canvas.width,
        y: -10,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        drift: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.8 + 0.2
    });
}

function drawSnow() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    snowFlakes.forEach((flake, i) => {
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
        
        flake.y += flake.speed;
        flake.x += flake.drift;
        
        if (flake.y > canvas.height) {
            snowFlakes.splice(i, 1);
        }
    });
}

/* ---------- HEAT WAVE EFFECT ---------- */
let heatWaves = [];

function createHeatWave() {
    heatWaves.push({
        y: canvas.height,
        amplitude: Math.random() * 20 + 10,
        frequency: Math.random() * 0.02 + 0.01,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
    });
}

function drawHeatWaves() {
    heatWaves.forEach((wave, i) => {
        ctx.globalAlpha = wave.opacity;
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
            const y = wave.y + Math.sin(x * wave.frequency) * wave.amplitude;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        wave.y -= wave.speed;
        wave.amplitude *= 0.99;
        
        if (wave.y < 0 || wave.amplitude < 1) {
            heatWaves.splice(i, 1);
        }
    });
}

/* ---------- FLOATING PLANETS ---------- */
const planets = [
    { r: 18, speed: 0.2 },
    { r: 24, speed: 0.15 },
    { r: 28, speed: 0.1 },
    { r: 22, speed: 0.18 },
    { r: 40, speed: 0.06 }
];

let floatingPlanets = [];

function createFloatingPlanets() {
    const primary = currentTheme?.colors.primary || "#d2b48c";
    const secondary = currentTheme?.colors.secondary || "#4da6ff";
    
    floatingPlanets = planets.map((p, i) => ({
        ...p,
        color: i % 2 === 0 ? primary : secondary,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * p.speed,
        dy: (Math.random() - 0.5) * p.speed
    }));
}

function drawFloatingPlanets() {
    floatingPlanets.forEach(p => {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;
    });
}

/* ---------- SHOOTING STARS ---------- */
let shootingStars = [];

function createShootingStar() {
    shootingStars.push({
        x: -100,
        y: Math.random() * canvas.height * 0.5,
        len: Math.random() * 120 + 100,
        speed: Math.random() * 10 + 12,
        life: 0
    });
}

function drawShootingStars() {
    const starColor = currentTheme?.colors.starColor || "white";
    
    shootingStars.forEach((s, i) => {
        ctx.strokeStyle = starColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y + s.len * 0.25);
        ctx.stroke();

        s.x += s.speed;
        s.y += s.speed * 0.25;
        s.life++;

        if (s.x > canvas.width + 200 || s.life > 40) {
            shootingStars.splice(i, 1);
        }
    });
}

/* ---------- FLOATING EMOJIS (SEASONAL) ---------- */
const seasonalEmojis = {
    summer: ["☀️", "🌞", "🔥", "🌻", "🦋"],
    monsoon: ["☔", "🌧️", "⛈️", "🌊", "💧"],
    autumn: ["🍂", "🍁", "🌾", "🎃", "🌰"],
    winter: ["❄️", "⛄", "🌨️", "❄", "🌬️"]
};

let floatingEmojis = [];

function createEmoji() {
    const season = window.currentSeason || 'winter';
    const emojis = seasonalEmojis[season];
    
    floatingEmojis.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        size: Math.random() * 20 + 18,
        speed: Math.random() * 0.6 + 0.4,
        char: emojis[Math.floor(Math.random() * emojis.length)]
    });
}

function drawEmojis() {
    floatingEmojis.forEach((e, i) => {
        ctx.globalAlpha = 0.9;
        ctx.font = `${e.size}px serif`;
        ctx.fillText(e.char, e.x, e.y);
        
        e.y -= e.speed;

        if (e.y < -30) {
            floatingEmojis.splice(i, 1);
        }
    });
}

/* ---------- MAIN ANIMATION LOOP ---------- */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars();
    drawFloatingPlanets();
    drawShootingStars();
    drawEmojis();
    
    // Draw weather effects based on season
    if (currentTheme?.effects.rain) {
        drawRain();
    }
    
    if (currentTheme?.effects.snow) {
        drawSnow();
    }
    
    if (currentTheme?.effects.heatWaves) {
        drawHeatWaves();
    }

    requestAnimationFrame(animate);
}

/* ---------- WEATHER EFFECT TIMERS ---------- */
function setupWeatherEffects() {
    // Clear existing interval
    if (weatherInterval) {
        clearInterval(weatherInterval);
        weatherInterval = null;
    }
    
    // Clear existing weather effects
    rainDrops = [];
    snowFlakes = [];
    heatWaves = [];
    
    // Rain
    if (currentTheme?.effects.rain) {
        weatherInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                createRainDrop();
            }
        }, 100);
    }
    
    // Snow
    if (currentTheme?.effects.snow) {
        weatherInterval = setInterval(() => {
            for (let i = 0; i < 3; i++) {
                createSnowFlake();
            }
        }, 200);
    }
    
    // Heat waves
    if (currentTheme?.effects.heatWaves) {
        weatherInterval = setInterval(() => {
            createHeatWave();
        }, 3000);
    }
}

/* ---------- SHOOTING STAR TIMER ---------- */
function setupShootingStars() {
    // Clear existing interval
    if (shootingStarInterval) {
        clearInterval(shootingStarInterval);
    }
    
    const interval = currentTheme?.effects.shootingStarInterval || 6000;
    shootingStarInterval = setInterval(() => {
        createShootingStar();
    }, interval);
}

/* ---------- EMOJI TIMER ---------- */
function setupEmojiTimer() {
    // Clear existing interval
    if (emojiInterval) {
        clearInterval(emojiInterval);
    }
    
    emojiInterval = setInterval(() => {
        if (floatingEmojis.length < 8) {
            createEmoji();
        }
    }, 2500);
}

/* ---------- UPDATE THEME DYNAMICALLY (NEW!) ---------- */
function updateTheme(newTheme) {
    console.log(`🎨 Animation: Updating to ${newTheme.name} theme`);
    currentTheme = newTheme;
    
    // Recreate stars with new density
    createStars();
    
    // Recreate floating planets with new colors
    createFloatingPlanets();
    
    // Setup weather effects with new settings
    setupWeatherEffects();
    
    // Setup shooting stars with new interval
    setupShootingStars();
    
    // Setup emoji timer
    setupEmojiTimer();
    
    console.log(`✅ Animation updated to ${newTheme.name}`);
}

/* ---------- LISTEN FOR SEASON CHANGES (NEW!) ---------- */
window.addEventListener('seasonChanged', (event) => {
    const { theme, changed } = event.detail;
    console.log(`🌍 Animation received season change event: ${theme.name}`);
    updateTheme(theme);
});

/* ---------- INITIALIZE ---------- */
waitForTheme().then(() => {
    console.log(`🎨 Initializing ${currentTheme.name} theme animations`);
    createStars();
    createFloatingPlanets();
    setupWeatherEffects();
    setupShootingStars();
    setupEmojiTimer();
    animate();
});