// serc/components/OrderManagements.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort orders by date, newest first
      const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (base64Data, fileName) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' }); // Ensure CORS mode
      if (!response.ok) throw new Error('Image not available');
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. It may not be accessible.');
    }
  };

  
  const OrderDetails = ({ order }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Order Details #{order._id.slice(-6)}</h3>
        <button 
          onClick={() => setSelectedOrder(null)}
          className="text-gray-600 hover:text-gray-800"
        >
          ×
        </button>
      </div>

      {/* Order Summary Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-600">Customer Email:</p>
          <p className="font-semibold">{order.user.email}</p>
        </div>
        <div>
          <p className="text-gray-600">Order Date:</p>
          <p className="font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Total Amount:</p>
          <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Payment Method:</p>
          <p className="font-semibold">{order.paymentMethod}</p>
        </div>
      </div>

      {/* Coupon Information */}
      {order.coupon && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="text-md font-semibold mb-2">Coupon Applied</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-gray-600">Coupon Code:</p>
              <p className="font-semibold">{order.coupon.code}</p>
            </div>
            <div>
              <p className="text-gray-600">Discount:</p>
              <p className="font-semibold text-green-600">
                {order.coupon.discountType === 'percentage' 
                  ? `${order.coupon.discountValue}%` 
                  : `$${order.coupon.discountAmount.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Product Information */}
      <div className="space-y-6">
        {order.products.map((item, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-lg">{item.product.name}</h4>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
                
                {/* Template Information */}
                {item.customization?.template && (
                  <p className="text-gray-600">
                    Template: {item.customization.template.name}
                  </p>
                )}
              </div>
              <p className="font-semibold">
                ${(item.product.basePrice * item.quantity).toFixed(2)}
              </p>
            </div>

            {/* Customization Preview */}
            {item.customization?.preview && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Design Preview</h5>
                <div className="relative group">
                  <img
                    src={item.customization.preview}
                    alt="Design Preview"
                    className="w-full h-64 object-contain border rounded"
                  />
                  <button
                    onClick={() => downloadFile(
                      item.customization.preview,
                      `order-${order._id}-preview-${index}.png`
                    )}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            {item.customization?.description && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Special Instructions</h5>
                <p className="bg-gray-50 p-3 rounded">{item.customization.description}</p>
              </div>
            )}

            {item.customization && (
              <div className="space-y-4">
                {/* Required Fields */}
                {item.customization.requiredFields?.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    <h5 className="font-semibold mb-2">{field.type.charAt(0).toUpperCase() + field.type.slice(1)}:</h5>
                    {field.type === 'text' ? (
                      <p className="bg-gray-50 p-3 rounded">{field.value}</p>
                    ) : (
                      <div className="relative group">
                        <img
                          src={field.value}
                          alt={`${field.type} upload`}
                          className="w-full h-48 object-contain border rounded"
                        />
                        <button
                          onClick={() => downloadFile(
                            field.value,
                            `order-${order._id}-${field.type}-${fieldIndex}.png`
                          )}
                          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
                            opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Custom Fields */}
                {/* {item.customization.customFields?.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    <h5 className="font-semibold mb-2">Custom {field.type.charAt(0).toUpperCase() + field.type.slice(1)}:</h5>
                    {field.type === 'text' ? (
                      <p className="bg-gray-50 p-3 rounded">{field.content}</p>
                    ) : (
                      <div className="relative group">
                        <img
                          src={field.content}
                          alt="Custom upload"
                          className="w-full h-48 object-contain border rounded"
                        />
                        <button
                          onClick={() => downloadFile(
                            field.content,
                            `order-${order._id}-custom-${fieldIndex}.png`
                          )}
                          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
                            opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))} */}
                {/* Custom Fields */}
                {item.customization.customFields?.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    <h5 className="font-semibold mb-2">
                      Custom {field.type.charAt(0).toUpperCase() + field.type.slice(1)}:
                    </h5>

                    {/* Handle text fields normally */}
                    {field.type === 'text' ? (
                      <p className="bg-gray-50 p-3 rounded">{field.content}</p>
                    ) : (
                      <div className="relative group">
                        {/* If imageUrl exists, show it and allow download */}
                        {field.imageUrl ? (
                          <>
                            <img
                              src={field.imageUrl}
                              alt="Full Size Custom Upload"
                              className="w-full h-48 object-contain border rounded"
                            />
                          <button
                            onClick={() => downloadImage(field.imageUrl, `order-${order._id}-custom-${fieldIndex}-fullsize.png`)}
                            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>

                            </>
                          ) : (
                            /* Otherwise, show the old version with field.content */
                            <>
                              <img
                                src={field.content}
                                alt="Custom upload"
                                className="w-full h-48 object-contain border rounded"
                              />
                              <button
                                onClick={() => downloadFile(
                                  field.content,
                                  `order-${order._id}-custom-${fieldIndex}.png`
                                )}
                                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
                                  opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>

      {selectedOrder ? (
        <OrderDetails order={selectedOrder} />
      ) : (
        <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    #{order._id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
};

export default OrderManagement;


