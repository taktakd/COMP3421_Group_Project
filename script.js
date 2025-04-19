const weatherForm = document.querySelector('#weatherForm');
const cityInput = document.querySelector('#city');
const weatherDisplay = document.querySelector('#weatherDisplay');
const latitudeDisplay = document.querySelector('#latitude');
const longitudeDisplay = document.querySelector('#longitude');
const hkCityName = document.querySelector('#hk-city-name');
const hkCurrentDate = document.querySelector('#hk-current-date');
const hkCurrentTime = document.querySelector('#hk-current-time');
const currentDate = document.querySelector('#current-date');
const currentTime = document.querySelector('#current-time');
const hkWeatherIcon = document.querySelector('#hk-weather-icon');
const hkTemp = document.querySelector('#hk-temp');
const hkHumidity = document.querySelector('#hk-humidity');
const hkConditions = document.querySelector('#hk-conditions');

// Update date and time with timezone offset
function updateDateTime(elementDate, elementTime, timezoneOffset) {
    const now = new Date();
    
    // Calculate UTC time plus the timezone offset (in seconds)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityTime = new Date(utc + (1000 * (timezoneOffset || 0)));
    
    // Format date (e.g., "Monday, June 14, 2023")
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elementDate.textContent = cityTime.toLocaleDateString('en-US', options);

    // Format time (e.g., "10:30 AM")
    let hours = cityTime.getHours();
    const minutes = cityTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    elementTime.textContent = `${hours}:${minutes} ${ampm}`;
}

// Initialize Hong Kong time (timezone offset for Hong Kong is +28800 seconds)
const HK_TIMEZONE_OFFSET = 28800;
function updateHongKongTime() {
    updateDateTime(hkCurrentDate, hkCurrentTime, HK_TIMEZONE_OFFSET);
}
updateHongKongTime();
const hkTimeInterval = setInterval(updateHongKongTime, 1000);

