class Payment {
  final int? id;
  final int invoiceId;
  final double amount;
  final String paymentDate;
  final String? remark;
  final DateTime? createdAt;

  Payment({
    this.id,
    required this.invoiceId,
    required this.amount,
    required this.paymentDate,
    this.remark,
    this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as int?,
      invoiceId: json['invoice_id'] as int,
      amount: (json['amount'] as num).toDouble(),
      paymentDate: json['payment_date'] as String,
      remark: json['remark'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'invoice_id': invoiceId,
      'amount': amount,
      'payment_date': paymentDate,
      if (remark != null && remark!.isNotEmpty) 'remark': remark,
    };
  }

  Payment copyWith({
    int? id,
    int? invoiceId,
    double? amount,
    String? paymentDate,
    String? remark,
    DateTime? createdAt,
  }) {
    return Payment(
      id: id ?? this.id,
      invoiceId: invoiceId ?? this.invoiceId,
      amount: amount ?? this.amount,
      paymentDate: paymentDate ?? this.paymentDate,
      remark: remark ?? this.remark,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
