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
const countryToCurrencyMap: Record<string, Currency> = {
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

// Rates mapping from baseline NGN
const ratesFromNGN: Partial<Record<Currency, number>> = {
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

// Helper to deduce country/currency from browser locale & timezone without network
function getBrowserLocaleFallback(): { country: string; currency: Currency } {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (timeZone.startsWith("Africa/Lagos")) return { country: "NG", currency: "NGN" };
    if (timeZone.startsWith("Africa/Accra")) return { country: "GH", currency: "GHS" };
    if (timeZone.startsWith("Africa/Nairobi")) return { country: "KE", currency: "KES" };
    if (timeZone.startsWith("Africa/Johannesburg")) return { country: "ZA", currency: "ZAR" };
    if (timeZone.startsWith("Africa/Cairo")) return { country: "EG", currency: "EGP" };
    if (timeZone.startsWith("Africa/Kigali")) return { country: "RW", currency: "RWF" };
    if (timeZone.startsWith("Africa/Kampala")) return { country: "UG", currency: "UGX" };
    if (timeZone.startsWith("Africa/Dar_es_Salaam")) return { country: "TZ", currency: "TZS" };
    if (timeZone.startsWith("America/New_York") || timeZone.startsWith("America/Chicago") || timeZone.startsWith("America/Los_Angeles") || timeZone.startsWith("America/Denver")) {
      return { country: "US", currency: "USD" };
    }
    if (timeZone.startsWith("America/Toronto") || timeZone.startsWith("America/Vancouver") || timeZone.startsWith("America/Montreal")) {
      return { country: "CA", currency: "CAD" };
    }
    if (timeZone.startsWith("Europe/London")) return { country: "GB", currency: "GBP" };
    if (timeZone.startsWith("Australia/")) return { country: "AU", currency: "AUD" };
    if (timeZone.startsWith("Asia/Kolkata")) return { country: "IN", currency: "INR" };
    if (timeZone.startsWith("Asia/Tokyo")) return { country: "JP", currency: "JPY" };
    if (timeZone.startsWith("Asia/Dubai")) return { country: "AE", currency: "AED" };
    if (timeZone.startsWith("Asia/Riyadh")) return { country: "SA", currency: "SAR" };
    if (timeZone.startsWith("Asia/Singapore")) return { country: "SG", currency: "SGD" };
    if (timeZone.startsWith("Europe/Berlin") || timeZone.startsWith("Europe/Paris") || timeZone.startsWith("Europe/Madrid") || timeZone.startsWith("Europe/Rome") || timeZone.startsWith("Europe/Amsterdam")) {
      return { country: "DE", currency: "EUR" };
    }

    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || "").toUpperCase();
    const parts = lang.split("-");
    const countryCode = parts.length > 1 ? parts[1] : parts[0];
    if (countryCode && countryToCurrencyMap[countryCode]) {
      return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
    }
  } catch {
    // Fallback quietly
  }
  return { country: "NG", currency: "NGN" };
}

// Fast Geolocation detection with multiple providers and timeout
async function detectCountryAndCurrency(): Promise<{ country: string; currency: Currency }> {
  // 1. Try ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const countryCode = (data.country_code || data.country || "").toUpperCase();
      const detectedCurr = (data.currency || "").toUpperCase() as Currency;
      if (detectedCurr && currencyCodes.includes(detectedCurr)) {
        return { country: countryCode || "US", currency: detectedCurr };
      }
      if (countryCode && countryToCurrencyMap[countryCode]) {
        return { country: countryCode, currency: countryToCurrencyMap[countryCode] };
      }
    }
  } catch {
    // Try fallback
  }

  // 2. Try ipwho.is as second fallback
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
    // Fallback to locale
  }

  // 3. Fallback to Browser locale/timezone
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
    if (typeof window === "undefined") return "NG";
    return window.localStorage.getItem("apexmindreads-country") || "NG";
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "NGN";
    const stored = window.localStorage.getItem("apexmindreads-currency") as Currency | null;
    if (stored && currencyOptions.some((option) => option.code === stored)) {
      return stored;
    }
    // Instant initial estimate from browser environment while async detection runs
    return getBrowserLocaleFallback().currency;
  });

  // Handle explicit user selection vs auto-detection
  const setCurrency = (nextCurrency: Currency, isUserSelection = true) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("apexmindreads-currency", nextCurrency);
      if (isUserSelection) {
        window.localStorage.setItem("apexmindreads-currency-manual", "true");
      }
    }
  };

  // Run country and currency detection on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isUserManual = window.localStorage.getItem("apexmindreads-currency-manual") === "true";
    
    detectCountryAndCurrency().then(({ country: autoCountry, currency: autoCurrency }) => {
      setDetectedCountry(autoCountry);
      window.localStorage.setItem("apexmindreads-country", autoCountry);

      // If user hasn't explicitly chosen a currency with the manual selector, apply auto-detected currency
      if (!isUserManual) {
        setCurrencyState(autoCurrency);
        window.localStorage.setItem("apexmindreads-currency", autoCurrency);
      }
    }).catch(() => {
      // Ignored, fallback already set
    });
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
