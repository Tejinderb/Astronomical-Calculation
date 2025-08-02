/**
 * Swiss Ephemeris Reference Library
 * A simplified, browser-compatible implementation for calculating astronomical positions.
 * Based on the official sweph library: https://github.com/timotejroiko/sweph
 * @class
 */
class SwissEphemeris {
  
// Initializes the Swiss Ephemeris with constants for celestial bodies, calendars, and calculation flags.
// @constructor
  constructor() {
    // Celestial body constants
    this.SE_SUN = 0;
    this.SE_MOON = 1;
    this.SE_MERCURY = 2;
    this.SE_VENUS = 3;
    this.SE_MARS = 4;
    this.SE_JUPITER = 5;
    this.SE_SATURN = 6;
    this.SE_URANUS = 7;
    this.SE_NEPTUNE = 8;
    this.SE_PLUTO = 9;
    this.SE_TRUE_NODE = 11;
    this.SE_CHIRON = 15;

    // Calendar constants
    this.SE_GREG_CAL = 1;
    this.SE_JUL_CAL = 0;

    // Calculation flags
    this.SEFLG_SPEED = 256;
    this.SEFLG_SWIEPH = 2;
    this.SEFLG_SIDEREAL = 64;

    // Sidereal modes (ayanamsas)
    this.SE_SIDM_FAGAN_BRADLEY = 0;
    this.SE_SIDM_LAHIRI = 1;

    // House systems
    this.SE_HSYS_PLACIDUS = "P";
    this.SE_HSYS_KOCH = "K";
    this.SE_HSYS_EQUAL = "E";

    // Internal state
    this.siderealMode = this.SE_SIDM_FAGAN_BRADLEY;
  }

  
//    Calculates the Julian Day Number from a given date and time.
//    @param {number} year - The year (e.g., 2025).
//    @param {number} month - The month (1-12).
//    @param {number} day - The day (1-31).
//    @param {number} hour - The hour (0-23, can include decimal for minutes/seconds).
//    @param {number} [calendar=this.SE_GREG_CAL] - Calendar type (Gregorian or Julian).
//    @returns {number} The Julian Day Number.
//    @throws {Error} If invalid date parameters are provided.

  swe_julday(year, month, day, hour, calendar = this.SE_GREG_CAL) {
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour >= 24
    ) {
      throw new Error("Invalid date or time parameters");
    }

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4);

    if (calendar === this.SE_GREG_CAL) {
      jd = jd - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    } else if (calendar === this.SE_JUL_CAL) {
      jd = jd - 32083;
    } else {
      throw new Error("Invalid calendar type");
    }

    return jd + (hour - 12) / 24.0;
  }


//    Calculates the position of a celestial body at a given Universal Time.
//    @param {number} tjd_ut - Julian Day Number (UT).
//    @param {number} planet - Planet/body identifier (e.g., this.SE_SUN).
//    @param {number} flags - Calculation flags (e.g., this.SEFLG_SIDEREAL).
//    @returns {Object} Object containing longitude, latitude, distance, and their speeds.
//    @throws {Error} If invalid planet or flags are provided.

  swe_calc_ut(tjd_ut, planet, flags) {
    if (!Number.isFinite(tjd_ut)) {
      throw new Error("Invalid Julian Day Number");
    }
    if (!Number.isInteger(planet) || planet < 0) {
      throw new Error("Invalid planet identifier");
    }

    const T = (tjd_ut - 2451545.0) / 36525.0;
    let longitude = 0;

    // Simplified mean orbital elements (approximations)
    const orbitalElements = {
      [this.SE_SUN]: { L: 280.46, M: 36000.771 },
      [this.SE_MOON]: { L: 218.316, M: 481267.881 },
      [this.SE_MERCURY]: { L: 252.25, M: 149472.674 },
      [this.SE_VENUS]: { L: 181.979, M: 58517.816 },
      [this.SE_MARS]: { L: 355.433, M: 19140.299 },
      [this.SE_JUPITER]: { L: 34.351, M: 3034.906 },
      [this.SE_SATURN]: { L: 50.077, M: 1222.114 },
      [this.SE_URANUS]: { L: 314.055, M: 428.479 },
      [this.SE_NEPTUNE]: { L: 304.348, M: 218.486 },
      [this.SE_PLUTO]: { L: 238.958, M: 145.209 },
      [this.SE_TRUE_NODE]: { L: 125.045, M: -1934.136 },
      [this.SE_CHIRON]: { L: 207.224, M: 1364.681 },
    };

    if (planet in orbitalElements) {
      const { L, M } = orbitalElements[planet];
      longitude = L + M * T;
    } else {
      throw new Error("Unsupported celestial body");
    }

    // Apply sidereal correction if requested
    if (flags & this.SEFLG_SIDEREAL) {
      const ayanamsa =
        this.siderealMode === this.SE_SIDM_FAGAN_BRADLEY ? 24.9 : 23.8; // Lahiri
      longitude -= ayanamsa;
    }

    // Normalize to 0-360 degrees
    longitude = ((longitude % 360) + 360) % 360;

    return {
      longitude,
      latitude: 0, // Simplified: ecliptic latitude
      distance: 1, // Simplified: distance in AU
      longitudeSpeed: 0, // Simplified: speed in degrees/day
      latitudeSpeed: 0,
      distanceSpeed: 0,
    };
  }

