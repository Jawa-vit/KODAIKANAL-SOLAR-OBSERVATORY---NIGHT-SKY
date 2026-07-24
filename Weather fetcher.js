/* =========================================
   WEATHER DATA FETCHER - WINDY.COM INTEGRATION
   Fetches real-time weather data to enhance visibility calculations
========================================= */

const KODAIKANAL_COORDS = {
    lat: 10.2381,
    lon: 77.4895
};

class WeatherDataFetcher {
    constructor() {
        this.weatherData = null;
        this.lastFetchTime = null;
        this.cacheDuration = 30 * 60 * 1000; // 30 minutes cache
    }

    /**
     * Get weather data from Open-Meteo API (free, no API key required)
     * This provides similar data to Windy.com
     */
    async fetchWeatherData() {
        // Check cache
        if (this.weatherData && this.lastFetchTime && 
            (Date.now() - this.lastFetchTime) < this.cacheDuration) {
            console.log('📦 Using cached weather data');
            return this.weatherData;
        }

        try {
            // Open-Meteo API - free weather API
            const url = `https://api.open-meteo.com/v1/forecast?` +
                `latitude=${KODAIKANAL_COORDS.lat}&` +
                `longitude=${KODAIKANAL_COORDS.lon}&` +
                `current=temperature_2m,relative_humidity_2m,precipitation,rain,` +
                `cloud_cover,wind_speed_10m,wind_direction_10m&` +
                `hourly=temperature_2m,cloud_cover,precipitation,visibility&` +
                `timezone=Asia/Kolkata&` +
                `forecast_days=2`;

            console.log('🌤️ Fetching weather data...');
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            
            this.weatherData = this.processWeatherData(data);
            this.lastFetchTime = Date.now();
            
            console.log('✅ Weather data fetched successfully:', this.weatherData);
            return this.weatherData;
            
        } catch (error) {
            console.error('❌ Weather fetch error:', error);
            // Return default values on error
            return this.getDefaultWeatherData();
        }
    }

    /**
     * Process raw weather data into usable format
     */
    processWeatherData(data) {
        const current = data.current;
        const hourly = data.hourly;
        
        // Get current hour index
        const currentTime = new Date();
        const currentHourIndex = new Date(current.time).getHours();
        
        return {
            current: {
                temperature: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                cloudCover: current.cloud_cover,
                precipitation: current.precipitation || current.rain || 0,
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m,
                timestamp: current.time
            },
            hourly: {
                times: hourly.time,
                cloudCover: hourly.cloud_cover,
                precipitation: hourly.precipitation,
                visibility: hourly.visibility,
                temperature: hourly.temperature_2m
            },
            location: {
                lat: KODAIKANAL_COORDS.lat,
                lon: KODAIKANAL_COORDS.lon,
                name: 'Kodaikanal'
            }
        };
    }

    /**
     * Get weather data for a specific time
     */
    getWeatherForTime(dateTime) {
        if (!this.weatherData) {
            return this.getDefaultWeatherData().current;
        }

        const targetTime = new Date(dateTime);
        const hourly = this.weatherData.hourly;
        
        // Find closest hour
        let closestIndex = 0;
        let minDiff = Infinity;
        
        for (let i = 0; i < hourly.times.length; i++) {
            const time = new Date(hourly.times[i]);
            const diff = Math.abs(time - targetTime);
            
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }
        
        return {
            temperature: hourly.temperature[closestIndex],
            cloudCover: hourly.cloudCover[closestIndex],
            precipitation: hourly.precipitation[closestIndex],
            visibility: hourly.visibility[closestIndex],
            timestamp: hourly.times[closestIndex]
        };
    }

