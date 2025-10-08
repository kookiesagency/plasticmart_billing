class ItemPartyPrice {
  final int? id;
  final int itemId;
  final int partyId;
  final String? partyName;
  final double price;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ItemPartyPrice({
    this.id,
    required this.itemId,
    required this.partyId,
    this.partyName,
    required this.price,
    this.createdAt,
    this.updatedAt,
  });

  factory ItemPartyPrice.fromJson(Map<String, dynamic> json) {
    String? partyName;

    // Handle nested parties object from Supabase join
    if (json['parties'] != null && json['parties'] is Map) {
      partyName = json['parties']['name'] as String?;
    } else if (json['party_name'] != null) {
      if (json['party_name'] is Map) {
        partyName = json['party_name']['name'] as String?;
      } else if (json['party_name'] is String) {
        partyName = json['party_name'] as String;
      }
    }

    return ItemPartyPrice(
      id: json['id'] as int?,
      itemId: json['item_id'] as int,
      partyId: json['party_id'] as int,
      partyName: partyName,
      price: (json['price'] as num).toDouble(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'item_id': itemId,
      'party_id': partyId,
      if (partyName != null) 'party_name': partyName,
      'price': price,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}
