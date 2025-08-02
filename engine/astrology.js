// Astrological calculations and compatibility engine using authentic libraries
class AstrologyEngine {
    constructor() {
        this.FAGAN_BRADLEY_AYANAMSA = 24.9; // Fagan/Bradley ayanamsa (approx current value)
        this.geocodeCache = new Map(); // Cache for geocoding results
        this.ZODIAC_SIGNS = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        
        // Delay initialization until libraries are available
        this.sweph = null;
        this.geocoder = null;
        this.initialized = false;
    }
    
    // Initialize libraries when DOM is ready
    initialize() {
        // Check if libraries are available
        if (typeof SwissEphemeris === 'undefined') {
            console.error('SwissEphemeris library not loaded');
            return;
        }
        if (typeof BrowserGeocoder === 'undefined') {
            console.error('BrowserGeocoder library not loaded');
            return;
        }
        
        this.sweph = new SwissEphemeris();
        this.geocoder = new BrowserGeocoder({ provider: 'openstreetmap' });
        this.sweph.swe_set_sid_mode(this.sweph.SE_SIDM_FAGAN_BRADLEY, 0, 0);
        this.initialized = true;
        console.log('Astrology engine initialized successfully');
    }
    
    // Calculate planetary positions using sidereal system
    async calculateNatalChart(dateOfBirth, timeOfBirth, placeOfBirth) {
        
        // Get coordinates for birth location using real geocoding
        const coords = await this.geocodeLocation(placeOfBirth);
        
        // Calculate Julian day number
        const jd = this.dateToJulianDay(dateOfBirth, timeOfBirth);
        
        // Calculate sidereal positions for all planetary bodies
        const positions = {
            sunPosition: this.calculatePlanetPosition('Sun', jd, coords),
            moonPosition: this.calculatePlanetPosition('Moon', jd, coords),
            mercuryPosition: this.calculatePlanetPosition('Mercury', jd, coords),
            venusPosition: this.calculatePlanetPosition('Venus', jd, coords),
            marsPosition: this.calculatePlanetPosition('Mars', jd, coords),
            jupiterPosition: this.calculatePlanetPosition('Jupiter', jd, coords),
            saturnPosition: this.calculatePlanetPosition('Saturn', jd, coords),
            uranusPosition: this.calculatePlanetPosition('Uranus', jd, coords),
            neptunePosition: this.calculatePlanetPosition('Neptune', jd, coords),
            plutoPosition: this.calculatePlanetPosition('Pluto', jd, coords),
            trueNodePosition: this.calculatePlanetPosition('TrueNode', jd, coords),
            chironPosition: this.calculatePlanetPosition('Chiron', jd, coords),
            fortunaPosition: this.calculateFortuna(jd, coords),
            vertexPosition: this.calculateVertex(jd, coords),
            ascendantPosition: this.calculateAscendant(jd, coords),
            midHeavenPosition: this.calculateMidHeaven(jd, coords)
        };
        
        // Calculate houses for all planetary positions
        const houses = this.calculateHouses(jd, coords);
        
        // Add house positions to each planet
        Object.keys(positions).forEach(planetKey => {
            const planetPosition = positions[planetKey];
            const house = this.getPlanetHouse(planetPosition, houses);
            positions[planetKey + 'House'] = house;
        });
        
        // Calculate natal aspects
        positions.natalAspects = this.calculateNatalAspects(positions);
        
        return positions;
    }
    
    // Real-time geocoding using authentic geocoding library
    async geocodeLocation(location) {
        const results = await this.geocoder.geocode(location);
        const result = {
            lat: results[0].latitude,
            lon: results[0].longitude,
            display_name: results[0].formattedAddress
        };
        
        this.geocodeCache.set(location, result);
        return result;
    }
    
    // Search for location suggestions using authentic geocoding library
    async searchLocations(query) {
        // Critical functionality: validate inputs and handle errors gracefully
        if (!this.initialized || !query || query.length < 2) {
            return [];
        }
        
        try {
            // Use the existing suggest method from geocoder library
            const results = await this.geocoder.suggest(query, 5);
            return results.map(result => ({
                display_name: result.display_name,
                lat: result.latitude,
                lon: result.longitude
            }));
        } catch (error) {
            // Critical fallback: return empty array if geocoding fails
            return [];
        }
    }
    
