
import React, { useState, useEffect } from 'react';
import { User, UserRole, Shop, Product, ReferralSale, PayoutRequest, TransactionStatus, AdminRequest, Lead, Complaint } from './types';
import { MOCK_USERS, MOCK_SHOPS } from './constants';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ShopDashboard from './components/ShopDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  // Persistence Helper: Load data from LocalStorage or default to initial values
  const getInitialData = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return defaultValue;
    }
  };

  const [users, setUsers] = useState<User[]>(() => getInitialData('rfm_users', MOCK_USERS));
  const [shops, setShops] = useState<Shop[]>(() => getInitialData('rfm_shops', MOCK_SHOPS));
  const [products, setProducts] = useState<Product[]>(() => getInitialData('rfm_products', []));
  const [sales, setSales] = useState<ReferralSale[]>(() => getInitialData('rfm_sales', []));
  const [payouts, setPayouts] = useState<PayoutRequest[]>(() => getInitialData('rfm_payouts', []));
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>(() => getInitialData('rfm_requests', []));
  const [leads, setLeads] = useState<Lead[]>(() => getInitialData('rfm_leads', []));
  const [complaints, setComplaints] = useState<Complaint[]>(() => getInitialData('rfm_complaints', []));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync session (logged in user)
  useEffect(() => {
    const saved = localStorage.getItem('rfm_session');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      const latestUser = users.find(u => u.id === parsedUser.id);
      if (latestUser) setCurrentUser(latestUser);
    }
  }, [users]);

  // Effect hooks to automatically save state changes to LocalStorage
  useEffect(() => { localStorage.setItem('rfm_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('rfm_shops', JSON.stringify(shops)); }, [shops]);
  useEffect(() => { localStorage.setItem('rfm_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('rfm_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('rfm_payouts', JSON.stringify(payouts)); }, [payouts]);
  useEffect(() => { localStorage.setItem('rfm_requests', JSON.stringify(adminRequests)); }, [adminRequests]);
  useEffect(() => { localStorage.setItem('rfm_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('rfm_complaints', JSON.stringify(complaints)); }, [complaints]);

  const handleLogin = (identifier: string, role: UserRole, password?: string) => {
    const user = users.find(u => {
      if (role === UserRole.ADMIN) {
        return u.email === identifier && u.role === role && u.password === password;
      }
      if (role === UserRole.SHOP_OWNER) {
        return u.mobile === identifier && u.role === role && u.password === password;
      }
      return u.mobile === identifier && u.role === role;
    });

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('rfm_session', JSON.stringify(user));
    } else {
      alert(role === UserRole.CUSTOMER ? 'Invalid mobile number' : 'Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rfm_session');
  };

  const registerShop = (shopData: Partial<Shop> & { ownerName: string, mobile: string, password?: string, gstCertificatePhoto: string, shopPhoto: string, ownerSelfiePhoto: string }) => {
    const newOwnerId = `owner-${Date.now()}`;
    const newShopId = `shop-${Date.now()}`;
    
    const newOwner: User = {
      id: newOwnerId,
      name: shopData.ownerName,
      role: UserRole.SHOP_OWNER,
      mobile: shopData.mobile,
      password: shopData.password,
      shopId: newShopId
    };

    const newShop: Shop = {
      id: newShopId,
      ownerId: newOwnerId,
      shopName: shopData.shopName || '',
      address: shopData.address || '',
      gstNumber: shopData.gstNumber || '',
      isApproved: false,
      adminCommissionRate: 0.05,
      gstCertificatePhoto: shopData.gstCertificatePhoto,
      shopPhoto: shopData.shopPhoto,
      ownerSelfiePhoto: shopData.ownerSelfiePhoto
    };

    setUsers(prev => [...prev, newOwner]);
    setShops(prev => [...prev, newShop]);
    alert('Shop registered successfully. Please wait for Admin approval.');
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
  };

  const renderDashboard = () => {
    if (!currentUser) return <Login onLogin={handleLogin} onRegisterShop={registerShop} />;

    switch (currentUser.role) {
      case UserRole.ADMIN:
        return (
          <AdminDashboard 
            shops={shops} setShops={setShops} 
            sales={sales} payouts={payouts} setPayouts={setPayouts}
            adminRequests={adminRequests} setAdminRequests={setAdminRequests}
            complaints={complaints} setComplaints={setComplaints}
            users={users} setUsers={setUsers}
            onResetPassword={resetUserPassword}
          />
        );
      case UserRole.SHOP_OWNER:
        const myShop = shops.find(s => s.ownerId === currentUser.id);
        if (!myShop?.isApproved) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tighter">Approval Pending</h2>
              <p className="text-gray-500 mt-2 text-sm">Admin is verifying your documents. Please check back later.</p>
              <button onClick={handleLogout} className="mt-6 text-indigo-600 font-black uppercase text-xs">Log out</button>
            </div>
          );
        }
        return (
          <ShopDashboard 
            shop={myShop} setShops={setShops}
            products={products.filter(p => p.shopId === myShop.id)} setProducts={setProducts}
            sales={sales.filter(s => s.shopId === myShop.id)} setSales={setSales}
            payouts={payouts.filter(p => p.shopId === myShop.id)} setPayouts={setPayouts}
            users={users.filter(u => u.shopId === myShop.id && u.role === UserRole.CUSTOMER)} setUsers={setUsers}
            adminRequests={adminRequests.filter(r => r.shopId === myShop.id)} setAdminRequests={setAdminRequests}
            leads={leads.filter(l => l.shopId === myShop.id)} setLeads={setLeads}
          />
        );
      case UserRole.CUSTOMER:
        const custShop = shops.find(s => s.id === currentUser.shopId);
        return (
          <CustomerDashboard 
            currentUser={currentUser} shop={custShop}
            products={products.filter(p => p.shopId === currentUser.shopId)}
            sales={sales.filter(s => s.referrerId === currentUser.id)}
            payouts={payouts.filter(p => p.userId === currentUser.id)} setPayouts={setPayouts}
            setUsers={setUsers} users={users}
            leads={leads.filter(l => l.customerId === currentUser.id)} setLeads={setLeads}
            complaints={complaints.filter(c => c.customerId === currentUser.id)} setComplaints={setComplaints}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      <Navigation user={currentUser} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-6xl">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default App;
