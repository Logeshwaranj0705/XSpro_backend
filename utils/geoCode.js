const axios = require("axios");

function extractPincode(address) {
  const match = address?.match(/\b\d{6}\b/);
  return match ? match[0] : null;
}

function normalizeAddress(address) {
  if (!address) return "";

  return address
    .replace(/\b(flat|floor|flr|room|apt|apartment)\s*\w+/gi, "")
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
  if (!address || address.length < 6) return null;

  try {
    const cleaned = normalizeAddress(address);
    const pincode = extractPincode(cleaned);

    let pincodeData = null;
    let pincodeCenter = null;
    let pincodeBounds = null;

    if (pincode) {
      pincodeData = await googleGeocode({
        address: pincode,
      });

      if (pincodeData.status === "OK") {
        const result = pincodeData.results[0];
        pincodeCenter = result.geometry.location;
        pincodeBounds = result.geometry.bounds || result.geometry.viewport;
      }
    }

    const attempts = [
      pincode ? `${cleaned}, ${pincode}` : null,
      pincode ? `${cleaned}` : null,
      pincode ? `${pincode}` : null,
    ].filter(Boolean);

    for (const query of attempts) {
      const data = await googleGeocode({
        address: query,
        bounds: pincodeBounds,
      });

      if (data.status === "OK" && data.results?.length) {
        const result = data.results[0];
        const loc = result.geometry.location;

        return {
          lat: loc.lat,
          lng: loc.lng,
          precision: result.geometry.location_type,
          placeId: result.place_id,
          formatted: result.formatted_address,
          source: "street+pincode",
        };
      }
    }


    if (pincodeCenter) {
      return {
        lat: pincodeCenter.lat,
        lng: pincodeCenter.lng,
        precision: "PINCODE_CENTER",
        placeId: null,
        formatted: `Pincode ${pincode}`,
        source: "pincode_fallback",
      };
    }

    console.error("❌ Geocoding failed:", address);
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
