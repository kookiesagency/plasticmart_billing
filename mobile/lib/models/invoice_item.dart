class InvoiceItem {
  final int? id;
  final int? invoiceId;
  final int itemId;
  final String? itemName;
  final String? itemUnit;
  final double quantity;
  final double rate;
  final int? position;
  final DateTime? createdAt;

  InvoiceItem({
    this.id,
    this.invoiceId,
    required this.itemId,
    this.itemName,
    this.itemUnit,
    required this.quantity,
    required this.rate,
    this.position,
    this.createdAt,
  });

  double get total => quantity * rate;

  factory InvoiceItem.fromJson(Map<String, dynamic> json) {
    return InvoiceItem(
      id: json['id'] as int?,
      invoiceId: json['invoice_id'] as int?,
      itemId: json['item_id'] as int,
      itemName: json['item_name'] as String?,
      itemUnit: json['item_unit'] as String?,
      quantity: (json['quantity'] as num).toDouble(),
      rate: (json['rate'] as num).toDouble(),
      position: json['position'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (invoiceId != null) 'invoice_id': invoiceId,
      'item_id': itemId,
      'quantity': quantity,
      'rate': rate,
      if (position != null) 'position': position,
    };
  }

  InvoiceItem copyWith({
    int? id,
    int? invoiceId,
    int? itemId,
    String? itemName,
    String? itemUnit,
    double? quantity,
    double? rate,
    int? position,
    DateTime? createdAt,
  }) {
    return InvoiceItem(
      id: id ?? this.id,
      invoiceId: invoiceId ?? this.invoiceId,
      itemId: itemId ?? this.itemId,
      itemName: itemName ?? this.itemName,
      itemUnit: itemUnit ?? this.itemUnit,
      quantity: quantity ?? this.quantity,
      rate: rate ?? this.rate,
      position: position ?? this.position,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
