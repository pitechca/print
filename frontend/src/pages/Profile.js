import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Bell, 
  Package, 
  Tag, 
  Lock,
  Settings,
  LogOut,
  Loader2,
  Save,
  Eye,
  EyeOff, Plus, Trash2
} from 'lucide-react';

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
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Canada'
    },
    preferences: {
      newsletter: false,
      marketingEmails: false,
      orderUpdates: true,
      promotionalAlerts: false
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || prevState.address,
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Province/State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                </select>
              </div>
            </div>
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
                                Uses remaining: {coupon.maxUsesPerUser - (coupon.userUsage?.usageCount || 0)}
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
                          <button 
                            onClick={() => navigator.clipboard.writeText(coupon.code)}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Copy Code
                          </button>
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

      case 'notifications':
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
            <div className="space-y-6">
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

              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Login Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-gray-500">Toronto, Canada</p>
                    </div>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    View all activity
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Account Deletion</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => handleDeleteAccount()}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Account
                </button>
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
                onClick={() => setActiveTab(tab.id)}
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

                    




                    

// working, but old version
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Alert, AlertDescription } from '../components/ui/alert';
// import { Eye, EyeOff, Save, Loader2 } from 'lucide-react';

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', content: '' });
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
//       marketingEmails: false
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
//   }, [user]);

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
//         // Update local storage with new user data
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

//   return (
//     <div className="max-w-4xl mx-auto p-4 space-y-6">
//       <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

//       {message.content && (
//         <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
//           <AlertDescription>{message.content}</AlertDescription>
//         </Alert>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Personal Information Section */}
//         <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
//           <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Phone</label>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Company (Optional)</label>
//               <input
//                 type="text"
//                 name="company"
//                 value={formData.company}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Address Section */}
//         <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
//           <h2 className="text-xl font-semibold mb-4">Address Information</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium mb-1">Street Address</label>
//               <input
//                 type="text"
//                 name="address.street"
//                 value={formData.address.street}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">City</label>
//               <input
//                 type="text"
//                 name="address.city"
//                 value={formData.address.city}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Province/State</label>
//               <input
//                 type="text"
//                 name="address.state"
//                 value={formData.address.state}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Postal Code</label>
//               <input
//                 type="text"
//                 name="address.postalCode"
//                 value={formData.address.postalCode}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Country</label>
//               <select
//                 name="address.country"
//                 value={formData.address.country}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="Canada">Canada</option>
//                 <option value="United States">United States</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Password Change Section */}
//         <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
//           <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          
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

//         {/* Preferences Section */}
//         <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
//           <h2 className="text-xl font-semibold mb-4">Communication Preferences</h2>
          
//           <div className="space-y-3">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="newsletter"
//                 name="preferences.newsletter"
//                 checked={formData.preferences.newsletter}
//                 onChange={handleInputChange}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="newsletter" className="ml-2 block text-sm">
//                 Subscribe to newsletter
//               </label>
//             </div>

//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="marketingEmails"
//                 name="preferences.marketingEmails"
//                 checked={formData.preferences.marketingEmails}
//                 onChange={handleInputChange}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="marketingEmails" className="ml-2 block text-sm">
//                 Receive marketing emails
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="animate-spin mr-2" size={20} />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save className="mr-2" size={20} />
//                 Save Changes
//               </>
//             )}
//           </button>

//           <button
//             type="button"
//             onClick={handleDeleteAccount}
//             className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//           >
//             Delete Account
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Profile;