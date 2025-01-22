
// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/products');
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product._id} className="bg-white rounded-lg shadow-md p-6">
          {product.templates[0] && (
            <img
              src={product.templates[0].data}
              alt={product.name}
              className="w-full h-48 object-cover mb-4"
            />
          )}
          <h2 className="text-xl font-bold mb-2">{product.name}</h2>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-lg font-bold mb-4">${product.basePrice}</p>
          <Link
            to={`/customize/${product._id}`}
            className="bg-blue-500 text-white px-4 py-2 rounded block text-center"
          >
            Customize
          </Link>
        </div>
      ))}
    </div>
  );
};