// src/pages/profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { User, MapPin, CreditCard, Bell, Package, Tag, Lock, Settings, LogOut, Loader2, Save, Eye, EyeOff, Plus, Trash2} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    currentPassword: '',
    newPassword: '',
    addresses: [], 
    defaultAddress: '',
    preferences: {
      newsletter: false,
      marketingEmails: false,
      orderUpdates: true,
      promotionalAlerts: false
    }
  });

  const [loginActivity, setLoginActivity] = useState([]);
const [showAllActivity, setShowAllActivity] = useState(false);
const [loadingActivity, setLoadingActivity] = useState(false);

useEffect(() => {
  const fetchLoginActivity = async () => {
    if (activeTab === 'security') {
      try {
        setLoadingActivity(true);
        const response = await fetch('/api/users/login-activity', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setLoginActivity(data);
      } catch (error) {
        console.error('Error fetching login activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    }
  };

  fetchLoginActivity();
}, [activeTab]);

  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        addresses: user.addresses || [], 
        defaultAddress: user.defaultAddress || '',
        preferences: user.preferences || prevState.preferences
      }));
    }
    
    // Fetch orders if on orders tab
    if (activeTab === 'orders') {
      fetchOrders();
    }

    // Fetch coupons if on coupons tab
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/users/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to fetch orders' });
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/users/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to fetch coupons' });
    }
  };

  const CopyButton = ({ code }) => {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <button 
        onClick={handleCopy}
        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    );
  };
  
  const handleAddAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, { street: '', city: '', state: '', postalCode: '', country: 'Canada' }]
    }));
  };
  
  const handleRemoveAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };
  
  const handleAddressChange = (index, field, value) => {
    setFormData(prev => {
      const updatedAddresses = [...prev.addresses];
      updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
      return { ...prev, addresses: updatedAddresses };
    });
  };
  
  const handleSetDefaultAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      defaultAddress: prev.addresses[index]._id
    }));
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/users/profile', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          logout();
          navigate('/');
        } else {
          setMessage({ type: 'error', content: 'Failed to delete account' });
        }
      } catch (error) {
        setMessage({ type: 'error', content: 'An error occurred while deleting account' });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {


        setMessage({ type: 'success', content: 'Profile updated successfully!' });
        localStorage.setItem('user', JSON.stringify(data.user));

           // Wait a short moment to show the success message
      setTimeout(() => {
        // Reload the page
        window.location.reload();
      }, 100);

      } else {
        setMessage({ type: 'error', content: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'coupons', label: 'My Coupons', icon: Tag },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company (Optional)</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

        case 'address':
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Manage Addresses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(formData.addresses || []).map((address, index) => (
                  <div key={index} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700">
                      Address {index + 1}</h4>
                    <div className="mt-4 space-y-2">
                      <AddressAutocomplete
                        index={index}
                        address={address}
                        onAddressChange={handleAddressChange}
                      />
                      
                      <label className="block text-sm font-medium text-gray-600">City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <label className="block text-sm font-medium text-gray-600">State/Province</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <label className="block text-sm font-medium text-gray-600">Postal Code</label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <label className="block text-sm font-medium text-gray-600">Country</label>
                      <select
                        value={address.country}
                        onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Canada">Canada</option>
                        <option value="United States">United States</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(index)}
                        className={`text-blue-600 hover:underline ${formData.defaultAddress === address._id ? 'font-bold' : ''}`}
                      >
                        {formData.defaultAddress === address._id ? 'Default' : 'Set as Default'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddAddress}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add New Address
              </button>
            </div>
          );     

      case 'orders':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Order History</h2>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                          {/* <a href={`/orders/${order._id}`}>View Details</a> */}
                          <a href={`/orders`}>View Details</a>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No orders found.</p>
            )}
          </div>
        );

        case 'coupons':
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">My Coupons</h2>
              {coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Tag className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-medium text-blue-600">{coupon.code}</h3>
                          </div>
                          <p className="text-2xl font-bold">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}% OFF`
                              : `$${coupon.discountValue} OFF`}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              Minimum purchase: ${coupon.minimumPurchase || 0}
                            </p>
                            {coupon.maxUsesPerUser > 0 && (
                              <p className="text-sm text-gray-600">
                                Max Uses: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          new Date(coupon.endDate) > new Date() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {new Date(coupon.endDate) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Valid until: {new Date(coupon.endDate).toLocaleDateString()}
                          </div>
                          {/* <button 
                            onClick={() => navigator.clipboard.writeText(coupon.code)}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Copy Code
                          </button> */}
                          <CopyButton code={coupon.code} />

                        </div>
                        {coupon.conditions && (
                          <p className="mt-2 text-sm text-gray-500">
                            Conditions: {coupon.conditions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Coupons Available</h3>
                  <p className="mt-2 text-gray-500">Check back later for new offers and discounts.</p>
                </div>
              )}
            </div>
          );
                   
      case 'payments':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            <div className="space-y-4">
              {/* Sample saved payment methods */}
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                <Plus className="h-5 w-5" />
                <span>Add New Payment Method</span>
              </button>
            </div>
          </div>
        );

        case 'security':
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <div className="space-y-6">
                {/* Password Change Section */}
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
        
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
        
                {/* Login Activity Section */}
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Login Activity</h3>
                  <div className="space-y-4">
                    {loadingActivity ? (
                      <div className="flex justify-center">
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    ) : (
                      <>
                        {loginActivity.slice(0, showAllActivity ? undefined : 1).map((activity, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">Login from {activity.location || 'Unknown Location'}</p>
                              <p className="text-sm text-gray-500">
                                {activity.device ? activity.device.split('(')[0] : 'Unknown Device'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAllActivity(!showAllActivity);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {showAllActivity ? 'Show Less' : 'View all activity'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
        
                {/* Account Deletion Section */}
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount()}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          );
        
        // And here's the notification case:
        case 'notifications':
          const handlePreferenceChange = async (e) => {
            e.preventDefault();
            const { name, checked } = e.target;
            const [section, field] = name.split('.');
            
            try {
              const response = await fetch('/api/users/preferences', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  preferences: {
                    ...formData.preferences,
                    [field]: checked
                  }
                })
              });
        
              if (response.ok) {
                setFormData(prev => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    [field]: checked
                  }
                }));
                setMessage({ type: 'success', content: 'Preferences updated successfully!' });
              } else {
                setMessage({ type: 'error', content: 'Failed to update preferences' });
              }
            } catch (error) {
              console.error('Error updating preferences:', error);
              setMessage({ type: 'error', content: 'Error updating preferences' });
            }
          };
        
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <h3 className="font-medium">Order Updates</h3>
                    <p className="text-sm text-gray-500">Receive notifications about your order status</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferences.orderUpdates"
                      checked={formData.preferences.orderUpdates}
                      onChange={handlePreferenceChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
        
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <h3 className="font-medium">Promotional Emails</h3>
                    <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferences.promotionalAlerts"
                      checked={formData.preferences.promotionalAlerts}
                      onChange={handlePreferenceChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
        
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <h3 className="font-medium">Newsletter</h3>
                    <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferences.newsletter"
                      checked={formData.preferences.newsletter}
                      onChange={handlePreferenceChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          );

      case 'preferences':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Language</label>
                    <select
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Zone</label>
                    <select
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      defaultValue="EST"
                    >
                      <option value="EST">Eastern Time (ET)</option>
                      <option value="CST">Central Time (CT)</option>
                      <option value="MST">Mountain Time (MT)</option>
                      <option value="PST">Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profile Visibility</p>
                      <p className="text-sm text-gray-500">Control who can see your profile</p>
                    </div>
                    <select
                      className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      defaultValue="private"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth <= 768) {
                    window.scrollBy({ top: 300, behavior: 'smooth' });
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {message.content && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                <AlertDescription>{message.content}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {renderTabContent()}

              {/* Save Button - only show for editable sections */}
              {['personal', 'address', 'notifications', 'security', 'preferences'].includes(activeTab) && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;




// // working without notificarion & security implementation
// // src/pages/profile.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from '../components/ui/alert';
// import AddressAutocomplete from '../components/AddressAutocomplete';
// import { User, MapPin, CreditCard, Bell, Package, Tag, Lock, Settings, LogOut, Loader2, Save, Eye, EyeOff, Plus, Trash2} from 'lucide-react';

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', content: '' });
//   const [orders, setOrders] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     company: '',
//     currentPassword: '',
//     newPassword: '',
//     addresses: [], 
//     defaultAddress: '',
//     preferences: {
//       newsletter: false,
//       marketingEmails: false,
//       orderUpdates: true,
//       promotionalAlerts: false
//     }
//   });

//   useEffect(() => {
//     if (user) {
//       setFormData(prevState => ({
//         ...prevState,
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         company: user.company || '',
//         addresses: user.addresses || [], 
//         defaultAddress: user.defaultAddress || '',
//         preferences: user.preferences || prevState.preferences
//       }));
//     }
    
//     // Fetch orders if on orders tab
//     if (activeTab === 'orders') {
//       fetchOrders();
//     }

//     // Fetch coupons if on coupons tab
//     if (activeTab === 'coupons') {
//       fetchCoupons();
//     }
//   }, [user, activeTab]);

//   const fetchOrders = async () => {
//     try {
//       const response = await fetch('/api/users/orders', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setOrders(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch orders' });
//     }
//   };

//   const fetchCoupons = async () => {
//     try {
//       const response = await fetch('/api/users/coupons', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setCoupons(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch coupons' });
//     }
//   };

//   const CopyButton = ({ code }) => {
//     const [copied, setCopied] = useState(false);
  
//     const handleCopy = (e) => {
//       e.preventDefault();
//       navigator.clipboard.writeText(code);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     };
  
//     return (
//       <button 
//         onClick={handleCopy}
//         className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
//       >
//         {copied ? 'Copied!' : 'Copy Code'}
//       </button>
//     );
//   };
  
//   const handleAddAddress = () => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: [...prev.addresses, { street: '', city: '', state: '', postalCode: '', country: 'Canada' }]
//     }));
//   };
  
//   const handleRemoveAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: prev.addresses.filter((_, i) => i !== index)
//     }));
//   };
  
//   const handleAddressChange = (index, field, value) => {
//     setFormData(prev => {
//       const updatedAddresses = [...prev.addresses];
//       updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
//       return { ...prev, addresses: updatedAddresses };
//     });
//   };
  
//   const handleSetDefaultAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       defaultAddress: prev.addresses[index]._id
//     }));
//   };

//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       try {
//         const response = await fetch('/api/users/profile', {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });

//         if (response.ok) {
//           logout();
//           navigate('/');
//         } else {
//           setMessage({ type: 'error', content: 'Failed to delete account' });
//         }
//       } catch (error) {
//         setMessage({ type: 'error', content: 'An error occurred while deleting account' });
//       }
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [section, field] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [section]: {
//           ...prev[section],
//           [field]: type === 'checkbox' ? checked : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', content: '' });

//     try {
//       const response = await fetch('/api/users/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify(formData)
//       });

//       const data = await response.json();

//       if (response.ok) {


//         setMessage({ type: 'success', content: 'Profile updated successfully!' });
//         localStorage.setItem('user', JSON.stringify(data.user));

//            // Wait a short moment to show the success message
//       setTimeout(() => {
//         // Reload the page
//         window.location.reload();
//       }, 100);

//       } else {
//         setMessage({ type: 'error', content: data.error || 'Failed to update profile' });
//       }
//     } catch (error) {
//       setMessage({ type: 'error', content: 'An error occurred while updating profile' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const tabs = [
//     { id: 'personal', label: 'Personal Info', icon: User },
//     { id: 'address', label: 'Address', icon: MapPin },
//     { id: 'orders', label: 'Orders', icon: Package },
//     { id: 'payments', label: 'Payment Methods', icon: CreditCard },
//     { id: 'coupons', label: 'My Coupons', icon: Tag },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'security', label: 'Security', icon: Lock },
//     { id: 'preferences', label: 'Preferences', icon: Settings }
//   ];

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">First Name</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Last Name</label>
//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Company (Optional)</label>
//                 <input
//                   type="text"
//                   name="company"
//                   value={formData.company}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         );

//         case 'address':
//           return (
//             <div className="space-y-6">
//               <h3 className="text-2xl font-semibold">Manage Addresses</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {(formData.addresses || []).map((address, index) => (
//                   <div key={index} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
//                     <h4 className="text-lg font-semibold text-gray-700">
//                       Address {index + 1}</h4>
//                     <div className="mt-4 space-y-2">
//                       <AddressAutocomplete
//                         index={index}
//                         address={address}
//                         onAddressChange={handleAddressChange}
//                       />
                      
//                       <label className="block text-sm font-medium text-gray-600">City</label>
//                       <input
//                         type="text"
//                         value={address.city}
//                         onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
//                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                       />
                      
//                       <label className="block text-sm font-medium text-gray-600">State/Province</label>
//                       <input
//                         type="text"
//                         value={address.state}
//                         onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
//                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                       />
                      
//                       <label className="block text-sm font-medium text-gray-600">Postal Code</label>
//                       <input
//                         type="text"
//                         value={address.postalCode}
//                         onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)}
//                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                       />
                      
//                       <label className="block text-sm font-medium text-gray-600">Country</label>
//                       <select
//                         value={address.country}
//                         onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
//                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                       >
//                         <option value="Canada">Canada</option>
//                         <option value="United States">United States</option>
//                       </select>
//                     </div>
                    
//                     <div className="flex justify-between mt-4">
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveAddress(index)}
//                         className="text-red-600 hover:text-red-800"
//                       >
//                         Remove
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => handleSetDefaultAddress(index)}
//                         className={`text-blue-600 hover:underline ${formData.defaultAddress === address._id ? 'font-bold' : ''}`}
//                       >
//                         {formData.defaultAddress === address._id ? 'Default' : 'Set as Default'}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <button
//                 type="button"
//                 onClick={handleAddAddress}
//                 className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//               >
//                 Add New Address
//               </button>
//             </div>
//           );     

//       case 'orders':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Order History</h2>
//             {orders.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {orders.map((order) => (
//                       <tr key={order._id}>
//                         <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {new Date(order.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           ${order.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                             ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
//                               order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
//                               order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                               'bg-blue-100 text-blue-800'}`}>
//                             {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
//                           {/* <a href={`/orders/${order._id}`}>View Details</a> */}
//                           <a href={`/orders`}>View Details</a>
//                           </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-gray-500">No orders found.</p>
//             )}
//           </div>
//         );

