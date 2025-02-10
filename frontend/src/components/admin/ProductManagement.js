// src/components/admin/ProductManagement.js
import React, { useState } from 'react';
import { PaginatedList } from './PaginatedList';
import { Trash2Icon } from 'lucide-react';


const ProductManagement = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  categories, 
  products, 
  onEdit, 
  onDelete, 
  isEdit 
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [pricingTier, setPricingTier] = useState({ minQuantity: '', maxQuantity: '', price: '' });

  const addPricingTier = () => {
    if (!pricingTier.minQuantity || !pricingTier.price) {
      alert('Please enter both minimum quantity and price');
      return;
    }
  
    const minQty = parseInt(pricingTier.minQuantity);
    const maxQty = pricingTier.maxQuantity ? parseInt(pricingTier.maxQuantity) : null;
    const price = parseFloat(pricingTier.price);
  
    // Validate numbers
    if (isNaN(minQty) || isNaN(price) || (maxQty !== null && isNaN(maxQty))) {
      alert('Please enter valid numbers');
      return;
    }
  
    if (minQty <= 0 || price <= 0 || (maxQty !== null && maxQty <= 0)) {
      alert('Please enter positive numbers');
      return;
    }
  
    if (maxQty && minQty >= maxQty) {
      alert('Maximum quantity must be greater than minimum quantity');
      return;
    }
  
    const newTiers = [...(formData.pricingTiers || [])];
    const hasOverlap = newTiers.some(tier => {
      const tierMax = tier.maxQuantity || Infinity;
      const newMax = maxQty || Infinity;
      return (minQty <= tierMax && tier.minQuantity <= newMax);
    });
  
    if (hasOverlap) {
      alert('Price tiers cannot have overlapping quantities');
      return;
    }
  
    newTiers.push({
      minQuantity: minQty,
      maxQuantity: maxQty,
      price: price
    });
    
    newTiers.sort((a, b) => a.minQuantity - b.minQuantity);
    
    setFormData({ ...formData, pricingTiers: newTiers });
    setPricingTier({ minQuantity: '', maxQuantity: '', price: '' });
  };

  const removePricingTier = (index) => {
    const newTiers = [...(formData.pricingTiers || [])];
    newTiers.splice(index, 1);
    setFormData({ ...formData, pricingTiers: newTiers });
  };


  const handleImagesChange = (e, index) => {
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
    ).then(newImages => {
      if (typeof index === 'number') {
        const updatedImages = [...(formData.images || [])];
        updatedImages[index] = newImages[0];
        setFormData({ ...formData, images: updatedImages });
      } else {
        setFormData({ 
          ...formData, 
          images: [...(formData.images || []), ...newImages]
        });
      }
    });
  };

  const removeImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({ ...formData, images: updatedImages });
  };

  const handleEdit = (product) => {
    const editableProduct = {
      ...product,
      _id: product._id,
      category: product.category?._id || product.category,
      images: product.images?.map(img => img.data || img),
      basePrice: product.basePrice || 0,
      hasGST: !!product.hasGST,
      hasPST: !!product.hasPST,
      pricingTiers: product.pricingTiers || [],
      minimumOrder: product.minimumOrder || 1,
      sku: product.sku || '',
      dimensions: product.dimensions || {},
      metadata: product.metadata || {
        searchTags: []
      },
      isFeatured: !!product.isFeatured,
      inStock: product.inStock ?? true
    };
    
    console.log('Editing product in form:', editableProduct);
    onEdit(editableProduct); 
    setShowEditForm(true);
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Product</h3>
      
      {isEdit && !showEditForm && (
        <PaginatedList 
          items={products} 
          renderItem={(product) => (
            <div key={product._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-4">
              <div className="w-24 h-24 relative">
                {product.images?.[0] && (
                  <img 
                    src={product.images[0].data} 
                    alt={product.name} 
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-grow mx-4">
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-gray-600">Category: {product.category?.name}</p>
                {/* <p className="text-gray-600">Price: ${product.basePrice}</p> */}

                {product.pricingTiers && product.pricingTiers.length > 0 ? (
                  <div className="text-gray-600">
                    <p>Price Tiers:</p>
                    {product.pricingTiers.map((tier, idx) => (
                      <p key={idx} className="text-sm">
                        {tier.minQuantity} - {tier.maxQuantity || '∞'} units: ${tier.price} each
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Base Price: ${product.basePrice}</p>
                )}

                <p className="text-gray-600">
                  Tax: {[
                    product.hasGST ? 'GST' : '',
                    product.hasPST ? 'PST' : ''
                  ].filter(Boolean).join(', ') || 'None'}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
            </div>
          )}
        />
      )}

      {(!isEdit || showEditForm) && (
        <form onSubmit={e => { e.preventDefault(); onSubmit(); setShowEditForm(false); }} 
          className="space-y-4 bg-white p-6 rounded-lg shadow">
          
          {isEdit && showEditForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setFormData({
                    name: '',
                    category: '',
                    basePrice: '',
                    description: '',
                    images: [],
                    hasGST: false,
                    hasPST: false,
                    pricingTiers: [],
                    minimumOrder: 1,
                    sku: '',
                    dimensions: {},
                    metadata: {
                      searchTags: []
                    },
                    isFeatured: false,
                    inStock: true
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
            <label className="block text-gray-700 mb-2">Category</label>
            <select
              value={formData.category || ''}
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

          {/* <div>
            <label className="block text-gray-700 mb-2">Base Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice || ''}
              onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div> */}
          {/* Base Price Section - Required if no pricing tiers */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Base Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice || ''}
              onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
              required={!formData.pricingTiers?.length} // Only required if no pricing tiers
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.pricingTiers?.length > 0 
                ? 'Optional when using price tiers' 
                : 'Required when not using price tiers'}
            </p>
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

          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasGST || false}
                onChange={e => setFormData({ ...formData, hasGST: e.target.checked })}
                className="mr-2"
              />
              <label>GST</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasPST || false}
                onChange={e => setFormData({ ...formData, hasPST: e.target.checked })}
                className="mr-2"
              />
              <label>PST</label>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-2">SKU</label>
          <input
            type="text"
            value={formData.sku || ''}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Minimum Order</label>
          <input
            type="number"
            min="1"
            value={formData.minimumOrder || '1'}
            onChange={e => setFormData({ ...formData, minimumOrder: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-700 mb-2">Length (cm)</label>
          <input
            type="number"
            step="0.1"
            value={formData.dimensions?.length || ''}
            onChange={e => setFormData({
              ...formData,
              dimensions: { ...(formData.dimensions || {}), length: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Width (cm)</label>
          <input
            type="number"
            step="0.1"
            value={formData.dimensions?.width || ''}
            onChange={e => setFormData({
              ...formData,
              dimensions: { ...(formData.dimensions || {}), width: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            step="0.1"
            value={formData.dimensions?.height || ''}
            onChange={e => setFormData({
              ...formData,
              dimensions: { ...(formData.dimensions || {}), height: parseFloat(e.target.value) }
            })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isFeatured || false}
            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
            className="mr-2"
          />
          <label>Featured Product</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.inStock || false}
            onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
            className="mr-2"
          />
          <label>In Stock</label>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold">Price Tiers</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="number"
            placeholder="Min Quantity"
            value={pricingTier.minQuantity}
            onChange={e => setPricingTier({ ...pricingTier, minQuantity: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Max Quantity (optional)"
            value={pricingTier.maxQuantity}
            onChange={e => setPricingTier({ ...pricingTier, maxQuantity: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price per unit"
            value={pricingTier.price}
            onChange={e => setPricingTier({ ...pricingTier, price: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <button
            type="button"
            onClick={addPricingTier}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Tier
          </button>
        </div>

        <div className="mt-4">
          {formData.pricingTiers?.map((tier, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2 bg-gray-50 p-2 rounded">
              <span>
                {tier.minQuantity} - {tier.maxQuantity || '∞'} units: ${tier.price} each
              </span>
              <button
                type="button"
                onClick={() => removePricingTier(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Search Tags (comma-separated)</label>
        <input
          type="text"
          value={formData.metadata?.searchTags?.join(', ') || ''}
          onChange={e => setFormData({
            ...formData,
            metadata: {
              ...(formData.metadata || {}),
              searchTags: e.target.value.split(',').map(tag => tag.trim())
            }
          })}
          className="w-full px-3 py-2 border rounded"
          placeholder="tag1, tag2, tag3"
        />
      </div>
    



          <div className="space-y-4">
            <label className="block text-gray-700">
              Add New Images
              <input
                type="file"
                onChange={(e) => handleImagesChange(e)}
                accept="image/*"
                multiple
                className="mt-1 w-full"
              />
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images?.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={typeof image === 'string' ? image : image.data}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => handleImagesChange(e, index)}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title="Replace image"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="relative z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                  {index === 0 && (
                    <span className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-br">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isEdit ? 'Update' : 'Add'} Product
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductManagement;




// // src/components/admin/ProductManagement.js
// import React, { useState } from 'react';
// import { PaginatedList } from './PaginatedList';

// const ProductManagement = ({ 
//   formData, 
//   setFormData, 
//   onSubmit, 
//   categories, 
//   products, 
//   onEdit, 
//   onDelete, 
//   isEdit 
// }) => {
//   const [showEditForm, setShowEditForm] = useState(false);

//   const handleImagesChange = (e, index) => {
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
//     ).then(newImages => {
//       if (typeof index === 'number') {
//         const updatedImages = [...(formData.images || [])];
//         updatedImages[index] = newImages[0];
//         setFormData({ ...formData, images: updatedImages });
//       } else {
//         setFormData({ 
//           ...formData, 
//           images: [...(formData.images || []), ...newImages]
//         });
//       }
//     });
//   };

//   const removeImage = (index) => {
//     const updatedImages = [...formData.images];
//     updatedImages.splice(index, 1);
//     setFormData({ ...formData, images: updatedImages });
//   };

//   const handleEdit = (product) => {
//     const editableProduct = {
//       ...product,
//       _id: product._id,
//       category: product.category?._id || product.category,
//       images: product.images?.map(img => img.data || img),
//       hasGST: !!product.hasGST,
//       hasPST: !!product.hasPST
//     };
    
//     console.log('Editing product in form:', editableProduct);
//     onEdit(product);
//     setShowEditForm(true);
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Product</h3>
      
//       {isEdit && !showEditForm && (
//         <PaginatedList 
//           items={products} 
//           renderItem={(product) => (
//             <div key={product._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-4">
//               <div className="w-24 h-24 relative">
//                 {product.images?.[0] && (
//                   <img 
//                     src={product.images[0].data} 
//                     alt={product.name} 
//                     className="w-full h-full object-cover rounded"
//                   />
//                 )}
//               </div>
//               <div className="flex-grow mx-4">
//                 <h4 className="font-bold">{product.name}</h4>
//                 <p className="text-gray-600">Category: {product.category?.name}</p>
//                 <p className="text-gray-600">Price: ${product.basePrice}</p>
//                 <p className="text-gray-600">
//                   Tax: {[
//                     product.hasGST ? 'GST' : '',
//                     product.hasPST ? 'PST' : ''
//                   ].filter(Boolean).join(', ') || 'None'}
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   Created: {new Date(product.createdAt).toLocaleDateString()}
//                 </p>
//               </div>
//               <div className="flex flex-col space-y-2">
//                 <button
//                   onClick={() => handleEdit(product)}
//                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => onDelete('products', product._id)}
//                   className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           )}
//         />
//       )}

//       {(!isEdit || showEditForm) && (
//         <form onSubmit={e => { e.preventDefault(); onSubmit(); setShowEditForm(false); }} 
//           className="space-y-4 bg-white p-6 rounded-lg shadow">
          
//           {isEdit && showEditForm && (
//             <div className="flex justify-end">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowEditForm(false);
//                   setFormData({
//                     name: '',
//                     category: '',
//                     basePrice: '',
//                     description: '',
//                     images: [],
//                     hasGST: false,
//                     hasPST: false
//                   });
//                 }}
//                 className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//               >
//                 Cancel
//               </button>
//             </div>
//           )}

//           <div>
//             <label className="block text-gray-700 mb-2">Name</label>
//             <input
//               type="text"
//               value={formData.name || ''}
//               onChange={e => setFormData({ ...formData, name: e.target.value })}
//               className="w-full px-3 py-2 border rounded"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-2">Category</label>
//             <select
//               value={formData.category || ''}
//               onChange={e => setFormData({ ...formData, category: e.target.value })}
//               className="w-full px-3 py-2 border rounded"
//               required
//             >
//               <option value="">Select Category</option>
//               {categories.map(category => (
//                 <option key={category._id} value={category._id}>
//                   {category.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-2">Base Price</label>
//             <input
//               type="number"
//               step="0.01"
//               min="0"
//               value={formData.basePrice || ''}
//               onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
//               className="w-full px-3 py-2 border rounded"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-gray-700 mb-2">Description</label>
//             <textarea
//               value={formData.description || ''}
//               onChange={e => setFormData({ ...formData, description: e.target.value })}
//               className="w-full px-3 py-2 border rounded"
//               rows="3"
//             />
//           </div>

//           <div className="flex space-x-4">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={formData.hasGST || false}
//                 onChange={e => setFormData({ ...formData, hasGST: e.target.checked })}
//                 className="mr-2"
//               />
//               <label>GST</label>
//             </div>
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 checked={formData.hasPST || false}
//                 onChange={e => setFormData({ ...formData, hasPST: e.target.checked })}
//                 className="mr-2"
//               />
//               <label>PST</label>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <label className="block text-gray-700">
//               Add New Images
//               <input
//                 type="file"
//                 onChange={(e) => handleImagesChange(e)}
//                 accept="image/*"
//                 multiple
//                 className="mt-1 w-full"
//               />
//             </label>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {formData.images?.map((image, index) => (
//                 <div key={index} className="relative group">
//                   <img
//                     src={typeof image === 'string' ? image : image.data}
//                     alt={`Product ${index + 1}`}
//                     className="w-full h-32 object-cover rounded border"
//                   />
//                   <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
//                     <input
//                       type="file"
//                       onChange={(e) => handleImagesChange(e, index)}
//                       accept="image/*"
//                       className="absolute inset-0 opacity-0 cursor-pointer"
//                       title="Replace image"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeImage(index)}
//                       className="relative z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
//                       title="Remove image"
//                     >
//                       ×
//                     </button>
//                   </div>
//                   {index === 0 && (
//                     <span className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-br">
//                       Primary
//                     </span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>

//           <button 
//             type="submit" 
//             className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             {isEdit ? 'Update' : 'Add'} Product
//           </button>
//         </form>
//       )}
//     </div>
//   );
// };

// export default ProductManagement;