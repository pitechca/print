// src/components/PlaceitMockup.js
import React, { useState } from 'react';
import axios from 'axios';

const PlaceitMockup = ({ canvas, selectedProduct }) => {
  const [mockupUrl, setMockupUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMockup = async () => {
    setIsLoading(true);
    try {
      // Get design as base64
      const designImage = canvas.toDataURL('image/png');

      // Create mockup using Placeit API
      const response = await axios.post(
        'https://api.placeit.net/api/v1/mockups',
        {
          template_id: selectedProduct.placeItTemplateId, // You'll need to map your products to Placeit template IDs
          modification_type: 'smart',
          modifications: {
            design: {
              image: designImage
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_PLACEIT_API_KEY}`
          }
        }
      );

      setMockupUrl(response.data.url);
    } catch (error) {
      console.error('Error generating mockup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Product Preview</h3>
        <button
          onClick={generateMockup}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white ${
            isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Preview'}
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
            Click "Generate Preview" to see your design
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceitMockup;