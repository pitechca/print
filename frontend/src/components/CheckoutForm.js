import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

const CheckoutForm = ({ selectedItems, quantities }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const calculateTotal = () => {
    return Array.from(selectedItems).reduce(
      (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
      0
    );
  };

  const createOrder = async (status = 'pending') => {
    const selectedProducts = Array.from(selectedItems).map(index => {
      const item = cart[index];
      return {
        product: item.product._id,
        quantity: quantities[index],
        customization: item.customization ? {
          template: item.customization.template?._id || null,
          preview: item.customization.preview || null,
          description: item.customization.description || '',
          customFields: (item.customization.customFields || []).map(field => ({
            fieldId: field.fieldId,
            type: field.type,
            content: field.content,
            properties: field.properties || {}
          })),
          requiredFields: (item.customization.requiredFields || []).map(field => ({
            fieldId: field.fieldId,
            type: field.type,
            value: field.value
          }))
        } : null
      };
    });

    const orderData = {
      products: selectedProducts,
      totalAmount: calculateTotal(),
      status: status,
      paymentMethod: 'stripe',  // Ensure this is set correctly
      paymentId: status === 'pending' ? 'pending' : ''
    };

    console.log("🛒 Sending Order Data:", JSON.stringify(orderData, null, 2));

    try {
      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error("❌ Order Creation Error:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      console.log('🚀 Creating pending order...');
      const pendingOrder = await createOrder('pending');
      console.log('✅ Pending order created:', pendingOrder);

      console.log('💳 Creating payment intent...');
      const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
        amount: calculateTotal(),
        orderId: pendingOrder._id // Link payment to order
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔄 Processing payment...');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      console.log('✅ Payment successful, updating order...');
      await axios.put(`/api/orders/${pendingOrder._id}`, {
        status: 'completed',
        paymentId: paymentIntent.id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🛍️ Removing purchased items from cart...');
      for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
        await removeFromCart(index);
      }

      console.log('🎉 Order completed! Redirecting...');
      navigate('/orders');
    } catch (error) {
      console.error('❌ Checkout error:', error);
      setError(error.response?.data?.error || 'An error occurred during checkout.');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Card Information</h3>
        <div className="p-4 border rounded">
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
              hidePostalCode: true
            }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
          ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
      >
        {processing ? 'Processing...' : `Pay $${calculateTotal().toFixed(2)}`}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>By clicking "Pay", you agree to our terms and conditions.</p>
        <p className="mt-2">
          Your payment information is processed securely. We don't store your card details.
        </p>
      </div>
    </form>
  );
};

export default CheckoutForm;



// // src/components/CheckoutForm.js
// import React, { useState } from 'react';
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import axios from 'axios';
// import { Alert, AlertDescription } from './ui/alert';
// import { AlertCircle } from 'lucide-react';

// const CheckoutForm = ({ selectedItems, quantities }) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState(null);
//   const { cart, removeFromCart } = useCart();
//   const navigate = useNavigate();

//   const calculateTotal = () => {
//     return Array.from(selectedItems).reduce(
//       (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
//       0
//     );
//   };

//   const createOrder = async (status = 'pending') => {
//     const selectedProducts = Array.from(selectedItems).map(index => {
//       const item = cart[index];
//       return {
//         product: item.product._id,
//         quantity: quantities[index],
//         customization: item.customization ? {
//           template: item.customization.template?._id || null,
//           preview: item.customization.preview || null,
//           description: item.customization.description || '',
//           customFields: (item.customization.customFields || []).map(field => ({
//             fieldId: field.fieldId,
//             type: field.type,
//             content: field.content,
//             properties: {
//               fontSize: field.properties?.fontSize || null,
//               fontFamily: field.properties?.fontFamily || null,
//               fill: field.properties?.fill || null,
//               position: {
//                 x: field.properties?.position?.x || 0,
//                 y: field.properties?.position?.y || 0
//               },
//               scale: {
//                 x: field.properties?.scale?.x || 1,
//                 y: field.properties?.scale?.y || 1
//               }
//             }
//           })),
//           requiredFields: (item.customization.requiredFields || []).map(field => ({
//             fieldId: field.fieldId,
//             type: field.type,
//             value: field.value
//           }))
//         } : null
//       };
//     });

//     const orderData = {
//       products: selectedProducts,
//       totalAmount: calculateTotal(),
//       status: status,
//       paymentMethod: 'stripe',
//       paymentId: 'pending'
//     };

//     const response = await axios.post('/api/orders', orderData, {
//       headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     return response.data;
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);
//     setError(null);

//     try {
//       // First create a pending order
//       console.log('Creating pending order...');
//       const pendingOrder = await createOrder('pending');
//       console.log('Pending order created:', pendingOrder);

//       // Then create payment intent
//       console.log('Creating payment intent...');
//       const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
//         amount: calculateTotal(),
//         orderId: pendingOrder._id // Pass the order ID to link payment with order
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Process payment
//       console.log('Processing payment...');
//       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: { card: elements.getElement(CardElement) }
//       });
  
//       if (stripeError) {
//         throw new Error(stripeError.message);
//       }

//       // Update order with payment details
//       console.log('Payment successful, updating order...');
//       await axios.put(`/api/orders/${pendingOrder._id}`, {
//         status: 'completed',
//         paymentId: paymentIntent.id
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Remove purchased items from cart
//       for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
//         await removeFromCart(index);
//       }

//       navigate('/orders');
//     } catch (error) {
//       console.error('Checkout error:', error);
//       setError(error.message || 'An error occurred during checkout.');
//     }
  
//     setProcessing(false);
//   };
  
//   return (
//     <form onSubmit={handleSubmit} className="mt-4">
//       <div className="mb-4">
//         <h3 className="text-lg font-semibold mb-2">Card Information</h3>
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
//               hidePostalCode: true
//             }}
//           />
//         </div>
//       </div>

//       {error && (
//         <Alert variant="destructive" className="mb-4">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
//           ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
//       >
//         {processing ? 'Processing...' : `Pay $${calculateTotal().toFixed(2)}`}
//       </button>

//       <div className="mt-4 text-sm text-gray-600">
//         <p>By clicking "Pay", you agree to our terms and conditions.</p>
//         <p className="mt-2">
//           Your payment information is processed securely. We don't store your card details.
//         </p>
//       </div>
//     </form>
//   );
// };

// export default CheckoutForm;