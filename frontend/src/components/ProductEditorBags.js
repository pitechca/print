// src/components/ProductEditor.js
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductViewTransformer from './ProductViewTransformer';


const ProductEditorBags = () => {
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [canvas, setCanvas] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderDescription, setOrderDescription] = useState("");
  const canvasRef = useRef(null);
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryTemplates, setCategoryTemplates] = useState([]);
  const [selectedProductImage, setSelectedProductImage] = useState(0);
  const [currentUnitPrice, setCurrentUnitPrice] = useState(0);
  const [fullImagePath,setFullImagePath] = useState(null);

  // Template field states
  const [requiredFields, setRequiredFields] = useState([]);
  const [fieldInputs, setFieldInputs] = useState({});
  
  // Customization states
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [selectedFontSize, setSelectedFontSize] = useState('20');
  const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
  const [customText, setCustomText] = useState('');
  const [customizations, setCustomizations] = useState({});

  const updateCanvasVersion = () => {
    setCanvasVersion(prev => prev + 1);
  };
  
  const fontFamilies = [
    'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
    'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
  ];
  
  // Reorder images: show the 2nd, 3rd, … images first, then the 1st image at the end
  const reorderedImages =
    selectedProduct?.images && selectedProduct.images.length > 1
      ? [...selectedProduct.images.slice(1), selectedProduct.images[0]]
      : selectedProduct?.images || [];

  const calculateUnitPrice = (qty) => {
    if (!selectedProduct?.pricingTiers?.length) {
      return selectedProduct?.basePrice || 0;
    }
  
    const applicableTier = selectedProduct.pricingTiers
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find(tier => qty >= tier.minQuantity && 
        (!tier.maxQuantity || qty <= tier.maxQuantity));
  
    return applicableTier ? applicableTier.price : selectedProduct.basePrice;
  };

  const handleQuantityChange = (newQty) => {
    // Enforce minimum order
    const minOrder = selectedProduct?.minimumOrder || 1;
    if (newQty < minOrder) {
      alert(`Minimum order quantity is ${minOrder}`);
      newQty = minOrder;
    }
  
    // Check if product is in stock
    if (!selectedProduct?.inStock) {
      alert('This product is currently out of stock');
      return;
    }
  
    setQuantity(newQty);
    setCurrentUnitPrice(calculateUnitPrice(newQty));
  };

