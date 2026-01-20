
import React, { useState } from 'react';
import { User, Shop, Product, ReferralSale, PayoutRequest, TransactionStatus, UserRole, Lead, LeadStatus, Complaint, ComplaintStatus } from '../types';

interface CustomerDashboardProps {
  currentUser: User;
  shop?: Shop;
  products: Product[];
  sales: ReferralSale[];
  payouts: PayoutRequest[];
  setPayouts: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  users: User[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  complaints: Complaint[];
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  currentUser, shop, products, sales, payouts, setPayouts, setUsers, users, leads, setLeads, complaints, setComplaints
}) => {
  const [upiId, setUpiId] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [viewProof, setViewProof] = useState<PayoutRequest | null>(null);
  
  const [inviteData, setInviteData] = useState({ name: '', mobile: '' });
  const [leadData, setLeadData] = useState({ name: '', mobile: '', productId: '' });
  const [complaintData, setComplaintData] = useState({ subject: 'Non-payment of Referral Commission', message: '' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const totalEarned = sales.reduce((acc, s) => acc + s.customerCommissionEarned, 0);
  const totalWithdrawn = payouts
    .filter(p => p.status === TransactionStatus.PAID)
    .reduce((acc, p) => acc + p.amount, 0);
  const currentBalance = totalEarned - totalWithdrawn;

  const handleWithdrawalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBalance < 100) return alert('Minimum withdrawal amount is ₹100');
    if (!upiId.includes('@')) return alert('Please enter a valid UPI ID');

    const req: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: currentUser.id,
      shopId: currentUser.shopId!,
      amount: currentBalance,
      upiId: upiId,
      status: TransactionStatus.PENDING,
      timestamp: Date.now(),
      type: 'CUSTOMER_PAYOUT'
    };
    setPayouts(prev => [...prev, req]);
    setUpiId('');
    alert('Withdrawal request sent to shop owner!');
  };

  const handleSubReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `cust-${Date.now()}`,
      name: inviteData.name,
      role: UserRole.CUSTOMER,
      mobile: inviteData.mobile,
      shopId: currentUser.shopId,
      referredBy: currentUser.id,
      referralCode: `REF-${inviteData.name.substring(0,3).toUpperCase()}${Date.now().toString().slice(-4)}`
    };
    setUsers(all => [...all, newUser]);
    setShowInviteModal(false);
    setInviteData({ name: '', mobile: '' });
    alert('Friend added to referral network! They can now log in using their mobile.');
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.productId) return alert('Please select a product');
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      customerId: currentUser.id,
      shopId: currentUser.shopId!,
      productId: leadData.productId,
      referralName: leadData.name,
      referralMobile: leadData.mobile,
      status: LeadStatus.PENDING,
      timestamp: Date.now()
    };
    setLeads(prev => [...prev, newLead]);
    setShowLeadModal(false);
    setLeadData({ name: '', mobile: '', productId: '' });
    alert('Lead sent to shop! Commission will be added to your wallet immediately after sale.');
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      customerId: currentUser.id,
      shopId: currentUser.shopId!,
      subject: complaintData.subject,
      message: complaintData.message,
      status: ComplaintStatus.PENDING,
      timestamp: Date.now()
    };
    setComplaints(prev => [...prev, newComplaint]);
    setShowComplaintModal(false);
    setComplaintData({ subject: 'Non-payment of Referral Commission', message: '' });
    alert('Complaint submitted to Master Admin.');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="relative overflow-hidden bg-white border border-blue-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="absolute top-0 right-0 p-2"><span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-tighter">Verified Shop</span></div>
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600 shadow-inner overflow-hidden border border-blue-100">
           {shop?.logo ? (
             <img src={shop.logo} className="w-full h-full object-cover" alt="Shop Logo" />
           ) : (
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
           )}
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">{shop?.shopName || 'Mobile Shop'}</h1>
          <p className="text-xs text-gray-500 font-medium">{shop?.address || 'Partner Store'}</p>
        </div>
      </div>

      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Available Wallet Balance</p>
            <h2 className="text-4xl font-bold mt-1">₹{currentBalance.toLocaleString()}</h2>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-semibold">ID: {currentUser.referralCode}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Total Earned</p>
            <p className="text-lg font-bold">₹{totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Successful Referrals</p>
            <p className="text-lg font-bold">{sales.length}</p>
          </div>
        </div>
        {currentBalance >= 100 && (
          <form onSubmit={handleWithdrawalRequest} className="mt-6 flex flex-col gap-2">
            <input type="text" placeholder="Enter UPI ID" className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl text-white placeholder-blue-200 outline-none text-sm" required value={upiId} onChange={e => setUpiId(e.target.value)} />
            <button type="submit" className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">Request Withdrawal</button>
          </form>
        )}
      </header>

      {/* Referral History Section - NEW */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Referral Earnings
          </h3>
          <span className="text-[10px] font-bold text-blue-600 uppercase">Immediate Credit</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
          {sales.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No earnings yet. Start referring!</p> : sales.slice().reverse().map(sale => {
            const product = products.find(p => p.id === sale.productId);
            return (
              <div key={sale.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">₹{sale.customerCommissionEarned.toLocaleString()}</p>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">{product?.name || 'Mobile Purchase'}</p>
                  <p className="text-[10px] text-gray-400">{new Date(sale.timestamp).toLocaleDateString()} • {sale.buyerName}</p>
                </div>
                <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-100 uppercase">Credited</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Withdrawal History & Proofs */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Withdrawal Requests
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
          {payouts.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No withdrawals found.</p> : payouts.slice().reverse().map(payout => (
            <div key={payout.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">₹{payout.amount.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 uppercase">{payout.upiId}</p>
                <p className="text-[10px] text-gray-400">{new Date(payout.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${payout.status === TransactionStatus.PAID ? 'bg-green-100 text-green-700' : payout.status === TransactionStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{payout.status}</span>
                {payout.status === TransactionStatus.PAID && <button onClick={() => setViewProof(payout)} className="block mt-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tighter">View Proof</button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Proof Modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Payment Confirmation</h3>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-400 font-bold uppercase">Transaction Reference ID</p>
              <p className="text-lg font-black text-blue-900 font-mono break-all">{viewProof.transactionId || 'PROCESSED'}</p>
              <div className="mt-3 flex justify-between border-t border-blue-100 pt-3">
                 <p className="text-sm text-gray-500">Paid Amount</p>
                 <p className="text-xl font-bold text-gray-900">₹{viewProof.amount.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={() => setViewProof(null)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">Close</button>
          </div>
        </div>
      )}

      {/* Leads Management Section */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            My Leads
          </h3>
          <button onClick={() => setShowLeadModal(true)} className="text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-xl shadow-md">+ New Lead</button>
        </div>
        <div className="p-4 space-y-3">
          {leads.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">No leads submitted yet.</p> : leads.map(lead => {
            const product = products.find(p => p.id === lead.productId);
            return (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{lead.referralName}</p>
                  <p className="text-xs text-blue-600 font-semibold">{product?.name || 'Mobile Purchase'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${lead.status === LeadStatus.CONVERTED ? 'bg-green-100 text-green-700' : lead.status === LeadStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{lead.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Add New Lead</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input placeholder="Buyer Name" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none" required value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
              <input placeholder="Buyer Mobile" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none" required value={leadData.mobile} onChange={e => setLeadData({...leadData, mobile: e.target.value})} />
              <select className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none" required value={leadData.productId} onChange={e => setLeadData({...leadData, productId: e.target.value})}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-xl">Send Lead to Shop</button>
              <button type="button" onClick={() => setShowLeadModal(false)} className="w-full text-gray-400 py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Complaint Box</h3>
        <p className="text-sm text-gray-500 mb-4">Commission not credited? Report it to Master Admin.</p>
        <button onClick={() => setShowComplaintModal(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-red-200">Report Issue</button>
      </section>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">File a Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <input className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none" required value={complaintData.subject} onChange={e => setComplaintData({...complaintData, subject: e.target.value})} />
              <textarea placeholder="Details..." className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none min-h-[120px]" required value={complaintData.message} onChange={e => setComplaintData({...complaintData, message: e.target.value})} />
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-xl">Submit to Admin</button>
              <button type="button" onClick={() => setShowComplaintModal(false)} className="w-full text-gray-400 py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
