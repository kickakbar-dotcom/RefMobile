
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
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; customer: User | null }>({ isOpen: false, customer: null });
  const [resetModal, setResetModal] = useState<{ isOpen: boolean; userId: string; ownerName: string }>({ isOpen: false, userId: '', ownerName: '' });
  const [newReq, setNewReq] = useState({ title: '', message: '' });
  const [targetShopId, setTargetShopId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const stats = {
    totalShops: shops.length,
    activeShops: shops.filter(s => s.isApproved).length,
    totalRevenue: sales.reduce((acc, s) => acc + s.saleAmount, 0),
    totalAdminCommission: sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0),
    pendingAdminPayouts: payouts.filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PENDING).length,
    pendingComplaints: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
    totalCustomers: users.filter(u => u.role === UserRole.CUSTOMER).length
  };

  const getShopAdminIncome = (shopId: string) => {
    return sales
      .filter(s => s.shopId === shopId)
      .reduce((acc, s) => acc + s.adminCommissionEarned, 0);
  };

  const getShopPendingAdminPayout = (shopId: string) => {
    // Already paid admin commission from this shop
    const paid = payouts
      .filter(p => p.shopId === shopId && p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PAID)
      .reduce((acc, p) => acc + p.amount, 0);
    return getShopAdminIncome(shopId) - paid;
  };

  const toggleApproval = (id: string) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, isApproved: !s.isApproved } : s));
  };

  const updateCommission = (id: string, rate: number) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, adminCommissionRate: rate / 100 } : s));
  };

  const handleComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req: AdminRequest = {
      id: `req-${Date.now()}`,
      shopId: requestModal.shopId,
      title: requestModal.type === 'WITHDRAWAL' ? 'Admin Commission Withdrawal Request' : newReq.title,
      message: requestModal.type === 'WITHDRAWAL' 
        ? `Please pay the pending admin commission of ₹${getShopPendingAdminPayout(requestModal.shopId).toFixed(2)} to the master UPI ID. Upload screenshot once paid.` 
        : newReq.message,
      status: 'UNREAD',
      timestamp: Date.now()
    };
    setAdminRequests(prev => [...prev, req]);
    setRequestModal({ isOpen: false, shopId: '', type: 'GENERAL' });
    setNewReq({ title: '', message: '' });
    alert(requestModal.type === 'WITHDRAWAL' ? 'Withdrawal request sent to shop owner.' : 'Request sent to shop owner.');
  };

  const handleTransferCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal.customer || !targetShopId) return;

    setUsers(prev => prev.map(u => u.id === transferModal.customer!.id ? { ...u, shopId: targetShopId } : u));
    alert(`Customer ${transferModal.customer.name} transferred successfully.`);
    setTransferModal({ isOpen: false, customer: null });
    setTargetShopId('');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    onResetPassword(resetModal.userId, newPassword);
    alert(`Password for ${resetModal.ownerName} reset.`);
    setResetModal({ isOpen: false, userId: '', ownerName: '' });
    setNewPassword('');
  };

  const getCustomerEarnings = (customerId: string) => {
    return sales
      .filter(s => s.referrerId === customerId)
      .reduce((acc, s) => acc + s.customerCommissionEarned, 0);
  };

  const getCustomerWithdrawals = (customerId: string) => {
    return payouts
      .filter(p => p.userId === customerId && p.status === TransactionStatus.PAID)
      .reduce((acc, p) => acc + p.amount, 0);
  };

  const filteredCustomers = users.filter(u => 
    u.role === UserRole.CUSTOMER && 
    (u.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
     u.mobile?.includes(customerSearch) || 
     u.referralCode?.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-black text-gray-900 leading-none">Admin Control</h1>
        <p className="text-gray-500 text-sm mt-1">Managing network of {stats.totalShops} shops</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earnings', val: `₹${stats.totalAdminCommission.toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Shops', val: stats.activeShops, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Payout Requests', val: stats.pendingAdminPayouts, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Open Complaints', val: stats.pendingComplaints, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-2xl border border-white shadow-sm`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Shop Partners</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Shop & Owner</th>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4 text-center">Comm Rate</th>
                <th className="px-6 py-4 text-right">Total Admin Income</th>
                <th className="px-6 py-4 text-right">Unpaid Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shops.map(shop => {
                const owner = users.find(u => u.id === shop.ownerId);
                const totalIncome = getShopAdminIncome(shop.id);
                const unpaid = getShopPendingAdminPayout(shop.id);
                return (
                  <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm leading-tight">{shop.shopName}</p>
                      <p className="text-xs text-gray-500 font-medium">{owner?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setDocModal({ isOpen: true, shop })} className="text-blue-600 p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={Math.round(shop.adminCommissionRate * 100)}
                        onChange={(e) => updateCommission(shop.id, parseFloat(e.target.value))}
                        className="bg-gray-50 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold outline-none border"
                      >
                        {[1, 2, 3, 4, 5, 10].map(v => (
                          <option key={v} value={v}>{v}%</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <p className="text-sm font-black text-indigo-600">₹{totalIncome.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <p className={`text-sm font-black ${unpaid > 0 ? 'text-red-600' : 'text-gray-400'}`}>₹{unpaid.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${shop.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{shop.isApproved ? 'Active' : 'Blocked'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {unpaid > 0 && (
                           <button 
                             onClick={() => setRequestModal({ isOpen: true, shopId: shop.id, type: 'WITHDRAWAL' })}
                             className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 uppercase"
                           >
                             Withdrawal Request
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

      {/* Industry Request Modal (also used for Withdrawal) */}
      {requestModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">{requestModal.type === 'WITHDRAWAL' ? 'Confirm Withdrawal Request' : 'Send General Request'}</h3>
              <p className="text-xs text-gray-500 mt-1">{requestModal.type === 'WITHDRAWAL' ? 'This will notify the shop owner to pay the pending admin commission.' : 'Send a message to this shop owner.'}</p>
            </div>
            
            <form onSubmit={handleSendRequest} className="space-y-4">
              {requestModal.type === 'GENERAL' && (
                <>
                  <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" placeholder="Subject" required value={newReq.title} onChange={e => setNewReq({ ...newReq, title: e.target.value })} />
                  <textarea className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none min-h-[100px]" placeholder="Message..." required value={newReq.message} onChange={e => setNewReq({ ...newReq, message: e.target.value })} />
                </>
              )}
              {requestModal.type === 'WITHDRAWAL' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <p className="text-xs font-bold text-blue-800 uppercase">Withdrawal Amount</p>
                   <p className="text-2xl font-black text-blue-900">₹{getShopPendingAdminPayout(requestModal.shopId).toFixed(2)}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100">Confirm & Send</button>
                <button type="button" onClick={() => setRequestModal({ isOpen: false, shopId: '', type: 'GENERAL' })} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaints Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-50 flex justify-between items-center bg-red-50/30">
          <h3 className="text-lg font-black text-red-900 uppercase tracking-tighter flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Active Complaints
          </h3>
          <span className="text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded-full">{stats.pendingComplaints}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {complaints.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-sm italic">No complaints found.</p>
          ) : (
            complaints.map(complaint => {
              const shop = shops.find(s => s.id === complaint.shopId);
              const customer = users.find(u => u.id === complaint.customerId);
              return (
                <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg leading-tight">{complaint.subject}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        From <span className="text-gray-900 font-bold">{customer?.name}</span> against <span className="text-red-600 font-bold">{shop?.shopName}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      complaint.status === ComplaintStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border mt-3 italic">"{complaint.message}"</p>
                  <div className="flex gap-2 mt-4">
                    {complaint.status === ComplaintStatus.PENDING && (
                      <>
                        <button onClick={() => handleComplaintStatus(complaint.id, ComplaintStatus.RESOLVED)} className="text-xs font-black bg-green-600 text-white px-4 py-2 rounded-xl shadow-md">Mark Resolved</button>
                        <button onClick={() => setRequestModal({ isOpen: true, shopId: complaint.shopId, type: 'GENERAL' })} className="text-xs font-black bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md">Warn Shop</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Password Reset Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900">Reset Owner Password</h3>
            <p className="text-xs text-gray-500">Security reset for <span className="font-bold">{resetModal.ownerName}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                type="password"
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="New Password" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">Save Password</button>
                <button type="button" onClick={() => { setResetModal({ isOpen: false, userId: '', ownerName: '' }); setNewPassword(''); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {docModal.isOpen && docModal.shop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">Verification Documents</h3>
              <button onClick={() => setDocModal({ isOpen: false, shop: null })} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {[
                { title: 'Shop Front', key: 'shopPhoto' },
                { title: 'Owner ID/Selfie', key: 'ownerSelfiePhoto' },
                { title: 'GSTIN Certificate', key: 'gstCertificatePhoto' }
              ].map((doc, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-center font-black text-[10px] text-gray-400 uppercase tracking-widest">{doc.title}</p>
                  <div className="aspect-[4/5] rounded-3xl bg-gray-100 overflow-hidden border shadow-inner">
                    {docModal.shop?.[doc.key as keyof Shop] ? (
                      <img src={docModal.shop![doc.key as keyof Shop] as string} className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full text-gray-300 font-bold uppercase text-[10px]">No Document</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              {!docModal.shop.isApproved && (
                <button 
                  onClick={() => { toggleApproval(docModal.shop!.id); setDocModal({ isOpen: false, shop: null }); }} 
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-green-100"
                >
                  Approve Registration
                </button>
              )}
              <button onClick={() => setDocModal({ isOpen: false, shop: null })} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Close Viewer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
