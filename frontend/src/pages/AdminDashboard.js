// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateDesigner from '../components/TemplateDesigner';
import { HomeIcon, FolderPlusIcon, FolderPenIcon, PackageOpenIcon, PackagePlusIcon, FilePlus2Icon, FilePenLineIcon, TicketPercentIcon, ShoppingBagIcon} from 'lucide-react'; 
import OrderManagement from '../components/OrderManagement';


const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('overview');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);


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
      let successMessage = '';

      
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
          successMessage = 'Category updated successfully!';
        } else {
          response = await axios.post('/api/categories', categoryData, { headers });
          successMessage = 'Category added successfully!';
        }
      }
      
      // Handle Products
      else if (type === 'product') {
        if (selectedItem) {
          response = await axios.put(`/api/products/${selectedItem._id}`, data, { headers });
          successMessage = 'Product updated successfully!';
        } else {
          response = await axios.post('/api/products', data, { headers });
          successMessage = 'Product added successfully!';
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
          successMessage = 'Template updated successfully!';
        } else {
          response = await axios.post('/api/templates', templateData, { headers });
          successMessage = 'Template added successfully!';
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

      // Set success notification
      setNotification({
        type: 'success',
        message: successMessage
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error(`Error ${selectedItem ? 'updating' : 'creating'} ${type}:`, error);
    
      // Set error notification
      setNotification({
        type: 'error',
        message: error.response?.data?.error || `Failed to ${selectedItem ? 'update' : 'add'} ${type}`
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);  
    
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
    // <div className="w-64 bg-white shadow-md h-screen" >
    //   <div className="p-4">
    //     <h2 className="text-xl font-bold">Admin Dashboard</h2>
    //   </div>
    //   <nav className="space-y-2">
    <div className="w-full md:w-64 bg-white shadow-md md:h-screen">
  <div className="p-4">
    <h2 className="text-xl font-bold">Admin Dashboard</h2>
  </div>
  <nav className="flex flex-wrap gap-2 p-4 md:flex-col md:space-y-2 md:space-x-0">
        <SidebarItem label="Overview" menu="overview" icon={<HomeIcon className="mr-2"/>} />
        <SidebarItem label="Add Category" menu="addCategory" icon={<FolderPlusIcon className="mr-2"/>}
        //  icon={
        //   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        //   </svg>
        // }
        />
        <SidebarItem label="Edit Categories" menu="editCategory" icon={<FolderPenIcon className="mr-2 h-5 w-5"/>} />
        <SidebarItem label="Add Product" menu="addProduct" icon={<PackagePlusIcon className="mr-2 h-5 w-5"/>} />
        <SidebarItem label="Edit Products" menu="editProduct" icon={<PackageOpenIcon className="mr-2 h-5 w-5"/>}/>
        <SidebarItem label="Create Template" menu="createTemplate" icon={<FilePlus2Icon className="mr-2 h-5 w-5"/>} />
        <SidebarItem label="Edit Templates" menu="editTemplate" icon={<FilePenLineIcon className="mr-2 h-5 w-5"/>} />
        <SidebarItem label="Coupons" menu="couponManagement" icon={<TicketPercentIcon className="mr-2 h-5 w-5"/>} />
        <SidebarItem label="Orders" menu="orders" icon={<ShoppingBagIcon className="mr-2 h-5 w-5"/>} />

      </nav>
    </div>
  );

  const SidebarItem = ({ label, menu, icon}) => (
    <button
      onClick={() => setActiveMenu(menu)}
      className={`w-full flex items-center justify-start text-left px-4 py-2 space-x-2 ${
        activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
      }`}
    >
      {icon && React.cloneElement(icon, {
            className: `h-5 w-5 ${activeMenu === menu ? 'text-blue-600' : 'text-gray-500'}`
      })}
      <span>{label}</span>
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
      case 'editTemplate':
      return (
        <div>
          <h3 className="text-2xl font-bold mb-6">Existing Templates</h3>
          {selectedItem ? (
            <div className="mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">Edit Template</h4>
                  <button 
                    onClick={() => {
                      setSelectedItem(null);
                      setFormData(prev => ({
                        ...prev,
                        template: { name: '', category: '', elements: {}, preview: '' }
                      }));
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
                <TemplateDesigner 
                  onSave={template => {
                    setFormData(prev => ({ ...prev, template }));
                    handleSubmit('template');
                    setSelectedItem(null); // Clear selection after save
                  }}
                  initialTemplate={selectedItem}
                  categories={categories}
                />
              </div>
            </div>
          ) : (
            <PaginatedList 
              items={templates}
              renderItem={(template) => (
                <div key={template._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-4">
                  {template.preview && (
                    <img 
                      src={template.preview} 
                      alt={template.name}
                      className="w-24 h-32 object-contain mr-4"
                    />
                  )}
                  <div className="flex-grow">
                    <h4 className="font-bold">{template.name}</h4>
                    <p className="text-gray-600">Category: {template.category?.name}</p>
                  </div>
                  <div className="flex space-x-2">
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
              )}
            />
          )}
        </div>
      );
      case 'orders':
        return <OrderManagement />;
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
    // <div className="flex min-h-screen bg-gray-100">
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {renderSidebar()}
      <div className="flex-1 p-8">

        <div className="absolute top-0 right-0 left-0 z-50 p-4">
          {notification && (
            <Notification 
              type={notification.type} 
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

const CategoryForm = ({ formData, setFormData, onSubmit, categories, onEdit, onDelete, isEdit }) => {
  const [showEditForm, setShowEditForm] = useState(false);

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
      
      {/* Show list of categories when in edit mode and not showing edit form */}
      {isEdit && !showEditForm && (
        <PaginatedList 
          items={categories} 
          renderItem={(category) => (
            <div key={category._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
              {category.image && (
                <img 
                  src={category.image.data || category.image} 
                  alt={category.name} 
                  className="w-24 h-24 object-cover mr-4 rounded"
                />
              )}
              <div className="flex-grow">
                <h4 className="font-bold">{category.name}</h4>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    onEdit(category);
                    setShowEditForm(true);
                  }}
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
          )}
        />
      )}
    
      {/* Show form when adding or editing */}
      {(!isEdit || showEditForm) && (
        <form onSubmit={e => { e.preventDefault(); onSubmit(); setShowEditForm(false); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
          {isEdit && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setFormData({ name: '', description: '', image: null });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          )}

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
      )}
    </div>
  );
};


const ProductForm = ({ formData, setFormData, onSubmit, categories, products, onEdit, onDelete, isEdit }) => {
  const [showEditForm, setShowEditForm] = useState(false);

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

      {/* Show list of products when in edit mode and not showing edit form */}
      {isEdit && !showEditForm && (
        <PaginatedList 
          items={products} 
          renderItem={(product) => (
            <div key={product._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
              {product.templates?.[0] && (
                <img 
                  src={product.templates[0].data} 
                  alt={product.name} 
                  className="w-24 h-24 object-cover mr-4 rounded"
                />
              )}
              <div className="flex-grow">
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-gray-600">Category: {product.category?.name}</p>
                <p className="text-gray-600">Price: ${product.basePrice}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    onEdit(product);
                    setShowEditForm(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete('products', product._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}
      
      {/* Show form when adding or editing */}
      {(!isEdit || showEditForm) && (
        <form onSubmit={e => { e.preventDefault(); onSubmit(); setShowEditForm(false); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
          {isEdit && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setFormData({ name: '', category: '', basePrice: '', description: '', templates: [] });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          )}

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
               {formData.templates.map((template, index) => (
          <div key={index} className="relative">
            <img 
              src={typeof template === 'string' ? template : template.data} 
              alt={`Product ${index + 1}`} 
              className="w-32 h-32 object-cover rounded border"
            />
            </div>
))}
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            {isEdit ? 'Update' : 'Add'} Product
          </button>
        </form>
      )}
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


const Notification = ({ type, message, onClose }) => {
  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
  };

  return (
    <div 
      className={`${typeStyles[type]} border px-4 py-3 rounded relative mb-4 animate-slide-in`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      <span 
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        onClick={onClose}
      >
        <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <title>Close</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
        </svg>
      </span>
    </div>
  );
};

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return (
    <div className="flex justify-center space-x-2 mt-4">
      {[...Array(totalPages)].map((_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index + 1)}
          className={`px-4 py-2 rounded ${
            currentPage === index + 1 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};


const PaginatedList = ({ items, renderItem, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sort items from latest to earliest
  const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      {currentItems.map(renderItem)}
      {items.length > itemsPerPage && (
        <Pagination 
          totalItems={items.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};


export default AdminDashboard;




// //working but evrything here- too long
// // src/pages/AdminDashboard.js
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import TemplateDesigner from '../components/TemplateDesigner';
// import { HomeIcon, FolderPlusIcon, FolderPenIcon, PackageOpenIcon, PackagePlusIcon, FilePlus2Icon, FilePenLineIcon, TicketPercentIcon, ShoppingBagIcon} from 'lucide-react'; 
// import OrderManagement from '../components/OrderManagement';


// const AdminDashboard = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [activeMenu, setActiveMenu] = useState('overview');
//   const [categories, setCategories] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [templates, setTemplates] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState(null);


//   const [formData, setFormData] = useState({
//     category: { name: '', description: '', image: null },
//     product: { name: '', category: '', basePrice: '', description: '', templates: [] },
//     template: { name: '', category: '', elements: {}, preview: '' }
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

//       const [categoriesRes, productsRes, templatesRes] = await Promise.all([
//         axios.get('/api/categories', { headers }),
//         axios.get('/api/products', { headers }),
//         axios.get('/api/templates', { headers })
//       ]);

//       setCategories(categoriesRes.data);
//       setProducts(productsRes.data);
//       setTemplates(templatesRes.data);
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handleSubmit = async (type) => {
//     const token = localStorage.getItem('token');
//     const headers = { Authorization: `Bearer ${token}` };
//     const data = { ...formData[type] };
    
//     try {
//       let response;
//       let successMessage = '';

      
//       // Handle Categories
//       if (type === 'category') {
//         // Prepare category data
//         const categoryData = {
//           name: data.name,
//           description: data.description,
//           image: data.image
//         };
  
//         if (selectedItem) {
//           // For edit, only include image if it was changed
//           if (data.image && data.image !== selectedItem.image?.data) {
//             categoryData.image = data.image;
//           }
//           response = await axios.put(
//             `/api/categories/${selectedItem._id}`,
//             categoryData,
//             { headers }
//           );
//           successMessage = 'Category updated successfully!';
//         } else {
//           response = await axios.post('/api/categories', categoryData, { headers });
//           successMessage = 'Category added successfully!';
//         }
//       }
      
//       // Handle Products
//       else if (type === 'product') {
//         if (selectedItem) {
//           response = await axios.put(`/api/products/${selectedItem._id}`, data, { headers });
//           successMessage = 'Product updated successfully!';
//         } else {
//           response = await axios.post('/api/products', data, { headers });
//           successMessage = 'Product added successfully!';
//         }
//       }
      
//       // Handle Templates
//       else if (type === 'template') {
//         // Validate required fields
//         if (!formData.template.name || !formData.template.category) {
//           console.error('Missing required fields');
//           return;
//         }
  
//         const templateData = {
//           name: formData.template.name,
//           category: formData.template.category,
//           elements: formData.template.elements || {},
//           preview: formData.template.preview
//         };
  
//         if (selectedItem) {
//           response = await axios.put(
//             `/api/templates/${selectedItem._id}`,
//             templateData,
//             { headers }
//           );
//           successMessage = 'Template updated successfully!';
//         } else {
//           response = await axios.post('/api/templates', templateData, { headers });
//           successMessage = 'Template added successfully!';
//         }
//       }      
  
//       await fetchData();
//       setFormData(prev => ({
//         ...prev,
//         [type]: { 
//           name: '', 
//           description: '', 
//           image: null,
//           category: '',
//           basePrice: '',
//           templates: [],
//           elements: {},
//           preview: ''
//         }
//       }));
//       setSelectedItem(null);

//       // Set success notification
//       setNotification({
//         type: 'success',
//         message: successMessage
//       });

//       // Clear notification after 3 seconds
//       setTimeout(() => setNotification(null), 3000);

//     } catch (error) {
//       console.error(`Error ${selectedItem ? 'updating' : 'creating'} ${type}:`, error);
    
//       // Set error notification
//       setNotification({
//         type: 'error',
//         message: error.response?.data?.error || `Failed to ${selectedItem ? 'update' : 'add'} ${type}`
//       });

//       // Clear notification after 3 seconds
//       setTimeout(() => setNotification(null), 3000);  
    
//       // Add more detailed error logging
//       if (error.response) {
//         console.error('Error response:', error.response.data);
//       }
//     }
    
//   };

//   const handleEdit = (item, type) => {
//     // Create a clean copy of the item for editing
//     const editableItem = {
//       ...item,
//       image: item.image?.data || item.image // Handle both direct image data and image object
//     };
    
//     // Special handling for products
//     if (type === 'product') {
//       editableItem.category = item.category?._id || ''; // Ensure category is the ID
//       editableItem.templates = item.templates.map(template => template.data);
//     }
    
//     setSelectedItem(item);
//     setFormData(prev => ({ ...prev, [type]: editableItem }));
//     setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
//   };

//   const handleDelete = async (type, id) => {
//     if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
//       return;
//     }
  
//     const token = localStorage.getItem('token');
//     const headers = { Authorization: `Bearer ${token}` };
  
//     try {
//       const response = await axios.delete(`/api/${type}/${id}`, { headers });
//       console.log('Delete response:', response.data); // Debug log
//       await fetchData();
//     } catch (error) {
//       console.error(`Error deleting ${type}:`, error);
      
//       // Extract the error message from the response
//       const errorMessage = error.response?.data?.error || 
//                           error.response?.data?.message || 
//                           `Failed to delete ${type}`;
      
//       // Show error message to user
//       alert(errorMessage);
      
//       // Log detailed error for debugging
//       if (error.response) {
//         console.log('Error Response Data:', error.response.data);
//         console.log('Error Response Status:', error.response.status);
//         console.log('Error Response Headers:', error.response.headers);
//       }
//     }
//   };

//   const renderSidebar = () => (
//     <div className="w-64 bg-white shadow-md h-screen" >
//       <div className="p-4">
//         <h2 className="text-xl font-bold">Admin Dashboard</h2>
//       </div>
//       <nav className="space-y-2">
//         <SidebarItem label="Overview" menu="overview" icon={<HomeIcon className="mr-2"/>} />
//         <SidebarItem label="Add Category" menu="addCategory" icon={<FolderPlusIcon className="mr-2"/>}
//         //  icon={
//         //   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//         //   </svg>
//         // }
//         />
//         <SidebarItem label="Edit Categories" menu="editCategory" icon={<FolderPenIcon className="mr-2 h-5 w-5"/>} />
//         <SidebarItem label="Add Product" menu="addProduct" icon={<PackagePlusIcon className="mr-2 h-5 w-5"/>} />
//         <SidebarItem label="Edit Products" menu="editProduct" icon={<PackageOpenIcon className="mr-2 h-5 w-5"/>}/>
//         <SidebarItem label="Create Template" menu="createTemplate" icon={<FilePlus2Icon className="mr-2 h-5 w-5"/>} />
//         <SidebarItem label="Edit Templates" menu="editTemplate" icon={<FilePenLineIcon className="mr-2 h-5 w-5"/>} />
//         <SidebarItem label="Coupons" menu="couponManagement" icon={<TicketPercentIcon className="mr-2 h-5 w-5"/>} />
//         <SidebarItem label="Orders" menu="orders" icon={<ShoppingBagIcon className="mr-2 h-5 w-5"/>} />

//       </nav>
//     </div>
//   );

//   const SidebarItem = ({ label, menu, icon}) => (
//     <button
//       onClick={() => setActiveMenu(menu)}
//       className={`w-full flex items-center justify-start text-left px-4 py-2 space-x-2 ${
//         activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
//       }`}
//     >
//       {icon && React.cloneElement(icon, {
//             className: `h-5 w-5 ${activeMenu === menu ? 'text-blue-600' : 'text-gray-500'}`
//       })}
//       <span>{label}</span>
//     </button>
//   );

//   const renderContent = () => {
//     switch (activeMenu) {
//       case 'overview':
//         return <Overview />;
//       case 'addCategory':
//       case 'editCategory':
//         return <CategoryForm 
//           formData={formData.category}
//           setFormData={data => setFormData(prev => ({ ...prev, category: data }))}
//           onSubmit={() => handleSubmit('category')}
//           categories={categories}
//           onEdit={item => handleEdit(item, 'category')}
//           onDelete={handleDelete} 
//           isEdit={activeMenu === 'editCategory'}
//         />;

//       case 'addProduct':
//       case 'editProduct':
//         return <ProductForm 
//           formData={formData.product}
//           setFormData={data => setFormData(prev => ({ ...prev, product: data }))}
//           onSubmit={() => handleSubmit('product')}
//           categories={categories}
//           products={products}
//           onEdit={item => handleEdit(item, 'product')}
//           onDelete={handleDelete}  
//           isEdit={activeMenu === 'editProduct'}
//         />;

//       case 'createTemplate':
//         return (
//           <TemplateDesigner 
//             onSave={template => {
//               setFormData(prev => ({ ...prev, template }));
//               handleSubmit('template');
//             }}
//             categories={categories}
//           />
//         );
//       case 'editTemplate':
//           return (
//             <div>
//               <h3 className="text-2xl font-bold mb-6">Existing Templates</h3>
//               <PaginatedList 
//                 items={templates}
//                 renderItem={(template) => (
//                   <div key={template._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
//                     {template.preview && (
//                       <img 
//                         src={template.preview} 
//                         alt={template.name}
//                         className="w-24 h-32 object-contain mr-4"
//                       />
//                     )}
//                     <div className="flex-grow">
//                       <h4 className="font-bold">{template.name}</h4>
//                       <p className="text-gray-600">Category: {template.category?.name}</p>
//                     </div>
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => handleEdit(template, 'template')}
//                         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete('templates', template._id)}
//                         className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               />
              
//               {selectedItem && (
//                 <div className="bg-white p-6 rounded-lg shadow mt-6">
//                   <h4 className="text-xl font-bold mb-4">Edit Template</h4>
//                   <TemplateDesigner 
//                     onSave={template => {
//                       setFormData(prev => ({ ...prev, template }));
//                       handleSubmit('template');
//                     }}
//                     initialTemplate={selectedItem}
//                     categories={categories}
//                   />
//                 </div>
//               )}
//             </div>
//           );
//       case 'orders':
//         return <OrderManagement />;
//       case 'couponManagement':
//         return <CouponManagement />;
//       default:
//         return null;
    
//     }
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center h-screen">Loading...</div>;
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {renderSidebar()}
//       <div className="flex-1 p-8">

//         <div className="absolute top-0 right-0 left-0 z-50 p-4">
//           {notification && (
//             <Notification 
//               type={notification.type} 
//               message={notification.message}
//               onClose={() => setNotification(null)}
//             />
//           )}
//         </div>

//         {renderContent()}
//       </div>
//     </div>
//   );
// };

// const CategoryForm = ({ formData, setFormData, onSubmit, categories, onEdit, onDelete, isEdit }) => {
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData({ ...formData, image: reader.result });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Category</h3>
      
//       {isEdit && (
//         <PaginatedList 
//           items={categories} 
//           renderItem={(category) => (
//             <div key={category._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
//               {category.image && (
//                 <img 
//                   src={category.image.data || category.image} 
//                   alt={category.name} 
//                   className="w-24 h-24 object-cover mr-4 rounded"
//                 />
//               )}
//               <div className="flex-grow">
//                 <h4 className="font-bold">{category.name}</h4>
//                 <p className="text-gray-600">{category.description}</p>
//               </div>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => onEdit(category)}
//                   className="bg-blue-500 text-white px-4 py-2 rounded"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => onDelete('categories', category._id)}
//                   className="bg-red-500 text-white px-4 py-2 rounded"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           )}
//         />
//       )}
    
//       <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
//         <div>
//           <label className="block text-gray-700 mb-2">Name</label>
//           <input
//             type="text"
//             value={formData.name || ''}
//             onChange={e => setFormData({ ...formData, name: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             required
//           />
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Description</label>
//           <textarea
//             value={formData.description || ''}
//             onChange={e => setFormData({ ...formData, description: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             rows="3"
//           />
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Image</label>
//           <input
//             type="file"
//             onChange={handleImageChange}
//             accept="image/*"
//             className="w-full"
//           />
//           {formData.image && (
//             <img 
//               src={typeof formData.image === 'string' ? formData.image : formData.image.data} 
//               alt="Preview" 
//               className="mt-2 h-32 object-contain"
//             />
//           )}
//         </div>
//         <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
//           {isEdit ? 'Update' : 'Add'} Category
//         </button>
//       </form>
//     </div>
//   );
// };

// const ProductForm = ({ formData, setFormData, onSubmit, categories, products, onEdit, onDelete, isEdit }) => {
//   const handleTemplatesChange = (e) => {
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
//       setFormData({ ...formData, templates });
//     });
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Product</h3>

//       {isEdit && (
//         <PaginatedList 
//           items={products} 
//           renderItem={(product) => (
//             <div key={product._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
//               {product.templates?.[0] && (
//                 <img 
//                   src={product.templates[0].data} 
//                   alt={product.name} 
//                   className="w-24 h-24 object-cover mr-4 rounded"
//                 />
//               )}
//               <div className="flex-grow">
//                 <h4 className="font-bold">{product.name}</h4>
//                 <p className="text-gray-600">Category: {product.category?.name}</p>
//                 <p className="text-gray-600">Price: ${product.basePrice}</p>
//               </div>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => onEdit(product)}
//                   className="bg-blue-500 text-white px-4 py-2 rounded"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => onDelete('products', product._id)}
//                   className="bg-red-500 text-white px-4 py-2 rounded"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           )}
//         />
//       )}
      
//       <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4 bg-white p-6 rounded-lg shadow">
//         <div>
//           <label className="block text-gray-700 mb-2">Name</label>
//           <input
//             type="text"
//             value={formData.name}
//             onChange={e => setFormData({ ...formData, name: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             required
//           />
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Category</label>
//           <select
//             value={formData.category}
//             onChange={e => setFormData({ ...formData, category: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             required
//           >
//             <option value="">Select Category</option>
//             {categories.map(category => (
//               <option key={category._id} value={category._id}>
//                 {category.name}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Base Price</label>
//           <input
//             type="number"
//             value={formData.basePrice}
//             onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             required
//           />
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Description</label>
//           <textarea
//             value={formData.description}
//             onChange={e => setFormData({ ...formData, description: e.target.value })}
//             className="w-full px-3 py-2 border rounded"
//             rows="3"
//           />
//         </div>
//         <div>
//           <label className="block text-gray-700 mb-2">Image</label>
//           <input
//             type="file"
//             onChange={handleTemplatesChange}
//             accept="image/*"
//             multiple
//             className="w-full"
//           />
//         </div>
//         <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
//           {isEdit ? 'Update' : 'Add'} Product
//         </button>
//       </form>
//     </div>
//   );
// };


// //Overview Component
// const Overview = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalProducts: 0,
//     recentOrders: []
//   });

//   useEffect(() => {
//     const fetchOverviewData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };

//         // Fetch overview data
//         const [ordersRes, productsRes] = await Promise.all([
//           axios.get('/api/orders', { headers }),
//           axios.get('/api/products', { headers })
//         ]);

//         const totalOrders = ordersRes.data.length;
//         const totalRevenue = ordersRes.data.reduce((sum, order) => sum + order.totalAmount, 0);
//         const totalProducts = productsRes.data.length;
//         const recentOrders = ordersRes.data
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//           .slice(0, 5);

//         setStats({
//           totalOrders,
//           totalRevenue,
//           totalProducts,
//           recentOrders
//         });
//       } catch (error) {
//         console.error('Error fetching overview data:', error);
//       }
//     };

//     fetchOverviewData();
//   }, []);

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Orders</h3>
//         <p className="text-3xl font-bold">{stats.totalOrders}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Revenue</h3>
//         <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Total Products</h3>
//         <p className="text-3xl font-bold">{stats.totalProducts}</p>
//       </div>
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-gray-500 text-sm">Recent Orders</h3>
//         <ul className="mt-2">
//           {stats.recentOrders.map(order => (
//             <li key={order._id} className="text-sm text-gray-600">
//               Order #{order._id.slice(-6)} - ${order.totalAmount.toFixed(2)}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// // Coupon Management Component
// const CouponManagement = () => {
//   const [coupons, setCoupons] = useState([]);
//   const [newCoupon, setNewCoupon] = useState({
//     code: '',
//     discountType: 'percentage',
//     discountValue: 0,
//     startDate: '',
//     endDate: '',
//     maxUses: 0,
//     assignedUsers: []
//   });
//   const [searchUser, setSearchUser] = useState('');
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };

//         // Fetch existing coupons and users
//         const [couponsRes, usersRes] = await Promise.all([
//           axios.get('/api/coupons', { headers }),
//           axios.get('/api/users', { headers })
//         ]);

//         setCoupons(couponsRes.data);
//         setUsers(usersRes.data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   // User search functionality
//   const handleUserSearch = () => {
//     if (!searchUser) {
//       setFilteredUsers([]);
//       return;
//     }

//     const filtered = users.filter(user => 
//       user.email.toLowerCase().includes(searchUser.toLowerCase())
//     );
//     setFilteredUsers(filtered);
//   };

//   const handleSelectUser = (user) => {
//     // Prevent duplicate selections
//     if (!selectedUsers.some(selectedUser => selectedUser._id === user._id)) {
//       setSelectedUsers([...selectedUsers, user]);
//       setNewCoupon(prev => ({
//         ...prev,
//         assignedUsers: [...prev.assignedUsers, user._id]
//       }));
//     }
//   };

//   const removeSelectedUser = (userId) => {
//     setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
//     setNewCoupon(prev => ({
//       ...prev,
//       assignedUsers: prev.assignedUsers.filter(id => id !== userId)
//     }));
//   };

//   const handleCreateCoupon = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.post('/api/coupons', newCoupon, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       setCoupons([...coupons, response.data]);
//       // Reset form
//       setNewCoupon({
//         code: '',
//         discountType: 'percentage',
//         discountValue: 0,
//         startDate: '',
//         endDate: '',
//         maxUses: 0,
//         assignedUsers: []
//       });
//       setSelectedUsers([]);
//       setSearchUser('');
//       setFilteredUsers([]);
//     } catch (error) {
//       console.error('Error creating coupon:', error);
//       alert(error.response?.data?.error || 'Failed to create coupon');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-xl font-bold mb-4">Create New Coupon</h3>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-gray-700 mb-2">Coupon Code</label>
//             <input
//               type="text"
//               placeholder="Enter coupon code"
//               value={newCoupon.code}
//               onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
//               className="w-full border p-2 rounded"
//             />
//           </div>
          
//           <div>
//             <label className="block text-gray-700 mb-2">Discount Type</label>
//             <select
//               value={newCoupon.discountType}
//               onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
//               className="w-full border p-2 rounded"
//             >
//               <option value="percentage">Percentage</option>
//               <option value="fixed">Fixed Amount</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-gray-700 mb-2">Discount Value</label>
//             <input
//               type="number"
//               placeholder="Enter discount value"
//               value={newCoupon.discountValue}
//               onChange={(e) => setNewCoupon({...newCoupon, discountValue: Number(e.target.value)})}
//               className="w-full border p-2 rounded"
//             />
//           </div>
          
//           <div>
//             <label className="block text-gray-700 mb-2">Max Uses</label>
//             <input
//               type="number"
//               placeholder="Maximum coupon uses"
//               value={newCoupon.maxUses}
//               onChange={(e) => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
//               className="w-full border p-2 rounded"
//             />
//           </div>
          
//           <div>
//             <label className="block text-gray-700 mb-2">Start Date</label>
//             <input
//               type="date"
//               value={newCoupon.startDate}
//               onChange={(e) => setNewCoupon({...newCoupon, startDate: e.target.value})}
//               className="w-full border p-2 rounded"
//             />
//           </div>
          
//           <div>
//             <label className="block text-gray-700 mb-2">End Date</label>
//             <input
//               type="date"
//               value={newCoupon.endDate}
//               onChange={(e) => setNewCoupon({...newCoupon, endDate: e.target.value})}
//               className="w-full border p-2 rounded"
//             />
//           </div>
//         </div>

//         {/* User Search and Selection */}
//         <div className="mt-4">
//           <label className="block text-gray-700 mb-2">Assign to Specific Users</label>
//           <div className="flex space-x-2 mb-2">
//             <input
//               type="text"
//               placeholder="Search users by email"
//               value={searchUser}
//               onChange={(e) => {
//                 setSearchUser(e.target.value);
//                 handleUserSearch();
//               }}
//               className="flex-grow border p-2 rounded"
//             />
//             <button 
//               onClick={handleUserSearch}
//               className="bg-blue-500 text-white px-4 py-2 rounded"
//             >
//               Search
//             </button>
//           </div>

//           {/* Filtered Users */}
//           {filteredUsers.length > 0 && (
//             <div className="border rounded p-2 mt-2 max-h-40 overflow-y-auto">
//               {filteredUsers.map(user => (
//                 <div 
//                   key={user._id} 
//                   onClick={() => handleSelectUser(user)}
//                   className="cursor-pointer hover:bg-gray-100 p-2"
//                 >
//                   {user.email}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Selected Users */}
//           {selectedUsers.length > 0 && (
//             <div className="mt-2">
//               <label className="block text-gray-700 mb-2">Selected Users</label>
//               <div className="flex flex-wrap gap-2">
//                 {selectedUsers.map(user => (
//                   <div 
//                     key={user._id} 
//                     className="bg-blue-100 px-2 py-1 rounded flex items-center"
//                   >
//                     {user.email}
//                     <button 
//                       onClick={() => removeSelectedUser(user._id)}
//                       className="ml-2 text-red-500"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-4">
//           <button 
//             onClick={handleCreateCoupon}
//             className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
//           >
//             Create Coupon
//           </button>
//         </div>
//       </div>

//       {/* Existing Coupons Table */}
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-xl font-bold mb-4">Existing Coupons</h3>
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border p-2">Code</th>
//               <th className="border p-2">Type</th>
//               <th className="border p-2">Value</th>
//               <th className="border p-2">Start Date</th>
//               <th className="border p-2">End Date</th>
//               <th className="border p-2">Max Uses</th>
//             </tr>
//           </thead>
//           <tbody>
//             {coupons.map(coupon => (
//               <tr key={coupon._id} className="text-center hover:bg-gray-50">
//                 <td className="border p-2">{coupon.code}</td>
//                 <td className="border p-2">{coupon.discountType}</td>
//                 <td className="border p-2">{coupon.discountValue}</td>
//                 <td className="border p-2">{new Date(coupon.startDate).toLocaleDateString()}</td>
//                 <td className="border p-2">{new Date(coupon.endDate).toLocaleDateString()}</td>
//                 <td className="border p-2">{coupon.maxUses}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };


// const Notification = ({ type, message, onClose }) => {
//   const typeStyles = {
//     success: 'bg-green-100 border-green-400 text-green-700',
//     error: 'bg-red-100 border-red-400 text-red-700',
//     warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
//   };

//   return (
//     <div 
//       className={`${typeStyles[type]} border px-4 py-3 rounded relative mb-4 animate-slide-in`}
//       role="alert"
//     >
//       <span className="block sm:inline">{message}</span>
//       <span 
//         className="absolute top-0 bottom-0 right-0 px-4 py-3"
//         onClick={onClose}
//       >
//         <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
//           <title>Close</title>
//           <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
//         </svg>
//       </span>
//     </div>
//   );
// };

// const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
  
//   return (
//     <div className="flex justify-center space-x-2 mt-4">
//       {[...Array(totalPages)].map((_, index) => (
//         <button
//           key={index}
//           onClick={() => onPageChange(index + 1)}
//           className={`px-4 py-2 rounded ${
//             currentPage === index + 1 
//               ? 'bg-blue-500 text-white' 
//               : 'bg-gray-200 text-gray-700'
//           }`}
//         >
//           {index + 1}
//         </button>
//       ))}
//     </div>
//   );
// };


// const PaginatedList = ({ items, renderItem, itemsPerPage = 5 }) => {
//   const [currentPage, setCurrentPage] = useState(1);
  
//   // Sort items from latest to earliest
//   const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

//   return (
//     <div>
//       {currentItems.map(renderItem)}
//       {items.length > itemsPerPage && (
//         <Pagination 
//           totalItems={items.length}
//           itemsPerPage={itemsPerPage}
//           currentPage={currentPage}
//           onPageChange={setCurrentPage}
//         />
//       )}
//     </div>
//   );
// };


// export default AdminDashboard;
