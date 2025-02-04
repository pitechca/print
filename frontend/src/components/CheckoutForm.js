// src/components/CheckoutForm.js
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    // if (!stripe || !elements) {
    //   setError('Stripe has not been initialized.');
    //   setProcessing(false);
    //   return;
    // }

    try {
      const total = calculateTotal();
      console.log('Creating payment intent for amount:', total);

      // Create payment intent
      const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
        amount: total
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Processing payment with Stripe...');

      // Process payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {}
        }
      });

      // if (stripeError) {
      //   console.error('Stripe payment error:', stripeError);
      //   setError(stripeError.message);
      //   setProcessing(false);
      //   return;
      // }

      // if (paymentIntent.status === 'succeeded') {
      if (1==1){
        console.log('Payment successful, creating order...');

        // Prepare order data with full customization details
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
              })),
              requiredFields: (item.customization.requiredFields || []).map(field => ({
                fieldId: field.fieldId,
                type: field.type,
                value: field.value
              }))
            } : null
          };
        });

        console.log('Creating order with data:', {
          products: selectedProducts,
          totalAmount: total,
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id
        });

        // Create order
        const orderResponse = await axios.post('/api/orders', {
          products: selectedProducts,
          totalAmount: total,
          paymentMethod: 'stripe',
      //    paymentId: paymentIntent.id
                paymentId: 6545

        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Order created successfully:', orderResponse.data);

        // Remove purchased items from cart
        for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
          await removeFromCart(index);
        }

        // Redirect to orders page
        navigate('/orders');
      }
    } catch (error) {
      console.error('Checkout error:', error);
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

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);
//     setError(null);

//     if (!stripe || !elements) {
      
//       setError('Stripe has not been initialized.');
//       setProcessing(false);
//       return;
//     }

//     try {
//       const total = calculateTotal();
//       console.log('Creating payment intent for amount:', total);

//       // Create payment intent
//       const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
//         amount: total
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       console.log('Processing payment with Stripe...');

//       // Process payment with Stripe
//       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement),
//           billing_details: {}
//         }
//       });

//       if (stripeError) {
//         console.error('Stripe payment error:', stripeError);
//         setError(stripeError.message);
//         setProcessing(false);
//         return;
//       }

//       if (paymentIntent.status === 'succeeded') {

//         console.log('Payment successful, creating order...');

//         // Prepare order data with full customization details
//         const selectedProducts = Array.from(selectedItems).map(index => {
//           const item = cart[index];
//           return {
//             product: item.product._id,
//             quantity: quantities[index],
//             customization: {
//               template: item.customization?.template || null,
//               preview: item.customization?.preview || null,
//               description: item.customization?.description || '',
//               customFields: (item.customization?.customFields || []).map(field => ({
//                 fieldId: field.fieldId,
//                 type: field.type,
//                 content: field.content,
//                 properties: {
//                   fontSize: field.properties?.fontSize || null,
//                   fontFamily: field.properties?.fontFamily || null,
//                   fill: field.properties?.fill || null,
//                   position: {
//                     x: field.properties?.position?.x || 0,
//                     y: field.properties?.position?.y || 0
//                   },
//                   scale: {
//                     x: field.properties?.scale?.x || 1,
//                     y: field.properties?.scale?.y || 1
//                   }
//                 }
//               })),
//               requiredFields: (item.customization?.requiredFields || []).map(field => ({
//                 fieldId: field.fieldId,
//                 type: field.type,
//                 value: field.value
//               }))
//             }
//           };
//         });
//         // const selectedProducts = Array.from(selectedItems).map(index => {
//         //   const item = cart[index];
//         //   return {
//         //     product: item.product._id,
//         //     quantity: quantities[index],
//         //     customization: {
//         //       template: item.customization?.template || null,
//         //       preview: item.customization?.preview || null,
//         //       description: item.customization?.description || '',
//         //       customFields: item.customization?.customFields?.map(field => ({
//         //         fieldId: field.fieldId,
//         //         type: field.type,
//         //         content: field.content,
//         //         properties: {
//         //           fontSize: field.properties?.fontSize || null,
//         //           fontFamily: field.properties?.fontFamily || null,
//         //           fill: field.properties?.fill || null,
//         //           position: {
//         //             x: field.properties?.position?.x || 0,
//         //             y: field.properties?.position?.y || 0
//         //           },
//         //           scale: {
//         //             x: field.properties?.scale?.x || 1,
//         //             y: field.properties?.scale?.y || 1
//         //           }
//         //         }
//         //       })) || [],
//         //       requiredFields: item.customization?.requiredFields?.map(field => ({
//         //         fieldId: field.fieldId,
//         //         type: field.type,
//         //         value: field.value
//         //       })) || []
//         //     }
//         //   };
//         // });

//         console.log('Creating order with data:', { 
//           products: selectedProducts,
//           totalAmount: total,
//           paymentMethod: 'stripe',
//           paymentId: paymentIntent.id
//         });

//         // Create order
//         const orderResponse = await axios.post('/api/orders', {
//           products: selectedProducts,
//           totalAmount: total,
//           paymentMethod: 'stripe',
//           paymentId: paymentIntent.id
//         }, {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         console.log('Order created successfully:', orderResponse.data);

//         // Remove purchased items from cart
//         for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
//           await removeFromCart(index);
//         }

//         // Redirect to orders page
//         navigate('/orders');
//       }
//     } catch (error) {
//       console.error('Checkout error:', error);
//       setError(
//         error.response?.data?.error?.details || 
//         error.response?.data?.error || 
//         error.message || 
//         'An error occurred during checkout. Please try again.'
//       );
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
//   const { cart, clearCart, removeFromCart } = useCart(); 
//   const navigate = useNavigate();

//   const calculateTotal = () => {
//     return Array.from(selectedItems).reduce(
//       (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
//       0
//     );
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);
//     setError(null);

//     if (!stripe || !elements) {
//       setError('Stripe has not been initialized.');
//       setProcessing(false);
//       return;
//     }

//     try {

//       const total = calculateTotal();
//       console.log('Calculated total:', total); // Debug log
  
//       const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
//         amount: total
//       }, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       console.log('Received client secret'); // Debug log

//       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement),
//           billing_details: {
//             // Add any collected billing details here
//           }
//         }
//       });

//       if (stripeError) {
//         console.error('Stripe error:', stripeError);
//         setError(stripeError.message);
//         setProcessing(false);
//         return;
//       }

//       if (paymentIntent.status === 'succeeded') {
//         console.log('Payment successful, creating order...');

//         const selectedProducts = Array.from(selectedItems).map(index => ({
//           product: cart[index].product._id,
//           quantity: quantities[index],
//           customization: cart[index].customization
//         }));

//         await axios.post('/api/orders', {
//           products: selectedProducts,
//           totalAmount: total,
//           paymentMethod: 'stripe',
//           paymentId: paymentIntent.id
//         }, {
//           headers: {
//             // 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         console.log('Order created successfully:', orderResponse.data);

//         // Remove purchased items from cart
//         for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
//           await removeFromCart(index);
//         }

//         navigate('/orders');
//       }
//     } catch (error) {
//       console.error('Payment error:', error);
//       setError(error.response?.data?.error?.message || 
//         error.message || 
//         'An error occurred during payment. Please try again.');
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