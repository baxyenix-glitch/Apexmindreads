import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ALL_COUNTRIES, COUNTRY_TO_CURRENCY_MAP, type CountryInfo } from "./countries";

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

export const countryToCurrencyMap: Record<string, Currency> = COUNTRY_TO_CURRENCY_MAP;
export { ALL_COUNTRIES, type CountryInfo };

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
  XCD: 1 / 574,
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
  JMD: 1 / 10,
  TTD: 1 / 228,
  NAD: 1 / 85,
  BWP: 1 / 115,
  LSL: 1 / 85,
  SZL: 1 / 85,
  MWK: 1 / 0.89,
  MZN: 1 / 24,
  ZMW: 1 / 57,
  ZWG: 1 / 57,
  ETB: 1 / 13,
  MAD: 1 / 155,
  DZD: 1 / 11.5,
  TND: 1 / 500,
  LYD: 1 / 320,
  JOD: 1 / 2180,
  ILS: 1 / 420,
  CLP: 1 / 1.6,
  COP: 1 / 0.38,
  PEN: 1 / 415,
  ARS: 1 / 1.5,
  UYU: 1 / 38,
  CRC: 1 / 3.0,
  DOP: 1 / 26,
  GTQ: 1 / 200,
  HNL: 1 / 62,
  NIO: 1 / 42,
  PAB: 1 / 1550,
  PYG: 1 / 0.20,
  BOB: 1 / 224,
  GYD: 1 / 7.4,
  SRD: 1 / 44,
  BZD: 1 / 770,
  BSD: 1 / 1550,
  BMD: 1 / 1550,
  KYD: 1 / 1860,
  FJD: 1 / 685,
  PGK: 1 / 385,
  SBD: 1 / 180,
  VUV: 1 / 13,
  WST: 1 / 560,
  TOP: 1 / 650,
  ALL: 1 / 17,
  BAM: 1 / 864,
  BGN: 1 / 864,
  CZK: 1 / 67,
  HUF: 1 / 4.2,
  ISK: 1 / 11.2,
  MDL: 1 / 87,
  MKD: 1 / 27,
  RSD: 1 / 14.4,
  RON: 1 / 340,
  GEL: 1 / 560,
  AMD: 1 / 4.0,
  AZN: 1 / 910,
  KZT: 1 / 3.1,
  UZS: 1 / 0.12,
  TJS: 1 / 142,
  KGS: 1 / 17.8,
  TMT: 1 / 442,
  MNT: 1 / 0.45,
  LKR: 1 / 5.2,
  NPR: 1 / 11.6,
  AFN: 1 / 22,
  MMK: 1 / 0.74,
  LAK: 1 / 0.07,
  KHR: 1 / 0.38,
  VND: 1 / 0.06,
  MVR: 1 / 100,
  TWD: 1 / 48,
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
    maximumFractionDigits:
      currency === "NGN" ||
      currency === "JPY" ||
      currency === "KRW" ||
      currency === "UGX" ||
      currency === "TZS" ||
      currency === "RWF" ||
      currency === "VND" ||
      currency === "IDR" ||
      currency === "CLP" ||
      currency === "PYG"
        ? 0
        : 2,
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
  // 1. Try get.geojs.io (Free, CORS enabled, fast, global CDN)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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

  // 2. Try api.country.is (Zero auth, CORS enabled, lightweight)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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

  // 3. Try ipwho.is
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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

  // 4. Fallback to Browser locale/timezone
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
    return window.localStorage.getItem("apexmindreads-country") || getBrowserLocaleFallback().country;
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";
    const isUserManual = window.localStorage.getItem("apexmindreads-currency-manual") === "true";
    const stored = window.localStorage.getItem("apexmindreads-currency") as Currency | null;

    if (isUserManual && stored && currencyOptions.some((option) => option.code === stored)) {
      return stored;
    }

    return getBrowserLocaleFallback().currency;
  });

  const setCurrency = (nextCurrency: Currency, isUserSelection = true) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("apexmindreads-currency", nextCurrency);
      if (isUserSelection) {
        window.localStorage.setItem("apexmindreads-currency-manual", "true");
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isUserManual = window.localStorage.getItem("apexmindreads-currency-manual") === "true";

    detectCountryAndCurrency()
      .then(({ country: autoCountry, currency: autoCurrency }) => {
        setDetectedCountry(autoCountry);
        window.localStorage.setItem("apexmindreads-country", autoCountry);

        if (!isUserManual) {
          setCurrencyState(autoCurrency);
          window.localStorage.setItem("apexmindreads-currency", autoCurrency);
        }
      })
      .catch(() => {
        // Fallback already in place
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