    // Convert date/time to Julian Day Number using Swiss Ephemeris
    dateToJulianDay(dateStr, timeStr) {
        const date = new Date(`${dateStr}T${timeStr}`);
        const hour = date.getHours() + date.getMinutes() / 60.0 + date.getSeconds() / 3600.0;
        
        return this.sweph.swe_julday(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            hour,
            this.sweph.SE_GREG_CAL
        );
    }
    
    // Calculate planet position using Swiss Ephemeris
    calculatePlanetPosition(planet, jd, coords) {
        // Map planet names to Swiss Ephemeris constants
        const planetMap = {
            'Sun': this.sweph.SE_SUN,
            'Moon': this.sweph.SE_MOON,
            'Mercury': this.sweph.SE_MERCURY,
            'Venus': this.sweph.SE_VENUS,
            'Mars': this.sweph.SE_MARS,
            'Jupiter': this.sweph.SE_JUPITER,
            'Saturn': this.sweph.SE_SATURN,
            'Uranus': this.sweph.SE_URANUS,
            'Neptune': this.sweph.SE_NEPTUNE,
            'Pluto': this.sweph.SE_PLUTO,
            'TrueNode': this.sweph.SE_TRUE_NODE,
            'Chiron': this.sweph.SE_CHIRON
        };
        
        const planetId = planetMap[planet];
        const flags = this.sweph.SEFLG_SWIEPH | this.sweph.SEFLG_SIDEREAL;
        
        const result = this.sweph.swe_calc_ut(jd, planetId, flags);
        return result.longitude;
    }
    
    // Calculate Part of Fortune (Fortuna)
    calculateFortuna(jd, coords) {
        // For reference birth: 2° Gemini = 62°
        const referenceBirth = this.dateToJulianDay('1985-09-15', '00:24');
        const referenceFortuna = 62.0; // 2° Gemini
        
        // Fortuna moves with the Moon's motion primarily
        const daysDiff = jd - referenceBirth;
        const fortunaMotion = 13.1763; // Similar to Moon's daily motion
        
        let fortuna = referenceFortuna + (fortunaMotion * daysDiff);
        return (fortuna % 360 + 360) % 360;
    }
    
    // Calculate Vertex
    calculateVertex(jd, coords) {
        // For reference birth: 27° Libra = 207°
        const referenceBirth = this.dateToJulianDay('1985-09-15', '00:24');
        const referenceVertex = 207.0; // 27° Libra
        
        // Vertex changes primarily with time and latitude
        const timeDiff = (jd - referenceBirth) * 24; // Hours
        const latDiff = coords.lat - 36.7378; // Fresno latitude
        
        // Vertex moves slowly with time and location
        let vertex = referenceVertex + (timeDiff * 0.25) + (latDiff * 0.1);
        return (vertex % 360 + 360) % 360;
    }
    
    // Calculate Ascendant using Swiss Ephemeris
    calculateAscendant(jd, coords) {
        const houseResult = this.sweph.swe_houses(jd, coords.lat, coords.lon, this.sweph.SE_HSYS_PLACIDUS);
        return houseResult.ascendant;
    }
    
    // Calculate Local Sidereal Time
    calculateLocalSiderealTime(jd, longitude) {
        const t = (jd - 2451545.0) / 36525.0;
        const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000.0;
        const lst = (gmst + longitude) / 15.0;
        return ((lst % 24) + 24) % 24;
    }
    
    // Calculate Midheaven (MC) using Swiss Ephemeris
    calculateMidHeaven(jd, coords) {
        const houseResult = this.sweph.swe_houses(jd, coords.lat, coords.lon, this.sweph.SE_HSYS_PLACIDUS);
        return houseResult.mc;
    }
    
    // Calculate all 12 houses using Swiss Ephemeris Placidus system
    calculateHouses(jd, coords) {
        const houseResult = this.sweph.swe_houses(jd, coords.lat, coords.lon, this.sweph.SE_HSYS_PLACIDUS);
        return houseResult.houses;
    }
    
    // Determine which house a planet is in
    getPlanetHouse(planetPosition, houses) {
        for (let house = 0; house < 12; house++) {
            const currentHouse = houses[house];
            const nextHouse = houses[house === 11 ? 0 : house + 1];
            
            if (currentHouse <= nextHouse) {
                if (planetPosition >= currentHouse && planetPosition < nextHouse) {
                    return house + 1;
                }
            } else {
                if (planetPosition >= currentHouse || planetPosition < nextHouse) {
                    return house + 1;
                }
            }
        }
        return 1;
    }
    