//         case 'coupons':
//           return (
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold mb-4">My Coupons</h2>
//               {coupons.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {coupons.map((coupon) => (
//                     <div key={coupon._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-2">
//                           <div className="flex items-center space-x-2">
//                             <Tag className="h-5 w-5 text-blue-600" />
//                             <h3 className="text-lg font-medium text-blue-600">{coupon.code}</h3>
//                           </div>
//                           <p className="text-2xl font-bold">
//                             {coupon.discountType === 'percentage' 
//                               ? `${coupon.discountValue}% OFF`
//                               : `$${coupon.discountValue} OFF`}
//                           </p>
//                           <div className="space-y-1">
//                             <p className="text-sm text-gray-600">
//                               Minimum purchase: ${coupon.minimumPurchase || 0}
//                             </p>
//                             {coupon.maxUsesPerUser > 0 && (
//                               <p className="text-sm text-gray-600">
//                                 Uses remaining: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                           new Date(coupon.endDate) > new Date() 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {new Date(coupon.endDate) > new Date() ? 'Active' : 'Expired'}
//                         </span>
//                       </div>
//                       <div className="mt-4 pt-4 border-t">
//                         <div className="flex justify-between items-center">
//                           <div className="text-sm text-gray-500">
//                             Valid until: {new Date(coupon.endDate).toLocaleDateString()}
//                           </div>
//                           {/* <button 
//                             onClick={() => navigator.clipboard.writeText(coupon.code)}
//                             className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
//                           >
//                             Copy Code
//                           </button> */}
//                           <CopyButton code={coupon.code} />