useEffect(() => {
    // Get the container's width and choose the canvas width accordingly (max 500px)
    const containerWidth = canvasRef.current.parentElement.offsetWidth;
    const canvasWidth = containerWidth < 500 ? containerWidth : 500;
    
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth - 50,
      height: canvasWidth, // keep it square, adjust if needed
      backgroundColor: '#ffffff'
    });
    
    // Enable selection
    fabricCanvas.selection = true;
  
    // Add event listeners (no changes here)
    fabricCanvas.on('mouse:down', function(opt) {
      const evt = opt.e;
      if (evt.altKey === true) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    
    fabricCanvas.on('object:added', function(e) {
      const obj = e.target;
      obj.set({
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      updateCanvasVersion();
    });
    
    fabricCanvas.on('selection:created', function(e) {
      console.log('Selection created:', e.target);
      handleObjectSelected(e);
    });
    
    fabricCanvas.on('selection:updated', function(e) {
      console.log('Selection updated:', e.target);
      handleObjectSelected(e);
    });
    
    fabricCanvas.on('selection:cleared', function(e) {
      console.log('Selection cleared');
      handleSelectionCleared();
    });
    
    fabricCanvas.on('object:modified', function(e) {
      handleObjectModified(e);
      updateCanvasVersion();
    });
    
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

  // useEffect(() => {
  //   const fabricCanvas = new fabric.Canvas(canvasRef.current, {
  //     width: 500,
  //     height: 500,
  //     backgroundColor: '#ffffff'
  //   });
    
  //   // Enable selection
  //   fabricCanvas.selection = true;
  
  //   // Add event listeners
  //   fabricCanvas.on('mouse:down', function(opt) {
  //     const evt = opt.e;
  //     if (evt.altKey === true) {
  //       this.isDragging = true;
  //       this.selection = false;
  //       this.lastPosX = evt.clientX;
  //       this.lastPosY = evt.clientY;
  //     }
  //   });
  
  //   // Make sure objects are selectable when added
  //   fabricCanvas.on('object:added', function(e) {
  //     const obj = e.target;
  //     obj.set({
  //       selectable: true,
  //       hasControls: true,
  //       hasBorders: true
  //     });
  //     updateCanvasVersion();
  //   });
  
  //   // Selection event handlers
  //   fabricCanvas.on('selection:created', function(e) {
  //     console.log('Selection created:', e.target);
  //     handleObjectSelected(e);
  //   });
  
  //   fabricCanvas.on('selection:updated', function(e) {
  //     console.log('Selection updated:', e.target);
  //     handleObjectSelected(e);
  //   });
  
  //   fabricCanvas.on('selection:cleared', function(e) {
  //     console.log('Selection cleared');
  //     handleSelectionCleared();
  //   });
  
  //   // Modification handlers
  //   fabricCanvas.on('object:modified', function(e) {
  //     handleObjectModified(e);
  //     updateCanvasVersion();
  //   });
  
  //   setCanvas(fabricCanvas);
  //   return () => fabricCanvas.dispose();
  // }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await axios.get(`/api/products/${productId}`);
        setSelectedProduct(productRes.data);
        
        if (productRes.data.images && productRes.data.images.length > 0 && canvas) {
          const defaultImageData = productRes.data.images[1]
            ? productRes.data.images[1].data
            : productRes.data.images[0].data;
          loadProductImage(defaultImageData);
          // //show the index0
           //loadProductImage(productRes.data.images[0].data);
        }
        
        const templatesRes = await axios.get('/api/templates');
        const filteredTemplates = templatesRes.data.filter(template => {
          const templateCategoryId = template.category._id || template.category;
          const productCategoryId = productRes.data.category._id || productRes.data.category;
          return templateCategoryId === productCategoryId;
        });

        setCategoryTemplates(filteredTemplates);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (productId && canvas) {
      fetchData();
    }
  }, [productId, canvas]);

  const loadProductImage = (imageData) => {
    if (!canvas) return;

    fabric.Image.fromURL(imageData, (img) => {
      canvas.clear();
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
  };

  const handleTemplateChange = (template) => {
  if (!canvas || !template) return;
  
  setSelectedTemplate(template);
  setRequiredFields(template.requiredFields || []);
  setFieldInputs({});
  setCustomizations({});
  
  const bgImage = canvas.backgroundImage;
  canvas.clear();
  canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
  
  let elementsData = template.elements;
  if (typeof template.elements === 'string') {
    try {
      elementsData = JSON.parse(template.elements);
    } catch (error) {
      console.error('Error parsing template elements:', error);
      return;
    }
  }
  
  if (elementsData && elementsData.objects) {
    let loadedObjects = 0;
    const totalObjects = elementsData.objects.length;
    
    elementsData.objects.forEach(obj => {
      fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
        const enlivenedObject = enlivenedObjects[0];
        
        if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
          enlivenedObject.set({
            hasControls: true,
            lockUniScaling: false,
            lockRotation: false,
            selectable: true
          });
        }
        
        canvas.add(enlivenedObject);
        loadedObjects++;
        
        if (loadedObjects === totalObjects) {
          canvas.renderAll();
          updateCanvasVersion();
        }
      });
    });
  }
};

const handleObjectSelected = (event) => {
  let obj;
  
  // Handle both direct object passing and event passing
  if (event.target) {
    obj = event.target;
  } else if (event.selected && event.selected[0]) {
    obj = event.selected[0];
  } else {
    return;
  }

  console.log('Object selected:', {
    type: obj.type,
    text: obj.text,
    fontFamily: obj.fontFamily,
    fontSize: obj.fontSize,
    fill: obj.fill
  });

  setSelectedObject(obj);
  setSelectedColor(obj.fill || '#000000');
  setFillColor(obj.fill === 'transparent' ? 'transparent' : obj.fill);
  
  if (obj.type === 'i-text' || obj.type === 'text') {
    setSelectedFontSize(obj.fontSize?.toString() || '20');
    setSelectedFontFamily(obj.fontFamily || 'Arial');
    setCustomText(obj.text || '');
  }

  // Force a re-render
  updateCanvasVersion();
};

  const handleObjectModified = (e) => {
    const obj = e.target;
    if (!obj || !obj.data?.id) return;

    setCustomizations(prev => ({
      ...prev,
      [obj.data.id]: {
        type: obj.data.type || 'text',
        imageUrl: obj.data?.originalFilePath || null, // Include the image URL
        content: obj.type === 'i-text' || obj.type === 'text' ? obj.text : null,
        image: obj.type === 'image' ? obj.toDataURL() : null,
        properties: {
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fill: obj.fill,
          position: { x: obj.left, y: obj.top },
          scale: { x: obj.scaleX, y: obj.scaleY }
        }
      }
    }));

    // Update field inputs if it's a required field
    if (obj.data?.required) {
      setFieldInputs(prev => ({
        ...prev,
        [obj.data.id]: obj.type === 'i-text' || obj.type === 'text' 
          ? obj.text 
          : obj.toDataURL()
      }));
    }
  };

  const handleSelectionCleared = () => {
    setSelectedObject(null);
    setSelectedColor('#000000');
    setFillColor('transparent');
    setSelectedFontSize('20');
    setSelectedFontFamily('Arial');
    setCustomText('');
  };


  const handleFieldInput = (fieldId, value, type) => {
    const fields = canvas.getObjects().filter(obj => obj.data?.id === fieldId);
    if (!fields.length) return;
  
    const field = fields[0];
  
    if (type === 'text' && (field.type === 'i-text' || field.type === 'text')) {
      field.set('text', value);
      setFieldInputs(prev => ({ ...prev, [fieldId]: value }));
      handleObjectModified({ target: field });
    } else if ((type === 'image' || type === 'logo') && value instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          // Preserve original field's data and positioning
          img.set({
            left: field.left,
            top: field.top,
            scaleX: field.width / img.width,
            scaleY: field.height / img.height,
            data: field.data  // Preserve original field's metadata
          });
  
          // Replace the field with the new image
          canvas.remove(field);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
  
          setFieldInputs(prev => ({ ...prev, [fieldId]: e.target.result }));
          handleObjectModified({ target: img });
        });
      };
      reader.readAsDataURL(value);
    }
  
    canvas.renderAll();
  };

  const handleCustomText = () => {
    if (!canvas || !customText) return;
  
    const text = new fabric.IText(customText, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontSize: parseInt(selectedFontSize),
      fontFamily: selectedFontFamily,
      fill: selectedColor,
      originX: 'center',
      originY: 'center',
      selectable: true,
      hasControls: true,
      hasBorders: true,
      data: { type: 'custom-text', id: `custom_${Date.now()}` }
    });
  
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setCustomText('');
    handleObjectSelected({ target: text });
    updateCanvasVersion();
  };

  // const handleCustomImage = (e) => {
  //   const file = e.target.files[0];
  //   if (!file || !canvas) return;
  

  //    // Create FormData for full–size image upload
  //    const fullImageData = new FormData();
  //    fullImageData.append("image", file);
   
  //    axios.post('/api/upload-image', fullImageData, {
  //      headers: { 
  //        "Content-Type": "multipart/form-data",
  //        "Authorization": `Bearer ${localStorage.getItem("token")}`
  //      }
  //    })
  //    .then(res => {
  //      let fullImagePath = res.data.filePath; // e.g., "/upload/161234567890_custom-image.png"
  //      console.log(fullImagePath);

  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     fabric.Image.fromURL(event.target.result, (img) => {

  //         // Store the file path in the object’s data so we can later use it in the cart
  //         img.data = {
  //           ...img.data,
  //           type: 'custom-image',
  //           id: `custom_${Date.now()}`,
  //           originalFilePath: fullImagePath,
  //         };

  //       img.scaleToWidth(200);
  //       img.set({
  //         left: canvas.width / 2,
  //         top: canvas.height / 2,
  //         originX: 'center',
  //         originY: 'center',
  //         cornerSize: 12,
  //         cornerColor: '#ffffff',
  //         cornerStrokeColor: '#333333',
  //         transparentCorners: false,
  //         cornerStyle: 'circle',
  //        // data: { type: 'custom-image', id: `custom_${Date.now()}` }
  //        data: { 
  //         type: 'custom-image', 
  //         id: `custom_${Date.now()}`,
  //         originalFilePath: fullImagePath // Store the path in the fabric object's data
  //       }
  //       });
  
  //       canvas.add(img);
  //       canvas.setActiveObject(img);
  //       canvas.renderAll();
  //       handleObjectModified({ target: img });
  //       updateCanvasVersion();
  //         // Also generate and upload the thumbnail (if needed)
  //         canvas.lowerCanvasEl.toBlob((blob) => {
  //           const thumbData = new FormData();
  //           thumbData.append("thumbnail", blob, `thumb_${file.name}`);
  //           axios.post('/api/upload-thumbnail', thumbData, {
  //             headers: { 
  //               "Content-Type": "multipart/form-data",
  //               "Authorization": `Bearer ${localStorage.getItem("token")}`
  //             }
  //           })
  //           .then(res2 => {
  //             const thumbPath = res2.data.filePath;
  //             // Save the thumbnail file path as well
  //             img.data.thumbnailPath = thumbPath;
  //           })
  //           .catch(err => {
  //             console.error("Thumbnail upload failed:", err);
  //           });
  //         }, "image/png");
  //       });
  //     };
  //     reader.readAsDataURL(file);
  //   })
  //   .catch(err => {
  //     console.error("Full image upload failed:", err);
  //   });
  // };
// Replace the handleCustomImage function in ProductEditorBags.js
const handleCustomImage = async (e) => {
  const file = e.target.files[0];
  if (!file || !canvas) return;

  try {
    // Create form data for upload
    const formData = new FormData();
    formData.append("image", file);

    // Upload image without requiring authentication
    const response = await axios.post('/api/upload-image', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    });

    const { filePath } = response.data;

    // Create preview and add to canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        // Store the file path in the object's data
        img.data = {
          type: 'custom-image',
          id: `custom_${Date.now()}`,
          originalFilePath: filePath,
        };

        // Scale and position the image
        img.scaleToWidth(200);
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center',
          cornerSize: 12,
          cornerColor: '#ffffff',
          cornerStrokeColor: '#333333',
          transparentCorners: false,
          cornerStyle: 'circle'
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        handleObjectModified({ target: img });
        updateCanvasVersion();

        // Generate thumbnail if needed
        canvas.lowerCanvasEl.toBlob((blob) => {
          const thumbData = new FormData();
          thumbData.append("thumbnail", blob, `thumb_${file.name}`);
          
          axios.post('/api/upload-thumbnail', thumbData, {
            headers: { 
              'Content-Type': 'multipart/form-data'
            }
          })
          .then(res2 => {
            const thumbPath = res2.data.filePath;
            img.data.thumbnailPath = thumbPath;
          })
          .catch(err => {
            console.error("Thumbnail upload failed:", err);
            // Continue even if thumbnail fails
          });
        }, "image/png");
      });
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Image upload failed:", error);
    alert('Failed to upload image. Please try again.');
  }
};

  const updateSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    const updates = {
      fill: selectedColor === 'transparent' ? 'transparent' : selectedColor
    };

    if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
      updates.fontSize = parseInt(selectedFontSize);
      updates.fontFamily = selectedFontFamily;
    }

    selectedObject.set(updates);
    canvas.renderAll();
    handleObjectModified({ target: selectedObject });
  };

  const handleDelete = () => {
    if (!canvas || !selectedObject) return;

    // Prevent deletion of required template fields
    if (selectedObject.data?.required) {
      alert("Cannot delete required template elements");
      return;
    }

    if (selectedObject.data?.id) {
      setCustomizations(prev => {
        const newCustomizations = { ...prev };
        delete newCustomizations[selectedObject.data.id];
        return newCustomizations;
      });
    }

    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    handleSelectionCleared();
  };


  const handleAddToCart = async () => {
    if (!selectedProduct || !canvas) return;
  

      if (!selectedProduct.inStock) {
        alert('This product is currently out of stock');
        return;
      }

      if (quantity < (selectedProduct.minimumOrder || 1)) {
        alert(`Minimum order quantity is ${selectedProduct.minimumOrder}`);
        return;
      }

      try {
      // Get all custom elements
      const customElements = canvas.getObjects().filter(obj => 
        obj !== canvas.backgroundImage
      );
  
      console.log('All Custom Elements:', customElements);

      // Process custom fields
      const customFields = customElements.map(obj => {
        
        console.log('Processing Object:', obj);
        console.log('Object Data:', obj.data);

        // Special handling for logo/image placeholders
        if (obj.data?.type === 'logo' || obj.data?.type === 'image') {
          
          const dataUrl = obj.toDataURL ? obj.toDataURL('image/png') : null;
          console.log('Logo/Image DataURL:', dataUrl);

          return {
            fieldId: obj.data?.id || `custom_${Date.now()}`,
            type: 'image',
            imageUrl: obj.data?.originalFilePath || fullImagePath || null, // Store the image URL
            content: obj.toDataURL('image/png'),
            properties: {
              fontSize: null,
              fontFamily: null,
              fill: null,
              position: {
                x: obj.left || 0,
                y: obj.top || 0
              },
              scale: {
                x: obj.scaleX || 1,
                y: obj.scaleY || 1
              }
            }
          };
        }
        
        // Existing handling for text objects
        if (obj.type === 'text' || obj.type === 'i-text') {
          return {
            fieldId: obj.data?.id || `custom_${Date.now()}`,
            type: 'text',
            content: obj.text,
            properties: {
              fontSize: obj.fontSize || null,
              fontFamily: obj.fontFamily || null,
              fill: obj.fill || null,
              position: {
                x: obj.left || 0,
                y: obj.top || 0
              },
              scale: {
                x: obj.scaleX || 1,
                y: obj.scaleY || 1
              }
            }
          };
        }
  
        // Fallback for other types of objects
        return {
          fieldId: obj.data?.id || `custom_${Date.now()}`,
          type: obj.type,
          imageUrl: obj.data?.originalFilePath || fullImagePath || null,
          content: obj.toDataURL ? obj.toDataURL('image/png') : null,
          properties: {
            fontSize: null,
            fontFamily: null,
            fill: null,
            position: {
              x: obj.left || 0,
              y: obj.top || 0
            },
            scale: {
              x: obj.scaleX || 1,
              y: obj.scaleY || 1
            }
          }
        };
      });
  
      // Create customization data
      const customization = {
        template: selectedTemplate?._id || null,
        preview: canvas.toDataURL('image/png'),
        description: orderDescription || '',
        customFields: customFields,
        requiredFields: Object.entries(fieldInputs).map(([fieldId, value]) => ({
          fieldId,
          type: requiredFields.find(f => f.id === fieldId)?.type || 'text',
          value: typeof value === 'string' ? value : value.toDataURL('image/png')
        }))
      };
  
      console.log('Customization payload:', customization);
  
      // Add to cart
      await addToCart({
        product: selectedProduct,
        quantity: parseInt(quantity),
        customization
      });
  
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };
 
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Front View Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Design View</h3>
          <canvas ref={canvasRef} className="border rounded-lg w-full max-w-[500px]" />

          {/* <canvas ref={canvasRef} className="border rounded-lg" /> */}

          {/* Product Images */}
          {selectedProduct?.images && selectedProduct.images.length > 0 && (
            <div className="mt-4 grid grid-cols-6 gap-2">
              {reorderedImages.map((image, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded ${
                    selectedProductImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedProductImage(index);
                    loadProductImage(image.data);
                  }}
                >
                  <img
                    src={image.data}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-16 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
          {/* old version showing img from index0 */}
          {/* {selectedProduct?.images && selectedProduct.images.length > 0 && (
            <div className="mt-4 grid grid-cols-6 gap-2">
              {selectedProduct.images.map((image, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded ${
                    selectedProductImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedProductImage(index);
                    loadProductImage(image.data);
                  }}
                >
                  <img
                    src={image.data}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-16 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )} */}

          {/* Customization Controls */}
               {/* Customization Controls */}
               {selectedObject && (
            <div className="mt-4 p-4 border rounded">
              <h4 className="font-semibold mb-2">Customize Element</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor === 'transparent' ? '#ffffff' : selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        updateSelectedObject();
                      }}
                      className="w-full"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedColor === 'transparent'}
                        onChange={(e) => {
                          setSelectedColor(e.target.checked ? 'transparent' : '#000000');
                          updateSelectedObject();
                        }}
                        className="mr-2"
                      />
                      Transparent
                    </label>
                  </div>
                </div>

                {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                  <>
                    <div>
                      <label className="block text-sm mb-1">Font Size</label>
                      <select
                        value={selectedFontSize}
                        onChange={(e) => {
                          setSelectedFontSize(e.target.value);
                          updateSelectedObject();
                        }}
                        className="w-full p-2 border rounded"
                      >
                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1">Font Family</label>
                      <select
                        value={selectedFontFamily}
                        onChange={(e) => {
                          setSelectedFontFamily(e.target.value);
                          updateSelectedObject();
                        }}
                        className="w-full p-2 border rounded"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {!selectedObject.data?.required && (
                <button
                  onClick={handleDelete}
                  className="mt-2 w-full bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete Element
                </button>
              )}
            </div>
          )}             

          {/* Product Info */}
          <div className="mt-4">
            <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
            <p className="text-gray-600 mt-2">{selectedProduct?.description}</p>
            <p className="text-lg font-semibold mt-2">
              Price:
              {selectedProduct?.pricingTiers.length !=null && selectedProduct?.pricingTiers.length > 0 ? (
                  `From $${selectedProduct.pricingTiers[0]['price'].toFixed(2)}`
                ) : (
                  `$${selectedProduct?.basePrice.toFixed(2)}`
                )}
                {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  + {[
                    selectedProduct.hasGST && 'GST',
                    selectedProduct.hasPST && 'PST'
                  ].filter(Boolean).join(' + ')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Rotated View Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Preview Rotated View</h3>
          <ProductViewTransformer
            frontCanvas={canvas}
            rotatedImageUrl={selectedProduct?.images[2]?.data}
            horizontalRotation={30}
            verticalRotation={30}
            canvasVersion={canvasVersion}
          />
        </div>


        {/* Design and Customization Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Template Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose a Design Template</h3>
            <div className="grid grid-cols-2 gap-4">
              {categoryTemplates.map((template) => (
                <div
                  key={template._id}
                  className={`p-3 border-2 rounded cursor-pointer ${
                    selectedTemplate?._id === template._id ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => handleTemplateChange(template)}
                >
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-32 object-contain rounded mb-2"
                  />
                  <p className="text-center font-medium">{template.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Required Fields */}
          {selectedTemplate && requiredFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Template Fields</h3>
              {requiredFields.map((field) => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-medium mb-2">
                    {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                    {field.placeholder && ` - ${field.placeholder}`}
                  </label>
                  {field.type === 'text' ? (
                    <input
                      type="text"
                      value={fieldInputs[field.id] || ''}
                      onChange={(e) => handleFieldInput(field.id, e.target.value, 'text')}
                      className="w-full px-3 py-2 border rounded"
                      placeholder={field.placeholder || `Enter ${field.type}`}
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFieldInput(field.id, e.target.files[0], field.type)}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Click the placeholder on the design to replace with your {field.type}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Custom Elements */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Add Custom Elements</h3>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-2"
                  placeholder="Enter custom text"
                />
                <button
                  onClick={handleCustomText}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Text
                </button>
              </div>

              <div>
                <label className="block font-medium mb-2">Add Custom Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImage}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Quantity</label>
              {/* <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border rounded"
              /> */}

<div className="flex items-center gap-2">
    <input
      type="number"
      min={selectedProduct?.minimumOrder || 1}
      max="10000"
      value={quantity}
      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || selectedProduct?.minimumOrder || 1)}
      className="w-full px-3 py-2 border rounded"
      disabled={!selectedProduct?.inStock}
    />
    {selectedProduct?.pricingTiers?.length > 0 && (
      <span className="text-sm text-gray-500">
        Current price: ${currentUnitPrice}/unit
      </span>
    )}
  </div>

            </div>

            <div>
              <label className="block font-medium mb-2">Special Instructions</label>
              <textarea
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border rounded"
                placeholder="Add any special requirements or notes..."
              />
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Design Instructions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select a template or add custom elements</li>
              <li>• Fill in all required fields for the selected template</li>
              <li>• Click any element to customize it</li>
              <li>• Double-click text to edit directly</li>
              <li>• Drag elements to reposition</li>
              <li>• Use corners to resize elements</li>
            </ul>
          </div>

          {/* Product Info */}
          <div className="mt-4">
            <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
            <p className="text-gray-600 mt-2">{selectedProduct?.description}</p>
            
            {/* Stock Status */}
            {!selectedProduct?.inStock && (
              <p className="text-red-600 font-medium mt-2">Out of Stock</p>
            )}
            
            {/* Minimum Order */}
            {selectedProduct?.minimumOrder > 1 && (
              <p className="text-blue-600 mt-2">
                Minimum Order: {selectedProduct.minimumOrder} units
              </p>
            )}
            
            {/* Price Tiers Display */}
            {selectedProduct?.pricingTiers?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Quantity Pricing:</p>
                {selectedProduct.pricingTiers.map((tier, index) => (
                  <p key={index} className={`text-sm ${
                    quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)
                      ? 'text-green-600 font-medium'
                      : 'text-gray-600'
                  }`}>
                    {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units: ${tier.price} each
                  </p>
                ))}
              </div>
            )}
            
            {/* Current Price */}
            <p className="text-lg font-semibold mt-2">
              Unit Price: ${currentUnitPrice}
              <br />
              Total: ${(currentUnitPrice * quantity).toFixed(2)}
              {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  + {[
                    selectedProduct.hasGST && 'GST',
                    selectedProduct.hasPST && 'PST'
                  ].filter(Boolean).join(' + ')}
                </span>
              )}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={
              (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
              !selectedProduct?.inStock ||
              quantity < (selectedProduct?.minimumOrder || 1)
            }
            className={`w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold
              ${(
                (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
                !selectedProduct?.inStock ||
                quantity < (selectedProduct?.minimumOrder || 1)
              )
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-green-600 transition-colors duration-200'
              }`}
          >
            {!selectedProduct?.inStock 
              ? 'Out of Stock'
              : `Add to Cart - $${(currentUnitPrice * quantity).toFixed(2)}`}
          </button>

          {/* Tax Notice */}
          {selectedProduct?.hasGST || selectedProduct?.hasPST ? (
            <p className="text-sm text-gray-500 text-center">
              *Final price will include applicable taxes ({[
                selectedProduct.hasGST && 'GST',
                selectedProduct.hasPST && 'PST'
              ].filter(Boolean).join(' + ')})
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductEditorBags;









// // working without visitor
// // src/components/ProductEditor.js
// import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
// import axios from "axios";
// import { useParams, useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import ProductViewTransformer from './ProductViewTransformer';


// const ProductEditorBags = () => {
//   const [canvasVersion, setCanvasVersion] = useState(0);
//   const [canvas, setCanvas] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [orderDescription, setOrderDescription] = useState("");
//   const canvasRef = useRef(null);
//   const { productId } = useParams();
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [categoryTemplates, setCategoryTemplates] = useState([]);
//   const [selectedProductImage, setSelectedProductImage] = useState(0);
//   const [currentUnitPrice, setCurrentUnitPrice] = useState(0);
//   const [fullImagePath,setFullImagePath] = useState(null);

//   // Template field states
//   const [requiredFields, setRequiredFields] = useState([]);
//   const [fieldInputs, setFieldInputs] = useState({});
  
//   // Customization states
//   const [selectedObject, setSelectedObject] = useState(null);
//   const [selectedColor, setSelectedColor] = useState('#000000');
//   const [fillColor, setFillColor] = useState('transparent');
//   const [selectedFontSize, setSelectedFontSize] = useState('20');
//   const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
//   const [customText, setCustomText] = useState('');
//   const [customizations, setCustomizations] = useState({});

//   const updateCanvasVersion = () => {
//     setCanvasVersion(prev => prev + 1);
//   };
  
//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

//   const calculateUnitPrice = (qty) => {
//     if (!selectedProduct?.pricingTiers?.length) {
//       return selectedProduct?.basePrice || 0;
//     }
  
//     const applicableTier = selectedProduct.pricingTiers
//       .sort((a, b) => b.minQuantity - a.minQuantity)
//       .find(tier => qty >= tier.minQuantity && 
//         (!tier.maxQuantity || qty <= tier.maxQuantity));
  
//     return applicableTier ? applicableTier.price : selectedProduct.basePrice;
//   };

//   const handleQuantityChange = (newQty) => {
//     // Enforce minimum order
//     const minOrder = selectedProduct?.minimumOrder || 1;
//     if (newQty < minOrder) {
//       alert(`Minimum order quantity is ${minOrder}`);
//       newQty = minOrder;
//     }
  
//     // Check if product is in stock
//     if (!selectedProduct?.inStock) {
//       alert('This product is currently out of stock');
//       return;
//     }
  
//     setQuantity(newQty);
//     setCurrentUnitPrice(calculateUnitPrice(newQty));
//   };

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: '#ffffff'
//     });
    
//     // Enable selection
//     fabricCanvas.selection = true;
  
//     // Add event listeners
//     fabricCanvas.on('mouse:down', function(opt) {
//       const evt = opt.e;
//       if (evt.altKey === true) {
//         this.isDragging = true;
//         this.selection = false;
//         this.lastPosX = evt.clientX;
//         this.lastPosY = evt.clientY;
//       }
//     });
  
//     // Make sure objects are selectable when added
//     fabricCanvas.on('object:added', function(e) {
//       const obj = e.target;
//       obj.set({
//         selectable: true,
//         hasControls: true,
//         hasBorders: true
//       });
//       updateCanvasVersion();
//     });
  
//     // Selection event handlers
//     fabricCanvas.on('selection:created', function(e) {
//       console.log('Selection created:', e.target);
//       handleObjectSelected(e);
//     });
  
//     fabricCanvas.on('selection:updated', function(e) {
//       console.log('Selection updated:', e.target);
//       handleObjectSelected(e);
//     });
  
//     fabricCanvas.on('selection:cleared', function(e) {
//       console.log('Selection cleared');
//       handleSelectionCleared();
//     });
  
//     // Modification handlers
//     fabricCanvas.on('object:modified', function(e) {
//       handleObjectModified(e);
//       updateCanvasVersion();
//     });
  
//     setCanvas(fabricCanvas);
//     return () => fabricCanvas.dispose();
//   }, []);


//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const productRes = await axios.get(`/api/products/${productId}`);
//         setSelectedProduct(productRes.data);
        
//         if (productRes.data.images && productRes.data.images.length > 0 && canvas) {
//           loadProductImage(productRes.data.images[0].data);
//         }
        
//         const templatesRes = await axios.get('/api/templates');
//         const filteredTemplates = templatesRes.data.filter(template => {
//           const templateCategoryId = template.category._id || template.category;
//           const productCategoryId = productRes.data.category._id || productRes.data.category;
//           return templateCategoryId === productCategoryId;
//         });

//         setCategoryTemplates(filteredTemplates);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     if (productId && canvas) {
//       fetchData();
//     }
//   }, [productId, canvas]);

//   const loadProductImage = (imageData) => {
//     if (!canvas) return;

//     fabric.Image.fromURL(imageData, (img) => {
//       canvas.clear();
//       const scale = Math.min(
//         canvas.width / img.width,
//         canvas.height / img.height
//       ) * 0.9;
      
//       img.set({
//         scaleX: scale,
//         scaleY: scale,
//         left: (canvas.width - img.width * scale) / 2,
//         top: (canvas.height - img.height * scale) / 2,
//         selectable: false,
//         evented: false
//       });
      
//       canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
//     });
//   };

//   const handleTemplateChange = (template) => {
//   if (!canvas || !template) return;
  
//   setSelectedTemplate(template);
//   setRequiredFields(template.requiredFields || []);
//   setFieldInputs({});
//   setCustomizations({});
  
//   const bgImage = canvas.backgroundImage;
//   canvas.clear();
//   canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
  
//   let elementsData = template.elements;
//   if (typeof template.elements === 'string') {
//     try {
//       elementsData = JSON.parse(template.elements);
//     } catch (error) {
//       console.error('Error parsing template elements:', error);
//       return;
//     }
//   }
  
//   if (elementsData && elementsData.objects) {
//     let loadedObjects = 0;
//     const totalObjects = elementsData.objects.length;
    
//     elementsData.objects.forEach(obj => {
//       fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//         const enlivenedObject = enlivenedObjects[0];
        
//         if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
//           enlivenedObject.set({
//             hasControls: true,
//             lockUniScaling: false,
//             lockRotation: false,
//             selectable: true
//           });
//         }
        
//         canvas.add(enlivenedObject);
//         loadedObjects++;
        
//         if (loadedObjects === totalObjects) {
//           canvas.renderAll();
//           updateCanvasVersion();
//         }
//       });
//     });
//   }
// };

// const handleObjectSelected = (event) => {
//   let obj;
  
//   // Handle both direct object passing and event passing
//   if (event.target) {
//     obj = event.target;
//   } else if (event.selected && event.selected[0]) {
//     obj = event.selected[0];
//   } else {
//     return;
//   }

//   console.log('Object selected:', {
//     type: obj.type,
//     text: obj.text,
//     fontFamily: obj.fontFamily,
//     fontSize: obj.fontSize,
//     fill: obj.fill
//   });

//   setSelectedObject(obj);
//   setSelectedColor(obj.fill || '#000000');
//   setFillColor(obj.fill === 'transparent' ? 'transparent' : obj.fill);
  
//   if (obj.type === 'i-text' || obj.type === 'text') {
//     setSelectedFontSize(obj.fontSize?.toString() || '20');
//     setSelectedFontFamily(obj.fontFamily || 'Arial');
//     setCustomText(obj.text || '');
//   }

//   // Force a re-render
//   updateCanvasVersion();
// };

//   const handleObjectModified = (e) => {
//     const obj = e.target;
//     if (!obj || !obj.data?.id) return;

//     setCustomizations(prev => ({
//       ...prev,
//       [obj.data.id]: {
//         type: obj.data.type || 'text',
//         imageUrl: obj.data?.originalFilePath || null, // Include the image URL
//         content: obj.type === 'i-text' || obj.type === 'text' ? obj.text : null,
//         image: obj.type === 'image' ? obj.toDataURL() : null,
//         properties: {
//           fontSize: obj.fontSize,
//           fontFamily: obj.fontFamily,
//           fill: obj.fill,
//           position: { x: obj.left, y: obj.top },
//           scale: { x: obj.scaleX, y: obj.scaleY }
//         }
//       }
//     }));

//     // Update field inputs if it's a required field
//     if (obj.data?.required) {
//       setFieldInputs(prev => ({
//         ...prev,
//         [obj.data.id]: obj.type === 'i-text' || obj.type === 'text' 
//           ? obj.text 
//           : obj.toDataURL()
//       }));
//     }
//   };

//   const handleSelectionCleared = () => {
//     setSelectedObject(null);
//     setSelectedColor('#000000');
//     setFillColor('transparent');
//     setSelectedFontSize('20');
//     setSelectedFontFamily('Arial');
//     setCustomText('');
//   };


//   const handleFieldInput = (fieldId, value, type) => {
//     const fields = canvas.getObjects().filter(obj => obj.data?.id === fieldId);
//     if (!fields.length) return;
  
//     const field = fields[0];
  
//     if (type === 'text' && (field.type === 'i-text' || field.type === 'text')) {
//       field.set('text', value);
//       setFieldInputs(prev => ({ ...prev, [fieldId]: value }));
//       handleObjectModified({ target: field });
//     } else if ((type === 'image' || type === 'logo') && value instanceof File) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         fabric.Image.fromURL(e.target.result, (img) => {
//           // Preserve original field's data and positioning
//           img.set({
//             left: field.left,
//             top: field.top,
//             scaleX: field.width / img.width,
//             scaleY: field.height / img.height,
//             data: field.data  // Preserve original field's metadata
//           });
  
//           // Replace the field with the new image
//           canvas.remove(field);
//           canvas.add(img);
//           canvas.setActiveObject(img);
//           canvas.renderAll();
  
//           setFieldInputs(prev => ({ ...prev, [fieldId]: e.target.result }));
//           handleObjectModified({ target: img });
//         });
//       };
//       reader.readAsDataURL(value);
//     }
  
//     canvas.renderAll();
//   };

//   const handleCustomText = () => {
//     if (!canvas || !customText) return;
  
//     const text = new fabric.IText(customText, {
//       left: canvas.width / 2,
//       top: canvas.height / 2,
//       fontSize: parseInt(selectedFontSize),
//       fontFamily: selectedFontFamily,
//       fill: selectedColor,
//       originX: 'center',
//       originY: 'center',
//       selectable: true,
//       hasControls: true,
//       hasBorders: true,
//       data: { type: 'custom-text', id: `custom_${Date.now()}` }
//     });
  
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//     setCustomText('');
//     handleObjectSelected({ target: text });
//     updateCanvasVersion();
//   };

//   const handleCustomImage = (e) => {
//     const file = e.target.files[0];
//     if (!file || !canvas) return;
  

//      // Create FormData for full–size image upload
//      const fullImageData = new FormData();
//      fullImageData.append("image", file);
   
//      axios.post('/api/upload-image', fullImageData, {
//        headers: { 
//          "Content-Type": "multipart/form-data",
//          "Authorization": `Bearer ${localStorage.getItem("token")}`
//        }
//      })
//      .then(res => {
//        let fullImagePath = res.data.filePath; // e.g., "/upload/161234567890_custom-image.png"
//        console.log(fullImagePath);

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {

//           // Store the file path in the object’s data so we can later use it in the cart
//           img.data = {
//             ...img.data,
//             type: 'custom-image',
//             id: `custom_${Date.now()}`,
//             originalFilePath: fullImagePath,
//           };

//         img.scaleToWidth(200);
//         img.set({
//           left: canvas.width / 2,
//           top: canvas.height / 2,
//           originX: 'center',
//           originY: 'center',
//           cornerSize: 12,
//           cornerColor: '#ffffff',
//           cornerStrokeColor: '#333333',
//           transparentCorners: false,
//           cornerStyle: 'circle',
//          // data: { type: 'custom-image', id: `custom_${Date.now()}` }
//          data: { 
//           type: 'custom-image', 
//           id: `custom_${Date.now()}`,
//           originalFilePath: fullImagePath // Store the path in the fabric object's data
//         }
//         });
  
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//         handleObjectModified({ target: img });
//         updateCanvasVersion();
//           // Also generate and upload the thumbnail (if needed)
//           canvas.lowerCanvasEl.toBlob((blob) => {
//             const thumbData = new FormData();
//             thumbData.append("thumbnail", blob, `thumb_${file.name}`);
//             axios.post('/api/upload-thumbnail', thumbData, {
//               headers: { 
//                 "Content-Type": "multipart/form-data",
//                 "Authorization": `Bearer ${localStorage.getItem("token")}`
//               }
//             })
//             .then(res2 => {
//               const thumbPath = res2.data.filePath;
//               // Save the thumbnail file path as well
//               img.data.thumbnailPath = thumbPath;
//             })
//             .catch(err => {
//               console.error("Thumbnail upload failed:", err);
//             });
//           }, "image/png");
//         });
//       };
//       reader.readAsDataURL(file);
//     })
//     .catch(err => {
//       console.error("Full image upload failed:", err);
//     });
//   };

//   const updateSelectedObject = () => {
//     if (!canvas || !selectedObject) return;

//     const updates = {
//       fill: selectedColor === 'transparent' ? 'transparent' : selectedColor
//     };

//     if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
//       updates.fontSize = parseInt(selectedFontSize);
//       updates.fontFamily = selectedFontFamily;
//     }

//     selectedObject.set(updates);
//     canvas.renderAll();
//     handleObjectModified({ target: selectedObject });
//   };

//   const handleDelete = () => {
//     if (!canvas || !selectedObject) return;

//     // Prevent deletion of required template fields
//     if (selectedObject.data?.required) {
//       alert("Cannot delete required template elements");
//       return;
//     }

//     if (selectedObject.data?.id) {
//       setCustomizations(prev => {
//         const newCustomizations = { ...prev };
//         delete newCustomizations[selectedObject.data.id];
//         return newCustomizations;
//       });
//     }

//     canvas.remove(selectedObject);
//     canvas.discardActiveObject();
//     canvas.renderAll();
//     handleSelectionCleared();
//   };


//   const handleAddToCart = async () => {
//     if (!selectedProduct || !canvas) return;
  

//       if (!selectedProduct.inStock) {
//         alert('This product is currently out of stock');
//         return;
//       }

//       if (quantity < (selectedProduct.minimumOrder || 1)) {
//         alert(`Minimum order quantity is ${selectedProduct.minimumOrder}`);
//         return;
//       }

//       try {
//       // Get all custom elements
//       const customElements = canvas.getObjects().filter(obj => 
//         obj !== canvas.backgroundImage
//       );
  
//       console.log('All Custom Elements:', customElements);

//       // Process custom fields
//       const customFields = customElements.map(obj => {
        
//         console.log('Processing Object:', obj);
//         console.log('Object Data:', obj.data);

//         // Special handling for logo/image placeholders
//         if (obj.data?.type === 'logo' || obj.data?.type === 'image') {
          
//           const dataUrl = obj.toDataURL ? obj.toDataURL('image/png') : null;
//           console.log('Logo/Image DataURL:', dataUrl);

//           return {
//             fieldId: obj.data?.id || `custom_${Date.now()}`,
//             type: 'image',
//             imageUrl: obj.data?.originalFilePath || fullImagePath || null, // Store the image URL
//             content: obj.toDataURL('image/png'),
//             properties: {
//               fontSize: null,
//               fontFamily: null,
//               fill: null,
//               position: {
//                 x: obj.left || 0,
//                 y: obj.top || 0
//               },
//               scale: {
//                 x: obj.scaleX || 1,
//                 y: obj.scaleY || 1
//               }
//             }
//           };
//         }
        
//         // Existing handling for text objects
//         if (obj.type === 'text' || obj.type === 'i-text') {
//           return {
//             fieldId: obj.data?.id || `custom_${Date.now()}`,
//             type: 'text',
//             content: obj.text,
//             properties: {
//               fontSize: obj.fontSize || null,
//               fontFamily: obj.fontFamily || null,
//               fill: obj.fill || null,
//               position: {
//                 x: obj.left || 0,
//                 y: obj.top || 0
//               },
//               scale: {
//                 x: obj.scaleX || 1,
//                 y: obj.scaleY || 1
//               }
//             }
//           };
//         }
  
//         // Fallback for other types of objects
//         return {
//           fieldId: obj.data?.id || `custom_${Date.now()}`,
//           type: obj.type,
//           imageUrl: obj.data?.originalFilePath || fullImagePath || null,
//           content: obj.toDataURL ? obj.toDataURL('image/png') : null,
//           properties: {
//             fontSize: null,
//             fontFamily: null,
//             fill: null,
//             position: {
//               x: obj.left || 0,
//               y: obj.top || 0
//             },
//             scale: {
//               x: obj.scaleX || 1,
//               y: obj.scaleY || 1
//             }
//           }
//         };
//       });
  
//       // Create customization data
//       const customization = {
//         template: selectedTemplate?._id || null,
//         preview: canvas.toDataURL('image/png'),
//         description: orderDescription || '',
//         customFields: customFields,
//         requiredFields: Object.entries(fieldInputs).map(([fieldId, value]) => ({
//           fieldId,
//           type: requiredFields.find(f => f.id === fieldId)?.type || 'text',
//           value: typeof value === 'string' ? value : value.toDataURL('image/png')
//         }))
//       };
  
//       console.log('Customization payload:', customization);
  
//       // Add to cart
//       await addToCart({
//         product: selectedProduct,
//         quantity: parseInt(quantity),
//         customization
//       });
  
//       navigate('/cart');
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       alert('Failed to add item to cart. Please try again.');
//     }
//   };
 
//   return (
//     <div className="container mx-auto p-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Front View Column */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-lg font-semibold mb-4">Design View</h3>
//           <canvas ref={canvasRef} className="border rounded-lg" />

//           {/* Product Images */}
//           {selectedProduct?.images && selectedProduct.images.length > 0 && (
//             <div className="mt-4 grid grid-cols-6 gap-2">
//               {selectedProduct.images.map((image, index) => (
//                 <div
//                   key={index}
//                   className={`cursor-pointer border-2 rounded ${
//                     selectedProductImage === index ? 'border-blue-500' : 'border-gray-200'
//                   }`}
//                   onClick={() => {
//                     setSelectedProductImage(index);
//                     loadProductImage(image.data);
//                   }}
//                 >
//                   <img
//                     src={image.data}
//                     alt={`Product view ${index + 1}`}
//                     className="w-full h-16 object-cover rounded"
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Customization Controls */}
//                {/* Customization Controls */}
//                {selectedObject && (
//             <div className="mt-4 p-4 border rounded">
//               <h4 className="font-semibold mb-2">Customize Element</h4>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm mb-1">Color</label>
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="color"
//                       value={selectedColor === 'transparent' ? '#ffffff' : selectedColor}
//                       onChange={(e) => {
//                         setSelectedColor(e.target.value);
//                         updateSelectedObject();
//                       }}
//                       className="w-full"
//                     />
//                     <label className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={selectedColor === 'transparent'}
//                         onChange={(e) => {
//                           setSelectedColor(e.target.checked ? 'transparent' : '#000000');
//                           updateSelectedObject();
//                         }}
//                         className="mr-2"
//                       />
//                       Transparent
//                     </label>
//                   </div>
//                 </div>

//                 {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
//                   <>
//                     <div>
//                       <label className="block text-sm mb-1">Font Size</label>
//                       <select
//                         value={selectedFontSize}
//                         onChange={(e) => {
//                           setSelectedFontSize(e.target.value);
//                           updateSelectedObject();
//                         }}
//                         className="w-full p-2 border rounded"
//                       >
//                         {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
//                           <option key={size} value={size}>{size}px</option>
//                         ))}
//                       </select>
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm mb-1">Font Family</label>
//                       <select
//                         value={selectedFontFamily}
//                         onChange={(e) => {
//                           setSelectedFontFamily(e.target.value);
//                           updateSelectedObject();
//                         }}
//                         className="w-full p-2 border rounded"
//                       >
//                         {fontFamilies.map(font => (
//                           <option key={font} value={font}>{font}</option>
//                         ))}
//                       </select>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {!selectedObject.data?.required && (
//                 <button
//                   onClick={handleDelete}
//                   className="mt-2 w-full bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
//                 >
//                   Delete Element
//                 </button>
//               )}
//             </div>
//           )}             

//           {/* Product Info */}
//           <div className="mt-4">
//             <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
//             <p className="text-gray-600 mt-2">{selectedProduct?.description}</p>
//             <p className="text-lg font-semibold mt-2">
//               Price:
//               {selectedProduct?.pricingTiers.length !=null && selectedProduct?.pricingTiers.length > 0 ? (
//                   `From $${selectedProduct.pricingTiers[0]['price'].toFixed(2)}`
//                 ) : (
//                   `$${selectedProduct?.basePrice.toFixed(2)}`
//                 )}
//                 {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
//                 <span className="text-sm font-normal text-gray-600 ml-2">
//                   + {[
//                     selectedProduct.hasGST && 'GST',
//                     selectedProduct.hasPST && 'PST'
//                   ].filter(Boolean).join(' + ')}
//                 </span>
//               )}
//             </p>
//           </div>
//         </div>

//         {/* Rotated View Column */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-lg font-semibold mb-4">Preview Rotated View</h3>
//           <ProductViewTransformer
//             frontCanvas={canvas}
//             rotatedImageUrl={selectedProduct?.images[2]?.data}
//             horizontalRotation={30}
//             verticalRotation={30}
//             canvasVersion={canvasVersion}
//           />
//         </div>


//         {/* Design and Customization Column */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           {/* Template Selection */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3">Choose a Design Template</h3>
//             <div className="grid grid-cols-2 gap-4">
//               {categoryTemplates.map((template) => (
//                 <div
//                   key={template._id}
//                   className={`p-3 border-2 rounded cursor-pointer ${
//                     selectedTemplate?._id === template._id ? 'border-blue-500' : 'border-gray-200'
//                   }`}
//                   onClick={() => handleTemplateChange(template)}
//                 >
//                   <img
//                     src={template.preview}
//                     alt={template.name}
//                     className="w-full h-32 object-contain rounded mb-2"
//                   />
//                   <p className="text-center font-medium">{template.name}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Required Fields */}
//           {selectedTemplate && requiredFields.length > 0 && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Required Template Fields</h3>
//               {requiredFields.map((field) => (
//                 <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
//                   <label className="block font-medium mb-2">
//                     {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
//                     {field.placeholder && ` - ${field.placeholder}`}
//                   </label>
//                   {field.type === 'text' ? (
//                     <input
//                       type="text"
//                       value={fieldInputs[field.id] || ''}
//                       onChange={(e) => handleFieldInput(field.id, e.target.value, 'text')}
//                       className="w-full px-3 py-2 border rounded"
//                       placeholder={field.placeholder || `Enter ${field.type}`}
//                     />
//                   ) : (
//                     <div>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => handleFieldInput(field.id, e.target.files[0], field.type)}
//                         className="w-full"
//                       />
//                       <p className="text-sm text-gray-500 mt-1">
//                         Click the placeholder on the design to replace with your {field.type}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Custom Elements */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3">Add Custom Elements</h3>
//             <div className="space-y-3">
//               <div>
//                 <input
//                   type="text"
//                   value={customText}
//                   onChange={(e) => setCustomText(e.target.value)}
//                   className="w-full px-3 py-2 border rounded mb-2"
//                   placeholder="Enter custom text"
//                 />
//                 <button
//                   onClick={handleCustomText}
//                   className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Add Text
//                 </button>
//               </div>

//               <div>
//                 <label className="block font-medium mb-2">Add Custom Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleCustomImage}
//                   className="w-full"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Order Details */}
//           <div className="space-y-4">
//             <div>
//               <label className="block font-medium mb-2">Quantity</label>
//               {/* <input
//                 type="number"
//                 min="1"
//                 max="100"
//                 value={quantity}
//                 onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
//                 className="w-full px-3 py-2 border rounded"
//               /> */}

// <div className="flex items-center gap-2">
//     <input
//       type="number"
//       min={selectedProduct?.minimumOrder || 1}
//       max="10000"
//       value={quantity}
//       onChange={(e) => handleQuantityChange(parseInt(e.target.value) || selectedProduct?.minimumOrder || 1)}
//       className="w-full px-3 py-2 border rounded"
//       disabled={!selectedProduct?.inStock}
//     />
//     {selectedProduct?.pricingTiers?.length > 0 && (
//       <span className="text-sm text-gray-500">
//         Current price: ${currentUnitPrice}/unit
//       </span>
//     )}
//   </div>

//             </div>

//             <div>
//               <label className="block font-medium mb-2">Special Instructions</label>
//               <textarea
//                 value={orderDescription}
//                 onChange={(e) => setOrderDescription(e.target.value)}
//                 rows="3"
//                 className="w-full px-3 py-2 border rounded"
//                 placeholder="Add any special requirements or notes..."
//               />
//             </div>
//           </div>

//           {/* Instructions Panel */}
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h4 className="font-medium text-gray-900 mb-2">Design Instructions</h4>
//             <ul className="text-sm text-gray-600 space-y-1">
//               <li>• Select a template or add custom elements</li>
//               <li>• Fill in all required fields for the selected template</li>
//               <li>• Click any element to customize it</li>
//               <li>• Double-click text to edit directly</li>
//               <li>• Drag elements to reposition</li>
//               <li>• Use corners to resize elements</li>
//             </ul>
//           </div>

//           {/* Product Info */}
//           <div className="mt-4">
//             <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
//             <p className="text-gray-600 mt-2">{selectedProduct?.description}</p>
            
//             {/* Stock Status */}
//             {!selectedProduct?.inStock && (
//               <p className="text-red-600 font-medium mt-2">Out of Stock</p>
//             )}
            
//             {/* Minimum Order */}
//             {selectedProduct?.minimumOrder > 1 && (
//               <p className="text-blue-600 mt-2">
//                 Minimum Order: {selectedProduct.minimumOrder} units
//               </p>
//             )}
            
//             {/* Price Tiers Display */}
//             {selectedProduct?.pricingTiers?.length > 0 && (
//               <div className="mt-2">
//                 <p className="font-medium">Quantity Pricing:</p>
//                 {selectedProduct.pricingTiers.map((tier, index) => (
//                   <p key={index} className={`text-sm ${
//                     quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)
//                       ? 'text-green-600 font-medium'
//                       : 'text-gray-600'
//                   }`}>
//                     {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units: ${tier.price} each
//                   </p>
//                 ))}
//               </div>
//             )}
            
//             {/* Current Price */}
//             <p className="text-lg font-semibold mt-2">
//               Unit Price: ${currentUnitPrice}
//               <br />
//               Total: ${(currentUnitPrice * quantity).toFixed(2)}
//               {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
//                 <span className="text-sm font-normal text-gray-600 ml-2">
//                   + {[
//                     selectedProduct.hasGST && 'GST',
//                     selectedProduct.hasPST && 'PST'
//                   ].filter(Boolean).join(' + ')}
//                 </span>
//               )}
//             </p>
//           </div>

//           {/* Add to Cart Button */}
//           <button
//             onClick={handleAddToCart}
//             disabled={
//               (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
//               !selectedProduct?.inStock ||
//               quantity < (selectedProduct?.minimumOrder || 1)
//             }
//             className={`w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold
//               ${(
//                 (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
//                 !selectedProduct?.inStock ||
//                 quantity < (selectedProduct?.minimumOrder || 1)
//               )
//                 ? 'opacity-50 cursor-not-allowed'
//                 : 'hover:bg-green-600 transition-colors duration-200'
//               }`}
//           >
//             {!selectedProduct?.inStock 
//               ? 'Out of Stock'
//               : `Add to Cart - $${(currentUnitPrice * quantity).toFixed(2)}`}
//           </button>

//           {/* Tax Notice */}
//           {selectedProduct?.hasGST || selectedProduct?.hasPST ? (
//             <p className="text-sm text-gray-500 text-center">
//               *Final price will include applicable taxes ({[
//                 selectedProduct.hasGST && 'GST',
//                 selectedProduct.hasPST && 'PST'
//               ].filter(Boolean).join(' + ')})
//             </p>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductEditorBags;