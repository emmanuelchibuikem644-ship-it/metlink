// Per-country currency mapping for profiles.
// Each country's entries define the local currency + symbol used for
// subscription pricing (price_cents is interpreted in that currency).
// Also includes normalization for the country strings found in profiles.js
// (some are cities, some have typos like "SWitzerland").

// Normalized: everything here matches the exact `country` field values in profiles.js.
export const COUNTRY_CURRENCY = {
  // ── North America ──
  USA: { country: "USA", currency: "USD", symbol: "$", code: "usd" },
  "United States": { country: "United States", currency: "USD", symbol: "$", code: "usd" },
  Canada: { country: "Canada", currency: "CAD", symbol: "C$", code: "cad" },
  Mexico: { country: "Mexico", currency: "MXN", symbol: "MX$", code: "mxn" },

  // ── South America ──
  Argentina: { country: "Argentina", currency: "ARS", symbol: "AR$", code: "ars" },
  Brazil: { country: "Brazil", currency: "BRL", symbol: "R$", code: "brl" },
  Colombia: { country: "Colombia", currency: "COP", symbol: "COL$", code: "cop" },

  // ── Europe ──
  "United Kingdom": { country: "United Kingdom", currency: "GBP", symbol: "£", code: "gbp" },
  Scotland: { country: "Scotland", currency: "GBP", symbol: "£", code: "gbp" },
  Wales: { country: "Wales", currency: "GBP", symbol: "£", code: "gbp" },
  Manchester: { country: "United Kingdom", currency: "GBP", symbol: "£", code: "gbp" }, // city
  Dublin: { country: "Ireland", currency: "EUR", symbol: "€", code: "eur" }, // city
  Ireland: { country: "Ireland", currency: "EUR", symbol: "€", code: "eur" },
  France: { country: "France", currency: "EUR", symbol: "€", code: "eur" },
  Germany: { country: "Germany", currency: "EUR", symbol: "€", code: "eur" },
  Spain: { country: "Spain", currency: "EUR", symbol: "€", code: "eur" },
  Portugal: { country: "Portugal", currency: "EUR", symbol: "€", code: "eur" },
  portugal: { country: "Portugal", currency: "EUR", symbol: "€", code: "eur" }, // typo
  Italy: { country: "Italy", currency: "EUR", symbol: "€", code: "eur" },
  Greece: { country: "Greece", currency: "EUR", symbol: "€", code: "eur" },
  Austria: { country: "Austria", currency: "EUR", symbol: "€", code: "eur" },
  Belgium: { country: "Belgium", currency: "EUR", symbol: "€", code: "eur" },
  Netherlands: { country: "Netherlands", currency: "EUR", symbol: "€", code: "eur" },
  Finland: { country: "Finland", currency: "EUR", symbol: "€", code: "eur" },
  Latvia: { country: "Latvia", currency: "EUR", symbol: "€", code: "eur" },
  Iceland: { country: "Iceland", currency: "ISK", symbol: "Kr", code: "isk" },
  Norway: { country: "Norway", currency: "NOK", symbol: "kr", code: "nok" },
  Sweden: { country: "Sweden", currency: "SEK", symbol: "kr", code: "sek" },
  sweden: { country: "Sweden", currency: "SEK", symbol: "kr", code: "sek" }, // typo lowercase
  Denmark: { country: "Denmark", currency: "DKK", symbol: "kr", code: "dkk" },
  Switzerland: { country: "Switzerland", currency: "CHF", symbol: "CHF", code: "chf" },
  SWitzerland: { country: "Switzerland", currency: "CHF", symbol: "CHF", code: "chf" }, // typo

  // ── Asia ──
  UAE: { country: "UAE", currency: "AED", symbol: "AED", code: "aed" },
  Qatar: { country: "Qatar", currency: "QAR", symbol: "QAR", code: "qar" },
  Kuwait: { country: "Kuwait", currency: "KWD", symbol: "KD", code: "kwd" },
  Lebanon: { country: "Lebanon", currency: "LBP", symbol: "LBP", code: "lbp" },
  China: { country: "China", currency: "CNY", symbol: "¥", code: "cny" },
  Singapore: { country: "Singapore", currency: "SGD", symbol: "S$", code: "sgd" },

  // ── Oceania ──
  Australia: { country: "Australia", currency: "AUD", symbol: "A$", code: "aud" },
  "New Zealand": { country: "New Zealand", currency: "NZD", symbol: "NZ$", code: "nzd" },

  // ── Africa ──
  Morocco: { country: "Morocco", currency: "MAD", symbol: "MAD", code: "mad" },
  "South Africa": { country: "South Africa", currency: "ZAR", symbol: "R", code: "zar" },

  // ── Fallback ──
  DEFAULT: { country: "United States", currency: "USD", symbol: "$", code: "usd" },
};

// Helper: given a profile's country string, return its currency info (or USD fallback).
export function getCountryCurrency(country) {
  if (!country) return COUNTRY_CURRENCY.DEFAULT;
  return COUNTRY_CURRENCY[country] || COUNTRY_CURRENCY.DEFAULT;
}

// Helper: format a price_cents value in the profile's local currency.
// e.g. 20000 → "A$200.00" for Australia, "£200.00" for UK.
export function formatPriceCents(priceCents, country) {
  const info = getCountryCurrency(country);
  const amount = (Number(priceCents) || 0) / 100;
  // Use Intl.NumberFormat for proper local formatting (2 decimals).
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${info.symbol}${formatted}`;
}

// List of all currency codes used (for Paystack currency param).
export const SUPPORTED_PAYSTACK_CURRENCIES = ["ngn", "usd", "gbp", "eur", "kes"];