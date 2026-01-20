
import React, { useState } from 'react';
import { Shop, Product, ReferralSale, PayoutRequest, TransactionStatus, User, UserRole, AdminRequest } from '../types';
import { BRANDS } from '../constants';

interface ShopDashboardProps {
  shop: Shop;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: ReferralSale[];
  setSales: React.Dispatch<React.SetStateAction<ReferralSale[]>>;
  payouts: PayoutRequest[];
  setPayouts: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  adminRequests: AdminRequest[];
  setAdminRequests: React.Dispatch<React.SetStateAction<AdminRequest[]>>;
}

const ShopDashboard: React.FC<ShopDashboardProps> = ({ 
  shop, products, setProducts, sales, setSales, payouts, setPayouts, users, setUsers, adminRequests, setAdminRequests 
}) => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', brand: BRANDS[0], price: 0, commission: 0 });
  const [newCust, setNewCust] = useState({ name: '', mobile: '' });

  const stats = {
    totalSales: sales.length,
    totalVolume: sales.reduce((acc, s) => acc + s.saleAmount, 0),
    totalCommissionOwed: sales.reduce((acc, s) => acc + s.customerCommissionEarned, 0),
    totalAdminCommissionOwed: sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0),
    unreadRequests: adminRequests.filter(r => r.status === 'UNREAD').length
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const prod: Product = {
      id: `prod-${Date.now()}`,
      shopId: shop.id,
      name: newProduct.name,
      brand: newProduct.brand,
      price: newProduct.price,
      customerCommission: newProduct.commission
    };
    setProducts(prev => [...prev, prod]);
    setShowAddProduct(false);
    setNewProduct({ name: '', brand: BRANDS[0], price: 0, commission: 0 });
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cust: User = {
      id: `cust-${Date.now()}`,
      name: newCust.name,
      role: UserRole.CUSTOMER,
      mobile: newCust.mobile,
      shopId: shop.id,
      referralCode: `REF-${newCust.name.substring(0,3).toUpperCase()}${Date.now().toString().slice(-4)}`
    };
    setUsers(allUsers => [...allUsers, cust]);
    setShowAddCustomer(false);
    setNewCust({ name: '', mobile: '' });
    alert(`Customer ID created! Referral Code: ${cust.referralCode}`);
  };

  const handleManualSale = (productId: string, referrerId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const sale: ReferralSale = {
      id: `sale-${Date.now()}`,
      shopId: shop.id,
      productId: product.id,
      referrerId: referrerId,
      buyerName: "Walk-in Buyer",
      saleAmount: product.price,
      customerCommissionEarned: product.customerCommission,
      adminCommissionEarned: product.price * shop.adminCommissionRate,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    setSales(prev => [...prev, sale]);
    alert('Sale recorded! Commission auto-calculated.');
  };

  const handleUploadScreenshot = (payoutId: string) => {
    // Mock upload
    setPayouts(prev => prev.map(p => p.id === payoutId ? { 
      ...p, 
      status: TransactionStatus.PAID,
      screenshotUrl: 'https://picsum.photos/400/600' // Mock screenshot
    } : p));
  };

  const markRequestRead = (id: string) => {
    setAdminRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'READ' } : r));
  };

  const requestAdminPayout = () => {
    const amount = stats.totalAdminCommissionOwed;
    if (amount <= 0) return alert('No commission owed to Admin yet.');
    
    const req: PayoutRequest = {
      id: `ap-${Date.now()}`,
      userId: 'admin-1',
      shopId: shop.id,
      amount: amount,
      upiId: 'admin@upi',
      status: TransactionStatus.PENDING,
      timestamp: Date.now(),
      type: 'SHOP_TO_ADMIN_PAYOUT'
    };
    setPayouts(prev => [...prev, req]);
    alert('Payment request sent to Admin. Please complete the UPI transfer.');
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shop.shopName}</h1>
          <p className="text-gray-500">Shop Dashboard • GST: {shop.gstNumber}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddCustomer(true)}
            className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
          >
            + Create Customer ID
          </button>
          <button 
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200"
          >
            + List Product
          </button>
        </div>
      </header>

      {/* Admin Requests Notification */}
      {adminRequests.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Official Requests from Admin
              {stats.unreadRequests > 0 && (
                <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.unreadRequests} New</span>
              )}
            </h3>
          </div>
          <div className="space-y-3">
            {adminRequests.map(req => (
              <div key={req.id} className={`p-3 rounded-xl border ${req.status === 'UNREAD' ? 'bg-white border-amber-300' : 'bg-amber-100 border-amber-200'}`}>
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-900">{req.title}</p>
                  <span className="text-[10px] text-gray-500 uppercase">{new Date(req.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{req.message}</p>
                {req.status === 'UNREAD' && (
                  <button 
                    onClick={() => markRequestRead(req.id)}
                    className="mt-2 text-xs font-bold text-amber-700 hover:underline"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', val: `₹${stats.totalVolume.toLocaleString()}`, color: 'text-gray-900' },
          { label: 'Cust. Commission', val: `₹${stats.totalCommissionOwed.toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Admin Owed', val: `₹${stats.totalAdminCommissionOwed.toFixed(2)}`, color: 'text-red-600' },
          { label: 'Successful Referrals', val: stats.totalSales, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product List */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">My Products</h3>
            <span className="text-xs text-gray-500 font-medium">{products.length} Items</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
            {products.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No products listed yet.</div>
            ) : (
              products.map(p => (
                <div key={p.id} className="p-4 flex justify-between items-center group hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{p.brand} • ₹{p.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">₹{p.customerCommission} Comm.</p>
                    <button 
                      onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))}
                      className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 uppercase font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Withdrawal Requests */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Payout Requests</h3>
            <button 
              onClick={requestAdminPayout}
              className="text-xs font-bold text-red-600 border border-red-100 px-2 py-1 rounded-md bg-red-50"
            >
              Pay Admin
            </button>
          </div>
          <div className="p-4 space-y-4">
            {payouts.filter(p => p.type === 'CUSTOMER_PAYOUT').length === 0 ? (
              <p className="text-center text-gray-400 py-8">No customer withdrawal requests.</p>
            ) : (
              payouts.filter(p => p.type === 'CUSTOMER_PAYOUT').map(req => (
                <div key={req.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">From Customer</p>
                      <p className="text-xl font-bold text-gray-900">₹{req.amount}</p>
                      <p className="text-sm font-mono text-blue-600">{req.upiId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.status === TransactionStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {req.status}
                    </span>
                  </div>
                  {req.status === TransactionStatus.PENDING && (
                    <button 
                      onClick={() => handleUploadScreenshot(req.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Pay & Upload Proof
                    </button>
                  )}
                  {req.status === TransactionStatus.PAID && (
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Screenshot Shared
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Manual Sale Simulation */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Record New Sale (from Referral)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select id="sale-prod" className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
          </select>
          <select id="sale-cust" className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none">
            <option value="">Select Referring Customer</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.referralCode})</option>)}
          </select>
          <button 
            onClick={() => {
              const pid = (document.getElementById('sale-prod') as HTMLSelectElement).value;
              const cid = (document.getElementById('sale-cust') as HTMLSelectElement).value;
              if(pid && cid) handleManualSale(pid, cid);
              else alert('Select both product and customer');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-green-100"
          >
            Complete Referral Sale
          </button>
        </div>
      </section>

      {/* Modals */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <input placeholder="Product Name (e.g. iPhone 15)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})}>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price (₹)" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Cust. Comm (₹)" className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required value={newProduct.commission || ''} onChange={e => setNewProduct({...newProduct, commission: parseFloat(e.target.value)})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">List Mobile</button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Create Customer ID</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <input placeholder="Customer Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input placeholder="Mobile Number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Register Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
