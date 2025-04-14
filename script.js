const weatherForm = document.querySelector('#weatherForm');
const cityInput = document.querySelector('#city');
const weatherDisplay = document.querySelector('#weatherDisplay');
const latitudeDisplay = document.querySelector('#latitude');
const longitudeDisplay = document.querySelector('#longitude');

weatherForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();  // Trim spaces from input

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

                // Display latitude and longitude
                //latitudeDisplay.textContent = lat;  // Update latitude display
                //longitudeDisplay.textContent = lon;  // Update longitude display

                // Fetch weather data from the One Call API
                fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=62f83c9eacacd4002bb87979caeab3f9`)
                    .then(response => response.json())
                    .then(weatherData => {
                        console.log("Weather Data Response:", weatherData);  // Log the weather data response

                        if (weatherData.current) {
                            weatherDisplay.innerHTML = `
                                <h2>Weather in ${city}</h2>
                                <p>Temperature: ${Math.round(weatherData.current.temp)}°C</p>
                                <p>Humidity: ${weatherData.current.humidity}%</p>
                                <p>Wind Speed: ${weatherData.current.wind_speed} m/s</p>
                            `;
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
