const { NlpManager } = require('node-nlp');
const axios = require('axios');

// Initialize NLP manager
const manager = new NlpManager({ languages: ['en'] });

// Add weather-related training data
manager.addDocument('en', 'What is the weather today?', 'weather.today');
manager.addDocument('en', 'How is the weather in Pokhara?', 'weather.today');
manager.addDocument('en', 'What about tomorrow?', 'weather.tomorrow');
manager.addDocument('en', 'Will it rain tomorrow?', 'weather.tomorrow');
manager.addDocument('en', 'Weather forecast for tomorrow', 'weather.tomorrow');

// Add responses
manager.addAnswer('en', 'weather.today', 'Fetching today\'s weather for {{ city }}...');
manager.addAnswer('en', 'weather.tomorrow', 'Fetching tomorrow\'s weather for {{ city }}...');

// Train the model and process input
(async () => {
  await manager.train();
  console.log('🤖 Agent trained!');

  // Simulate a weather query for tomorrow
  const userMessage = 'What is the weather in Pokhara tomorrow?';
  const response = await manager.process('en', userMessage);

  if (response.intent === 'weather.today') {
    const weatherData = await getWeather('Pokhara', 'NP', false);
    console.log('🌤️ Agent:', weatherData);
  } else if (response.intent === 'weather.tomorrow') {
    const weatherData = await getWeather('Pokhara', 'NP', true);
    console.log('🌤️ Agent:', weatherData);
  }
})();

// Fetch weather from OpenWeatherMap API
async function getWeather(city, countryCode, isTomorrow = false) {
  const API_KEY = '91bc2f6735c2b9d7d7c7b71634686d6d'; // 🔹 Replace with your actual API key

  try {
    // Use forecast API for tomorrow
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},${countryCode}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    if (isTomorrow) {
      return parseTomorrowWeather(response.data);
    } else {
      return parseCurrentWeather(response.data);
    }
  } catch (error) {
    return "❌ Sorry, I couldn't fetch the weather.";
  }
}

// Parse current weather (not used for tomorrow)
function parseCurrentWeather(data) {
  return `Today in ${data.city.name}: ${data.list[0].weather[0].description}, Temperature: ${data.list[0].main.temp}°C`;
}

// Parse tomorrow's forecast
function parseTomorrowWeather(data) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  // Find the best forecast for tomorrow (closest to noon)
  const tomorrowForecast = data.list.find(entry =>
    entry.dt_txt.startsWith(tomorrowDate) && entry.dt_txt.includes("12:00:00")
  );

  if (!tomorrowForecast) return "❌ No forecast available for tomorrow.";

  return `🌤️ Tomorrow in ${data.city.name}: ${tomorrowForecast.weather[0].description}, Temperature: ${tomorrowForecast.main.temp}°C`;
}
