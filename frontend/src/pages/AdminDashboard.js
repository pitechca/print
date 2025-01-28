// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateDesigner from '../components/TemplateDesigner';
import { HomeIcon, CategoryIcon, ProductIcon, TemplateIcon, CouponIcon, UserIcon} from 'lucide-react'; 

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('overview');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    category: { name: '', description: '', image: null },
    product: { name: '', category: '', basePrice: '', description: '', templates: [] },
    template: { name: '', category: '', elements: {}, preview: '' }
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [categoriesRes, productsRes, templatesRes] = await Promise.all([
        axios.get('/api/categories', { headers }),
        axios.get('/api/products', { headers }),
        axios.get('/api/templates', { headers })
      ]);

      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
      setTemplates(templatesRes.data);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (type) => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const data = { ...formData[type] };
    
    try {
      let response;
      
      // Handle Categories
      if (type === 'category') {
        // Prepare category data
        const categoryData = {
          name: data.name,
          description: data.description,
          image: data.image
        };
  
        if (selectedItem) {
          // For edit, only include image if it was changed
          if (data.image && data.image !== selectedItem.image?.data) {
            categoryData.image = data.image;
          }
          response = await axios.put(
            `/api/categories/${selectedItem._id}`,
            categoryData,
            { headers }
          );
        } else {
          response = await axios.post('/api/categories', categoryData, { headers });
        }
      }
      
      // Handle Products
      else if (type === 'product') {
        if (selectedItem) {
          response = await axios.put(`/api/products/${selectedItem._id}`, data, { headers });
        } else {
          response = await axios.post('/api/products', data, { headers });
        }
      }
      
      // Handle Templates
      else if (type === 'template') {
        // Validate required fields
        if (!formData.template.name || !formData.template.category) {
          console.error('Missing required fields');
          return;
        }
  
        const templateData = {
          name: formData.template.name,
          category: formData.template.category,
          elements: formData.template.elements || {},
          preview: formData.template.preview
        };
  
        if (selectedItem) {
          response = await axios.put(
            `/api/templates/${selectedItem._id}`,
            templateData,
            { headers }
          );
        } else {
          response = await axios.post('/api/templates', templateData, { headers });
        }
      }      
  
      await fetchData();
      setFormData(prev => ({
        ...prev,
        [type]: { 
          name: '', 
          description: '', 
          image: null,
          category: '',
          basePrice: '',
          templates: [],
          elements: {},
          preview: ''
        }
      }));
      setSelectedItem(null);
    } catch (error) {
      console.error(`Error ${selectedItem ? 'updating' : 'creating'} ${type}:`, error);
      // Add more detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const handleEdit = (item, type) => {
    // Create a clean copy of the item for editing
    const editableItem = {
      ...item,
      image: item.image?.data || item.image // Handle both direct image data and image object
    };
    
    // Special handling for products
    if (type === 'product') {
      editableItem.category = item.category?._id || ''; // Ensure category is the ID
      editableItem.templates = item.templates.map(template => template.data);
    }
    
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, [type]: editableItem }));
    setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }
  
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
  
    try {
      const response = await axios.delete(`/api/${type}/${id}`, { headers });
      console.log('Delete response:', response.data); // Debug log
      await fetchData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      
      // Extract the error message from the response
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          `Failed to delete ${type}`;
      
      // Show error message to user
      alert(errorMessage);
      
      // Log detailed error for debugging
      if (error.response) {
        console.log('Error Response Data:', error.response.data);
        console.log('Error Response Status:', error.response.status);
        console.log('Error Response Headers:', error.response.headers);
      }
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-md h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      <nav className="space-y-2">
        <SidebarItem label="Overview" menu="overview" icon={<HomeIcon className="mr-2"/>} />
        <SidebarItem label="Add Category" menu="addCategory" />
        <SidebarItem label="Edit Categories" menu="editCategory" />
        <SidebarItem label="Add Product" menu="addProduct"   />
        <SidebarItem label="Edit Products" menu="editProduct" />
        <SidebarItem label="Create Template" menu="createTemplate" />
        <SidebarItem label="Edit Templates" menu="editTemplate" />
        <SidebarItem label="Coupons" menu="couponManagement" />
        <SidebarItem label="Orders" menu="orders" />

      </nav>
    </div>
  );

  const SidebarItem = ({ label, menu }) => (
    <button
      onClick={() => setActiveMenu(menu)}
      className={`w-full text-left px-4 py-2 ${
        activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <Overview />;
      case 'addCategory':
      case 'editCategory':
        return <CategoryForm 
          formData={formData.category}
          setFormData={data => setFormData(prev => ({ ...prev, category: data }))}
          onSubmit={() => handleSubmit('category')}
          categories={categories}
          onEdit={item => handleEdit(item, 'category')}
          onDelete={handleDelete} 
          isEdit={activeMenu === 'editCategory'}
        />;

      case 'addProduct':
      case 'editProduct':
        return <ProductForm 
          formData={formData.product}
          setFormData={data => setFormData(prev => ({ ...prev, product: data }))}
          onSubmit={() => handleSubmit('product')}
          categories={categories}
          products={products}
          onEdit={item => handleEdit(item, 'product')}
          onDelete={handleDelete}  
          isEdit={activeMenu === 'editProduct'}
        />;

      case 'createTemplate':
        return (
          <TemplateDesigner 
            onSave={template => {
              setFormData(prev => ({ ...prev, template }));
              handleSubmit('template');
            }}
            categories={categories}
          />
        );
      // case 'editTemplate':
      //   return <TemplateDesigner 
      //     onSave={template => {
      //       setFormData(prev => ({ ...prev, template }));
      //       handleSubmit('template');
      //     }}
      //     initialTemplate={selectedItem}
      //     categories={categories}
      //   />;

      // default:
      //   return null;
      case 'editTemplate':
        return (
          <div>
            <h3 className="text-2xl font-bold mb-6">Existing Templates</h3>
            <div className="mb-6 grid grid-cols-1 gap-4">
              {templates.map(template => (
                <div key={template._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                  <div>
                    <h4 className="font-bold">{template.name}</h4>
                    <p className="text-gray-600">Category: {template.category?.name}</p>
                    {template.preview && (
                      <img 
                        src={template.preview} 
                        alt={template.name}
                        className="mt-2 h-32 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template, 'template')}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete('templates', template._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedItem && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-xl font-bold mb-4">Edit Template</h4>
                <TemplateDesigner 
                  onSave={template => {
                    setFormData(prev => ({ ...prev, template }));
                    handleSubmit('template');
                  }}
                  initialTemplate={selectedItem}
                  categories={categories}
                />
              </div>
            )}
          </div>
        );
      case 'couponManagement':
        return <CouponManagement />;
      default:
        return null;
    
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {renderSidebar()}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

const CategoryForm = ({ formData, setFormData, onSubmit, categories, onEdit, onDelete, isEdit }) => {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Category</h3>
      
      {isEdit && (
        <div className="mb-6 grid grid-cols-1 gap-4">
          {categories.map(category => (
            <div key={category._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
              <div>
                <h4 className="font-bold">{category.name}</h4>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(category)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete('categories', category._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Image</label>
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="w-full"
          />
          {formData.image && (
            <img 
              src={typeof formData.image === 'string' ? formData.image : formData.image.data} 
              alt="Preview" 
              className="mt-2 h-32 object-contain"
            />
          )}
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {isEdit ? 'Update' : 'Add'} Category
        </button>
      </form>
    </div>
  );
};

const ProductForm = ({ formData, setFormData, onSubmit, categories, products, onEdit, onDelete, isEdit }) => {
  const handleTemplatesChange = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    ).then(templates => {
      setFormData({ ...formData, templates });
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Product</h3>

      {isEdit && (
        <div className="mb-6 grid grid-cols-1 gap-4">
          {products.map(product => (
            <div key={product._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
              <div>
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-gray-600">Category: {product.category?.name}</p>
                <p className="text-gray-600">Price: ${product.basePrice}</p>
              </div>
              <button
                onClick={() => onEdit(product)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                Edit
              </button>
              <button
                  onClick={() => onDelete('products', product._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Base Price</label>
          <input
            type="number"
            value={formData.basePrice}
            onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Image</label>
          <input
            type="file"
            onChange={handleTemplatesChange}
            accept="image/*"
            multiple
            className="w-full"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {isEdit ? 'Update' : 'Add'} Product
        </button>
      </form>
    </div>
  );
};


//Overview Component
const Overview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    recentOrders: []
  });

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch overview data
        const [ordersRes, productsRes] = await Promise.all([
          axios.get('/api/orders', { headers }),
          axios.get('/api/products', { headers })
        ]);

        const totalOrders = ordersRes.data.length;
        const totalRevenue = ordersRes.data.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalProducts = productsRes.data.length;
        const recentOrders = ordersRes.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setStats({
          totalOrders,
          totalRevenue,
          totalProducts,
          recentOrders
        });
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Orders</h3>
        <p className="text-3xl font-bold">{stats.totalOrders}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Revenue</h3>
        <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Total Products</h3>
        <p className="text-3xl font-bold">{stats.totalProducts}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">Recent Orders</h3>
        <ul className="mt-2">
          {stats.recentOrders.map(order => (
            <li key={order._id} className="text-sm text-gray-600">
              Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Coupon Management Component
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

        // Fetch existing coupons and users
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

  // User search functionality
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
    // Prevent duplicate selections
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
      // Reset form
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

        {/* User Search and Selection */}
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

          {/* Filtered Users */}
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

          {/* Selected Users */}
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

      {/* Existing Coupons Table */}
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
export default AdminDashboard;






//working properly but without category & template
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const AdminDashboard = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState('products');
//   const [categories, setCategories] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const [newCategory, setNewCategory] = useState({
//     name: '',
//     description: '',
//     image: null
//   });

//   const [newProduct, setNewProduct] = useState({
//     name: '',
//     category: '',
//     basePrice: '',
//     description: '',
//     templates: []
//   });

//   useEffect(() => {
//     if (!user?.isAdmin) {
//       navigate('/');
//       return;
//     }
//     fetchData();
//   }, [user, navigate]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const headers = { Authorization: `Bearer ${token}` };

//       const [productsRes, categoriesRes, ordersRes] = await Promise.all([
//         axios.get('/api/products', { headers }),
//         axios.get('/api/categories', { headers }),
//         axios.get('/api/orders', { headers })
//       ]);

//       setProducts(productsRes.data);
//       setCategories(categoriesRes.data);
//       setOrders(ordersRes.data);
//     } catch (err) {
//       setError('Error fetching data: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCategorySubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem('token');
//       await axios.post('/api/categories', newCategory, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       fetchData();
//       setNewCategory({ name: '', description: '', image: null });
//     } catch (err) {
//       setError('Error creating category: ' + err.message);
//     }
//   };

//   const handleProductSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem('token');
//       await axios.post('/api/products', newProduct, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       fetchData();
//       setNewProduct({
//         name: '',
//         category: '',
//         basePrice: '',
//         description: '',
//         templates: []
//       });
//     } catch (err) {
//       setError('Error creating product: ' + err.message);
//     }
//   };

//   const handleFileChange = (e, type) => {
//     const files = Array.from(e.target.files);
//     Promise.all(
//       files.map(file => {
//         return new Promise((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onloadend = () => resolve(reader.result);
//           reader.onerror = reject;
//           reader.readAsDataURL(file);
//         });
//       })
//     ).then(images => {
//       if (type === 'product') {
//         setNewProduct(prev => ({ ...prev, templates: images }));
//       } else {
//         setNewCategory(prev => ({ ...prev, image: images[0] }));
//       }
//     });
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center h-screen">Loading...</div>;
//   }

//   if (error) {
//     return <div className="text-red-500 p-4">{error}</div>;
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div className="w-64 bg-white shadow-md">
//         <div className="p-4">
//           <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
//         </div>
//         <nav className="mt-4">
//           <button
//             onClick={() => setActiveSection('categories')}
//             className={`w-full text-left px-4 py-2 ${activeSection === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
//           >
//             Categories
//           </button>
//           <button
//             onClick={() => setActiveSection('products')}
//             className={`w-full text-left px-4 py-2 ${activeSection === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
//           >
//             Products
//           </button>
//           <button
//             onClick={() => setActiveSection('orders')}
//             className={`w-full text-left px-4 py-2 ${activeSection === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
//           >
//             Orders
//           </button>
//         </nav>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 overflow-y-auto p-8">
//         {activeSection === 'categories' && (
//           <div>
//             <h3 className="text-2xl font-bold mb-6">Categories</h3>
            
//             {/* Add Category Form */}
//             <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//               <h4 className="text-xl font-bold mb-4">Add New Category</h4>
//               <form onSubmit={handleCategorySubmit}>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-gray-700 mb-2">Name</label>
//                     <input
//                       type="text"
//                       value={newCategory.name}
//                       onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-gray-700 mb-2">Description</label>
//                     <textarea
//                       value={newCategory.description}
//                       onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                       rows="3"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-gray-700 mb-2">Image</label>
//                     <input
//                       type="file"
//                       onChange={(e) => handleFileChange(e, 'category')}
//                       className="w-full"
//                       accept="image/*"
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                   >
//                     Add Category
//                   </button>
//                 </div>
//               </form>
//             </div>

//             {/* Categories List */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h4 className="text-xl font-bold mb-4">All Categories</h4>
//               <div className="grid grid-cols-1 gap-4">
//                 {categories.map((category) => (
//                   <div key={category._id} className="border-b pb-4">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <h5 className="font-bold">{category.name}</h5>
//                         <p className="text-gray-600">{category.description}</p>
//                       </div>
//                       {category.image && (
//                         <img
//                           src={category.image.data}
//                           alt={category.name}
//                           className="w-24 h-24 object-cover rounded"
//                         />
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {activeSection === 'products' && (
//           <div>
//             <h3 className="text-2xl font-bold mb-6">Products</h3>
            
//             {/* Add Product Form */}
//             <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//               <h4 className="text-xl font-bold mb-4">Add New Product</h4>
//               <form onSubmit={handleProductSubmit}>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-gray-700 mb-2">Name</label>
//                     <input
//                       type="text"
//                       value={newProduct.name}
//                       onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-gray-700 mb-2">Category</label>
//                     <select
//                       value={newProduct.category}
//                       onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                       required
//                     >
//                       <option value="">Select Category</option>
//                       {categories.map(category => (
//                         <option key={category._id} value={category._id}>
//                           {category.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-gray-700 mb-2">Base Price</label>
//                     <input
//                       type="number"
//                       value={newProduct.basePrice}
//                       onChange={(e) => setNewProduct(prev => ({ ...prev, basePrice: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-gray-700 mb-2">Templates</label>
//                     <input
//                       type="file"
//                       onChange={(e) => handleFileChange(e, 'product')}
//                       className="w-full"
//                       accept="image/*"
//                       multiple
//                     />
//                   </div>
//                 </div>
//                 <div className="mt-4">
//                   <label className="block text-gray-700 mb-2">Description</label>
//                   <textarea
//                     value={newProduct.description}
//                     onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
//                     className="w-full px-3 py-2 border rounded"
//                     rows="3"
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Add Product
//                 </button>
//               </form>
//             </div>

//             {/* Products List */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h4 className="text-xl font-bold mb-4">All Products</h4>
//               <div className="grid grid-cols-1 gap-4">
//                 {products.map((product) => (
//                   <div key={product._id} className="border-b pb-4">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <h5 className="font-bold">{product.name}</h5>
//                         <p className="text-gray-600">{product.category?.name}</p>
//                         <p className="text-gray-600">${product.basePrice}</p>
//                       </div>
//                       {product.templates?.[0] && (
//                         <img
//                           src={product.templates[0].data}
//                           alt={product.name}
//                           className="w-24 h-24 object-cover rounded"
//                         />
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {activeSection === 'orders' && (
//           <div>
//             <h3 className="text-2xl font-bold mb-6">Orders</h3>
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <div className="space-y-6">
//                 {orders.map((order) => (
//                   <div key={order._id} className="border-b pb-6">
//                     <div className="flex justify-between items-start mb-4">
//                       <div>
//                         <p className="text-sm text-gray-600">Order ID: {order._id}</p>
//                         <p className="text-sm text-gray-600">
//                           Date: {new Date(order.createdAt).toLocaleDateString()}
//                         </p>
//                         <p className="font-bold">${order.totalAmount?.toFixed(2)}</p>
//                       </div>
//                       <button
//                         onClick={() => window.open(`/api/orders/${order._id}/download`, '_blank')}
//                         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                       >
//                         Download
//                       </button>
//                     </div>
//                     <div className="space-y-4">
//                       {order.products?.map((item, index) => (
//                         <div key={index} className="flex items-center space-x-4">
//                           {item.customization?.preview ? (
//                             <img
//                               src={item.customization.preview}
//                               alt={item.product?.name}
//                               className="w-24 h-24 object-cover rounded"
//                             />
//                           ) : (
//                             <div className="w-24 h-24 bg-gray-200 rounded" />
//                           )}
//                           <div>
//                             <p className="font-bold">{item.product?.name}</p>
//                             <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
//                             {item.customization?.customText && (
//                               <p className="text-sm text-gray-600">
//                                 Custom Text: {item.customization.customText}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;





// //working properly but without template & creating category
// // src/pages/AdminDashboard.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const AdminDashboard = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [newProduct, setNewProduct] = useState({
//     name: '',
//     category: '',
//     basePrice: '',
//     description: '',
//     templates: []
//   });

//   useEffect(() => {
//     if (!user?.isAdmin) {
//       navigate('/');
//       return;
//     }

//     fetchProducts();
//   }, [user, navigate]);

//   const fetchProducts = async () => {
//     try {
//       const { data } = await axios.get('/api/products');
//       setProducts(data);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     }
//   };

//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     Promise.all(
//       files.map(file => {
//         return new Promise((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onloadend = () => resolve(reader.result);
//           reader.onerror = reject;
//           reader.readAsDataURL(file);
//         });
//       })
//     ).then(templates => {
//       setNewProduct(prev => ({ ...prev, templates }));
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.post('/api/products', newProduct, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       fetchProducts();
//       setNewProduct({
//         name: '',
//         category: '',
//         basePrice: '',
//         description: '',
//         templates: []
//       });
//     } catch (error) {
//       console.error('Error creating product:', error);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      
//       {/* Add New Product Form */}
//       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//         <h3 className="text-xl font-bold mb-4">Add New Product</h3>
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-gray-700 mb-2">Name</label>
//               <input
//                 type="text"
//                 value={newProduct.name}
//                 onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 mb-2">Category</label>
//               <input
//                 type="text"
//                 value={newProduct.category}
//                 onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 mb-2">Base Price</label>
//               <input
//                 type="number"
//                 value={newProduct.basePrice}
//                 onChange={(e) => setNewProduct(prev => ({ ...prev, basePrice: e.target.value }))}
//                 className="w-full px-3 py-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-gray-700 mb-2">Templates</label>
//               <input
//                 type="file"
//                 onChange={handleFileChange}
//                 className="w-full px-3 py-2 border rounded"
//                 accept="image/*"
//                 multiple
//               />
//             </div>
//           </div>
//           <div className="mt-4">
//             <label className="block text-gray-700 mb-2">Description</label>
//             <textarea
//               value={newProduct.description}
//               onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
//               className="w-full px-3 py-2 border rounded"
//               rows="3"
//             />
//           </div>
//           <button
//             type="submit"
//             className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
//           >
//             Add Product
//           </button>
//         </form>
//       </div>

//       {/* Product List */}
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h3 className="text-xl font-bold mb-4">Products</h3>
//         <div className="grid grid-cols-1 gap-4">
//           {products.map((product) => (
//             <div key={product._id} className="border-b pb-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h4 className="font-bold">{product.name}</h4>
//                   <p className="text-gray-600">{product.category}</p>
//                   <p className="text-gray-600">${product.basePrice}</p>
//                 </div>
//                 {product.templates[0] && (
//                   <img
//                     src={product.templates[0].data}
//                     alt={product.name}
//                     className="w-24 h-24 object-cover rounded"
//                   />
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;