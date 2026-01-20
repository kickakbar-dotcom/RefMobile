
import React, { useState } from 'react';
import { User, Shop, Product, ReferralSale, PayoutRequest, TransactionStatus, UserRole } from '../types';

interface CustomerDashboardProps {
  currentUser: User;
  shop?: Shop;
  products: Product[];
  sales: ReferralSale[];
  payouts: PayoutRequest[];
  setPayouts: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  users: User[];
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  currentUser, shop, products, sales, payouts, setPayouts, setUsers, users 
}) => {
  const [upiId, setUpiId] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', mobile: '' });

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
    // In this app, existing customers can refer other customers AFTER a successful purchase
    // We'll simulate that they are "eligible" for this demo
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

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Available Balance</p>
            <h2 className="text-4xl font-bold mt-1">₹{currentBalance.toLocaleString()}</h2>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            ID: {currentUser.referralCode}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Total Earned</p>
            <p className="text-lg font-bold">₹{totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <p className="text-[10px] text-blue-100 uppercase">Referrals</p>
            <p className="text-lg font-bold">{sales.length}</p>
          </div>
        </div>
      </header>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          Share & Earn
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Refer buyers to <span className="font-bold text-gray-800">{shop?.shopName || 'Mobile Shop'}</span> and earn high commissions on every successful mobile purchase.
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            Invite a Friend
          </button>
          <button className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl font-bold text-sm border border-green-100 hover:bg-green-100 transition-colors">
            Share Link
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Request Payout</h3>
          <form onSubmit={handleWithdrawalRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Your UPI ID</label>
              <input 
                placeholder="name@upi / mobile@ybl"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={currentBalance < 100}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${currentBalance >= 100 ? 'bg-blue-600 text-white shadow-blue-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
            >
              Withdraw ₹{currentBalance}
            </button>
            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">Min. Withdrawal ₹100</p>
          </form>
        </section>

        {/* History */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Earnings History</h3>
          </div>
          <div className="flex-grow max-h-[300px] overflow-y-auto divide-y divide-gray-50">
            {sales.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No referrals yet. Start sharing!</div>
            ) : (
              sales.map(s => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Mobile Sale Referral</p>
                    <p className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-green-600">+₹{s.customerCommissionEarned}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Payout Verification Section */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Recent Payouts & Proof</h3>
        </div>
        <div className="p-4 space-y-4">
          {payouts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No payout requests yet.</p>
          ) : (
            payouts.map(p => (
              <div key={p.id} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.status === TransactionStatus.PAID ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {p.status === TransactionStatus.PAID ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">₹{p.amount}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-tighter">{p.status}</p>
                  </div>
                </div>
                {p.screenshotUrl && (
                  <button 
                    onClick={() => window.open(p.screenshotUrl, '_blank')}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl"
                  >
                    View Receipt
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Invite a Friend</h3>
              <button onClick={() => setShowInviteModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubReferral} className="space-y-4">
              <input 
                placeholder="Friend's Name" 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" 
                required 
                value={inviteData.name}
                onChange={e => setInviteData({...inviteData, name: e.target.value})}
              />
              <input 
                placeholder="Mobile Number" 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" 
                required 
                value={inviteData.mobile}
                onChange={e => setInviteData({...inviteData, mobile: e.target.value})}
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200">
                Register Friend to Network
              </button>
              <p className="text-center text-xs text-gray-400 px-4">
                Your friend will be assigned to your shop and you will earn bonus points for their successful referrals!
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
