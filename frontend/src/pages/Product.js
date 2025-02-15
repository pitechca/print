// src/pages/Product.js
import React, { useState, useEffect,  useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, ShoppingCart } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import { useCart } from '../context/CartContext';
import Lottie from 'lottie-react'; 
import cartAnimation from '../assets/cartAnimation.json'; 

// Slideshow Header Component
const SlideshowHeader = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/images/s1.jpg',
    '/images/s3.jpg',
    '/images/s4.jpg',
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

  return (
    <div className="relative w-full h-[600px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div
          key={slide}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <img 
            src={slide} 
            alt={`Bag & Box Packaging Solution ${index + 1}`} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <h2 className="text-white text-4xl md:text-5xl font-bold drop-shadow-lg px-4">
              Transforming Packaging, Elevating Brands
            </h2>
          </div>
        </div>
      ))}
      
      {/* Slide Navigation Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};


const Product = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [bagSearchTerm, setBagSearchTerm] = useState('');
  const [boxSearchTerm, setBoxSearchTerm] = useState('');  const [loading, setLoading] = useState(true);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const { addToCart } = useCart();


  // Refs for scroll containers
  const bagSliderRef = React.useRef(null);
  const boxSliderRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch basic data without images (fast)
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories/basic').then(res => res.json()),
          fetch('/api/products/basic').then(res => res.json())
        ]);

        setCategories(categoriesRes);
        setProducts(productsRes);
        setLoading(false);  // We can show the page now with placeholders

        // Then fetch images in parallel
        const categoryImagePromises = categoriesRes.map(category =>
          fetch(`/api/categories/${category._id}/image`)
            .then(res => res.json())
            .then(imageData => {
              setCategories(prev => prev.map(c => 
                c._id === category._id ? { ...c, image: imageData } : c
              ));
            })
            .catch(error => console.error(`Error loading image for category ${category._id}:`, error))
        );

        const productImagePromises = productsRes.map(product =>
          fetch(`/api/products/${product._id}/image`)
            .then(res => res.json())
            .then(imageData => {
              setProducts(prev => prev.map(p => 
                p._id === product._id ? { ...p, images: [imageData] } : p
              ));
            })
            .catch(error => console.error(`Error loading image for product ${product._id}:`, error))
        );

        // Load all images in parallel
        await Promise.allSettled([...categoryImagePromises, ...productImagePromises]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const scroll = (direction, ref) => {
    const container = ref.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const navigateToProduct = (productId) => {
    window.location.href = `/customize/${productId}`;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(mainSearchTerm.toLowerCase())
  );

  const filteredBagCategories = filteredCategories.filter(cat => 
    cat.name.toLowerCase().includes('bag')
  );

  const filteredBoxCategories = filteredCategories.filter(cat => 
    cat.name.toLowerCase().includes('box')
  );

  const filteredProducts = selectedCategory
  ? products.filter(product => 
      product.category._id === selectedCategory &&
      (product.name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
       product.description.toLowerCase().includes(mainSearchTerm.toLowerCase()))
    )
  : products.filter(product =>
      product.name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(mainSearchTerm.toLowerCase())
    );

  const getProductsByCategory = (categoryId, searchTerm = '') => {
    return products.filter(product => 
      product.category?._id === categoryId &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
          preview: product.images[0]?.data || '',
          description: ''
        } 
      });
      
      // Show notification and scroll to top
      setShowCartNotification(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowCartNotification(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

return (
    <div className="min-h-screen bg-gray-50">

      <SlideshowHeader />


      {/* Cart Notification */}
      {/* {showCartNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <p>Item added to cart successfully!</p>
          </div>
        </div>
      )} */}
   {/* Cart Notification */}
   {showCartNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out animate-notification">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            {/* Lottie animation for cart notification (bigger) */}
            <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
            <p className="text-xl">Item added to cart successfully!</p>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Search Bar */}
        <div className="mb-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search between all categories..."
                value={mainSearchTerm}
                onChange={(e) => setMainSearchTerm(e.target.value)}
                className="w-full px-4 py-4 pl-12 rounded-xl border-2 border-blue-500 focus:outline-none focus:border-blue-600 text-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            </div>
          </div>
        </div>

           {/* Bags Section */}
           <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold text-gray-900">Shopping Bags</h2>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search bags..."
                value={bagSearchTerm}
                onChange={(e) => setBagSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full border-2 border-blue-500 focus:outline-none focus:border-blue-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          {/* Categories Slider */}
          <div className="relative mb-12">
            <button
              onClick={() => scroll('left', bagSliderRef)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronLeft size={32} />
            </button>
            
            <div 
              ref={bagSliderRef}
              className="flex overflow-x-auto hide-scrollbar gap-12 px-16 py-4"
              style={{paddingTop: 15+'px'}}
            >
              {filteredBagCategories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`flex-none cursor-pointer transition-transform hover:scale-105 ${
                    selectedCategory === category._id ? 'scale-105' : ''
                  }`}
                >
                  <div className={`w-48 h-48 rounded-full overflow-hidden border-4 mb-4 ${
                    selectedCategory === category._id ? 'border-amber-500' : 'border-blue-500'
                  }`}>
                    <LazyImage
                      src={category.image?.data}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center font-medium text-gray-800 text-lg max-w-[180px] mx-auto">{category.name}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('right', bagSliderRef)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Products Grid for Selected Bag Category */}
          {selectedCategory && filteredBagCategories.some(cat => cat._id === selectedCategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 mx-8">
              {getProductsByCategory(selectedCategory, bagSearchTerm).map((product) => (
                <div 
                  key={product._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                >                 
                  <div className="relative pb-[75%]">
                  <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            window.location.href = '/login';
                            return;
                          }                  
                          navigateToProduct(product._id)
                        }}
                      >
                    <LazyImage
                      src={product.images?.[0]?.data}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
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
                            navigateToProduct(product._id)
                          }}
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
              {getProductsByCategory(selectedCategory).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-xl text-gray-600">No products found in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>

       {/* Boxes Section */}
       <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold text-gray-900">Packaging Boxes</h2>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search boxes..."
                value={boxSearchTerm}
                onChange={(e) => setBoxSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full border-2 border-blue-500 focus:outline-none focus:border-blue-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          {/* Categories Slider */}
          <div className="relative mb-12">
            <button
              onClick={() => scroll('left', boxSliderRef)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronLeft size={32} />
            </button>
            
            <div 
              ref={boxSliderRef}
              className="flex overflow-x-auto hide-scrollbar gap-12 px-16 py-4"
              style={{paddingTop: 15+'px'}}
            >
              {filteredBoxCategories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`flex-none cursor-pointer transition-transform hover:scale-105 ${
                    selectedCategory === category._id ? 'scale-105' : ''
                  }`}
                >
                  <div className={`w-48 h-48 rounded-full overflow-hidden border-4 mb-4 ${
                    selectedCategory === category._id ? 'border-amber-500' : 'border-blue-500'
                  }`}>
                    <LazyImage
                      src={category.image?.data}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center font-medium text-gray-800" style={{maxWidth:120+'px'}}>{category.name}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('right', boxSliderRef)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Products Grid for Selected Box Category */}
          {selectedCategory && filteredBoxCategories.some(cat => cat._id === selectedCategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 mx-8">
              {getProductsByCategory(selectedCategory, boxSearchTerm).map((product) => (
                    <div 
                  key={product._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="relative pb-[75%]">
                  <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            window.location.href = '/login';
                            return;
                          }                  
                          navigateToProduct(product._id)
                        }}
                      >
                    <LazyImage
                      src={product.images?.[0]?.data}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
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
                            navigateToProduct(product._id)
                          }}
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
              {getProductsByCategory(selectedCategory).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-xl text-gray-600">No products found in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show message when no category is selected */}
        {!selectedCategory && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Select a category to view products.</p>
          </div>
        )}
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

export default Product;









// // without lottie
// // src/pages/Product.js
// import React, { useState, useEffect,  useCallback } from 'react';
// import { ChevronLeft, ChevronRight, Search, ShoppingCart } from 'lucide-react';
// import LazyImage from '../components/LazyImage';
// import { useCart } from '../context/CartContext';


// // Slideshow Header Component
// const SlideshowHeader = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const slides = [
//     '/images/s1.jpg',
//     '/images/s3.jpg',
//     '/images/s4.jpg',
//   ];

//   const nextSlide = useCallback(() => {
//     setCurrentSlide((prev) => (prev + 1) % slides.length);
//   }, [slides.length]);

//   const prevSlide = useCallback(() => {
//     setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
//   }, [slides.length]);

//   useEffect(() => {
//     const slideInterval = setInterval(nextSlide, 5000);
//     return () => clearInterval(slideInterval);
//   }, [nextSlide]);

//   return (
//     <div className="relative w-full h-[600px] overflow-hidden group">
//       {slides.map((slide, index) => (
//         <div
//           key={slide}
//           className={`absolute inset-0 transition-opacity duration-1000 ${
//             index === currentSlide ? 'opacity-100' : 'opacity-0'
//           }`}
//         >
//           <div className="absolute inset-0 bg-black opacity-40"></div>
//           <img 
//             src={slide} 
//             alt={`Bag & Box Packaging Solution ${index + 1}`} 
//             className="w-full h-full object-cover"
//             loading="lazy"
//           />
//           <div className="absolute inset-0 flex items-center justify-center text-center">
//             <h2 className="text-white text-4xl md:text-5xl font-bold drop-shadow-lg px-4">
//               Transforming Packaging, Elevating Brands
//             </h2>
//           </div>
//         </div>
//       ))}
      
//       {/* Slide Navigation Controls */}
//       <button 
//         onClick={prevSlide}
//         className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
//         aria-label="Previous Slide"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//         </svg>
//       </button>
//       <button 
//         onClick={nextSlide}
//         className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
//         aria-label="Next Slide"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//         </svg>
//       </button>

//       {/* Slide Indicators */}
//       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
//         {slides.map((_, index) => (
//           <button
//             key={index}
//             onClick={() => setCurrentSlide(index)}
//             className={`w-3 h-3 rounded-full transition-all ${
//               index === currentSlide 
//                 ? 'bg-white w-6' 
//                 : 'bg-white/50 hover:bg-white/75'
//             }`}
//             aria-label={`Go to slide ${index + 1}`}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };


// const Product = () => {
//   const [categories, setCategories] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [mainSearchTerm, setMainSearchTerm] = useState('');
//   const [bagSearchTerm, setBagSearchTerm] = useState('');
//   const [boxSearchTerm, setBoxSearchTerm] = useState('');  const [loading, setLoading] = useState(true);
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   const { addToCart } = useCart();


//   // Refs for scroll containers
//   const bagSliderRef = React.useRef(null);
//   const boxSliderRef = React.useRef(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // First fetch basic data without images (fast)
//         const [categoriesRes, productsRes] = await Promise.all([
//           fetch('/api/categories/basic').then(res => res.json()),
//           fetch('/api/products/basic').then(res => res.json())
//         ]);

//         setCategories(categoriesRes);
//         setProducts(productsRes);
//         setLoading(false);  // We can show the page now with placeholders

//         // Then fetch images in parallel
//         const categoryImagePromises = categoriesRes.map(category =>
//           fetch(`/api/categories/${category._id}/image`)
//             .then(res => res.json())
//             .then(imageData => {
//               setCategories(prev => prev.map(c => 
//                 c._id === category._id ? { ...c, image: imageData } : c
//               ));
//             })
//             .catch(error => console.error(`Error loading image for category ${category._id}:`, error))
//         );

//         const productImagePromises = productsRes.map(product =>
//           fetch(`/api/products/${product._id}/image`)
//             .then(res => res.json())
//             .then(imageData => {
//               setProducts(prev => prev.map(p => 
//                 p._id === product._id ? { ...p, images: [imageData] } : p
//               ));
//             })
//             .catch(error => console.error(`Error loading image for product ${product._id}:`, error))
//         );

//         // Load all images in parallel
//         await Promise.allSettled([...categoryImagePromises, ...productImagePromises]);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const scroll = (direction, ref) => {
//     const container = ref.current;
//     if (container) {
//       const scrollAmount = direction === 'left' ? -300 : 300;
//       container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
//   };

//   const navigateToProduct = (productId) => {
//     window.location.href = `/customize/${productId}`;
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(mainSearchTerm.toLowerCase())
//   );

//   const filteredBagCategories = filteredCategories.filter(cat => 
//     cat.name.toLowerCase().includes('bag')
//   );

//   const filteredBoxCategories = filteredCategories.filter(cat => 
//     cat.name.toLowerCase().includes('box')
//   );

//   const filteredProducts = selectedCategory
//   ? products.filter(product => 
//       product.category._id === selectedCategory &&
//       (product.name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
//        product.description.toLowerCase().includes(mainSearchTerm.toLowerCase()))
//     )
//   : products.filter(product =>
//       product.name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
//       product.description.toLowerCase().includes(mainSearchTerm.toLowerCase())
//     );

//   const getProductsByCategory = (categoryId, searchTerm = '') => {
//     return products.filter(product => 
//       product.category?._id === categoryId &&
//       (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         product.description.toLowerCase().includes(searchTerm.toLowerCase()))
//     );
//   };

//   const handleAddToCart = async (product) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         window.location.href = '/login';
//         return;
//       }
  
//       await addToCart({ 
//         product, 
//         quantity: 1,
//         customization: {
//           preview: product.images[0]?.data || '',
//           description: ''
//         } 
//       });
      
//       // Show notification and scroll to top
//       setShowCartNotification(true);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//       setTimeout(() => setShowCartNotification(false), 2000);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//     }
//   };

// return (
//     <div className="min-h-screen bg-gray-50">

//       <SlideshowHeader />


//       {/* Cart Notification */}
//       {showCartNotification && (
//         <div className="fixed top-24 right-4 z-50 animate-slide-in">
//           <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
//             <ShoppingCart className="h-4 w-4" />
//             <p>Item added to cart successfully!</p>
//           </div>
//         </div>
//       )}


//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Main Search Bar */}
//         <div className="mb-12">
//           <div className="max-w-3xl mx-auto">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search between all categories..."
//                 value={mainSearchTerm}
//                 onChange={(e) => setMainSearchTerm(e.target.value)}
//                 className="w-full px-4 py-4 pl-12 rounded-xl border-2 border-blue-500 focus:outline-none focus:border-blue-600 text-lg"
//               />
//               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
//             </div>
//           </div>
//         </div>

//            {/* Bags Section */}
//            <div className="mb-16">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//             <h2 className="text-3xl font-bold text-gray-900">Shopping Bags</h2>
//             <div className="relative w-full md:w-64">
//               <input
//                 type="text"
//                 placeholder="Search bags..."
//                 value={bagSearchTerm}
//                 onChange={(e) => setBagSearchTerm(e.target.value)}
//                 className="w-full px-4 py-2 pl-10 rounded-full border-2 border-blue-500 focus:outline-none focus:border-blue-600"
//               />
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//             </div>
//           </div>
          
//           {/* Categories Slider */}
//           <div className="relative mb-12">
//             <button
//               onClick={() => scroll('left', bagSliderRef)}
//               className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronLeft size={32} />
//             </button>
            
//             <div 
//               ref={bagSliderRef}
//               className="flex overflow-x-auto hide-scrollbar gap-12 px-16 py-4"
//               style={{paddingTop: 15+'px'}}
//             >
//               {filteredBagCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => setSelectedCategory(category._id)}
//                   className={`flex-none cursor-pointer transition-transform hover:scale-105 ${
//                     selectedCategory === category._id ? 'scale-105' : ''
//                   }`}
//                 >
//                   <div className={`w-48 h-48 rounded-full overflow-hidden border-4 mb-4 ${
//                     selectedCategory === category._id ? 'border-amber-500' : 'border-blue-500'
//                   }`}>
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="text-center font-medium text-gray-800 text-lg max-w-[180px] mx-auto">{category.name}</p>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={() => scroll('right', bagSliderRef)}
//               className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronRight size={32} />
//             </button>
//           </div>

//           {/* Products Grid for Selected Bag Category */}
//           {selectedCategory && filteredBagCategories.some(cat => cat._id === selectedCategory) && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 mx-8">
//               {getProductsByCategory(selectedCategory, bagSearchTerm).map((product) => (
//                 <div 
//                   key={product._id}
//                   className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//                 >                 
//                   <div className="relative pb-[75%]">
//                   <button
//                         onClick={() => {
//                           const token = localStorage.getItem('token');
//                           if (!token) {
//                             window.location.href = '/login';
//                             return;
//                           }                  
//                           navigateToProduct(product._id)
//                         }}
//                       >
//                     <LazyImage
//                       src={product.images?.[0]?.data}
//                       alt={product.name}
//                       className="absolute inset-0 w-full h-full object-cover"
//                     />
//                     </button>
//                   </div>
//                   <div className="p-6">
//                     <h3 className="text-xl font-bold text-gray-900 mb-2">
//                       {product.name}
//                     </h3>
//                     <p className="text-gray-600 mb-4 line-clamp-2">
//                       {product.description}
//                     </p>
//                     <div className="flex justify-between items-center">
//                       <span className="text-2xl font-bold text-blue-600">
//                         ${product.basePrice.toFixed(2)}
//                       </span>
//                       <div className="flex gap-3">
//                         <button
//                           onClick={() => {
//                             const token = localStorage.getItem('token');
//                             if (!token) {
//                               window.location.href = '/login';
//                               return;
//                             }                  
//                             navigateToProduct(product._id)
//                           }}
//                           className="text-gray-600 hover:text-blue-600 transition-colors"
//                           title="Customize"
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => handleAddToCart(product)}
//                           className="text-gray-600 hover:text-green-600 transition-colors"
//                           title="Add to Cart"
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {getProductsByCategory(selectedCategory).length === 0 && (
//                 <div className="col-span-full text-center py-12">
//                   <p className="text-xl text-gray-600">No products found in this category.</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//        {/* Boxes Section */}
//        <div className="mb-16">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//             <h2 className="text-3xl font-bold text-gray-900">Packaging Boxes</h2>
//             <div className="relative w-full md:w-64">
//               <input
//                 type="text"
//                 placeholder="Search boxes..."
//                 value={boxSearchTerm}
//                 onChange={(e) => setBoxSearchTerm(e.target.value)}
//                 className="w-full px-4 py-2 pl-10 rounded-full border-2 border-blue-500 focus:outline-none focus:border-blue-600"
//               />
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//             </div>
//           </div>
          
//           {/* Categories Slider */}
//           <div className="relative mb-12">
//             <button
//               onClick={() => scroll('left', boxSliderRef)}
//               className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronLeft size={32} />
//             </button>
            
//             <div 
//               ref={boxSliderRef}
//               className="flex overflow-x-auto hide-scrollbar gap-12 px-16 py-4"
//               style={{paddingTop: 15+'px'}}
//             >
//               {filteredBoxCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => setSelectedCategory(category._id)}
//                   className={`flex-none cursor-pointer transition-transform hover:scale-105 ${
//                     selectedCategory === category._id ? 'scale-105' : ''
//                   }`}
//                 >
//                   <div className={`w-48 h-48 rounded-full overflow-hidden border-4 mb-4 ${
//                     selectedCategory === category._id ? 'border-amber-500' : 'border-blue-500'
//                   }`}>
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="text-center font-medium text-gray-800" style={{maxWidth:120+'px'}}>{category.name}</p>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={() => scroll('right', boxSliderRef)}
//               className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronRight size={32} />
//             </button>
//           </div>

//           {/* Products Grid for Selected Box Category */}
//           {selectedCategory && filteredBoxCategories.some(cat => cat._id === selectedCategory) && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 mx-8">
//               {getProductsByCategory(selectedCategory, boxSearchTerm).map((product) => (
//                     <div 
//                   key={product._id}
//                   className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//                 >
//                   <div className="relative pb-[75%]">
//                   <button
//                         onClick={() => {
//                           const token = localStorage.getItem('token');
//                           if (!token) {
//                             window.location.href = '/login';
//                             return;
//                           }                  
//                           navigateToProduct(product._id)
//                         }}
//                       >
//                     <LazyImage
//                       src={product.images?.[0]?.data}
//                       alt={product.name}
//                       className="absolute inset-0 w-full h-full object-cover"
//                     />
//                     </button>
//                   </div>
//                   <div className="p-6">
//                     <h3 className="text-xl font-bold text-gray-900 mb-2">
//                       {product.name}
//                     </h3>
//                     <p className="text-gray-600 mb-4 line-clamp-2">
//                       {product.description}
//                     </p>
//                     <div className="flex justify-between items-center">
//                       <span className="text-2xl font-bold text-blue-600">
//                         ${product.basePrice.toFixed(2)}
//                       </span>
//                       <div className="flex gap-3">
//                         <button
//                           onClick={() => {
//                             const token = localStorage.getItem('token');
//                             if (!token) {
//                               window.location.href = '/login';
//                               return;
//                             }                  
//                             navigateToProduct(product._id)
//                           }}
//                           className="text-gray-600 hover:text-blue-600 transition-colors"
//                           title="Customize"
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => handleAddToCart(product)}
//                           className="text-gray-600 hover:text-green-600 transition-colors"
//                           title="Add to Cart"
//                         >
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {getProductsByCategory(selectedCategory).length === 0 && (
//                 <div className="col-span-full text-center py-12">
//                   <p className="text-xl text-gray-600">No products found in this category.</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Show message when no category is selected */}
//         {!selectedCategory && (
//           <div className="text-center py-12">
//             <p className="text-xl text-gray-600">Select a category to view products.</p>
//           </div>
//         )}
//       </div>

//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
        
//         @keyframes slide-in {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
        
//         .animate-slide-in {
//           animation: slide-in 0.3s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Product;




