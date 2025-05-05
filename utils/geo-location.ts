"use server"

// This is a server action to get the user's country from their IP address
export async function getUserCountryFromIP(ip?: string): Promise<{
  code: string
  name: string
  flag: string
}> {
  try {
    // Try multiple geolocation APIs with fallbacks
    const apis = [
      "https://ipapi.co/json/",
      "https://ipinfo.io/json", // Fallback API (requires API key for production use)
      "https://ip-api.com/json", // Another fallback (free for non-commercial use)
    ]

    let response = null
    let data = null
    let apiIndex = 0

    // Try each API until one works or we run out of options
    while (apiIndex < apis.length) {
      try {
        response = await fetch(apis[apiIndex], {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "User-Agent": "Spenders App/1.0", // Identify our app to the API provider
          },
          next: { revalidate: 86400 }, // Cache for 24 hours to avoid rate limiting
        })

        if (response.ok) {
          data = await response.json()
          break // We got a successful response, exit the loop
        }

        // If we get rate limited (429), try the next API
        if (response.status === 429) {
          console.log(`API ${apis[apiIndex]} rate limited, trying next option`)
          apiIndex++
          continue
        }

        // For other errors, also try the next API
        console.error(`API ${apis[apiIndex]} returned status ${response.status}`)
        apiIndex++
      } catch (error) {
        console.error(`Error with API ${apis[apiIndex]}:`, error)
        apiIndex++
      }
    }

    // If all APIs failed, use a fallback based on browser language
    if (!data) {
      console.log("All geolocation APIs failed, using browser language fallback")
      return getBrowserLanguageBasedCountry()
    }

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

    // Extract country information based on the API response format
    let countryCode = ""
    let countryName = ""

    // Handle different API response formats
    if (data.country_code) {
      // ipapi.co format
      countryCode = data.country_code
      countryName = data.country_name || data.country
    } else if (data.country) {
      // ipinfo.io format
      countryCode = data.country
      countryName = data.country_name || data.country
    } else if (data.countryCode) {
      // ip-api.com format
      countryCode = data.countryCode
      countryName = data.country
    }

    // Ensure we have a valid country code
    countryCode = countryCode || "UN"
    countryName = countryName || "Unknown"

    return {
      code: countryCode,
      name: countryName,
      flag: countryFlags[countryCode] || "🌍",
    }
  } catch (error) {
    console.error("Error detecting country:", error)
    return getBrowserLanguageBasedCountry()
  }
}

// Fallback function to determine country based on browser language
function getBrowserLanguageBasedCountry(): {
  code: string
  name: string
  flag: string
} {
  // This is a server-side function, so we can't access navigator.language directly
  // Instead, we'll return a default value
  return {
    code: "UN",
    name: "Unknown",
    flag: "🌍",
  }
}
