// src/components/OrderDetails.js
import React from 'react';
import { Download } from 'lucide-react';

const OrderDetails = ({ order, isAdmin = false }) => {
  const downloadFile = (data, filename) => {
    // Handle both base64 and URL formats
    const isBase64 = data.startsWith('data:');
    if (isBase64) {
      const link = document.createElement('a');
      link.href = data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For API endpoints
      window.open(data, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">Order #{order._id.slice(-6)}</h3>
          <p className="text-sm text-gray-600">
            Date: {new Date(order.createdAt).toLocaleString()}
          </p>
          {isAdmin && (
            <p className="text-sm text-gray-600">
              Customer: {order.user.email}
            </p>
          )}
          <p className="text-sm text-gray-600">
            Status: <span className="capitalize">{order.status}</span>
          </p>
          <p className="font-bold mt-1">
            Total: ${order.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {order.products.map((item, productIndex) => (
          <div key={productIndex} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-lg">{item.product.name}</h4>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <p className="font-semibold">
                ${(item.product.basePrice * item.quantity).toFixed(2)}
              </p>
            </div>

            {item.customization && (
              <div className="space-y-4">
                {/* Template Information */}
                {item.customization.template && (
                  <div>
                    <h5 className="font-semibold mb-2">Template:</h5>
                    <p className="text-gray-700">{item.customization.template.name}</p>
                  </div>
                )}

                {/* Required Fields */}
                {item.customization.requiredFields?.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">Required Fields:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.customization.requiredFields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border rounded p-3">
                          <p className="font-medium mb-1 capitalize">{field.type}:</p>
                          {field.type === 'text' ? (
                            <p className="text-gray-700">{field.value}</p>
                          ) : (
                            <div className="relative group">
                              <img
                                src={field.value}
                                alt={`${field.type} upload`}
                                className="w-full h-32 object-contain"
                              />
                              <button
                                onClick={() => downloadFile(
                                  field.value,
                                  `order-${order._id}-${field.type}-${fieldIndex}.png`
                                )}
                                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow 
                                  opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {item.customization.customFields?.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">Custom Fields:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.customization.customFields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border rounded p-3">
                          <p className="font-medium mb-1 capitalize">{field.type}:</p>
                          {field.type === 'text' ? (
                            <p className="text-gray-700">{field.content}</p>
                          ) : (
                            <div className="relative group">
                              <img
                                src={field.content}
                                alt="Custom upload"
                                className="w-full h-32 object-contain"
                              />
                              <button
                                onClick={() => downloadFile(
                                  field.content,
                                  `order-${order._id}-custom-${fieldIndex}.png`
                                )}
                                className="absolute top-2 right-2 bg-white p-2 rounded-full shadow 
                                  opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Image */}
                {item.customization.preview && (
                  <div>
                    <h5 className="font-semibold mb-2">Final Preview:</h5>
                    <div className="relative group">
                      <img
                        src={item.customization.preview}
                        alt="Preview"
                        className="w-full h-64 object-contain border rounded"
                      />
                      <button
                        onClick={() => downloadFile(
                          item.customization.preview,
                          `order-${order._id}-preview-${productIndex}.png`
                        )}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow 
                          opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Description */}
                {item.customization.description && (
                  <div>
                    <h5 className="font-semibold mb-2">Special Instructions:</h5>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      {item.customization.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetails;



// src/components/OrderDetails.js
// import React from 'react';

// const OrderDetails = ({ order, isAdmin = false }) => {
//   const downloadFile = async (orderId, productIndex, fieldId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `/api/orders/${orderId}/products/${productIndex}/files/${fieldId}`,
//         {
//           headers: { 
//             Authorization: `Bearer ${token}` 
//           }
//         }
//       );

//       if (!response.ok) {
//         throw new Error('Download failed');
//       }

//       const blob = await response.blob();
//       const contentType = response.headers.get('content-type');
      
//       // Create download link
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
      
//       // Determine file extension based on content type
//       const isImage = contentType?.includes('image');
//       const extension = isImage ? 'png' : 'txt';
      
//       link.setAttribute('download', `order-${orderId}-${fieldId}.${extension}`);
//       document.body.appendChild(link);
//       link.click();
      
//       // Cleanup
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Error downloading file:', error);
//       alert('Failed to download file. Please try again.');
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//       <div className="flex justify-between items-start mb-4">
//         <div>
//           <h3 className="text-lg font-semibold mb-2">Order #{order._id.slice(-6)}</h3>
//           <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleString()}</p>
//           {isAdmin && <p className="text-gray-600">Customer: {order.user.email}</p>}
//           <p className="font-bold mt-2">Total: ${order.totalAmount.toFixed(2)}</p>
//           <p className="text-gray-600">Status: {order.status}</p>
//           <p className="text-gray-600">Payment Method: {order.paymentMethod}</p>
//         </div>
//       </div>

//       <div className="space-y-6">
//         {order.products.map((item, productIndex) => (
//           <div key={productIndex} className="border-t pt-4">
//             <div className="flex flex-col md:flex-row gap-6">
//               {/* Product Preview */}
//               <div className="w-full md:w-1/3">
//                 {item.customization?.preview && (
//                   <div className="relative group">
//                     <img
//                       src={item.customization.preview}
//                       alt="Product Preview"
//                       className="w-full h-64 object-contain border rounded"
//                     />
//                     <button
//                       onClick={() => downloadFile(order._id, productIndex, 'preview')}
//                       className="absolute top-2 right-2 bg-white p-2 rounded-full shadow
//                         opacity-0 group-hover:opacity-100 transition-opacity"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                       </svg>
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Product Details */}
//               <div className="flex-1">
//                 <h4 className="text-xl font-semibold mb-2">{item.product.name}</h4>
//                 <p className="text-gray-600 mb-2">Quantity: {item.quantity}</p>
                
//                 {/* Template Information */}
//                 {item.customization?.template && (
//                   <p className="text-gray-600 mb-2">
//                     Template: {item.customization.template.name}
//                   </p>
//                 )}

//                 {/* Custom Fields */}
//                 {item.customization?.customFields?.length > 0 && (
//                   <div className="mt-4">
//                     <h5 className="font-semibold mb-2">Custom Fields:</h5>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {item.customization.customFields.map((field, fieldIndex) => (
//                         <div key={fieldIndex} className="border rounded p-3">
//                           <p className="font-medium">{field.type.charAt(0).toUpperCase() + field.type.slice(1)}:</p>
//                           {field.type === 'text' ? (
//                             <p className="text-gray-600">{field.content}</p>
//                           ) : (
//                             <div className="relative group mt-2">
//                               <img
//                                 src={field.content}
//                                 alt={`Custom ${field.type}`}
//                                 className="max-w-[200px] h-auto border rounded"
//                               />
//                               <button
//                                 onClick={() => downloadFile(order._id, productIndex, field.fieldId)}
//                                 className="absolute top-2 right-2 bg-white p-1 rounded-full shadow
//                                   opacity-0 group-hover:opacity-100 transition-opacity"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
//                                   <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                                 </svg>
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Required Fields */}
//                 {item.customization?.requiredFields?.length > 0 && (
//                   <div className="mt-4">
//                     <h5 className="font-semibold mb-2">Required Fields:</h5>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {item.customization.requiredFields.map((field, fieldIndex) => (
//                         <div key={fieldIndex} className="border rounded p-3">
//                           <p className="font-medium">{field.type.charAt(0).toUpperCase() + field.type.slice(1)}:</p>
//                           {field.type === 'text' ? (
//                             <p className="text-gray-600">{field.value}</p>
//                           ) : (
//                             <div className="relative group mt-2">
//                               <img
//                                 src={field.value}
//                                 alt={`Required ${field.type}`}
//                                 className="max-w-[200px] h-auto border rounded"
//                               />
//                               <button
//                                 onClick={() => downloadFile(order._id, productIndex, field.fieldId)}
//                                 className="absolute top-2 right-2 bg-white p-1 rounded-full shadow
//                                   opacity-0 group-hover:opacity-100 transition-opacity"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
//                                   <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                                 </svg>
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Special Instructions */}
//                 {item.customization?.description && (
//                   <div className="mt-4">
//                     <h5 className="font-semibold mb-2">Special Instructions:</h5>
//                     <p className="text-gray-600 bg-gray-50 p-3 rounded">
//                       {item.customization.description}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default OrderDetails;