//                         </div>
//                         {coupon.conditions && (
//                           <p className="mt-2 text-sm text-gray-500">
//                             Conditions: {coupon.conditions}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg">
//                   <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900">No Coupons Available</h3>
//                   <p className="mt-2 text-gray-500">Check back later for new offers and discounts.</p>
//                 </div>
//               )}
//             </div>
//           );
                   
//       case 'payments':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
//             <div className="space-y-4">
//               {/* Sample saved payment methods */}
//               <div className="border rounded-lg p-4 bg-white">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <CreditCard className="h-6 w-6 text-gray-500" />
//                     <div>
//                       <p className="font-medium">•••• •••• •••• 4242</p>
//                       <p className="text-sm text-gray-500">Expires 12/25</p>
//                     </div>
//                   </div>
//                   <button className="text-red-600 hover:text-red-800">
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>

//               <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
//                 <Plus className="h-5 w-5" />
//                 <span>Add New Payment Method</span>
//               </button>
//             </div>
//           </div>
//         );

//       // case 'notifications':
//       //   return (
//       //     <div className="space-y-4">
//       //       <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//       //       <div className="space-y-4">
//       //         <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//       //           <div>
//       //             <h3 className="font-medium">Order Updates</h3>
//       //             <p className="text-sm text-gray-500">Receive notifications about your order status</p>
//       //           </div>
//       //           <label className="relative inline-flex items-center cursor-pointer">
//       //             <input
//       //               type="checkbox"
//       //               name="preferences.orderUpdates"
//       //               checked={formData.preferences.orderUpdates}
//       //               onChange={handleInputChange}
//       //               className="sr-only peer"
//       //             />
//       //             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//       //           </label>
//       //         </div>

//       //         <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//       //           <div>
//       //             <h3 className="font-medium">Promotional Emails</h3>
//       //             <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
//       //           </div>
//       //           <label className="relative inline-flex items-center cursor-pointer">
//       //             <input
//       //               type="checkbox"
//       //               name="preferences.promotionalAlerts"
//       //               checked={formData.preferences.promotionalAlerts}
//       //               onChange={handleInputChange}
//       //               className="sr-only peer"
//       //             />
//       //             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//       //           </label>
//       //         </div>

//       //         <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//       //           <div>
//       //             <h3 className="font-medium">Newsletter</h3>
//       //             <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
//       //           </div>
//       //           <label className="relative inline-flex items-center cursor-pointer">
//       //             <input
//       //               type="checkbox"
//       //               name="preferences.newsletter"
//       //               checked={formData.preferences.newsletter}
//       //               onChange={handleInputChange}
//       //               className="sr-only peer"
//       //             />
//       //             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//       //           </label>
//       //         </div>
//       //       </div>
//       //     </div>
//       //   );
//       case 'notifications':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Order Updates</h3>
//                   <p className="text-sm text-gray-500">Receive notifications about your order status</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.orderUpdates"
//                     checked={formData.preferences.orderUpdates}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Promotional Emails</h3>
//                   <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.promotionalAlerts"
//                     checked={formData.preferences.promotionalAlerts}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Newsletter</h3>
//                   <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.newsletter"
//                     checked={formData.preferences.newsletter}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>
//             </div>
//           </div>
//         );

//       // case 'security':
//       //   return (
//       //     <div className="space-y-4">
//       //       <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
//       //       <div className="space-y-6">
//       //         <div className="bg-white p-6 rounded-lg">
//       //           <h3 className="text-lg font-medium mb-4">Change Password</h3>
//       //           <div className="space-y-4">
//       //             <div className="relative">
//       //               <label className="block text-sm font-medium mb-1">Current Password</label>
//       //               <div className="relative">
//       //                 <input
//       //                   type={showCurrentPassword ? "text" : "password"}
//       //                   name="currentPassword"
//       //                   value={formData.currentPassword}
//       //                   onChange={handleInputChange}
//       //                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//       //                 />
//       //                 <button
//       //                   type="button"
//       //                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//       //                   className="absolute right-2 top-1/2 -translate-y-1/2"
//       //                 >
//       //                   {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//       //                 </button>
//       //               </div>
//       //             </div>

//       //             <div className="relative">
//       //               <label className="block text-sm font-medium mb-1">New Password</label>
//       //               <div className="relative">
//       //                 <input
//       //                   type={showNewPassword ? "text" : "password"}
//       //                   name="newPassword"
//       //                   value={formData.newPassword}
//       //                   onChange={handleInputChange}
//       //                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//       //                 />
//       //                 <button
//       //                   type="button"
//       //                   onClick={() => setShowNewPassword(!showNewPassword)}
//       //                   className="absolute right-2 top-1/2 -translate-y-1/2"
//       //                 >
//       //                   {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//       //                 </button>
//       //               </div>
//       //             </div>
//       //           </div>
//       //         </div>

//       //         <div className="bg-white p-6 rounded-lg">
//       //           <h3 className="text-lg font-medium mb-4">Login Activity</h3>
//       //           <div className="space-y-4">
//       //             <div className="flex justify-between items-center">
//       //               <div>
//       //                 <p className="font-medium">Last Login</p>
//       //                 <p className="text-sm text-gray-500">Toronto, Canada</p>
//       //               </div>
//       //               <p className="text-sm text-gray-500">2 hours ago</p>
//       //             </div>
//       //             <button className="text-blue-600 hover:text-blue-800 text-sm">
//       //               View all activity
//       //             </button>
//       //           </div>
//       //         </div>

//       //         <div className="bg-white p-6 rounded-lg">
//       //           <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
//       //           <p className="text-sm text-gray-500 mb-4">
//       //             Once you delete your account, there is no going back. Please be certain.
//       //           </p>
//       //           <button
//       //             onClick={() => handleDeleteAccount()}
//       //             className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//       //           >
//       //             Delete Account
//       //           </button>
//       //         </div>
//       //       </div>
//       //     </div>
//       //   );
//       case 'security':
//   const [loginActivity, setLoginActivity] = useState([]);
//   const [showAllActivity, setShowAllActivity] = useState(false);
//   const [loadingActivity, setLoadingActivity] = useState(false);

//   useEffect(() => {
//     const fetchLoginActivity = async () => {
//       try {
//         setLoadingActivity(true);
//         const response = await fetch('/api/users/login-activity', {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });
//         const data = await response.json();
//         setLoginActivity(data);
//       } catch (error) {
//         console.error('Error fetching login activity:', error);
//       } finally {
//         setLoadingActivity(false);
//       }
//     };

//     fetchLoginActivity();
//   }, []);

//   return (
//     <div className="space-y-4">
//       <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
//       <div className="space-y-6">
//         {/* Password Change Section */}
//         <div className="bg-white p-6 rounded-lg">
//           <h3 className="text-lg font-medium mb-4">Change Password</h3>
//           <div className="space-y-4">
//             <div className="relative">
//               <label className="block text-sm font-medium mb-1">Current Password</label>
//               <div className="relative">
//                 <input
//                   type={showCurrentPassword ? "text" : "password"}
//                   name="currentPassword"
//                   value={formData.currentPassword}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                   className="absolute right-2 top-1/2 -translate-y-1/2"
//                 >
//                   {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             <div className="relative">
//               <label className="block text-sm font-medium mb-1">New Password</label>
//               <div className="relative">
//                 <input
//                   type={showNewPassword ? "text" : "password"}
//                   name="newPassword"
//                   value={formData.newPassword}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowNewPassword(!showNewPassword)}
//                   className="absolute right-2 top-1/2 -translate-y-1/2"
//                 >
//                   {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Login Activity Section */}
//         <div className="bg-white p-6 rounded-lg">
//           <h3 className="text-lg font-medium mb-4">Login Activity</h3>
//           <div className="space-y-4">
//             {loadingActivity ? (
//               <div className="flex justify-center">
//                 <Loader2 className="animate-spin" size={24} />
//               </div>
//             ) : (
//               <>
//                 {loginActivity.slice(0, showAllActivity ? undefined : 1).map((activity, index) => (
//                   <div key={index} className="flex justify-between items-center border-b pb-2">
//                     <div>
//                       <p className="font-medium">Login from {activity.location || 'Unknown Location'}</p>
//                       <p className="text-sm text-gray-500">
//                         {activity.device ? activity.device.split('(')[0] : 'Unknown Device'}
//                       </p>
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {new Date(activity.timestamp).toLocaleString()}
//                     </p>
//                   </div>
//                 ))}
//                 <button
//                   type="button"
//                   onClick={() => setShowAllActivity(!showAllActivity)}
//                   className="text-blue-600 hover:text-blue-800 text-sm"
//                 >
//                   {showAllActivity ? 'Show Less' : 'View all activity'}
//                 </button>
//               </>
//             )}
//           </div>
//         </div>

