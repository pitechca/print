// working with new diesgn 
// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Phone, ShoppingCart,} from 'lucide-react';
import { useCart } from '../context/CartContext';
import LazyImage from '../components/LazyImage';
import Lottie from 'lottie-react'; 
import cartAnimation from '../assets/cartAnimation.json'; 

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // For vertical layout
  const { addToCart } = useCart();
  const phoneNumber = "+16048348118";
  const categorySliderRef = React.useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadIncrement = 6;

  
// New state to control how many products are visible for the selected category
const [visibleCount, setVisibleCount] = useState(6);
// new state at the top of your Home component (with your other useState calls)
const [showCategoryModal, setShowCategoryModal] = useState(false);


useEffect(() => {
  // Reset visible count when a new category is selected
  setVisibleCount(6);
}, [selectedCategory]);



  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // First fetch basic data without images (fast)
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products/basic').then(res => res.json()),
          fetch('/api/categories/basic').then(res => res.json())
        ]);
        
        setProducts(productsRes);
        setCategories(categoriesRes);
        setLoading(false); 

        // Then fetch images in parallel
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

        // Load all images in parallel
        await Promise.allSettled([...productImagePromises, ...categoryImagePromises]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Set a default selected category if none is set and categories are loaded
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]._id);
    }
  }, [selectedCategory, categories]);

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
          preview: product.images[0]?.data || '',
          description: ''
        } 
      });
      
      setShowCartNotification(true);
      setTimeout(() => setShowCartNotification(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Filter products for the Featured Products section (unrelated to vertical layout)
  const filteredProducts = products
    .filter(product => 
      product.isFeatured &&
      (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .slice(0, 6);

  // Filter categories based on search input
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
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out animate-notification">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            {/* Lottie animation for cart notification */}
            <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
            <p className="text-xl">Item added to cart successfully!</p>
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
                Customize Products
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
      <div className="container mx-auto px-4 mb-32">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900">
            Browse Categories
          </h2>
          <div className="relative w-64">
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

        {filteredCategories.length < 9 ? (
          <>
            {/* Desktop/Tablet Layout */}
            <div className="hidden md:flex flex-col md:flex-row gap-6">
              {/* Left Column: Category List with Bigger Images */}
              <div className="w-full md:w-1/3">
                {filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    onClick={() => setSelectedCategory(category._id)}
                    className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category._id ? 'bg-gray-200' : ''
                    }`}
                  >
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 mr-4">
                      <LazyImage
                        src={category.image?.data}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="font-medium text-gray-800 text-lg">{category.name}</p>
                  </div>
                ))}
              </div>
              {/* Right Column: Related Products for the Selected Category */}
              <div className="w-full md:w-2/3">
                {selectedCategory ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {products
                        .filter(product =>
                          product.category?.__id
                            ? product.category.__id === selectedCategory
                            : product.category?._id === selectedCategory
                        )
                        .slice(0, visibleCount)
                        .map((product) => (
                          <div
                            key={product._id}
                            className="rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                          >
                            <div className="relative pb-[100%]">
                              <button
                                onClick={() => {
                                  window.location.href = `/customize/${product._id}`;
                                }}
                              >
                                <LazyImage
                                  src={product.images?.[0]?.data}
                                  alt={product.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              </button>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                                {product.name}
                              </h3>
                              <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                                {product.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-m font-bold text-blue-600">
                                  ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
                                </span>
                                {/* <div className="flex gap-3">
                                  <button
                                    onClick={() => {
                                      window.location.href = `/customize/${product._id}`;
                                    }}
                                    className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    <span>Customize</span>
                                  </button>
                                </div> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      {products.filter(product =>
                        product.category?.__id
                          ? product.category.__id === selectedCategory
                          : product.category?._id === selectedCategory
                      ).length === 0 && (
                        <p className="text-gray-600">No products found for this category.</p>
                      )}
                    </div>
                    {products.filter(product =>
                      product.category?.__id
                        ? product.category.__id === selectedCategory
                        : product.category?._id === selectedCategory
                    ).length > visibleCount && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => {
                            setIsLoadingMore(true);
                            setTimeout(() => {
                              setVisibleCount(visibleCount + loadIncrement);
                              setIsLoadingMore(false);
                            }, 500);
                          }}
                          className="bg-blue-900 text-white px-7 py-3 rounded hover:bg-blue-800 transition-colors"
                        >
                          {isLoadingMore ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                          ) : (
                            "Load More"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">Select a category to see related products.</p>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-6">
              {filteredCategories.map((category) => (
                <div key={category._id}>
                  <div
                    onClick={() => setSelectedCategory(category._id)}
                    className={`flex items-center p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category._id ? 'bg-gray-200' : ''
                    }`}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500 mr-4">
                      <LazyImage
                        src={category.image?.data}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="font-medium text-gray-800 text-lg">{category.name}</p>
                  </div>
                  {selectedCategory === category._id && (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {products
                          .filter(product =>
                            product.category?.__id
                              ? product.category.__id === category._id
                              : product.category?._id === category._id
                          )
                          .slice(0, visibleCount)
                          .map((product) => (
                            <div
                              key={product._id}
                              className="rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
                            >
                              <div className="relative pb-[100%]">
                                <button
                                  onClick={() => {
                                    window.location.href = `/customize/${product._id}`;
                                  }}
                                >
                                  <LazyImage
                                    src={product.images?.[0]?.data}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                </button>
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                                  {product.name}
                                </h3>
                                <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="flex justify-between items-center">
                                  <span className="text-m font-bold text-blue-600">
                                    ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
                                  </span>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => {
                                        window.location.href = `/customize/${product._id}`;
                                      }}
                                      className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                      <span>Customize</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        {products.filter(product =>
                          product.category?.__id
                            ? product.category.__id === category._id
                            : product.category?._id === category._id
                        ).length === 0 && (
                          <p className="text-gray-600">No products found for this category.</p>
                        )}
                      </div>
                      {products.filter(product =>
                        product.category?.__id
                          ? product.category.__id === category._id
                          : product.category?._id === category._id
                      ).length > visibleCount && (
                        <div className="flex justify-center mt-8">
                          <button
                            onClick={() => {
                              setIsLoadingMore(true);
                              setTimeout(() => {
                                setVisibleCount(visibleCount + loadIncrement);
                                setIsLoadingMore(false);
                              }, 500);
                            }}
                            className="bg-blue-900 text-white px-7 py-3 rounded hover:bg-blue-800 transition-colors"
                          >
                            {isLoadingMore ? (
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                              </svg>
                            ) : (
                              "Load More"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          // Slider layout for 9 or more categories remains unchanged
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
              style={{ paddingTop: '15px' }}
            >
              {filteredCategories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => window.location.href = `/products?category=${category._id}`}
                  className="flex-none cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 mb-3">
                    <LazyImage
                      src={category.image?.data}
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
        )}

      </div>

      {/* Static Section */}
      <div className="w-full mb-32 mt-16">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-10 flex flex-col md:flex-row items-center shadow-xl">
          <div className="md:w-1/2 mb-6 md:mb-0 pl-10 lg:pl-20 xl:pl-40">
            <h2 className="text-4xl font-bold mb-4">Discover Our Unique Packaging Solutions</h2>
            <p className="text-lg">
              Experience creativity and innovation in every design. Our custom packaging solutions are crafted to elevate your brand's presence and make a lasting impression.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center pr-0">
            <img
              src="/images/logo-static.png"
              alt="Packaging"
              className="w-[500px] h-auto rounded-tl-[50px] shadow-lg -mr-10"
            />
          </div>
        </div>
      </div>


      {/* Featured Products Section */}
      {/* Separator */}
      <div className="container mx-auto px-4 my-16">
        <div className="flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 uppercase tracking-widest text-sm">
          <h2 className="text-3xl font-serif font-bold text-gray-900">
            Featured Products
          </h2>
          </span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.slice(0, 5).map((product) => (
            <div 
              key={product._id}
              className=" rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
            >
              <div className="relative pb-[100%]">
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    // if (!token) {
                    //   window.location.href = '/login';
                    //   return;
                    // }                  
                    window.location.href = `/customize/${product._id}`;
                  }}
                >
                  <LazyImage
                    src={product.images?.[0]?.data}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-m font-bold text-blue-600">
                    ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
                  </span>
                  <div className="flex gap-3">
                    {/* <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          window.location.href = '/login';
                          return;
                        }                  
                        window.location.href = `/customize/${product._id}`;
                      }}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                      title="Customize"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button> */}
                    <div>
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          // if (!token) {
                          //   window.location.href = '/login';
                          //   return;
                          // }
                          window.location.href = `/customize/${product._id}`;
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Customize</span>
                      </button>
                    </div>

                    {/* <button
                      onClick={() => handleAddToCart(product)}
                      className="text-gray-600 hover:text-green-600 transition-colors"
                      title="Add to Cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-20">
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
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-[#001548] py-20 mb-20">
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
      <div className="bg-gray-50 py-16" style={{ marginBottom: '80px'}}>
        <div className="container mx-auto px-4">
          <div className="max-w-full mx-auto">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center"
            style={{marginBottom: 50+'px'}}>
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
                <p className="text-gray-600" style={{textAlign: 'justify'}}>At Bag & Box, we prioritize excellence in every product we create. Our packaging is crafted using premium materials that ensure durability, functionality, and an attractive presentation. We adhere to strict quality control standards to guarantee consistency in every order. Whether you need sturdy boxes or elegant bags, our products are designed to protect your items while enhancing your brand’s image.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Competitive Pricing</h3>
                <p className="text-gray-600" style={{textAlign: 'justify'}}>We believe that top-quality packaging shouldn't come with a hefty price tag. Our competitive pricing structure ensures that you get the best value without compromising on quality. By optimizing production and sourcing cost-effective materials, we provide affordable solutions for businesses of all sizes. Whether you're ordering in small batches or bulk, you can count on us for cost-effective options tailored to your budget.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-600" style={{textAlign: 'justify'}}>We know that time is crucial for your business, which is why we focus on efficiency in production and logistics. Our streamlined processes allow us to fulfill orders quickly without sacrificing quality. With reliable shipping partners, we ensure that your packaging products arrive on time, helping you meet deadlines and keep your business running smoothly.</p>
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
        
        @keyframes notification {
          0% {
            opacity: 0;
            transform: translateX(100%) translateY(-50%);
          }
          7% {
            opacity: 1;
            transform: translateX(-10%) translateY(0);
          }
          10% {
            transform: translateX(0);
          }
          90% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        .animate-notification {
          animation: notification 2s ease-in-out forwards;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;







// // working with new diesgn but not for mobile
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, Search, Phone, ShoppingCart,} from 'lucide-react';
// import { useCart } from '../context/CartContext';
// import LazyImage from '../components/LazyImage';
// import Lottie from 'lottie-react'; 
// import cartAnimation from '../assets/cartAnimation.json'; 

// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categorySearchTerm, setCategorySearchTerm] = useState('');
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState(null); // For vertical layout
//   const { addToCart } = useCart();
//   const phoneNumber = "+16048348118";
//   const categorySliderRef = React.useRef(null);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const loadIncrement = 6;

  
// // New state to control how many products are visible for the selected category
// const [visibleCount, setVisibleCount] = useState(6);

// useEffect(() => {
//   // Reset visible count when a new category is selected
//   setVisibleCount(6);
// }, [selectedCategory]);



//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         // First fetch basic data without images (fast)
//         const [productsRes, categoriesRes] = await Promise.all([
//           fetch('/api/products/basic').then(res => res.json()),
//           fetch('/api/categories/basic').then(res => res.json())
//         ]);
        
//         setProducts(productsRes);
//         setCategories(categoriesRes);
//         setLoading(false); 

//         // Then fetch images in parallel
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

//         // Load all images in parallel
//         await Promise.allSettled([...productImagePromises, ...categoryImagePromises]);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   // Set a default selected category if none is set and categories are loaded
//   useEffect(() => {
//     if (!selectedCategory && categories.length > 0) {
//       setSelectedCategory(categories[0]._id);
//     }
//   }, [selectedCategory, categories]);

//   const scroll = (direction) => {
//     const container = categorySliderRef.current;
//     if (container) {
//       const scrollAmount = direction === 'left' ? -300 : 300;
//       container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
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
      
//       setShowCartNotification(true);
//       setTimeout(() => setShowCartNotification(false), 2000);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//     }
//   };

//   // Filter products for the Featured Products section (unrelated to vertical layout)
//   const filteredProducts = products
//     .filter(product => 
//       product.isFeatured &&
//       (
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     )
//     .slice(0, 6);

//   // Filter categories based on search input
//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
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
//       {/* Cart Notification */}
//       {showCartNotification && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out animate-notification">
//           <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
//             {/* Lottie animation for cart notification */}
//             <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
//             <p className="text-xl">Item added to cart successfully!</p>
//           </div>
//         </div>
//       )}

//       {/* Hero Section */}
//       <div 
//         className="relative bg-cover bg-center py-48 mb-20" 
//         style={{
//           backgroundImage: `url('/images/s1.jpg')`,
//           backgroundBlendMode: 'overlay',
//           backgroundColor: 'rgba(0,0,0,0.5)',
//         }}
//       >
//         <div className="container mx-auto px-4 relative z-10">
//           <div className="text-center text-white">
//             <h1 className="text-5xl font-serif font-bold mb-12">
//               Professional Custom Packaging Solutions
//             </h1>
//             <p className="text-xl mb-8 max-w-2xl mx-auto">
//               Elevate your brand with premium quality custom bags and boxes. 
//               Perfect for businesses of all sizes.
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={() => window.location.href = '/products'}
//                 className="bg-yellow-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-colors"
//               >
//                 Customize Products
//               </button>
//               <a
//                 href={`tel:${phoneNumber}`}
//                 className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
//               >
//                 Call to Order
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Categories Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Browse Categories
//           </h2>
//           <div className="relative w-64">
//             <input
//               type="text"
//               placeholder="Search categories..."
//               value={categorySearchTerm}
//               onChange={(e) => setCategorySearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
//             />
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//           </div>
//         </div>

//         {filteredCategories.length < 9 ? (
//           // Vertical layout when there are fewer than 9 categories
//           <div className="flex flex-col md:flex-row gap-6">
//             {/* Left Column: Category List with Bigger Images */}
//             <div className="w-full md:w-1/3">
//               {filteredCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => setSelectedCategory(category._id)}
//                   className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
//                     selectedCategory === category._id ? 'bg-gray-200' : ''
//                   }`}
//                 >
//                   <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 mr-4">
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="font-medium text-gray-800 text-lg">{category.name}</p>
//                 </div>
//               ))}
//             </div>
//             {/* Right Column: Related Products for the Selected Category */}
//             <div className="w-full md:w-2/3">
//               {selectedCategory ? (
//                <>
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

//                  {products
//                    .filter(product => product.category?.__id ? product.category.__id === selectedCategory : product.category?._id === selectedCategory)
//                    .slice(0, visibleCount)
//                    .map((product) => (
//                      <div 
//                        key={product._id}
//                        className="rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//                      >
//                        <div className="relative pb-[100%]">
//                          <button
//                            onClick={() => {
//                              const token = localStorage.getItem('token');
//                             //  if (!token) {
//                             //    window.location.href = '/login';
//                             //    return;
//                             //  }                  
//                              window.location.href = `/customize/${product._id}`;
//                            }}
//                          >
//                            <LazyImage
//                              src={product.images?.[0]?.data}
//                              alt={product.name}
//                              className="absolute inset-0 w-full h-full object-cover"
//                            />
//                          </button>
//                        </div>
//                        <div className="p-4">
//                          <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
//                            {product.name}
//                          </h3>
//                          <p className="text-gray-600 mb-4 text-sm line-clamp-2">
//                            {product.description}
//                          </p>
//                          <div className="flex justify-between items-center">
//                            <span className="text-m font-bold text-blue-600">
//                              ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
//                            </span>
//                            <div className="flex gap-3">
//                              <button
//                                onClick={() => {
//                                  const token = localStorage.getItem('token');
//                                 //  if (!token) {
//                                 //    window.location.href = '/login';
//                                 //    return;
//                                 //  }
//                                  window.location.href = `/customize/${product._id}`;
//                                }}
//                                className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
//                              >
//                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                                </svg>
//                                <span>Customize</span>
//                              </button>
//                            </div>
//                          </div>
//                        </div>
//                      </div>
//                    ))}
//                  {products.filter(product => product.category?._id === selectedCategory).length === 0 && (
//                    <p className="text-gray-600">No products found for this category.</p>
//                  )}
//                </div>
//                {products.filter(product => product.category?.__id ? product.category.__id === selectedCategory : product.category?._id === selectedCategory).length > visibleCount && (
//                  <div className="flex justify-center mt-8">
//                    {/* <button
//                      onClick={() => setVisibleCount(visibleCount + 6)}
//                      className="bg-gray-700 text-white px-8 py-3 rounded hover:bg-blue-800 transition-colors"
//                    >
//                      Load More
//                    </button> */}
//                    <button
//                     onClick={() => {
//                       setIsLoadingMore(true);
//                       setTimeout(() => {
//                         setVisibleCount(visibleCount + loadIncrement);
//                         setIsLoadingMore(false);
//                       }, 500); // simulate a 500ms loading delay
//                     }}
//                     className="bg-blue-900 text-white px-7 py-3 rounded hover:bg-blue-800 transition-colors"
//                   >
//                     {isLoadingMore ? (
//                       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
//                       </svg>
//                     ) : (
//                       "Load More"
//                     )}
//                   </button>

//                  </div>
//                )}
//              </>
//            ) : (
//              <p className="text-gray-600">Select a category to see related products.</p>
//            )}
           
//             </div>
//           </div>
//         ) : (
//           // Original slider layout for 9 or more categories
//           <div className="relative">
//             <button
//               onClick={() => scroll('left')}
//               className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronLeft size={24} />
//             </button>
            
//             <div 
//               ref={categorySliderRef}
//               className="flex overflow-x-auto hide-scrollbar gap-6 px-12"
//               style={{ paddingTop: '15px' }}
//             >
//               {filteredCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => window.location.href = `/products?category=${category._id}`}
//                   className="flex-none cursor-pointer transition-transform hover:scale-105"
//                 >
//                   <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 mb-3">
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="text-center font-medium text-gray-800">{category.name}</p>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={() => scroll('right')}
//               className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronRight size={24} />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Static Section */}
//       <div className="w-full mb-32 mt-16">
//         <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-10 flex flex-col md:flex-row items-center shadow-xl">
//           <div className="md:w-1/2 mb-6 md:mb-0 pl-10 lg:pl-20 xl:pl-40">
//             <h2 className="text-4xl font-bold mb-4">Discover Our Unique Packaging Solutions</h2>
//             <p className="text-lg">
//               Experience creativity and innovation in every design. Our custom packaging solutions are crafted to elevate your brand's presence and make a lasting impression.
//             </p>
//           </div>
//           <div className="md:w-1/2 flex justify-center pr-0">
//             <img
//               src="/images/logo-static.png"
//               alt="Packaging"
//               className="w-[500px] h-auto rounded-tl-[50px] shadow-lg -mr-10"
//             />
//           </div>
//         </div>
//       </div>


//       {/* Featured Products Section */}
//       {/* Separator */}
//       <div className="container mx-auto px-4 my-16">
//         <div className="flex items-center">
//           <div className="flex-grow border-t border-gray-300"></div>
//           <span className="mx-4 text-gray-500 uppercase tracking-widest text-sm">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Featured Products
//           </h2>
//           </span>
//           <div className="flex-grow border-t border-gray-300"></div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 mb-32">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
//           {filteredProducts.slice(0, 5).map((product) => (
//             <div 
//               key={product._id}
//               className=" rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//             >
//               <div className="relative pb-[100%]">
//                 <button
//                   onClick={() => {
//                     const token = localStorage.getItem('token');
//                     // if (!token) {
//                     //   window.location.href = '/login';
//                     //   return;
//                     // }                  
//                     window.location.href = `/customize/${product._id}`;
//                   }}
//                 >
//                   <LazyImage
//                     src={product.images?.[0]?.data}
//                     alt={product.name}
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />
//                 </button>
//               </div>
//               <div className="p-4">
//                 <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
//                   {product.name}
//                 </h3>
//                 <p className="text-gray-600 mb-4 text-sm line-clamp-2">
//                   {product.description}
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-m font-bold text-blue-600">
//                     ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
//                   </span>
//                   <div className="flex gap-3">
//                     {/* <button
//                       onClick={() => {
//                         const token = localStorage.getItem('token');
//                         if (!token) {
//                           window.location.href = '/login';
//                           return;
//                         }                  
//                         window.location.href = `/customize/${product._id}`;
//                       }}
//                       className="text-gray-600 hover:text-blue-600 transition-colors"
//                       title="Customize"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </button> */}
//                     <div>
//                       <button
//                         onClick={() => {
//                           const token = localStorage.getItem('token');
//                           // if (!token) {
//                           //   window.location.href = '/login';
//                           //   return;
//                           // }
//                           window.location.href = `/customize/${product._id}`;
//                         }}
//                         className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                         </svg>
//                         <span>Customize</span>
//                       </button>
//                     </div>

//                     {/* <button
//                       onClick={() => handleAddToCart(product)}
//                       className="text-gray-600 hover:text-green-600 transition-colors"
//                       title="Add to Cart"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                       </svg>
//                     </button> */}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="text-center mt-20">
//           <button
//             onClick={() => window.location.href = '/products'}
//             className="bg-[#033568] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//           >
//             View All Products
//           </button>
//         </div>
//       </div>
      
//       {/* Statistics Section */}
//       <div className="bg-[#033568] py-20 mb-32">
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-white text-center">
//             <div>
//               <div className="text-4xl font-bold mb-2">1000+</div>
//               <div className="text-lg">Happy Clients</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">50K+</div>
//               <div className="text-lg">Products Delivered</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">98%</div>
//               <div className="text-lg">Client Satisfaction</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">24/7</div>
//               <div className="text-lg">Customer Support</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Testimonials Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">
//           What Our Clients Say
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 RC
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Royal Cafe</div>
//                 <div className="text-gray-500">Restaurant Chain</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "The custom packaging from Bag & Box has significantly elevated our brand image. 
//               The quality is exceptional, and their customer service is outstanding."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 GS
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Green Solutions</div>
//                 <div className="text-gray-500">Eco-friendly Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Finding sustainable packaging solutions was crucial for our business. 
//               Bag & Box provided exactly what we needed with their eco-friendly options."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 FB
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Fashion Boutique</div>
//                 <div className="text-gray-500">Clothing Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Their custom shopping bags have become a signature part of our brand. 
//               The quality and attention to detail is consistently impressive."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Call to Action Section */}
//       <div className="bg-[#001548] py-20 mb-20">
//         <div className="container mx-auto px-4 text-center text-white">
//           <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Brand?</h2>
//           <p className="text-xl mb-8 max-w-2xl mx-auto">
//             Join hundreds of successful businesses who trust us with their packaging needs.
//             Get started with your custom solution today.
//           </p>
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => window.location.href = '/products'}
//               className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
//             >
//               Browse Products
//             </button>
//             <a
//               href={`tel:${phoneNumber}`}
//               className="bg-amber-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//             >
//               Contact Us
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* About Section */}
//       <div className="bg-gray-50 py-16" style={{ marginBottom: '80px'}}>
//         <div className="container mx-auto px-4">
//           <div className="max-w-full mx-auto">
//             <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center"
//             style={{marginBottom: 50+'px'}}>
//               Why Choose Bag & Box?
//             </h2>
//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>At Bag & Box, we prioritize excellence in every product we create. Our packaging is crafted using premium materials that ensure durability, functionality, and an attractive presentation. We adhere to strict quality control standards to guarantee consistency in every order. Whether you need sturdy boxes or elegant bags, our products are designed to protect your items while enhancing your brand’s image.</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Competitive Pricing</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>We believe that top-quality packaging shouldn't come with a hefty price tag. Our competitive pricing structure ensures that you get the best value without compromising on quality. By optimizing production and sourcing cost-effective materials, we provide affordable solutions for businesses of all sizes. Whether you're ordering in small batches or bulk, you can count on us for cost-effective options tailored to your budget.</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>We know that time is crucial for your business, which is why we focus on efficiency in production and logistics. Our streamlined processes allow us to fulfill orders quickly without sacrificing quality. With reliable shipping partners, we ensure that your packaging products arrive on time, helping you meet deadlines and keep your business running smoothly.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
        
//         @keyframes notification {
//           0% {
//             opacity: 0;
//             transform: translateX(100%) translateY(-50%);
//           }
//           7% {
//             opacity: 1;
//             transform: translateX(-10%) translateY(0);
//           }
//           10% {
//             transform: translateX(0);
//           }
//           90% {
//             opacity: 1;
//             transform: translateX(0);
//           }
//           100% {
//             opacity: 0;
//             transform: translateX(100%);
//           }
//         }
        
//         .animate-notification {
//           animation: notification 2s ease-in-out forwards;
//         }

//         @keyframes bounce {
//           0%, 100% {
//             transform: translateY(-25%);
//             animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
//           }
//           50% {
//             transform: translateY(0);
//             animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
//           }
//         }
        
//         .animate-bounce {
//           animation: bounce 1s infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Home;












// // working with new diesgn but many products for each category
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, Search, Phone, ShoppingCart } from 'lucide-react';
// import { useCart } from '../context/CartContext';
// import LazyImage from '../components/LazyImage';
// import Lottie from 'lottie-react'; 
// import cartAnimation from '../assets/cartAnimation.json'; 

// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categorySearchTerm, setCategorySearchTerm] = useState('');
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState(null); // For vertical layout
//   const { addToCart } = useCart();
//   const phoneNumber = "+16048348118";
//   const categorySliderRef = React.useRef(null);

  
// // New state to control how many products are visible for the selected category
// const [visibleCount, setVisibleCount] = useState(6);

// useEffect(() => {
//   // Reset visible count when a new category is selected
//   setVisibleCount(6);
// }, [selectedCategory]);



//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         // First fetch basic data without images (fast)
//         const [productsRes, categoriesRes] = await Promise.all([
//           fetch('/api/products/basic').then(res => res.json()),
//           fetch('/api/categories/basic').then(res => res.json())
//         ]);
        
//         setProducts(productsRes);
//         setCategories(categoriesRes);
//         setLoading(false); 

//         // Then fetch images in parallel
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

//         // Load all images in parallel
//         await Promise.allSettled([...productImagePromises, ...categoryImagePromises]);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   // Set a default selected category if none is set and categories are loaded
//   useEffect(() => {
//     if (!selectedCategory && categories.length > 0) {
//       setSelectedCategory(categories[0]._id);
//     }
//   }, [selectedCategory, categories]);

//   const scroll = (direction) => {
//     const container = categorySliderRef.current;
//     if (container) {
//       const scrollAmount = direction === 'left' ? -300 : 300;
//       container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
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
      
//       setShowCartNotification(true);
//       setTimeout(() => setShowCartNotification(false), 2000);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//     }
//   };

//   // Filter products for the Featured Products section (unrelated to vertical layout)
//   const filteredProducts = products
//     .filter(product => 
//       product.isFeatured &&
//       (
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     )
//     .slice(0, 6);

