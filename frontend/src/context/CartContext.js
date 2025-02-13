// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart([]);
    } else {
      fetchCart();
    }
  }, [localStorage.getItem('token')]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const { data } = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart([]);
    }
  };

  // const convertFileToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = () => resolve(reader.result);
  //     reader.onerror = reject;
  //     reader.readAsDataURL(file);
  //   });
  // };
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // const processCustomizationFields = async (fields) => {
  //   if (!fields) return [];
    
  //   return Promise.all(fields.map(async field => {
  //     if (field.type === 'image' || field.type === 'logo') {
  //       // If content is already a data URL, keep it
  //       if (typeof field.content === 'string' && field.content.startsWith('data:')) {
  //         return field;
  //       }
  //       // If content is a File, convert to base64
  //       if (field.content instanceof File) {
  //         const base64 = await convertFileToBase64(field.content);
  //         return { ...field, content: base64 };
  //       }
  //     }
  //     return field;
  //   }));
  // };

  const processCustomizationFields = async (fields) => {
    if (!fields) return [];
    return Promise.all(fields.map(async field => {
      if (field.type === 'image' || field.type === 'logo') {
        // If field.content is a string and does NOT start with a data URL,
        // assume it’s already a file reference (e.g. "/upload/filename.png")
        if (typeof field.content === 'string' && !field.content.startsWith('data:')) {
          return field;
        }
        // Otherwise, if it’s a File, convert it (this may be a fallback)
        if (field.content instanceof File) {
          const base64 = await convertFileToBase64(field.content);
          return { ...field, content: base64 };
        }
      }
      return field;
    }));
  };
  
  const processRequiredFields = async (fields) => {
    if (!fields) return [];
    return Promise.all(fields.map(async field => {
      if (field.type === 'image' || field.type === 'logo') {
        if (typeof field.value === 'string' && !field.value.startsWith('data:')) {
          return field;
        }
        if (field.value instanceof File) {
          const base64 = await convertFileToBase64(field.value);
          return { ...field, value: base64 };
        }
      }
      return field;
    }));
  };

  // const processRequiredFields = async (fields) => {
  //   if (!fields) return [];

  //   return Promise.all(fields.map(async field => {
  //     if (field.type === 'image' || field.type === 'logo') {
  //       // If value is already a data URL, keep it
  //       if (typeof field.value === 'string' && field.value.startsWith('data:')) {
  //         return field;
  //       }
  //       // If value is a File, convert to base64
  //       if (field.value instanceof File) {
  //         const base64 = await convertFileToBase64(field.value);
  //         return { ...field, value: base64 };
  //       }
  //     }
  //     return field;
  //   }));
  // };

  const addToCart = async (item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to add items to cart');
      }

         // Check stock status
    if (!item.product.inStock) {
      throw new Error(`${item.product.name} is currently out of stock`);
    }

    // Check minimum order
    if (item.quantity < (item.product.minimumOrder || 1)) {
      throw new Error(`Minimum order quantity for ${item.product.name} is ${item.product.minimumOrder}`);
    }

      // Process customization data
      const customizationData = item.customization ? {
        template: item.customization.template || null,
        preview: item.customization.preview || null,
        description: item.customization.description || '',
        customFields: await processCustomizationFields(item.customization.customFields || []),
        requiredFields: await processRequiredFields(item.customization.requiredFields || [])
      } : null;

      const cartItem = {
        product: {
          _id: item.product._id,
        },
        quantity: item.quantity || 1,
        customization: customizationData
      };

      await axios.post('/api/cart/add', cartItem, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateCartItem = async (index, updates) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;


      const item = cart[index];
    
      // Validate quantity update
      if (updates.quantity) {
        if (!item.product.inStock) {
          throw new Error(`${item.product.name} is currently out of stock`);
        }
  
        if (updates.quantity < (item.product.minimumOrder || 1)) {
          throw new Error(`Minimum order quantity is ${item.product.minimumOrder}`);
        }
      }
  


      let processedUpdates = { ...updates };

      if (updates.customization) {
        processedUpdates.customization = {
          ...updates.customization,
          customFields: await processCustomizationFields(updates.customization.customFields),
          requiredFields: await processRequiredFields(updates.customization.requiredFields)
        };
      }

      await axios.put(`/api/cart/${index}`, processedUpdates, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const removeFromCart = async (index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`/api/cart/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getCustomizationFile = async (orderId, fieldId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.get(`/api/orders/${orderId}/customization/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting customization file:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      updateCartItem,
      getCustomizationFile
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);








// // src/context/CartContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';

// const CartContext = createContext(null);

// export const CartProvider = ({ children }) => {
//   const [cart, setCart] = useState([]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setCart([]);
//     } else {
//       fetchCart();
//     }
//   }, [localStorage.getItem('token')]);

//   const fetchCart = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;
      
//       const { data } = await axios.get('/api/cart', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setCart(data.items);
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       setCart([]);
//     }
//   };

//   const convertFileToBase64 = (file) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const processCustomizationFields = async (fields) => {
//     if (!fields) return [];
    
//     return Promise.all(fields.map(async field => {
//       if (field.type === 'image' || field.type === 'logo') {
//         // If content is already a data URL, keep it
//         if (typeof field.content === 'string' && field.content.startsWith('data:')) {
//           return field;
//         }
//         // If content is a File, convert to base64
//         if (field.content instanceof File) {
//           const base64 = await convertFileToBase64(field.content);
//           return { ...field, content: base64 };
//         }
//       }
//       return field;
//     }));
//   };

//   const processRequiredFields = async (fields) => {
//     if (!fields) return [];

//     return Promise.all(fields.map(async field => {
//       if (field.type === 'image' || field.type === 'logo') {
//         // If value is already a data URL, keep it
//         if (typeof field.value === 'string' && field.value.startsWith('data:')) {
//           return field;
//         }
//         // If value is a File, convert to base64
//         if (field.value instanceof File) {
//           const base64 = await convertFileToBase64(field.value);
//           return { ...field, value: base64 };
//         }
//       }
//       return field;
//     }));
//   };

//   const addToCart = async (item) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('Please log in to add items to cart');
//       }

//          // Check stock status
//     if (!item.product.inStock) {
//       throw new Error(`${item.product.name} is currently out of stock`);
//     }

//     // Check minimum order
//     if (item.quantity < (item.product.minimumOrder || 1)) {
//       throw new Error(`Minimum order quantity for ${item.product.name} is ${item.product.minimumOrder}`);
//     }

//       // Process customization data
//       const customizationData = item.customization ? {
//         template: item.customization.template || null,
//         preview: item.customization.preview || null,
//         description: item.customization.description || '',
//         customFields: await processCustomizationFields(item.customization.customFields || []),
//         requiredFields: await processRequiredFields(item.customization.requiredFields || [])
//       } : null;

//       const cartItem = {
//         product: {
//           _id: item.product._id,
//         },
//         quantity: item.quantity || 1,
//         customization: customizationData
//       };

//       await axios.post('/api/cart/add', cartItem, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       await fetchCart();
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       throw error;
//     }
//   };

//   const updateCartItem = async (index, updates) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;


//       const item = cart[index];
    
//       // Validate quantity update
//       if (updates.quantity) {
//         if (!item.product.inStock) {
//           throw new Error(`${item.product.name} is currently out of stock`);
//         }
  
//         if (updates.quantity < (item.product.minimumOrder || 1)) {
//           throw new Error(`Minimum order quantity is ${item.product.minimumOrder}`);
//         }
//       }
  


//       let processedUpdates = { ...updates };

//       if (updates.customization) {
//         processedUpdates.customization = {
//           ...updates.customization,
//           customFields: await processCustomizationFields(updates.customization.customFields),
//           requiredFields: await processRequiredFields(updates.customization.requiredFields)
//         };
//       }

//       await axios.put(`/api/cart/${index}`, processedUpdates, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       await fetchCart();
//     } catch (error) {
//       console.error('Error updating cart item:', error);
//       throw error;
//     }
//   };

//   const removeFromCart = async (index) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;

//       await axios.delete(`/api/cart/${index}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       await fetchCart();
//     } catch (error) {
//       console.error('Error removing from cart:', error);
//       throw error;
//     }
//   };

//   const clearCart = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;

//       await axios.delete('/api/cart', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       setCart([]);
//     } catch (error) {
//       console.error('Error clearing cart:', error);
//       throw error;
//     }
//   };

//   const getCustomizationFile = async (orderId, fieldId) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return null;

//       const response = await axios.get(`/api/orders/${orderId}/customization/${fieldId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//         responseType: 'blob'
//       });

//       return response.data;
//     } catch (error) {
//       console.error('Error getting customization file:', error);
//       throw error;
//     }
//   };

//   return (
//     <CartContext.Provider value={{ 
//       cart, 
//       addToCart, 
//       removeFromCart, 
//       clearCart, 
//       updateCartItem,
//       getCustomizationFile
//     }}>
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);