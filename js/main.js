document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('locationSelector');

    async function fetchCSV() {
        try {
            const response = await fetch('city_coordinates.csv');
            const csv = await response.text();
            const data = csvToArray(csv);
            populateData(data);
        } catch (error) {
            console.error('Error fetching the CSV file:', error);
        }
    }

    function csvToArray(csv) {
        const rows = csv.trim().split('\n');
        const data = rows.slice(1).map(row => {
            const [lat, lon, city, country] = row.split(',');
            return { lat, lon, city, country };
        });
        return data;
    }

    function populateData(data) {
        data.forEach(location => {
            if (location.city && location.country) {
                const option = document.createElement('option');
                option.value = `${location.lat},${location.lon}`;
                option.text = `${location.city}, ${location.country}`;
                select.appendChild(option);
            }
        });
    }

    select.addEventListener('change', async function() {
        const selectedOption = this.options[this.selectedIndex];
        const value = selectedOption.value;
        const text = selectedOption.text;

        if (value) {
            const [lat, lon] = value.split(',');
            const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                displayWeather(data, text);
            } catch (error) {
                console.error('Error fetching the weather data:', error);
            }
        } else {
            document.getElementById('weather').innerHTML = 'No location selected';
        }
    });

    function displayWeather(rawData, location) {
        const weatherContainer = document.getElementById('weather');
        weatherContainer.innerHTML = ""; //`<h2>Weather for ${location}</h2>`;
        // weatherContainerstyle.display = 'block';
    
        const init = rawData.init;
        const baseYear = parseInt(init.substring(0, 4));
        const baseMonth = parseInt(init.substring(4, 6)) - 1;
        const baseDay = parseInt(init.substring(6, 8));
        const baseHour = parseInt(init.substring(8, 10));
        const baseDate = new Date(baseYear, baseMonth, baseDay, baseHour);
    
        const dailyData = {};
    
        rawData.dataseries.forEach(entry => {
            const entryDate = new Date(baseDate.getTime() + entry.timepoint *3600000);
            const dateKey = entryDate.toDateString(); // e.g., "2025-05-04"
            // const dateKey = entryDate.toISOString().split('T')[0]; // e.g., "2025-05-04"
    
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    temps: [],
                    weathers: [],
                    date: entryDate
                };
            }
    
            dailyData[dateKey].temps.push(entry.temp2m);
            dailyData[dateKey].weathers.push(entry.weather);
        });
    
        // Convert to array and sort
        const days = Object.values(dailyData)
            .sort((a, b) => a.date - b.date)
            .slice(0, 7);
    
        days.forEach(day => {
            const minTemp = Math.min(...day.temps);
            const maxTemp = Math.max(...day.temps);

            // Get the most frequent weather for that day
            const weatherCounts = {};
            day.weathers.forEach(w => {
                weatherCounts[w] = (weatherCounts[w] || 0) + 1;
            });
            const mostCommonWeather = Object.entries(weatherCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
    
            const weatherIcon = getWeatherIcon(mostCommonWeather);
           
    
            // Use first weather value as representative (can be improved to "most frequent")
            const weather = day.weathers[0];
            //const weatherIcon = getWeatherIcon(weather);
    
            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); // e.g., "May 4"
    
            const weatherDay = document.createElement('div');
            weatherDay.classList.add('weather-day');
    
            weatherDay.innerHTML = `
                <h3>${dayName} <br/> ${formattedDate}</h3>
                <img src="${weatherIcon}" alt="${mostCommonWeather}">
                <hr>
                <div class="weather-desc">${formatWeatherDescription(mostCommonWeather)}</div>
                <p class="temp">H: ${maxTemp}°C</p>
                <p class="temp">L: ${minTemp}°C</p>
                
            `;
            weatherContainer.appendChild(weatherDay);
        });
    }
    function formatWeatherDescription(code) {
        const simplified = code.replace(/(day|night)$/i, ''); // Remove 'day' or 'night'
    
        const map = {
            clear: 'Clear',
            pcloudy: 'Partly Cloudy',
            mcloudy: 'Mostly Cloudy',
            cloudy: 'Cloudy',
            humid: 'Humid',
            lightrain: 'Light Rain',
            lrain: 'Light Rain',
            rain: 'Rain',
            oshower: 'Occasional Showers',
            ishower: 'Isolated Showers',
            lightsnow: 'Light Snow',
            snow: 'Snow',
            rainsnow: 'Rain and Snow',
            ts: 'Thunderstorm',
            tsrain: 'Thunderstorm with Rain',
            fog: 'Foggy',
            windy: 'Windy'
        };
    
        return map[simplified] || simplified.charAt(0).toUpperCase() + simplified.slice(1);
    }

    function getWeatherIcon(weather) {
         // Strip "day" or "night" from the weather string
        const simplified = weather.replace(/(day|night)$/, '');
        // console.log("Original weather string:", weather, "→ Simplified:", simplified);
        const icons = {
            clear: 'images/clear.png',
            pcloudy: 'images/partly-cloudy.png',
            mcloudy: 'images/mostly-cloudy.png',
            cloudy: 'images/cloudy.png',
            humid: 'images/humid.png',
            lightrain: 'images/light-rain.png',
            rain: 'images/rain.png',
            oshower: 'images/showers.png',
            ishower: 'images/intermittent-showers.png',
            lightsnow: 'images/light-snow.png',
            snow: 'images/snow.png',
            rainsnow: 'images/rain-snow.png',
            ts: 'images/thunderstorm.png',
            tsrain: 'images/thunderstorm-rain.png',
            fog: 'images/fog.png',
            windy: 'images/windy.png',
        };
        return icons[simplified] || 'images/clear.png'; //default fallback
    }

    fetchCSV();
});