//   // Filter categories based on search input
//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
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
//       {/* Cart Notification */}
//       {showCartNotification && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out animate-notification">
//           <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
//             {/* Lottie animation for cart notification */}
//             <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
//             <p className="text-xl">Item added to cart successfully!</p>
//           </div>
//         </div>
//       )}

//       {/* Hero Section */}
//       <div 
//         className="relative bg-cover bg-center py-48 mb-20" 
//         style={{
//           backgroundImage: `url('/images/s1.jpg')`,
//           backgroundBlendMode: 'overlay',
//           backgroundColor: 'rgba(0,0,0,0.5)',
//         }}
//       >
//         <div className="container mx-auto px-4 relative z-10">
//           <div className="text-center text-white">
//             <h1 className="text-5xl font-serif font-bold mb-12">
//               Professional Custom Packaging Solutions
//             </h1>
//             <p className="text-xl mb-8 max-w-2xl mx-auto">
//               Elevate your brand with premium quality custom bags and boxes. 
//               Perfect for businesses of all sizes.
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={() => window.location.href = '/products'}
//                 className="bg-yellow-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-colors"
//               >
//                 Customize Products
//               </button>
//               <a
//                 href={`tel:${phoneNumber}`}
//                 className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
//               >
//                 Call to Order
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Categories Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Browse Categories
//           </h2>
//           <div className="relative w-64">
//             <input
//               type="text"
//               placeholder="Search categories..."
//               value={categorySearchTerm}
//               onChange={(e) => setCategorySearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
//             />
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//           </div>
//         </div>