// Function to get weather icon URL
function getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Function to fetch and display Hong Kong weather
function fetchHongKongWeather() {
    const hkLat = 22.3193;
    const hkLon = 114.1694;
    
    fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${hkLat}&lon=${hkLon}&exclude=minutely,hourly,alerts&units=metric&appid=62f83c9eacacd4002bb87979caeab3f9`)
        .then(response => response.json())
        .then(data => {
            if (data.current) {
                hkTemp.textContent = Math.round(data.current.temp);
                hkHumidity.textContent = data.current.humidity;
                hkConditions.textContent = data.current.weather[0].main;
                hkWeatherIcon.src = getWeatherIcon(data.current.weather[0].icon);
            }
        })
        .catch(error => {
            console.error("Error fetching Hong Kong weather:", error);
        });
}

// Function to display 8-day forecast
function displayForecast(forecastData) {
    const forecastDisplay = document.querySelector('#forecast-display');
    forecastDisplay.innerHTML = ''; // Clear previous forecast

    // Skip today (index 0) and get next 8 days
    for (let i = 1; i <= 8; i++) {
        const dayData = forecastData.daily[i];
        if (!dayData) continue;

        const date = new Date(dayData.dt * 1000);
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';

        // Format date as "Mon, Jun 15"
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions);

        dayElement.innerHTML = `
            <span class="forecast-date">${formattedDate}</span>
            <span class="forecast-temp">${Math.round(dayData.temp.day)}°C</span>
            <span class="forecast-conditions">${dayData.weather[0].main}</span>
            <img class="forecast-icon" src="${getWeatherIcon(dayData.weather[0].icon)}" alt="Weather Icon">
        `;

        forecastDisplay.appendChild(dayElement);
    }


    document.getElementById('forecast-container').style.display = 'block';
}


// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchHongKongWeather();
});

// For searched city
let searchedCityTimeInterval;

weatherForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();  // Trim spaces from input
    // Track city search with Google Analytics
    try {
        const userLanguage = navigator.language || navigator.userLanguage || 'unknown';
        if (city && typeof city === 'string') {
            gtag('event', 'city_search', {
             event_category: 'Search',
             event_label: city, 
            user_language: userLanguage 
            });
            console.log("Sent GA event city_search with:", {
                event_label: city,
                user_language: userLanguage
              });
            }
    } catch (error) {
        console.error('Error tracking city search:', error);
    }

    weatherDisplay.innerHTML = '<p>Loading...</p>';  // Show loading message

    console.log("City:", city);  // Log the city name for debugging



    // Fetch coordinates from the Geocoding API
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=62f83c9eacacd4002bb87979caeab3f9`)
        .then(response => response.json())
        .then(data => {
            console.log("Geocoding API Response:", data);  // Log the Geocoding API response

            // Check if the response contains valid data
            if (Array.isArray(data) && data.length > 0) {
                
                // Data returned is an array, check its length
                const lat = data[0].lat;
                const lon = data[0].lon;
                console.log(`Latitude: ${lat}, Longitude: ${lon}`);  // Log coordinates to confirm


                // Fetch weather data from the One Call API
                fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=62f83c9eacacd4002bb87979caeab3f9`)
                    .then(response => response.json())
                    .then(weatherData => {
                        console.log("Weather Data Response:", weatherData);  // Log the weather data response

                        const location = data[0];
                        const displayName = `${location.name}, ${location.country}`;

                        const dateElement = document.createElement('p');
                        const timeElement = document.createElement('p');

                    

                        // Clear previous interval if exists
                        if (searchedCityTimeInterval) {
                            clearInterval(searchedCityTimeInterval);
                        }

                        // Update time with the city's timezone
                        const timezoneOffset = weatherData.timezone_offset || 0;
                        
                        // Initial update
                        updateDateTime(currentDate, currentTime, timezoneOffset);
                                                
                        // Set interval for continuous updates
                        searchedCityTimeInterval = setInterval(() => {
                            updateDateTime(currentDate, currentTime, timezoneOffset);
                        }, 1000);

                        if (weatherData.current) {
                            const sunriseTime = new Date(weatherData.current.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            const sunsetTime = new Date(weatherData.current.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            weatherDisplay.innerHTML = `
  <h2>Weather in ${displayName}</h2>
  <div class="weather-grid">
    <div class="weather-box">
      <span class="iconify" data-icon="solar:temperature-bold"></span>
      <p>Temperature: ${Math.round(weatherData.current.temp)}°C</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="solar:thermometer-bold-duotone"></span>
      <p>Feels Like: ${Math.round(weatherData.current.feels_like)}°C</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="material-symbols:humidity-percentage"></span>
      <p>Humidity: ${weatherData.current.humidity}%</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="solar:wind-bold"></span>
      <p>Wind Speed: ${weatherData.current.wind_speed} m/s</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="solar:sun-bold-duotone"></span>
      <p>Sunrise: ${sunriseTime}<br><br>Sunset: ${sunsetTime}</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="carbon:weather-station"></span>
      <p>Conditions: ${weatherData.current.weather[0].main}</p>
      <img 
    src="${getWeatherIcon(weatherData.current.weather[0].icon)}" 
    alt="Weather Icon"
    class="weather-condition-icon"
    >
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="solar:calendar-line-duotone"></span>
      <p>Local Date: ${currentDate.textContent}</p>
    </div>
    <div class="weather-box">
      <span class="iconify" data-icon="solar:clock-circle-bold-duotone"></span>
      <p>Local Time: ${currentTime.textContent}</p>
    </div>
  </div>
`;

                            

                            if (weatherData.daily) {
                                displayForecast(weatherData);
                            }
                            
                        } else {
                            weatherDisplay.innerHTML = `<p>Weather data not available for this location.</p>`;
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching weather data:", error);
                        weatherDisplay.innerHTML = `<p>Error fetching weather data. Please try again later.</p>`;
                    });
            } else {
                console.error("City not found:", data);  // Log if no city was found
                weatherDisplay.innerHTML = `<p>City not found. Please try again.</p>`;
            }
        })
        .catch(error => {
            console.error("Error fetching city data:", error);  // Log any errors
            weatherDisplay.innerHTML = `<p>Error fetching city data. Please try again later.</p>`;
        });
});
