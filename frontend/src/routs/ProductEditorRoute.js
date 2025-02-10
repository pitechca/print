// src/routs/ProductEditorRoute.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductEditor from '../components/ProductEditor';
import ProductEditorBags from '../components/ProductEditorBags';
import axios from 'axios';


const ProductEditorRoute = () => {
  const { productId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldUseBagEditor, setShouldUseBagEditor] = useState(false);

  useEffect(() => {
    const checkProductCategory = async () => {
      try {
        const response = await axios.get(`/api/products/${productId}`);
        const product = response.data;
        
        // Check if the category name includes "PAPER BAGS"
        const categoryName = product.category?.name || '';
        setShouldUseBagEditor(categoryName.includes('Paper Bag'));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setIsLoading(false);
      }
    };

    checkProductCategory();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return shouldUseBagEditor ? <ProductEditorBags /> : <ProductEditor />;
};

export default ProductEditorRoute;