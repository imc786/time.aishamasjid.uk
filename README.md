# Aisha Masjid Prayer Timer

Prayer timer is a one-page web interface, intended to be shown on a 4K (3840x2160) or FHD (1920x1080) resolution TV/projector screen. It shows the start and Jama'at times of all 5 prayers for the day, and counts down to the next prayer & Iqamah time. The big main section is designed to be overlayed with slides/video stream when deployed.

## Project Dependencies

- Moment 2.29.4
- Moment Hijri 2.1.2

## Prerequisites

1. Prayer start times are retrieved from [https://www.moonsighting.com/time_json.php?year=2023&tz=Europe/London&lat=51.4548878&lon=-0.9365519&method=0&both=false&time=0](https://www.moonsighting.com/time_json.php?year=2023&tz=Europe/London&lat=51.4548878&lon=-0.9365519&method=0&both=false&time=0) and then stored locally under `data/{year}.json`

2. Iqamah/Jama'at times are provided by Aisha Masjid & Islamic Centre, converted to JSON and stored locally under `data/jamaat/{year}.json`

## Known Issues

1. Start times available until end 2030, and Jama'at times available until end 2023. **After this, the application will break unless more data is added.** The plan is to connect this to the website's XML stream in the future, replacing the localised JSON.

2. At the change of the year, the next day's Fajr time is not retrieved, so instead the current year's 31st December times are shown as the next Fajr timing after Isha prayer.

3. To do: handle promises properly.

4. Tech debt: MVP is created as a prototype without productionising code. There are several design/architecture improvements that should be considered.

## Testing

You can force a specific timestamp instead of using current live time by uncommenting the two lines commented `TESTING ONLY` and commenting out the line above both of those in `assets/js/time.js`. Revert to switch back to current timestamps.

## Licence

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Aisha Masjid Prayer Timer
Copyright (c) 2023 Imtiaz Chowdhury / Western Pixel