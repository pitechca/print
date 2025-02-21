// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CheckoutForm = ({ selectedItems, quantities, total, coupon }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const createOrderNotification = async (orderId) => {
    try {
      await axios.post('/api/notifications', {
        message: `New order created: #${orderId.slice(-6)}`,
        type: 'order',
        link: `/orders/${orderId}`
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { 
        state: { from: '/cart' },
        replace: true
      });
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Validate all items
      const invalidItems = Array.from(selectedItems).map(index => {
        const item = cart[index];
        const quantity = quantities[index];

        if (!item.product.inStock) {
          return `${item.product.name} is out of stock`;
        }

        if (quantity < (item.product.minimumOrder || 1)) {
          return `${item.product.name} requires a minimum order of ${item.product.minimumOrder}`;
        }

        return null;
      }).filter(Boolean);

      if (invalidItems.length > 0) {
        throw new Error(invalidItems.join('\n'));
      }

      // Create payment intent
      const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
        amount: total,
      }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Transform cart items to order structure
        const products = Array.from(selectedItems).map(index => {
          const item = cart[index];
          return {
            product: item.product._id,
            quantity: quantities[index],
            customization: {
              template: item.customization?.template?._id || null,
              preview: item.customization?.preview || null,
              description: item.customization?.description || '',
              customFields: item.customization?.customFields?.map(field => ({
                fieldId: field.fieldId,
                type: field.type,
                imageUrl: field.imageUrl,
                content: field.content,
                properties: {
                  fontSize: field.properties?.fontSize || null,
                  fontFamily: field.properties?.fontFamily || null,
                  fill: field.properties?.fill || null,
                  position: {
                    x: field.properties?.position?.x || 0,
                    y: field.properties?.position?.y || 0
                  },
                  scale: {
                    x: field.properties?.scale?.x || 1,
                    y: field.properties?.scale?.y || 1
                  }
                }
              })) || [],
              requiredFields: item.customization?.requiredFields?.map(field => ({
                fieldId: field.fieldId,
                type: field.type,
                value: field.value
              })) || []
            }
          };
        });

        const orderData = {
          products,
          totalAmount: total,
          status: 'processing',
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id,
          coupon: coupon ? {
            code: coupon.code,
            discountAmount: coupon.discountAmount,
            discountType: coupon.details.discountType,
            discountValue: coupon.details.discountValue
          } : null
        };

        // Create the order
        const response = await axios.post('/api/orders', orderData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        // Create notification for the new order
        await createOrderNotification(response.data._id);

        // Remove purchased items from cart
        for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
          await removeFromCart(index);
        }

        navigate('/orders');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.details || 
        error.message || 
        'An error occurred during checkout. Please try again.'
      );
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleFormSubmit} className="mt-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 p-4 border rounded">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
          ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
      >
        {!user 
          ? 'Login to Complete Order' 
          : processing 
            ? 'Processing...' 
            : `Pay $${total.toFixed(2)}`}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>Your payment information is processed securely by Stripe.</p>
        <p>Selected items: {selectedItems.size}</p>
        <p>Total items in cart: {cart.length}</p>
      </div>
    </form>
  );
};

export default CheckoutForm;