    /**
     * Calculate visibility factor based on weather conditions
     * Returns a multiplier from 0.0 (worst) to 1.0 (best)
     */
    calculateVisibilityFactor(dateTime = null) {
        const weather = dateTime ? 
            this.getWeatherForTime(dateTime) : 
            this.weatherData?.current;
            
        if (!weather) {
            return {
                factor: 0.8,
                reason: 'Weather data unavailable',
                cloudCover: 0,
                precipitation: 0,
                visibility: 10000
            };
        }

        let factor = 1.0;
        const reasons = [];
        
        // Cloud cover impact (0-100%)
        const cloudCover = weather.cloudCover || 0;
        if (cloudCover > 80) {
            factor *= 0.2; // Heavy clouds - very poor visibility
            reasons.push(`Heavy clouds (${cloudCover}%)`);
        } else if (cloudCover > 60) {
            factor *= 0.5; // Moderate clouds
            reasons.push(`Moderate clouds (${cloudCover}%)`);
        } else if (cloudCover > 30) {
            factor *= 0.75; // Light clouds
            reasons.push(`Light clouds (${cloudCover}%)`);
        } else {
            reasons.push(`Clear sky (${cloudCover}%)`);
        }
        
        // Precipitation impact (mm)
        const precipitation = weather.precipitation || 0;
        if (precipitation > 2) {
            factor *= 0.3; // Heavy rain/snow - very poor
            reasons.push(`Heavy precipitation (${precipitation.toFixed(1)}mm)`);
        } else if (precipitation > 0.5) {
            factor *= 0.6; // Light rain
            reasons.push(`Light precipitation (${precipitation.toFixed(1)}mm)`);
        }
        
        // Visibility impact (meters)
        const visibility = weather.visibility || 10000;
        if (visibility < 1000) {
            factor *= 0.1; // Fog/mist - extremely poor
            reasons.push(`Low visibility (${(visibility/1000).toFixed(1)}km)`);
        } else if (visibility < 5000) {
            factor *= 0.4; // Reduced visibility
            reasons.push(`Reduced visibility (${(visibility/1000).toFixed(1)}km)`);
        }
        
        return {
            factor: Math.max(factor, 0.05), // Never go below 5%
            reason: reasons.join(', '),
            cloudCover: cloudCover,
            precipitation: precipitation,
            visibility: visibility
        };
    }

    /**
     * Get default weather data when API fails
     */
    getDefaultWeatherData() {
        return {
            current: {
                temperature: 20,
                humidity: 70,
                cloudCover: 30,
                precipitation: 0,
                windSpeed: 5,
                windDirection: 0,
                timestamp: new Date().toISOString()
            },
            hourly: {
                times: [],
                cloudCover: [],
                precipitation: [],
                visibility: [],
                temperature: []
            },
            location: {
                lat: KODAIKANAL_COORDS.lat,
                lon: KODAIKANAL_COORDS.lon,
                name: 'Kodaikanal'
            }
        };
    }

    /**
     * Get comprehensive weather assessment
     */
    getWeatherAssessment(dateTime = null) {
        const visibilityData = this.calculateVisibilityFactor(dateTime);
        const weather = dateTime ? 
            this.getWeatherForTime(dateTime) : 
            this.weatherData?.current;
        
        let quality = 'Excellent';
        let color = '#22c55e';
        let emoji = '🌟';
        
        if (visibilityData.factor >= 0.8) {
            quality = 'Excellent';
            color = '#22c55e';
            emoji = '🌟';
        } else if (visibilityData.factor >= 0.6) {
            quality = 'Good';
            color = '#84cc16';
            emoji = '✅';
        } else if (visibilityData.factor >= 0.4) {
            quality = 'Fair';
            color = '#eab308';
            emoji = '⚠️';
        } else if (visibilityData.factor >= 0.2) {
            quality = 'Poor';
            color = '#f97316';
            emoji = '❌';
        } else {
            quality = 'Very Poor';
            color = '#ef4444';
            emoji = '🚫';
        }
        
        return {
            quality,
            color,
            emoji,
            factor: visibilityData.factor,
            reason: visibilityData.reason,
            details: weather,
            cloudCover: visibilityData.cloudCover,
            precipitation: visibilityData.precipitation,
            visibility: visibilityData.visibility
        };
    }
}

// Create singleton instance
const weatherFetcher = new WeatherDataFetcher();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.weatherFetcher = weatherFetcher;
}