// src/pages/Cart.js
import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import CheckoutForm from '../components/CheckoutForm';
import { Checkbox } from "../components/ui/checkbox";  
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
  const navigate = useNavigate(); 
  const { cart, removeFromCart, updateCartItem} = useCart();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const initialQuantities = cart.reduce((acc, item, index) => ({
      ...acc,
      [index]: item.quantity || 1
    }), {});
    setQuantities(initialQuantities);
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
    if (newQuantity > 0 && newQuantity <= 100) {
      setQuantities({ ...quantities, [index]: newQuantity });
      await updateCartItem(index, { quantity: newQuantity });
    }
  };

  const updateDescription = async (index, description) => {
    await updateCartItem(index, { description });
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
                      src={item.customization?.preview || item.product.images?.[0]?.data}
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
                    

                    {/* Template Information */}
                    {item.customization?.template && (
                          <p className="text-sm text-gray-600">
                            Template: {item.customization.template.name}
                          </p>
                        )}

                        {/* Required Fields */}
                        {item.customization?.requiredFields?.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="mt-2">
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
                          <div key={fieldIndex} className="mt-2">
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


                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Order Description</label>
                    <textarea
                      value={item.customization?.description || ''}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      rows="2"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add any special instructions..."
                    />
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
