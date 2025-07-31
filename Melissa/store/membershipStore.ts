import { create } from 'zustand';
import {
  MembershipTier,
  PurchaseStatus,
  MembershipEntitlements,
} from '@/types/memberships';

interface MembershipState {
  tier: MembershipTier;
  isPremium: boolean;
  purchaseStatus: PurchaseStatus;
  shouldUpsell: boolean;
  entitlementLoaded: boolean;
  entitlements?: MembershipEntitlements;
}

interface MembershipActions {
  setTier: (tier: MembershipTier) => void;
  setPurchaseStatus: (status: PurchaseStatus) => void;
  setEntitlements: (entitlements: MembershipEntitlements) => void;
  triggerUpsell: () => void;
  dismissUpsell: () => void;
}

export const useMembershipStore = create<MembershipState & MembershipActions>((set) => ({
  tier: 'free',
  isPremium: false,
  purchaseStatus: 'idle',
  shouldUpsell: false,
  entitlementLoaded: false,
  entitlements: undefined,

  setTier: (tier) => set({ tier, isPremium: tier !== 'free' }),
  setPurchaseStatus: (status) => set({ purchaseStatus: status }),
  setEntitlements: (entitlements) =>
    set({ entitlements, entitlementLoaded: true }),
  triggerUpsell: () => set({ shouldUpsell: true }),
  dismissUpsell: () => set({ shouldUpsell: false }),
}));