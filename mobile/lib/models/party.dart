class Party {
  final int? id;
  final String name;
  final String? phone;
  final String? email;
  final String? gst;
  final String? address;
  final double? bundleRate;
  final double? openingBalance;
  final int? invoiceCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;

  Party({
    this.id,
    required this.name,
    this.phone,
    this.email,
    this.gst,
    this.address,
    this.bundleRate,
    this.openingBalance,
    this.invoiceCount,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Party.fromJson(Map<String, dynamic> json) {
    return Party(
      id: json['id'] as int?,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      gst: json['gst'] as String?,
      address: json['address'] as String?,
      bundleRate: json['bundle_rate'] != null
          ? (json['bundle_rate'] as num).toDouble()
          : null,
      openingBalance: json['opening_balance'] != null
          ? (json['opening_balance'] as num).toDouble()
          : null,
      invoiceCount: json['invoice_count'] as int?,
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
      'name': name,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      if (gst != null) 'gst': gst,
      if (address != null) 'address': address,
      if (bundleRate != null) 'bundle_rate': bundleRate,
      if (openingBalance != null) 'opening_balance': openingBalance,
      if (createdAt != null) 'created_at': createdAt?.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt?.toIso8601String(),
      if (deletedAt != null) 'deleted_at': deletedAt?.toIso8601String(),
    };
  }
}
