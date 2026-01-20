
import React, { useState } from 'react';
import { Shop, ReferralSale, PayoutRequest, TransactionStatus, AdminRequest, Complaint, ComplaintStatus, User, UserRole } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  const [requestModal, setRequestModal] = useState<{ isOpen: boolean; shopId: string }>({ isOpen: false, shopId: '' });
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
      title: newReq.title,
      message: newReq.message,
      status: 'UNREAD',
      timestamp: Date.now()
    };
    setAdminRequests(prev => [...prev, req]);
    setRequestModal({ isOpen: false, shopId: '' });
    setNewReq({ title: '', message: '' });
    alert('Industry request sent to shop owner.');
  };

  const handleTransferCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal.customer || !targetShopId) return;

    setUsers(prev => prev.map(u => u.id === transferModal.customer!.id ? { ...u, shopId: targetShopId } : u));
    alert(`Customer ${transferModal.customer.name} transferred successfully to another shop.`);
    setTransferModal({ isOpen: false, customer: null });
    setTargetShopId('');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    onResetPassword(resetModal.userId, newPassword);
    alert(`Password for ${resetModal.ownerName} has been reset.`);
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500">Managing {stats.totalShops} shops and {stats.totalCustomers} customers</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Shops', val: stats.activeShops, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Admin Earnings', val: `₹${stats.totalAdminCommission.toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Payouts', val: stats.pendingAdminPayouts, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Unresolved Complaints', val: stats.pendingComplaints, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-2xl border border-white shadow-sm`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-50 flex justify-between items-center bg-red-50/30">
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Customer Complaints
          </h3>
          <span className="text-xs font-bold text-red-600">{stats.pendingComplaints} Pending</span>
        </div>
        <div className="divide-y divide-gray-50">
          {complaints.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No complaints filed by customers.</p>
          ) : (
            complaints.map(complaint => {
              const shop = shops.find(s => s.id === complaint.shopId);
              const customer = users.find(u => u.id === complaint.customerId);
              return (
                <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1 inline-block ${
                        complaint.status === ComplaintStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        complaint.status === ComplaintStatus.RESOLVED ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {complaint.status}
                      </span>
                      <h4 className="font-bold text-gray-900 text-lg">{complaint.subject}</h4>
                      <p className="text-xs text-gray-500">
                        From: <span className="font-semibold text-gray-700">{customer?.name}</span> • 
                        Against Shop: <span className="font-semibold text-red-600">{shop?.shopName}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(complaint.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100 italic mt-3 mb-4">
                    "{complaint.message}"
                  </p>
                  <div className="flex gap-2">
                    {complaint.status === ComplaintStatus.PENDING && (
                      <>
                        <button onClick={() => handleComplaintStatus(complaint.id, ComplaintStatus.RESOLVED)} className="text-xs font-bold bg-green-600 text-white px-4 py-2 rounded-lg">Mark Resolved</button>
                        <button onClick={() => handleComplaintStatus(complaint.id, ComplaintStatus.DISMISSED)} className="text-xs font-bold bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">Dismiss</button>
                        <button onClick={() => setRequestModal({ isOpen: true, shopId: complaint.shopId })} className="text-xs font-bold text-blue-600 px-4 py-2">Send Warning</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Shops Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Shop Details</th>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4 text-center">Admin Share (%)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shops.map(shop => {
                const owner = users.find(u => u.id === shop.ownerId);
                return (
                  <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{shop.shopName}</p>
                      <p className="text-xs text-gray-500">Owner: {owner?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setDocModal({ isOpen: true, shop })} className="text-blue-600 p-1 bg-blue-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={Math.round(shop.adminCommissionRate * 100)}
                        onChange={(e) => updateCommission(shop.id, parseFloat(e.target.value))}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-semibold outline-none border border-blue-100"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                          <option key={v} value={v}>{v}%</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Of Commission</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${shop.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{shop.isApproved ? 'Active' : 'Blocked'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setResetModal({ isOpen: true, userId: shop.ownerId, ownerName: owner?.name || 'Owner' })} className="text-xs font-bold text-amber-600 hover:underline">Reset Pass</button>
                        <button onClick={() => setRequestModal({ isOpen: true, shopId: shop.id })} className="text-xs font-bold text-blue-600 hover:underline">Request</button>
                        <button onClick={() => toggleApproval(shop.id)} className={`text-xs font-bold ${shop.isApproved ? 'text-red-600' : 'text-green-600'}`}>{shop.isApproved ? 'Block' : 'Approve'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800">Customer Management</h3>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Associated Shop</th>
                <th className="px-6 py-4 text-center">Referral Code</th>
                <th className="px-6 py-4 text-right">Lifetime Earnings</th>
                <th className="px-6 py-4 text-right">Withdrawn</th>
                <th className="px-6 py-4 text-right">Current Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(customer => {
                  const shop = shops.find(s => s.id === customer.shopId);
                  const earnings = getCustomerEarnings(customer.id);
                  const withdrawals = getCustomerWithdrawals(customer.id);
                  const balance = earnings - withdrawals;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.mobile}</p>
                      </td>
                      <td className="px-6 py-4">
                        {shop ? (
                          <div>
                            <p className="text-sm font-semibold text-blue-600">{shop.shopName}</p>
                            <p className="text-[10px] text-gray-400">ID: {shop.id}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-red-400 font-bold uppercase">No Shop Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{customer.referralCode || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-700">₹{earnings.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-orange-600">₹{withdrawals.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-bold ${balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>₹{balance.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setTransferModal({ isOpen: true, customer })}
                          className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                          Transfer Shop
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transfer Shop Modal */}
      {transferModal.isOpen && transferModal.customer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Transfer Customer</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Moving <span className="text-blue-600 font-bold">{transferModal.customer.name}</span> to a new referral network.
            </p>
            <form onSubmit={handleTransferCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Select Target Shop</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={targetShopId}
                  onChange={(e) => setTargetShopId(e.target.value)}
                >
                  <option value="">Select a Shop</option>
                  {shops.filter(s => s.id !== transferModal.customer?.shopId).map(s => (
                    <option key={s.id} value={s.id}>{s.shopName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Confirm Transfer</button>
                <button type="button" onClick={() => { setTransferModal({ isOpen: false, customer: null }); setTargetShopId(''); }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-1">Reset Shop Owner Password</h3>
            <p className="text-sm text-gray-500 mb-4">Owner: <span className="font-bold text-gray-700">{resetModal.ownerName}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input 
                type="password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="New Password" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Save New Password</button>
                <button type="button" onClick={() => { setResetModal({ isOpen: false, userId: '', ownerName: '' }); setNewPassword(''); }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Docs Modal */}
      {docModal.isOpen && docModal.shop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Registration Documents</h3>
              <button onClick={() => setDocModal({ isOpen: false, shop: null })} className="p-2 bg-gray-100 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {['Shop Photo', 'Owner Selfie', 'GSTIN Certificate'].map((title, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-center font-bold text-xs text-gray-400 uppercase">{title}</p>
                  <div className="aspect-[4/5] rounded-3xl bg-gray-100 overflow-hidden border">
                    {docModal.shop?.[['shopPhoto', 'ownerSelfiePhoto', 'gstCertificatePhoto'][i] as keyof Shop] ? (
                      <img src={docModal.shop![['shopPhoto', 'ownerSelfiePhoto', 'gstCertificatePhoto'][i] as keyof Shop] as string} className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full text-gray-300">No Image</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              {!docModal.shop.isApproved && <button onClick={() => { toggleApproval(docModal.shop!.id); setDocModal({ isOpen: false, shop: null }); }} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold">Approve Registration</button>}
              <button onClick={() => setDocModal({ isOpen: false, shop: null })} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Industry Request Modal */}
      {requestModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Send Industry Request</h3>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <input className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none" placeholder="Subject" required value={newReq.title} onChange={e => setNewReq({ ...newReq, title: e.target.value })} />
              <textarea className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none min-h-[100px]" placeholder="Message..." required value={newReq.message} onChange={e => setNewReq({ ...newReq, message: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Send</button>
                <button type="button" onClick={() => setRequestModal({ isOpen: false, shopId: '' })} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
