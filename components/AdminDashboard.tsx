
import React, { useState } from 'react';
import { Shop, ReferralSale, PayoutRequest, TransactionStatus, AdminRequest, Complaint, ComplaintStatus, User, UserRole } from '../types';

interface AdminDashboardProps {
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  sales: ReferralSale[];
  payouts: PayoutRequest[];
  setPayouts: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  adminRequests: AdminRequest[];
  setAdminRequests: React.Dispatch<React.SetStateAction<AdminRequest[]>>;
  complaints: Complaint[];
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onResetPassword: (userId: string, newPass: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  shops, setShops, sales, payouts, setPayouts, adminRequests, setAdminRequests, complaints, setComplaints, users, setUsers, onResetPassword
}) => {
  const [requestModal, setRequestModal] = useState<{ isOpen: boolean; shopId: string; type: 'GENERAL' | 'WITHDRAWAL' }>({ isOpen: false, shopId: '', type: 'GENERAL' });
  const [docModal, setDocModal] = useState<{ isOpen: boolean; shop: Shop | null }>({ isOpen: false, shop: null });
  const [resetModal, setResetModal] = useState<{ isOpen: boolean; userId: string; ownerName: string }>({ isOpen: false, userId: '', ownerName: '' });
  const [newReq, setNewReq] = useState({ title: '', message: '' });
  const [adminUpi, setAdminUpi] = useState('admin.master@upi');
  const [newPassword, setNewPassword] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const stats = {
    totalShops: shops.length,
    activeShops: shops.filter(s => s.isApproved).length,
    totalRevenue: sales.reduce((acc, s) => acc + s.saleAmount, 0),
    totalAdminCommission: sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0),
    totalWithdrawn: payouts.filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PAID).reduce((acc, p) => acc + p.amount, 0),
    pendingComplaints: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
    totalCustomers: users.filter(u => u.role === UserRole.CUSTOMER).length
  };

  const getShopAdminIncome = (shopId: string) => {
    return sales
      .filter(s => s.shopId === shopId)
      .reduce((acc, s) => acc + s.adminCommissionEarned, 0);
  };

  const getShopPendingAdminPayout = (shopId: string) => {
    const paid = payouts
      .filter(p => p.shopId === shopId && p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PAID)
      .reduce((acc, p) => acc + p.amount, 0);
    const pending = payouts
      .filter(p => p.shopId === shopId && p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PENDING)
      .reduce((acc, p) => acc + p.amount, 0);
    return getShopAdminIncome(shopId) - paid - pending;
  };

  const toggleApproval = (id: string) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, isApproved: !s.isApproved } : s));
  };

  const updateCommission = (id: string, rate: number) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, adminCommissionRate: rate / 100 } : s));
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestModal.type === 'WITHDRAWAL') {
      const amount = getShopPendingAdminPayout(requestModal.shopId);
      if (amount <= 0) return alert('No pending balance.');
      if (!adminUpi.includes('@')) return alert('Please enter a valid UPI ID.');
      
      const payout: PayoutRequest = {
        id: `payout-${Date.now()}`,
        userId: 'admin-master',
        shopId: requestModal.shopId,
        amount: amount,
        upiId: adminUpi,
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        type: 'SHOP_TO_ADMIN_PAYOUT'
      };
      setPayouts(prev => [...prev, payout]);
      alert('Withdrawal request initiated! Shop owner will see this in their pending payouts.');
    } else {
      const req: AdminRequest = {
        id: `req-${Date.now()}`,
        shopId: requestModal.shopId,
        title: newReq.title,
        message: newReq.message,
        status: 'UNREAD',
        timestamp: Date.now()
      };
      setAdminRequests(prev => [...prev, req]);
    }
    setRequestModal({ isOpen: false, shopId: '', type: 'GENERAL' });
    setNewReq({ title: '', message: '' });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    onResetPassword(resetModal.userId, newPassword);
    alert(`Password reset successful.`);
    setResetModal({ isOpen: false, userId: '', ownerName: '' });
    setNewPassword('');
  };

  const callCustomer = (mobile?: string) => {
    if (mobile) {
      window.location.href = `tel:${mobile}`;
    } else {
      alert("Mobile number not available");
    }
  };

  const filteredCustomers = users.filter(u => 
    u.role === UserRole.CUSTOMER && 
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
     u.mobile?.includes(userSearch) || 
     u.referralCode?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const customerPayouts = payouts.filter(p => p.type === 'CUSTOMER_PAYOUT');

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Master Admin</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">Network Management Console</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Activity / Global Directory */}
        <aside className="lg:w-1/3 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Network Activity</h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">Recent</span>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {customerPayouts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs italic uppercase font-bold tracking-widest">No activity recorded</div>
              ) : (
                customerPayouts.slice().reverse().map(payout => {
                  const customer = users.find(u => u.id === payout.userId);
                  const shop = shops.find(s => s.id === payout.shopId);
                  const statusColors = {
                    [TransactionStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
                    [TransactionStatus.PAID]: 'bg-green-100 text-green-700 border-green-200',
                    [TransactionStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
                  };

                  return (
                    <div key={payout.id} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors shadow-sm group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                            {customer?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-none">{customer?.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Via {shop?.shopName}</p>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[payout.status]}`}>
                          {payout.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Amount</p>
                          <p className="text-sm font-black text-indigo-600">₹{payout.amount.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => callCustomer(customer?.mobile)}
                          className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-[9px] font-black uppercase px-1">Call</span>
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                         <p className="text-[8px] font-mono text-gray-400">{payout.upiId}</p>
                         <p className="text-[8px] text-gray-300 font-bold">{new Date(payout.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Master Stats</h3>
             <div className="grid grid-cols-2 gap-3">
               <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase">Customers</p>
                 <p className="text-xl font-black text-indigo-600">{stats.totalCustomers}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase">Revenue</p>
                 <p className="text-xl font-black text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
               </div>
             </div>
          </div>
        </aside>

        {/* Right Side: Tabbed Management Panels */}
        <main className="lg:w-2/3 space-y-8">
          {/* Shop Management Table */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Partner Shops</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Shop</th>
                    <th className="px-6 py-4 text-center">Docs</th>
                    <th className="px-6 py-4 text-center">Comm%</th>
                    <th className="px-6 py-4 text-right">Income</th>
                    <th className="px-6 py-4 text-right">Unpaid</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shops.map(shop => {
                    const owner = users.find(u => u.id === shop.ownerId);
                    const unpaid = getShopPendingAdminPayout(shop.id);
                    return (
                      <tr key={shop.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 text-sm leading-tight">{shop.shopName}</p>
                          <p className="text-xs text-gray-500 font-medium">{owner?.name}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setDocModal({ isOpen: true, shop })} className="text-blue-600 p-2 bg-blue-50 rounded-xl">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select 
                            value={Math.round(shop.adminCommissionRate * 100)}
                            onChange={(e) => updateCommission(shop.id, parseFloat(e.target.value))}
                            className="bg-gray-50 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold outline-none border"
                          >
                            {[1, 2, 3, 5, 10].map(v => <option key={v} value={v}>{v}%</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <p className="text-sm font-black text-indigo-600">₹{getShopAdminIncome(shop.id).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <p className={`text-sm font-black ${unpaid > 0 ? 'text-red-600' : 'text-gray-400'}`}>₹{unpaid.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {unpaid > 0 && (
                               <button 
                                 onClick={() => setRequestModal({ isOpen: true, shopId: shop.id, type: 'WITHDRAWAL' })}
                                 className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-lg uppercase shadow-sm"
                               >
                                 Withdraw
                               </button>
                            )}
                            <button onClick={() => setResetModal({ isOpen: true, userId: shop.ownerId, ownerName: owner?.name || 'Owner' })} className="text-[10px] font-bold text-amber-600 uppercase">Reset</button>
                            <button onClick={() => toggleApproval(shop.id)} className={`text-[10px] font-black uppercase ${shop.isApproved ? 'text-red-500' : 'text-green-500'}`}>{shop.isApproved ? 'Block' : 'Approve'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Customer Management Directory */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Customer Directory</h3>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase">{stats.totalCustomers} Members</span>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by name, mobile or referral code..." 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Customer Details</th>
                    <th className="px-6 py-4">Shop Link</th>
                    <th className="px-6 py-4 text-right">Referral Stats</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm italic">No customers found matching search.</td></tr>
                  ) : (
                    filteredCustomers.map(customer => {
                      const shop = shops.find(s => s.id === customer.shopId);
                      const customerSales = sales.filter(s => s.referrerId === customer.id);
                      const earnings = customerSales.reduce((acc, s) => acc + s.customerCommissionEarned, 0);
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm leading-tight">{customer.name}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{customer.mobile}</p>
                                <p className="text-[10px] text-indigo-500 font-black tracking-widest uppercase mt-0.5">ID: {customer.referralCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-gray-700">{shop?.shopName || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black">{shop?.gstNumber || 'Direct Network'}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <p className="text-sm font-black text-green-600">₹{earnings.toLocaleString()}</p>
                             <p className="text-[10px] text-gray-400 font-black uppercase">{customerSales.length} Sales</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-3">
                               <button 
                                 onClick={() => callCustomer(customer.mobile)}
                                 className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                               >
                                 Call
                               </button>
                               <button 
                                 onClick={() => setResetModal({ isOpen: true, userId: customer.id, ownerName: customer.name })}
                                 className="text-[10px] font-black text-amber-600 uppercase hover:underline"
                               >
                                 Reset Pass
                               </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Request Modal */}
      {requestModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{requestModal.type === 'WITHDRAWAL' ? 'Confirm Payout Request' : 'Send Request'}</h3>
            <form onSubmit={handleSendRequest} className="space-y-4">
              {requestModal.type === 'GENERAL' ? (
                <>
                  <input className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" placeholder="Subject" required value={newReq.title} onChange={e => setNewReq({ ...newReq, title: e.target.value })} />
                  <textarea className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-medium min-h-[100px]" placeholder="Message..." required value={newReq.message} onChange={e => setNewReq({ ...newReq, message: e.target.value })} />
                </>
              ) : (
                <>
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Requesting</p>
                    <p className="text-4xl font-black text-indigo-600">₹{getShopPendingAdminPayout(requestModal.shopId).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-indigo-400 mt-2 uppercase">From {shops.find(s => s.id === requestModal.shopId)?.shopName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Your Admin UPI ID</label>
                    <input 
                      className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" 
                      placeholder="e.g. admin@upi" 
                      required 
                      value={adminUpi} 
                      onChange={e => setAdminUpi(e.target.value)} 
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Send Request</button>
                <button type="button" onClick={() => setRequestModal({ isOpen: false, shopId: '', type: 'GENERAL' })} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 uppercase">Reset Account Password</h3>
            <p className="text-xs text-gray-500 font-bold uppercase">Target: {resetModal.ownerName}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                type="password"
                className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold shadow-inner" 
                placeholder="Enter New Password" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">Save New Password</button>
                <button type="button" onClick={() => { setResetModal({ isOpen: false, userId: '', ownerName: '' }); setNewPassword(''); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {docModal.isOpen && docModal.shop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{docModal.shop.shopName} Verification</h3>
              <button onClick={() => setDocModal({ isOpen: false, shop: null })} className="p-2 bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'GSTIN Certificate', key: 'gstCertificatePhoto' },
                { title: 'Shop Front Image', key: 'shopPhoto' },
                { title: 'Owner Identity Selfie', key: 'ownerSelfiePhoto' }
              ].map((doc, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-center font-black text-[10px] text-gray-400 uppercase tracking-widest">{doc.title}</p>
                  <div className="aspect-[4/5] rounded-3xl bg-gray-100 overflow-hidden border shadow-inner">
                    {docModal.shop?.[doc.key as keyof Shop] ? (
                      <img src={docModal.shop![doc.key as keyof Shop] as string} className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full text-gray-300 font-bold uppercase text-[10px]">Document Missing</div>}
                  </div>
                </div>
              ))}
            </div>
            {!docModal.shop.isApproved && (
              <button 
                onClick={() => { toggleApproval(docModal.shop!.id); setDocModal({ isOpen: false, shop: null }); }}
                className="w-full mt-8 bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100"
              >
                Approve Shop Registration
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
