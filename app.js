const form = document.querySelector('#search');
const city = document.querySelector('#city');
const status = document.querySelector('#status');
const card = document.querySelector('section');
const button = form.querySelector('button');

async function getData(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = city.value.trim();
    if (button.disabled) return;
    if (!name) {
        status.textContent = 'Enter a city name first.';
        return;
    }

    button.disabled = true;
    card.hidden = true;
    status.textContent = 'Loading weather…';

    try {
        const search = await getData('https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(name));
        const place = search.results?.[0];
        if (!place) {
            status.textContent = 'City not found. Check the spelling and try again.';
            return;
        }

        const data = await getData('https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code&latitude=' + place.latitude + '&longitude=' + place.longitude);
        const temperature = data.current?.temperature_2m;
        if (!Number.isFinite(temperature)) throw new Error('Temperature missing');

        document.querySelector('#place').textContent = [place.name, place.country].filter(Boolean).join(', ');
        document.querySelector('#temperature').textContent = temperature + ' °C';

        const code = data.current.weather_code;
        let conditions = 'Weather condition unavailable';
        if (code === 0) conditions = 'Clear sky';
        else if (code >= 1 && code <= 3) conditions = 'Cloud cover';
        else if ([45, 48].includes(code)) conditions = 'Fog';
        else if ([51, 53, 55, 56, 57].includes(code)) conditions = 'Drizzle';
        else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) conditions = 'Rain';
        else if ([71, 73, 75, 77, 85, 86].includes(code)) conditions = 'Snow';
        else if ([95, 96, 99].includes(code)) conditions = 'Thunderstorm';

        let picture = 'cloud';
        if (code === 0) picture = 'sun';
        else if (['Drizzle', 'Rain', 'Thunderstorm'].includes(conditions)) picture = 'rain';

        document.querySelector('#sun').hidden = picture !== 'sun';
        document.querySelector('#cloud').hidden = picture !== 'cloud';
        document.querySelector('#rain').hidden = picture !== 'rain';
        document.querySelector('#conditions').textContent = conditions;
        card.hidden = false;
        status.textContent = 'Current weather loaded.';
    } catch {
        status.textContent = 'Could not load weather. Check your connection and try again.';
    } finally {
        button.disabled = false;
    }
});
