import 'unit.dart';
import 'party.dart';
import 'item_party_price.dart';

class Item {
  final int? id;
  final String name;
  final double defaultRate;
  final double? purchaseRate;
  final int unitId;
  final Unit? unit;
  final int? purchasePartyId;
  final Party? purchaseParty;
  final List<ItemPartyPrice>? itemPartyPrices;
  final DateTime? createdAt;
  final DateTime? deletedAt;

  Item({
    this.id,
    required this.name,
    required this.defaultRate,
    this.purchaseRate,
    required this.unitId,
    this.unit,
    this.purchasePartyId,
    this.purchaseParty,
    this.itemPartyPrices,
    this.createdAt,
    this.deletedAt,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    List<ItemPartyPrice>? partyPrices;
    if (json['item_party_prices'] != null) {
      partyPrices = (json['item_party_prices'] as List)
          .map((price) => ItemPartyPrice.fromJson(price))
          .toList();
    }

    return Item(
      id: json['id'] as int?,
      name: json['name'] as String,
      defaultRate: (json['default_rate'] as num).toDouble(),
      purchaseRate: json['purchase_rate'] != null
          ? (json['purchase_rate'] as num).toDouble()
          : null,
      unitId: json['unit_id'] as int,
      unit: json['units'] != null ? Unit.fromJson(json['units']) : null,
      purchasePartyId: json['purchase_party_id'] as int?,
      purchaseParty: json['parties'] != null ? Party.fromJson(json['parties']) : null,
      itemPartyPrices: partyPrices,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
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
      'default_rate': defaultRate,
      if (purchaseRate != null) 'purchase_rate': purchaseRate,
      'unit_id': unitId,
      if (purchasePartyId != null) 'purchase_party_id': purchasePartyId,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (deletedAt != null) 'deleted_at': deletedAt!.toIso8601String(),
    };
  }

  Item copyWith({
    int? id,
    String? name,
    double? defaultRate,
    double? purchaseRate,
    int? unitId,
    Unit? unit,
    int? purchasePartyId,
    Party? purchaseParty,
    List<ItemPartyPrice>? itemPartyPrices,
    DateTime? createdAt,
    DateTime? deletedAt,
  }) {
    return Item(
      id: id ?? this.id,
      name: name ?? this.name,
      defaultRate: defaultRate ?? this.defaultRate,
      purchaseRate: purchaseRate ?? this.purchaseRate,
      unitId: unitId ?? this.unitId,
      unit: unit ?? this.unit,
      purchasePartyId: purchasePartyId ?? this.purchasePartyId,
      purchaseParty: purchaseParty ?? this.purchaseParty,
      itemPartyPrices: itemPartyPrices ?? this.itemPartyPrices,
      createdAt: createdAt ?? this.createdAt,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }
}