//    Sets the sidereal mode for calculations.
//    @param {number} mode - Sidereal mode (e.g., this.SE_SIDM_FAGAN_BRADLEY).
//    @param {number} [t0=0] - Reference time for ayanamsa.
//    @param {number} [ayan_t0=0] - Initial ayanamsa value.
//     @throws {Error} If invalid mode is provided.

  swe_set_sid_mode(mode, t0 = 0, ayan_t0 = 0) {
    if (mode !== this.SE_SIDM_FAGAN_BRADLEY && mode !== this.SE_SIDM_LAHIRI) {
      throw new Error("Invalid sidereal mode");
    }
    this.siderealMode = mode;
  }


//    Calculates house cusps for a given location and time.
//    @param {number} tjd_ut - Julian Day Number (UT).
//    @param {number} lat - Geographic latitude (-90 to 90).
//    @param {number} lon - Geographic longitude (-180 to 180).
//    @param {string} hsys - House system (e.g., this.SE_HSYS_PLACIDUS).
//    @returns {Object} Object containing house cusps, ascendant, and midheaven.
//    @throws {Error} If invalid parameters are provided.

  swe_houses(tjd_ut, lat, lon, hsys) {
    if (
      !Number.isFinite(tjd_ut) ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      throw new Error("Invalid Julian Day, latitude, or longitude");
    }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new Error("Latitude or longitude out of range");
    }
    if (
      ![this.SE_HSYS_PLACIDUS, this.SE_HSYS_KOCH, this.SE_HSYS_EQUAL].includes(
        hsys
      )
    ) {
      throw new Error("Invalid house system");
    }

    const lst = this.calculateLocalSiderealTime(tjd_ut, lon);
    const houses = [];

    // Simplified equal house system for demonstration
    for (let i = 0; i < 12; i++) {
      const housePosition = (lst * 15 + i * 30) % 360;
      houses.push(housePosition);
    }

    return {
      houses,
      ascendant: houses[0],
      mc: houses[9],
    };
  }


//    Calculates the Local Sidereal Time for a given Julian Day and longitude.
//    @param {number} jd - Julian Day Number.
//    @param {number} longitude - Geographic longitude (-180 to 180).
//    @returns {number} Local Sidereal Time in hours.
//    @throws {Error} If invalid parameters are provided.

  calculateLocalSiderealTime(jd, longitude) {
    if (!Number.isFinite(jd) || !Number.isFinite(longitude)) {
      throw new Error("Invalid Julian Day or longitude");
    }
    if (Math.abs(longitude) > 180) {
      throw new Error("Longitude out of range");
    }

    const t = (jd - 2451545.0) / 36525.0;
    const gmst =
      280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
    const lst = (gmst + longitude) / 15.0;
    return ((lst % 24) + 24) % 24;
  }
}

// Browser and Node.js compatibility
if (typeof window !== "undefined") {
  window.SwissEphemeris = SwissEphemeris;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SwissEphemeris;
}
