// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const phoneNumber = "1-604-977-9292";

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

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      {/* Hero Section with Background */}
      <div className="relative bg-cover bg-center py-20 mb-12" 
           style={{backgroundImage: `url('../../images/hero-background.jpg')`, backgroundBlendMode: 'overlay', backgroundColor: 'rgba(0,0,0,0.6)'}}>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-5xl font-serif font-bold mb-6 text-white">
              BAG & BOX
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
              Professional custom packaging for your business needs. Quality materials, elegant designs, reliable service.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

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
      <div className="max-w-7xl mx-auto px-4 mb-16 flex-grow">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
          Our Products
        </h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-600">
            No products found matching your search.
          </div>
        ) : (
          // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {filteredProducts.map((product) => (
              <div 
                key={product._id} 
                className="bg-white rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl"
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
                      onClick={() => addToCart({ 
                        product, 
                        quantity: 1,
                        customization: {
                          preview: product.templates[0]?.data || ''
                        } 
                      })}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* About Us Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 bg-white">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">
              About Bag & Box
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                At Bag&Box, we specialize in providing high-quality, customizable packaging solutions for businesses across North America. From shopping bags and pizza boxes to cup holders, we offer versatile products available in white and kraft brown.
              </p>
              <p>
                Our innovative printing system allows us to bring your branding ideas to life—whether it's a logo, slogan, or custom design—with vibrant full-color printing, even on low-order quantities.
              </p>
              <p>
                With a user-friendly platform at bagbox.ca, you can easily browse our products, customize your order, and upload your design in just a few clicks. Choose the quantity you need, and we'll handle the rest, delivering your order quickly and efficiently.
              </p>
            </div>
          </div>
          <div className="relative">
            <img 
              src="../../images/aboutUs.jpg" 
              alt="Bag & Box Production" 
              className="rounded-lg shadow-lg object-cover w-full h-96"
            />
            <div className="absolute inset-0 bg-blue-900 opacity-20 rounded-lg"></div>
          </div>
        </div>

        <div className="mt-12" style={{marginTop:100+"px"}}>
          <h3 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">
            Why Choose Us?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h4 className="text-xl font-semibold text-gray-900">Expertise</h4>
              </div>
              <p className="text-gray-600">
                Backed by our founders' expertise in design and printing since 1998, we bring decades of knowledge to every project.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-xl font-semibold text-gray-900">Low Minimum Order</h4>
              </div>
              <p className="text-gray-600">
                Unlike traditional printers, our system makes customization accessible for businesses of all sizes, no matter the order volume.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-xl font-semibold text-gray-900">Fast & Affordable</h4>
              </div>
              <p className="text-gray-600">
                We understand the importance of cost and time for businesses. That's why we offer competitive prices and a fast turnaround.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12" style={{marginTop:100+"px"}}>
          <h3 className="text-3xl font-serif font-bold text-gray-900 mb-6">
            Our Mission
          </h3>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
            At Bag&Box, our mission is to empower businesses by creating professional and cohesive packaging solutions that help them stand out and leave a lasting impression.
          </p>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 mt-4 italic">
            Let's transform your packaging into a powerful marketing tool—quick, affordable, and customized for you!
          </p>
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
    </div>
  );
};

export default Home;






// //working properly but simple
// // src/pages/Home.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { useCart } from '../context/CartContext';

// const Home = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { addToCart } = useCart();
//   const phoneNumber = "1-604-977-9292"; // Replace with actual number

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

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-2xl text-gray-600">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <>
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

//       {/* Hero Section */}
//       <div className="bg-gray-50 py-16 mb-12">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center">
//             <h1 className="text-4xl font-serif font-bold text-gray-900 mb-6">
//               BAG & BOX
//             </h1>
//             <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//               Professional custom packaging for your business needs. Quality materials, elegant designs, reliable service.
//             </p>
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
//       <div className="max-w-7xl mx-auto px-4 mb-16">
//         <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">
//           Our Products
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {products.map((product) => (
//             <div 
//               key={product._id} 
//               className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md"
//             >
//               {product.templates[0] && (
//                 <img
//                   src={product.templates[0].data}
//                   alt={product.name}
//                   className="w-full h-64 object-cover rounded-t-lg"
//                 />
//               )}
//               <div className="p-6">
//                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                   {product.name}
//                 </h3>
//                 <p className="text-gray-600 mb-4 min-h-[3rem]">
//                   {product.description}
//                 </p>
//                 <p className="text-xl font-bold text-gray-900 mb-4">
//                   ${product.basePrice.toFixed(2)}
//                 </p>
//                 <div className="flex gap-2">
//                   <Link
//                     to={`/customize/${product._id}`}
//                     className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center font-semibold hover:bg-blue-700 transition-colors"
//                   >
//                     Customize
//                   </Link>
//                   <button
//                     onClick={() => addToCart({ 
//                       product, 
//                       quantity: 1,
//                       customization: {
//                         preview: product.templates[0]?.data || '' // Fallback to empty string if no template
//                       } })}
//                     className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
//                   >
//                     Add to Cart
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
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
//     </>
//   );
// };

// export default Home;