// // work properyl with visitor mode but without stripe
// // src/components/CheckoutForm.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import axios from 'axios';
// import { Alert, AlertDescription } from './ui/alert';
// import { AlertCircle } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const CheckoutForm = ({ selectedItems, quantities, total, coupon }) => {
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);
//   const { cart, removeFromCart } = useCart();
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const createOrderNotification = async (orderId) => {
//     try {
//       await axios.post('/api/notifications', {
//         message: `New order created: #${orderId.slice(-6)}`,
//         type: 'order',
//         link: `/orders/${orderId}`
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });
//     } catch (error) {
//       console.error('Error creating notification:', error);
//     }
//   };

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!user) {
//       navigate('/login', { state: { from: '/cart' },       replace: true
//       });
//       return;
//     }

//     setProcessing(true);
//     setError(null);

//     try {
//       // Validate all items
//       const invalidItems = Array.from(selectedItems).map(index => {
//         const item = cart[index];
//         const quantity = quantities[index];

//         if (!item.product.inStock) {
//           return `${item.product.name} is out of stock`;
//         }

//         if (quantity < (item.product.minimumOrder || 1)) {
//           return `${item.product.name} requires a minimum order of ${item.product.minimumOrder}`;
//         }

//         return null;
//       }).filter(Boolean);

//       if (invalidItems.length > 0) {
//         throw new Error(invalidItems.join('\n'));
//       }

//       // Transform cart items to order structure
//       const products = Array.from(selectedItems).map(index => {
//         const item = cart[index];
//         return {
//           product: item.product._id,
//           quantity: quantities[index],
//           customization: {
//             template: item.customization?.template?._id || null,
//             preview: item.customization?.preview || null,
//             description: item.customization?.description || '',
//             customFields: item.customization?.customFields?.map(field => ({
//               fieldId: field.fieldId,
//               type: field.type,
//               imageUrl: field.imageUrl,
//               content: field.content,
//               properties: {
//                 fontSize: field.properties?.fontSize || null,
//                 fontFamily: field.properties?.fontFamily || null,
//                 fill: field.properties?.fill || null,
//                 position: {
//                   x: field.properties?.position?.x || 0,
//                   y: field.properties?.position?.y || 0
//                 },
//                 scale: {
//                   x: field.properties?.scale?.x || 1,
//                   y: field.properties?.scale?.y || 1
//                 }
//               }
//             })) || [],
//             requiredFields: item.customization?.requiredFields?.map(field => ({
//               fieldId: field.fieldId,
//               type: field.type,
//               value: field.value
//             })) || []
//           }
//         };
//       });

//       const orderData = {
//         products,
//         totalAmount: total,
//         status: 'completed',
//         paymentMethod: 'test',
//         paymentId: 'test_' + Date.now(),
//         coupon: coupon ? {
//           code: coupon.code,
//           discountAmount: coupon.discountAmount,
//           discountType: coupon.details.discountType,
//           discountValue: coupon.details.discountValue
//         } : null
//       };

//       // Create the order
//       const response = await axios.post('/api/orders', orderData, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Create notification for the new order
//       await createOrderNotification(response.data._id);

//       // Remove purchased items from cart
//       for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
//         await removeFromCart(index);
//       }

//       navigate('/orders');
//     } catch (error) {
//       console.error('Order creation error:', error);
//       setError(
//         error.response?.data?.error || 
//         error.response?.data?.details || 
//         error.message || 
//         'An error occurred during checkout. Please try again.'
//       );
//     }

//     setProcessing(false);
//   };

//   return (
//     <form onSubmit={handleFormSubmit} className="mt-4">
//       {error && (
//         <Alert variant="destructive" className="mb-4">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <button
//         type="submit"
//         disabled={processing}
//         className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
//           ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
//       >
//         {!user 
//           ? 'Login to Complete Order' 
//           : processing 
//             ? 'Processing...' 
//             : `Complete Order - $${total.toFixed(2)}`}
//       </button>

//       <div className="mt-4 text-sm text-gray-600">
//         <p>This is a test checkout that skips payment processing.</p>
//         <p>Selected items: {selectedItems.size}</p>
//         <p>Total items in cart: {cart.length}</p>
//       </div>
//     </form>
//   );
// };

// export default CheckoutForm;









// // work without stribe and visitor cart
// // src/components/CheckoutForm.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import axios from 'axios';
// import { Alert, AlertDescription } from './ui/alert';
// import { AlertCircle } from 'lucide-react';

// const CheckoutForm = ({ selectedItems, quantities, total, coupon }) => {
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);
//   const { cart, removeFromCart } = useCart();
//   const navigate = useNavigate();

//   const createOrderNotification = async (orderId) => {
//     try {
//       await axios.post('/api/notifications', {
//         message: `New order created: #${orderId.slice(-6)}`,
//         type: 'order',
//         link: `/orders/${orderId}`
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });
//     } catch (error) {
//       console.error('Error creating notification:', error);
//       // Don't throw the error as notification creation is not critical
//     }
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);
//     setError(null);

//     try {
//       // Validate all items
//       const invalidItems = Array.from(selectedItems).map(index => {
//         const item = cart[index];
//         const quantity = quantities[index];

//         if (!item.product.inStock) {
//           return `${item.product.name} is out of stock`;
//         }

//         if (quantity < (item.product.minimumOrder || 1)) {
//           return `${item.product.name} requires a minimum order of ${item.product.minimumOrder}`;
//         }

//         return null;
//       }).filter(Boolean);

//       if (invalidItems.length > 0) {
//         throw new Error(invalidItems.join('\n'));
//       }

