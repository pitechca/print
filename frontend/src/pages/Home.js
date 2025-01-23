// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const phoneNumber = "1-604-977-9292"; // Replace with actual number

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Call Button */}
      <a
        href={`tel:${phoneNumber}`}
        className="fixed top-20 right-4 z-50 flex items-center bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        <span>Call Now</span>
      </a>

      {/* Hero Section */}
      <div className="bg-gray-50 py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-6">
              Custom Packaging Solutions
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional custom packaging for your business needs. Quality materials, elegant designs, reliable service.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href={`tel:${phoneNumber}`}
                className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Call to Order
              </a>
              <Link
                to="/products"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Place Online Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
          Our Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md"
            >
              {product.templates[0] && (
                <img
                  src={product.templates[0].data}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4 min-h-[3rem]">
                  {product.description}
                </p>
                <p className="text-xl font-bold text-gray-900 mb-4">
                  ${product.basePrice.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/customize/${product._id}`}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Customize
                  </Link>
                  <button
                    onClick={() => addToCart({ product, quantity: 1 })}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">Premium materials and craftsmanship</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Professional Service</h3>
              <p className="text-gray-600">Expert guidance and support</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick turnaround on all orders</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;












// // working properly but simple
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { useCart } from '../context/CartContext';

// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { addToCart } = useCart();

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const { data } = await axios.get('/api/products');
//         setProducts(data);
//       } catch (error) {
//         console.error('Error fetching products:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   if (loading) return <div>Loading...</div>;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {products.map((product) => (
//         <div key={product._id} className="bg-white rounded-lg shadow-md p-6">
//           {product.templates[0] && (
//             <img
//               src={product.templates[0].data}
//               alt={product.name}
//               className="w-full h-48 object-cover mb-4 rounded"
//             />
//           )}
//           <h2 className="text-xl font-bold mb-2">{product.name}</h2>
//           <p className="text-gray-600 mb-4">{product.description}</p>
//           <p className="text-lg font-bold mb-4">${product.basePrice}</p>
//           <div className="flex space-x-2">
//             <Link
//               to={`/customize/${product._id}`}
//               className="bg-blue-500 text-white px-4 py-2 rounded flex-1 text-center"
//             >
//               Customize
//             </Link>
//             <button
//               onClick={() => addToCart({ product, quantity: 1 })}
//               className="bg-green-500 text-white px-4 py-2 rounded flex-1"
//             >
//               Add to Cart
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };


// export default Home;