//         {filteredCategories.length < 9 ? (
//           // Vertical layout when there are fewer than 9 categories
//           <div className="flex flex-col md:flex-row gap-6">
//             {/* Left Column: Category List with Bigger Images */}
//             <div className="w-full md:w-1/3">
//               {filteredCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => setSelectedCategory(category._id)}
//                   className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
//                     selectedCategory === category._id ? 'bg-gray-200' : ''
//                   }`}
//                 >
//                   <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 mr-4">
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="font-medium text-gray-800 text-lg">{category.name}</p>
//                 </div>
//               ))}
//             </div>
//             {/* Right Column: Related Products for the Selected Category */}
//             <div className="w-full md:w-2/3">
//               {selectedCategory ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//                   {products
//                     .filter(product => product.category?.__id ? product.category.__id === selectedCategory : product.category?._id === selectedCategory)
//                     .map((product) => (
//                       <div 
//                         key={product._id}
//                         className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//                       >
//                         <div className="relative pb-[100%]">
//                           <button
//                             onClick={() => {
//                               const token = localStorage.getItem('token');
//                               if (!token) {
//                                 window.location.href = '/login';
//                                 return;
//                               }                  
//                               window.location.href = `/customize/${product._id}`;
//                             }}
//                           >
//                             <LazyImage
//                               src={product.images?.[0]?.data}
//                               alt={product.name}
//                               className="absolute inset-0 w-full h-full object-cover"
//                             />
//                           </button>
//                         </div>
//                         <div className="p-4">
//                           <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
//                             {product.name}
//                           </h3>
//                           <p className="text-gray-600 mb-4 text-sm line-clamp-2">
//                             {product.description}
//                           </p>
//                           <div className="flex justify-between items-center">
//                             <span className="text-m font-bold text-blue-600">
//                               ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
//                             </span>
//                             <div className="flex gap-3">
//                             <button
//                               onClick={() => {
//                                 const token = localStorage.getItem('token');
//                                 if (!token) {
//                                   window.location.href = '/login';
//                                   return;
//                                 }
//                                 window.location.href = `/customize/${product._id}`;
//                               }}
//                               className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
//                             >
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                               </svg>
//                               <span>Customize</span>
//                             </button>
//                               {/* <button
//                                 onClick={() => {
//                                   const token = localStorage.getItem('token');
//                                   if (!token) {
//                                     window.location.href = '/login';
//                                     return;
//                                   }                  
//                                   window.location.href = `/customize/${product._id}`;
//                                 }}
//                                 className="text-gray-600 hover:text-blue-600 transition-colors"
//                                 title="Customize"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                                 </svg>
//                               </button> */}
//                               {/* <button
//                                 onClick={() => handleAddToCart(product)}
//                                 className="text-gray-600 hover:text-green-600 transition-colors"
//                                 title="Add to Cart"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                                 </svg>
//                               </button> */}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   {products.filter(product => product.category?._id === selectedCategory).length === 0 && (
//                     <p className="text-gray-600">No products found for this category.</p>
//                   )}
//                 </div>
//               ) : (
//                 <p className="text-gray-600">Select a category to see related products.</p>
//               )}
//             </div>
//           </div>
//         ) : (
//           // Original slider layout for 9 or more categories
//           <div className="relative">
//             <button
//               onClick={() => scroll('left')}
//               className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronLeft size={24} />
//             </button>
            
