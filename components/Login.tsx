
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (identifier: string, role: UserRole, password?: string) => void;
  onRegisterShop: (data: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegisterShop }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regData, setRegData] = useState({
    ownerName: '',
    shopName: '',
    mobile: '',
    address: '',
    gstNumber: '',
    gstCertificatePhoto: '',
    shopPhoto: '',
    ownerSelfiePhoto: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, role, role === UserRole.ADMIN ? password : undefined);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.gstCertificatePhoto || !regData.shopPhoto || !regData.ownerSelfiePhoto) {
      alert("Please upload all required documents (GSTIN, Shop Photo, and Selfie)");
      return;
    }
    onRegisterShop(regData);
    setActiveTab('login');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 mb-12">
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 'login' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 'register' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Register Shop
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select 
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  setIdentifier('');
                  setPassword('');
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.SHOP_OWNER}>Shop Owner</option>
                <option value={UserRole.ADMIN}>Master Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === UserRole.ADMIN ? 'Admin Code' : 'Mobile Number'}
              </label>
              <input 
                type={role === UserRole.ADMIN ? 'text' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === UserRole.ADMIN ? 'Enter Admin Code' : 'Enter 10-digit number'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                required
              />
            </div>

            {role === UserRole.ADMIN && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
            >
              Sign In
            </button>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-100">
              <p className="font-bold mb-1 uppercase tracking-wider">Demo Access:</p>
              <ul className="space-y-1">
                <li>Admin Code: kickakbar@gmail.com / Akbar@7576</li>
                <li>Shop: 8888888888</li>
                <li>Customer: 7777777777</li>
              </ul>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Shop Registration</h2>
            
            <input 
              placeholder="Owner Full Name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setRegData({...regData, ownerName: e.target.value})}
              required
            />
            <input 
              placeholder="Shop Name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setRegData({...regData, shopName: e.target.value})}
              required
            />
            <input 
              placeholder="Mobile Number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setRegData({...regData, mobile: e.target.value})}
              required
            />
            <input 
              placeholder="Address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setRegData({...regData, address: e.target.value})}
              required
            />
            <input 
              placeholder="GST Number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={e => setRegData({...regData, gstNumber: e.target.value})}
              required
            />

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">GSTIN Certificate Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'gstCertificatePhoto')}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Shop Front Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'shopPhoto')}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Owner Selfie Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'ownerSelfiePhoto')}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 mt-4"
            >
              Submit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
