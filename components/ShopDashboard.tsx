
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
  const [showPayoutProcessing, setShowPayoutProcessing] = useState<PayoutRequest | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [payoutData, setPayoutData] = useState({ transactionId: '', screenshot: '' });
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

  const pendingPayouts = payouts.filter(p => p.status === TransactionStatus.PENDING);

  const handleUpdateLeadStatus = (leadId: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    if (status === LeadStatus.CONVERTED) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setSaleData({
          customerId: lead.customerId,
          productId: lead.productId,
          buyerName: lead.referralName
        });
        setShowCompleteSale(true);
      }
    }
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('UPI ID Copied to clipboard!');
  };

  const handlePayoutComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayoutProcessing) return;
    if (!payoutData.screenshot || !payoutData.transactionId) return alert('Proof required.');

    setPayouts(prev => prev.map(p => p.id === showPayoutProcessing.id ? {
      ...p,
      status: TransactionStatus.PAID,
      screenshotUrl: payoutData.screenshot,
      transactionId: payoutData.transactionId
    } : p));

    setShowPayoutProcessing(null);
    setPayoutData({ transactionId: '', screenshot: '' });
    alert('Payout marked as COMPLETED. Money deducted from user wallet.');
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
  };

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === saleData.productId);
    const customer = users.find(u => u.id === saleData.customerId);
    if (!product || !customer) return;
    const totalComm = product.customerCommission;
    const adminShare = totalComm * shop.adminCommissionRate;
    const customerShare = totalComm - adminShare;
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

  return (
    <div className="space-y-6 pb-20">
      {pendingPayouts.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Pending UPI Withdrawals ({pendingPayouts.length})
          </h3>
          <div className="space-y-2">
            {pendingPayouts.map(p => {
              const recipient = p.type === 'SHOP_TO_ADMIN_PAYOUT' ? 'Master Admin' : (users.find(u => u.id === p.userId)?.name || 'Customer');
              return (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-xs font-black text-gray-900 leading-none">{recipient}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">₹{p.amount.toLocaleString()} • {p.upiId}</p>
                  </div>
                  <button 
                    onClick={() => setShowPayoutProcessing(p)}
                    className="bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm hover:bg-amber-700 uppercase"
                  >
                    Process Payout
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center justify-center overflow-hidden shadow-inner">
              {shop.logo ? <img src={shop.logo} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            </div>
            <label className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-2xl transition-opacity font-black">
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
          <button onClick={() => setShowCompleteSale(true)} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-green-100">✓ Record Sale</button>
        </div>
      </header>

      {/* Leads / Referrals Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Customer Referrals (Leads)
          </h3>
          <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase">{leads.length} Inbound</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {leads.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs italic uppercase font-bold tracking-widest">No referrals yet</div>
          ) : (
            leads.slice().reverse().map(lead => {
              const customer = users.find(u => u.id === lead.customerId);
              const product = products.find(p => p.id === lead.productId);
              return (
                <div key={lead.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                      {lead.referralName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight">Buyer: {lead.referralName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Ref by: <span className="text-indigo-600">{customer?.name}</span> • Mob: {lead.referralMobile}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">Model: {product?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {lead.status === LeadStatus.PENDING ? (
                      <>
                        <button 
                          onClick={() => handleUpdateLeadStatus(lead.id, LeadStatus.CONVERTED)}
                          className="flex-1 sm:flex-none bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-sm hover:bg-green-700"
                        >
                          Mark Converted
                        </button>
                        <button 
                          onClick={() => handleUpdateLeadStatus(lead.id, LeadStatus.REJECTED)}
                          className="flex-1 sm:flex-none bg-white text-red-500 border border-red-100 text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-sm hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${
                        lead.status === LeadStatus.CONVERTED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {lead.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Inventory</h3>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-black uppercase">{products.length} Models</span>
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
            {products.length === 0 ? <div className="p-12 text-center text-gray-400 text-xs">No models listed.</div> : products.map(p => (
              <div key={p.id} className="p-4 flex gap-4 hover:bg-gray-50 group transition-colors">
                <div className="flex-shrink-0">
                  {p.frontImage ? <img src={p.frontImage} className="w-12 h-16 object-cover rounded-xl border border-gray-100" /> : <div className="w-12 h-16 bg-gray-50 rounded-xl border border-dashed flex items-center justify-center text-[8px] text-gray-300">No Image</div>}
                </div>
                <div className="flex-grow py-1">
                  <p className="font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.brand} • ₹{p.price.toLocaleString()}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">EMI: ₹{p.emiAmount}/m</span>
                    <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tighter">Pool: ₹{p.customerCommission}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingProduct(p)} className="text-[10px] font-black text-blue-500 uppercase">Edit</button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="text-[10px] font-black text-red-400 uppercase">Del</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Referral Network</h3>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">{users.length} Active</span>
            </div>
            <input 
              type="text" 
              placeholder="Find member..." 
              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
            {users.filter(u => u.name.toLowerCase().includes(customerSearch.toLowerCase())).map(user => {
              const salesCount = sales.filter(s => s.referrerId === user.id).length;
              const earnings = sales.filter(s => s.referrerId === user.id).reduce((acc, s) => acc + s.customerCommissionEarned, 0);
              return (
                <div key={user.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-400 text-sm border border-indigo-100 uppercase">{user.name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-gray-900 text-sm leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.mobile} • <span className="text-blue-500">{user.referralCode}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-green-600 leading-none">₹{earnings.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mt-1">{salesCount} Sales</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Detail</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.slice().reverse().map(payout => (
                <tr key={payout.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-[10px] text-gray-500 font-bold">{new Date(payout.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-gray-900 uppercase">{payout.type === 'SHOP_TO_ADMIN_PAYOUT' ? 'Admin Commission' : 'Member Payout'}</p>
                    <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{payout.upiId}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-gray-900">₹{payout.amount.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${payout.status === TransactionStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payout Processing Modal */}
      {showPayoutProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Execute Payout</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Recipient UPI ID</p>
                  <p className="text-lg font-black text-blue-900 font-mono break-all">{showPayoutProcessing.upiId}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(showPayoutProcessing.upiId)}
                  className="bg-blue-600 text-white p-2 rounded-xl shadow-md hover:bg-blue-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payout Amount</p>
                <p className="text-2xl font-black text-gray-900">₹{showPayoutProcessing.amount.toLocaleString()}</p>
              </div>

              <form onSubmit={handlePayoutComplete} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Payment Ref / Transaction ID</label>
                  <input className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold" placeholder="Paste TXN ID here" required value={payoutData.transactionId} onChange={e => setPayoutData({...payoutData, transactionId: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Payment Screenshot Proof</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl aspect-[16/9] flex items-center justify-center overflow-hidden bg-gray-50">
                    {payoutData.screenshot ? <img src={payoutData.screenshot} className="w-full h-full object-cover" /> : <p className="text-xs text-gray-400 font-bold uppercase">Upload Receipt</p>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required onChange={handlePayoutScreenshot} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-100 uppercase tracking-widest">Confirm & Complete</button>
                <button type="button" onClick={() => setShowPayoutProcessing(null)} className="w-full text-gray-400 font-bold py-2 uppercase text-xs tracking-widest">Cancel</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {showCompleteSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-5 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Record A Sale</h3>
            <form onSubmit={handleCompleteSale} className="space-y-4">
              <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none" required value={saleData.productId} onChange={e => setSaleData({...saleData, productId: e.target.value})}>
                <option value="">Choose Model</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
              </select>
              <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none" required value={saleData.customerId} onChange={e => setSaleData({...saleData, customerId: e.target.value})}>
                <option value="">Referrer / Member</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.referralCode})</option>)}
              </select>
              <input placeholder="Customer/Buyer Full Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none" required value={saleData.buyerName} onChange={e => setSaleData({...saleData, buyerName: e.target.value})} />
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">Confirm Sale</button>
              <button type="button" onClick={() => setShowCompleteSale(false)} className="w-full text-gray-400 font-bold py-2">Close</button>
            </form>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">List Model</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border rounded-2xl font-bold outline-none" 
                    value={newProduct.brand} 
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                  >
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Model Name</label>
                  <input placeholder="e.g. iPhone 15" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl font-bold outline-none" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Full Cash Price</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl font-bold outline-none" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Commission Pool</label>
                  <input type="number" placeholder="₹" className="w-full px-4 py-3 bg-gray-50 border rounded-2xl font-bold outline-none" required value={newProduct.commission || ''} onChange={e => setNewProduct({...newProduct, commission: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">EMI Setup</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="DownPay" className="px-3 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newProduct.downPayment || ''} onChange={e => setNewProduct({...newProduct, downPayment: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Monthly" className="px-3 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newProduct.emiAmount || ''} onChange={e => setNewProduct({...newProduct, emiAmount: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Months" className="px-3 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newProduct.emiMonths || ''} onChange={e => setNewProduct({...newProduct, emiMonths: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl h-24 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {newProduct.frontImage ? <img src={newProduct.frontImage} className="w-full h-full object-cover" /> : <p className="text-[10px] text-gray-400 font-bold uppercase">Front Photo</p>}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'frontImage')} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">Publish Model</button>
              <button type="button" onClick={() => setShowAddProduct(false)} className="w-full py-2 text-gray-400 font-bold uppercase text-[10px]">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6 text-center">Register To Network</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input placeholder="Full Name" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold outline-none" required value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input type="tel" placeholder="10 Digit Mobile" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold outline-none" required value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">Add Member</button>
              <button type="button" onClick={() => setShowAddCustomer(false)} className="w-full py-2 text-gray-400 font-bold uppercase text-[10px]">Back</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
