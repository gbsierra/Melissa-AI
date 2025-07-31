// Membership tiers
export type MembershipTier = 'free' | 'pro' | 'elite';

// Purchase states
export type PurchaseStatus = 'idle' | 'pending' | 'success' | 'failed';

// Entitlements (optional granular flags)
export type MembershipEntitlements = Record<string, boolean>;

// Full shape of membership-related state
export interface MembershipState {
  tier: MembershipTier;
  isPremium: boolean;
  purchaseStatus: PurchaseStatus;
  shouldUpsell: boolean;
  entitlementLoaded: boolean;
  entitlements?: MembershipEntitlements;
}