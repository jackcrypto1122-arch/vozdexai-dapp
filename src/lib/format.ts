export function formatUsd(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatAmount(value?: number | null, digits = 4) {
  if (value == null || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function shortAddress(value?: string | null) {
  if (!value) {
    return "not connected";
  }
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function formatTime(timestamp?: number | null) {
  if (!timestamp) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp * 1000);
}

export function toBaseUnits(amount: string, decimals: number) {
  const [whole = "0", fractional = ""] = amount.split(".");
  const paddedFractional = (fractional + "0".repeat(decimals)).slice(0, decimals);
  const normalized = `${whole}${paddedFractional}`.replace(/^0+(?=\d)/, "");
  return normalized || "0";
}

export function fromBaseUnits(amountRaw: string, decimals: number) {
  const raw = amountRaw.padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals) || "0";
  const fractional = raw.slice(-decimals).replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole;
}
