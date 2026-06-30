import { getServiceSupabase } from "../config/supabase.js";

export class PaymentRepository {
  static async getActiveSubscription(userId) {
    const supabase = getServiceSupabase();
    return supabase.from('subscriptions').select('status, valid_until').eq('profile_id', userId).eq('status', 'active').single();
  }

  static async processPayment(userId, eventId, amount, currency, paidUntil) {
    const supabase = getServiceSupabase();
    return supabase.rpc('process_payment', {
        p_user_id:    userId,
        p_event_id:   eventId,
        p_amount:     amount,
        p_currency:   currency,
        p_paid_until: paidUntil,
    });
  }
}
