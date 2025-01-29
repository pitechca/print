// src/pages/Cart.js
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import CheckoutForm from '../components/CheckoutForm';
import { Checkbox } from "../components/ui/checkbox";  // lowercase 'checkbox'
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
  const { cart, removeFromCart } = useCart();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [quantities, setQuantities] = useState(
    cart.reduce((acc, item, index) => ({ ...acc, [index]: item.quantity }), {})
  );

  const toggleItem = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cart.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.map((_, index) => index)));
    }
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity > 0 && newQuantity <= 100) {
      setQuantities({ ...quantities, [index]: newQuantity });
    }
  };

  const calculateTotal = () => {
    return Array.from(selectedItems).reduce(
      (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
      0
    );
  };

  const handlePayPalApprove = async (data, actions) => {
    try {
      // Capture the funds from the transaction
      const details = await actions.order.capture();
      console.log('PayPal payment completed:', details);
  
      // Create order in your database
      const selectedProducts = Array.from(selectedItems).map(index => ({
        product: cart[index].product._id,
        quantity: quantities[index],
        customization: cart[index].customization
      }));
  
      await axios.post('/api/orders', {
        products: selectedProducts,
        totalAmount: calculateTotal(),
        paymentMethod: 'paypal',
        paymentId: details.id,
        paymentDetails: details
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      // Remove purchased items from cart
      for (const index of Array.from(selectedItems).sort((a, b) => b - a)) {
        await removeFromCart(index);
      }
  
      navigate('/orders');
    } catch (error) {
      console.error('PayPal payment error:', error);
      // Handle error appropriately
    }
  };

  const renderPaymentMethod = () => {
    switch (paymentMethod) {
      case 'stripe':
        return (
          <Elements stripe={stripePromise}>
            <CheckoutForm selectedItems={selectedItems} quantities={quantities} />
          </Elements>
        );
      case 'paypal':
        return (
          <PayPalScriptProvider options={{ "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID }}>
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: calculateTotal().toFixed(2)
                    }
                  }]
                });
              }}
              onApprove={handlePayPalApprove}
            />
          </PayPalScriptProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      
      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty</p>
      ) : (
        <>
          <div className="mb-4 flex items-center">
            <Checkbox
              checked={selectedItems.size === cart.length}
              onCheckedChange={toggleSelectAll}
              className="mr-2"
            />
            <span>Select All Items</span>
          </div>

          <div className="space-y-4 mb-8">
            {cart.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-2"
                  />
                  
                  <div className="w-1/3">
                    <img
                      src={item.customization?.preview || item.product.templates[0]?.data}
                      alt={item.product.name}
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{item.product.name}</h3>
                    
                    <div className="flex items-center space-x-2 my-2">
                      <button 
                        onClick={() => updateQuantity(index, quantities[index] - 1)}
                        className="px-2 py-1 border rounded"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantities[index]}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                        className="w-16 text-center border rounded"
                        min="1"
                        max="100"
                      />
                      <button 
                        onClick={() => updateQuantity(index, quantities[index] + 1)}
                        className="px-2 py-1 border rounded"
                      >
                        +
                      </button>
                    </div>

                    <p className="font-semibold mb-2">
                      ${(item.product.basePrice * quantities[index]).toFixed(2)}
                    </p>
                    
                    {item.customization?.customText && (
                      <p className="text-sm text-gray-600 mb-1">
                        Custom Text: {item.customization.customText}
                      </p>
                    )}
                    
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.size > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">
                  Total: ${calculateTotal().toFixed(2)}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method
                  </label>
                  <Select onValueChange={setPaymentMethod} defaultValue="stripe">
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Credit Card (Visa/Mastercard)</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="applepay">Apple Pay</SelectItem>
                      <SelectItem value="googlepay">Google Pay</SelectItem>
                      <SelectItem value="klarna">Klarna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderPaymentMethod()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cart;




// // owrking properly but doesn't have cart update (quantity)
// // src/pages/Cart.js
// import React from 'react';
// import { useCart } from '../context/CartContext';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import CheckoutForm from '../components/CheckoutForm';

// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// const Cart = () => {
//   const { cart, removeFromCart } = useCart();
//   const total = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
//       {cart.length === 0 ? (
//         <p className="text-gray-600">Your cart is empty</p>
//       ) : (
//         <>
//           <div className="space-y-4 mb-8">
//             {cart.map((item, index) => (
//               <div key={index} className="bg-white rounded-lg shadow-md p-4">
//                 <div className="flex items-start space-x-4">
//                   <div className="w-1/3">
//                     <img
//                       src={item.customization?.preview || item.product.templates[0]?.data}
//                       alt={item.product.name}
//                       className="w-full h-48 object-contain rounded-lg"
//                     />
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="text-lg font-bold">{item.product.name}</h3>
//                     <p className="text-gray-600 mb-2">Quantity: {item.quantity}</p>
//                     <p className="font-semibold mb-2">
//                       ${(item.product.basePrice * item.quantity).toFixed(2)}
//                     </p>
//                     {item.customization?.customText && (
//                       <p className="text-sm text-gray-600 mb-1">
//                         Custom Text: {item.customization.customText}
//                       </p>
                      
//                     )}
//                     <button
//                       onClick={() => removeFromCart(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="mb-4">
//               <h3 className="text-xl font-bold">Total: ${total.toFixed(2)}</h3>
//             </div>
//             <Elements stripe={stripePromise}>
//               <CheckoutForm />
//             </Elements>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Cart;


// // // working properly
// // // src/pages/Cart.js
// // import React from 'react';
// // import { useCart } from '../context/CartContext';
// // import { loadStripe } from '@stripe/stripe-js';
// // import { Elements } from '@stripe/react-stripe-js';
// // import CheckoutForm from '../components/CheckoutForm';

// // const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// // const Cart = () => {
// //   const { cart, removeFromCart } = useCart();

// //   const total = cart.reduce((sum, item) => sum + item.product.basePrice, 0);

// //   return (
// //     <div className="max-w-4xl mx-auto">
// //       <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
// //       {cart.length === 0 ? (
// //         <p>Your cart is empty</p>
// //       ) : (
// //         <>
// //           <div className="space-y-4 mb-8">
// //             {cart.map((item, index) => (
// //               <div key={index} className="bg-white rounded-lg shadow-md p-4 flex items-center">
// //                <img
// //                 src={item.product.templates[0].data}
// //                 alt={item.product.name}
// //                 className="w-full h-48 object-cover mb-4 rounded"
// //               />
// //                   <div className="ml-4 flex-grow">
// //                   <h3 className="font-bold">{item.product.name}</h3>
// //                   <p className="text-gray-600">${item.product.basePrice}</p>
// //                 </div>
// //                 <button
// //                   onClick={() => removeFromCart(index)}
// //                   className="text-red-500 hover:text-red-700"
// //                 >
// //                   Remove
// //                 </button>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="bg-white rounded-lg shadow-md p-6">
// //             <div className="mb-4">
// //               <h3 className="text-xl font-bold">Total: ${total}</h3>
// //             </div>
// //             <Elements stripe={stripePromise}>
// //               <CheckoutForm amount={total} />
// //             </Elements>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // };



// // export default Cart;
