class PurchaseParty {
  final int? id;
  final String partyCode;
  final String name;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;
  final int? itemCount;

  PurchaseParty({
    this.id,
    required this.partyCode,
    required this.name,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.itemCount,
  });

  factory PurchaseParty.fromJson(Map<String, dynamic> json) {
    return PurchaseParty(
      id: json['id'] as int?,
      partyCode: json['party_code'] as String,
      name: json['name'] as String,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      deletedAt: json['deleted_at'] != null
          ? DateTime.parse(json['deleted_at'] as String)
          : null,
      itemCount: json['item_count'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'party_code': partyCode,
      'name': name,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
      if (deletedAt != null) 'deleted_at': deletedAt!.toIso8601String(),
    };
  }

  PurchaseParty copyWith({
    int? id,
    String? partyCode,
    String? name,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
    int? itemCount,
  }) {
    return PurchaseParty(
      id: id ?? this.id,
      partyCode: partyCode ?? this.partyCode,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      itemCount: itemCount ?? this.itemCount,
    );
  }
}
