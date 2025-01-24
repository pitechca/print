// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateDesigner from '../components/TemplateDesigner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('addCategory');
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
    const data = formData[type];

    try {
      if (selectedItem) {
        await axios.put(`/api/${type}s/${selectedItem._id}`, data, { headers });
      } else {
        await axios.post(`/api/${type}s`, data, { headers });
      }
      
      fetchData();
      setFormData(prev => ({
        ...prev,
        [type]: { ...prev[type], name: '', description: '', image: null }
      }));
      setSelectedItem(null);
    } catch (error) {
      console.error(`Error ${selectedItem ? 'updating' : 'creating'} ${type}:`, error);
    }
  };

  const handleEdit = (item, type) => {
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, [type]: item }));
    setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-md h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      <nav className="space-y-2">
        <SidebarItem label="Add Category" menu="addCategory" />
        <SidebarItem label="Edit Categories" menu="editCategory" />
        <SidebarItem label="Add Product" menu="addProduct" />
        <SidebarItem label="Edit Products" menu="editProduct" />
        <SidebarItem label="Create Template" menu="createTemplate" />
        <SidebarItem label="Edit Templates" menu="editTemplate" />
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
      case 'addCategory':
      case 'editCategory':
        return <CategoryForm 
          formData={formData.category}
          setFormData={data => setFormData(prev => ({ ...prev, category: data }))}
          onSubmit={() => handleSubmit('category')}
          categories={categories}
          onEdit={item => handleEdit(item, 'category')}
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
          isEdit={activeMenu === 'editProduct'}
        />;

      case 'createTemplate':
      case 'editTemplate':
        return <TemplateDesigner 
          onSave={template => {
            setFormData(prev => ({ ...prev, template }));
            handleSubmit('template');
          }}
          initialTemplate={selectedItem}
          categories={categories}
        />;

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

const CategoryForm = ({ formData, setFormData, onSubmit, categories, onEdit, isEdit }) => {
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
              <button
                onClick={() => onEdit(category)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Edit
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
            onChange={handleImageChange}
            accept="image/*"
            className="w-full"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {isEdit ? 'Update' : 'Add'} Category
        </button>
      </form>
    </div>
  );
};

const ProductForm = ({ formData, setFormData, onSubmit, categories, products, onEdit, isEdit }) => {
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
          <label className="block text-gray-700 mb-2">Templates</label>
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

export default AdminDashboard;


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