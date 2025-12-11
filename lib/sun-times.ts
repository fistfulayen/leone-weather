import * as SunCalc from 'suncalc';

// Cascina Leone coordinates (Niella Belbo, Piedmont, Italy)
const CASCINA_LEONE_LAT = 44.5667;
const CASCINA_LEONE_LON = 8.0167;

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

export function getSunTimes(date: Date = new Date()): SunTimes {
  const times = SunCalc.getTimes(date, CASCINA_LEONE_LAT, CASCINA_LEONE_LON);

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}