//       // Transform cart items to order structure
//       const products = Array.from(selectedItems).map(index => {
//         const item = cart[index];
//         return {
//           product: item.product._id,
//           quantity: quantities[index],
//           customization: {
//             template: item.customization?.template?._id || null,
//             preview: item.customization?.preview || null,
//             description: item.customization?.description || '',
//             customFields: item.customization?.customFields?.map(field => ({
//               fieldId: field.fieldId,
//               type: field.type,
//               imageUrl: field.imageUrl,
//               content: field.content,
//               properties: {
//                 fontSize: field.properties?.fontSize || null,
//                 fontFamily: field.properties?.fontFamily || null,
//                 fill: field.properties?.fill || null,
//                 position: {
//                   x: field.properties?.position?.x || 0,
//                   y: field.properties?.position?.y || 0
//                 },
//                 scale: {
//                   x: field.properties?.scale?.x || 1,
//                   y: field.properties?.scale?.y || 1
//                 }
//               }
//             })) || [],
//             requiredFields: item.customization?.requiredFields?.map(field => ({
//               fieldId: field.fieldId,
//               type: field.type,
//               value: field.value
//             })) || []
//           }
//         };
//       });

//       const orderData = {
//         products,
//         totalAmount: total,
//         status: 'completed',
//         paymentMethod: 'test',
//         paymentId: 'test_' + Date.now(),
//         coupon: coupon ? {
//           code: coupon.code,
//           discountAmount: coupon.discountAmount,
//           discountType: coupon.details.discountType,
//           discountValue: coupon.details.discountValue
//         } : null
//       };

//       // Create the order
//       const response = await axios.post('/api/orders', orderData, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Create notification for the new order
//       await createOrderNotification(response.data._id);

//       // Remove purchased items from cart
//       for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
//         await removeFromCart(index);
//       }

//       navigate('/orders');
//     } catch (error) {
//       console.error('Order creation error:', error);
//       setError(
//         error.response?.data?.error || 
//         error.response?.data?.details || 
//         error.message || 
//         'An error occurred during checkout. Please try again.'
//       );
//     }

//     setProcessing(false);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="mt-4">
//       {error && (
//         <Alert variant="destructive" className="mb-4">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <button
//         type="submit"
//         disabled={processing}
//         className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
//           ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
//       >
//         {processing ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
//       </button>

//       <div className="mt-4 text-sm text-gray-600">
//         <p>This is a test checkout that skips payment processing.</p>
//         <p>Selected items: {selectedItems.size}</p>
//         <p>Total items in cart: {cart.length}</p>
//       </div>
//     </form>
//   );
// };

// export default CheckoutForm;







// //WITH stripe
// // src/components/CheckoutForm.js
// import React, { useState } from 'react';
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import axios from 'axios';

// const CheckoutForm = () => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);
//   const { cart, clearCart } = useCart();
//   const navigate = useNavigate();

//   const calculateTotal = () => {
//     return cart.reduce((sum, item) => sum + item.product.basePrice, 0);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);
//     setError(null);

//     if (!stripe || !elements) {
//       return;
//     }

//     try {
//       // Create payment intent
//       const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
//         amount: Math.round(calculateTotal() * 100) // Convert to cents
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       // Confirm card payment
//       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement),
//         }
//       });

//       if (stripeError) {
//         setError(stripeError.message);
//         setProcessing(false);
//         return;
//       }

//       if (paymentIntent.status === 'succeeded') {
//         // Create order
//         await axios.post('/api/orders', {
//           products: cart.map(item => ({
//             product: item.product._id,
//             quantity: 1,
//             customization: {
//               customImage: item.customization?.customImage,
//               customText: item.customization?.customText,
//               preview: item.preview
//             }
//           })),
//           totalAmount: calculateTotal(),
//           paymentMethod: 'stripe',
//           paymentId: paymentIntent.id
//         }, {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         });

//         // Clear cart and redirect
//         clearCart();
//         navigate('/order-success');
//       }
//     } catch (error) {
//       setError('An error occurred during payment. Please try again.');
//       console.error('Payment error:', error);
//     }

//     setProcessing(false);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="mt-4">
//       <div className="mb-4">
//         <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
//         <div className="p-4 border rounded">
//           <CardElement
//             options={{
//               style: {
//                 base: {
//                   fontSize: '16px',
//                   color: '#424770',
//                   '::placeholder': {
//                     color: '#aab7c4',
//                   },
//                 },
//                 invalid: {
//                   color: '#9e2146',
//                 },
//               },
//             }}
//           />
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
//           {error}
//         </div>
//       )}

//       <div className="mt-6">
//         <p className="text-lg font-bold mb-4">
//           Total: ${calculateTotal().toFixed(2)}
//         </p>
//         <button
//           type="submit"
//           disabled={!stripe || processing}
//           className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
//             ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
//         >
//           {processing ? 'Processing...' : 'Pay Now'}
//         </button>
//       </div>

//       <div className="mt-4 text-sm text-gray-600">
//         <p>By clicking "Pay Now", you agree to our terms and conditions.</p>
//         <p className="mt-2">
//           Your payment information is processed securely by Stripe. We don't store your card details.
//         </p>
//       </div>
//     </form>
//   );
// };

// export default CheckoutForm;