//         {/* Account Deletion Section */}
//         <div className="bg-white p-6 rounded-lg">
//           <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
//           <p className="text-sm text-gray-500 mb-4">
//             Once you delete your account, there is no going back. Please be certain.
//           </p>
//           <button
//             type="button"
//             onClick={() => handleDeleteAccount()}
//             className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//           >
//             Delete Account
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//       case 'preferences':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
//             <div className="space-y-4">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Language & Region</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Language</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="en"
//                     >
//                       <option value="en">English</option>
//                       <option value="fr">Français</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Time Zone</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="EST"
//                     >
//                       <option value="EST">Eastern Time (ET)</option>
//                       <option value="CST">Central Time (CT)</option>
//                       <option value="MST">Mountain Time (MT)</option>
//                       <option value="PST">Pacific Time (PT)</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium">Profile Visibility</p>
//                       <p className="text-sm text-gray-500">Control who can see your profile</p>
//                     </div>
//                     <select
//                       className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="private"
//                     >
//                       <option value="public">Public</option>
//                       <option value="private">Private</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="flex flex-col md:flex-row gap-8">
//         {/* Sidebar */}
//         <div className="w-full md:w-64 space-y-1">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
//                   activeTab === tab.id
//                     ? 'bg-blue-50 text-blue-600'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span>{tab.label}</span>
//               </button>
//             );
//           })}
          
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Log Out</span>
//           </button>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1">
//           <div className="bg-white rounded-lg p-6 shadow-sm">
//             {message.content && (
//               <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
//                 <AlertDescription>{message.content}</AlertDescription>
//               </Alert>
//             )}

//             <form onSubmit={handleSubmit}>
//               {renderTabContent()}

//               {/* Save Button - only show for editable sections */}
//               {['personal', 'address', 'notifications', 'security', 'preferences'].includes(activeTab) && (
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="animate-spin mr-2" size={20} />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="mr-2" size={20} />
//                         Save Changes
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;







// workin with multiple address without google map api
// // src/pages/profile.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from '../components/ui/alert';
// import { 
//   User, 
//   MapPin, 
//   CreditCard, 
//   Bell, 
//   Package, 
//   Tag, 
//   Lock,
//   Settings,
//   LogOut,
//   Loader2,
//   Save,
//   Eye,
//   EyeOff, Plus, Trash2
// } from 'lucide-react';

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', content: '' });
//   const [orders, setOrders] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     company: '',
//     currentPassword: '',
//     newPassword: '',
//     addresses: [], 
//     defaultAddress: '',
//     preferences: {
//       newsletter: false,
//       marketingEmails: false,
//       orderUpdates: true,
//       promotionalAlerts: false
//     }
//   });

//   useEffect(() => {
//     if (user) {
//       setFormData(prevState => ({
//         ...prevState,
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         company: user.company || '',
//         addresses: user.addresses || [], 
//         defaultAddress: user.defaultAddress || '',
//         preferences: user.preferences || prevState.preferences
//       }));
//     }
    
//     // Fetch orders if on orders tab
//     if (activeTab === 'orders') {
//       fetchOrders();
//     }

//     // Fetch coupons if on coupons tab
//     if (activeTab === 'coupons') {
//       fetchCoupons();
//     }
//   }, [user, activeTab]);

//   const fetchOrders = async () => {
//     try {
//       const response = await fetch('/api/users/orders', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setOrders(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch orders' });
//     }
//   };

//   const fetchCoupons = async () => {
//     try {
//       const response = await fetch('/api/users/coupons', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setCoupons(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch coupons' });
//     }
//   };


//   const handleAddAddress = () => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: [...prev.addresses, { street: '', city: '', state: '', postalCode: '', country: 'Canada' }]
//     }));
//   };
  
//   const handleRemoveAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: prev.addresses.filter((_, i) => i !== index)
//     }));
//   };
  
//   const handleAddressChange = (index, field, value) => {
//     setFormData(prev => {
//       const updatedAddresses = [...prev.addresses];
//       updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
//       return { ...prev, addresses: updatedAddresses };
//     });
//   };
  
//   const handleSetDefaultAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       defaultAddress: prev.addresses[index]._id
//     }));
//   };

//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       try {
//         const response = await fetch('/api/users/profile', {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });

