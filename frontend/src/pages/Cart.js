// src/pages/Cart.js
import React from 'react';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
  const { cart, removeFromCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-1/3">
                    <img
                      src={item.customization?.preview || item.product.templates[0]?.data}
                      alt={item.product.name}
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{item.product.name}</h3>
                    <p className="text-gray-600 mb-2">Quantity: {item.quantity}</p>
                    <p className="font-semibold mb-2">
                      ${(item.product.basePrice * item.quantity).toFixed(2)}
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Total: ${total.toFixed(2)}</h3>
            </div>
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;




// // working properly
// // src/pages/Cart.js
// import React from 'react';
// import { useCart } from '../context/CartContext';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import CheckoutForm from '../components/CheckoutForm';

// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// const Cart = () => {
//   const { cart, removeFromCart } = useCart();

//   const total = cart.reduce((sum, item) => sum + item.product.basePrice, 0);

//   return (
//     <div className="max-w-4xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
//       {cart.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="space-y-4 mb-8">
//             {cart.map((item, index) => (
//               <div key={index} className="bg-white rounded-lg shadow-md p-4 flex items-center">
//                <img
//                 src={item.product.templates[0].data}
//                 alt={item.product.name}
//                 className="w-full h-48 object-cover mb-4 rounded"
//               />
//                   <div className="ml-4 flex-grow">
//                   <h3 className="font-bold">{item.product.name}</h3>
//                   <p className="text-gray-600">${item.product.basePrice}</p>
//                 </div>
//                 <button
//                   onClick={() => removeFromCart(index)}
//                   className="text-red-500 hover:text-red-700"
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="mb-4">
//               <h3 className="text-xl font-bold">Total: ${total}</h3>
//             </div>
//             <Elements stripe={stripePromise}>
//               <CheckoutForm amount={total} />
//             </Elements>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };



// export default Cart;
