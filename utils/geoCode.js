const axios = require("axios");

function extractPincode(address) {
  const match = address?.match(/\b\d{6}\b/);
  return match ? match[0] : null;
}

function normalizeAddress(address) {
  if (!address) return "";
  return address
    .replace(/\b(flat|floor|flr|room|apt|apartment|no|door|plot|polt|d)\b[:.]?\s?[\w/-]*/gi, "")
    .replace(/,\s*india/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function googleGeocode(params) {
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        region: "IN",
        key: process.env.GOOGLE_MAPS_API_KEY,
        ...params,
      },
      timeout: 10000,
    }
  );
  return res.data;
}

async function getLatLng(address) {
  if (!address || address.length < 5) return null;

  try {
    const cleaned = normalizeAddress(address);
    const pincode = extractPincode(cleaned);
    const parts = cleaned.split(",").map(p => p.trim()).filter(p => p.length > 0);

    let pincodeBounds = null;
    let pincodeCenter = null;
    if (pincode) {
      const pinData = await googleGeocode({ address: pincode });
      if (pinData.status === "OK") {
        const result = pinData.results[0];
        pincodeCenter = result.geometry.location;
        pincodeBounds = result.geometry.bounds || result.geometry.viewport;
      }
    }
    const attempts = [];

    attempts.push(cleaned);
    if (parts.length >= 2) {
      const areaSnippet = parts.slice(-2).join(", ");
      attempts.push(areaSnippet);
    }


    for (const query of attempts) {
      const data = await googleGeocode({
        address: query,
        bounds: pincodeBounds, 
        components: pincode ? `postal_code:${pincode}` : undefined
      });

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const loc = result.geometry.location;
        const type = result.geometry.location_type;

        return {
          lat: loc.lat,
          lng: loc.lng,
          precision: type,
          formatted: result.formatted_address,
          source: query === cleaned ? "street_level" : "area_level"
        };
      }
    }
    if (pincodeCenter) {
      return {
        lat: pincodeCenter.lat,
        lng: pincodeCenter.lng,
        precision: "APPROXIMATE",
        formatted: `Pincode ${pincode} Area`,
        source: "pincode_fallback"
      };
    }

    return null;
  } catch (err) {
    console.error("❌ Google Geocode Error:", err.message);
    return null;
  }
}

module.exports = getLatLng;
