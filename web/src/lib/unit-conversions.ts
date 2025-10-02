/**
 * Unit conversion configuration and utilities
 * Handles automatic rate recalculation when switching between different units
 */

export type ConversionRule = {
  from: string
  to: string
  factor: number // Multiply rate by this factor when converting
}

/**
 * Conversion rules define how rates should be adjusted when changing units
 * Factor represents: new_rate = old_rate * factor
 *
 * Example: DOZ to PCS
 * - 1 dozen = 12 pieces
 * - If rate is ₹120/dozen, then ₹120/dozen = ₹10/piece
 * - So factor = 1/12 = 0.0833...
 */
export const UNIT_CONVERSIONS: ConversionRule[] = [
  // Dozen ↔ Pieces conversions
  { from: 'DOZ', to: 'PCS', factor: 1 / 12 },
  { from: 'DOZ', to: 'PIECES', factor: 1 / 12 },
  { from: 'PCS', to: 'DOZ', factor: 12 },
  { from: 'PIECES', to: 'DOZ', factor: 12 },

  // Kilogram ↔ Gram conversions
  { from: 'KG', to: 'G', factor: 1 / 1000 },
  { from: 'KG', to: 'GRAM', factor: 1 / 1000 },
  { from: 'KG', to: 'GRAMS', factor: 1 / 1000 },
  { from: 'G', to: 'KG', factor: 1000 },
  { from: 'GRAM', to: 'KG', factor: 1000 },
  { from: 'GRAMS', to: 'KG', factor: 1000 },

  // Meter ↔ Centimeter conversions (if needed)
  { from: 'M', to: 'CM', factor: 1 / 100 },
  { from: 'METER', to: 'CM', factor: 1 / 100 },
  { from: 'METER', to: 'CENTIMETER', factor: 1 / 100 },
  { from: 'CM', to: 'M', factor: 100 },
  { from: 'CM', to: 'METER', factor: 100 },
  { from: 'CENTIMETER', to: 'M', factor: 100 },
  { from: 'CENTIMETER', to: 'METER', factor: 100 },

  // Liter ↔ Milliliter conversions (if needed)
  { from: 'L', to: 'ML', factor: 1 / 1000 },
  { from: 'LITER', to: 'ML', factor: 1 / 1000 },
  { from: 'LITER', to: 'MILLILITER', factor: 1 / 1000 },
  { from: 'ML', to: 'L', factor: 1000 },
  { from: 'ML', to: 'LITER', factor: 1000 },
  { from: 'MILLILITER', to: 'L', factor: 1000 },
  { from: 'MILLILITER', to: 'LITER', factor: 1000 },
]

/**
 * Convert rate from one unit to another
 * @param rate - Current rate value
 * @param fromUnit - Current unit name
 * @param toUnit - Target unit name
 * @returns Converted rate, or original rate if no conversion rule exists
 */
export function convertRate(rate: number, fromUnit: string, toUnit: string): number {
  if (!rate || !fromUnit || !toUnit || fromUnit === toUnit) {
    return rate
  }

  // Normalize unit names to uppercase for comparison
  const fromUnitUpper = fromUnit.toUpperCase().trim()
  const toUnitUpper = toUnit.toUpperCase().trim()

  // Find matching conversion rule
  const conversionRule = UNIT_CONVERSIONS.find(
    rule => rule.from === fromUnitUpper && rule.to === toUnitUpper
  )

  if (conversionRule) {
    const convertedRate = rate * conversionRule.factor
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(convertedRate * 100) / 100
  }

  // No conversion rule found, return original rate
  return rate
}

/**
 * Check if a conversion exists between two units
 * @param fromUnit - Source unit name
 * @param toUnit - Target unit name
 * @returns True if a conversion rule exists
 */
export function hasConversion(fromUnit: string, toUnit: string): boolean {
  if (!fromUnit || !toUnit || fromUnit === toUnit) {
    return false
  }

  const fromUnitUpper = fromUnit.toUpperCase().trim()
  const toUnitUpper = toUnit.toUpperCase().trim()

  return UNIT_CONVERSIONS.some(
    rule => rule.from === fromUnitUpper && rule.to === toUnitUpper
  )
}

/**
 * Get conversion factor between two units
 * @param fromUnit - Source unit name
 * @param toUnit - Target unit name
 * @returns Conversion factor, or 1 if no conversion exists
 */
export function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (!fromUnit || !toUnit || fromUnit === toUnit) {
    return 1
  }

  const fromUnitUpper = fromUnit.toUpperCase().trim()
  const toUnitUpper = toUnit.toUpperCase().trim()

  const conversionRule = UNIT_CONVERSIONS.find(
    rule => rule.from === fromUnitUpper && rule.to === toUnitUpper
  )

  return conversionRule?.factor || 1
}
