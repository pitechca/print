// src/components/LazyImage.js
import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className, placeholder = '/api/placeholder/400/400' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
    }
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'animate-pulse bg-gray-200' : ''}`}
    />
  );
};

export default LazyImage;