//             <div 
//               ref={categorySliderRef}
//               className="flex overflow-x-auto hide-scrollbar gap-6 px-12"
//               style={{ paddingTop: '15px' }}
//             >
//               {filteredCategories.map((category) => (
//                 <div
//                   key={category._id}
//                   onClick={() => window.location.href = `/products?category=${category._id}`}
//                   className="flex-none cursor-pointer transition-transform hover:scale-105"
//                 >
//                   <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 mb-3">
//                     <LazyImage
//                       src={category.image?.data}
//                       alt={category.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <p className="text-center font-medium text-gray-800">{category.name}</p>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={() => scroll('right')}
//               className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//             >
//               <ChevronRight size={24} />
//             </button>
//           </div>
//         )}
//       </div>



//       {/* Static Section */}
//       {/* <div className="container mx-auto px-4 mb-32">
//         <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-10 flex flex-col md:flex-row items-center">
//           <div className="md:w-1/2 mb-6 md:mb-0">
//             <h2 className="text-4xl font-bold mb-4">Discover Our Unique Packaging Solutions</h2>
//             <p className="text-lg">
//               Experience creativity and innovation in every design. Our custom packaging solutions are crafted to elevate your brand's presence and make a lasting impression.
//             </p>
//           </div>
//           <div className="md:w-1/2 flex justify-center">
//             <img src="/images/slideshow-3.jpg" alt="Packaging" className="w-80 h-auto rounded shadow-lg"/>
//           </div>
//         </div>
//       </div> */}

