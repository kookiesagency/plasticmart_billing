/// Unit conversion configuration and utilities
/// Handles automatic rate recalculation when switching between different units

class ConversionRule {
  final String from;
  final String to;
  final double factor;

  ConversionRule({
    required this.from,
    required this.to,
    required this.factor,
  });
}

/// Conversion rules define how rates should be adjusted when changing units
/// Factor represents: new_rate = old_rate * factor
///
/// Example: DOZ to PCS
/// - 1 dozen = 12 pieces
/// - If rate is ₹120/dozen, then ₹120/dozen = ₹10/piece
/// - So factor = 1/12 = 0.0833...
final List<ConversionRule> unitConversions = [
  // Dozen ↔ Pieces conversions
  ConversionRule(from: 'DOZ', to: 'PCS', factor: 1 / 12),
  ConversionRule(from: 'DOZ', to: 'PIECES', factor: 1 / 12),
  ConversionRule(from: 'PCS', to: 'DOZ', factor: 12),
  ConversionRule(from: 'PIECES', to: 'DOZ', factor: 12),

  // Kilogram ↔ Gram conversions
  ConversionRule(from: 'KG', to: 'G', factor: 1 / 1000),
  ConversionRule(from: 'KG', to: 'GRAM', factor: 1 / 1000),
  ConversionRule(from: 'KG', to: 'GRAMS', factor: 1 / 1000),
  ConversionRule(from: 'G', to: 'KG', factor: 1000),
  ConversionRule(from: 'GRAM', to: 'KG', factor: 1000),
  ConversionRule(from: 'GRAMS', to: 'KG', factor: 1000),

  // Meter ↔ Centimeter conversions
  ConversionRule(from: 'M', to: 'CM', factor: 1 / 100),
  ConversionRule(from: 'METER', to: 'CM', factor: 1 / 100),
  ConversionRule(from: 'METER', to: 'CENTIMETER', factor: 1 / 100),
  ConversionRule(from: 'CM', to: 'M', factor: 100),
  ConversionRule(from: 'CM', to: 'METER', factor: 100),
  ConversionRule(from: 'CENTIMETER', to: 'M', factor: 100),
  ConversionRule(from: 'CENTIMETER', to: 'METER', factor: 100),

  // Liter ↔ Milliliter conversions
  ConversionRule(from: 'L', to: 'ML', factor: 1 / 1000),
  ConversionRule(from: 'LITER', to: 'ML', factor: 1 / 1000),
  ConversionRule(from: 'LITER', to: 'MILLILITER', factor: 1 / 1000),
  ConversionRule(from: 'ML', to: 'L', factor: 1000),
  ConversionRule(from: 'ML', to: 'LITER', factor: 1000),
  ConversionRule(from: 'MILLILITER', to: 'L', factor: 1000),
  ConversionRule(from: 'MILLILITER', to: 'LITER', factor: 1000),
];

/// Convert rate from one unit to another
/// Returns converted rate, or original rate if no conversion rule exists
double convertRate(double rate, String fromUnit, String toUnit) {
  if (fromUnit == toUnit) {
    return rate;
  }

  // Normalize unit names to uppercase for comparison
  final fromUnitUpper = fromUnit.toUpperCase().trim();
  final toUnitUpper = toUnit.toUpperCase().trim();

  // Find matching conversion rule
  final conversionRule = unitConversions.firstWhere(
    (rule) => rule.from == fromUnitUpper && rule.to == toUnitUpper,
    orElse: () => ConversionRule(from: '', to: '', factor: 1),
  );

  if (conversionRule.from.isNotEmpty) {
    final convertedRate = rate * conversionRule.factor;
    // Round to 2 decimal places to avoid floating point precision issues
    return (convertedRate * 100).round() / 100;
  }

  // No conversion rule found, return original rate
  return rate;
}

/// Check if a conversion exists between two units
bool hasConversion(String fromUnit, String toUnit) {
  if (fromUnit == toUnit) {
    return false;
  }

  final fromUnitUpper = fromUnit.toUpperCase().trim();
  final toUnitUpper = toUnit.toUpperCase().trim();

  return unitConversions.any(
    (rule) => rule.from == fromUnitUpper && rule.to == toUnitUpper,
  );
}

/// Get conversion factor between two units
/// Returns conversion factor, or 1 if no conversion exists
double getConversionFactor(String fromUnit, String toUnit) {
  if (fromUnit == toUnit) {
    return 1;
  }

  final fromUnitUpper = fromUnit.toUpperCase().trim();
  final toUnitUpper = toUnit.toUpperCase().trim();

  final conversionRule = unitConversions.firstWhere(
    (rule) => rule.from == fromUnitUpper && rule.to == toUnitUpper,
    orElse: () => ConversionRule(from: '', to: '', factor: 1),
  );

  return conversionRule.factor;
}
