// serc/components/OrderManagements.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [topOrders, setTopOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const ordersPerPage = 15;

  // Status options with colors for badges
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  // Get the color class for a status
  const getStatusColorClass = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const fetchAllOrdersForMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/orders?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(data)) {
        const metrics = calculateOrderMetrics(data);
        setOrderMetrics(metrics);
      }
    } catch (error) {
      console.error('Error fetching orders for metrics:', error);
    }
  };
  
  // Call this in useEffect
  useEffect(() => {
    fetchOrdersWithPagination();
    fetchTopOrders();
    fetchAllOrdersForMetrics(); // Add this to get metrics data
  }, [currentPage, statusFilter]);

  const [orderMetrics, setOrderMetrics] = useState({
    processingTime: { days: 0, hours: 0 },
    topCategories: []
  });
  
  const downloadInvoice = async (orderId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      
      // Use axios to get the PDF with responseType 'blob'
      const response = await axios.get(`/api/orders/${orderId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Important for handling binary data like PDFs
      });
      
      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const calculateOrderMetrics = (allOrders) => {
    // Calculate processing time (time between order creation and shipping/completion)
    const completedOrders = allOrders.filter(
      order => order.status === 'completed' || order.status === 'shipped'
    );
    
    // Only use orders from last 30 days for processing time calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCompletedOrders = completedOrders.filter(
      order => new Date(order.createdAt) >= thirtyDaysAgo
    );
    
    let totalProcessingTimeMs = 0;
    let ordersWithProcessingTime = 0;
    
    recentCompletedOrders.forEach(order => {
      // Use order.updatedAt as the completion time or the current date if not available
      if (order.createdAt) {
        const completionTime = order.updatedAt ? new Date(order.updatedAt) : new Date();
        const processingTime = completionTime - new Date(order.createdAt);
        if (processingTime > 0) {
          totalProcessingTimeMs += processingTime;
          ordersWithProcessingTime++;
        }
      }
    });
    
    // Calculate average processing time in days and hours
    let avgProcessingDays = 0;
    let avgProcessingHours = 0;
    
    if (ordersWithProcessingTime > 0) {
      const avgProcessingTimeMs = totalProcessingTimeMs / ordersWithProcessingTime;
      avgProcessingDays = Math.floor(avgProcessingTimeMs / (1000 * 60 * 60 * 24));
      avgProcessingHours = Math.floor((avgProcessingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    }
    
    // Calculate top products
    const productMap = {};
    let totalProductsCount = 0;
    
    allOrders.forEach(order => {
      order.products.forEach(item => {
        if (item.product) {
          const productId = typeof item.product === 'object' ? item.product._id : item.product;
          const productName = typeof item.product === 'object' ? item.product.name : 'Unknown Product';
          
          if (!productMap[productId]) {
            productMap[productId] = {
              name: productName,
              count: 0,
              quantity: 0,
              revenue: 0
            };
          }
          
          // Count occurrences of this product
          productMap[productId].count += 1;
          
          // Sum quantities ordered
          productMap[productId].quantity += item.quantity;
          
          // Calculate revenue (if price info is available)
          if (typeof item.product === 'object' && item.product.basePrice) {
            productMap[productId].revenue += item.product.basePrice * item.quantity;
          }
          
          totalProductsCount += item.quantity;
        }
      });
    });
    
    // Convert to percentage and sort by quantity
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5) // Get top 5 products
      .map(product => ({
        name: product.name,
        quantity: product.quantity,
        percentage: totalProductsCount > 0 
          ? Math.round((product.quantity / totalProductsCount) * 100) 
          : 0
      }));
    
    return {
      processingTime: {
        days: avgProcessingDays,
        hours: avgProcessingHours
      },
      topProducts
    };
  };
  
  const fetchOrdersWithPagination = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Include pagination parameters and status filter if not "all"
      let url = `/api/orders?page=${currentPage}&limit=${ordersPerPage}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // In case backend doesn't support pagination yet, handle it on client side
      if (Array.isArray(data)) {
        // Backend returned all orders, apply pagination on client side
        const filteredOrders = statusFilter === 'all' 
          ? data 
          : data.filter(order => order.status === statusFilter);
          
        // Sort orders by date, newest first
        const sortedOrders = filteredOrders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Calculate total pages
        const total = Math.ceil(sortedOrders.length / ordersPerPage);
        setTotalPages(total || 1);
        
        // Get current page of orders
        const startIndex = (currentPage - 1) * ordersPerPage;
        const paginatedOrders = sortedOrders.slice(startIndex, startIndex + ordersPerPage);
        
        setOrders(paginatedOrders);
      } else if (data.orders) {
        // Backend already supports pagination
        setOrders(data.orders);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/orders?sortBy=totalAmount&limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If backend doesn't support this specific endpoint, handle it on client side
      if (Array.isArray(data)) {
        // Sort by total amount descending and take top 5
        const highestValueOrders = [...data]
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5);
        setTopOrders(highestValueOrders);
      } else if (data.orders) {
        setTopOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching top orders:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update the order in both orders list and selected order if open
      fetchOrdersWithPagination();
      fetchTopOrders();
      
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus});
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
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

  // Component for showing order status with dropdown for admin
const StatusBadge = ({ status, orderId, isDetailView = false }) => {
  const [isChanging, setIsChanging] = useState(false);
  
  return (
    <div className="relative inline-block">
      <span
        onClick={() => setIsChanging(true)}
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer
          ${getStatusColorClass(status)} 
          ${isDetailView ? 'text-sm px-4 py-2' : ''}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
      
      {isChanging && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center" onClick={() => setIsChanging(false)}>
          <div className="bg-white rounded-lg shadow-xl p-2 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-2 px-2">Update Status</h3>
            <div className="space-y-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateOrderStatus(orderId, option.value);
                    setIsChanging(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100
                    ${status === option.value ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  role="menuitem"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={() => setIsChanging(false)}
                className="block w-full text-center px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

      {/* Status and Action Bar */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <span className="text-gray-600 mr-2">Status:</span>
          <StatusBadge status={order.status} orderId={order._id} isDetailView={true} />
        </div>
        <div>
          <button
            onClick={() => downloadInvoice(
              order._id,
              `order-${order._id.slice(-6)}.pdf`
            )}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
            Download Invoice
          </button>
        </div>
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
        <div><h4 className="text-md font-semibold mb-2">Coupon Applied</h4> 

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
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

  // Pagination component
  const Pagination = () => (
    <div className="flex justify-center items-center mt-6 space-x-1">
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        «
      </button>
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        ‹
      </button>
      
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        // Show pages around current page
        let pageNum;
        if (totalPages <= 5) {
          pageNum = i + 1;
        } else if (currentPage <= 3) {
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = currentPage - 2 + i;
        }
        
        return (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-3 py-1 rounded ${
              currentPage === pageNum
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {pageNum}
          </button>
        );
      })}
      
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        ›
      </button>
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          currentPage === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        »
      </button>
    </div>
  );

  // Top Orders component
  const TopOrders = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <h3 className="text-lg font-semibold text-white">Top 5 Highest Value Orders</h3>
      </div>
      <div className="p-4">
        {/* Mobile view cards */}
        <div className="md:hidden space-y-4">
          {topOrders.map(order => (
            <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-800 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    downloadInvoice(
                      order._id,
                      `order-${order._id.slice(-6)}.pdf`
                    );
                  }}>
                  #{order._id.slice(-6)}
                </span>
                <span className="font-medium text-green-600">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-1">{order.user.email}</div>
              <div className="text-sm text-gray-500 mb-3">{new Date(order.createdAt).toLocaleDateString()}</div>
              <button
                onClick={() => setSelectedOrder(order)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                style={{ 
                  boxShadow: 'none', 
                  border: 'none', 
                  background: 'transparent',
                  transform: 'none',
                  padding: 0,
                  overflow: 'visible'
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        
        {/* Desktop view table - same as original */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {topOrders.map(order => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 cursor-pointer text-blue-800"
                    onClick={() => setSelectedOrder(order)}
                  >           
                    #{order._id.slice(-6)}</td>
                  <td className="px-4 py-3">{order.user.email}</td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-green-600">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800"
                      style={{ 
                        boxShadow: 'none', 
                        border: 'none', 
                        background: 'transparent',
                        transform: 'none',
                        padding: 0,
                        overflow: 'visible'
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading && !orders.length) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /> */}
        <img src='../images/loading.gif'/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>

      {selectedOrder ? (
        <OrderDetails order={selectedOrder} />
      ) : (
        <>
          {/* Top Orders Section */}
          <TopOrders />
          
          {/* Main Orders Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header & Filters */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-gray-700">Orders List</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page on filter change
                    }}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Orders</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
           {/* Orders Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                {statusFilter !== 'all' ? (
                  <p className="mt-1 text-sm text-gray-500">
                    There are no orders with the status: {statusFilter}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    No orders have been placed yet.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Mobile view - Card layout */}
                <div className="md:hidden">
                  <div className="space-y-4 px-4 py-2">
                    {orders.map((order) => (
                      <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div 
                            className="font-medium text-blue-800 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              downloadInvoice(
                                order._id,
                                `order-${order._id.slice(-6)}.pdf`
                              );
                            }}
                          >
                            #{order._id.slice(-6)}
                          </div>
                          <StatusBadge status={order.status} orderId={order._id} />
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Customer:</span>
                            <span className="text-sm font-medium">{order.user.firstName} {order.user.lastName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Email:</span>
                            <span className="text-sm">{order.user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Date:</span>
                            <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Total:</span>
                            <span className="text-sm font-medium text-green-600">${order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            style={{ 
                              boxShadow: 'none', 
                              border: 'none', 
                              background: 'transparent',
                              transform: 'none',
                              padding: 0,
                              overflow: 'visible'
                            }}
                          >
                            View Details
                          </button>
                          <button
                            style={{ 
                              boxShadow: 'none', 
                              border: 'none', 
                              background: 'transparent',
                              transform: 'none',
                              padding: 0,
                              overflow: 'visible'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              downloadInvoice(
                                order._id,
                                `order-${order._id.slice(-6)}.pdf`
                              );
                            }}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop view - Original table layout */}
                <div className="hidden md:block overflow-x-auto">
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
                          Email
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
                          <td className="px-6 py-4 whitespace-nowrap cursor-pointer text-blue-800"
                            onClick={() => setSelectedOrder(order)}
                          >
                            #{order._id.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.user.firstName} {order.user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={order.status} orderId={order._id} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-blue-600 hover:text-blue-900"
                              style={{ 
                                boxShadow: 'none', 
                                border: 'none', 
                                background: 'transparent',
                                transform: 'none',
                                padding: 0,
                                overflow: 'visible'
                              }}
                            >
                              View Details
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              style={{ 
                                boxShadow: 'none', 
                                border: 'none', 
                                background: 'transparent',
                                transform: 'none',
                                padding: 0,
                                overflow: 'visible'
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                downloadInvoice(
                                  order._id,
                                  `order-${order._id.slice(-6)}.pdf`
                                );
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          {/* Pagination Controls */}
          {!loading && orders.length > 0 && (
            <div className="px-6 py-4 bg-white border-t">
              <Pagination />
            </div>
          )}
          </div>

        {/* Order Analytics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-lg text-gray-700 mb-3">Orders by Status</h4>
            <div className="space-y-3">
              {statusOptions.map(option => {
                // Count orders with this status
                const count = orders.filter(order => order.status === option.value).length;
                return (
                  <div key={option.value} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${option.color.replace('text-', 'bg-').replace('-100', '-500')}`}></div>
                      <span>{option.label}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-lg text-gray-700 mb-3">Order Processing Time</h4>
            <div className="space-y-2">
              <p className="text-gray-600">Average time to ship:</p>
              {orderMetrics.processingTime.days > 0 || orderMetrics.processingTime.hours > 0 ? (
                <p className="text-2xl font-bold text-indigo-600">
                  {orderMetrics.processingTime.days > 0 && `${orderMetrics.processingTime.days} days `}
                  {orderMetrics.processingTime.hours > 0 && `${orderMetrics.processingTime.hours} hours`}
                  {orderMetrics.processingTime.days === 0 && orderMetrics.processingTime.hours === 0 && 'Less than an hour'}
                </p>
              ) : (
                <p className="text-lg text-gray-500">No data available</p>
              )}
              <p className="text-sm text-gray-500">Based on completed orders from the last 30 days</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-semibold text-lg text-gray-700 mb-3">Most Bought Products</h4>
          {orderMetrics.topProducts && orderMetrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {orderMetrics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm truncate max-w-[150px]" title={product.name}>
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{product.quantity} units</span>
                    <span className="font-medium">{product.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No product data available</p>
          )}
        </div>
        </div>
        </>
      )}
    </div>
  );
};

export default OrderManagement;










// // work well befor mobile view
// // serc/components/OrderManagements.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const OrderManagement = () => {
//   const [orders, setOrders] = useState([]);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [topOrders, setTopOrders] = useState([]);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const ordersPerPage = 15;

//   // Status options with colors for badges
//   const statusOptions = [
//     { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
//     { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
//     { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
//     { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
//     { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
//   ];

//   // Get the color class for a status
//   const getStatusColorClass = (status) => {
//     const statusOption = statusOptions.find(opt => opt.value === status);
//     return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
//   };

//   const fetchAllOrdersForMetrics = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const { data } = await axios.get('/api/orders?limit=1000', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       if (Array.isArray(data)) {
//         const metrics = calculateOrderMetrics(data);
//         setOrderMetrics(metrics);
//       }
//     } catch (error) {
//       console.error('Error fetching orders for metrics:', error);
//     }
//   };
  
//   // Call this in useEffect
//   useEffect(() => {
//     fetchOrdersWithPagination();
//     fetchTopOrders();
//     fetchAllOrdersForMetrics(); // Add this to get metrics data
//   }, [currentPage, statusFilter]);

//   const [orderMetrics, setOrderMetrics] = useState({
//     processingTime: { days: 0, hours: 0 },
//     topCategories: []
//   });
  
//   const downloadInvoice = async (orderId, fileName) => {
//     try {
//       const token = localStorage.getItem('token');
      
//       // Use axios to get the PDF with responseType 'blob'
//       const response = await axios.get(`/api/orders/${orderId}/download`, {
//         headers: { Authorization: `Bearer ${token}` },
//         responseType: 'blob' // Important for handling binary data like PDFs
//       });
      
//       // Create a blob URL from the response data
//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
      
//       // Create a temporary link and trigger download
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', fileName);
//       document.body.appendChild(link);
//       link.click();
      
//       // Clean up
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Error downloading invoice:', error);
//       alert('Failed to download invoice. Please try again.');
//     }
//   };

//   const calculateOrderMetrics = (allOrders) => {
//     // Calculate processing time (time between order creation and shipping/completion)
//     const completedOrders = allOrders.filter(
//       order => order.status === 'completed' || order.status === 'shipped'
//     );
    
//     // Only use orders from last 30 days for processing time calculation
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
//     const recentCompletedOrders = completedOrders.filter(
//       order => new Date(order.createdAt) >= thirtyDaysAgo
//     );
    
//     let totalProcessingTimeMs = 0;
//     let ordersWithProcessingTime = 0;
    
//     recentCompletedOrders.forEach(order => {
//       // Use order.updatedAt as the completion time or the current date if not available
//       if (order.createdAt) {
//         const completionTime = order.updatedAt ? new Date(order.updatedAt) : new Date();
//         const processingTime = completionTime - new Date(order.createdAt);
//         if (processingTime > 0) {
//           totalProcessingTimeMs += processingTime;
//           ordersWithProcessingTime++;
//         }
//       }
//     });
    
//     // Calculate average processing time in days and hours
//     let avgProcessingDays = 0;
//     let avgProcessingHours = 0;
    
//     if (ordersWithProcessingTime > 0) {
//       const avgProcessingTimeMs = totalProcessingTimeMs / ordersWithProcessingTime;
//       avgProcessingDays = Math.floor(avgProcessingTimeMs / (1000 * 60 * 60 * 24));
//       avgProcessingHours = Math.floor((avgProcessingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     }
    
//     // Calculate top products
//     const productMap = {};
//     let totalProductsCount = 0;
    
//     allOrders.forEach(order => {
//       order.products.forEach(item => {
//         if (item.product) {
//           const productId = typeof item.product === 'object' ? item.product._id : item.product;
//           const productName = typeof item.product === 'object' ? item.product.name : 'Unknown Product';
          
//           if (!productMap[productId]) {
//             productMap[productId] = {
//               name: productName,
//               count: 0,
//               quantity: 0,
//               revenue: 0
//             };
//           }
          
//           // Count occurrences of this product
//           productMap[productId].count += 1;
          
//           // Sum quantities ordered
//           productMap[productId].quantity += item.quantity;
          
//           // Calculate revenue (if price info is available)
//           if (typeof item.product === 'object' && item.product.basePrice) {
//             productMap[productId].revenue += item.product.basePrice * item.quantity;
//           }
          
//           totalProductsCount += item.quantity;
//         }
//       });
//     });
    
//     // Convert to percentage and sort by quantity
//     const topProducts = Object.values(productMap)
//       .sort((a, b) => b.quantity - a.quantity)
//       .slice(0, 5) // Get top 5 products
//       .map(product => ({
//         name: product.name,
//         quantity: product.quantity,
//         percentage: totalProductsCount > 0 
//           ? Math.round((product.quantity / totalProductsCount) * 100) 
//           : 0
//       }));
    
//     return {
//       processingTime: {
//         days: avgProcessingDays,
//         hours: avgProcessingHours
//       },
//       topProducts
//     };
//   };
  
//   const fetchOrdersWithPagination = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       // Include pagination parameters and status filter if not "all"
//       let url = `/api/orders?page=${currentPage}&limit=${ordersPerPage}`;
//       if (statusFilter !== 'all') {
//         url += `&status=${statusFilter}`;
//       }
      
//       const { data } = await axios.get(url, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       // In case backend doesn't support pagination yet, handle it on client side
//       if (Array.isArray(data)) {
//         // Backend returned all orders, apply pagination on client side
//         const filteredOrders = statusFilter === 'all' 
//           ? data 
//           : data.filter(order => order.status === statusFilter);
          
//         // Sort orders by date, newest first
//         const sortedOrders = filteredOrders.sort((a, b) => 
//           new Date(b.createdAt) - new Date(a.createdAt)
//         );
        
//         // Calculate total pages
//         const total = Math.ceil(sortedOrders.length / ordersPerPage);
//         setTotalPages(total || 1);
        
//         // Get current page of orders
//         const startIndex = (currentPage - 1) * ordersPerPage;
//         const paginatedOrders = sortedOrders.slice(startIndex, startIndex + ordersPerPage);
        
//         setOrders(paginatedOrders);
//       } else if (data.orders) {
//         // Backend already supports pagination
//         setOrders(data.orders);
//         setTotalPages(data.totalPages || 1);
//       }
//     } catch (error) {
//       console.error('Error fetching orders:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTopOrders = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const { data } = await axios.get('/api/orders?sortBy=totalAmount&limit=5', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       // If backend doesn't support this specific endpoint, handle it on client side
//       if (Array.isArray(data)) {
//         // Sort by total amount descending and take top 5
//         const highestValueOrders = [...data]
//           .sort((a, b) => b.totalAmount - a.totalAmount)
//           .slice(0, 5);
//         setTopOrders(highestValueOrders);
//       } else if (data.orders) {
//         setTopOrders(data.orders);
//       }
//     } catch (error) {
//       console.error('Error fetching top orders:', error);
//     }
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const token = localStorage.getItem('token');
//       await axios.put(`/api/orders/${orderId}/status`, 
//         { status: newStatus },
//         { headers: { Authorization: `Bearer ${token}` }}
//       );
      
//       // Update the order in both orders list and selected order if open
//       fetchOrdersWithPagination();
//       fetchTopOrders();
      
//       if (selectedOrder && selectedOrder._id === orderId) {
//         setSelectedOrder({...selectedOrder, status: newStatus});
//       }
//     } catch (error) {
//       console.error('Error updating order status:', error);
//       alert('Failed to update order status. Please try again.');
//     }
//   };

//   const downloadFile = (base64Data, fileName) => {
//     const link = document.createElement('a');
//     link.href = base64Data;
//     link.download = fileName;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const downloadImage = async (imageUrl, fileName) => {
//     try {
//       const response = await fetch(imageUrl, { mode: 'cors' }); // Ensure CORS mode
//       if (!response.ok) throw new Error('Image not available');
  
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
  
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', fileName);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Error downloading image:', error);
//       alert('Failed to download image. It may not be accessible.');
//     }
//   };

//   // Component for showing order status with dropdown for admin
//   const StatusBadge = ({ status, orderId, isDetailView = false }) => {
//     const [isChanging, setIsChanging] = useState(false);
    
//     return (
//       <div className="relative inline-block">
//         <span
//           onClick={() => setIsChanging(true)}
//           className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer
//             ${getStatusColorClass(status)} 
//             ${isDetailView ? 'text-sm px-4 py-2' : ''}`}
//         >
//           {status.charAt(0).toUpperCase() + status.slice(1)}
//           <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//           </svg>
//         </span>
        
//         {isChanging && (
//           <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
//             <div className="py-1" role="menu" aria-orientation="vertical">
//               {statusOptions.map((option) => (
//                 <button
//                   key={option.value}
//                   onClick={() => {
//                     updateOrderStatus(orderId, option.value);
//                     setIsChanging(false);
//                   }}
//                   className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100
//                     ${status === option.value ? 'bg-gray-50 font-medium' : ''}`}
//                   role="menuitem"
//                 >
//                   {option.label}
//                 </button>
//               ))}
//             </div>
//             <div className="border-t border-gray-100">
//               <button
//                 onClick={() => setIsChanging(false)}
//                 className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };
  
//   const OrderDetails = ({ order }) => (
//     <div className="bg-white p-6 rounded-lg shadow-lg">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-xl font-bold">Order Details #{order._id.slice(-6)}</h3>
//         <button 
//           onClick={() => setSelectedOrder(null)}
//           className="text-gray-600 hover:text-gray-800"
//         >
//           ×
//         </button>
//       </div>

//       {/* Status and Action Bar */}
//       <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
//         <div>
//           <span className="text-gray-600 mr-2">Status:</span>
//           <StatusBadge status={order.status} orderId={order._id} isDetailView={true} />
//         </div>
//         <div>
//           {/* <button
//             onClick={() => downloadFile(
//               `/api/orders/${order._id}/download`,
//               `order-${order._id.slice(-6)}.pdf`
//             )}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
//           >
//             Download Invoice
//           </button> */}
//           <button
//             onClick={() => downloadInvoice(
//               order._id,
//               `order-${order._id.slice(-6)}.pdf`
//             )}
//             className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200"
//             >
//             Download Invoice
//           </button>
//         </div>
//       </div>

//       {/* Order Summary Section */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div>
//           <p className="text-gray-600">Customer Email:</p>
//           <p className="font-semibold">{order.user.email}</p>
//         </div>
//         <div>
//           <p className="text-gray-600">Order Date:</p>
//           <p className="font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
//         </div>
//         <div>
//           <p className="text-gray-600">Total Amount:</p>
//           <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
//         </div>
//         <div>
//           <p className="text-gray-600">Payment Method:</p>
//           <p className="font-semibold">{order.paymentMethod}</p>
//         </div>
//       </div>

//       {/* Coupon Information */}
//       {order.coupon && (
//         <div><h4 className="text-md font-semibold mb-2">Coupon Applied</h4> 

//         <div className="bg-blue-50 p-4 rounded-lg mb-6">
//           <div className="grid grid-cols-2 gap-2">
//             <div>
//               <p className="text-gray-600">Coupon Code:</p>
//               <p className="font-semibold">{order.coupon.code}</p>
//             </div>
//             <div>
//               <p className="text-gray-600">Discount:</p>
//               <p className="font-semibold text-green-600">
//                 {order.coupon.discountType === 'percentage' 
//                   ? `${order.coupon.discountValue}%` 
//                   : `$${order.coupon.discountAmount.toFixed(2)}`}
//               </p>
//             </div>
//           </div>
//         </div>
//         </div>
//       )}

//       {/* Detailed Product Information */}
//       <div className="space-y-6">
//         {order.products.map((item, index) => (
//           <div key={index} className="border rounded-lg p-4">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h4 className="font-bold text-lg">{item.product.name}</h4>
//                 <p className="text-gray-600">Quantity: {item.quantity}</p>
                
//                 {/* Template Information */}
//                 {item.customization?.template && (
//                   <p className="text-gray-600">
//                     Template: {item.customization.template.name}
//                   </p>
//                 )}
//               </div>
//               <p className="font-semibold">
//                 ${(item.product.basePrice * item.quantity).toFixed(2)}
//               </p>
//             </div>

//             {/* Customization Preview */}
//             {item.customization?.preview && (
//               <div className="mb-4">
//                 <h5 className="font-semibold mb-2">Design Preview</h5>
//                 <div className="relative group">
//                   <img
//                     src={item.customization.preview}
//                     alt="Design Preview"
//                     className="w-full h-64 object-contain border rounded"
//                   />
//                   <button
//                     onClick={() => downloadFile(
//                       item.customization.preview,
//                       `order-${order._id}-preview-${index}.png`
//                     )}
//                     className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
//                       opacity-0 group-hover:opacity-100 transition-opacity"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Description */}
//             {item.customization?.description && (
//               <div className="mb-4">
//                 <h5 className="font-semibold mb-2">Special Instructions</h5>
//                 <p className="bg-gray-50 p-3 rounded">{item.customization.description}</p>
//               </div>
//             )}

//             {item.customization && (
//               <div className="space-y-4">
//                 {/* Required Fields */}
//                 {item.customization.requiredFields?.map((field, fieldIndex) => (
//                   <div key={fieldIndex}>
//                     <h5 className="font-semibold mb-2">{field.type.charAt(0).toUpperCase() + field.type.slice(1)}:</h5>
//                     {field.type === 'text' ? (
//                       <p className="bg-gray-50 p-3 rounded">{field.value}</p>
//                     ) : (
//                       <div className="relative group">
//                         <img
//                           src={field.value}
//                           alt={`${field.type} upload`}
//                           className="w-full h-48 object-contain border rounded"
//                         />
//                         <button
//                           onClick={() => downloadFile(
//                             field.value,
//                             `order-${order._id}-${field.type}-${fieldIndex}.png`
//                           )}
//                           className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
//                             opacity-0 group-hover:opacity-100 transition-opacity"
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                           </svg>
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 ))}

//                 {/* Custom Fields */}
//                 {item.customization.customFields?.map((field, fieldIndex) => (
//                   <div key={fieldIndex}>
//                     <h5 className="font-semibold mb-2">
//                       Custom {field.type.charAt(0).toUpperCase() + field.type.slice(1)}:
//                     </h5>

//                     {/* Handle text fields normally */}
//                     {field.type === 'text' ? (
//                       <p className="bg-gray-50 p-3 rounded">{field.content}</p>
//                     ) : (
//                       <div className="relative group">
//                         {/* If imageUrl exists, show it and allow download */}
//                         {field.imageUrl ? (
//                           <>
//                             <img
//                               src={field.imageUrl}
//                               alt="Full Size Custom Upload"
//                               className="w-full h-48 object-contain border rounded"
//                             />
//                             <button
//                               onClick={() => downloadImage(field.imageUrl, `order-${order._id}-custom-${fieldIndex}-fullsize.png`)}
//                               className="absolute top-2 right-2 bg-white p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                                 <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                               </svg>
//                             </button>
//                           </>
//                         ) : (
//                           /* Otherwise, show the old version with field.content */
//                           <>
//                             <img
//                               src={field.content}
//                               alt="Custom upload"
//                               className="w-full h-48 object-contain border rounded"
//                             />
//                             <button
//                               onClick={() => downloadFile(
//                                 field.content,
//                                 `order-${order._id}-custom-${fieldIndex}.png`
//                               )}
//                               className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
//                                 opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                                 <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                               </svg>
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   // Pagination component
//   const Pagination = () => (
//     <div className="flex justify-center items-center mt-6 space-x-1">
//       <button
//         onClick={() => setCurrentPage(1)}
//         disabled={currentPage === 1}
//         className={`px-3 py-1 rounded ${
//           currentPage === 1 
//             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
//             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//         }`}
//       >
//         «
//       </button>
//       <button
//         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//         disabled={currentPage === 1}
//         className={`px-3 py-1 rounded ${
//           currentPage === 1 
//             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
//             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//         }`}
//       >
//         ‹
//       </button>
      
//       {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//         // Show pages around current page
//         let pageNum;
//         if (totalPages <= 5) {
//           pageNum = i + 1;
//         } else if (currentPage <= 3) {
//           pageNum = i + 1;
//         } else if (currentPage >= totalPages - 2) {
//           pageNum = totalPages - 4 + i;
//         } else {
//           pageNum = currentPage - 2 + i;
//         }
        
//         return (
//           <button
//             key={pageNum}
//             onClick={() => setCurrentPage(pageNum)}
//             className={`px-3 py-1 rounded ${
//               currentPage === pageNum
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//             }`}
//           >
//             {pageNum}
//           </button>
//         );
//       })}
      
//       <button
//         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//         disabled={currentPage === totalPages}
//         className={`px-3 py-1 rounded ${
//           currentPage === totalPages 
//             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
//             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//         }`}
//       >
//         ›
//       </button>
//       <button
//         onClick={() => setCurrentPage(totalPages)}
//         disabled={currentPage === totalPages}
//         className={`px-3 py-1 rounded ${
//           currentPage === totalPages 
//             ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
//             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//         }`}
//       >
//         »
//       </button>
//     </div>
//   );

//   // Top Orders component
//   const TopOrders = () => (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
//       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
//         <h3 className="text-lg font-semibold text-white">Top 5 Highest Value Orders</h3>
//       </div>
//       <div className="p-4">
//         <div className="overflow-x-auto">
//           <table className="min-w-full">
//             <thead>
//               <tr className="border-b">
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {topOrders.map(order => (
//                 <tr key={order._id} className="border-b hover:bg-gray-50">
//                   <td className="px-4 py-3 cursor-pointer text-blue-800"
//                     onClick={(e) => {
//                       e.preventDefault(); // Prevent default to avoid any navigation
//                       downloadInvoice(
//                         order._id,
//                         `order-${order._id.slice(-6)}.pdf`
//                       );
//                     }}>           
//                     #{order._id.slice(-6)}</td>
//                   <td className="px-4 py-3">{order.user.email}</td>
//                   <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
//                   <td className="px-4 py-3 font-medium text-green-600">${order.totalAmount.toFixed(2)}</td>
//                   <td className="px-4 py-3">
//                     <button
//                       onClick={() => setSelectedOrder(order)}
//                       className="text-blue-600 hover:text-blue-800"
//                       style={{ 
//                         boxShadow: 'none', 
//                         border: 'none', 
//                         background: 'transparent',
//                         transform: 'none',
//                         padding: 0,
//                         overflow: 'visible'
//                       }}
//                     >
//                       View
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );

//   if (loading && !orders.length) {
//     return (
//       <div className="fixed inset-0 flex flex-col items-center justify-center">
//         {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /> */}
//         <img src='../images/loading.gif'/>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Order Management</h2>

//       {selectedOrder ? (
//         <OrderDetails order={selectedOrder} />
//       ) : (
//         <>
//           {/* Top Orders Section */}
//           <TopOrders />
          
//           {/* Main Orders Table */}
//           <div className="bg-white rounded-lg shadow-md overflow-hidden">
//             {/* Table Header & Filters */}
//             <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-wrap gap-4">
//               <h3 className="text-lg font-semibold text-gray-700">Orders List</h3>
//               <div className="flex items-center space-x-4">
//                 <div>
//                   <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
//                     Filter by Status
//                   </label>
//                   <select
//                     id="statusFilter"
//                     value={statusFilter}
//                     onChange={(e) => {
//                       setStatusFilter(e.target.value);
//                       setCurrentPage(1); // Reset to first page on filter change
//                     }}
//                     className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
//                   >
//                     <option value="all">All Orders</option>
//                     {statusOptions.map(option => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>
            
//             {/* Orders Table */}
//             {loading ? (
//               <div className="flex justify-center items-center py-12">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//               </div>
//             ) : orders.length === 0 ? (
//               <div className="text-center py-12">
//                 <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                 </svg>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
//                 {statusFilter !== 'all' ? (
//                   <p className="mt-1 text-sm text-gray-500">
//                     There are no orders with the status: {statusFilter}
//                   </p>
//                 ) : (
//                   <p className="mt-1 text-sm text-gray-500">
//                     No orders have been placed yet.
//                   </p>
//                 )}
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Order ID
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Customer
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Email
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Date
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Total
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {orders.map((order) => (
//                       <tr key={order._id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap cursor-pointer text-blue-800"
//                           onClick={(e) => {
//                             e.preventDefault(); // Prevent default to avoid any navigation
//                             downloadInvoice(
//                               order._id,
//                               `order-${order._id.slice(-6)}.pdf`
//                             );
//                           }}>
//                           #{order._id.slice(-6)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {order.user.firstName} {order.user.lastName}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {order.user.email}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {new Date(order.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
//                           ${order.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <StatusBadge status={order.status} orderId={order._id} />
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
//                           <button
//                             onClick={() => setSelectedOrder(order)}
//                             className="text-blue-600 hover:text-blue-900"
//                             style={{ 
//                               boxShadow: 'none', 
//                               border: 'none', 
//                               background: 'transparent',
//                               transform: 'none',
//                               padding: 0,
//                               overflow: 'visible'
//                             }}
//                           >
//                             View Details
//                           </button>
//                           <span className="text-gray-300">|</span>
//                           <button
//                             style={{ 
//                               boxShadow: 'none', 
//                               border: 'none', 
//                               background: 'transparent',
//                               transform: 'none',
//                               padding: 0,
//                               overflow: 'visible'
//                             }}
//                             onClick={(e) => {
//                               e.preventDefault(); // Prevent default to avoid any navigation
//                               downloadInvoice(
//                                 order._id,
//                                 `order-${order._id.slice(-6)}.pdf`
//                               );
//                             }}
//                             className="text-green-600 hover:text-green-900"
//                           >
//                             Invoice
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//           )}
//           {/* Pagination Controls */}
//           {!loading && orders.length > 0 && (
//             <div className="px-6 py-4 bg-white border-t">
//               <Pagination />
//             </div>
//           )}
//           </div>

//         {/* Order Analytics Section */}
//         <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h4 className="font-semibold text-lg text-gray-700 mb-3">Orders by Status</h4>
//             <div className="space-y-3">
//               {statusOptions.map(option => {
//                 // Count orders with this status
//                 const count = orders.filter(order => order.status === option.value).length;
//                 return (
//                   <div key={option.value} className="flex items-center justify-between">
//                     <div className="flex items-center">
//                       <div className={`w-3 h-3 rounded-full mr-2 ${option.color.replace('text-', 'bg-').replace('-100', '-500')}`}></div>
//                       <span>{option.label}</span>
//                     </div>
//                     <span className="font-medium">{count}</span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h4 className="font-semibold text-lg text-gray-700 mb-3">Order Processing Time</h4>
//             <div className="space-y-2">
//               <p className="text-gray-600">Average time to ship:</p>
//               {orderMetrics.processingTime.days > 0 || orderMetrics.processingTime.hours > 0 ? (
//                 <p className="text-2xl font-bold text-indigo-600">
//                   {orderMetrics.processingTime.days > 0 && `${orderMetrics.processingTime.days} days `}
//                   {orderMetrics.processingTime.hours > 0 && `${orderMetrics.processingTime.hours} hours`}
//                   {orderMetrics.processingTime.days === 0 && orderMetrics.processingTime.hours === 0 && 'Less than an hour'}
//                 </p>
//               ) : (
//                 <p className="text-lg text-gray-500">No data available</p>
//               )}
//               <p className="text-sm text-gray-500">Based on completed orders from the last 30 days</p>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//           <h4 className="font-semibold text-lg text-gray-700 mb-3">Most Bought Products</h4>
//           {orderMetrics.topProducts && orderMetrics.topProducts.length > 0 ? (
//             <div className="space-y-3">
//               {orderMetrics.topProducts.map((product, index) => (
//                 <div key={index} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
//                       {index + 1}
//                     </span>
//                     <span className="text-sm truncate max-w-[150px]" title={product.name}>
//                       {product.name}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-xs text-gray-500">{product.quantity} units</span>
//                     <span className="font-medium">{product.percentage}%</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-gray-500">No product data available</p>
//           )}
//         </div>
//         </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default OrderManagement;

