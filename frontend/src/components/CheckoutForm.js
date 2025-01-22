// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.basePrice, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      // Create payment intent
      const { data: { clientSecret } } = await axios.post('/api/create-payment-intent', {
        amount: Math.round(calculateTotal() * 100) // Convert to cents
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order
        await axios.post('/api/orders', {
          products: cart.map(item => ({
            product: item.product._id,
            quantity: 1,
            customization: {
              customImage: item.customization?.customImage,
              customText: item.customization?.customText,
              preview: item.preview
            }
          })),
          totalAmount: calculateTotal(),
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Clear cart and redirect
        clearCart();
        navigate('/order-success');
      }
    } catch (error) {
      setError('An error occurred during payment. Please try again.');
      console.error('Payment error:', error);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
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
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6">
        <p className="text-lg font-bold mb-4">
          Total: ${calculateTotal().toFixed(2)}
        </p>
        <button
          type="submit"
          disabled={!stripe || processing}
          className={`w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold
            ${(!stripe || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>By clicking "Pay Now", you agree to our terms and conditions.</p>
        <p className="mt-2">
          Your payment information is processed securely by Stripe. We don't store your card details.
        </p>
      </div>
    </form>
  );
};

export default CheckoutForm;