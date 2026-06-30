export class SubscriptionService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Evaluates if a user possesses a valid premium profile or administrative bypass
   */
  async verifyAccess(user, profile) {
    if (profile?.is_admin) return true;

    const { data: subscription, error } = await this.repository.getSubscriptionByProfileId(user.id);

    if (error || !subscription) return false;
    
    return subscription.status === 'active' && new Date(subscription.valid_until) > new Date();
  }
}
