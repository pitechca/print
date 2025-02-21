

// src/pages/Cart.js
import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { Checkbox } from "../components/ui/checkbox";  
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
  const navigate = useNavigate(); 
  const { cart, removeFromCart, updateCartItem} = useCart();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [quantities, setQuantities] = useState({});
  const [expandedDetails, setExpandedDetails] = useState(new Set());

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const toggleDetails = (index) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDetails(newExpanded);
  };

  useEffect(() => {
    const initialQuantities = cart.reduce((acc, item, index) => ({
      ...acc,
      [index]: item.quantity || 1
    }), {});
    setQuantities(initialQuantities);

    // Auto-select all items
    setSelectedItems(new Set(cart.map((_, index) => index)));
  }, [cart]);

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

  const updateQuantity = async (index, newQuantity) => {
    const item = cart[index];
    const minOrder = item.product.minimumOrder || 1;
  
    // Check minimum order quantity
    if (newQuantity < minOrder) {
      setCouponError(`Minimum order quantity for ${item.product.name} is ${minOrder}`);
      return;
    }
  
    // Check stock status
    if (!item.product.inStock) {
      setCouponError(`${item.product.name} is currently out of stock`);
      return;
    }
  
    if (newQuantity > 0 && newQuantity <= 10000) {
      setQuantities({ ...quantities, [index]: newQuantity });
      await updateCartItem(index, { quantity: newQuantity });
      setCouponError(null);
    }
  };

  // Coupon validation handler
  const validateCoupon = async () => {
    if (!couponCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      // Calculate total before tax for coupon validation
      const orderTotal = Array.from(selectedItems).reduce(
        (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
        0
      );

      const response = await axios.post('/api/coupons/validate', 
        { couponCode, orderTotal },
        { 
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          } 
        }
      );

      // Reset any previous errors
      setCouponError(null);
      // Store the applied coupon details
      setAppliedCoupon({
        code: couponCode,
        discountAmount: response.data.discountAmount,
        details: response.data.couponDetails
      });
    } catch (error) {
      setCouponError(error.response?.data?.error || 'Failed to validate coupon');
      setAppliedCoupon(null);
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError(null);
  };


  const calculateItemPrice = (item, index) => {
    const qty = quantities[index];
    
    // Calculate unit price based on price tiers
    let unitPrice = item.product.basePrice;
    if (item.product.pricingTiers?.length > 0) {
      const applicableTier = item.product.pricingTiers
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find(tier => qty >= tier.minQuantity && 
          (!tier.maxQuantity || qty <= tier.maxQuantity));
      
      if (applicableTier) {
        unitPrice = applicableTier.price;
      }
    }
    
    return (unitPrice * qty).toFixed(2);
  };

  // Tax calculation function with coupon integration
  // Filter out invalid cart indices before calculations
  const calculateTaxAndTotal = () => {
    const validSelectedItems = Array.from(selectedItems).filter(index => index < cart.length);
    
    const itemTotals = validSelectedItems.map(index => {
      const item = cart[index];
      const qty = quantities[index];
      
      // Calculate unit price based on price tiers
      let unitPrice = item.product.basePrice;
      if (item.product.pricingTiers?.length > 0) {
        const applicableTier = item.product.pricingTiers
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find(tier => qty >= tier.minQuantity && 
            (!tier.maxQuantity || qty <= tier.maxQuantity));
        
        if (applicableTier) {
          unitPrice = applicableTier.price;
        }
      }
      
      return {
        subtotal: unitPrice * qty,
        hasGST: item.product.hasGST,
        hasPST: item.product.hasPST
      };
    });
  
  
    
    const subtotal = itemTotals.reduce((sum, item) => sum + item.subtotal, 0);
    const gstTotal = itemTotals.reduce((sum, item) => 
      item.hasGST ? sum + (item.subtotal * 0.05) : sum, 0);
    const pstTotal = itemTotals.reduce((sum, item) => 
      item.hasPST ? sum + (item.subtotal * 0.07) : sum, 0);
  
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const discountedSubtotal = subtotal - discountAmount;
  
    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      gstTotal,
      pstTotal,
      total: discountedSubtotal + gstTotal + pstTotal
    };
  };
  

  const renderPaymentMethod = () => {
    const { subtotal, discountAmount, discountedSubtotal, gstTotal, pstTotal, total } = calculateTaxAndTotal();
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Credit Card Payment</h3>
          <div className="flex gap-3">
            <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M293.2 348.7h-47.1l29.5-179.4h47.1L293.2 348.7z" fill="#00579F"/>
              <path d="M518.6 176.3c-9.3-3.7-24.1-7.7-42.4-7.7-46.8 0-79.8 24.5-80 59.4-0.2 25.9 23.6 40.2 41.5 48.8 18.4 8.8 24.6 14.4 24.6 22.3-0.1 12-14.8 17.5-28.4 17.5-19 0-29-2.8-44.6-9.6l-6.1-2.9-6.7 40.7c11.1 5 31.6 9.4 52.9 9.6 49.9 0 82.3-24.2 82.7-61.7 0.2-20.5-12.4-36.1-39.7-49-16.5-8.3-26.7-13.9-26.6-22.3 0-7.5 8.6-15.5 27.1-15.5 15.5-0.2 26.7 3.3 35.4 6.9l4.2 2.1 6.1-38.6z" fill="#00579F"/>
            </svg>
            <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M465.5 95.5h-151v260h151V95.5z" fill="#FF5F00"/>
              <path d="M324.3 225.5c0-53 24.9-100.2 63.7-130.5-28.3-22.3-64.1-35.6-103-35.6C193 59.4 118.4 134 118.4 225.5s74.6 166.7 166.7 166.7c38.9 0 74.7-13.3 103-35.6-38.8-30.3-63.7-77.5-63.7-130.5z" fill="#EB001B"/>
              <path d="M657.8 225.5c0 92.1-74.6 166.7-166.7 166.7-38.9 0-74.7-13.3-103-35.6 38.8-30.3 63.7-77.5 63.7-130.5s-24.9-100.2-63.7-130.5c28.3-22.3 64.1-35.6 103-35.6 92.1 0 166.7 74.6 166.7 166.7z" fill="#F79E1B"/>
            </svg>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {/* Coupon Section */}
          <div className="mb-4">
            <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700">
              Coupon Code
            </label>
            <div className="flex space-x-2 mt-1">
              <input
                type="text"
                id="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-grow border rounded px-3 py-2"
              />
              {appliedCoupon ? (
                <button
                  onClick={removeCoupon}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={validateCoupon}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Apply
                </button>
              )}
            </div>
            {couponError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{couponError}</AlertDescription>
              </Alert>
            )}
            {appliedCoupon && (
              <div className="mt-2 text-sm text-green-600">
                Coupon "{appliedCoupon.code}" applied successfully
              </div>
            )}
          </div>

          {/* Order Summary Details */}
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          {/* Coupon Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          {gstTotal > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>${gstTotal.toFixed(2)}</span>
            </div>
          )}
          {pstTotal > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>PST (7%)</span>
              <span>${pstTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="h-px bg-gray-200 my-2"></div>
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* <Elements stripe={stripePromise}>
          <CheckoutForm 
            selectedItems={selectedItems} 
            quantities={quantities} 
            total={total} 
            coupon={appliedCoupon}
          />
        </Elements> */}
         <Elements stripe={stripePromise} options={{
          locale: 'en',
          appearance: {
            theme: 'stripe'
          }
        }}>
          <CheckoutForm 
            selectedItems={selectedItems} 
            quantities={quantities} 
            total={total} 
            coupon={appliedCoupon}
          />
        </Elements>
      </div>
    );
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
              <div className="flex flex-col lg:flex-row w-full"> {/* Changed to flex-col for mobile */}
                <div className="flex items-start space-x-4 flex-1">
                  <Checkbox
                    checked={selectedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-2"
                  />
                  
                  {/* Image Section */}
                  <div className="w-full lg:w-1/3">
                    <img
                      src={item.customization?.preview || item.product?.images?.[0]?.data || item.customization?.customFields?.find(field => field.type === 'image')?.content}
                      alt={item.product?.name}
                      className="w-full h-48 object-contain rounded-lg"
                      onError={(e) => {
                        console.error('Image preview failed:', {
                          preview: item.customization?.preview,
                          customFields: item.customization?.customFields
                        });
                      }}
                    />
                  </div>

                  {/* Product Details Section */}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold">{item.product?.name}</h3>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
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
                        className="w-32 text-center border rounded"
                        min={item.product?.minimumOrder || 1}
                        max="10000"
                      />
                      <button 
                        onClick={() => updateQuantity(index, quantities[index] + 1)}
                        className="px-2 py-1 border rounded"
                      >
                        +
                      </button>
                    </div>
                  
                    {item.product?.minimumOrder > 1 && (
                      <div>
                        Minimum order: {item.product.minimumOrder} units
                      </div>
                    )}
                    {/* Order Description */}
                    <div className="text-gray-800">
                      <p className="font-medium">Order Description:</p>
                      <p>{item.customization?.description || 'No Special Instruction'}</p>
                    </div>

                    {/* Customization Details Toggle */}
                    <button
                      onClick={() => toggleDetails(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {expandedDetails.has(index) ? 'Hide Customization Details' : 'Show Customization Details'}
                    </button>

                    {/* Expanded Customization Details */}
                    {expandedDetails.has(index) && (
                      <div className="space-y-3"
                      style={{maxWidth: 200 +'px',
                        overflowX: 'hidden',
                     }}

                      >
                        {item.customization?.template && (
                          <p className="text-sm text-gray-600">
                            Template Customization: {item.customization.template.name}
                          </p>
                        )}

                        {/* Required Fields */}
                        {item.customization?.requiredFields?.map((field, fieldIndex) => (
                          <div key={fieldIndex}>
                            <p className="text-sm font-medium">{field.type}:</p>
                            {field.type === 'text' ? (
                              <p className="text-sm text-gray-600">{field.value}</p>
                            ) : (
                              <img 
                                src={field.value} 
                                alt={`${field.type} upload`}
                                className="w-20 h-20 object-contain border rounded"
                              />
                            )}
                          </div>
                        ))}

                        {/* Custom Fields */}
                        {item.customization?.customFields?.map((field, fieldIndex) => (
                          <div key={fieldIndex}>
                            <p className="text-sm font-medium">Custom {field.type}:</p>
                            {field.type === 'text' ? (
                              <p className="text-sm text-gray-600">{field.content}</p>
                            ) : (
                              <img 
                                src={field.content} 
                                alt="Custom upload"
                                className="w-20 h-20 object-contain border rounded"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price and Remove Section */}
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                    <div className="font-semibold text-right">
                      Price: ${calculateItemPrice(item, index)}
                      {item.product?.hasGST && <span className="text-sm">+ GST (5%)</span>}
                      {item.product?.hasPST && <span className="text-sm">+ PST (7%)</span>}
                    </div>

                              {/* Stock Status & Minimum Order */}
                              {!item.product?.inStock && (
                      <div className="text-red-600 font-medium">
                        This item is currently out of stock
                      </div>
                    )}
          
                    {/* Price Tiers */}
                    {item.product?.pricingTiers?.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Quantity Pricing:</p>
                        {item.product.pricingTiers.map((tier, idx) => (
                          <p key={idx} className={`text-sm ${
                            quantities[index] >= tier.minQuantity && 
                            (!tier.maxQuantity || quantities[index] <= tier.maxQuantity)
                              ? 'text-green-600 font-medium'
                              : 'text-gray-600'
                          }`}>
                            {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units: 
                            ${tier.price} each
                          </p>
                        ))}
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          {selectedItems.size > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  Order Summary
                </h3>
                <div className="h-px bg-gray-200 my-4"></div>
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






// // work without stripe
// // src/pages/Cart.js
// import React, { useState, useEffect } from 'react'; 
// import { useNavigate } from 'react-router-dom'; 
// import axios from 'axios';
// import { useCart } from '../context/CartContext';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import CheckoutForm from '../components/CheckoutForm';
// import { Checkbox } from "../components/ui/checkbox";  
// import { Alert, AlertDescription } from '../components/ui/alert';
// import { AlertCircle } from 'lucide-react';

// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// const Cart = () => {
//   const navigate = useNavigate(); 
//   const { cart, removeFromCart, updateCartItem} = useCart();
//   const [selectedItems, setSelectedItems] = useState(new Set());
//   const [quantities, setQuantities] = useState({});
//   const [expandedDetails, setExpandedDetails] = useState(new Set());

//   // Coupon state
//   const [couponCode, setCouponCode] = useState('');
//   const [couponError, setCouponError] = useState(null);
//   const [appliedCoupon, setAppliedCoupon] = useState(null);
  
//   const toggleDetails = (index) => {
//     const newExpanded = new Set(expandedDetails);
//     if (newExpanded.has(index)) {
//       newExpanded.delete(index);
//     } else {
//       newExpanded.add(index);
//     }
//     setExpandedDetails(newExpanded);
//   };

//   useEffect(() => {
//     const initialQuantities = cart.reduce((acc, item, index) => ({
//       ...acc,
//       [index]: item.quantity || 1
//     }), {});
//     setQuantities(initialQuantities);

//     // Auto-select all items
//     setSelectedItems(new Set(cart.map((_, index) => index)));
//   }, [cart]);

//   const toggleItem = (index) => {
//     const newSelected = new Set(selectedItems);
//     if (newSelected.has(index)) {
//       newSelected.delete(index);
//     } else {
//       newSelected.add(index);
//     }
//     setSelectedItems(newSelected);
//   };

//   const toggleSelectAll = () => {
//     if (selectedItems.size === cart.length) {
//       setSelectedItems(new Set());
//     } else {
//       setSelectedItems(new Set(cart.map((_, index) => index)));
//     }
//   };

//   const updateQuantity = async (index, newQuantity) => {
//     const item = cart[index];
//     const minOrder = item.product.minimumOrder || 1;
  
//     // Check minimum order quantity
//     if (newQuantity < minOrder) {
//       setCouponError(`Minimum order quantity for ${item.product.name} is ${minOrder}`);
//       return;
//     }
  
//     // Check stock status
//     if (!item.product.inStock) {
//       setCouponError(`${item.product.name} is currently out of stock`);
//       return;
//     }
  
//     if (newQuantity > 0 && newQuantity <= 10000) {
//       setQuantities({ ...quantities, [index]: newQuantity });
//       await updateCartItem(index, { quantity: newQuantity });
//       setCouponError(null);
//     }
//   };

//   // Coupon validation handler
//   const validateCoupon = async () => {
//     if (!couponCode) {
//       setCouponError('Please enter a coupon code');
//       return;
//     }

//     try {
//       // Calculate total before tax for coupon validation
//       const orderTotal = Array.from(selectedItems).reduce(
//         (sum, index) => sum + (cart[index].product.basePrice * quantities[index]),
//         0
//       );

//       const response = await axios.post('/api/coupons/validate', 
//         { couponCode, orderTotal },
//         { 
//           headers: { 
//             'Authorization': `Bearer ${localStorage.getItem('token')}` 
//           } 
//         }
//       );

//       // Reset any previous errors
//       setCouponError(null);
//       // Store the applied coupon details
//       setAppliedCoupon({
//         code: couponCode,
//         discountAmount: response.data.discountAmount,
//         details: response.data.couponDetails
//       });
//     } catch (error) {
//       setCouponError(error.response?.data?.error || 'Failed to validate coupon');
//       setAppliedCoupon(null);
//     }
//   };

//   // Remove applied coupon
//   const removeCoupon = () => {
//     setCouponCode('');
//     setAppliedCoupon(null);
//     setCouponError(null);
//   };


//   const calculateItemPrice = (item, index) => {
//     const qty = quantities[index];
    
//     // Calculate unit price based on price tiers
//     let unitPrice = item.product.basePrice;
//     if (item.product.pricingTiers?.length > 0) {
//       const applicableTier = item.product.pricingTiers
//         .sort((a, b) => b.minQuantity - a.minQuantity)
//         .find(tier => qty >= tier.minQuantity && 
//           (!tier.maxQuantity || qty <= tier.maxQuantity));
      
//       if (applicableTier) {
//         unitPrice = applicableTier.price;
//       }
//     }
    
//     return (unitPrice * qty).toFixed(2);
//   };

//   // Tax calculation function with coupon integration
//   // Filter out invalid cart indices before calculations
//   const calculateTaxAndTotal = () => {
//     const validSelectedItems = Array.from(selectedItems).filter(index => index < cart.length);
    
//     const itemTotals = validSelectedItems.map(index => {
//       const item = cart[index];
//       const qty = quantities[index];
      
//       // Calculate unit price based on price tiers
//       let unitPrice = item.product.basePrice;
//       if (item.product.pricingTiers?.length > 0) {
//         const applicableTier = item.product.pricingTiers
//           .sort((a, b) => b.minQuantity - a.minQuantity)
//           .find(tier => qty >= tier.minQuantity && 
//             (!tier.maxQuantity || qty <= tier.maxQuantity));
        
//         if (applicableTier) {
//           unitPrice = applicableTier.price;
//         }
//       }
      
//       return {
//         subtotal: unitPrice * qty,
//         hasGST: item.product.hasGST,
//         hasPST: item.product.hasPST
//       };
//     });
  
  
    
//     const subtotal = itemTotals.reduce((sum, item) => sum + item.subtotal, 0);
//     const gstTotal = itemTotals.reduce((sum, item) => 
//       item.hasGST ? sum + (item.subtotal * 0.05) : sum, 0);
//     const pstTotal = itemTotals.reduce((sum, item) => 
//       item.hasPST ? sum + (item.subtotal * 0.07) : sum, 0);
  
//     const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
//     const discountedSubtotal = subtotal - discountAmount;
  
//     return {
//       subtotal,
//       discountAmount,
//       discountedSubtotal,
//       gstTotal,
//       pstTotal,
//       total: discountedSubtotal + gstTotal + pstTotal
//     };
//   };
  

//   const renderPaymentMethod = () => {
//     const { subtotal, discountAmount, discountedSubtotal, gstTotal, pstTotal, total } = calculateTaxAndTotal();
    
//     return (
//       <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">

//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold text-gray-900">Credit Card Payment</h3>
//           <div className="flex gap-3">
//             <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M293.2 348.7h-47.1l29.5-179.4h47.1L293.2 348.7z" fill="#00579F"/>
//               <path d="M518.6 176.3c-9.3-3.7-24.1-7.7-42.4-7.7-46.8 0-79.8 24.5-80 59.4-0.2 25.9 23.6 40.2 41.5 48.8 18.4 8.8 24.6 14.4 24.6 22.3-0.1 12-14.8 17.5-28.4 17.5-19 0-29-2.8-44.6-9.6l-6.1-2.9-6.7 40.7c11.1 5 31.6 9.4 52.9 9.6 49.9 0 82.3-24.2 82.7-61.7 0.2-20.5-12.4-36.1-39.7-49-16.5-8.3-26.7-13.9-26.6-22.3 0-7.5 8.6-15.5 27.1-15.5 15.5-0.2 26.7 3.3 35.4 6.9l4.2 2.1 6.1-38.6z" fill="#00579F"/>
//             </svg>
//             <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M465.5 95.5h-151v260h151V95.5z" fill="#FF5F00"/>
//               <path d="M324.3 225.5c0-53 24.9-100.2 63.7-130.5-28.3-22.3-64.1-35.6-103-35.6C193 59.4 118.4 134 118.4 225.5s74.6 166.7 166.7 166.7c38.9 0 74.7-13.3 103-35.6-38.8-30.3-63.7-77.5-63.7-130.5z" fill="#EB001B"/>
//               <path d="M657.8 225.5c0 92.1-74.6 166.7-166.7 166.7-38.9 0-74.7-13.3-103-35.6 38.8-30.3 63.7-77.5 63.7-130.5s-24.9-100.2-63.7-130.5c28.3-22.3 64.1-35.6 103-35.6 92.1 0 166.7 74.6 166.7 166.7z" fill="#F79E1B"/>
//             </svg>
//           </div>
//         </div>

//         <div className="space-y-3 mb-6">
//           {/* Coupon Section */}
//           <div className="mb-4">
//             <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700">
//               Coupon Code
//             </label>
//             <div className="flex space-x-2 mt-1">
//               <input
//                 type="text"
//                 id="couponCode"
//                 value={couponCode}
//                 onChange={(e) => setCouponCode(e.target.value)}
//                 placeholder="Enter coupon code"
//                 className="flex-grow border rounded px-3 py-2"
//               />
//               {appliedCoupon ? (
//                 <button
//                   onClick={removeCoupon}
//                   className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                 >
//                   Remove
//                 </button>
//               ) : (
//                 <button
//                   onClick={validateCoupon}
//                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Apply
//                 </button>
//               )}
//             </div>
//             {couponError && (
//               <Alert variant="destructive" className="mt-2">
//                 <AlertCircle className="h-4 w-4" />
//                 <AlertDescription>{couponError}</AlertDescription>
//               </Alert>
//             )}
//             {appliedCoupon && (
//               <div className="mt-2 text-sm text-green-600">
//                 Coupon "{appliedCoupon.code}" applied successfully
//               </div>
//             )}
//           </div>

//           {/* Order Summary Details */}
//           <div className="flex justify-between text-gray-600">
//             <span>Subtotal</span>
//             <span>${subtotal.toFixed(2)}</span>
//           </div>
          
//           {/* Coupon Discount */}
//           {discountAmount > 0 && (
//             <div className="flex justify-between text-green-600">
//               <span>Coupon Discount</span>
//               <span>-${discountAmount.toFixed(2)}</span>
//             </div>
//           )}

//           {gstTotal > 0 && (
//             <div className="flex justify-between text-gray-600">
//               <span>GST (5%)</span>
//               <span>${gstTotal.toFixed(2)}</span>
//             </div>
//           )}
//           {pstTotal > 0 && (
//             <div className="flex justify-between text-gray-600">
//               <span>PST (7%)</span>
//               <span>${pstTotal.toFixed(2)}</span>
//             </div>
//           )}
//           <div className="h-px bg-gray-200 my-2"></div>
//           <div className="flex justify-between text-lg font-bold text-gray-900">
//             <span>Total</span>
//             <span>${total.toFixed(2)}</span>
//           </div>
//         </div>

//         <Elements stripe={stripePromise}>
//           <CheckoutForm 
//             selectedItems={selectedItems} 
//             quantities={quantities} 
//             total={total} 
//             coupon={appliedCoupon}
//           />
//         </Elements>
//       </div>
//     );
//   };

//    return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      
//       {cart.length === 0 ? (
//         <p className="text-gray-600">Your cart is empty</p>
//       ) : (
//         <>
//           <div className="mb-4 flex items-center">
//             <Checkbox
//               checked={selectedItems.size === cart.length}
//               onCheckedChange={toggleSelectAll}
//               className="mr-2"
//             />
//             <span>Select All Items</span>
//           </div>

//           <div className="space-y-4 mb-8">
//            {cart.map((item, index) => (
//             <div key={index} className="bg-white rounded-lg shadow-md p-4">
//               <div className="flex flex-col lg:flex-row w-full"> {/* Changed to flex-col for mobile */}
//                 <div className="flex items-start space-x-4 flex-1">
//                   <Checkbox
//                     checked={selectedItems.has(index)}
//                     onCheckedChange={() => toggleItem(index)}
//                     className="mt-2"
//                   />
                  
//                   {/* Image Section */}
//                   <div className="w-full lg:w-1/3">
//                     <img
//                       src={item.customization?.preview || item.product?.images?.[0]?.data || item.customization?.customFields?.find(field => field.type === 'image')?.content}
//                       alt={item.product?.name}
//                       className="w-full h-48 object-contain rounded-lg"
//                       onError={(e) => {
//                         console.error('Image preview failed:', {
//                           preview: item.customization?.preview,
//                           customFields: item.customization?.customFields
//                         });
//                       }}
//                     />
//                   </div>

//                   {/* Product Details Section */}
//                   <div className="flex-1 space-y-4">
//                     <h3 className="text-lg font-bold">{item.product?.name}</h3>
                    
//                     {/* Quantity Controls */}
//                     <div className="flex items-center space-x-2">
//                       <button 
//                         onClick={() => updateQuantity(index, quantities[index] - 1)}
//                         className="px-2 py-1 border rounded"
//                       >
//                         -
//                       </button>
//                       <input
//                         type="number"
//                         value={quantities[index]}
//                         onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
//                         className="w-16 text-center border rounded"
//                         min={item.product?.minimumOrder || 1}
//                         max="10000"
//                       />
//                       <button 
//                         onClick={() => updateQuantity(index, quantities[index] + 1)}
//                         className="px-2 py-1 border rounded"
//                       >
//                         +
//                       </button>
//                     </div>
                  
//                     {item.product?.minimumOrder > 1 && (
//                       <div>
//                         Minimum order: {item.product.minimumOrder} units
//                       </div>
//                     )}
//                     {/* Order Description */}
//                     <div className="text-gray-800">
//                       <p className="font-medium">Order Description:</p>
//                       <p>{item.customization?.description || 'No Special Instruction'}</p>
//                     </div>

//                     {/* Customization Details Toggle */}
//                     <button
//                       onClick={() => toggleDetails(index)}
//                       className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                     >
//                       {expandedDetails.has(index) ? 'Hide Customization Details' : 'Show Customization Details'}
//                     </button>

//                     {/* Expanded Customization Details */}
//                     {expandedDetails.has(index) && (
//                       <div className="space-y-3">
//                         {item.customization?.template && (
//                           <p className="text-sm text-gray-600">
//                             Template Customization: {item.customization.template.name}
//                           </p>
//                         )}

//                         {/* Required Fields */}
//                         {item.customization?.requiredFields?.map((field, fieldIndex) => (
//                           <div key={fieldIndex}>
//                             <p className="text-sm font-medium">{field.type}:</p>
//                             {field.type === 'text' ? (
//                               <p className="text-sm text-gray-600">{field.value}</p>
//                             ) : (
//                               <img 
//                                 src={field.value} 
//                                 alt={`${field.type} upload`}
//                                 className="w-20 h-20 object-contain border rounded"
//                               />
//                             )}
//                           </div>
//                         ))}

//                         {/* Custom Fields */}
//                         {item.customization?.customFields?.map((field, fieldIndex) => (
//                           <div key={fieldIndex}>
//                             <p className="text-sm font-medium">Custom {field.type}:</p>
//                             {field.type === 'text' ? (
//                               <p className="text-sm text-gray-600">{field.content}</p>
//                             ) : (
//                               <img 
//                                 src={field.content} 
//                                 alt="Custom upload"
//                                 className="w-20 h-20 object-contain border rounded"
//                               />
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   {/* Price and Remove Section */}
//                   <div className="flex flex-col items-end space-y-2">
//                     <button
//                       onClick={() => removeFromCart(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       Remove
//                     </button>
//                     <div className="font-semibold text-right">
//                       Price: ${calculateItemPrice(item, index)}
//                       {item.product?.hasGST && <span className="text-sm">+ GST (5%)</span>}
//                       {item.product?.hasPST && <span className="text-sm">+ PST (7%)</span>}
//                     </div>

//                               {/* Stock Status & Minimum Order */}
//                               {!item.product?.inStock && (
//                       <div className="text-red-600 font-medium">
//                         This item is currently out of stock
//                       </div>
//                     )}
          
//                     {/* Price Tiers */}
//                     {item.product?.pricingTiers?.length > 0 && (
//                       <div>
//                         <p className="font-medium text-sm">Quantity Pricing:</p>
//                         {item.product.pricingTiers.map((tier, idx) => (
//                           <p key={idx} className={`text-sm ${
//                             quantities[index] >= tier.minQuantity && 
//                             (!tier.maxQuantity || quantities[index] <= tier.maxQuantity)
//                               ? 'text-green-600 font-medium'
//                               : 'text-gray-600'
//                           }`}>
//                             {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units: 
//                             ${tier.price} each
//                           </p>
//                         ))}
//                       </div>
//                     )}
                    
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//           </div>

//           {selectedItems.size > 0 && (
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <div className="mb-6">
//                 <h3 className="text-xl font-bold mb-4 text-gray-900">
//                   Order Summary
//                 </h3>
//                 <div className="h-px bg-gray-200 my-4"></div>
//                 {renderPaymentMethod()}
//               </div>
//             </div>
//           )}
     




//         </>
//       )}
//     </div>
//   );
// };

// export default Cart;
