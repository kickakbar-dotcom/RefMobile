
import React, { useState } from 'react';
import { Shop, ReferralSale, PayoutRequest, TransactionStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdminDashboardProps {
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  sales: ReferralSale[];
  payouts: PayoutRequest[];
  setPayouts: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ shops, setShops, sales, payouts, setPayouts }) => {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const stats = {
    totalShops: shops.length,
    activeShops: shops.filter(s => s.isApproved).length,
    totalRevenue: sales.reduce((acc, s) => acc + s.saleAmount, 0),
    totalAdminCommission: sales.reduce((acc, s) => acc + s.adminCommissionEarned, 0),
    pendingAdminPayouts: payouts.filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT' && p.status === TransactionStatus.PENDING).length
  };

  const toggleApproval = (id: string) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, isApproved: !s.isApproved } : s));
  };

  const updateCommission = (id: string, rate: number) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, adminCommissionRate: rate / 100 } : s));
  };

  const handlePayoutStatus = (id: string, status: TransactionStatus) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  // Mock data for chart
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500">Managing {stats.totalShops} shops across the platform</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Shops', val: stats.activeShops, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Admin Earnings', val: `₹${stats.totalAdminCommission.toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Sales', val: `₹${(stats.totalRevenue/1000).toFixed(1)}k`, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending Payouts', val: stats.pendingAdminPayouts, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-4 rounded-2xl border border-white shadow-sm`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Growth</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shop Management */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Shops Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Shop Details</th>
                <th className="px-6 py-4 text-center">Commission</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shops.map(shop => (
                <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{shop.shopName}</p>
                    <p className="text-sm text-gray-500">{shop.gstNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <select 
                        value={shop.adminCommissionRate * 100}
                        onChange={(e) => updateCommission(shop.id, parseFloat(e.target.value))}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-semibold outline-none"
                      >
                        <option value="1">1%</option>
                        <option value="1.5">1.5%</option>
                        <option value="2">2%</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${shop.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {shop.isApproved ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleApproval(shop.id)}
                      className={`text-sm font-semibold ${shop.isApproved ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {shop.isApproved ? 'Block' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Payout Requests */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Admin Commission Requests</h3>
        </div>
        <div className="p-6 space-y-4">
          {payouts.filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT').length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending commission requests from shops.</p>
          ) : (
            payouts.filter(p => p.type === 'SHOP_TO_ADMIN_PAYOUT').map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Request from Shop ID: {req.shopId}</p>
                  <p className="text-lg font-bold text-gray-900">₹{req.amount}</p>
                </div>
                <div className="flex gap-2">
                  {req.status === TransactionStatus.PENDING ? (
                    <>
                      <button 
                        onClick={() => handlePayoutStatus(req.id, TransactionStatus.PAID)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
                      >
                        Confirm Receipt
                      </button>
                    </>
                  ) : (
                    <span className="text-green-600 font-bold uppercase text-xs tracking-widest">{req.status}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
