
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
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [viewProof, setViewProof] = useState<PayoutRequest | null>(null);
  
  const [leadData, setLeadData] = useState({ name: '', mobile: '', productId: '' });
  const [complaintData, setComplaintData] = useState({ subject: 'Non-payment of Referral Commission', message: '' });

  const totalEarned = sales.reduce((acc, s) => acc + s.customerCommissionEarned, 0);
  const totalWithdrawn = payouts
    .filter(p => p.status === TransactionStatus.PAID)
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingWithdrawn = payouts
    .filter(p => p.status === TransactionStatus.PENDING)
    .reduce((acc, p) => acc + p.amount, 0);
  
  // Balance available to withdraw (not counting already pending requests)
  const currentBalance = totalEarned - totalWithdrawn - pendingWithdrawn;

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
    alert('Withdrawal request sent to shop owner! It will be processed soon.');
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
    alert('Lead sent to shop!');
  };

  const openQuickLead = (productId: string) => {
    setLeadData(prev => ({ ...prev, productId }));
    setShowLeadModal(true);
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
    <div className="space-y-8 pb-24">
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
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Available Balance</p>
            <h2 className="text-4xl font-bold mt-1">₹{currentBalance.toLocaleString()}</h2>
            {pendingWithdrawn > 0 && <p className="text-[10px] font-bold text-yellow-300 uppercase mt-1">₹{pendingWithdrawn.toLocaleString()} Pending</p>}
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-semibold">ID: {currentUser.referralCode}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Total Earned</p>
            <p className="text-lg font-bold">₹{totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Total Paid</p>
            <p className="text-lg font-bold">₹{totalWithdrawn.toLocaleString()}</p>
          </div>
        </div>
        {currentBalance >= 100 && (
          <form onSubmit={handleWithdrawalRequest} className="mt-6 flex flex-col gap-2">
            <input type="text" placeholder="Enter Your UPI ID" className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl text-white placeholder-blue-200 outline-none text-sm" required value={upiId} onChange={e => setUpiId(e.target.value)} />
            <button type="submit" className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform">Withdraw to UPI</button>
          </form>
        )}
      </header>

      {/* Product Catalog Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-none">Shop Catalog</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Exclusive Deals</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.length === 0 ? (
            <p className="col-span-full text-center text-gray-400 py-10 bg-white rounded-3xl border border-dashed">No products listed.</p>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="aspect-[4/3] bg-gray-50 rounded-2xl mb-4 overflow-hidden relative border border-gray-50">
                  {product.frontImage ? (
                    <img src={product.frontImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Ref Earn: ₹{product.customerCommission}</span>
                  </div>
                </div>
                
                <h4 className="font-black text-gray-900 text-lg leading-tight">{product.name}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{product.brand}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-50">
                    <p className="text-[8px] text-blue-500 font-bold uppercase">Cash Price</p>
                    <p className="text-sm font-black text-blue-900">₹{product.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-50">
                    <p className="text-[8px] text-indigo-500 font-bold uppercase">EMI Plan</p>
                    <p className="text-sm font-black text-indigo-900">₹{product.emiAmount?.toLocaleString()}/m</p>
                  </div>
                </div>

                <button 
                  onClick={() => openQuickLead(product.id)}
                  className="w-full mt-4 bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-colors"
                >
                  Refer A Buyer
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Referral Earnings</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
            {sales.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No earnings yet.</p> : sales.slice().reverse().map(sale => (
                <div key={sale.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">₹{sale.customerCommissionEarned.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">{new Date(sale.timestamp).toLocaleDateString()} • {sale.buyerName}</p>
                  </div>
                  <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-100 uppercase">Credited</div>
                </div>
              ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Withdrawals</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
            {payouts.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No withdrawals found.</p> : payouts.slice().reverse().map(payout => (
              <div key={payout.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">₹{payout.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{payout.upiId}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${payout.status === TransactionStatus.PAID ? 'bg-green-100 text-green-700' : payout.status === TransactionStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{payout.status}</span>
                  {payout.status === TransactionStatus.PAID && <button onClick={() => setViewProof(payout)} className="block mt-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tighter">View Proof</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Issue?</h3>
        <button onClick={() => setShowComplaintModal(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-red-200">Report to Admin</button>
      </section>

      {/* Referral Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Refer a Buyer</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input placeholder="Buyer Name" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" required value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
              <input placeholder="Buyer Mobile" className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" required value={leadData.mobile} onChange={e => setLeadData({...leadData, mobile: e.target.value})} />
              <select className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" required value={leadData.productId} onChange={e => setLeadData({...leadData, productId: e.target.value})}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl">Submit Referral</button>
              <button type="button" onClick={() => setShowLeadModal(false)} className="w-full text-gray-400 py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">File a Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <input className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" required value={complaintData.subject} onChange={e => setComplaintData({...complaintData, subject: e.target.value})} />
              <textarea placeholder="Details..." className="w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none min-h-[120px] font-medium" required value={complaintData.message} onChange={e => setComplaintData({...complaintData, message: e.target.value})} />
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-xl">Submit to Admin</button>
              <button type="button" onClick={() => setShowComplaintModal(false)} className="w-full text-gray-400 py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* View Proof Modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Payment Proof</h3>
            <div className="aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden border">
               <img src={viewProof.screenshotUrl} className="w-full h-full object-cover" alt="Payment Proof" />
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Transaction ID</p>
              <p className="text-lg font-black text-blue-900 font-mono break-all">{viewProof.transactionId || 'N/A'}</p>
            </div>
            <button onClick={() => setViewProof(null)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
