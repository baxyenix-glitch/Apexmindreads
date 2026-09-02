import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const currencyCodes = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV",
  "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHE", "CHF",
  "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE",
  "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD",
  "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD",
  "HNL", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD",
  "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD",
  "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA",
  "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV",
  "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB",
  "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB",
  "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS",
  "SRD", "SSP", "STN", "SVC", "SYP", "SZL", "THB", "TJS", "TMT", "TND",
  "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN", "UYI",
  "UYU", "UYW", "UZS", "VED", "VES", "VND", "VUV", "WST", "XAF", "XAG",
  "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD", "XPF",
  "XPT", "XSU", "XTS", "XUA", "XXX", "YER", "ZAR", "ZMW", "ZWG"
] as const;

export type Currency = typeof currencyCodes[number];
export type CurrencyOption = { code: Currency; label: string; symbol: string };

const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
const currencySymbol = (code: Currency) => {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
};

export const currencyOptions: CurrencyOption[] = currencyCodes.map((code) => ({
  code,
  label: currencyNames.of(code) ?? code,
  symbol: currencySymbol(code),
}));

// Country code to primary Currency ISO mapping
export const countryToCurrencyMap: Record<string, Currency> = {
  NG: "NGN",
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  AU: "AUD",
  NZ: "NZD",
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
  NA: "NAD",
  SZ: "SZL",
  LS: "LSL",
  MW: "MWK",
  MZ: "MZN",
  AO: "AOA",
  SL: "SLE",
  GM: "GMD",
  LR: "LRD",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  SG: "SGD",
  MY: "MYR",
  PH: "PHP",
  PK: "PKR",
  BD: "BDT",
  ID: "IDR",
  TH: "THB",
  VN: "VND",
  KR: "KRW",
  HK: "HKD",
  TW: "TWD",
  IL: "ILS",
  TR: "TRY",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  QA: "QAR",
  KW: "KWD",
  OM: "OMR",
  BH: "BHD",
  JO: "JOD",
  LB: "LBP",
  MA: "MAD",
  TN: "TND",
  DZ: "DZD",
  ET: "ETB",
  MU: "MUR",
  // Eurozone countries
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", IE: "EUR", PT: "EUR", FI: "EUR", GR: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", SK: "EUR", SI: "EUR", CY: "EUR", MT: "EUR",
  LU: "EUR", HR: "EUR",
  // West & Central African CFA franc
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF",
  SN: "XOF", TG: "XOF",
  CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF", GQ: "XAF", GA: "XAF",
};

// Rates mapping from baseline NGN (1 NGN = X foreign currency)
export const ratesFromNGN: Partial<Record<Currency, number>> = {
  NGN: 1,
  USD: 1 / 1550,
  GBP: 1 / 1980,
  EUR: 1 / 1690,
  CAD: 1 / 1120,
  AUD: 1 / 1000,
  GHS: 1 / 105,
  KES: 1 / 12,
  ZAR: 1 / 85,
  INR: 1 / 18.5,
  JPY: 1 / 10.3,
  CNY: 1 / 215,
  AED: 1 / 422,
  SAR: 1 / 413,
  EGP: 1 / 32,
  RWF: 1 / 1.15,
  UGX: 1 / 0.42,
  TZS: 1 / 0.60,
  BRL: 1 / 270,
  MXN: 1 / 76,
  NZD: 1 / 920,
  SGD: 1 / 1150,
  CHF: 1 / 1750,
  SEK: 1 / 145,
  NOK: 1 / 142,
  DKK: 1 / 225,
  PLN: 1 / 390,
  TRY: 1 / 44,
  XOF: 1 / 2.55,
  XAF: 1 / 2.55,
  HKD: 1 / 198,
  KRW: 1 / 1.08,
  MYR: 1 / 350,
  PHP: 1 / 27,
  THB: 1 / 44,
  IDR: 1 / 0.095,
  PKR: 1 / 5.5,
  BDT: 1 / 13,
  QAR: 1 / 425,
  KWD: 1 / 5050,
  OMR: 1 / 4020,
  BHD: 1 / 4110,
};

