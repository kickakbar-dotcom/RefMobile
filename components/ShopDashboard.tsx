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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [transactionIds, setTransactionIds] = useState<Record<string, string>>({});
  
  const [newProduct, setNewProduct] = useState({ name: '', brand: BRANDS[0], price: 0, commission: 0, frontImage: '', backImage: '' });
  const [newCust, setNewCust] = useState({ name: '', mobile: '' });

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setShops(prev => prev.map(s => s.id === shop.id ? { ...s, logo: base64 } : s));
        alert('Shop logo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const paidAdminCommission = payouts
    .filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PAID)
    .reduce((acc, p) => acc + p.amount, 0);

  const stats = {
    totalSales: sales.length,
    totalVolume: sales.reduce((acc, s) => acc + s.saleAmount, 0),
    totalCommissionOwed: sales.reduce((acc, s) => acc + s.customerCommissionEarned, 0),
    totalAdminCommissionOwed: sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0) - paidAdminCommission,
    unreadRequests: adminRequests.filter(r => r.status === 'UNREAD').length,
    pendingLeads: leads.filter(l => l.status === LeadStatus.PENDING).length
  };

  const getCustomerCommission = (customerId: string) => {
    return sales
      .filter(s => s.referrerId === customerId)
      .reduce((acc, s) => acc + s.customerCommissionEarned, 0);
  };

  const calculateCommissionSplit = (product: Product) => {
    const totalComm = product.customerCommission;
    const adminShare = totalComm * shop.adminCommissionRate;
    const customerShare = totalComm - adminShare;
    return { adminShare, customerShare };
  };

  const convertLeadToSale = (lead: Lead) => {
    const product = products.find(p => p.id === lead.productId);
    if (!product) return alert('Product no longer exists');

    const { adminShare, customerShare } = calculateCommissionSplit(product);

    const sale: ReferralSale = {
      id: `sale-${Date.now()}`,
      shopId: shop.id,
      productId: product.id,
      referrerId: lead.customerId,
      buyerName: lead.referralName,
      saleAmount: product.price,
      customerCommissionEarned: customerShare,
      adminCommissionEarned: adminShare,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };

    setSales(prev => [...prev, sale]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.CONVERTED } : l));
    alert(`Lead converted! Commission Split: Admin ₹${adminShare.toFixed(2)}, Customer ₹${customerShare.toFixed(2)}.`);
  };

  const handleManualSale = (productId: string, referrerId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const { adminShare, customerShare } = calculateCommissionSplit(product);

    const sale: ReferralSale = {
      id: `sale-${Date.now()}`,
      shopId: shop.id,
      productId: product.id,
      referrerId: referrerId,
      buyerName: "Referral Walk-in",
      saleAmount: product.price,
      customerCommissionEarned: customerShare,
      adminCommissionEarned: adminShare,
      timestamp: Date.now(),
      status: 'COMPLETED'
    };
    setSales(prev => [...prev, sale]);
    alert(`Sale recorded! Commission Split: Admin ₹${adminShare.toFixed(2)}, Customer ₹${customerShare.toFixed(2)}.`);
  };

  const handleMarkAsPaid = (payoutId: string) => {
    const tid = transactionIds[payoutId];
    if (!tid || tid.trim().length < 5) {
      alert('Please enter a valid Transaction ID/Reference Number');
      return;
    }

    setPayouts(prev => prev.map(p => p.id === payoutId ? { 
      ...p, 
      status: TransactionStatus.PAID,
      transactionId: tid,
      screenshotUrl: 'https://picsum.photos/400/600'
    } : p));
    
    alert(`Payment confirmed! Amount deducted from relevant wallet.`);
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
      upiId: 'kickakbar@okaxis',
      status: TransactionStatus.PENDING,
      timestamp: Date.now(),
      type: 'SHOP_TO_ADMIN_PAYOUT'
    };
    setPayouts(prev => [...prev, req]);
    alert('Admin Commission request created. Please pay via UPI in the Payouts section.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('UPI ID copied to clipboard!');
  };

  const openUpiApp = (upiId: string, amount: number, name: string) => {
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    window.location.href = upiUrl;
  };

  // Fix: Added handleAddProduct to manage adding new products
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: `prod-${Date.now()}`,
      shopId: shop.id,
      name: newProduct.name,
      brand: newProduct.brand,
      price: newProduct.price,
      customerCommission: newProduct.commission,
      frontImage: newProduct.frontImage,
      backImage: newProduct.backImage
    };
    setProducts(prev => [...prev, product]);
    setShowAddProduct(false);
    setNewProduct({ name: '', brand: BRANDS[0], price: 0, commission: 0, frontImage: '', backImage: '' });
  };

  // Fix: Added handleEditProduct to update existing products
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
  };

  // Fix: Added handleAddCustomer to register new customers within the shop
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `cust-${Date.now()}`,
      name: newCust.name,
      role: UserRole.CUSTOMER,
      mobile: newCust.mobile,
      shopId: shop.id,
      referralCode: `REF-${newCust.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`
    };
    setUsers(prev => [...prev, newUser]);
    setShowAddCustomer(false);
    setNewCust({ name: '', mobile: '' });
    alert(`Customer registered successfully! Referral Code: ${newUser.referralCode}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center justify-center overflow-hidden">
              {shop.logo ? (
                <img src={shop.logo} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-2xl transition-opacity">
              CHANGE LOGO
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none">{shop.shopName}</h1>
            <p className="text-gray-500 text-sm mt-1">Shop Dashboard • GST: {shop.gstNumber}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddCustomer(true)} className="bg-white text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50">+ Add Customer</button>
          <button onClick={() => setShowAddProduct(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700">+ List Product</button>
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
          <h3 className="font-bold text-purple-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Customer Leads
            {stats.pendingLeads > 0 && <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pendingLeads} New</span>}
          </h3>
        </div>
        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
          {leads.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">No leads submitted by customers yet.</p>
          ) : (
            leads.map(lead => {
              const product = products.find(p => p.id === lead.productId);
              const customer = users.find(u => u.id === lead.customerId);
              return (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">{customer?.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{lead.referralName}</p>
                      <p className="text-xs text-blue-600 font-semibold">{product?.brand} {product?.name}</p>
                      <p className="text-[10px] text-gray-500">{lead.referralMobile} • Referrer: {customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status === LeadStatus.PENDING ? (
                      <>
                        <button onClick={() => convertLeadToSale(lead)} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Mark as Sale</button>
                        <button onClick={() => setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.REJECTED } : l))} className="text-gray-400 hover:text-red-500 px-2 py-1.5 text-xs font-bold">Reject</button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${lead.status === LeadStatus.CONVERTED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{lead.status}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            My Customers ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Net Earnings</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No customers registered yet.</td></tr>
              ) : (
                users.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{customer.name}</p>
                      <p className="text-[10px] text-gray-400">ID: {customer.referralCode}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-green-600">₹{getCustomerCommission(customer.id).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-mono text-gray-500">{customer.mobile}</span>
                        {customer.mobile && <a href={`tel:${customer.mobile}`} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" /></svg></a>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', val: `₹${stats.totalVolume.toLocaleString()}`, color: 'text-gray-900' },
          { label: 'Cust. Commission (Net)', val: `₹${stats.totalCommissionOwed.toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Platform Owed (5-10%)', val: `₹${stats.totalAdminCommissionOwed.toFixed(2)}`, color: 'text-red-600' },
          { label: 'Total Referrals', val: stats.totalSales, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">My Products</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
            {products.length === 0 ? <div className="p-8 text-center text-gray-400">No products listed.</div> : products.map(p => (
              <div key={p.id} className="p-4 flex gap-4 hover:bg-gray-50 group">
                <div className="flex-shrink-0 flex gap-1">
                  {p.frontImage ? <img src={p.frontImage} className="w-12 h-16 object-cover rounded-md border" /> : <div className="w-12 h-16 bg-gray-100 rounded-md border flex items-center justify-center text-[8px] text-gray-400">No Front</div>}
                  {p.backImage ? <img src={p.backImage} className="w-12 h-16 object-cover rounded-md border" /> : <div className="w-12 h-16 bg-gray-100 rounded-md border flex items-center justify-center text-[8px] text-gray-400">No Back</div>}
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.brand} • ₹{p.price}</p>
                  <p className="text-sm font-bold text-blue-600">₹{p.customerCommission} Commission Pool</p>
                  <p className="text-[10px] text-gray-400">Platform Share: ₹{(p.customerCommission * shop.adminCommissionRate).toFixed(2)}</p>
                </div>
                <div className="flex flex-col justify-end opacity-0 group-hover:opacity-100">
                  <button onClick={() => setEditingProduct(p)} className="text-[10px] text-blue-500 font-bold uppercase">Edit</button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="text-[10px] text-red-400 font-bold uppercase">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Payout Requests</h3>
            <button onClick={requestAdminPayout} className="text-[10px] font-bold text-red-600 border border-red-100 px-2 py-1 rounded bg-red-50">Pay Admin</button>
          </div>
          <div className="p-4 space-y-4">
            {payouts.filter(p => p.status === TransactionStatus.PENDING).length === 0 ? <p className="text-center text-gray-400 py-8">No pending requests.</p> : payouts.filter(p => p.status === TransactionStatus.PENDING).map(req => (
              <div key={req.id} className={`p-4 rounded-xl border ${req.type === 'SHOP_TO_ADMIN_PAYOUT' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{req.type === 'CUSTOMER_PAYOUT' ? 'To Customer' : 'To Admin'}</p>
                    <p className="text-lg font-black text-gray-900">₹{req.amount.toLocaleString()}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">Pending</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="flex-grow bg-white border px-3 py-2 rounded-lg flex items-center justify-between overflow-hidden">
                    <span className="text-xs font-mono font-bold text-blue-600 truncate">{req.upiId}</span>
                    <button onClick={() => copyToClipboard(req.upiId)} className="p-1 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V7m0 0h-4.586a1 1 0 01-1-1V2.586" /></svg></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <input type="text" placeholder="Transaction ID / Ref No." value={transactionIds[req.id] || ''} onChange={(e) => setTransactionIds(prev => ({ ...prev, [req.id]: e.target.value }))} className="w-full px-3 py-2 text-xs border rounded-lg outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openUpiApp(req.upiId, req.amount, 'Recipient')} className="bg-blue-600 text-white py-2 rounded-xl text-[10px] font-bold">Pay via App</button>
                    <button onClick={() => handleMarkAsPaid(req.id)} className="bg-green-600 text-white py-2 rounded-xl text-[10px] font-bold">Confirm Payment</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Manual Referral Sale</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select id="sale-prod" className="px-4 py-2 bg-gray-50 border rounded-lg"><option value="">Product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}</select>
          <select id="sale-cust" className="px-4 py-2 bg-gray-50 border rounded-lg"><option value="">Referrer</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <button onClick={() => { const pid = (document.getElementById('sale-prod') as HTMLSelectElement).value; const cid = (document.getElementById('sale-cust') as HTMLSelectElement).value; if(pid && cid) handleManualSale(pid, cid); else alert('Select both'); }} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">Complete Sale</button>
        </div>
      </section>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input placeholder="Name" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price" className="px-4 py-3 bg-gray-50 border rounded-xl" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Total Commission Pool" className="px-4 py-3 bg-gray-50 border rounded-xl" required value={newProduct.commission || ''} onChange={e => setNewProduct({...newProduct, commission: parseFloat(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Front Photo</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {newProduct.frontImage ? <img src={newProduct.frontImage} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Upload</span>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'frontImage')} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Back Photo</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {newProduct.backImage ? <img src={newProduct.backImage} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Upload</span>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'backImage')} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500">Note: Platform takes {Math.round(shop.adminCommissionRate * 100)}% of the commission pool.</p>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">List Product</button>
              <button type="button" onClick={() => setShowAddProduct(false)} className="w-full py-2 text-gray-400">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Product</h3>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <input placeholder="Name" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price" className="px-4 py-3 bg-gray-50 border rounded-xl" required value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Total Commission Pool" className="px-4 py-3 bg-gray-50 border rounded-xl" required value={editingProduct.customerCommission || ''} onChange={e => setEditingProduct({...editingProduct, customerCommission: parseFloat(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Front Photo</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {editingProduct.frontImage ? <img src={editingProduct.frontImage} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Upload</span>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'frontImage', true)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Back Photo</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {editingProduct.backImage ? <img src={editingProduct.backImage} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Upload</span>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'backImage', true)} />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Update Product</button>
              <button type="button" onClick={() => setEditingProduct(null)} className="w-full py-2 text-gray-400">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Register Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input placeholder="Name" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" required value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input placeholder="Mobile" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" required value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Create ID</button>
              <button onClick={() => setShowAddCustomer(false)} className="w-full py-2 text-gray-400">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;