// src/components/admin/CouponManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: '',
    endDate: '',
    maxUses: 0,
    assignedUsers: []
  });
  const [searchUser, setSearchUser] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [couponsRes, usersRes] = await Promise.all([
          axios.get('/api/coupons', { headers }),
          axios.get('/api/users', { headers })
        ]);

        setCoupons(couponsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleUserSearch = () => {
    if (!searchUser) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchUser.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.some(selectedUser => selectedUser._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setNewCoupon(prev => ({
        ...prev,
        assignedUsers: [...prev.assignedUsers, user._id]
      }));
    }
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
    setNewCoupon(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.filter(id => id !== userId)
    }));
  };

  const handleCreateCoupon = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/coupons', newCoupon, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCoupons([...coupons, response.data]);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
        maxUses: 0,
        assignedUsers: []
      });
      setSelectedUsers([]);
      setSearchUser('');
      setFilteredUsers([]);
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(error.response?.data?.error || 'Failed to create coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Create New Coupon</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Coupon Code</label>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
              className="w-full border p-2 rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Discount Type</label>
            <select
              value={newCoupon.discountType}
              onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
              className="w-full border p-2 rounded"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Discount Value</label>
            <input
              type="number"
              placeholder="Enter discount value"
              value={newCoupon.discountValue}
              onChange={(e) => setNewCoupon({...newCoupon, discountValue: Number(e.target.value)})}
              className="w-full border p-2 rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Max Uses</label>
            <input
              type="number"
              placeholder="Maximum coupon uses"
              value={newCoupon.maxUses}
              onChange={(e) => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
              className="w-full border p-2 rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={newCoupon.startDate}
              onChange={(e) => setNewCoupon({...newCoupon, startDate: e.target.value})}
              className="w-full border p-2 rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={newCoupon.endDate}
              onChange={(e) => setNewCoupon({...newCoupon, endDate: e.target.value})}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 mb-2">Assign to Specific Users</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="Search users by email"
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                handleUserSearch();
              }}
              className="flex-grow border p-2 rounded"
            />
            <button 
              onClick={handleUserSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Search
            </button>
          </div>

          {filteredUsers.length > 0 && (
            <div className="border rounded p-2 mt-2 max-h-40 overflow-y-auto">
              {filteredUsers.map(user => (
                <div 
                  key={user._id} 
                  onClick={() => handleSelectUser(user)}
                  className="cursor-pointer hover:bg-gray-100 p-2"
                >
                  {user.email}
                </div>
              ))}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="mt-2">
              <label className="block text-gray-700 mb-2">Selected Users</label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div 
                    key={user._id} 
                    className="bg-blue-100 px-2 py-1 rounded flex items-center"
                  >
                    {user.email}
                    <button 
                      onClick={() => removeSelectedUser(user._id)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button 
            onClick={handleCreateCoupon}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Create Coupon
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Existing Coupons</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Code</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Value</th>
              <th className="border p-2">Start Date</th>
              <th className="border p-2">End Date</th>
              <th className="border p-2">Max Uses</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon._id} className="text-center hover:bg-gray-50">
                <td className="border p-2">{coupon.code}</td>
                <td className="border p-2">{coupon.discountType}</td>
                <td className="border p-2">{coupon.discountValue}</td>
                <td className="border p-2">{new Date(coupon.startDate).toLocaleDateString()}</td>
                <td className="border p-2">{new Date(coupon.endDate).toLocaleDateString()}</td>
                <td className="border p-2">{coupon.maxUses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponManagement;