// src/components/ProductEditor.js
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductEditor = () => {
  const [canvas, setCanvas] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customText, setCustomText] = useState("");
  const canvasRef = useRef(null);
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: '#ffffff'
    });
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${productId}`);
        setSelectedProduct(data);
        if (data.templates && data.templates.length > 0 && canvas) {
          fabric.Image.fromURL(data.templates[0].data, (img) => {
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            ) * 0.9;

            img.set({
              scaleX: scale,
              scaleY: scale,
              left: (canvas.width - img.width * scale) / 2,
              top: (canvas.height - img.height * scale) / 2,
              selectable: false,
              evented: false
            });

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
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
    const text = new fabric.Text(customText, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontSize: 30,
      originX: 'center',
      originY: 'center'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setCustomText("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        const scale = Math.min(
          200 / img.width,
          200 / img.height
        );
        img.scale(scale);
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center'
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

    const preview = canvas.toDataURL({
      format: 'png',
      quality: 1
    });

    const customization = {
      customText: '',
      customImage: null,
      preview
    };

    canvas.getObjects().forEach(obj => {
      if (obj.type === 'text') {
        customization.customText = obj.text;
      } else if (obj.type === 'image' && obj !== canvas.backgroundImage) {
        customization.customImage = obj.toDataURL();
      }
    });

    await addToCart({
      product: selectedProduct,
      quantity: 1,
      customization
    });

    navigate('/cart');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <canvas ref={canvasRef} className="border rounded-lg" />
          <div className="mt-4 space-y-4">
            <div>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter custom text"
              />
              <button
                onClick={handleTextAdd}
                className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add Text
              </button>
            </div>
            <div>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full"
              />
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full bg-green-500 text-white px-4 py-2 rounded"
            >
              Add to Cart
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            {selectedProduct?.name || 'Loading...'}
          </h2>
          <p className="text-gray-600 mb-4">
            {selectedProduct?.description}
          </p>
          <p className="text-xl font-bold mb-4">
            ${selectedProduct?.basePrice || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;





// //working proper;y
// import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
// import axios from "axios";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
// import { useParams, useNavigate } from 'react-router-dom';



// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);




// const ProductEditor = () => {
//   const [canvas, setCanvas] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [customText, setCustomText] = useState("");
//   const [cart, setCart] = useState([]);
//   const canvasRef = useRef(null);
//   const { productId } = useParams();

  

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: '#ccc'

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
//               <img
//               src={item.product.templates[0].data}
//               alt={item.product.name}
//               className="w-full h-48 object-cover mb-4 rounded"
//             />
            
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




