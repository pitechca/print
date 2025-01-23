import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { fabric } from "fabric";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from '../context/CartContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const ProductEditor = () => {
  const [canvas, setCanvas] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customText, setCustomText] = useState("");
  const canvasRef = useRef(null);
  const { addToCart } = useCart();
  const { productId } = useParams();
  const navigate = useNavigate();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Load product and template
  useEffect(() => {
    const fetchProduct = async () => {
      if (!canvas) return;

      try {
        const { data } = await axios.get(`/api/products/${productId}`);
        setSelectedProduct(data);

        if (data.templates && data.templates.length > 0) {
          // Create image object from template
          fabric.Image.fromURL(data.templates[0].data, (img) => {
            // Calculate scale to fit canvas while maintaining aspect ratio
            const scale = Math.min(
              (canvas.width * 0.8) / img.width,
              (canvas.height * 0.8) / img.height
            );

            img.scaleX = scale;
            img.scaleY = scale;

            // Center the image
            img.left = (canvas.width - img.width * scale) / 2;
            img.top = (canvas.height - img.height * scale) / 2;

            // Make template non-selectable and non-movable
            img.selectable = false;
            img.evented = false;

            // Set as background
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          }, {
            crossOrigin: 'anonymous'
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    if (productId && canvas) {
      fetchProduct();
    }
  }, [productId, canvas]);

  const handleTextAdd = () => {
    if (!customText || !canvas) return;

    // Create text object
    const text = new fabric.Text(customText, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontSize: 30,
      fontFamily: 'Arial',
      fill: '#000000',
      originX: 'center',
      originY: 'center'
    });

    // Make text interactive
    text.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });

    // Add to canvas
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    // Clear input
    setCustomText("");
  };

  const handleImageUpload = (e) => {
    if (!canvas) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        // Scale image to reasonable size
        const maxSize = Math.min(canvas.width * 0.5, canvas.height * 0.5);
        const scale = Math.min(maxSize / img.width, maxSize / img.height);

        img.scaleX = scale;
        img.scaleY = scale;

        // Center the uploaded image
        img.left = canvas.width / 2;
        img.top = canvas.height / 2;
        img.originX = 'center';
        img.originY = 'center';

        // Make image interactive
        img.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct || !canvas) return;
    
    try {
      // Get canvas data URL
      const preview = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      // Upload preview image
      const response = await axios.post("/api/upload", { 
        image: preview 
      });

      // Add to cart
      addToCart({
        product: selectedProduct,
        preview: response.data.url,
        customization: {
          customText,
          previewId: response.data._id
        },
        quantity: 1
      });

      navigate('/cart');
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (!selectedProduct) {
    return <div className="text-center mt-8">Loading product...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            Customize {selectedProduct.name}
          </h2>
          <div className="border rounded-lg p-2 mb-4">
            <canvas ref={canvasRef} className="w-full" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Add Text</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Enter your text"
                />
                <button
                  onClick={handleTextAdd}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Text
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Image</label>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Product Details</h3>
          <p className="text-lg mb-2">Price: ${selectedProduct.basePrice}</p>
          <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
          <button
            onClick={handleAddToCart}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;




// const ProductEditor = () => {
//   const [canvas, setCanvas] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [customText, setCustomText] = useState("");
//   const [cart, setCart] = useState([]);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//     });
//     setCanvas(fabricCanvas);

//     return () => {
//       fabricCanvas.dispose();
//     };
//   }, []);

//   const handleProductSelect = async (product) => {
//     setSelectedProduct(product);
//     if (product.templates && product.templates.length > 0) {
//       fabric.Image.fromURL(product.templates[0].data, (img) => {
//         canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
//       });
//     }
//   };

//   const handleTextAdd = () => {
//     if (!customText) return;
//     const text = new fabric.Text(customText, {
//       left: 100,
//       top: 100,
//       fontSize: 20,
//     });
//     canvas.add(text);
//     canvas.renderAll();
//   };

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {
//         img.scaleToWidth(200);
//         canvas.add(img);
//         canvas.renderAll();
//       });
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleAddToCart = async () => {
//     if (!selectedProduct) return;
    
//     // Get canvas data URL for preview
//     const preview = canvas.toDataURL();
    
//     // Get custom image if any
//     let customImage = null;
//     const objects = canvas.getObjects();
//     for (const obj of objects) {
//       if (obj instanceof fabric.Image && obj !== canvas.backgroundImage) {
//         customImage = obj.toDataURL();
//         break;
//       }
//     }

//     try {
//       const response = await axios.post("/api/upload", { 
//         image: preview 
//       });

//       setCart([
//         ...cart,
//         {
//           product: selectedProduct,
//           preview: response.data.url,
//           customization: {
//             customImage,
//             customText,
//             previewId: response.data._id
//           }
//         }
//       ]);
//     } catch (error) {
//       console.error("Error saving preview:", error);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <canvas ref={canvasRef} />
//           <div className="mt-4">
//           {product.templates[0] && (
//             <img
//               src={product.templates[0].data}
//               alt={product.name}
//               className="w-full h-48 object-cover mb-4"
//             />
//           )}
//             <input
//               type="text"
//               value={customText}
//               onChange={(e) => setCustomText(e.target.value)}
//               className="border p-2"
//               placeholder="Enter custom text"
//             />
//             <button
//               onClick={handleTextAdd}
//               className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
//             >
//               Add Text
//             </button>
//             <input
//               type="file"
//               onChange={handleImageUpload}
//               accept="image/*"
//               className="mt-2"
//             />
//           </div>
//         </div>
//         <div>
//           <h2 className="text-xl font-bold mb-4">Cart ({cart.length} items)</h2>
//           {cart.map((item, index) => (
//             <div key={index} className="border p-4 mb-2">
//               <img src={item.preview} alt="Preview" className="w-32" />
//               <p>{item.product.name}</p>
//               <p>${item.product.basePrice}</p>
//             </div>
//           ))}
//           {cart.length > 0 && (
//             <Elements stripe={stripePromise}>
//               <CheckoutForm cart={cart} />
//             </Elements>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const CheckoutForm = ({ cart }) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [processing, setProcessing] = useState(false);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);

//     try {
//       // Calculate total amount
//       const amount = cart.reduce((sum, item) => sum + item.product.basePrice, 0) * 100;

//       // Create payment intent
//       const { data: { clientSecret } } = await axios.post("/api/create-payment-intent", {
//         amount
//       });

//       // Confirm payment
//       const { error } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement)
//         }
//       });

//       if (error) {
//         console.error(error);
//       } else {
//         // Create order
//         await axios.post("/api/orders", {
//           products: cart.map(item => ({
//             product: item.product._id,
//             quantity: 1
//           })),
//           totalAmount: amount / 100,
//           paymentMethod: "stripe",
//           customizations: cart.reduce((acc, item) => ({
//             ...acc,
//             [item.product._id]: {
//               customImage: item.customization.customImage,
//               customText: item.customization.customText,
//               preview: item.preview
//             }
//           }), {})
//         });
//       }
//     } catch (error) {
//       console.error("Error processing payment:", error);
//     }

//     setProcessing(false);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="mt-4">
//       <div className="mb-4">
//         <CardElement
//           options={{
//             style: {
//               base: {
//                 fontSize: '16px',
//                 color: '#424770',
//                 '::placeholder': {
//                   color: '#aab7c4',
//                 },
//               },
//               invalid: {
//                 color: '#9e2146',
//               },
//             },
//           }}
//         />
//       </div>
//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className={`bg-blue-500 text-white px-4 py-2 rounded w-full ${
//           (!stripe || processing) ? 'opacity-50 cursor-not-allowed' : ''
//         }`}
//       >
//         {processing ? 'Processing...' : 'Pay Now'}
//       </button>
//     </form>
//   );
// };

// export default ProductEditor;







