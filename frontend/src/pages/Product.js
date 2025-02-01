// src/pages/Product.js
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import LazyImage from '../components/LazyImage';

const Product = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredBagCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes('bag')
  );

  const filteredBoxCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes('box')
  );

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category._id === selectedCategory)
    : products;

  const searchFilteredProducts = filteredProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductsByCategory = (categoryId) => {
    return products.filter(product => 
      product.category?._id === categoryId
    ).filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar - remains exactly the same */}
        <div className="mb-12">
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-full border-2 border-blue-500 focus:outline-none focus:border-blue-600"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* Bags Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Shopping Bags</h2>
          
          {/* Categories Slider */}
          <div className="relative mb-8">
            <button
              onClick={() => scroll('left', bagSliderRef)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div 
              ref={bagSliderRef}
              className="flex overflow-x-auto hide-scrollbar gap-8 px-12"
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
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 mb-3 ${
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
              onClick={() => scroll('right', bagSliderRef)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Products Grid for Selected Bag Category */}
          {selectedCategory && filteredBagCategories.some(cat => cat._id === selectedCategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
            style={{marginLeft:30+'px',marginRight:30+'px'}}>
              {getProductsByCategory(selectedCategory).map((product) => (
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
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            window.location.href = '/login';
                            return;
                          }                  
                          navigateToProduct(product._id)
                        }}
                        className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
                      >
                        Customize
                      </button>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Packaging Boxes</h2>
          
          {/* Categories Slider */}
          <div className="relative mb-8">
            <button
              onClick={() => scroll('left', boxSliderRef)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div 
              ref={boxSliderRef}
              className="flex overflow-x-auto hide-scrollbar gap-8 px-12"
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
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 mb-3 ${
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
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Products Grid for Selected Box Category */}
          {selectedCategory && filteredBoxCategories.some(cat => cat._id === selectedCategory) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8" 
            style={{marginLeft:20+'px',marginRight:20+'px'}}>
              {getProductsByCategory(selectedCategory).map((product) => (
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
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            window.location.href = '/login';
                            return;
                          }                  
                          navigateToProduct(product._id)
                        }}
                        className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
                      >
                        Customize
                      </button>
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
      `}</style>
    </div>
  );
};

export default Product;