const locales: Partial<Record<Currency, string>> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  CNY: "zh-CN",
  INR: "en-IN",
  ZAR: "en-ZA",
  GHS: "en-GH",
  KES: "en-KE",
  AED: "en-AE",
  SAR: "ar-SA",
  EGP: "ar-EG",
  BRL: "pt-BR",
  MXN: "es-MX",
  SGD: "en-SG",
  NZD: "en-NZ",
  CHF: "de-CH",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  PLN: "pl-PL",
  TRY: "tr-TR",
};

export function formatCurrency(valueInNGN: number, currency: Currency) {
  const rate = ratesFromNGN[currency] ?? 1 / 1550;
  return new Intl.NumberFormat(locales[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NGN" || currency === "JPY" || currency === "KRW" || currency === "UGX" || currency === "TZS" || currency === "RWF" ? 0 : 2,
  }).format(valueInNGN * rate);
}

export function getConvertedAmount(valueInNGN: number, currency: Currency): number {
  const rate = ratesFromNGN[currency] ?? 1 / 1550;
  return Number((valueInNGN * rate).toFixed(2));
}

// Instant browser timezone & locale deduction
export function getBrowserLocaleFallback(): { country: string; currency: Currency } {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    
    // Americas
    if (
      timeZone.startsWith("America/New_York") ||
      timeZone.startsWith("America/Chicago") ||
      timeZone.startsWith("America/Los_Angeles") ||
      timeZone.startsWith("America/Denver") ||
      timeZone.startsWith("America/Phoenix") ||
      timeZone.startsWith("America/Detroit") ||
      timeZone.startsWith("America/Indiana") ||
      timeZone.startsWith("America/Boise") ||
      timeZone.startsWith("US/") ||
      timeZone.startsWith("Pacific/Honolulu") ||
      timeZone.startsWith("America/Anchorage")
    ) {
      return { country: "US", currency: "USD" };
    }
    if (
      timeZone.startsWith("America/Toronto") ||
      timeZone.startsWith("America/Vancouver") ||
      timeZone.startsWith("America/Montreal") ||
      timeZone.startsWith("America/Edmonton") ||
      timeZone.startsWith("America/Winnipeg") ||
      timeZone.startsWith("America/Halifax") ||
      timeZone.startsWith("Canada/")
    ) {
      return { country: "CA", currency: "CAD" };
    }
    if (
      timeZone.startsWith("America/Mexico_City") ||
      timeZone.startsWith("America/Cancun") ||
      timeZone.startsWith("America/Monterrey") ||
      timeZone.startsWith("America/Tijuana")
    ) {
      return { country: "MX", currency: "MXN" };
    }
    if (
      timeZone.startsWith("America/Sao_Paulo") ||
      timeZone.startsWith("America/Bahia") ||
      timeZone.startsWith("America/Fortaleza") ||
      timeZone.startsWith("America/Manaus") ||
      timeZone.startsWith("Brazil/")
    ) {
      return { country: "BR", currency: "BRL" };
    }

    // UK & Europe
    if (timeZone.startsWith("Europe/London") || timeZone.startsWith("GB") || timeZone.startsWith("Europe/Belfast")) {
      return { country: "GB", currency: "GBP" };
    }
    if (
      timeZone.startsWith("Europe/Berlin") ||
      timeZone.startsWith("Europe/Paris") ||
      timeZone.startsWith("Europe/Madrid") ||
      timeZone.startsWith("Europe/Rome") ||
      timeZone.startsWith("Europe/Amsterdam") ||
      timeZone.startsWith("Europe/Brussels") ||
      timeZone.startsWith("Europe/Vienna") ||
      timeZone.startsWith("Europe/Dublin") ||
      timeZone.startsWith("Europe/Lisbon") ||
      timeZone.startsWith("Europe/Helsinki") ||
      timeZone.startsWith("Europe/Athens")
    ) {
      return { country: "DE", currency: "EUR" };
    }
    if (timeZone.startsWith("Europe/Zurich")) return { country: "CH", currency: "CHF" };
    if (timeZone.startsWith("Europe/Stockholm")) return { country: "SE", currency: "SEK" };
    if (timeZone.startsWith("Europe/Oslo")) return { country: "NO", currency: "NOK" };
    if (timeZone.startsWith("Europe/Copenhagen")) return { country: "DK", currency: "DKK" };
    if (timeZone.startsWith("Europe/Warsaw")) return { country: "PL", currency: "PLN" };
    if (timeZone.startsWith("Europe/Istanbul")) return { country: "TR", currency: "TRY" };

    // Africa
    if (timeZone.startsWith("Africa/Lagos") || timeZone.startsWith("Africa/Porto-Novo")) return { country: "NG", currency: "NGN" };
    if (timeZone.startsWith("Africa/Accra")) return { country: "GH", currency: "GHS" };
    if (timeZone.startsWith("Africa/Nairobi")) return { country: "KE", currency: "KES" };
    if (timeZone.startsWith("Africa/Johannesburg")) return { country: "ZA", currency: "ZAR" };
    if (timeZone.startsWith("Africa/Cairo")) return { country: "EG", currency: "EGP" };
    if (timeZone.startsWith("Africa/Kigali")) return { country: "RW", currency: "RWF" };
    if (timeZone.startsWith("Africa/Kampala")) return { country: "UG", currency: "UGX" };
    if (timeZone.startsWith("Africa/Dar_es_Salaam")) return { country: "TZ", currency: "TZS" };
    if (timeZone.startsWith("Africa/Lusaka")) return { country: "ZM", currency: "ZMW" };
    if (timeZone.startsWith("Africa/Harare")) return { country: "ZW", currency: "ZWG" };

    // Asia & Middle East & Oceania
    if (timeZone.startsWith("Asia/Kolkata") || timeZone.startsWith("Asia/Calcutta")) return { country: "IN", currency: "INR" };
    if (timeZone.startsWith("Asia/Dubai")) return { country: "AE", currency: "AED" };
    if (timeZone.startsWith("Asia/Riyadh")) return { country: "SA", currency: "SAR" };
    if (timeZone.startsWith("Asia/Qatar")) return { country: "QA", currency: "QAR" };
    if (timeZone.startsWith("Asia/Kuwait")) return { country: "KW", currency: "KWD" };
    if (timeZone.startsWith("Asia/Singapore")) return { country: "SG", currency: "SGD" };
    if (timeZone.startsWith("Asia/Kuala_Lumpur")) return { country: "MY", currency: "MYR" };
    if (timeZone.startsWith("Asia/Tokyo")) return { country: "JP", currency: "JPY" };
    if (timeZone.startsWith("Asia/Shanghai") || timeZone.startsWith("Asia/Chongqing") || timeZone.startsWith("Asia/Hong_Kong")) return { country: "CN", currency: "CNY" };
    if (timeZone.startsWith("Asia/Seoul")) return { country: "KR", currency: "KRW" };
    if (timeZone.startsWith("Australia/")) return { country: "AU", currency: "AUD" };
    if (timeZone.startsWith("Pacific/Auckland")) return { country: "NZ", currency: "NZD" };

    // Deduce from navigator languages
    const languages = navigator.languages || [navigator.language || ""];
    for (const lang of languages) {
      if (!lang) continue;
      const parts = lang.split("-");
      if (parts.length > 1) {
        const countryCode = parts[1].toUpperCase();
        if (countryToCurrencyMap[countryCode]) {
          return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
        }
      }
    }
  } catch {
    // Fallback
  }
  return { country: "US", currency: "USD" };
}

