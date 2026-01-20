
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

export enum LeadStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED'
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
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
  adminCommissionRate: number; // 0.05 - 0.10 (5% to 10% of the product commission)
  gstCertificatePhoto?: string;
  shopPhoto?: string;
  ownerSelfiePhoto?: string;
  logo?: string; // Base64 shop logo
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  brand: string;
  price: number;
  customerCommission: number; // Total commission set by shop owner
  downPayment?: number;
  emiAmount?: number;
  emiMonths?: number;
  frontImage?: string; // Base64 string
  backImage?: string;  // Base64 string
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
  transactionId?: string;
  timestamp: number;
  type: 'CUSTOMER_PAYOUT' | 'SHOP_TO_ADMIN_PAYOUT';
}

export interface AdminRequest {
  id: string;
  shopId: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  timestamp: number;
}

export interface Lead {
  id: string;
  customerId: string;
  shopId: string;
  productId: string;
  referralName: string;
  referralMobile: string;
  status: LeadStatus;
  timestamp: number;
}

export interface Complaint {
  id: string;
  customerId: string;
  shopId: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  timestamp: number;
}
