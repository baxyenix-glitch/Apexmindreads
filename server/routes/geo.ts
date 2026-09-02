import { RequestHandler } from "express";

// Comprehensive country to currency ISO map
export const countryToCurrencyMap: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  AU: "AUD",
  BR: "BRL",
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  IN: "INR",
  JP: "JPY",
  CN: "CNY",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
  RW: "RWF",
  UG: "UGX",
  TZ: "TZS",
  ZM: "ZMW",
  ZW: "ZWG",
  BW: "BWP",
  MX: "MXN",
  SG: "SGD",
  MY: "MYR",
  PH: "PHP",
  ID: "IDR",
  TH: "THB",
  KR: "KRW",
  HK: "HKD",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  TR: "TRY",
  NZ: "NZD",
  QA: "QAR",
  KW: "KWD",
  OM: "OMR",
  BH: "BHD",
  // Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", IE: "EUR", PT: "EUR", FI: "EUR", GR: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", SK: "EUR", SI: "EUR", CY: "EUR", MT: "EUR",
  LU: "EUR", HR: "EUR",
  // CFA Franc
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF",
  SN: "XOF", TG: "XOF",
  CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF", GQ: "XAF", GA: "XAF",
};

/**
 * GET /api/geo
 * Returns real client country & currency based on edge headers (Vercel/Cloudflare) or IP.
 */
export const handleGetGeoLocation: RequestHandler = async (req, res) => {
  try {
    // 1. Check edge platform headers (Vercel, Cloudflare, Fastly)
    const vercelCountry = (req.headers["x-vercel-ip-country"] as string)?.trim().toUpperCase();
    const cloudflareCountry = (req.headers["cf-ipcountry"] as string)?.trim().toUpperCase();
    const generalCountry = (req.headers["x-country-code"] as string)?.trim().toUpperCase();

    let detectedCountry = vercelCountry || cloudflareCountry || generalCountry || "";

    // 2. If no edge header, detect via server-side IP lookup
    if (!detectedCountry || detectedCountry === "XX" || detectedCountry.length !== 2) {
      const forwardedFor = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim();
      const realIp = (req.headers["x-real-ip"] as string)?.trim();
      const rawIp = forwardedFor || realIp || req.socket.remoteAddress || "";
      
      // Filter out loopback / local IPs
      const isLocal = !rawIp || rawIp.startsWith("127.") || rawIp === "::1" || rawIp.startsWith("192.168.") || rawIp.startsWith("10.") || rawIp.startsWith("172.16.");

      if (!isLocal) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2500);
          const ipRes = await fetch(`https://get.geojs.io/v1/ip/geo/${encodeURIComponent(rawIp)}.json`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            const code = (ipData.country_code || ipData.country || "").toUpperCase();
            if (code && code.length === 2) {
              detectedCountry = code;
            }
          }
        } catch {
          // Continue to fallback
        }
      }
    }

    // 3. Fallback to US if still unknown
    if (!detectedCountry || detectedCountry.length !== 2) {
      detectedCountry = "US";
    }

    const currency = countryToCurrencyMap[detectedCountry] || "USD";

    res.json({
      country: detectedCountry,
      currency,
      city: (req.headers["x-vercel-ip-city"] as string) || "",
      region: (req.headers["x-vercel-ip-country-region"] as string) || "",
    });
  } catch (error) {
    res.json({
      country: "US",
      currency: "USD",
    });
  }
};