//       {/* Static Section */}
//       <div className="w-full mb-32">
//         <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-10 flex flex-col md:flex-row items-center shadow-xl">
//           <div className="md:w-1/2 mb-6 md:mb-0 pl-10 lg:pl-40">
//             <h2 className="text-4xl font-bold mb-4">Discover Our Unique Packaging Solutions</h2>
//             <p className="text-lg">
//               Experience creativity and innovation in every design. Our custom packaging solutions are crafted to elevate your brand's presence and make a lasting impression.
//             </p>
//           </div>
//           <div className="md:w-1/2 flex justify-center pr-0">
//             <img
//               src="/images/slideshow-3.jpg"
//               alt="Packaging"
//               className="w-[500px] h-auto rounded-tl-[50px] shadow-lg -mr-10"
//             />
//           </div>
//         </div>
//       </div>






//       {/* Featured Products Section */}
//       {/* Separator */}
//       <div className="container mx-auto px-4 my-16">
//         <div className="flex items-center">
//           <div className="flex-grow border-t border-gray-300"></div>
//           <span className="mx-4 text-gray-500 uppercase tracking-widest text-sm">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Featured Products
//           </h2>
//           </span>
//           <div className="flex-grow border-t border-gray-300"></div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 mb-32">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
//           {filteredProducts.slice(0, 5).map((product) => (
//             <div 
//               key={product._id}
//               className=" rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//             >
//               <div className="relative pb-[100%]">
//                 <button
//                   onClick={() => {
//                     const token = localStorage.getItem('token');
//                     if (!token) {
//                       window.location.href = '/login';
//                       return;
//                     }                  
//                     window.location.href = `/customize/${product._id}`;
//                   }}
//                 >
//                   <LazyImage
//                     src={product.images?.[0]?.data}
//                     alt={product.name}
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />
//                 </button>
//               </div>
//               <div className="p-4">
//                 <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
//                   {product.name}
//                 </h3>
//                 <p className="text-gray-600 mb-4 text-sm line-clamp-2">
//                   {product.description}
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-m font-bold text-blue-600">
//                     ${product.basePrice > 0 ? product.basePrice.toFixed(2) : "Bundle Pricing"}
//                   </span>
//                   <div className="flex gap-3">
//                     {/* <button
//                       onClick={() => {
//                         const token = localStorage.getItem('token');
//                         if (!token) {
//                           window.location.href = '/login';
//                           return;
//                         }                  
//                         window.location.href = `/customize/${product._id}`;
//                       }}
//                       className="text-gray-600 hover:text-blue-600 transition-colors"
//                       title="Customize"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </button> */}
//                     <div>
//                       <button
//                         onClick={() => {
//                           const token = localStorage.getItem('token');
//                           if (!token) {
//                             window.location.href = '/login';
//                             return;
//                           }
//                           window.location.href = `/customize/${product._id}`;
//                         }}
//                         className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                         </svg>
//                         <span>Customize</span>
//                       </button>
//                     </div>

