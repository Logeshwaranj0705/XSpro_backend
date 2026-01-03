const axios = require("axios");

function normalizeAddress(address) {
  if (!address) return "";

  return address
    .replace(/\b(flat|floor|flr|room|apt|apartment)\s*\w+/gi, "")
    .replace(/,\s*india/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}


async function googleGeocode(address) {
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address,
        region: "IN",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 10000,
    }
  );

  return res.data;
}


async function getLatLng(address) {
  if (!address || address.length < 6) return null;

  try {
    const cleaned = normalizeAddress(address);

    const attempts = [
      `${cleaned}, Chennai, Tamil Nadu`,
      `${cleaned}, Chennai`,
      cleaned,
    ];

    for (const query of attempts) {
      if (!query || query.length < 6) continue;

      const data = await googleGeocode(query);

      if (data.status === "OK" && data.results?.length) {
        const result = data.results[0];
        const loc = result.geometry.location;

        return {
          lat: loc.lat,
          lng: loc.lng,
          precision: result.geometry.location_type,
          placeId: result.place_id,
          formatted: result.formatted_address,
        };
      }

      if (data.status !== "ZERO_RESULTS") {
        console.warn(
          "⚠️ Google geocode warning:",
          data.status,
          data.error_message || ""
        );
      }
    }

    console.error("❌ Google Geocoding failed:", address);
    return null;

  } catch (err) {
    console.error(
      "❌ Google Maps Error:",
      err.response?.data || err.message
    );
    return null;
  }
}

module.exports = getLatLng;
