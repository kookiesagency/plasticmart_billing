class Invoice {
  final int? id;
  final int partyId;
  final String? partyName;
  final String invoiceDate;
  final String? invoiceNumber;
  final double bundleCharge;
  final double? bundleRate;
  final double? bundleQuantity;
  final double? subTotal;
  final double? totalAmount;
  final String status; // pending, paid, partial
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;

  Invoice({
    this.id,
    required this.partyId,
    this.partyName,
    required this.invoiceDate,
    this.invoiceNumber,
    this.bundleCharge = 0,
    this.bundleRate,
    this.bundleQuantity,
    this.subTotal,
    this.totalAmount,
    this.status = 'pending',
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] as int?,
      partyId: json['party_id'] as int,
      partyName: json['party_name'] as String?,
      invoiceDate: json['invoice_date'] as String,
      invoiceNumber: json['invoice_number'] as String?,
      bundleCharge: json['bundle_charge'] != null
          ? (json['bundle_charge'] as num).toDouble()
          : 0,
      bundleRate: json['bundle_rate'] != null
          ? (json['bundle_rate'] as num).toDouble()
          : null,
      bundleQuantity: json['bundle_quantity'] != null
          ? (json['bundle_quantity'] as num).toDouble()
          : null,
      subTotal: json['sub_total'] != null
          ? (json['sub_total'] as num).toDouble()
          : null,
      totalAmount: json['total_amount'] != null
          ? (json['total_amount'] as num).toDouble()
          : null,
      status: json['status'] as String? ?? 'pending',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      deletedAt: json['deleted_at'] != null
          ? DateTime.parse(json['deleted_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'party_id': partyId,
      'invoice_date': invoiceDate,
      if (invoiceNumber != null) 'invoice_number': invoiceNumber,
      'bundle_charge': bundleCharge,
      if (bundleRate != null) 'bundle_rate': bundleRate,
      if (bundleQuantity != null) 'bundle_quantity': bundleQuantity,
      if (totalAmount != null) 'total_amount': totalAmount,
      'status': status,
    };
  }

  Invoice copyWith({
    int? id,
    int? partyId,
    String? partyName,
    String? invoiceDate,
    String? invoiceNumber,
    double? bundleCharge,
    double? bundleRate,
    double? bundleQuantity,
    double? subTotal,
    double? totalAmount,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
  }) {
    return Invoice(
      id: id ?? this.id,
      partyId: partyId ?? this.partyId,
      partyName: partyName ?? this.partyName,
      invoiceDate: invoiceDate ?? this.invoiceDate,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      bundleCharge: bundleCharge ?? this.bundleCharge,
      bundleRate: bundleRate ?? this.bundleRate,
      bundleQuantity: bundleQuantity ?? this.bundleQuantity,
      subTotal: subTotal ?? this.subTotal,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }
}
