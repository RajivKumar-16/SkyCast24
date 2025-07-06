document.addEventListener("DOMContentLoaded", function () {
  const inputValue = document.getElementById("search-input");
  const searchButton = this.getElementById("search-button");
  const otherThings = this.getElementById("show-other-things");
  const contectMain = this.getElementById("content-section");
  const hourlySection = this.getElementById("hourly-section");
  const dailySection = this.getElementById("daily-section");

  let flag = "true";

  async function setWeatherIcon(elementId, weatherCode, dayType = "day") {
    await fetch(`data/weather-icon-${dayType}.json`)
      .then((response) => response.json())
      .then((iconMap) => {
        const iconClass = iconMap[weatherCode] || iconMap["default"];
        const iconElement = document.getElementById(elementId);
        if (iconElement) {
          iconElement.className = `wi ${iconClass}`;
        }
      })
      .catch((error) => console.error("Failed to load weather icon:", error));
  }

  function setTime() {
    try {
      const nowTime = new Date();
      document.getElementById("time-show").innerHTML = `<span>${nowTime
        .getHours()
        .toString()
        .padStart(2, "0")} : ${nowTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}</span>`;
    } catch (e) {
      console.log("SkyCast24 Error : " + e.message);
      otherThings.style.display = "flex";
      otherThings.innerHTML = `<p>Time Error</p>`;
      setTimeout(() => {
        otherThings.style.display = "none";
      }, 10000);
    }
  }

  async function getlatlon(cityName) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cityName
    )}&format=json`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data[0]);
      document.getElementById("search-input").value = `${data[0].display_name}`;
      return [data[0].lat, data[0].lon];
    } catch (err) {
      otherThings.style.display = "flex";
      otherThings.innerHTML = `<p>Invalid City Name Entered</p>`;
      console.log("SkyCast24 Error : " + err.message);
      setTimeout(() => {
        otherThings.style.display = "none";
      }, 10000);
      searchButton.textContent = "Search";
      inputValue.value = "";
    }
  }

  function searchClicked() {
    searchButton.textContent = "Searching...";
    flag = "flase";
    getlatlon(inputValue.value).then((output) => {
      getWeatherdetail(output[0], output[1]);
    });
  }

  function getCurrentLatLon() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            reject("Geolocation error: " + error.message);
          }
        );
      } else {
        reject("Geolocation is not supported.");
      }
    });
  }

  async function fetchLocation() {
    try {
      const [lat, lon] = await getCurrentLatLon();
      getWeatherdetail(lat, lon);
    } catch (error) {
      console.error(error);
    }
  }

  async function getWeatherdetail(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation,wind_direction_10m,is_day,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,relative_humidity_2m_min,relative_humidity_2m_max,wind_speed_10m_max&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&windspeed_unit=kmh`;
      const response = await fetch(url);
      const data = await response.json();

      // console.log(data);

      // set to default value
      document
        .getElementById("all-data-container")
        .setAttribute("style", "display: flex;flex-direction: column");
      searchButton.textContent = "Search";
      dailySection.innerHTML = "";
      hourlySection.innerHTML = "";

      let tempdate = data.current.time.split("T")[0].split("-");

      contectMain.innerHTML = `
      <div class="content-section-js">
      <div class="today-date">
        <div><span>${
          tempdate[2] + " - " + tempdate[1] + " - " + tempdate[0]
        }</span></div>
        <div id="time-show">00 : 00</div>
      </div>
      <p class="today-date"></p>
      <div class="temp-img">
         <div class="temp">
            <div><span class="temp-value">${
              data.current.temperature_2m
            }</span><span id="temp-unit">°C<span></div>
         </div>
         <div class="type-img">
            <div id="weather-type" loading="lazy"></div>
         </div>
      </div>
      <div class="precipitation-para">
         <div class="entity-text">
            Precipitation
         </div>
         <div class="precipitation-value-unit">
            <span id="precipitation-value">${
              data.current.precipitation
            }</span><span id="precipitation-unit">mm</span>
         </div>
      </div>
      <div class="precipitation-para">
         <div class="entity-text">
            Wind Speed
         </div>
         <div class="precipitation-value-unit">
            <span id="precipitation-value">${
              data.current.wind_speed_10m
            }</span><span
               id="precipitation-unit">km/h</span>
         </div>
      </div>

      <div class="wind-direction">
         <div class="text-wind-dir">
            <p class="wind-direction-para">Wind Direction</p>
         </div>
         <div>
         <div class="image-wind-direction">
            <img id="below-image" loading="lazy" src="assets/images/icons/direction-layout.png" alt="direction-layout" />
            <img id="upper-image" loading="lazy" src="assets/images/icons/direction-pointer.png" alt="direction-pointer" />
         </div>
         <div id="discription">
            <p>Towards</p>
         </div>
         </div>
      </div>

   </div>`;
      setInterval(setTime, 60000);
      setTime();
      const windDir = (data.current.wind_direction_10m + 180) % 360;
      document.getElementById(
        "upper-image"
      ).style.transform = `rotate(${windDir}deg)`;
      setWeatherIcon(
        "weather-type",
        data.current.weather_code,
        data.current.is_day ? "day" : "night"
      );

      for (let i = 0; i < 24; i++) {
        const appendData = document.createElement("div");
        const tempTime = data.hourly.time[i].split("T");
        appendData.innerHTML = `
        <div class="hour-box">
        <div id="mini-icon">
          <div id="mini-icon-content${i}" loading="lazy"></div>
        </div>
        <div id="mini-temp-container">
          <span class="mini-temp-value">${
            data.hourly.temperature_2m[i]
          }</span><span>°C<span>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Precipitation</p>
          <p><span id="mini-p-title-value">${
            data.hourly.precipitation[i]
          }</span><span id="mini-p-title-unit"> mm</span></p>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Humidity</p>
          <p><span id="mini-p-title-value">${
            data.hourly.relative_humidity_2m[i]
          }</span><span id="mini-p-title-unit"> %</span></p>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Wind Speed</p>
          <p><span id="mini-p-title-value">${
            data.hourly.wind_speed_10m[i]
          }</span><span id="mini-p-title-unit"> km/h</span></p>
        </div>
        <div class="interval-element">
          <p>${tempTime[1].split(":")[0] + " : " + "00"} - ${
          (Number(tempTime[1].split(":")[0]) + 1).toString().padStart(2, "0") +
          " : " +
          "00"
        }</p>
        </div>
      </div>
      `;
        // add night json also and fix this...
        setWeatherIcon(
          "mini-icon-content" + i,
          data.hourly.weather_code[i],
          Number(tempTime[1].split(":")[0]) >= 5 &&
            Number(tempTime[1].split(":")[0]) < 19
            ? "day"
            : "night"
        );

        hourlySection.appendChild(appendData);
      }

      for (let i = 0; i < 7; i++) {
        const appendData = document.createElement("div");
        const date_holder = data.daily.time[i].split("-");
        // console.log(date_holder);
        appendData.innerHTML = `
        <div class="daily-box">
        <div id="mini-icon">
          <div id="mini-icon-content-daily${i}" loading="lazy"></div>
        </div>
        <div id="mini-temp-container-box">
          <div class="mini-temp-daily-min">
            <span class="daily-mini-temp-value">${
              data.daily.temperature_2m_min[i]
            }</span><span>°C<span></span>
          </div>
          <div class="mini-temp-daily-max">
            <span class="daily-mini-temp-value">${
              data.daily.temperature_2m_max[i]
            }</span><span>°C<span></span>
          </div>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Precipitation</p>
          <p><span id="mini-p-title-value">${
            data.daily.precipitation_sum[i]
          }</span><span id="mini-p-title-unit"> mm</span></p>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Humidity</p>
          <div class="daily-humidity-container">
            <div class="daily-humidity-min">
              <p><span id="mini-p-title-value">${
                data.daily.relative_humidity_2m_min[i]
              }</span><span id="mini-p-title-unit"> % min</span></p>
            </div>
            <div class="daily-humidity-max">
              <p><span id="mini-p-title-value">${
                data.daily.relative_humidity_2m_max[i]
              }</span><span id="mini-p-title-unit"> % max</span></p>
            </div>
          </div>
        </div>
        <div id="mini-precipitation-container">
          <p id="mini-p-title">Wind Speed</p>
          <p><span id="mini-p-title-value">${
            data.daily.wind_speed_10m_max[i]
          }</span><span id="mini-p-title-unit"> km/h</span></p>
        </div>
        <div class="interval-element">
          
          <p>${
            date_holder[2] + " - " + date_holder[1] + " - " + date_holder[0]
          }</p>
        </div>
        
      </div>`;
        setWeatherIcon(
          "mini-icon-content-daily" + i,
          data.daily.weather_code[i]
        );

        dailySection.appendChild(appendData);
      }
    } catch (e) {
      console.log("SkyCast24 Error : " + err.message);
      otherThings.style.display = "flex";
      otherThings.innerHTML = `
        <p>Weather Data Not Available</p><br><p>Please try again later</p>`;
    }
  }

  if (navigator.onLine) {
    if (flag) {
      fetchLocation();
    }
    searchButton.addEventListener("click", searchClicked);
  } else {
    throw new Error("SkyCast24 Error : Your system is offline");
    otherThings.style.display = "flex";
    otherThings.innerHTML = `
        <p>looks like you are offline</p>`;
  }
});
