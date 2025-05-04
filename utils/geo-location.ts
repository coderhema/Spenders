"use server"

// This is a server action to get the user's country from their IP address
export async function getUserCountryFromIP(ip?: string): Promise<{
  code: string
  name: string
  flag: string
}> {
  try {
    // Use ipapi.co API to get country information
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch location data: ${response.status}`)
    }

    const data = await response.json()

    // Map of country codes to flag emojis
    const countryFlags: Record<string, string> = {
      US: "🇺🇸",
      GB: "🇬🇧",
      CA: "🇨🇦",
      AU: "🇦🇺",
      DE: "🇩🇪",
      FR: "🇫🇷",
      IN: "🇮🇳",
      NG: "🇳🇬",
      BR: "🇧🇷",
      JP: "🇯🇵",
      CN: "🇨🇳",
      ZA: "🇿🇦",
      MX: "🇲🇽",
      ES: "🇪🇸",
      IT: "🇮🇹",
      NL: "🇳🇱",
      RU: "🇷🇺",
      KR: "🇰🇷",
      SE: "🇸🇪",
      CH: "🇨🇭",
      NO: "🇳🇴",
      DK: "🇩🇰",
      FI: "🇫🇮",
      SG: "🇸🇬",
      AE: "🇦🇪",
      // Add more countries as needed
    }

    return {
      code: data.country_code || "UN",
      name: data.country_name || "Unknown",
      flag: countryFlags[data.country_code] || "🌍",
    }
  } catch (error) {
    console.error("Error detecting country:", error)

    // Return a default if detection fails
    return {
      code: "UN",
      name: "Unknown",
      flag: "🌍",
    }
  }
}
