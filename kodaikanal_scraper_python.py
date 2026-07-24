import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

URL = "https://www.timeanddate.com/astronomy/night/india/kodaikanal"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def scrape_kodaikanal():
    r = requests.get(URL, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    sun = {}
    moon = {}

    for row in soup.select("table tr"):
        cells = [c.get_text(strip=True) for c in row.find_all(["th","td"])]
        if len(cells) < 2:
            continue

        label = cells[0].lower()
        value = cells[1]

        if "sunrise" in label:
            sun["sunrise"] = value
        elif "sunset" in label:
            sun["sunset"] = value
        elif "day length" in label:
            sun["day_length"] = value

        elif "moon phase" in label:
            moon["phase"] = value
        elif "illumination" in label:
            moon["illumination"] = value
        elif "moonrise" in label:
            moon["moonrise"] = value
        elif "moonset" in label:
            moon["moonset"] = value

    return {
        "meta": {
            "location": "Kodaikanal, Tamil Nadu, India",
            "generated_at": datetime.now().isoformat(),
            "source": "timeanddate.com"
        },
        "sun": sun,
        "moon": moon,
        "planets": {},
        "stars": {}
    }

if __name__ == "__main__":
    data = scrape_kodaikanal()
    with open("kodaikanal_astronomy_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("✅ Offline astronomy JSON generated")
