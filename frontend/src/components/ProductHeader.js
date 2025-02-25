import React from 'react';
import { Helmet } from 'react-helmet';

// This component can be placed in your main component
const ProductHeader = ({ selectedProduct }) => {
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{selectedProduct?.name || 'Product'} | Your Brand</title>
        <meta name="description" content={selectedProduct?.description || 'Product description'} />
        <meta property="og:title" content={selectedProduct?.name || 'Product'} />
        <meta property="og:description" content={selectedProduct?.description || 'Product description'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://yoursite.com/products/${selectedProduct?.id}`} />
        <meta property="og:image" content={selectedProduct?.image || '/default-product.jpg'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={selectedProduct?.name || 'Product'} />
        <meta name="twitter:description" content={selectedProduct?.description || 'Product description'} />
        <link rel="canonical" href={`https://yoursite.com/products/${selectedProduct?.id}`} />
        <meta name="keywords" content={`${selectedProduct?.name}, ${selectedProduct?.category}, your brand keywords`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Enhanced Product Header with Dark Blue Gradient Background */}
      <div className="w-full my-8 p-8 text-center relative overflow-hidden shadow-lg rounded-lg">
        {/* Dark blue gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            opacity: 0.95
          }}
        />
        
        {/* SEO-friendly content with enhanced typography */}
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-2xl md:text-4xl font-bold text-white leading-tight mb-3 tracking-tight">
            {selectedProduct?.name || 'Product Name'}
          </h1>
          <div className="w-16 h-1 bg-white bg-opacity-30 mx-auto my-4"></div>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-white text-opacity-90 leading-relaxed">
            {selectedProduct?.description || 'Product description goes here.'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ProductHeader;