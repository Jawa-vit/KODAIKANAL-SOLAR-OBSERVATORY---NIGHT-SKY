/* =========================================
   CLIMATE DETECTOR - SEASON-BASED THEMES
   Automatically adapts UI to current season
========================================= */

// Get current season based on month (Kodaikanal, India)
function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    
    // Kodaikanal seasons:
    // Summer: March-May (3-5)
    // Monsoon: June-September (6-9)
    // Post-Monsoon: October-November (10-11)
    // Winter: December-February (12, 1-2)
    
    if (month >= 3 && month <= 5) {
        return 'summer';
    } else if (month >= 6 && month <= 9) {
        return 'monsoon';
    } else if (month >= 10 && month <= 11) {
        return 'autumn';
    } else {
        return 'winter';
    }
}

// Get season from a specific date string
function getSeasonFromDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) {
        return 'summer';
    } else if (month >= 6 && month <= 9) {
        return 'monsoon';
    } else if (month >= 10 && month <= 11) {
        return 'autumn';
    } else {
        return 'winter';
    }
}

// Season configurations
const SEASON_THEMES = {
    summer: {
        name: 'Summer',
        emoji: '☀️',
        colors: {
            primary: '#ff6b35',
            secondary: '#f7931e',
            accent: '#ffd93d',
            background: 'radial-gradient(circle at bottom, #1a0f0a, #0a0505)',
            starColor: '#fffacd',
            headerGradient: 'linear-gradient(to bottom, rgba(255, 107, 53, 0.3), rgba(0, 0, 0, 0))'
        },
        effects: {
            starDensity: 0.5, // Fewer stars (hazy summer sky)
            shootingStarInterval: 8000,
            heatWaves: true,
            rain: false,
            snow: false
        }
    },
    monsoon: {
        name: 'Monsoon',
        emoji: '🌧️',
        colors: {
            primary: '#4a90e2',
            secondary: '#50c9ce',
            accent: '#b8e6f0',
            background: 'radial-gradient(circle at bottom, #0a1428, #000308)',
            starColor: '#b8e6f0',
            headerGradient: 'linear-gradient(to bottom, rgba(74, 144, 226, 0.4), rgba(0, 0, 0, 0))'
        },
        effects: {
            starDensity: 0.3, // Fewer stars (cloudy)
            shootingStarInterval: 12000,
            heatWaves: false,
            rain: true,
            snow: false
        }
    },
    autumn: {
        name: 'Autumn',
        emoji: '🍂',
        colors: {
            primary: '#d4a574',
            secondary: '#cd853f',
            accent: '#f4a460',
            background: 'radial-gradient(circle at bottom, #1a0e0a, #000000)',
            starColor: '#ffd700',
            headerGradient: 'linear-gradient(to bottom, rgba(212, 165, 116, 0.3), rgba(0, 0, 0, 0))'
        },
        effects: {
            starDensity: 0.9,
            shootingStarInterval: 6000,
            heatWaves: false,
            rain: false,
            snow: false
        }
    },
    winter: {
        name: 'Winter',
        emoji: '❄️',
        colors: {
            primary: '#7ec8e3',
            secondary: '#5fb3d1',
            accent: '#d4f1f9',
            background: 'radial-gradient(circle at bottom, #0a1520, #000510)',
            starColor: '#e0f7ff',
            headerGradient: 'linear-gradient(to bottom, rgba(126, 200, 227, 0.3), rgba(0, 0, 0, 0))'
        },
        effects: {
            starDensity: 1.2, // More stars (clear winter sky)
            shootingStarInterval: 4000,
            heatWaves: false,
            rain: false,
            snow: true
        }
    }
};

// Apply seasonal theme
function applySeasonalTheme(seasonKey = null) {
    const season = seasonKey || getCurrentSeason();
    const theme = SEASON_THEMES[season];
    
    console.log(`🌍 Current Season: ${theme.name} ${theme.emoji}`);
    
    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--season-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--season-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--season-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--season-star-color', theme.colors.starColor);
    
    // Apply background
    document.body.style.background = theme.colors.background;
    
    // Update header
    const header = document.querySelector('.site-header');
    if (header) {
        header.style.background = theme.colors.headerGradient;
    }
    
    // Add season indicator
    addSeasonIndicator(theme);
    
    // Store season for animation.js to use
    window.currentSeason = season;
    window.seasonTheme = theme;
    
    // Trigger season change event for animation.js
    window.dispatchEvent(new CustomEvent('seasonChanged', {
        detail: { season, theme }
    }));
    
    return theme;
}

// Add season indicator badge
function addSeasonIndicator(theme) {
    // Remove existing indicator
    const existing = document.getElementById('season-indicator');
    if (existing) existing.remove();
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'season-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            padding: 0.8rem 1.2rem;
            border-radius: 50px;
            border: 2px solid ${theme.colors.primary};
            color: ${theme.colors.accent};
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            animation: fadeInSlide 0.5s ease;
        ">
            ${theme.emoji} ${theme.name} Mode
        </div>
    `;
    
    document.body.appendChild(indicator);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    applySeasonalTheme();
    
    // Listen for date input changes
    const dateInput = document.getElementById('date-input');
    if (dateInput) {
        dateInput.addEventListener('change', function(e) {
            const selectedDate = e.target.value;
            const season = getSeasonFromDate(selectedDate);
            applySeasonalTheme(season);
            
            // Show notification
            const theme = SEASON_THEMES[season];
            showSeasonChangeNotification(theme);
        });
    }
});

// Show season change notification
function showSeasonChangeNotification(theme) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
        padding: 2rem 3rem;
        border-radius: 20px;
        border: 3px solid ${theme.colors.primary};
        color: white;
        font-size: 1.5rem;
        font-weight: 700;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 0 60px ${theme.colors.primary};
        animation: notificationPop 0.5s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">
            ${theme.emoji}
        </div>
        <div>Climate Changed!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.8;">
            ${theme.name} season activated
        </div>
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes notificationPop {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'all 0.5s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Export for use in other files
window.getCurrentSeason = getCurrentSeason;
window.getSeasonFromDate = getSeasonFromDate;
window.getSeasonTheme = () => SEASON_THEMES[getCurrentSeason()];
window.applySeasonalTheme = applySeasonalTheme;
window.SEASON_THEMES = SEASON_THEMES;