//                     {/* <button
//                       onClick={() => handleAddToCart(product)}
//                       className="text-gray-600 hover:text-green-600 transition-colors"
//                       title="Add to Cart"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                       </svg>
//                     </button> */}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="text-center mt-20">
//           <button
//             onClick={() => window.location.href = '/products'}
//             className="bg-[#033568] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//           >
//             View All Products
//           </button>
//         </div>
//       </div>
      
//       {/* Statistics Section */}
//       <div className="bg-[#033568] py-20 mb-32">
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-white text-center">
//             <div>
//               <div className="text-4xl font-bold mb-2">1000+</div>
//               <div className="text-lg">Happy Clients</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">50K+</div>
//               <div className="text-lg">Products Delivered</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">98%</div>
//               <div className="text-lg">Client Satisfaction</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">24/7</div>
//               <div className="text-lg">Customer Support</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Testimonials Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">
//           What Our Clients Say
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 RC
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Royal Cafe</div>
//                 <div className="text-gray-500">Restaurant Chain</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "The custom packaging from Bag & Box has significantly elevated our brand image. 
//               The quality is exceptional, and their customer service is outstanding."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 GS
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Green Solutions</div>
//                 <div className="text-gray-500">Eco-friendly Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Finding sustainable packaging solutions was crucial for our business. 
//               Bag & Box provided exactly what we needed with their eco-friendly options."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 FB
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Fashion Boutique</div>
//                 <div className="text-gray-500">Clothing Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Their custom shopping bags have become a signature part of our brand. 
//               The quality and attention to detail is consistently impressive."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Call to Action Section */}
//       <div className="bg-[#001548] py-20 mb-20">
//         <div className="container mx-auto px-4 text-center text-white">
//           <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Brand?</h2>
//           <p className="text-xl mb-8 max-w-2xl mx-auto">
//             Join hundreds of successful businesses who trust us with their packaging needs.
//             Get started with your custom solution today.
//           </p>
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => window.location.href = '/products'}
//               className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
//             >
//               Browse Products
//             </button>
//             <a
//               href={`tel:${phoneNumber}`}
//               className="bg-amber-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//             >
//               Contact Us
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* About Section */}
//       <div className="bg-gray-50 py-16" style={{ marginBottom: '80px'}}>
//         <div className="container mx-auto px-4">
//           <div className="max-w-full mx-auto">
//             <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center"
//             style={{marginBottom: 50+'px'}}>
//               Why Choose Bag & Box?
//             </h2>
//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>At Bag & Box, we prioritize excellence in every product we create. Our packaging is crafted using premium materials that ensure durability, functionality, and an attractive presentation. We adhere to strict quality control standards to guarantee consistency in every order. Whether you need sturdy boxes or elegant bags, our products are designed to protect your items while enhancing your brand’s image.</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Competitive Pricing</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>We believe that top-quality packaging shouldn't come with a hefty price tag. Our competitive pricing structure ensures that you get the best value without compromising on quality. By optimizing production and sourcing cost-effective materials, we provide affordable solutions for businesses of all sizes. Whether you're ordering in small batches or bulk, you can count on us for cost-effective options tailored to your budget.</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
//                 <p className="text-gray-600" style={{textAlign: 'justify'}}>We know that time is crucial for your business, which is why we focus on efficiency in production and logistics. Our streamlined processes allow us to fulfill orders quickly without sacrificing quality. With reliable shipping partners, we ensure that your packaging products arrive on time, helping you meet deadlines and keep your business running smoothly.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
        
