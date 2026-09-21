import { useState, useEffect } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_API_KEY;

function App() {
  const [weather, setWeather] = useState({});
  const [city, setCity] = useState("");
  const [search, setSearch] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = (e) => {
    setCity(e.target.value);
    e.preventDefault();
  };

  const handleSearch = () => {
    if (!city.trim() && !firstLoad) return;
    setSearch(!search);
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setLoading(true);
    setErrorMsg(null); // Limpiamos errores previos al iniciar nueva búsqueda

    const queryCity = firstLoad ? "London" : city;

    fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(queryCity)}&days=7&aqi=no&alerts=no`,
      { signal },
    )
      .then(async (res) => {
        const data = await res.json();

        // 2. Validación de respuesta HTTP o payload de error de WeatherAPI
        if (!res.ok || data.error) {
          const message = data.error?.message || "No se pudo obtener el clima";
          throw new Error(message);
        }

        return data;
      })
      .then((data) => {
        const formatedData = {
          location: data.location.name,
          region: data.location.region,
          country: data.location.country,
          temp_c: data.current.temp_c,
          conditionIcon: `https:${data.current.condition.icon}`,
          conditionText: data.current.condition.text,
          forecast: data.forecast.forecastday.map((day) => ({
            date: day.date,
            maxTemp: day.day.maxtemp_c,
            minTemp: day.day.mintemp_c,
            conditionIcon: `https:${day.day.condition.icon}`,
            conditionText: day.day.condition.text,
          })),
        };

        setWeather(formatedData);

        // Guardamos en el historial solo si NO es la carga inicial de defecto
        if (!firstLoad) {
          setHistorial((prevHistorial) => {
            const filtered = prevHistorial.filter(
              (item) =>
                item.location.toLowerCase() !==
                formatedData.location.toLowerCase(),
            );
            return [formatedData, ...filtered].slice(0, 5);
          });
        }
      })
      .then(() => {
        setCity("");
        if (firstLoad) setFirstLoad(false);
      })
      .catch((err) => {
        // 3. Ignorar abortos provocados por limpieza de componentes
        if (err.name === "AbortError") return;

        // Capturar errores reales de API o red y mostrarlos en UI
        console.error("Error detectado:", err.message);
        setErrorMsg(err.message);
      })
      .finally(() => {
        // 4. Garantizar que el estado de carga siempre se desactive
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [search]);

  return (
    <>
      <header className="header">
        <h1>Climio</h1>
        <section id="search">
          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="city">City:</label>
            <input
              id="city"
              type="text"
              placeholder="Enter city name"
              value={city}
              onChange={handleSubmit}
            />
            <button type="submit" className="btn" onClick={handleSearch}>
              Get Weather
            </button>
          </form>
        </section>
      </header>
      <div className="weather-info-container">
        {/* Renderizado condicional de Estado de Carga, Error o Datos */}
        <div className="weather">
          <div className="weather-header">
            <h2>Current Weather in:</h2>
            <div className="weather-location-info">
              <div className="container">
                <h2>{loading ? "..." : errorMsg ? "--" : weather.location}</h2>
                <div className="weather-region">
                  {loading ? (
                    "Loading..."
                  ) : errorMsg ? (
                    <span>--</span>
                  ) : weather.region ? (
                    <span>
                      {weather.region}
                      <br />
                      {weather.country}
                    </span>
                  ) : (
                    <span>{weather.country}</span>
                  )}
                </div>

                <h2>
                  {loading ? "Loading..." : errorMsg ? "--" : weather.temp_c}°C
                </h2>
                <h3>
                  {loading
                    ? "Loading..."
                    : errorMsg
                      ? "--"
                      : weather.conditionText}
                </h3>
                {!loading && !errorMsg && weather.conditionIcon && (
                  <img src={weather.conditionIcon} alt="weather icon" />
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}

          <div className="historial">
            <h2>Search History</h2>
            <ul>
              {historial.length === 0 ? (
                <li>No search history</li>
              ) : (
                historial.map((item) => (
                  <div
                    key={`${item.location}-${item.temp_c}`}
                    className="historial-item"
                  >
                    <span className="temperature-location">
                      <h3>{item.location}</h3>
                      <p className="historial-temp">
                        Temperature {item.temp_c}°C
                      </p>
                    </span>
                    <span className="historial-condition">
                      <img src={item.conditionIcon} alt="weather icon" />
                      <p>{item.conditionText}</p>
                    </span>

                    <button
                      className="btn"
                      onClick={() => {
                        setErrorMsg(null);
                        setWeather(item);
                      }}
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        <section id="forecast">
          <h2>Forecast</h2>
          <div className="forecast-container">
            {loading ? (
              <p>Loading...</p>
            ) : errorMsg ? (
              <p>--</p>
            ) : (
              weather.forecast?.map((day) => (
                <div key={day.date} className="forecast-day">
                  <div className="forecast-day-header">
                    <h4 className="forecast-day-title">{weather.location}</h4>
                    <p>{day.date}</p>
                  </div>
                  <div className="forecast-day-condition">
                    <img src={day.conditionIcon} alt="weather icon" />
                    <p>{day.conditionText}</p>
                  </div>
                  <div className="forecast-day-temp">
                    <p>Temperature:</p>
                    <p>
                      Max: {day.maxTemp}°C | Min: {day.minTemp}°C
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
