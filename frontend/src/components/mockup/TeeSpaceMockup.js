// src/components/TeeSpaceMockup.js
import React, { useState } from 'react';
import axios from 'axios';

const TeeSpaceMockup = ({ canvas, selectedProduct }) => {
  const [mockupUrl, setMockupUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMockup = async () => {
    setIsLoading(true);
    try {
      const designImage = canvas.toDataURL('image/png');
      
      // Generate mockup using TeeSpace API
      const response = await axios.post(
        'https://api.teespace.com/v1/mockup',
        {
          product_id: selectedProduct.teeSpaceId, // Map your products to TeeSpace IDs
          design: designImage,
          view: 'front', // or 'back', 'side', etc.
          background: 'white'
        },
        {
          headers: {
            'X-API-Key': process.env.REACT_APP_TEESPACE_API_KEY
          }
        }
      );

      setMockupUrl(response.data.mockup_url);
    } catch (error) {
      console.error('Error generating mockup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Product Mockup</h3>
        <button
          onClick={generateMockup}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white ${
            isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Mockup'}
        </button>
      </div>

      <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : mockupUrl ? (
          <img
            src={mockupUrl}
            alt="Product Mockup"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Click "Generate Mockup" to preview your design
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          This is a realistic preview of how your design will look on the actual product.
          Colors may vary slightly in final production.
        </p>
      </div>
    </div>
  );
};

export default TeeSpaceMockup;