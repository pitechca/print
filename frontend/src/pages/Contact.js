import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: false,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SEO and Metadata Management
  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaTags = {
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
    };

    // Set SEO Metadata
    document.title = 'Contact Bag&Box - Custom Packaging Solutions | Get in Touch';
    
    const descMeta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    descMeta.setAttribute('content', 'Contact Bag&Box for custom packaging solutions. Reach out for inquiries, quotes, or to discuss your branding needs. Fast, professional, and dedicated to your business success.');
    document.head.appendChild(descMeta);

    const keywordsMeta = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    keywordsMeta.setAttribute('name', 'keywords');
    keywordsMeta.setAttribute('content', 'contact packaging company, custom packaging quote, business branding solutions, packaging consultation, print service inquiry');
    document.head.appendChild(keywordsMeta);

    // Structured Data (JSON-LD)
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Bag&Box Packaging Solutions',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+16048348118',
        'contactType': 'Customer Service',
        'email': 'Info@bagbox.ca'
      },
      'address': {
        '@type': 'PostalAddress',
        'addressRegion': 'North America'
      }
    });
    document.head.appendChild(scriptTag);

    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: 'Contact Bag&Box - Custom Packaging Solutions' },
      { property: 'og:description', content: 'Get in touch with Bag&Box for professional packaging and branding solutions.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://bagbox.ca/contact' }
    ];

    const existingOgTags = [];
    ogTags.forEach(tag => {
      const selector = `meta[property="${tag.property}"]`;
      const existingTag = document.querySelector(selector);
      if (existingTag) {
        existingOgTags.push({ tag: existingTag, originalContent: existingTag.getAttribute('content') });
        existingTag.setAttribute('content', tag.content);
      } else {
        const newTag = document.createElement('meta');
        newTag.setAttribute('property', tag.property);
        newTag.setAttribute('content', tag.content);
        document.head.appendChild(newTag);
        existingOgTags.push({ tag: newTag, originalContent: null });
      }
    });

    // Cleanup function
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

  // Form Handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { name, email, message } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!name.trim()) {
      setSubmitStatus({ 
        success: false, 
        error: true, 
        message: 'Please enter your name.' 
      });
      return false;
    }

    if (!emailRegex.test(email)) {
      setSubmitStatus({ 
        success: false, 
        error: true, 
        message: 'Please enter a valid email address.' 
      });
      return false;
    }

    if (!message.trim()) {
      setSubmitStatus({ 
        success: false, 
        error: true, 
        message: 'Please enter a message.' 
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous status
    setSubmitStatus({ success: false, error: false, message: '' });
    
    // Validate form
    if (!validateForm()) return;

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Replace with your actual backend endpoint
      const response = await axios.post('/api/contact', formData);
      
      setSubmitStatus({
        success: true,
        error: false,
        message: 'Thank you for your message! We\'ll get back to you soon.'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        error: true,
        message: 'Sorry, there was an error sending your message. Please try again.' + error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen" >

        {/* Google Maps Placeholder */}
        <div className="mt-12 bg-gray-200 rounded-xl overflow-hidden shadow-lg" style={{padding:0, margin:0}}>
          <div className="w-full h-[400px] flex items-center justify-center text-gray-600">
            <h1 className="text-2xl">Location Map Coming Soon</h1>
          </div>
        </div>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Contact Information Section */}
          <div className="bg-[#1A4B84] text-white p-12 flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-6">Contact Bag&Box</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xl">+1 (604) 834-8118</span>
              </div>
              <div className="flex items-center space-x-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xl">Info@bagbox.ca</span>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-4">Business Hours</h3>
                <p className="text-lg">Monday - Friday: 9 AM - 5 PM</p>
                <p className="text-lg">Saturday - Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (Optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company Name (Optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
              
              {/* Submit Status Message */}
              {submitStatus.message && (
                <div className={`p-4 rounded-lg ${
                  submitStatus.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg text-white font-bold transition-colors ${
                  isSubmitting 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-[#1A4B84] hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Contact;