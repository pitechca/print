import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HomeIcon, FolderPlusIcon, FolderPenIcon, PackageOpenIcon, PackagePlusIcon, FilePlus2Icon, FilePenLineIcon, TicketPercentIcon, ShoppingBagIcon } from 'lucide-react';
import CategoryManagement from '../components/admin/CategoryManagement';
import ProductManagement from '../components/admin/ProductManagement';
import TemplateDesigner from '../components/TemplateDesigner';
import OrderManagement from '../components/OrderManagement';
import CouponManagement from '../components/admin/CouponManagement';
import { PaginatedList } from '../components/admin/PaginatedList';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = {
  categories: { data: null, timestamp: 0 },
  products: { data: null, timestamp: 0 },
  templates: { data: null, timestamp: 0 }
};

const AdminDashboard = () => {
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

  // Optimized data fetching with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const now = Date.now();
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const fetchIfNeeded = async (type, endpoint) => {
        if (forceRefresh || !cache[type].data || (now - cache[type].timestamp) > CACHE_DURATION) {
          const response = await fetch(endpoint, { 
            method: 'GET',
            headers: headers
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          cache[type] = { data, timestamp: now };
          return data;
        }
        return cache[type].data;
      };

      const [categoriesData, productsData, templatesData] = await Promise.all([
        fetchIfNeeded('categories', '/api/categories'),
        fetchIfNeeded('products', '/api/products'),
        fetchIfNeeded('templates', '/api/templates')
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = useCallback(async (type) => {
    try {
      const data = { ...formData[type] };
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      let response;
      let successMessage = '';
      
      if (type === 'category') {
        const categoryData = {
          name: data.name,
          description: data.description,
          image: data.image
        };
  
        if (selectedItem) {
          response = await fetch(`/api/categories/${selectedItem._id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(categoryData)
          });
          successMessage = 'Category updated successfully!';
        } else {
          response = await fetch('/api/categories', {
            method: 'POST',
            headers,
            body: JSON.stringify(categoryData)
          });
          successMessage = 'Category added successfully!';
        }
      }
      
      else if (type === 'product') {
        const productData = {
          name: data.name,
          category: data.category,
          basePrice: parseFloat(data.basePrice),
          description: data.description,
          hasGST: !!data.hasGST,
          hasPST: !!data.hasPST,
          images: data.images
        };
      
        if (selectedItem) {
          response = await fetch(`/api/products/${selectedItem._id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(productData)
          });
          successMessage = 'Product updated successfully!';
        } else {
          response = await fetch('/api/products', {
            method: 'POST',
            headers,
            body: JSON.stringify(productData)
          });
          successMessage = 'Product added successfully!';
        }
      }
      
      else if (type === 'template') {
        const templateData = {
          name: formData.template.name,
          category: formData.template.category,
          elements: formData.template.elements || {},
          preview: formData.template.preview
        };
  
        if (selectedItem) {
          response = await fetch(`/api/templates/${selectedItem._id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(templateData)
          });
          successMessage = 'Template updated successfully!';
        } else {
          response = await fetch('/api/templates', {
            method: 'POST',
            headers,
            body: JSON.stringify(templateData)
          });
          successMessage = 'Template added successfully!';
        }
      }      

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchData(true); // Force refresh data
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
          preview: '',
          hasGST: false,
          hasPST: false
        }
      }));
      setSelectedItem(null);

      setNotification({
        type: 'success',
        message: successMessage
      });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error(`Error ${selectedItem ? 'updating' : 'creating'} ${type}:`, error);
      setNotification({
        type: 'error',
        message: error.message || `Failed to ${selectedItem ? 'update' : 'add'} ${type}`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, [formData, selectedItem, fetchData]);

  const handleEdit = useCallback((item, type) => {
    const editableItem = {
      ...item,
      image: item.image?.data || item.image
    };
    
    if (type === 'product') {
      const editableProduct = {
        ...item,
        _id: item._id,
        category: item.category?._id || item.category,
        images: item.images?.map(img => img.data || img),
        hasGST: !!item.hasGST,
        hasPST: !!item.hasPST
      };
      
      setSelectedItem(item);
      setFormData(prev => ({ ...prev, [type]: editableProduct }));
      setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
      return;
    }
    
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, [type]: editableItem }));
    setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
  }, []);

  const handleDelete = useCallback(async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchData(true); // Force refresh after deletion
      
      setNotification({
        type: 'success',
        message: `${type.slice(0, -1)} deleted successfully!`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setNotification({
        type: 'error',
        message: error.message || `Failed to delete ${type}`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, [fetchData]);

  // Memoized sidebar items
  const sidebarItems = useMemo(() => [
    { label: "Overview", menu: "overview", icon: HomeIcon },
    { label: "Add Category", menu: "addCategory", icon: FolderPlusIcon },
    { label: "Edit Categories", menu: "editCategory", icon: FolderPenIcon },
    { label: "Add Product", menu: "addProduct", icon: PackagePlusIcon },
    { label: "Edit Products", menu: "editProduct", icon: PackageOpenIcon },
    { label: "Create Template", menu: "createTemplate", icon: FilePlus2Icon },
    { label: "Edit Templates", menu: "editTemplate", icon: FilePenLineIcon },
    { label: "Coupons", menu: "couponManagement", icon: TicketPercentIcon },
    { label: "Orders", menu: "orders", icon: ShoppingBagIcon }
  ], []);

  const SidebarItem = React.memo(({ label, menu, icon }) => (
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
  ));

  const renderSidebar = () => (
    <div className="w-full md:w-64 bg-white shadow-md md:h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      <nav className="flex flex-wrap gap-2 p-4 md:flex-col md:space-y-2 md:space-x-0">
        {sidebarItems.map(item => (
          <SidebarItem
            key={item.menu}
            label={item.label}
            menu={item.menu}
            icon={<item.icon className="mr-2" />}
          />
        ))}
      </nav>
    </div>
  );

  const Overview = React.memo(() => {
    const [stats, setStats] = useState({
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: products.length,
      recentOrders: []
    });

    useEffect(() => {
      const calculateStats = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const orders = await response.json();
          
          setStats({
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            totalProducts: products.length,
            recentOrders: orders
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
          });
        } catch (error) {
          console.error('Error calculating stats:', error);
        }
      };

      calculateStats();
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
  });

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <Overview />;
      case 'addCategory':
      case 'editCategory':
        return (
          <CategoryManagement 
            formData={formData.category}
            setFormData={data => setFormData(prev => ({ ...prev, category: data }))}
            onSubmit={() => handleSubmit('category')}
            categories={categories}
            onEdit={item => handleEdit(item, 'category')}
            onDelete={handleDelete} 
            isEdit={activeMenu === 'editCategory'}
            setNotification={setNotification}
          />
        );
      case 'addProduct':
      case 'editProduct':
        return (
          <ProductManagement 
            formData={formData.product}
            setFormData={data => setFormData(prev => ({ ...prev, product: data }))}
            onSubmit={() => handleSubmit('product')}
            categories={categories}
            products={products}
            onEdit={item => handleEdit(item, 'product')}
            onDelete={handleDelete}  
            isEdit={activeMenu === 'editProduct'}
            setNotification={setNotification}
          />
        );
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
                        setSelectedItem(null);
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {renderSidebar()}
      <div className="flex-1 p-8">
        <div className="absolute top-0 right-0 left-0 z-50 p-4">
          {notification && (
            <div
              className={`${
                notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              } border px-4 py-3 rounded relative mb-4`}
              role="alert"
            >
              <span className="block sm:inline">{notification.message}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setNotification(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
