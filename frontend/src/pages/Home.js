// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Phone, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCartNotification, setShowCartNotification] = useState(false);
  const {addToCart} = useCart();
  const phoneNumber = "+16048348118";
  const categorySliderRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products').then(res => res.json()),
          fetch('/api/categories').then(res => res.json())
        ]);
        setProducts(productsRes);
        setCategories(categoriesRes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scroll = (direction) => {
    const container = categorySliderRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      await addToCart({ 
        product, 
        quantity: 1,
        customization: {
          preview: product.templates[0]?.data || ''
        } 
      });
      
      // Show notification
      setShowCartNotification(true);
      setTimeout(() => setShowCartNotification(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

   // Filter and limit products
   const filteredProducts = products
   .filter(product => 
     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.description.toLowerCase().includes(searchTerm.toLowerCase())
   )
   .slice(0, 6);

 // Filter categories
 const filteredCategories = categories.filter(category =>
   category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
 );

 if (loading) {
   return (
     <div className="flex justify-center items-center h-screen">
       <div className="text-2xl text-gray-600">Loading...</div>
     </div>
   );
 }

 return (
   <div className="flex flex-col min-h-screen">
     {/* Cart Notification */}
     {showCartNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <p>Item added to cart successfully!</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center py-48 mb-20" 
        style={{
          backgroundImage: `url('/images/s1.jpg')`,
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-5xl font-serif font-bold mb-12">
              Professional Custom Packaging Solutions
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Elevate your brand with premium quality custom bags and boxes. 
              Perfect for businesses of all sizes.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.href = '/products'}
                className="bg-yellow-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Explore Products
              </button>
              <a
                href={`tel:${phoneNumber}`}
                className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Call to Order
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 mb-32" >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900">
            Browse Categories
          </h2>
          <div className="relative w-64" >
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div 
            ref={categorySliderRef}
            className="flex overflow-x-auto hide-scrollbar gap-6 px-12"
            style={{paddingTop:15+'px'}}
          >
            {filteredCategories.map((category) => (
              <div
                key={category._id}
                onClick={() => window.location.href = `/products?category=${category._id}`}
                className="flex-none cursor-pointer transition-transform hover:scale-105"
              >
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 mb-3">
                  <img
                    src={category.image?.data || '/api/placeholder/160/160'}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center font-medium text-gray-800">{category.name}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Featured Products Section */}
{/* Featured Products Section */}
<div className="container mx-auto px-4 mb-32">
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-3xl font-serif font-bold text-gray-900">
      Featured Products
    </h2>
    <div className="relative w-64">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    {filteredProducts.slice(0, 5).map((product) => (
      <div 
        key={product._id}
        className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
      >
        <div className="relative pb-[100%]">
          <img
            src={product.templates[0]?.data || '/api/placeholder/400/400'}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
            {product.name}
          </h3>
          <p className="text-gray-600 mb-4 text-sm line-clamp-2">
            {product.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-blue-600">
              ${product.basePrice.toFixed(2)}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    window.location.href = '/login';
                    return;
                  }                  
                  window.location.href = `/customize/${product._id}`}}
                className="text-gray-600 hover:text-blue-600 transition-colors"
                title="Customize"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => handleAddToCart(product)}
                className="text-gray-600 hover:text-green-600 transition-colors"
                title="Add to Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  <div className="text-center mt-8">
    <button
      onClick={() => window.location.href = '/products'}
      className="bg-[#033568] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
    >
      View All Products
    </button>
  </div>
</div>


      
      {/* Statistics Section */}
      <div className="bg-[#033568] py-20 mb-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-lg">Happy Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-lg">Products Delivered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-lg">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-lg">Customer Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 mb-32">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">
          What Our Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                RC
              </div>
              <div className="ml-4">
                <div className="font-bold">Royal Cafe</div>
                <div className="text-gray-500">Restaurant Chain</div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "The custom packaging from Bag & Box has significantly elevated our brand image. 
              The quality is exceptional, and their customer service is outstanding."
            </p>
            <div className="flex text-yellow-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                GS
              </div>
              <div className="ml-4">
                <div className="font-bold">Green Solutions</div>
                <div className="text-gray-500">Eco-friendly Store</div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "Finding sustainable packaging solutions was crucial for our business. 
              Bag & Box provided exactly what we needed with their eco-friendly options."
            </p>
            <div className="flex text-yellow-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                FB
              </div>
              <div className="ml-4">
              <div className="font-bold">Fashion Boutique</div>
                <div className="text-gray-500">Clothing Store</div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "Their custom shopping bags have become a signature part of our brand. 
              The quality and attention to detail is consistently impressive."
            </p>
            <div className="flex text-yellow-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-[#001548] py-20 mb-32">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Brand?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of successful businesses who trust us with their packaging needs.
            Get started with your custom solution today.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Products
            </button>
            <a
              href={`tel:${phoneNumber}`}
              className="bg-amber-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

{/* About Section */}
<div className="bg-gray-50 py-16" style={{marginBottom:50+'px'}}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">
              Why Choose Bag & Box?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">Premium materials and expert craftsmanship in every product</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Competitive Pricing</h3>
                <p className="text-gray-600">Great value without compromising on quality</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Quick turnaround times and reliable shipping</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};



export default Home;





// //working simple
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { useCart } from '../context/CartContext';


// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const { addToCart } = useCart();
//   const phoneNumber = "+16048348118";

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

//   // Filter products based on search term
//   const filteredProducts = products.filter(product => 
//     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     product.description.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-2xl text-gray-600">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col min-h-screen">
//       {/* Fixed Call Button */}
//       <a
//         href={`tel:${phoneNumber}`}
//         className="fixed top-20 right-4 z-50 flex items-center bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
//           <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
//         </svg>
//         <span>Call Now</span>
//       </a>

//       {/* Hero Section with Background */}
//       <div className="relative bg-cover bg-center py-20 mb-12 w-full" 
//            style={{backgroundImage: `url('../../images/hero-background2.jpg')`, backgroundBlendMode: 'overlay', backgroundColor: 'rgba(0,0,0,0.6)'}}>
//         <div className="container mx-auto px-4 relative z-10">
//           <div className="text-center text-white">
//             <h1 className="text-5xl font-serif font-bold mb-6 text-white">
//               BAG & BOX
//             </h1>
//             <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
//               Professional custom packaging for your business needs. Quality materials, elegant designs, reliable service.
//             </p>
            
//             {/* Search Bar */}
//             <div className="max-w-xl mx-auto mb-8">
//               <div className="relative">
//                 <input 
//                   type="text"
//                   placeholder="Search products..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//               </div>
//             </div>

//             <div className="flex justify-center gap-4">
//               <a
//                 href={`tel:${phoneNumber}`}
//                 className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
//               >
//                 Call to Order
//               </a>
//               <Link
//                 to="/products"
//                 className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
//               >
//                 Place Online Order
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Products Grid */}
//       <div className="container mx-auto px-4 mb-16 flex-grow w-full">
//         <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
//           Our Products
//         </h2>
//         {filteredProducts.length === 0 ? (
//           <div className="text-center text-gray-600">
//             No products found matching your search.
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//             {filteredProducts.map((product) => (
//               <div 
//                 key={product._id} 
//                 className="bg-white rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl"
//               >
//                 {product.templates[0] && (
//                   <img
//                     src={product.templates[0].data}
//                     alt={product.name}
//                     className="w-full h-64 object-cover rounded-t-lg"
//                   />
//                 )}
//                 <div className="p-6">
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                     {product.name}
//                   </h3>
//                   <p className="text-gray-600 mb-4 min-h-[3rem]">
//                     {product.description}
//                   </p>
//                   <p className="text-xl font-bold text-gray-900 mb-4">
//                     ${product.basePrice.toFixed(2)}
//                   </p>
//                   <div className="flex gap-2">
//                     <Link
//                       to={`/customize/${product._id}`}
//                       className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center font-semibold hover:bg-blue-700 transition-colors"
//                     >
//                       Customize
//                     </Link>
//                     <button
//                       onClick={() => addToCart({ 
//                         product, 
//                         quantity: 1,
//                         customization: {
//                           preview: product.templates[0]?.data || ''
//                         } 
//                       })}
//                       className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
//                     >
//                       Add to Cart
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>


//       {/* About Us Section */}
//       <div className="max-w-7xl mx-auto px-4 py-16 bg-white">
//         <div className="grid md:grid-cols-2 gap-12 items-center">
//           <div>
//             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">
//               About Bag & Box
//             </h2>
//             <div className="space-y-4 text-gray-600 leading-relaxed">
//               <p>
//                 At Bag&Box, we specialize in providing high-quality, customizable packaging solutions for businesses across North America. From shopping bags and pizza boxes to cup holders, we offer versatile products available in white and kraft brown.
//               </p>
//               <p>
//                 Our innovative printing system allows us to bring your branding ideas to life—whether it's a logo, slogan, or custom design—with vibrant full-color printing, even on low-order quantities.
//               </p>
//               <p>
//                 With a user-friendly platform at bagbox.ca, you can easily browse our products, customize your order, and upload your design in just a few clicks. Choose the quantity you need, and we'll handle the rest, delivering your order quickly and efficiently.
//               </p>
//             </div>
//           </div>
//           <div className="relative">
//             <img 
//               src="../../images/aboutUs.jpg" 
//               alt="Bag & Box Production" 
//               className="rounded-lg shadow-lg object-cover w-full h-96"
//             />
//             <div className="absolute inset-0 bg-blue-900 opacity-20 rounded-lg"></div>
//           </div>
//         </div>

//         <div className="mt-12" style={{marginTop:100+"px"}}>
//           <h3 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">
//             Why Choose Us?
//           </h3>
//           <div className="grid md:grid-cols-3 gap-8">
//             <div className="bg-gray-50 p-6 rounded-lg shadow-md">
//               <div className="flex items-center mb-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
//                 </svg>
//                 <h4 className="text-xl font-semibold text-gray-900">Expertise</h4>
//               </div>
//               <p className="text-gray-600">
//                 Backed by our founders' expertise in design and printing since 1998, we bring decades of knowledge to every project.
//               </p>
//             </div>
//             <div className="bg-gray-50 p-6 rounded-lg shadow-md">
//               <div className="flex items-center mb-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <h4 className="text-xl font-semibold text-gray-900">Low Minimum Order</h4>
//               </div>
//               <p className="text-gray-600">
//                 Unlike traditional printers, our system makes customization accessible for businesses of all sizes, no matter the order volume.
//               </p>
//             </div>
//             <div className="bg-gray-50 p-6 rounded-lg shadow-md">
//               <div className="flex items-center mb-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <h4 className="text-xl font-semibold text-gray-900">Fast & Affordable</h4>
//               </div>
//               <p className="text-gray-600">
//                 We understand the importance of cost and time for businesses. That's why we offer competitive prices and a fast turnaround.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="text-center mt-12" style={{marginTop:100+"px"}}>
//           <h3 className="text-3xl font-serif font-bold text-gray-900 mb-6">
//             Our Mission
//           </h3>
//           <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
//             At Bag&Box, our mission is to empower businesses by creating professional and cohesive packaging solutions that help them stand out and leave a lasting impression.
//           </p>
//           <p className="max-w-3xl mx-auto text-lg text-gray-600 mt-4 italic">
//             Let's transform your packaging into a powerful marketing tool—quick, affordable, and customized for you!
//           </p>
//         </div>
//       </div>


//       {/* Trust Indicators */}
//       <div className="bg-gray-50 py-16">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
//             <div>
//               <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
//               <p className="text-gray-600">Premium materials and craftsmanship</p>
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold mb-2">Professional Service</h3>
//               <p className="text-gray-600">Expert guidance and support</p>
//             </div>
//             <div>
//               <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
//               <p className="text-gray-600">Quick turnaround on all orders</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;