//         @keyframes notification {
//           0% {
//             opacity: 0;
//             transform: translateX(100%) translateY(-50%);
//           }
//           7% {
//             opacity: 1;
//             transform: translateX(-10%) translateY(0);
//           }
//           10% {
//             transform: translateX(0);
//           }
//           90% {
//             opacity: 1;
//             transform: translateX(0);
//           }
//           100% {
//             opacity: 0;
//             transform: translateX(100%);
//           }
//         }
        
//         .animate-notification {
//           animation: notification 2s ease-in-out forwards;
//         }

//         @keyframes bounce {
//           0%, 100% {
//             transform: translateY(-25%);
//             animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
//           }
//           50% {
//             transform: translateY(0);
//             animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
//           }
//         }
        
//         .animate-bounce {
//           animation: bounce 1s infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Home;

























// //working with old design 
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, Search, Phone, ShoppingCart } from 'lucide-react';
// import { useCart } from '../context/CartContext';
// import LazyImage from '../components/LazyImage';
// import Lottie from 'lottie-react'; 
// import cartAnimation from '../assets/cartAnimation.json'; 

// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categorySearchTerm, setCategorySearchTerm] = useState('');
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   const { addToCart } = useCart();
//   const phoneNumber = "+16048348118";
//   const categorySliderRef = React.useRef(null);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         // First fetch basic data without images (fast)
//         const [productsRes, categoriesRes] = await Promise.all([
//           fetch('/api/products/basic').then(res => res.json()),
//           fetch('/api/categories/basic').then(res => res.json())
//         ]);
        
//         setProducts(productsRes);
//         setCategories(categoriesRes);
//         setLoading(false); 

//         // Then fetch images in parallel
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

//         // Load all images in parallel
//         await Promise.allSettled([...productImagePromises, ...categoryImagePromises]);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   const scroll = (direction) => {
//     const container = categorySliderRef.current;
//     if (container) {
//       const scrollAmount = direction === 'left' ? -300 : 300;
//       container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
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
      
//       setShowCartNotification(true);
//       setTimeout(() => setShowCartNotification(false), 2000);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//     }
//   };

//   // Filter and limit products
//   const filteredProducts = products
//     .filter(product => 
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//     .slice(0, 6);

//   // Filter categories
//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
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
//       {/* Cart Notification */}
//       {showCartNotification && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out animate-notification">
//           <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
//             {/* Lottie animation for cart notification (bigger) */}
//             <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
//             <p className="text-xl">Item added to cart successfully!</p>
//           </div>
//         </div>
//       )}


//       {/* Hero Section */}
//       <div 
//         className="relative bg-cover bg-center py-48 mb-20" 
//         style={{
//           backgroundImage: `url('/images/s1.jpg')`,
//           backgroundBlendMode: 'overlay',
//           backgroundColor: 'rgba(0,0,0,0.5)',
//         }}
//       >
//         <div className="container mx-auto px-4 relative z-10">
//           <div className="text-center text-white">
//             <h1 className="text-5xl font-serif font-bold mb-12">
//               Professional Custom Packaging Solutions
//             </h1>
//             <p className="text-xl mb-8 max-w-2xl mx-auto">
//               Elevate your brand with premium quality custom bags and boxes. 
//               Perfect for businesses of all sizes.
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={() => window.location.href = '/products'}
//                 className="bg-yellow-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-colors"
//               >
//                 Explore Products
//               </button>
//               <a
//                 href={`tel:${phoneNumber}`}
//                 className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
//               >
//                 Call to Order
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Categories Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Browse Categories
//           </h2>
//           <div className="relative w-64">
//             <input
//               type="text"
//               placeholder="Search categories..."
//               value={categorySearchTerm}
//               onChange={(e) => setCategorySearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
//             />
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//           </div>
//         </div>

//         <div className="relative">
//           <button
//             onClick={() => scroll('left')}
//             className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//           >
//             <ChevronLeft size={24} />
//           </button>
          
