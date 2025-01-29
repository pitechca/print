// src/pages/AboutUs.js
import React, { useState, useEffect, useCallback } from 'react';

// Slideshow Header Component
const SlideshowHeader = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/images/s1.jpg',
    '/images/s2.jpg',
    '/images/s3.jpg'
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

// About Us Page Component
const AboutUs = () => {
  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaTags = {
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
    };

    // Comprehensive SEO metadata
    document.title = 'Bag&Box: Custom Packaging Solutions | Professional Branding';
    
    const descMeta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    descMeta.setAttribute('content', 'Leading custom packaging solutions for businesses across North America. Low minimum orders, full-color printing, and professional branding. Transform your packaging into a powerful marketing tool.');
    document.head.appendChild(descMeta);

    const keywordsMeta = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    keywordsMeta.setAttribute('name', 'keywords');
    keywordsMeta.setAttribute('content', 'custom packaging, business packaging, branded packaging, low minimum order, printing services, marketing solutions, North America, brand identity');
    document.head.appendChild(keywordsMeta);

    // Structured Data (JSON-LD)
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Bag&Box Packaging Solutions',
      'description': 'Custom packaging and printing solutions for businesses',
      'foundingDate': '1998',
      'serviceType': ['Custom Packaging', 'Printing Services'],
      'brand': {
        '@type': 'Brand',
        'name': 'Bag&Box'
      },
      'address': {
        '@type': 'PostalAddress',
        'addressRegion': 'North America'
      }
    });
    document.head.appendChild(scriptTag);

    // Open Graph and other meta tags
    const ogTags = [
      { property: 'og:title', content: 'Bag&Box: Professional Custom Packaging Solutions' },
      { property: 'og:description', content: 'Transform your brand with our high-quality, customizable packaging solutions. Low minimum orders, fast turnaround, professional design.' },
      { property: 'og:type', content: 'business.business' },
      { property: 'og:url', content: 'https://bagbox.ca/about-us' },
      { property: 'og:image', content: '/images/slideshow-1.jpg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Bag&Box: Custom Packaging Experts' },
      { name: 'twitter:description', content: 'Professional packaging solutions that elevate your brand identity.' }
    ];

    const existingOgTags = [];
    ogTags.forEach(tag => {
      const selector = tag.property ? `meta[property="${tag.property}"]` : `meta[name="${tag.name}"]`;
      const existingTag = document.querySelector(selector);
      if (existingTag) {
        existingOgTags.push({ tag: existingTag, originalContent: existingTag.getAttribute('content') });
        existingTag.setAttribute('content', tag.content);
      } else {
        const newTag = document.createElement('meta');
        if (tag.property) newTag.setAttribute('property', tag.property);
        if (tag.name) newTag.setAttribute('name', tag.name);
        newTag.setAttribute('content', tag.content);
        document.head.appendChild(newTag);
        existingOgTags.push({ tag: newTag, originalContent: null });
      }
    });

    return () => {
      document.title = originalTitle;
      if (originalMetaTags.description) {
        descMeta.setAttribute('content', originalMetaTags.description);
      } else {
        descMeta.remove();
      }

      if (originalMetaTags.keywords) {
        keywordsMeta.setAttribute('content', originalMetaTags.keywords);
      } else {
        keywordsMeta.remove();
      }

      scriptTag.remove();

      existingOgTags.forEach(({ tag, originalContent }) => {
        if (originalContent) {
          tag.setAttribute('content', originalContent);
        } else {
          tag.remove();
        }
      });
    };
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Slideshow Header */}
      <SlideshowHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-6xl space-y-12">
        {/* Introduction Section */}
        <section className="bg-white shadow-lg rounded-xl p-10 space-y-6">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-6">
            About Bag&Box
          </h1>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                At Bag&Box, we are more than just a packaging company—we are your strategic branding partner. Specializing in high-quality, customizable packaging solutions, we serve businesses across North America with innovative printing technologies.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our state-of-the-art platform allows you to transform ordinary packaging into extraordinary brand statements, with vibrant full-color printing available even for small order quantities.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                From shopping bags and pizza boxes to cup holders, we offer versatile products in white and kraft brown. Our user-friendly online platform at bagbox.ca makes customization simple and intuitive.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Whether you're a startup or an established enterprise, we provide professional packaging solutions that help you stand out in a competitive market.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-white shadow-lg rounded-xl p-16 space-y-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
            Why Partner with Bag&Box?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Proven Expertise",
                description: "With decades of design and printing experience since 1998, we bring unparalleled knowledge to every project."
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Flexible Solutions",
                description: "Low minimum orders make professional packaging accessible to businesses of all sizes."
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-purple-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Speed & Value",
                description: "Competitive pricing and quick turnaround times ensure your packaging needs are met efficiently."
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                {feature.icon}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-[#1A4B84] text-white rounded-xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl max-w-4xl mx-auto leading-relaxed mb-8">
            To empower businesses by transforming packaging into a powerful marketing tool. We believe every package tells a story—let us help you tell yours with professional, eye-catching design and unmatched quality.
          </p>
          <a 
            href="/contact" 
            className="bg-white text-[#1A4B84] hover:bg-blue-50 font-bold py-3 px-8 rounded-full transition-colors"
          >
            Start Your Project
          </a>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;




// //working but simple
// import React, { useState, useEffect } from 'react';

// // Slideshow Header Component
// const SlideshowHeader = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const slides = [
//     '/images/slideshow-1.jpg',
//     '/images/slideshow-2.jpg',
//     '/images/slideshow-3.jpg'
//   ];

//   useEffect(() => {
//     const slideInterval = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % slides.length);
//     }, 5000); // Change slide every 5 seconds

//     return () => clearInterval(slideInterval);
//   }, []);

//   return (
//     <div className="relative h-[500px] w-full overflow-hidden">
//       {slides.map((slide, index) => (
//         <div
//           key={slide}
//           className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
//             index === currentSlide ? 'opacity-100' : 'opacity-0'
//           }`}
//         >
//           <img 
//             src={slide} 
//             alt={`Bag & Box Slideshow ${index + 1}`} 
//             className="w-full h-full object-cover"
//             loading="lazy"
//           />
//         </div>
//       ))}
//     </div>
//   );
// };

// // About Us Page Component
// const AboutUs= () => {
//   // Update document metadata on mount and unmount
//   useEffect(() => {
//     // Store original metadata to restore later
//     const originalTitle = document.title;
//     const originalMetaTags = {
//       description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
//       keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
//     };

//     // Set new metadata
//     document.title = 'About Bag&Box - Custom Packaging Solutions';
    
//     const descMeta = document.querySelector('meta[name="description"]') || document.createElement('meta');
//     descMeta.setAttribute('name', 'description');
//     descMeta.setAttribute('content', 'Bag&Box provides high-quality, customizable packaging solutions for businesses across North America. Low minimum orders, fast turnaround, and professional design since 1998.');
//     document.head.appendChild(descMeta);

//     const keywordsMeta = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
//     keywordsMeta.setAttribute('name', 'keywords');
//     keywordsMeta.setAttribute('content', 'custom packaging, business packaging, printing services, low minimum order, branded packaging, North America');
//     document.head.appendChild(keywordsMeta);

//     // Add Open Graph meta tags
//     const ogTags = [
//       { property: 'og:title', content: 'About Bag&Box - Custom Packaging Solutions' },
//       { property: 'og:description', content: 'Professional packaging solutions tailored to your business needs. Custom printing, low minimum orders, fast turnaround.' },
//       { property: 'og:type', content: 'company' },
//       { property: 'og:url', content: 'https://bagbox.ca/about-us' },
//       { property: 'og:image', content: '/images/slideshow-1.jpg' }
//     ];

//     const existingOgTags = [];
//     ogTags.forEach(tag => {
//       const existingTag = document.querySelector(`meta[property="${tag.property}"]`);
//       if (existingTag) {
//         existingOgTags.push({ tag: existingTag, originalContent: existingTag.getAttribute('content') });
//         existingTag.setAttribute('content', tag.content);
//       } else {
//         const newTag = document.createElement('meta');
//         newTag.setAttribute('property', tag.property);
//         newTag.setAttribute('content', tag.content);
//         document.head.appendChild(newTag);
//         existingOgTags.push({ tag: newTag, originalContent: null });
//       }
//     });

//     // Cleanup function to restore original metadata
//     return () => {
//       document.title = originalTitle;
      
//       if (originalMetaTags.description) {
//         descMeta.setAttribute('content', originalMetaTags.description);
//       } else {
//         descMeta.remove();
//       }

//       if (originalMetaTags.keywords) {
//         keywordsMeta.setAttribute('content', originalMetaTags.keywords);
//       } else {
//         keywordsMeta.remove();
//       }

//       // Restore or remove Open Graph tags
//       existingOgTags.forEach(({ tag, originalContent }) => {
//         if (originalContent) {
//           tag.setAttribute('content', originalContent);
//         } else {
//           tag.remove();
//         }
//       });
//     };
//   }, []);

//   return (
//     <div className="bg-white">
//       {/* Slideshow Header */}
//       <SlideshowHeader />

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-12 max-w-4xl">
//         <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
//           About Bag&Box
//         </h1>

//         <section className="mb-8">
//           <p className="text-lg text-gray-700 leading-relaxed mb-4">
//             At Bag&Box, we specialize in providing high-quality, customizable packaging solutions for businesses across North America. From shopping bags and pizza boxes to cup holders, we offer versatile products available in white and kraft brown. Our innovative printing system allows us to bring your branding ideas to life—whether it's a logo, slogan, or custom design—with vibrant full-color printing, even on low-order quantities.
//           </p>
//           <p className="text-lg text-gray-700 leading-relaxed mb-4">
//             With a user-friendly platform at bagbox.ca, you can easily browse our products, customize your order, and upload your design in just a few clicks. Choose the quantity you need, and we'll handle the rest, delivering your order quickly and efficiently.
//           </p>
//         </section>

//         <section className="mb-8">
//           <h2 className="text-3xl font-semibold text-gray-800 mb-4">
//             Why Choose Us?
//           </h2>
//           <ul className="space-y-4 pl-5">
//             <li className="flex items-start">
//               <svg 
//                 className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24" 
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth={2} 
//                   d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
//                 />
//               </svg>
//               <span className="text-lg text-gray-700">
//                 <strong>Expertise and Experience:</strong> Backed by our founders' expertise in design and printing since 1998, we bring decades of knowledge to every project.
//               </span>
//             </li>
//             <li className="flex items-start">
//               <svg 
//                 className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24" 
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth={2} 
//                   d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
//                 />
//               </svg>
//               <span className="text-lg text-gray-700">
//                 <strong>Low Minimum Order:</strong> Unlike traditional printers, our system makes customization accessible for businesses of all sizes, no matter the order volume.
//               </span>
//             </li>
//             <li className="flex items-start">
//               <svg 
//                 className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24" 
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth={2} 
//                   d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
//                 />
//               </svg>
//               <span className="text-lg text-gray-700">
//                 <strong>Affordable and Fast:</strong> We understand the importance of cost and time for businesses. That's why we offer competitive prices and a fast turnaround.
//               </span>
//             </li>
//           </ul>
//         </section>

//         <section className="text-center">
//           <h2 className="text-3xl font-semibold text-gray-800 mb-4">
//             Our Mission
//           </h2>
//           <p className="text-lg text-gray-700 leading-relaxed mb-6">
//             At Bag&Box, our mission is to empower businesses by creating professional and cohesive packaging solutions that help them stand out and leave a lasting impression.
//           </p>
//           <p className="text-xl font-bold text-blue-600">
//             Let's transform your packaging into a powerful marketing tool—quick, affordable, and customized for you!
//           </p>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default AboutUs;