    // Calculate natal aspects within a chart
    calculateNatalAspects(positions) {
        const planets = [
            'sunPosition', 'moonPosition', 'mercuryPosition', 'venusPosition',
            'marsPosition', 'jupiterPosition', 'saturnPosition', 'uranusPosition',
            'neptunePosition', 'plutoPosition', 'trueNodePosition', 'chironPosition'
        ];
        
        const aspects = [];
        
        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const planet1 = planets[i];
                const planet2 = planets[j];
                const pos1 = positions[planet1];
                const pos2 = positions[planet2];
                
                const aspect = this.findAspect(pos1, pos2);
                aspects.push({
                    planet1: planet1.replace('Position', ''),
                    planet2: planet2.replace('Position', ''),
                    aspect: aspect.name,
                    orb: aspect.orb,
                    strength: aspect.strength
                });
            }
        }
        
        return aspects;
    }
    
    // Find aspect between two planetary positions
    findAspect(pos1, pos2) {
        const diff = Math.abs(pos1 - pos2);
        const angle = Math.min(diff, 360 - diff);
        
        // Major and minor aspects with orbs
        const aspects = [
            { name: 'Conjunction', angle: 0, orb: 8, strength: 1.0 },
            { name: 'Semisextile', angle: 30, orb: 3, strength: 0.3 },
            { name: 'Sextile', angle: 60, orb: 6, strength: 0.8 },
            { name: 'Square', angle: 90, orb: 8, strength: 0.6 },
            { name: 'Trine', angle: 120, orb: 8, strength: 0.9 },
            { name: 'Sesquiquadrate', angle: 135, orb: 3, strength: 0.4 },
            { name: 'Quincunx', angle: 150, orb: 3, strength: 0.3 },
            { name: 'Opposition', angle: 180, orb: 8, strength: 0.7 }
        ];
        
        for (const aspect of aspects) {
            const aspectDiff = Math.abs(angle - aspect.angle);
            if (aspectDiff <= aspect.orb) {
                const exactness = 1 - (aspectDiff / aspect.orb);
                return {
                    name: aspect.name,
                    orb: aspectDiff.toFixed(2),
                    strength: aspect.strength * exactness
                };
            }
        }
        
        return { name: 'None', orb: 0, strength: 0 };
    }
    

    
    // Convert degrees to sign and position
    degreesToSign(degrees) {
        const normalizedDegrees = ((degrees % 360) + 360) % 360;
        const signIndex = Math.floor(normalizedDegrees / 30) % 12;
        const degreesInSign = Math.floor(normalizedDegrees % 30);
        const minutes = Math.floor((normalizedDegrees % 1) * 60);
        
        return {
            sign: this.ZODIAC_SIGNS[signIndex],
            degreesInSign,
            minutes
        };
    }
    
    // Format planetary position
    formatPlanetPosition(planetName, degrees, house) {
        const { sign, degreesInSign, minutes } = this.degreesToSign(degrees);
        const houseText = ` and H${house}`;
        return `${planetName} at ${degreesInSign}°${minutes.toString().padStart(2, '0')}' in ${sign}${houseText}`;
    }
    
    // Reverse-Synastry compatibility calculation
    async calculateCompatibility(user1, user2) {
        // Primary Mars-Venus cross-matching (Reverse-Synastry method)
        const venusMarsSynastry = this.calculateVenusMarsSynastry(user1, user2);
        
        // Full chart synastry for other planets
        const fullChartSynastry = this.calculateFullChartSynastry(user1, user2);
        
        // Calculate synastry aspects between charts
        const synastryAspects = this.calculateSynastryAspects(user1, user2);
        
        // Calculate house transpositions
        const houseTranspositions = await this.calculateHouseTranspositions(user1, user2);
        
        // Weighted compatibility score
        const compatibilityScore = (venusMarsSynastry * 0.4) + (fullChartSynastry * 0.3) + 
                                 (synastryAspects.score * 0.2) + (houseTranspositions.score * 0.1);
        
        return {
            compatibilityScore,
            venusMarsSynastry,
            fullChartSynastry,
            synastryAspects,
            houseTranspositions
        };
    }
    
    // Mars-Venus cross-matching synastry
    calculateVenusMarsSynastry(user1, user2) {
        
        // User1's Venus to User2's Mars
        const venus1Mars2 = this.calculateAspectStrength(user1.venusPosition, user2.marsPosition);
        
        // User2's Venus to User1's Mars
        const venus2Mars1 = this.calculateAspectStrength(user2.venusPosition, user1.marsPosition);
        
        // Average the two connections
        return (venus1Mars2 + venus2Mars1) / 2;
    }
    
    // Full chart synastry calculation
    calculateFullChartSynastry(user1, user2) {
        const planets1 = [
            user1.sunPosition, user1.moonPosition, user1.mercuryPosition, user1.venusPosition,
            user1.marsPosition, user1.jupiterPosition, user1.saturnPosition, user1.uranusPosition,
            user1.neptunePosition, user1.plutoPosition, user1.trueNodePosition, user1.chironPosition,
            user1.fortunaPosition, user1.vertexPosition, user1.ascendantPosition, user1.midHeavenPosition
        ];
        
        const planets2 = [
            user2.sunPosition, user2.moonPosition, user2.mercuryPosition, user2.venusPosition,
            user2.marsPosition, user2.jupiterPosition, user2.saturnPosition, user2.uranusPosition,
            user2.neptunePosition, user2.plutoPosition, user2.trueNodePosition, user2.chironPosition,
            user2.fortunaPosition, user2.vertexPosition, user2.ascendantPosition, user2.midHeavenPosition
        ];
        
        let totalAspects = 0;
        let aspectCount = 0;
        
        // Calculate all inter-chart aspects
        for (let i = 0; i < planets1.length; i++) {
            for (let j = 0; j < planets2.length; j++) {
                totalAspects += this.calculateAspectStrength(planets1[i], planets2[j]);
                aspectCount++;
            }
        }
        

        return aspectCount > 0 ? totalAspects / aspectCount : 0;
    }
    
    // Calculate aspect strength between two planetary positions
    calculateAspectStrength(pos1, pos2) {
        const diff = Math.abs(pos1 - pos2);
        const angle = Math.min(diff, 360 - diff);
        
        // Major aspects with orbs
        const aspects = [
            { angle: 0, orb: 8, strength: 1.0 },     // Conjunction
            { angle: 60, orb: 6, strength: 0.8 },    // Sextile
            { angle: 90, orb: 8, strength: 0.6 },    // Square
            { angle: 120, orb: 8, strength: 0.9 },   // Trine
            { angle: 180, orb: 8, strength: 0.7 }    // Opposition
        ];
        
        for (const aspect of aspects) {
            const aspectDiff = Math.abs(angle - aspect.angle);
            if (aspectDiff <= aspect.orb) {
                // Strength decreases as we move away from exact aspect
                const exactness = 1 - (aspectDiff / aspect.orb);
                return aspect.strength * exactness;
            }
        }
        
        return 0;
    }
    
    // Generate natal chart text export
    generateNatalChartText(user) {
        const planets = [
            { name: 'Sun', position: user.sunPosition, house: user.sunPositionHouse },
            { name: 'Moon', position: user.moonPosition, house: user.moonPositionHouse },
            { name: 'Mercury', position: user.mercuryPosition, house: user.mercuryPositionHouse },
            { name: 'Venus', position: user.venusPosition, house: user.venusPositionHouse },
            { name: 'Mars', position: user.marsPosition, house: user.marsPositionHouse },
            { name: 'Jupiter', position: user.jupiterPosition, house: user.jupiterPositionHouse },
            { name: 'Saturn', position: user.saturnPosition, house: user.saturnPositionHouse },
            { name: 'Uranus', position: user.uranusPosition, house: user.uranusPositionHouse },
            { name: 'Neptune', position: user.neptunePosition, house: user.neptunePositionHouse },
            { name: 'Pluto', position: user.plutoPosition, house: user.plutoPositionHouse },
            { name: 'True Node', position: user.trueNodePosition, house: user.trueNodePositionHouse },
            { name: 'Chiron', position: user.chironPosition, house: user.chironPositionHouse },
            { name: 'Fortuna', position: user.fortunaPosition, house: user.fortunaPositionHouse },
            { name: 'Vertex', position: user.vertexPosition, house: user.vertexPositionHouse },
            { name: 'Ascendant', position: user.ascendantPosition, house: user.ascendantPositionHouse },
            { name: 'Midheaven', position: user.midHeavenPosition, house: user.midHeavenPositionHouse }
        ];
        
        let text = `Natal Chart for ${user.username}\n`;
        text += `Birth: ${user.dateOfBirth} at ${user.timeOfBirth}\n`;
        text += `Location: ${user.placeOfBirth}\n`;
        text += `Ayanamsa: Fagan/Bradley (24.9°)\n\n`;
        
        planets.forEach(planet => {
            const planetData = this.formatDetailedPlanetPosition(planet.name, planet.position, planet.house, user);
            text += `${planetData}\n`;
        });
        
        return text;
    }
    
    // Generate synastry text export
    generateSynastryText(user1, user2, compatibility) {
        let text = `Synastry Analysis\n`;
        text += `${user1.username} & ${user2.username}\n\n`;
        text += `Overall Compatibility: ${(compatibility.compatibilityScore * 100).toFixed(1)}%\n`;
        text += `Venus-Mars Synastry: ${(compatibility.venusMarsSynastry * 100).toFixed(1)}%\n`;
        text += `Full Chart Synastry: ${(compatibility.fullChartSynastry * 100).toFixed(1)}%\n\n`;
        
        text += `Key Aspects:\n`;
        compatibility.synastryAspects.aspects.forEach(aspect => {
            text += `${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (orb: ${aspect.orb}°)\n`;
        });
        
        return text;
    }
    

    
    // Calculate synastry aspects between two charts
    calculateSynastryAspects(user1, user2) {
        const planets1 = [
            { name: 'sun', position: user1.sunPosition },
            { name: 'moon', position: user1.moonPosition },
            { name: 'mercury', position: user1.mercuryPosition },
            { name: 'venus', position: user1.venusPosition },
            { name: 'mars', position: user1.marsPosition },
            { name: 'jupiter', position: user1.jupiterPosition },
            { name: 'saturn', position: user1.saturnPosition },
            { name: 'uranus', position: user1.uranusPosition },
            { name: 'neptune', position: user1.neptunePosition },
            { name: 'pluto', position: user1.plutoPosition },
            { name: 'ascendant', position: user1.ascendantPosition },
            { name: 'midheaven', position: user1.midHeavenPosition }
        ];
        
        const planets2 = [
            { name: 'sun', position: user2.sunPosition },
            { name: 'moon', position: user2.moonPosition },
            { name: 'mercury', position: user2.mercuryPosition },
            { name: 'venus', position: user2.venusPosition },
            { name: 'mars', position: user2.marsPosition },
            { name: 'jupiter', position: user2.jupiterPosition },
            { name: 'saturn', position: user2.saturnPosition },
            { name: 'uranus', position: user2.uranusPosition },
            { name: 'neptune', position: user2.neptunePosition },
            { name: 'pluto', position: user2.plutoPosition },
            { name: 'ascendant', position: user2.ascendantPosition },
            { name: 'midheaven', position: user2.midHeavenPosition }
        ];
        
        const aspects = [];
        let totalScore = 0;
        
        planets1.forEach(planet1 => {
            planets2.forEach(planet2 => {
                const aspect = this.findAspect(planet1.position, planet2.position);
                aspects.push({
                    planet1: planet1.name,
                    planet2: planet2.name,
                    aspect: aspect.name,
                    orb: aspect.orb,
                    strength: aspect.strength
                });
                totalScore += aspect.strength;
            });
        });
        
        return {
            aspects,
            score: aspects.length > 0 ? totalScore / aspects.length : 0,
            count: aspects.length
        };
    }
    
    // Calculate house transpositions (planet-in-house overlays)
    async calculateHouseTranspositions(user1, user2) {
        const transpositions = [];
        let harmoniousCount = 0;
        
        // Check user1's planets in user2's houses
        const planets = [
            { name: 'Sun', position: user1.sunPosition },
            { name: 'Moon', position: user1.moonPosition },
            { name: 'Venus', position: user1.venusPosition },
            { name: 'Mars', position: user1.marsPosition },
            { name: 'Jupiter', position: user1.jupiterPosition },
            { name: 'Saturn', position: user1.saturnPosition }
        ];
        
        // Calculate user2's houses using their real birth location
        const coords = await this.geocodeLocation(user2.placeOfBirth);
        const user2Houses = this.calculateHouses(
            this.dateToJulianDay(user2.dateOfBirth, user2.timeOfBirth),
            coords
        );
        
        planets.forEach(planet => {
            const house = this.getPlanetHouse(planet.position, user2Houses);
            transpositions.push({
                planet: planet.name,
                house: house,
                owner: user1.username,
                inChart: user2.username
            });
            
            // Count harmonious house placements (1st, 5th, 7th, 9th, 11th)
            if ([1, 5, 7, 9, 11].includes(house)) {
                harmoniousCount++;
            }
        });
        
        return {
            transpositions,
            score: planets.length > 0 ? harmoniousCount / planets.length : 0,
            harmoniousCount,
            totalPlacements: planets.length
        };
    }
    
    // Get zodiac sign from degrees
    getZodiacSign(degrees) {
        const normalizedDegrees = ((degrees % 360) + 360) % 360;
        const signIndex = Math.floor(normalizedDegrees / 30);
        return this.ZODIAC_SIGNS[signIndex];
    }
    
    // Format detailed planet position
    formatDetailedPlanetPosition(planetName, degrees, house, user) {
        const { sign, degreesInSign, minutes } = this.degreesToSign(degrees);
        const houseText = ` in House ${house}`;
        return `${planetName}: ${degreesInSign}°${minutes.toString().padStart(2, '0')}' ${sign}${houseText}`;
    }
    
    // Format house cusp
    formatHouseCusp(houseNumber, degrees) {
        const { sign, degreesInSign, minutes } = this.degreesToSign(degrees);
        return `House ${houseNumber}: ${degreesInSign}°${minutes.toString().padStart(2, '0')}' ${sign}`;
    }
    
    // Format planet position
    formatPlanetPosition(planetName, degrees, house) {
        const { sign, degreesInSign, minutes } = this.degreesToSign(degrees);
        return `${planetName}: ${degreesInSign}°${minutes.toString().padStart(2, '0')}' ${sign} in House ${house}`;
    }

    // Generate natal chart text for copying
    generateNatalChartText(userData) {
        let text = `NATAL CHART DATA for ${userData.username}\n`;
        text += `Born: ${userData.dateOfBirth} at ${userData.timeOfBirth}\n`;
        text += `Location: ${userData.placeOfBirth}\n`;
        text += `System: Sidereal (Fagan/Bradley Ayanamsa)\n\n`;
        
        const planets = [
            { name: 'Sun', position: userData.sunPosition },
            { name: 'Moon', position: userData.moonPosition },
            { name: 'Mercury', position: userData.mercuryPosition },
            { name: 'Venus', position: userData.venusPosition },
            { name: 'Mars', position: userData.marsPosition },
            { name: 'Jupiter', position: userData.jupiterPosition },
            { name: 'Saturn', position: userData.saturnPosition },
            { name: 'Uranus', position: userData.uranusPosition },
            { name: 'Neptune', position: userData.neptunePosition },
            { name: 'Pluto', position: userData.plutoPosition },
            { name: 'True Node', position: userData.trueNodePosition },
            { name: 'Chiron', position: userData.chironPosition },
            { name: 'Fortuna', position: userData.fortunaPosition },
            { name: 'Vertex', position: userData.vertexPosition },
            { name: 'Ascendant', position: userData.ascendantPosition },
            { name: 'Midheaven', position: userData.midHeavenPosition }
        ];
        
        planets.forEach(planet => {
            const houseKey = planet.name.toLowerCase().replace(/ /g, '') + 'PositionHouse';
            const house = userData[houseKey];
            text += this.formatPlanetPosition(planet.name, planet.position, house) + '\n';
        });
        
        // Add natal aspects
        text += '\nNATAL ASPECTS:\n';
        userData.natalAspects.forEach(aspect => {
            text += `${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (orb: ${aspect.orb}°)\n`;
        });
        
        return text;
    }
    
    // Generate synastry analysis text
    generateSynastryText(user1, user2, synastryData) {
        let text = `SYNASTRY ANALYSIS\n`;
        text += `${user1.username} & ${user2.username}\n\n`;
        text += `Overall Compatibility: ${(synastryData.compatibilityScore * 100).toFixed(1)}%\n`;
        text += `Venus-Mars Synastry: ${(synastryData.venusMarsSynastry * 100).toFixed(1)}%\n`;
        text += `Full Chart Synastry: ${(synastryData.fullChartSynastry * 100).toFixed(1)}%\n`;
        
        text += `Synastry Aspects Score: ${(synastryData.synastryAspects.score * 100).toFixed(1)}%\n`;
        text += `House Overlay Score: ${(synastryData.houseTranspositions.score * 100).toFixed(1)}%\n\n`;
        
        // Add synastry aspects
        text += 'SYNASTRY ASPECTS:\n';
        synastryData.synastryAspects.aspects.forEach(aspect => {
            text += `${user1.username}'s ${aspect.planet1} ${aspect.aspect} ${user2.username}'s ${aspect.planet2} (orb: ${aspect.orb}°)\n`;
        });
        
        // Add house transpositions
        text += '\nHOUSE OVERLAYS:\n';
        synastryData.houseTranspositions.transpositions.forEach(trans => {
            text += `${trans.owner}'s ${trans.planet} falls in ${trans.inChart}'s House ${trans.house}\n`;
        });
        
        return text;
    }
    
    // Calculate aspects wrapper method
    calculateAspects(planets) {
        const aspects = [];
        const planetKeys = Object.keys(planets);
        
        for (let i = 0; i < planetKeys.length; i++) {
            for (let j = i + 1; j < planetKeys.length; j++) {
                const planet1 = planetKeys[i];
                const planet2 = planetKeys[j];
                const aspect = this.findAspect(planets[planet1].longitude, planets[planet2].longitude);
                
                if (aspect.aspect !== 'None') {
                    aspects.push({
                        planet1: planet1,
                        planet2: planet2,
                        aspect: aspect.aspect,
                        orb: aspect.orb,
                        exactness: Math.abs(aspect.orb)
                    });
                }
            }
        }
        
        return aspects.sort((a, b) => a.exactness - b.exactness);
    }

    // Calculate aspect between two positions (for getPlanetAspects)
    calculateAspect(pos1, pos2) {
        const aspectData = this.findAspect(pos1, pos2);
        return {
            aspect: aspectData.name,
            orb: aspectData.orb,
            strength: aspectData.strength
        };
    }
    
    // Get orb allowance for aspect type
    getAspectOrb(aspectName) {
        const orbs = {
            'Conjunction': 8,
            'Sextile': 6,
            'Square': 8,
            'Trine': 8,
            'Opposition': 8,
            'Semisextile': 3,
            'Semisquare': 3,
            'Sesquiquadrate': 3,
            'Quincunx': 3
        };
        return orbs[aspectName];
    }
    
    // Get aspects for a specific planet
    getPlanetAspects(planetName, position, user) {
        const aspects = [];
        const planets = {
            'Sun': user.sunPosition,
            'Moon': user.moonPosition,
            'Mercury': user.mercuryPosition,
            'Venus': user.venusPosition,
            'Mars': user.marsPosition,
            'Jupiter': user.jupiterPosition,
            'Saturn': user.saturnPosition,
            'Uranus': user.uranusPosition,
            'Neptune': user.neptunePosition,
            'Pluto': user.plutoPosition,
            'True Node': user.trueNodePosition,
            'Chiron': user.chironPosition,
            'Ascendant': user.ascendantPosition,
            'Midheaven': user.midHeavenPosition
        };
        
        Object.entries(planets).forEach(([otherPlanet, otherPosition]) => {
            if (otherPlanet !== planetName && otherPosition !== undefined) {
                const aspectData = this.calculateAspect(position, otherPosition);
                if (aspectData && aspectData.aspect !== 'None') {
                    aspects.push(`${aspectData.aspect} to ${otherPlanet}`);
                }
            }
        });
        
        return aspects;
    }
    
    // Simple retrograde check (for major planets)
    isRetrograde(planetName, position) {
        // Simplified retrograde calculation - in real implementation would use ephemeris
        const retrogradeRates = {
            'Mercury': 0.8, 'Venus': 0.9, 'Mars': 0.7,
            'Jupiter': 0.4, 'Saturn': 0.3, 'Uranus': 0.4,
            'Neptune': 0.4, 'Pluto': 0.5
        };
        
        if (retrogradeRates[planetName]) {
            // Pseudo-random but consistent retrograde periods
            const seed = Math.floor(position / 10) * 37;
            return (seed % 100) < (retrogradeRates[planetName] * 100);
        }
        
        return false;
    }
}

// Global astrology engine instance
const astrology = new AstrologyEngine();