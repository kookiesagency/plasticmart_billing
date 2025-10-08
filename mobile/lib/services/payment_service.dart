import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/payment.dart';

class PaymentService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Add a new payment
  Future<Payment?> addPayment(Payment payment) async {
    try {
      final response = await _supabase
          .from('payments')
          .insert(payment.toJson())
          .select()
          .single();

      return Payment.fromJson(response);
    } catch (e) {
      print('Error adding payment: $e');
      return null;
    }
  }

  // Update an existing payment
  Future<bool> updatePayment(Payment payment) async {
    try {
      await _supabase
          .from('payments')
          .update(payment.toJson())
          .eq('id', payment.id!);

      return true;
    } catch (e) {
      print('Error updating payment: $e');
      return false;
    }
  }

  // Delete a payment
  Future<bool> deletePayment(int paymentId) async {
    try {
      await _supabase.from('payments').delete().eq('id', paymentId);

      return true;
    } catch (e) {
      print('Error deleting payment: $e');
      return false;
    }
  }

  // Get all payments for an invoice
  Future<List<Payment>> getPaymentsByInvoice(int invoiceId) async {
    try {
      final response = await _supabase
          .from('payments')
          .select()
          .eq('invoice_id', invoiceId)
          .order('payment_date', ascending: false);

      return (response as List).map((json) => Payment.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching payments: $e');
      return [];
    }
  }
}