//           <div 
//             ref={categorySliderRef}
//             className="flex overflow-x-auto hide-scrollbar gap-6 px-12"
//             style={{ paddingTop: '15px' }}
//           >
//             {filteredCategories.map((category) => (
//               <div
//                 key={category._id}
//                 onClick={() => window.location.href = `/products?category=${category._id}`}
//                 className="flex-none cursor-pointer transition-transform hover:scale-105"
//               >
//                 <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 mb-3">
//                   <LazyImage
//                     src={category.image?.data}
//                     alt={category.name}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <p className="text-center font-medium text-gray-800">{category.name}</p>
//               </div>
//             ))}
//           </div>

//           <button
//             onClick={() => scroll('right')}
//             className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
//           >
//             <ChevronRight size={24} />
//           </button>
//         </div>
//       </div>

//       {/* Featured Products Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-3xl font-serif font-bold text-gray-900">
//             Featured Products
//           </h2>
//           <div className="relative w-64">
//             <input
//               type="text"
//               placeholder="Search products..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500"
//             />
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
//           {filteredProducts.slice(0, 5).map((product) => (
//             <div 
//               key={product._id}
//               className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
//             >
//               <div className="relative pb-[100%]">
//                 <button
//                   onClick={() => {
//                     const token = localStorage.getItem('token');
//                     if (!token) {
//                       window.location.href = '/login';
//                       return;
//                     }                  
//                     window.location.href = `/customize/${product._id}`
//                   }}
//                 >
//                   <LazyImage
//                     src={product.images?.[0]?.data}
//                     alt={product.name}
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />
//                 </button>
//               </div>
//               <div className="p-4">
//                 <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
//                   {product.name}
//                 </h3>
//                 <p className="text-gray-600 mb-4 text-sm line-clamp-2">
//                   {product.description}
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-m font-bold text-blue-600">
//                     ${product.basePrice > 0 ? (
//                       product.basePrice.toFixed(2)
//                       ) : (
//                       "Bundle Pricing"
//                       )}
//                   </span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => {
//                         const token = localStorage.getItem('token');
//                         if (!token) {
//                           window.location.href = '/login';
//                           return;
//                         }                  
//                         window.location.href = `/customize/${product._id}`
//                       }}
//                       className="text-gray-600 hover:text-blue-600 transition-colors"
//                       title="Customize"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </button>
//                     <button
//                       onClick={() => handleAddToCart(product)}
//                       className="text-gray-600 hover:text-green-600 transition-colors"
//                       title="Add to Cart"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="text-center mt-8">
//           <button
//             onClick={() => window.location.href = '/products'}
//             className="bg-[#033568] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//           >
//             View All Products
//           </button>
//         </div>
//       </div>
      
//       {/* Statistics Section */}
//       <div className="bg-[#033568] py-20 mb-32">
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-white text-center">
//             <div>
//               <div className="text-4xl font-bold mb-2">1000+</div>
//               <div className="text-lg">Happy Clients</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">50K+</div>
//               <div className="text-lg">Products Delivered</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">98%</div>
//               <div className="text-lg">Client Satisfaction</div>
//             </div>
//             <div>
//               <div className="text-4xl font-bold mb-2">24/7</div>
//               <div className="text-lg">Customer Support</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Testimonials Section */}
//       <div className="container mx-auto px-4 mb-32">
//         <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">
//           What Our Clients Say
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 RC
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Royal Cafe</div>
//                 <div className="text-gray-500">Restaurant Chain</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "The custom packaging from Bag & Box has significantly elevated our brand image. 
//               The quality is exceptional, and their customer service is outstanding."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 GS
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Green Solutions</div>
//                 <div className="text-gray-500">Eco-friendly Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Finding sustainable packaging solutions was crucial for our business. 
//               Bag & Box provided exactly what we needed with their eco-friendly options."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>

//           <div className="bg-white p-8 rounded-lg shadow-lg">
//             <div className="flex items-center mb-4">
//               <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
//                 FB
//               </div>
//               <div className="ml-4">
//                 <div className="font-bold">Fashion Boutique</div>
//                 <div className="text-gray-500">Clothing Store</div>
//               </div>
//             </div>
//             <p className="text-gray-600 mb-4">
//               "Their custom shopping bags have become a signature part of our brand. 
//               The quality and attention to detail is consistently impressive."
//             </p>
//             <div className="flex text-yellow-400">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Call to Action Section */}
//       <div className="bg-[#001548] py-20 mb-32">
//         <div className="container mx-auto px-4 text-center text-white">
//           <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Brand?</h2>
//           <p className="text-xl mb-8 max-w-2xl mx-auto">
//             Join hundreds of successful businesses who trust us with their packaging needs.
//             Get started with your custom solution today.
//           </p>
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => window.location.href = '/products'}
//               className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
//             >
//               Browse Products
//             </button>
//             <a
//               href={`tel:${phoneNumber}`}
//               className="bg-amber-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-900 transition-colors"
//             >
//               Contact Us
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* About Section */}
//       <div className="bg-gray-50 py-16" style={{ marginBottom: 50 + 'px' }}>
//         <div className="container mx-auto px-4">
//           <div className="max-w-4xl mx-auto">
//             <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">
//               Why Choose Bag & Box?
//             </h2>
//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
//                 <p className="text-gray-600">Premium materials and expert craftsmanship in every product</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Competitive Pricing</h3>
//                 <p className="text-gray-600">Great value without compromising on quality</p>
//               </div>
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
//                 <p className="text-gray-600">Quick turnaround times and reliable shipping</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
        
//         @keyframes notification {
//           0% {
//             opacity: 0;
//             transform: translateX(100%) translateY(-50%);
//           }
//           7% {
//             opacity: 1;
//             transform: translateX(-10%) translateY(0);
//           }
//           10% {
//             transform: translateX(0);
//           }
//           90% {
//             opacity: 1;
//             transform: translateX(0);
//           }
//           100% {
//             opacity: 0;
//             transform: translateX(100%);
//           }
//         }
        
//         .animate-notification {
//           animation: notification 2s ease-in-out forwards;
//         }

//         @keyframes bounce {
//           0%, 100% {
//             transform: translateY(-25%);
//             animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
//           }
//           50% {
//             transform: translateY(0);
//             animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
//           }
//         }
        
//         .animate-bounce {
//           animation: bounce 1s infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Home;

