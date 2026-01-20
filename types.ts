
export enum UserRole {
  ADMIN = 'ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  CUSTOMER = 'CUSTOMER'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  mobile?: string;
  email?: string;
  password?: string;
  shopId?: string; // Only for Customers and Shop Owners
  referralCode?: string;
  referredBy?: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  shopName: string;
  address: string;
  gstNumber: string;
  isApproved: boolean;
  adminCommissionRate: number; // 1-2%
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  brand: string;
  price: number;
  customerCommission: number; // Flat or %? Prompt says "commission margin"
}

export interface ReferralSale {
  id: string;
  shopId: string;
  productId: string;
  referrerId: string;
  buyerName: string;
  saleAmount: number;
  customerCommissionEarned: number;
  adminCommissionEarned: number;
  timestamp: number;
  status: 'COMPLETED' | 'CANCELLED';
}

export interface PayoutRequest {
  id: string;
  userId: string;
  shopId: string;
  amount: number;
  upiId: string;
  status: TransactionStatus;
  screenshotUrl?: string;
  timestamp: number;
  type: 'CUSTOMER_PAYOUT' | 'SHOP_TO_ADMIN_PAYOUT';
}
