from skyfield.api import load, Topos
from datetime import datetime
import json

# Location: Kodaikanal
location = Topos(latitude_degrees=10.2381, longitude_degrees=77.4895)

ts = load.timescale()
t = ts.now()

eph = load('./de421.bsp')

earth = eph['earth']

planets = {
    "Mercury": eph['mercury'],
    "Venus": eph['venus'],
    "Mars": eph['mars'],
    "Jupiter": eph['jupiter barycenter'],
    "Saturn": eph['saturn barycenter'],
    "Uranus": eph['uranus barycenter'],
    "Neptune": eph['neptune barycenter']
}

bright_stars = {
    "Sirius": (101.287, -16.716),
    "Canopus": (95.988, -52.696),
    "Arcturus": (213.915, 19.182),
    "Vega": (279.234, 38.783),
    "Capella": (79.172, 45.998)
}

observer = earth + location

planet_data = {}
for name, body in planets.items():
    astrometric = observer.at(t).observe(body)
    alt, az, dist = astrometric.apparent().altaz()

    planet_data[name] = {
        "altitude_deg": round(alt.degrees, 2),
        "azimuth_deg": round(az.degrees, 2),
        "distance_au": round(dist.au, 3)
    }

star_data = {}
for name, (ra, dec) in bright_stars.items():
    star_data[name] = {
        "ra_deg": ra,
        "dec_deg": dec
    }

output = {
    "meta": {
        "location": "Kodaikanal, Tamil Nadu, India",
        "generated_at": datetime.utcnow().isoformat(),
        "source": "Computed (NASA ephemeris)"
    },
    "planets": planet_data,
    "bright_stars": star_data
}

with open("kodaikanal_planets_stars.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2)

print("✅ Planet & star data generated for offline use")
