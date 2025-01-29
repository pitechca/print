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
  const [quantity, setQuantity] = useState(1);
  const [orderDescription, setOrderDescription] = useState("");
  const canvasRef = useRef(null);
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryTemplates, setCategoryTemplates] = useState([]);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: '#ffffff'
    });
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

// In ProductEditor.js, update the template filtering logic:

useEffect(() => {
  const fetchData = async () => {
    try {
      // First fetch the product
      const productRes = await axios.get(`/api/products/${productId}`);
      setSelectedProduct(productRes.data);
      
      // Then fetch templates
      const templatesRes = await axios.get('/api/templates');
      console.log('All templates:', templatesRes.data);
      
      // Filter templates by category, handling both nested and direct category IDs
      const filteredTemplates = templatesRes.data.filter(template => {
        const templateCategoryId = template.category._id || template.category;
        const productCategoryId = productRes.data.category._id || productRes.data.category;
        console.log('Comparing template category:', templateCategoryId, 'with product category:', productCategoryId);
        return templateCategoryId === productCategoryId;
      });

      console.log('Filtered templates:', filteredTemplates);
      setCategoryTemplates(filteredTemplates);

      // Set background image if canvas exists
      if (productRes.data.templates && productRes.data.templates.length > 0 && canvas) {
        fabric.Image.fromURL(productRes.data.templates[0].data, (img) => {
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
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  if (productId && canvas) {
    fetchData();
  }
}, [productId, canvas]);
  
  // Update handleTemplateChange to better handle template loading
  const handleTemplateChange = (template) => {
    if (!canvas || !template) return;
    
    console.log('Applying template:', template); // Debug log
    setSelectedTemplate(template);
    
    // Clear all objects except background
    const bgImage = canvas.backgroundImage;
    canvas.clear();
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
    
    // Parse template elements if needed
    let elementsData = template.elements;
    if (typeof template.elements === 'string') {
      try {
        elementsData = JSON.parse(template.elements);
      } catch (error) {
        console.error('Error parsing template elements:', error);
        return;
      }
    }
    
    console.log('Template elements:', elementsData); // Debug log
    
    // Load template elements
    if (elementsData && elementsData.objects) {
      elementsData.objects.forEach(obj => {
        fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
          const enlivenedObject = enlivenedObjects[0];
          console.log('Loading object:', enlivenedObject); // Debug log
          
          if (enlivenedObject.data?.isPlaceholder) {
            enlivenedObject.set({
              hasControls: true,
              lockUniScaling: false,
              lockRotation: false
            });
          }
          
          canvas.add(enlivenedObject);
          canvas.renderAll();
        });
      });
    }
  };

  
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
        const scale = Math.min(200 / img.width, 200 / img.height);
        img.scale(scale);

        // If there's a selected placeholder, replace it with the image
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.data?.isPlaceholder) {
          img.set({
            left: activeObject.left,
            top: activeObject.top,
            width: activeObject.width,
            height: activeObject.height
          });
          canvas.remove(activeObject);
        } else {
          img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center'
          });
        }

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
      preview,
      description: orderDescription
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
      quantity: parseInt(quantity),
      customization
    });

    navigate('/cart');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <canvas ref={canvasRef} className="border rounded-lg" />
          
          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Design Template
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categoryTemplates.map((template) => (
                <div
                  key={template._id}
                  className={`p-2 border-2 rounded cursor-pointer ${
                    selectedTemplate?._id === template._id ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => handleTemplateChange(template)}
                >
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <p className="text-sm text-center mt-1">{template.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customization Tools */}
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
                className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Text
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
                {selectedTemplate?.elements?.objects.some(obj => obj.data?.isPlaceholder) && 
                  " (Select a placeholder first to replace it)"}
              </label>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Description</label>
              <textarea
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any special instructions or notes for your order..."
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Product Details */}
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



// // working properly but not very good with template
// // src/components/ProductEditor.js
// import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
// import axios from "axios";
// import { useParams, useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';

// const ProductEditor = () => {
//   const [canvas, setCanvas] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [customText, setCustomText] = useState("");
//   const [quantity, setQuantity] = useState(1);
//   const [orderDescription, setOrderDescription] = useState("");
//   const canvasRef = useRef(null);
//   const { productId } = useParams();
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);


//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         const { data } = await axios.get('/api/templates');
//         setTemplates(data);
//       } catch (error) {
//         console.error('Error fetching templates:', error);
//       }
//     };  
//     fetchTemplates();
//   }, []);

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: '#ffffff'
//     });
//     setCanvas(fabricCanvas);
//     return () => fabricCanvas.dispose();
//   }, []);

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const { data } = await axios.get(`/api/products/${productId}`);
//         setSelectedProduct(data);
//         if (data.templates && data.templates.length > 0 && canvas) {
//           setSelectedTemplate(data.templates[0]); // Add this line
//           fabric.Image.fromURL(data.templates[0].data, (img) => {
//             const scale = Math.min(
//               canvas.width / img.width,
//               canvas.height / img.height
//             ) * 0.9;
  
//             img.set({
//               scaleX: scale,
//               scaleY: scale,
//               left: (canvas.width - img.width * scale) / 2,
//               top: (canvas.height - img.height * scale) / 2,
//               selectable: false,
//               evented: false
//             });
  
//             canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
//           });
//         }
//       } catch (error) {
//         console.error('Error fetching product:', error);
//       }
//     };
  
//     if (productId && canvas) {
//       fetchProduct();
//     }
//   }, [productId, canvas]);




//   const handleTextAdd = () => {
//     if (!customText || !canvas) return;
//     const text = new fabric.Text(customText, {
//       left: canvas.width / 2,
//       top: canvas.height / 2,
//       fontSize: 30,
//       originX: 'center',
//       originY: 'center'
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//     setCustomText("");
//   };

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file || !canvas) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {
//         const scale = Math.min(
//           200 / img.width,
//           200 / img.height
//         );
//         img.scale(scale);
//         img.set({
//           left: canvas.width / 2,
//           top: canvas.height / 2,
//           originX: 'center',
//           originY: 'center'
//         });
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//       });
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleTemplateChange = (template) => {
//     if (!canvas || !template) return;
    
//     setSelectedTemplate(template);
    
//     // Clear all objects except background
//     const backgroundImage = canvas.backgroundImage;
//     canvas.clear();
    
//     // Restore the background image
//     if (backgroundImage) {
//       canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
//     } else if (selectedProduct?.templates?.[0]?.data) {
//       // If background was lost, reload it
//       fabric.Image.fromURL(selectedProduct.templates[0].data, (img) => {
//         const scale = Math.min(
//           canvas.width / img.width,
//           canvas.height / img.height
//         ) * 0.9;
  
//         img.set({
//           scaleX: scale,
//           scaleY: scale,
//           left: (canvas.width - img.width * scale) / 2,
//           top: (canvas.height - img.height * scale) / 2,
//           selectable: false,
//           evented: false
//         });
  
//         canvas.setBackgroundImage(img, () => {
//           // Load template elements after ensuring background is set
//           if (template.elements) {
//             // Parse the elements if it's a string
//             const elements = typeof template.elements === 'string' 
//               ? JSON.parse(template.elements) 
//               : template.elements;
  
//             // Load only the objects, not the background
//             if (elements.objects) {
//               elements.objects.forEach(obj => {
//                 fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//                   const enlivenedObject = enlivenedObjects[0];
//                   canvas.add(enlivenedObject);
//                   canvas.renderAll();
//                 });
//               });
//             }
//           }
//         });
//       });
//     }
//   };

//   const handleAddToCart = async () => {
//     if (!selectedProduct || !canvas) return;

//     const preview = canvas.toDataURL({
//       format: 'png',
//       quality: 1
//     });

//     const customization = {
//       customText: '',
//       customImage: null,
//       preview,
//       description: orderDescription
//     };

//     canvas.getObjects().forEach(obj => {
//       if (obj.type === 'text') {
//         customization.customText = obj.text;
//       } else if (obj.type === 'image' && obj !== canvas.backgroundImage) {
//         customization.customImage = obj.toDataURL();
//       }
//     });

//     await addToCart({
//       product: selectedProduct,
//       quantity: parseInt(quantity),
//       customization
//     });

//     navigate('/cart');
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <canvas ref={canvasRef} className="border rounded-lg" />
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Select Design Template
//             </label>
//             <div className="flex gap-2 overflow-x-auto pb-2">
//               {templates.map((template, index) => (
//                 <div
//                   key={template._id}
//                   className={`p-2 border-2 rounded cursor-pointer ${
//                     selectedTemplate?._id === template._id ? 'border-blue-500' : 'border-gray-200'
//                   }`}
//                   onClick={() => handleTemplateChange(template)}
//                 >
//                   <img
//                     src={template.preview}
//                     alt={template.name}
//                     className="w-24 h-24 object-cover rounded"
//                   />
//                   <p className="text-sm text-center mt-1">{template.name}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="mt-4 space-y-4">
//             <div>
//               <input
//                 type="text"
//                 value={customText}
//                 onChange={(e) => setCustomText(e.target.value)}
//                 className="w-full px-4 py-2 border rounded"
//                 placeholder="Enter custom text"
//               />
//               <button
//                 onClick={handleTextAdd}
//                 className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded"
//               >
//                 Add Text
//               </button>
//             </div>
//             <div>
//               <input
//                 type="file"
//                 onChange={handleImageUpload}
//                 accept="image/*"
//                 className="w-full"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Quantity</label>
//               <input
//                 type="number"
//                 min="1"
//                 value={quantity}
//                 onChange={(e) => setQuantity(e.target.value)}
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Order Description</label>
//               <textarea
//                 value={orderDescription}
//                 onChange={(e) => setOrderDescription(e.target.value)}
//                 rows="3"
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//                 placeholder="Add any special instructions or notes for your order..."
//               />
//             </div>
//             <button
//               onClick={handleAddToCart}
//               className="w-full bg-green-500 text-white px-4 py-2 rounded"
//             >
//               Add to Cart
//             </button>
//           </div>
//         </div>
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h2 className="text-2xl font-bold mb-4">
//             {selectedProduct?.name || 'Loading...'}
//           </h2>
//           <p className="text-gray-600 mb-4">
//             {selectedProduct?.description}
//           </p>
//           <p className="text-xl font-bold mb-4">
//             ${selectedProduct?.basePrice || 0}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductEditor;




