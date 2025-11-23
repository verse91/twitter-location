const COUNTRY_FLAGS: Record<string, string> = {
    "Afghanistan": "🇦🇫",
    "Africa": "🌍",
    "Albania": "🇦🇱",
    "Algeria": "🇩🇿",
    "Argentina": "🇦🇷",
    "Australia": "🇦🇺",
    "Austria": "🇦🇹",
    "Bangladesh": "🇧🇩",
    "Belgium": "🇧🇪",
    "Brazil": "🇧🇷",
    "Canada": "🇨🇦",
    "Chile": "🇨🇱",
    "China": "🇨🇳",
    "Colombia": "🇨🇴",
    "Croatia": "🇭🇷",
    "Czech Republic": "🇨🇿",
    "Czechia": "🇨🇿",
    "Cyprus": "🇨🇾",
    "Denmark": "🇩🇰",
    "Egypt": "🇪🇬",
    "Europe": "🇪🇺",
    "European Union": "🇪🇺",
    "Finland": "🇫🇮",
    "France": "🇫🇷",
    "Germany": "🇩🇪",
    "Greece": "🇬🇷",
    "Hong Kong": "🇭🇰",
    "Hungary": "🇭🇺",
    "Iceland": "🇮🇸",
    "India": "🇮🇳",
    "Indonesia": "🇮🇩",
    "Iran": "🇮🇷",
    "Iraq": "🇮🇶",
    "Ireland": "🇮🇪",
    "Israel": "🇮🇱",
    "Italy": "🇮🇹",
    "Japan": "🇯🇵",
    "Kenya": "🇰🇪",
    "Malaysia": "🇲🇾",
    "Mexico": "🇲🇽",
    "Montenegro": "🇲🇪",
    "Netherlands": "🇳🇱",
    "New Zealand": "🇳🇿",
    "Nigeria": "🇳🇬",
    "Norway": "🇳🇴",
    "Pakistan": "🇵🇰",
    "Philippines": "🇵🇭",
    "Poland": "🇵🇱",
    "Portugal": "🇵🇹",
    "Romania": "🇷🇴",
    "Russia": "🇷🇺",
    "Saudi Arabia": "🇸🇦",
    "Singapore": "🇸🇬",
    "Slovakia": "🇸🇰",
    "Slovenia": "🇸🇮",
    "South Africa": "🇿🇦",
    "Korea": "🇰🇷",
    "South Korea": "🇰🇷",
    "Spain": "🇪🇸",
    "Sweden": "🇸🇪",
    "Switzerland": "🇨🇭",
    "Taiwan": "🇹🇼",
    "Thailand": "🇹🇭",
    "Turkey": "🇹🇷",
    "Ukraine": "🇺🇦",
    "United Arab Emirates": "🇦🇪",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    "Venezuela": "🇻🇪",
    "Viet Nam": "🇻🇳",
    "Vietnam": "🇻🇳",
    "East Asia & Pacific": "🌏",
    "East Asia and Pacific": "🌏",
    "East Asia": "🌏",
    "West Asia": "🌏",
    "Middle East": "🌏",
    "Middle East & North Africa": "🌏",
    "Sub-Saharan Africa": "🌍",
    "North Africa": "🌍",
    "South Asia": "🌏",
    "Central Asia": "🌏",
    "Southeast Asia": "🌏",
    "Latin America": "🌎",
    "Latin America & Caribbean": "🌎",
    "Caribbean": "🌎",
    "North America": "🌎",
    "South America": "🌎",
    "Oceania": "🌏",
    "Pacific": "🌏"
};

export default function getCountryFlag(countryName: string | null): string | null {
    if (!countryName) return null;

    const normalized = countryName.trim();

    if (COUNTRY_FLAGS[normalized]) {
        return COUNTRY_FLAGS[normalized];
    }

    const normalizedLower = normalized.toLowerCase();
    for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
        const countryLower = country.toLowerCase();
        if (countryLower === normalizedLower) {
            return flag;
        }
    }

    const normalizedNoSpaces = normalizedLower.replace(/\s+/g, '');
    for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
        const countryLower = country.toLowerCase();
        const countryNoSpaces = countryLower.replace(/\s+/g, '');

        if (normalizedNoSpaces === countryNoSpaces) {
            return flag;
        }
    }

    if (normalizedLower.includes('viet') && normalizedLower.includes('nam')) {
        const vietnamFlag = COUNTRY_FLAGS["Vietnam"] || COUNTRY_FLAGS["Viet Nam"];
        if (vietnamFlag) {
            return vietnamFlag;
        }
    }

    return null;
}

// Sorry Vietnam flag has some problem that I can't solve easily so I have to do this
