// src/components/PrintfulMockup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PrintfulMockup = ({ canvas, selectedProduct }) => {
  const [mockupUrl, setMockupUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMockup = async () => {
    setIsLoading(true);
    try {
      // Get design as base64
      const designImage = canvas.toDataURL('image/png');

      // Create mockup using Printful API
      const response = await axios.post(
        'https://api.printful.com/mockup-generator/create-task',
        {
          variant_ids: [selectedProduct.printfulId], // You'll need to map your products to Printful IDs
          format: 'jpg',
          files: [{
            placement: 'front',
            image_url: designImage,
            position: {
              area_width: 1800,
              area_height: 1800,
              width: 1800,
              height: 1800,
              top: 0,
              left: 0
            }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_PRINTFUL_API_KEY}`
          }
        }
      );

      // Get mockup result
      const taskKey = response.data.result.task_key;
      let mockupResult;
      do {
        mockupResult = await axios.get(
          `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.REACT_APP_PRINTFUL_API_KEY}`
            }
          }
        );
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
      } while (mockupResult.data.result.status !== 'completed');

      setMockupUrl(mockupResult.data.result.mockups[0].url);
    } catch (error) {
      console.error('Error generating mockup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">3D Product Preview</h3>
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

export default PrintfulMockup;