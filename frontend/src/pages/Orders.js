// src/pages/Orders.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order) => {
    for (const item of order.products) {
      await addToCart({
        product: item.product,
        quantity: item.quantity,
        customization: item.customization
      });
    }
  };

  const handleDownloadOrder = async (order) => {
    try {
      const { data } = await axios.get(`/api/orders/${order._id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading order:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {user?.isAdmin ? 'All Orders' : 'My Orders'}
      </h2>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Order ID: {order._id}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="font-bold">
                  Total: ${order.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReorder(order)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Reorder
                </button>
                {user?.isAdmin && (
                  <button
                    onClick={() => handleDownloadOrder(order)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {order.products.map((item, index) => (
                <div key={index} className="border-t pt-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-32">
                      <img
                        src={item.customization?.preview || item.product.templates[0]?.data}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.customization?.customText && (
                        <p className="text-sm text-gray-600">
                          Custom Text: {item.customization.customText}
                        </p>
                      )}
                      {item.customization?.description && (
                        <p className="text-sm text-gray-600">
                          Description: {item.customization.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;