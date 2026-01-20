
import React, { useState } from 'react';
import { Shop, Product, ReferralSale, PayoutRequest, TransactionStatus, User, UserRole, AdminRequest, Lead, LeadStatus } from '../types';
import { BRANDS } from '../constants';

interface ShopDashboardProps {
  shop: Shop;
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
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
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const ShopDashboard: React.FC<ShopDashboardProps> = ({ 
  shop, setShops, products, setProducts, sales, setSales, payouts, setPayouts, users, setUsers, adminRequests, setAdminRequests, leads, setLeads
}) => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCompleteSale, setShowCompleteSale] = useState(false);
  const [showAdminPayout, setShowAdminPayout] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [payoutData, setPayoutData] = useState({ amount: 0, transactionId: '', screenshot: '' });
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    brand: BRANDS[0], 
    price: 0, 
    commission: 0, 
    downPayment: 0,
    emiAmount: 0,
    emiMonths: 0,
    frontImage: '', 
    backImage: '' 
  });
  
  const [newCust, setNewCust] = useState({ name: '', mobile: '', password: '' });
  const [saleData, setSaleData] = useState({ customerId: '', productId: '', buyerName: '' });

  const totalAdminIncome = sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0);
  const paidAdminIncome = payouts
    .filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PAID)
    .reduce((acc, p) => acc + p.amount, 0);
  const unpaidAdminIncome = totalAdminIncome - paidAdminIncome;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'frontImage' | 'backImage', isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit && editingProduct) {
          setEditingProduct({ ...editingProduct, [field]: base64 });
        } else {
          setNewProduct(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayoutScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPayoutData(prev => ({ ...prev, screenshot: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setShops(prev => prev.map(s => s.id === shop.id ? { ...s, logo: base64 } : s));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateCommissionSplit = (product: Product) => {
    const totalComm = product.customerCommission;
    const adminShare = totalComm * shop.adminCommissionRate;
    const customerShare = totalComm - adminShare;
    return { adminShare, customerShare };
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: `prod-${Date.now()}`,
      shopId: shop.id,
      name: newProduct.name,
      brand: newProduct.brand,
      price: newProduct.price,
      customerCommission: newProduct.commission,
      downPayment: newProduct.downPayment,
      emiAmount: newProduct.emiAmount,
      emiMonths: newProduct.emiMonths,
      frontImage: newProduct.frontImage,
      backImage: newProduct.backImage
    };
    setProducts(prev => [...prev, product]);
    setShowAddProduct(false);
    setNewProduct({ name: '', brand: BRANDS[0], price: 0, commission: 0, downPayment: 0, emiAmount: 0, emiMonths: 0, frontImage: '', backImage: '' });
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = `cust-${Date.now()}`;
    const referralCode = newCust.name.split(' ')[0].toUpperCase() + Math.floor(Math.random() * 1000);
    const newUser: User = {
      id: customerId,
      name: newCust.name,
      role: UserRole.CUSTOMER,
      mobile: newCust.mobile,
      password: newCust.password || '123456', 
      shopId: shop.id,
      referralCode: referralCode
    };
    setUsers(prev => [...prev, newUser]);
    setShowAddCustomer(false);
    setNewCust({ name: '', mobile: '', password: '' });
    alert(`Customer added! Referral Code: ${referralCode}`);
  };

  const handleAdminPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutData.amount <= 0 || !payoutData.screenshot) return alert('Please enter amount and upload proof.');
    
    const payout: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: shop.ownerId,
      shopId: shop.id,
      amount: payoutData.amount,
      upiId: 'ADMIN_MASTER_UPI',
      status: TransactionStatus.PENDING,
      screenshotUrl: payoutData.screenshot,
      transactionId: payoutData.transactionId,
      timestamp: Date.now(),
      type: 'SHOP_TO_ADMIN_PAYOUT'
    };
    setPayouts(prev => [...prev, payout]);
    setShowAdminPayout(false);
    setPayoutData({ amount: 0, transactionId: '', screenshot: '' });
    alert('Admin payout submitted for verification.');
  };

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === saleData.productId);
    const customer = users.find(u => u.id === saleData.customerId);
    if (!product || !customer) return;
    const { adminShare, customerShare } = calculateCommissionSplit(product);
    const sale: ReferralSale = {
      id: `sale-${Date.now()}`,
      shopId: shop.id,
      productId: product.id,
      referrerId: customer.id,
      buyerName: saleData.buyerName || 'Direct',
      saleAmount: product.price,
      customerCommissionEarned: customerShare,
      adminCommissionEarned: adminShare,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    setSales(prev => [...prev, sale]);
    setShowCompleteSale(false);
    setSaleData({ customerId: '', productId: '', buyerName: '' });
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
  };

  const getCustomerPerformance = (customerId: string) => {
    const customerSales = sales.filter(s => s.referrerId === customerId);
    const earnings = customerSales.reduce((acc, s) => acc + s.customerCommissionEarned, 0);
    return { count: customerSales.length, earnings };
  };

  const filteredCustomers = users.filter(u => 
    u.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    u.mobile?.includes(customerSearch)
  );

  return (
    <div className="space-y-6 pb-20">
      {unpaidAdminIncome > 0 && (
         <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Admin Unpaid Commission</p>
               <h3 className="text-xl font-black">₹{unpaidAdminIncome.toFixed(2)}</h3>
             </div>
           </div>
           <button 
             onClick={() => { setPayoutData(prev => ({ ...prev, amount: unpaidAdminIncome })); setShowAdminPayout(true); }}
             className="w-full sm:w-auto bg-white text-indigo-600 font-black px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
           >
             Pay Admin via UPI
           </button>
         </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center justify-center overflow-hidden shadow-inner">
              {shop.logo ? <img src={shop.logo} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            </div>
            <label className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-2xl transition-opacity">
              LOGO<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">{shop.shopName}</h1>
            <p className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-wider">Dashboard • {shop.gstNumber}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setShowAddCustomer(true)} className="flex-1 sm:flex-none bg-white text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm">+ Customer</button>
          <button onClick={() => setShowAddProduct(true)} className="flex-1 sm:flex-none bg-white text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm">+ Product</button>
          <button onClick={() => setShowCompleteSale(true)} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-green-100 hover:bg-green-700">✓ Record Sale</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Inventory</h3>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-black uppercase">{products.length} Models</span>
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
            {products.length === 0 ? <div className="p-12 text-center text-gray-400 text-xs uppercase font-bold tracking-widest">No Inventory</div> : products.map(p => (
              <div key={p.id} className="p-4 flex gap-4 hover:bg-gray-50 group transition-colors">
                <div className="flex-shrink-0">
                  {p.frontImage ? <img src={p.frontImage} className="w-12 h-16 object-cover rounded-xl border border-gray-100" /> : <div className="w-12 h-16 bg-gray-50 rounded-xl border border-dashed flex items-center justify-center text-[8px] text-gray-300">N/A</div>}
                </div>
                <div className="flex-grow py-1">
                  <p className="font-black text-gray-900 leading-none mb-1 uppercase tracking-tighter">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.brand} • ₹{p.price.toLocaleString()}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">EMI: ₹{p.emiAmount}/m</span>
                    <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tighter">Ref: ₹{p.customerCommission}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => setEditingProduct(p)} className="text-[10px] font-black text-blue-500 uppercase hover:underline">Edit</button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="text-[10px] font-black text-red-400 uppercase hover:underline">Del</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Network</h3>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">{users.length} Active</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Find customer..." 
                className="w-full pl-8 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
            {filteredCustomers.length === 0 ? <div className="p-12 text-center text-gray-400 text-xs">No Results</div> : filteredCustomers.map(user => {
              const perf = getCustomerPerformance(user.id);
              return (
                <div key={user.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-400 text-sm border border-indigo-100">{user.name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-gray-900 text-sm leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.mobile} • <span className="text-blue-500">{user.referralCode}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setSaleData({ ...saleData, customerId: user.id }); setShowCompleteSale(true); }} 
                      className="opacity-0 group-hover:opacity-100 bg-green-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm transition-all"
                    >
                      Record Sale
                    </button>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-600 leading-none">₹{perf.earnings.toLocaleString()}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mt-1">{perf.count} Sales</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.length === 0 ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-xs italic">No payouts found.</td></tr> : payouts.slice().reverse().map(payout => (
                <tr key={payout.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-[10px] text-gray-500 font-bold">{new Date(payout.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-gray-900 uppercase">{payout.type === 'SHOP_TO_ADMIN_PAYOUT' ? 'Master Admin' : (users.find(u => u.id === payout.userId)?.name || 'Customer')}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{payout.upiId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${payout.type === 'SHOP_TO_ADMIN_PAYOUT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {payout.type.split('_')[2]} Payout
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-gray-900">₹{payout.amount.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${payout.status === TransactionStatus.PAID ? 'bg-green-100 text-green-700' : payout.status === TransactionStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Payout Modal */}
      {showAdminPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Admin Comm. Payout</h3>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Master Admin UPI</p>
               <p className="text-lg font-black text-blue-900 font-mono">admin.master@upi</p>
            </div>
            <form onSubmit={handleAdminPayoutSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Amount to Transfer</label>
                <input type="number" step="0.01" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500" required value={payoutData.amount || ''} onChange={e => setPayoutData({...payoutData, amount: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ref ID / Transaction ID</label>
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required value={payoutData.transactionId} onChange={e => setPayoutData({...payoutData, transactionId: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Payment Screenshot</label>
                <div className="mt-1 relative border-2 border-dashed border-gray-200 rounded-2xl aspect-[3/2] flex items-center justify-center overflow-hidden bg-gray-50">
                  {payoutData.screenshot ? <img src={payoutData.screenshot} className="w-full h-full object-cover" /> : <p className="text-xs text-gray-400 font-bold uppercase">Upload Proof</p>}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required onChange={handlePayoutScreenshot} />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100">Confirm Admin Payout</button>
              <button type="button" onClick={() => setShowAdminPayout(false)} className="w-full text-gray-400 font-bold py-2">Close</button>
            </form>
          </div>
        </div>
      )}

      {/* Other modals remain similar but with enhanced styling */}
      {showCompleteSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-5 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Complete Sale</h3>
            <form onSubmit={handleCompleteSale} className="space-y-4">
              <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold appearance-none outline-none focus:ring-2 focus:ring-green-500" required value={saleData.productId} onChange={e => setSaleData({...saleData, productId: e.target.value})}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
              </select>
              <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold appearance-none outline-none focus:ring-2 focus:ring-green-500" required value={saleData.customerId} onChange={e => setSaleData({...saleData, customerId: e.target.value})}>
                <option value="">Select Referrer</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.referralCode})</option>)}
              </select>
              <input placeholder="Buyer Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500" required value={saleData.buyerName} onChange={e => setSaleData({...saleData, buyerName: e.target.value})} />
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-green-100">Confirm & Credit Commissions</button>
              <button type="button" onClick={() => setShowCompleteSale(false)} className="w-full text-gray-400 font-bold py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4">List New Model</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input placeholder="Model Name" className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Cash Price" className="px-4 py-3 bg-gray-50 border rounded-xl font-bold" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Total Commission" className="px-4 py-3 bg-gray-50 border rounded-xl font-bold" required value={newProduct.commission || ''} onChange={e => setNewProduct({...newProduct, commission: parseFloat(e.target.value)})} />
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">EMI Configuration</p>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="DownPay" className="px-3 py-2 bg-white border rounded-lg text-xs font-bold" value={newProduct.downPayment || ''} onChange={e => setNewProduct({...newProduct, downPayment: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Monthly" className="px-3 py-2 bg-white border rounded-lg text-xs font-bold" value={newProduct.emiAmount || ''} onChange={e => setNewProduct({...newProduct, emiAmount: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Months" className="px-3 py-2 bg-white border rounded-lg text-xs font-bold" value={newProduct.emiMonths || ''} onChange={e => setNewProduct({...newProduct, emiMonths: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl h-32 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {newProduct.frontImage ? <img src={newProduct.frontImage} className="w-full h-full object-cover" /> : <p className="text-[10px] text-gray-400 font-bold uppercase">Front View</p>}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'frontImage')} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100">Publish Model</button>
              <button type="button" onClick={() => setShowAddProduct(false)} className="w-full py-2 text-gray-400 font-bold">Discard</button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Add To Network</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input placeholder="Full Name" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold" required value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input type="tel" placeholder="Mobile" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold" required value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100">Register Customer</button>
              <button type="button" onClick={() => setShowAddCustomer(false)} className="w-full py-2 text-gray-400 font-bold">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