//         if (response.ok) {
//           logout();
//           navigate('/');
//         } else {
//           setMessage({ type: 'error', content: 'Failed to delete account' });
//         }
//       } catch (error) {
//         setMessage({ type: 'error', content: 'An error occurred while deleting account' });
//       }
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [section, field] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [section]: {
//           ...prev[section],
//           [field]: type === 'checkbox' ? checked : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', content: '' });

//     try {
//       const response = await fetch('/api/users/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify(formData)
//       });

//       const data = await response.json();

//       if (response.ok) {


//         setMessage({ type: 'success', content: 'Profile updated successfully!' });
//         localStorage.setItem('user', JSON.stringify(data.user));

//            // Wait a short moment to show the success message
//       setTimeout(() => {
//         // Reload the page
//         window.location.reload();
//       }, 500);

//       } else {
//         setMessage({ type: 'error', content: data.error || 'Failed to update profile' });
//       }
//     } catch (error) {
//       setMessage({ type: 'error', content: 'An error occurred while updating profile' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const tabs = [
//     { id: 'personal', label: 'Personal Info', icon: User },
//     { id: 'address', label: 'Address', icon: MapPin },
//     { id: 'orders', label: 'Orders', icon: Package },
//     { id: 'payments', label: 'Payment Methods', icon: CreditCard },
//     { id: 'coupons', label: 'My Coupons', icon: Tag },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'security', label: 'Security', icon: Lock },
//     { id: 'preferences', label: 'Preferences', icon: Settings }
//   ];

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">First Name</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Last Name</label>
//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Company (Optional)</label>
//                 <input
//                   type="text"
//                   name="company"
//                   value={formData.company}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         );

//         case 'address':
//   return (
//     <div className="space-y-6">
//       <h3 className="text-2xl font-semibold">Manage Addresses</h3>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {(formData.addresses || []).map((address, index) => (
//           <div key={index} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
//             <h4 className="text-lg font-semibold text-gray-700">
//               Address {index + 1}</h4>
//             <div className="mt-4 space-y-2">
//               <label className="block text-sm font-medium text-gray-600">Street</label>
//               <input 
//                 type="text" 
//                 value={address.street} 
//                 onChange={(e) => handleAddressChange(index, 'street', e.target.value)} 
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
//               />
              
//               <label className="block text-sm font-medium text-gray-600">City</label>
//               <input 
//                 type="text" 
//                 value={address.city} 
//                 onChange={(e) => handleAddressChange(index, 'city', e.target.value)} 
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
//               />
              
//               <label className="block text-sm font-medium text-gray-600">State</label>
//               <input 
//                 type="text" 
//                 value={address.state} 
//                 onChange={(e) => handleAddressChange(index, 'state', e.target.value)} 
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
//               />
              
//               <label className="block text-sm font-medium text-gray-600">Postal Code</label>
//               <input 
//                 type="text" 
//                 value={address.postalCode} 
//                 onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)} 
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
//               />
              
//               <label className="block text-sm font-medium text-gray-600">Country</label>
//               <select 
//                 value={address.country} 
//                 onChange={(e) => handleAddressChange(index, 'country', e.target.value)} 
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="Canada">Canada</option>
//                 <option value="United States">United States</option>
//               </select>
//             </div>
            
//             <div className="flex justify-between mt-4">
//               <button 
//                 type="button" // Add type="button" to prevent form submission
//                 onClick={() => handleRemoveAddress(index)} 
//                 className="text-red-600 hover:text-red-800"
//               >
//                 Remove
//               </button>
//               <button 
//                 type="button" // Add type="button" to prevent form submission
//                 onClick={() => handleSetDefaultAddress(index)} 
//                 className={`text-blue-600 hover:underline ${formData.defaultAddress === address._id ? 'font-bold' : ''}`}
//               >
//                 {formData.defaultAddress === address._id ? 'Default' : 'Set as Default'}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//       <button 
//         type="button" // Add type="button" to prevent form submission
//         onClick={(e) => {
//           e.preventDefault(); // Prevent any form submission
//           handleAddAddress();
//         }} 
//         className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//       >
//         Add New Address
//       </button>
//     </div>
//   );
//         // case 'address':
//         //   return (
//         //     <div className="space-y-6">
//         //       <h3 className="text-2xl font-semibold">Manage Addresses</h3>
//         //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         //         {(formData.addresses || []).map((address, index) => (
//         //           <div key={index} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
//         //             <h4 className="text-lg font-semibold text-gray-700">
//         //               Address {index + 1}</h4>
//         //             <div className="mt-4 space-y-2">
//         //               <label className="block text-sm font-medium text-gray-600">Street</label>
//         //               <input type="text" value={address.street} onChange={(e) => handleAddressChange(index, 'street', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      
//         //               <label className="block text-sm font-medium text-gray-600">City</label>
//         //               <input type="text" value={address.city} onChange={(e) => handleAddressChange(index, 'city', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      
//         //               <label className="block text-sm font-medium text-gray-600">State</label>
//         //               <input type="text" value={address.state} onChange={(e) => handleAddressChange(index, 'state', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      
//         //               <label className="block text-sm font-medium text-gray-600">Postal Code</label>
//         //               <input type="text" value={address.postalCode} onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      
//         //               <label className="block text-sm font-medium text-gray-600">Country</label>
//         //               <select value={address.country} onChange={(e) => handleAddressChange(index, 'country', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
//         //                 <option value="Canada">Canada</option>
//         //                 <option value="United States">United States</option>
//         //               </select>
//         //             </div>
                    
//         //             <div className="flex justify-between mt-4">
//         //               <button onClick={() => handleRemoveAddress(index)} className="text-red-600 hover:text-red-800">Remove</button>
//         //               <button onClick={() => handleSetDefaultAddress(index)} className={`text-blue-600 hover:underline ${formData.defaultAddress === address._id ? 'font-bold' : ''}`}>
//         //                 {formData.defaultAddress === address._id ? 'Default' : 'Set as Default'}
//         //               </button>
//         //             </div>
//         //           </div>
//         //         ))}
//         //       </div>
//         //       <button onClick={handleAddAddress} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add New Address</button>
//         //     </div>
//         //   );
        

//       case 'orders':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Order History</h2>
//             {orders.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {orders.map((order) => (
//                       <tr key={order._id}>
//                         <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {new Date(order.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           ${order.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                             ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
//                               order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
//                               order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                               'bg-blue-100 text-blue-800'}`}>
//                             {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
//                           {/* <a href={`/orders/${order._id}`}>View Details</a> */}
//                           <a href={`/orders`}>View Details</a>
//                           </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-gray-500">No orders found.</p>
//             )}
//           </div>
//         );

//         case 'coupons':
//           return (
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold mb-4">My Coupons</h2>
//               {coupons.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {coupons.map((coupon) => (
//                     <div key={coupon._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-2">
//                           <div className="flex items-center space-x-2">
//                             <Tag className="h-5 w-5 text-blue-600" />
//                             <h3 className="text-lg font-medium text-blue-600">{coupon.code}</h3>
//                           </div>
//                           <p className="text-2xl font-bold">
//                             {coupon.discountType === 'percentage' 
//                               ? `${coupon.discountValue}% OFF`
//                               : `$${coupon.discountValue} OFF`}
//                           </p>
//                           <div className="space-y-1">
//                             <p className="text-sm text-gray-600">
//                               Minimum purchase: ${coupon.minimumPurchase || 0}
//                             </p>
//                             {coupon.maxUsesPerUser > 0 && (
//                               <p className="text-sm text-gray-600">
//                                 Uses remaining: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                           new Date(coupon.endDate) > new Date() 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {new Date(coupon.endDate) > new Date() ? 'Active' : 'Expired'}
//                         </span>
//                       </div>
//                       <div className="mt-4 pt-4 border-t">
//                         <div className="flex justify-between items-center">
//                           <div className="text-sm text-gray-500">
//                             Valid until: {new Date(coupon.endDate).toLocaleDateString()}
//                           </div>
//                           <button 
//                             onClick={() => navigator.clipboard.writeText(coupon.code)}
//                             className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
//                           >
//                             Copy Code
//                           </button>
//                         </div>
//                         {coupon.conditions && (
//                           <p className="mt-2 text-sm text-gray-500">
//                             Conditions: {coupon.conditions}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg">
//                   <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900">No Coupons Available</h3>
//                   <p className="mt-2 text-gray-500">Check back later for new offers and discounts.</p>
//                 </div>
//               )}
//             </div>
//           );
                   
//       case 'payments':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
//             <div className="space-y-4">
//               {/* Sample saved payment methods */}
//               <div className="border rounded-lg p-4 bg-white">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <CreditCard className="h-6 w-6 text-gray-500" />
//                     <div>
//                       <p className="font-medium">•••• •••• •••• 4242</p>
//                       <p className="text-sm text-gray-500">Expires 12/25</p>
//                     </div>
//                   </div>
//                   <button className="text-red-600 hover:text-red-800">
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>

//               <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
//                 <Plus className="h-5 w-5" />
//                 <span>Add New Payment Method</span>
//               </button>
//             </div>
//           </div>
//         );

//       case 'notifications':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Order Updates</h3>
//                   <p className="text-sm text-gray-500">Receive notifications about your order status</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.orderUpdates"
//                     checked={formData.preferences.orderUpdates}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Promotional Emails</h3>
//                   <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.promotionalAlerts"
//                     checked={formData.preferences.promotionalAlerts}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Newsletter</h3>
//                   <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.newsletter"
//                     checked={formData.preferences.newsletter}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>
//             </div>
//           </div>
//         );

//       case 'security':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
//             <div className="space-y-6">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Change Password</h3>
//                 <div className="space-y-4">
//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">Current Password</label>
//                     <div className="relative">
//                       <input
//                         type={showCurrentPassword ? "text" : "password"}
//                         name="currentPassword"
//                         value={formData.currentPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">New Password</label>
//                     <div className="relative">
//                       <input
//                         type={showNewPassword ? "text" : "password"}
//                         name="newPassword"
//                         value={formData.newPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Login Activity</h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-medium">Last Login</p>
//                       <p className="text-sm text-gray-500">Toronto, Canada</p>
//                     </div>
//                     <p className="text-sm text-gray-500">2 hours ago</p>
//                   </div>
//                   <button className="text-blue-600 hover:text-blue-800 text-sm">
//                     View all activity
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
//                 <p className="text-sm text-gray-500 mb-4">
//                   Once you delete your account, there is no going back. Please be certain.
//                 </p>
//                 <button
//                   onClick={() => handleDeleteAccount()}
//                   className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                   Delete Account
//                 </button>
//               </div>
//             </div>
//           </div>
//         );

//       case 'preferences':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
//             <div className="space-y-4">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Language & Region</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Language</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="en"
//                     >
//                       <option value="en">English</option>
//                       <option value="fr">Français</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Time Zone</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="EST"
//                     >
//                       <option value="EST">Eastern Time (ET)</option>
//                       <option value="CST">Central Time (CT)</option>
//                       <option value="MST">Mountain Time (MT)</option>
//                       <option value="PST">Pacific Time (PT)</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium">Profile Visibility</p>
//                       <p className="text-sm text-gray-500">Control who can see your profile</p>
//                     </div>
//                     <select
//                       className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="private"
//                     >
//                       <option value="public">Public</option>
//                       <option value="private">Private</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="flex flex-col md:flex-row gap-8">
//         {/* Sidebar */}
//         <div className="w-full md:w-64 space-y-1">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
//                   activeTab === tab.id
//                     ? 'bg-blue-50 text-blue-600'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span>{tab.label}</span>
//               </button>
//             );
//           })}
          
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Log Out</span>
//           </button>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1">
//           <div className="bg-white rounded-lg p-6 shadow-sm">
//             {message.content && (
//               <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
//                 <AlertDescription>{message.content}</AlertDescription>
//               </Alert>
//             )}

//             <form onSubmit={handleSubmit}>
//               {renderTabContent()}

//               {/* Save Button - only show for editable sections */}
//               {['personal', 'address', 'notifications', 'security', 'preferences'].includes(activeTab) && (
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="animate-spin mr-2" size={20} />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="mr-2" size={20} />
//                         Save Changes
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;





// // with mulitple address but week ui
// // src/pages/profile.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from '../components/ui/alert';
// import { 
//   User, 
//   MapPin, 
//   CreditCard, 
//   Bell, 
//   Package, 
//   Tag, 
//   Lock,
//   Settings,
//   LogOut,
//   Loader2,
//   Save,
//   Eye,
//   EyeOff, Plus, Trash2
// } from 'lucide-react';

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', content: '' });
//   const [orders, setOrders] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     company: '',
//     currentPassword: '',
//     newPassword: '',
//     addresses: [], 
//     defaultAddress: '',
//     preferences: {
//       newsletter: false,
//       marketingEmails: false,
//       orderUpdates: true,
//       promotionalAlerts: false
//     }
//   });

//   useEffect(() => {
//     if (user) {
//       setFormData(prevState => ({
//         ...prevState,
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         company: user.company || '',
//         addresses: user.addresses || [], 
//         defaultAddress: user.defaultAddress || '',
//         preferences: user.preferences || prevState.preferences
//       }));
//     }
    
//     // Fetch orders if on orders tab
//     if (activeTab === 'orders') {
//       fetchOrders();
//     }

//     // Fetch coupons if on coupons tab
//     if (activeTab === 'coupons') {
//       fetchCoupons();
//     }
//   }, [user, activeTab]);

//   const fetchOrders = async () => {
//     try {
//       const response = await fetch('/api/users/orders', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setOrders(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch orders' });
//     }
//   };

//   const fetchCoupons = async () => {
//     try {
//       const response = await fetch('/api/users/coupons', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setCoupons(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch coupons' });
//     }
//   };


//   const handleAddAddress = () => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: [...prev.addresses, { street: '', city: '', state: '', postalCode: '', country: 'Canada' }]
//     }));
//   };
  
//   const handleRemoveAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       addresses: prev.addresses.filter((_, i) => i !== index)
//     }));
//   };
  
//   const handleAddressChange = (index, field, value) => {
//     setFormData(prev => {
//       const updatedAddresses = [...prev.addresses];
//       updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
//       return { ...prev, addresses: updatedAddresses };
//     });
//   };
  
//   const handleSetDefaultAddress = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       defaultAddress: prev.addresses[index]._id
//     }));
//   };

//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       try {
//         const response = await fetch('/api/users/profile', {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });

//         if (response.ok) {
//           logout();
//           navigate('/');
//         } else {
//           setMessage({ type: 'error', content: 'Failed to delete account' });
//         }
//       } catch (error) {
//         setMessage({ type: 'error', content: 'An error occurred while deleting account' });
//       }
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [section, field] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [section]: {
//           ...prev[section],
//           [field]: type === 'checkbox' ? checked : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', content: '' });

//     try {
//       const response = await fetch('/api/users/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify(formData)
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setMessage({ type: 'success', content: 'Profile updated successfully!' });
//         localStorage.setItem('user', JSON.stringify(data.user));
//       } else {
//         setMessage({ type: 'error', content: data.error || 'Failed to update profile' });
//       }
//     } catch (error) {
//       setMessage({ type: 'error', content: 'An error occurred while updating profile' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const tabs = [
//     { id: 'personal', label: 'Personal Info', icon: User },
//     { id: 'address', label: 'Address', icon: MapPin },
//     { id: 'orders', label: 'Orders', icon: Package },
//     { id: 'payments', label: 'Payment Methods', icon: CreditCard },
//     { id: 'coupons', label: 'My Coupons', icon: Tag },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'security', label: 'Security', icon: Lock },
//     { id: 'preferences', label: 'Preferences', icon: Settings }
//   ];

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">First Name</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Last Name</label>
//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Company (Optional)</label>
//                 <input
//                   type="text"
//                   name="company"
//                   value={formData.company}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         );

//         case 'address':
//           return (
//             <div>
//               <h3 className="text-lg font-semibold mb-3">Manage Addresses</h3>
//               {(formData.addresses || []).map((address, index) => ( // Ensure fallback to empty array
//                 <div key={index} className="border p-4 rounded-lg space-y-2">
//                   <label>Street</label>
//                   <input type="text" value={address.street} onChange={(e) => handleAddressChange(index, 'street', e.target.value)} className="w-full border p-2 rounded" />
    
//                   <label>City</label>
//                   <input type="text" value={address.city} onChange={(e) => handleAddressChange(index, 'city', e.target.value)} className="w-full border p-2 rounded" />
    
//                   <label>State</label>
//                   <input type="text" value={address.state} onChange={(e) => handleAddressChange(index, 'state', e.target.value)} className="w-full border p-2 rounded" />
    
//                   <label>Postal Code</label>
//                   <input type="text" value={address.postalCode} onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)} className="w-full border p-2 rounded" />
    
//                   <label>Country</label>
//                   <select value={address.country} onChange={(e) => handleAddressChange(index, 'country', e.target.value)} className="w-full border p-2 rounded">
//                     <option value="Canada">Canada</option>
//                     <option value="United States">United States</option>
//                   </select>
    
//                   <div className="flex justify-between">
//                     <button onClick={() => handleRemoveAddress(index)} className="text-red-600 hover:underline">Remove</button>
//                     <button onClick={() => handleSetDefaultAddress(index)} className={`text-blue-600 hover:underline ${formData.defaultAddress === address._id ? 'font-bold' : ''}`}>
//                       {formData.defaultAddress === address._id ? 'Default' : 'Set as Default'}
//                     </button>
//                   </div>
//                 </div>
//               ))}
    
//               <button onClick={handleAddAddress} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//                 Add New Address
//               </button>
//             </div>
//           );

//       case 'orders':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Order History</h2>
//             {orders.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {orders.map((order) => (
//                       <tr key={order._id}>
//                         <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {new Date(order.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           ${order.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                             ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
//                               order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
//                               order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                               'bg-blue-100 text-blue-800'}`}>
//                             {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
//                           {/* <a href={`/orders/${order._id}`}>View Details</a> */}
//                           <a href={`/orders`}>View Details</a>
//                           </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-gray-500">No orders found.</p>
//             )}
//           </div>
//         );

//         case 'coupons':
//           return (
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold mb-4">My Coupons</h2>
//               {coupons.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {coupons.map((coupon) => (
//                     <div key={coupon._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-2">
//                           <div className="flex items-center space-x-2">
//                             <Tag className="h-5 w-5 text-blue-600" />
//                             <h3 className="text-lg font-medium text-blue-600">{coupon.code}</h3>
//                           </div>
//                           <p className="text-2xl font-bold">
//                             {coupon.discountType === 'percentage' 
//                               ? `${coupon.discountValue}% OFF`
//                               : `$${coupon.discountValue} OFF`}
//                           </p>
//                           <div className="space-y-1">
//                             <p className="text-sm text-gray-600">
//                               Minimum purchase: ${coupon.minimumPurchase || 0}
//                             </p>
//                             {coupon.maxUsesPerUser > 0 && (
//                               <p className="text-sm text-gray-600">
//                                 Uses remaining: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                           new Date(coupon.endDate) > new Date() 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {new Date(coupon.endDate) > new Date() ? 'Active' : 'Expired'}
//                         </span>
//                       </div>
//                       <div className="mt-4 pt-4 border-t">
//                         <div className="flex justify-between items-center">
//                           <div className="text-sm text-gray-500">
//                             Valid until: {new Date(coupon.endDate).toLocaleDateString()}
//                           </div>
//                           <button 
//                             onClick={() => navigator.clipboard.writeText(coupon.code)}
//                             className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
//                           >
//                             Copy Code
//                           </button>
//                         </div>
//                         {coupon.conditions && (
//                           <p className="mt-2 text-sm text-gray-500">
//                             Conditions: {coupon.conditions}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg">
//                   <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900">No Coupons Available</h3>
//                   <p className="mt-2 text-gray-500">Check back later for new offers and discounts.</p>
//                 </div>
//               )}
//             </div>
//           );
                   
//       case 'payments':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
//             <div className="space-y-4">
//               {/* Sample saved payment methods */}
//               <div className="border rounded-lg p-4 bg-white">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <CreditCard className="h-6 w-6 text-gray-500" />
//                     <div>
//                       <p className="font-medium">•••• •••• •••• 4242</p>
//                       <p className="text-sm text-gray-500">Expires 12/25</p>
//                     </div>
//                   </div>
//                   <button className="text-red-600 hover:text-red-800">
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>

//               <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
//                 <Plus className="h-5 w-5" />
//                 <span>Add New Payment Method</span>
//               </button>
//             </div>
//           </div>
//         );

//       case 'notifications':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Order Updates</h3>
//                   <p className="text-sm text-gray-500">Receive notifications about your order status</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.orderUpdates"
//                     checked={formData.preferences.orderUpdates}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Promotional Emails</h3>
//                   <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.promotionalAlerts"
//                     checked={formData.preferences.promotionalAlerts}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Newsletter</h3>
//                   <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.newsletter"
//                     checked={formData.preferences.newsletter}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>
//             </div>
//           </div>
//         );

//       case 'security':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
//             <div className="space-y-6">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Change Password</h3>
//                 <div className="space-y-4">
//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">Current Password</label>
//                     <div className="relative">
//                       <input
//                         type={showCurrentPassword ? "text" : "password"}
//                         name="currentPassword"
//                         value={formData.currentPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">New Password</label>
//                     <div className="relative">
//                       <input
//                         type={showNewPassword ? "text" : "password"}
//                         name="newPassword"
//                         value={formData.newPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Login Activity</h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-medium">Last Login</p>
//                       <p className="text-sm text-gray-500">Toronto, Canada</p>
//                     </div>
//                     <p className="text-sm text-gray-500">2 hours ago</p>
//                   </div>
//                   <button className="text-blue-600 hover:text-blue-800 text-sm">
//                     View all activity
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
//                 <p className="text-sm text-gray-500 mb-4">
//                   Once you delete your account, there is no going back. Please be certain.
//                 </p>
//                 <button
//                   onClick={() => handleDeleteAccount()}
//                   className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                   Delete Account
//                 </button>
//               </div>
//             </div>
//           </div>
//         );

//       case 'preferences':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
//             <div className="space-y-4">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Language & Region</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Language</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="en"
//                     >
//                       <option value="en">English</option>
//                       <option value="fr">Français</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Time Zone</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="EST"
//                     >
//                       <option value="EST">Eastern Time (ET)</option>
//                       <option value="CST">Central Time (CT)</option>
//                       <option value="MST">Mountain Time (MT)</option>
//                       <option value="PST">Pacific Time (PT)</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium">Profile Visibility</p>
//                       <p className="text-sm text-gray-500">Control who can see your profile</p>
//                     </div>
//                     <select
//                       className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="private"
//                     >
//                       <option value="public">Public</option>
//                       <option value="private">Private</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="flex flex-col md:flex-row gap-8">
//         {/* Sidebar */}
//         <div className="w-full md:w-64 space-y-1">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
//                   activeTab === tab.id
//                     ? 'bg-blue-50 text-blue-600'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span>{tab.label}</span>
//               </button>
//             );
//           })}
          
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Log Out</span>
//           </button>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1">
//           <div className="bg-white rounded-lg p-6 shadow-sm">
//             {message.content && (
//               <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
//                 <AlertDescription>{message.content}</AlertDescription>
//               </Alert>
//             )}

//             <form onSubmit={handleSubmit}>
//               {renderTabContent()}

//               {/* Save Button - only show for editable sections */}
//               {['personal', 'address', 'notifications', 'security', 'preferences'].includes(activeTab) && (
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="animate-spin mr-2" size={20} />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="mr-2" size={20} />
//                         Save Changes
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;







//profile managemnet with 1 address
// // src/pages/profile.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from '../components/ui/alert';
// import { 
//   User, 
//   MapPin, 
//   CreditCard, 
//   Bell, 
//   Package, 
//   Tag, 
//   Lock,
//   Settings,
//   LogOut,
//   Loader2,
//   Save,
//   Eye,
//   EyeOff, Plus, Trash2
// } from 'lucide-react';

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('personal');
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', content: '' });
//   const [orders, setOrders] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     company: '',
//     currentPassword: '',
//     newPassword: '',
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       postalCode: '',
//       country: 'Canada'
//     },
//     preferences: {
//       newsletter: false,
//       marketingEmails: false,
//       orderUpdates: true,
//       promotionalAlerts: false
//     }
//   });

//   useEffect(() => {
//     if (user) {
//       setFormData(prevState => ({
//         ...prevState,
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         company: user.company || '',
//         address: user.address || prevState.address,
//         preferences: user.preferences || prevState.preferences
//       }));
//     }
    
//     // Fetch orders if on orders tab
//     if (activeTab === 'orders') {
//       fetchOrders();
//     }

//     // Fetch coupons if on coupons tab
//     if (activeTab === 'coupons') {
//       fetchCoupons();
//     }
//   }, [user, activeTab]);

//   const fetchOrders = async () => {
//     try {
//       const response = await fetch('/api/users/orders', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setOrders(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch orders' });
//     }
//   };

//   const fetchCoupons = async () => {
//     try {
//       const response = await fetch('/api/users/coupons', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       setCoupons(data);
//     } catch (error) {
//       setMessage({ type: 'error', content: 'Failed to fetch coupons' });
//     }
//   };

//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       try {
//         const response = await fetch('/api/users/profile', {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });

//         if (response.ok) {
//           logout();
//           navigate('/');
//         } else {
//           setMessage({ type: 'error', content: 'Failed to delete account' });
//         }
//       } catch (error) {
//         setMessage({ type: 'error', content: 'An error occurred while deleting account' });
//       }
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.includes('.')) {
//       const [section, field] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [section]: {
//           ...prev[section],
//           [field]: type === 'checkbox' ? checked : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', content: '' });

//     try {
//       const response = await fetch('/api/users/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify(formData)
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setMessage({ type: 'success', content: 'Profile updated successfully!' });
//         localStorage.setItem('user', JSON.stringify(data.user));
//       } else {
//         setMessage({ type: 'error', content: data.error || 'Failed to update profile' });
//       }
//     } catch (error) {
//       setMessage({ type: 'error', content: 'An error occurred while updating profile' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const tabs = [
//     { id: 'personal', label: 'Personal Info', icon: User },
//     { id: 'address', label: 'Address', icon: MapPin },
//     { id: 'orders', label: 'Orders', icon: Package },
//     { id: 'payments', label: 'Payment Methods', icon: CreditCard },
//     { id: 'coupons', label: 'My Coupons', icon: Tag },
//     { id: 'notifications', label: 'Notifications', icon: Bell },
//     { id: 'security', label: 'Security', icon: Lock },
//     { id: 'preferences', label: 'Preferences', icon: Settings }
//   ];

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'personal':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">First Name</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Last Name</label>
//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Company (Optional)</label>
//                 <input
//                   type="text"
//                   name="company"
//                   value={formData.company}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         );

//       case 'address':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Address Information</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Street Address</label>
//                 <input
//                   type="text"
//                   name="address.street"
//                   value={formData.address.street}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">City</label>
//                 <input
//                   type="text"
//                   name="address.city"
//                   value={formData.address.city}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Province/State</label>
//                 <input
//                   type="text"
//                   name="address.state"
//                   value={formData.address.state}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Postal Code</label>
//                 <input
//                   type="text"
//                   name="address.postalCode"
//                   value={formData.address.postalCode}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Country</label>
//                 <select
//                   name="address.country"
//                   value={formData.address.country}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="Canada">Canada</option>
//                   <option value="United States">United States</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         );

//       case 'orders':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Order History</h2>
//             {orders.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {orders.map((order) => (
//                       <tr key={order._id}>
//                         <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {new Date(order.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           ${order.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                             ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
//                               order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
//                               order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                               'bg-blue-100 text-blue-800'}`}>
//                             {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
//                           {/* <a href={`/orders/${order._id}`}>View Details</a> */}
//                           <a href={`/orders`}>View Details</a>
//                           </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-gray-500">No orders found.</p>
//             )}
//           </div>
//         );

//         case 'coupons':
//           return (
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold mb-4">My Coupons</h2>
//               {coupons.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {coupons.map((coupon) => (
//                     <div key={coupon._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-2">
//                           <div className="flex items-center space-x-2">
//                             <Tag className="h-5 w-5 text-blue-600" />
//                             <h3 className="text-lg font-medium text-blue-600">{coupon.code}</h3>
//                           </div>
//                           <p className="text-2xl font-bold">
//                             {coupon.discountType === 'percentage' 
//                               ? `${coupon.discountValue}% OFF`
//                               : `$${coupon.discountValue} OFF`}
//                           </p>
//                           <div className="space-y-1">
//                             <p className="text-sm text-gray-600">
//                               Minimum purchase: ${coupon.minimumPurchase || 0}
//                             </p>
//                             {coupon.maxUsesPerUser > 0 && (
//                               <p className="text-sm text-gray-600">
//                                 Uses remaining: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                           new Date(coupon.endDate) > new Date() 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {new Date(coupon.endDate) > new Date() ? 'Active' : 'Expired'}
//                         </span>
//                       </div>
//                       <div className="mt-4 pt-4 border-t">
//                         <div className="flex justify-between items-center">
//                           <div className="text-sm text-gray-500">
//                             Valid until: {new Date(coupon.endDate).toLocaleDateString()}
//                           </div>
//                           <button 
//                             onClick={() => navigator.clipboard.writeText(coupon.code)}
//                             className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
//                           >
//                             Copy Code
//                           </button>
//                         </div>
//                         {coupon.conditions && (
//                           <p className="mt-2 text-sm text-gray-500">
//                             Conditions: {coupon.conditions}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 bg-gray-50 rounded-lg">
//                   <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900">No Coupons Available</h3>
//                   <p className="mt-2 text-gray-500">Check back later for new offers and discounts.</p>
//                 </div>
//               )}
//             </div>
//           );
                   
//       case 'payments':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
//             <div className="space-y-4">
//               {/* Sample saved payment methods */}
//               <div className="border rounded-lg p-4 bg-white">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <CreditCard className="h-6 w-6 text-gray-500" />
//                     <div>
//                       <p className="font-medium">•••• •••• •••• 4242</p>
//                       <p className="text-sm text-gray-500">Expires 12/25</p>
//                     </div>
//                   </div>
//                   <button className="text-red-600 hover:text-red-800">
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>

//               <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
//                 <Plus className="h-5 w-5" />
//                 <span>Add New Payment Method</span>
//               </button>
//             </div>
//           </div>
//         );

//       case 'notifications':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Order Updates</h3>
//                   <p className="text-sm text-gray-500">Receive notifications about your order status</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.orderUpdates"
//                     checked={formData.preferences.orderUpdates}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Promotional Emails</h3>
//                   <p className="text-sm text-gray-500">Receive emails about sales and special offers</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.promotionalAlerts"
//                     checked={formData.preferences.promotionalAlerts}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-white rounded-lg">
//                 <div>
//                   <h3 className="font-medium">Newsletter</h3>
//                   <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="preferences.newsletter"
//                     checked={formData.preferences.newsletter}
//                     onChange={handleInputChange}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                 </label>
//               </div>
//             </div>
//           </div>
//         );

//       case 'security':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
//             <div className="space-y-6">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Change Password</h3>
//                 <div className="space-y-4">
//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">Current Password</label>
//                     <div className="relative">
//                       <input
//                         type={showCurrentPassword ? "text" : "password"}
//                         name="currentPassword"
//                         value={formData.currentPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative">
//                     <label className="block text-sm font-medium mb-1">New Password</label>
//                     <div className="relative">
//                       <input
//                         type={showNewPassword ? "text" : "password"}
//                         name="newPassword"
//                         value={formData.newPassword}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2"
//                       >
//                         {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Login Activity</h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="font-medium">Last Login</p>
//                       <p className="text-sm text-gray-500">Toronto, Canada</p>
//                     </div>
//                     <p className="text-sm text-gray-500">2 hours ago</p>
//                   </div>
//                   <button className="text-blue-600 hover:text-blue-800 text-sm">
//                     View all activity
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
//                 <p className="text-sm text-gray-500 mb-4">
//                   Once you delete your account, there is no going back. Please be certain.
//                 </p>
//                 <button
//                   onClick={() => handleDeleteAccount()}
//                   className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//                 >
//                   Delete Account
//                 </button>
//               </div>
//             </div>
//           </div>
//         );

//       case 'preferences':
//         return (
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold mb-4">Account Preferences</h2>
//             <div className="space-y-4">
//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Language & Region</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Language</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="en"
//                     >
//                       <option value="en">English</option>
//                       <option value="fr">Français</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Time Zone</label>
//                     <select
//                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="EST"
//                     >
//                       <option value="EST">Eastern Time (ET)</option>
//                       <option value="CST">Central Time (CT)</option>
//                       <option value="MST">Mountain Time (MT)</option>
//                       <option value="PST">Pacific Time (PT)</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg">
//                 <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium">Profile Visibility</p>
//                       <p className="text-sm text-gray-500">Control who can see your profile</p>
//                     </div>
//                     <select
//                       className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       defaultValue="private"
//                     >
//                       <option value="public">Public</option>
//                       <option value="private">Private</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="flex flex-col md:flex-row gap-8">
//         {/* Sidebar */}
//         <div className="w-full md:w-64 space-y-1">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
//                   activeTab === tab.id
//                     ? 'bg-blue-50 text-blue-600'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span>{tab.label}</span>
//               </button>
//             );
//           })}
          
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Log Out</span>
//           </button>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1">
//           <div className="bg-white rounded-lg p-6 shadow-sm">
//             {message.content && (
//               <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
//                 <AlertDescription>{message.content}</AlertDescription>
//               </Alert>
//             )}

//             <form onSubmit={handleSubmit}>
//               {renderTabContent()}

//               {/* Save Button - only show for editable sections */}
//               {['personal', 'address', 'notifications', 'security', 'preferences'].includes(activeTab) && (
//                 <div className="mt-6 flex justify-end">
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="animate-spin mr-2" size={20} />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="mr-2" size={20} />
//                         Save Changes
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;



