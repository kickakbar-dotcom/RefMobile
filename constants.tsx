
import { UserRole, User, Shop, Product, TransactionStatus } from './types';

export const INITIAL_ADMIN: User = {
  id: 'admin-1',
  name: 'Master Admin',
  role: UserRole.ADMIN,
  email: 'kickakbar@gmail.com',
  password: 'Akbar@7576'
};

export const BRANDS = ['Apple', 'Samsung', 'Realme', 'Oppo', 'Vivo', 'Xiaomi', 'OnePlus'];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    ownerId: 'owner-1',
    shopName: 'Elite Mobiles',
    address: '123 Main St, Tech City',
    gstNumber: '22AAAAA0000A1Z5',
    isApproved: true,
    adminCommissionRate: 0.05 // 5% of the commission amount as requested
  }
];

export const MOCK_USERS: User[] = [
  INITIAL_ADMIN,
  {
    id: 'owner-1',
    name: 'Rajesh Kumar',
    role: UserRole.SHOP_OWNER,
    mobile: '8888888888',
    password: 'Shop@123',
    shopId: 'shop-1'
  },
  {
    id: 'cust-1',
    name: 'Amit Singh',
    role: UserRole.CUSTOMER,
    mobile: '7777777777',
    shopId: 'shop-1',
    referralCode: 'AMIT123'
  }
];