// Multi-provider accurate IP Geolocation detection
async function detectCountryAndCurrency(): Promise<{ country: string; currency: Currency }> {
  // 1. First Priority: First-party server edge endpoint (Vercel / Cloudflare edge headers & real client IP)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/geo?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const countryCode = (data.country || "").toUpperCase();
      const currCode = (data.currency || "").toUpperCase() as Currency;
      if (countryCode && currCode && currencyCodes.includes(currCode)) {
        return { country: countryCode, currency: currCode };
      }
      if (countryCode && countryToCurrencyMap[countryCode]) {
        return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
      }
    }
  } catch {
    // Try external fallback providers
  }

  // 2. Try api.country.is (Zero auth, CORS enabled, lightweight)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.country.is", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const countryCode = (data.country || "").toUpperCase();
      if (countryCode && countryToCurrencyMap[countryCode]) {
        return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
      }
    }
  } catch {
    // Try next
  }

  // 3. Try get.geojs.io (Free, CORS enabled, fast, global CDN)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const countryCode = (data.country_code || data.country || "").toUpperCase();
      if (countryCode && countryToCurrencyMap[countryCode]) {
        return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
      }
    }
  } catch {
    // Try next
  }

  // 4. Try ipwho.is
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://ipwho.is/", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const countryCode = (data.country_code || "").toUpperCase();
        const currCode = (data.currency?.code || "").toUpperCase() as Currency;
        if (currCode && currencyCodes.includes(currCode)) {
          return { country: countryCode || "US", currency: currCode };
        }
        if (countryCode && countryToCurrencyMap[countryCode]) {
          return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
        }
      }
    }
  } catch {
    // Fallback to browser locale
  }

  // 5. Fallback to Browser locale/timezone
  return getBrowserLocaleFallback();
}

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency, isUserSelection?: boolean) => void;
  options: CurrencyOption[];
  detectedCountry: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [detectedCountry, setDetectedCountry] = useState<string>(() => {
    if (typeof window === "undefined") return "US";
    return window.sessionStorage.getItem("apexmindreads-country") || "US";
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";
    const sessionCurrency = window.sessionStorage.getItem("apexmindreads-currency") as Currency | null;
    if (sessionCurrency && currencyCodes.includes(sessionCurrency)) {
      return sessionCurrency;
    }
    return "USD";
  });

  const setCurrency = (nextCurrency: Currency, isUserSelection = true) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("apexmindreads-currency", nextCurrency);
      if (isUserSelection) {
        window.sessionStorage.setItem("apexmindreads-currency-manual", "true");
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Purge any stale persistent localStorage from earlier builds
    try {
      window.localStorage.removeItem("apexmindreads-currency-manual");
      window.localStorage.removeItem("apexmindreads-currency");
      window.localStorage.removeItem("apexmindreads-country");
    } catch {}

    // Detect actual location via edge /api/geo
    detectCountryAndCurrency()
      .then(({ country: autoCountry, currency: autoCurrency }) => {
        const prevCountry = window.sessionStorage.getItem("apexmindreads-prev-country");
        const isSessionManual = window.sessionStorage.getItem("apexmindreads-currency-manual") === "true";

        setDetectedCountry(autoCountry);
        window.sessionStorage.setItem("apexmindreads-country", autoCountry);

        // If the country changed (e.g. user enabled/disabled VPN or moved), always adopt the detected location
        if (!isSessionManual || prevCountry !== autoCountry) {
          setCurrencyState(autoCurrency);
          window.sessionStorage.setItem("apexmindreads-currency", autoCurrency);
          window.sessionStorage.removeItem("apexmindreads-currency-manual");
        }

        window.sessionStorage.setItem("apexmindreads-prev-country", autoCountry);
      })
      .catch(() => {});
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, options: currencyOptions, detectedCountry }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error("useCurrency must be used inside CurrencyProvider");
  return value;
}
