import { NextRequest } from "next/server";
import { getCached, setCached, bustCache, TTL } from "@/lib/cache";

const CACHE_KEY = "weather";
const LAT = 33.2098;
const LON = -87.5692; // Tuscaloosa, AL

type WeatherData = {
  temp: number;
  high: number;
  low: number;
  description: string;
  rainChance: number;
  dressCode: string;
  location: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  updatedAt: number;
};

function getDressCode(temp: number, rainChance: number, description: string): string {
  const desc = description.toLowerCase();
  if (rainChance > 50 || desc.includes("rain") || desc.includes("storm")) return "umbrella";
  if (temp >= 80) return "shorts";
  if (temp >= 65) return "t-shirt";
  if (temp >= 50) return "light jacket";
  if (temp >= 35) return "jacket";
  return "heavy coat";
}

export async function GET(request: NextRequest) {
  const bust = request.nextUrl.searchParams.get("bust") === "1";
  if (bust) bustCache(CACHE_KEY);

  const cached = getCached<WeatherData>(CACHE_KEY);
  if (cached) return Response.json(cached);

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenWeatherMap API key not configured" }, { status: 500 });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=imperial`,
        { next: { revalidate: 0 } }
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=imperial&cnt=8`,
        { next: { revalidate: 0 } }
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error(`OpenWeatherMap error: ${currentRes.status}`);
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // Get today's high/low from 8-step (24hr) forecast
    const temps: number[] = forecast.list.map((item: { main: { temp: number } }) => item.main.temp);
    const high = Math.round(Math.max(...temps));
    const low = Math.round(Math.min(...temps));

    // Rain chance — max pop from next 8 periods
    const rainChance = Math.round(
      Math.max(...forecast.list.map((item: { pop: number }) => (item.pop || 0))) * 100
    );

    const temp = Math.round(current.main.temp);
    const description = current.weather[0].description;

    const data: WeatherData = {
      temp,
      high,
      low,
      description,
      rainChance,
      dressCode: getDressCode(temp, rainChance, description),
      location: "Tuscaloosa, AL",
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed),
      updatedAt: Date.now(),
    };

    setCached(CACHE_KEY, data, TTL.WEATHER);
    return Response.json(data);
  } catch (err) {
    console.error("[weather]", err);
    return Response.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }
}
