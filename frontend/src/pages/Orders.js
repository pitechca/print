// src/pages/Orders.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const handleDownloadImage = async (imageData, fileName) => {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(imageData);
    const blob = await base64Response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image. Please try again.');
  }
};

const downloadOriginalImage = async (orderId, fieldId, productIndex) => {
  try {
    const response = await axios.get(
      `/api/orders/${orderId}/original-image/${fieldId}?productIndex=${productIndex}`,
      {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        responseType: 'blob'
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    
    // Try to use original filename from metadata if available
    const filename = `original_${fieldId}.${response.data.type.split('/')[1] || 'png'}`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading original image:', error);
    
    // More detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      alert(`Failed to download original image: ${error.response.data.error || 'Unknown server error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      alert('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
      alert('Error setting up download request');
    }
  }
};

const ImageDownloadButton = ({ imageData, fileName, label }) => (
  <button
    onClick={() => handleDownloadImage(imageData, fileName)}
    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
  >
    {label}
  </button>
);

const CustomizationDetails = ({ customization, orderId, productIndex }) => {
  if (!customization) return null;

  return (
    <div className="mt-4 space-y-3">
      {/* Preview Image with Download */}
      {customization.preview && (
        <div className="flex items-center space-x-2">
          <img
            src={customization.preview}
            alt="Preview"
            className="w-20 h-20 object-contain border rounded bg-white"
          />
          <ImageDownloadButton
            imageData={customization.preview}
            fileName={`order-${orderId}-product-${productIndex}-preview.png`}
            label="Download Preview"
          />
        </div>
      )}

      {/* Template Info */}
      {customization.template && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Template:</span> {customization.template.name}
        </div>
      )}

      {/* Custom Fields */}
      {customization.customFields?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Custom Elements:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customization.customFields.map((field, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{field.type}:</span>
                  {field.type === 'text' ? (
                    <p className="mt-1 text-gray-600">{field.content}</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <img
                        src={field.content}
                        alt={`Custom ${field.type}`}
                        className="w-20 h-20 object-contain border rounded bg-white"
                      />
                      <ImageDownloadButton
                        imageData={field.content}
                        fileName={`order-${orderId}-product-${productIndex}-custom-${idx}.png`}
                        label="Download Image"
                      />
                        <button
                          onClick={() => downloadOriginalImage(orderId, field.fieldId, productIndex)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                        >
                          Download Original
                        </button>
                    </div>
                  )}
                  {field.properties && (
                    <div className="mt-1 text-xs text-gray-500">
                      {field.properties.fontFamily && (
                        <p>Font: {field.properties.fontFamily}</p>
                      )}
                      {field.properties.fontSize && (
                        <p>Size: {field.properties.fontSize}px</p>
                      )}
                      {field.properties.fill && (
                        <p>Color: {field.properties.fill}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Fields */}
      {customization.requiredFields?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Required Fields:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customization.requiredFields.map((field, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">{field.type}:</span>
                  {field.type === 'text' ? (
                    <p className="mt-1 text-gray-600">{field.value}</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <img
                        src={field.value}
                        alt={`Required ${field.type}`}
                        className="w-20 h-20 object-contain border rounded bg-white"
                      />
                      <ImageDownloadButton
                        imageData={field.value}
                        fileName={`order-${orderId}-product-${productIndex}-required-${idx}.png`}
                        label="Download Image"
                      />                     
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {customization.description && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Special Instructions:</span>
          <p className="mt-1">{customization.description}</p>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order) => {
    try {
      for (const item of order.products) {
        await addToCart({
          product: item.product,
          quantity: item.quantity,
          customization: item.customization
        });
      }
      setError(null);
    } catch (error) {
      console.error('Error reordering:', error);
      setError('Failed to reorder items. Please try again.');
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
      setError(null);
    } catch (error) {
      console.error('Error downloading order:', error);
      setError('Failed to download order. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {user?.isAdmin ? 'All Orders' : 'My Orders'}
      </h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {orders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">
                      Order ID: <span className="font-medium">{order._id}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium capitalize">{order.status}</span>
                    </p>
                    <p className="font-bold text-lg mt-1">
                      Total: ${order.totalAmount.toFixed(2)}
                    </p>
                      {/* Coupon Display */}
              {order.coupon && (
                <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-800">Coupon Applied:</span>
                      <span className="ml-2 text-gray-600">{order.coupon.code}</span>
                    </div>
                    <div className="text-green-600 font-medium">
                      -${order.coupon.discountAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Reorder
                    </button>
                    {user?.isAdmin && (
                      <button
                        onClick={() => handleDownloadOrder(order)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-6">
                  {order.products.map((item, index) => (
                    <div key={index} className={index > 0 ? "border-t pt-6" : ""}>
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={item.customization?.preview || item.product.images?.[0]?.data}
                            alt={item.product.name}
                            className="w-full h-full object-contain rounded border bg-gray-50"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg">{item.product.name}</h3>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              <p className='text-sm text-gray-600'>Description: {item.customization.description}</p>
                            </div>
                            <button
                              onClick={() => setExpandedOrder(expandedOrder === `${order._id}-${index}` ? null : `${order._id}-${index}`)}
                              className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                              {expandedOrder === `${order._id}-${index}` ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>

                          {/* Customization Details */}
                          {expandedOrder === `${order._id}-${index}` && (
                            <CustomizationDetails 
                              customization={item.customization}
                              orderId={order._id}
                              productIndex={index}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;

