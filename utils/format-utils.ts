// Utility functions for formatting numbers and currencies

// Format number with commas for thousands and optional decimal places
export const formatNumber = (num: number, decimalPlaces = 2): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
}

// Format currency with symbol and appropriate suffix (K, M)
export const formatCurrency = (
  amount: number,
  decimalPlaces = 2,
  currencySymbol = "$",
): { value: string; suffix: string | null } => {
  // Handle zero amount
  if (amount === 0) {
    return { value: `${currencySymbol}0.00`, suffix: null }
  }

  let formattedValue: string
  let suffix: string | null = null

  // Format based on magnitude
  if (Math.abs(amount) >= 1000000) {
    // Millions (M)
    formattedValue = `${currencySymbol}${(amount / 1000000).toLocaleString("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}`
    suffix = "M"
  } else if (Math.abs(amount) >= 1000) {
    // Thousands (K)
    formattedValue = `${currencySymbol}${(amount / 1000).toLocaleString("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}`
    suffix = "K"
  } else {
    // Regular amount
    formattedValue = `${currencySymbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}`
    suffix = null
  }

  return { value: formattedValue, suffix }
}

// Format percentage
export const formatPercentage = (value: number, decimalPlaces = 1): string => {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })}%`
}

// Calculate percentage change between two values
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100
  }
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100
}
