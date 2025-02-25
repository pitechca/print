// src/components/ProductEditor.js
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Lottie from "lottie-react"; 
import cartAnimation from '../assets/cartAnimation.json';
import ProductHeader from '../components/ProductHeader'; 

const ProductEditor = () => {
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
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#EEF2FF');
const [selectedSecondaryColor, setSelectedSecondaryColor] = useState('#EDE9FE');
  // holds the area of the product image on the canvas
  const [productImageArea, setProductImageArea] = useState(null);

  const [remindPopup, setRemindPopup] = useState({ show: false, message: "" });

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
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [notifyContact, setNotifyContact] = useState({ email: "", phone: "" });
  const [showNotifyForm, setShowNotifyForm] = useState(false);


  // NEW: State to toggle design view mode (null, "upload", or "customize")
  const [designMode, setDesignMode] = useState(null);
  // NEW: State to control display of the Add-To-Cart confirmation modal
  const [showCartModal, setShowCartModal] = useState(false);

  // Reorder images: show the 2nd, 3rd, … images first, then the 1st image at the end
  const reorderedImages =
    selectedProduct?.images && selectedProduct.images.length > 1
      ? [...selectedProduct.images.slice(1), selectedProduct.images[0]]
      : selectedProduct?.images || [];

  const updateCanvasVersion = () => {
    setCanvasVersion(prev => prev + 1);
  };

  const fontFamilies = [
    'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
    'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
  ];

  const getBundleOptions = () => {
    if (!selectedProduct?.pricingTiers || selectedProduct.pricingTiers.length === 0) {
      return [];
    }
    // Map each tier to its maxQuantity if exists, otherwise minQuantity
    const options = selectedProduct.pricingTiers.map(tier =>
      tier.maxQuantity ? tier.maxQuantity : tier.minQuantity
    );
    // Remove duplicates and sort options
    const uniqueOptions = Array.from(new Set(options)).sort((a, b) => a - b);
    // Always include 10000 if not already present
    if (!uniqueOptions.includes(10000)) {
      uniqueOptions.push(10000);
      uniqueOptions.sort((a, b) => a - b);
    }
    return uniqueOptions;
  };

  const handleRemindMe = async () => {
    try {
      const data = {};
      if (notifyContact.email) data.email = notifyContact.email;
      if (notifyContact.phone) data.phone = notifyContact.phone;
      if (!data.email && !data.phone) {
        setRemindPopup({ show: true, message: "Please enter your email and/or phone." });
        return;
      }
      const headers = isUserLoggedIn ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {};
      const response = await axios.post(`/api/products/${productId}/remind-me`, data, { headers });
      setRemindPopup({ show: true, message: response.data.message });
    } catch (error) {
      console.error("Error setting reminder:", error);
      setRemindPopup({ show: true, message: "Failed to set reminder. Please try again." });
    }
  };

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
      const computedWidth = img.width * scale;
      const computedHeight = img.height * scale;
      const left = (canvas.width - computedWidth) / 2;
      const top = (canvas.height - computedHeight) / 2;
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: left,
        top: top,
        selectable: false,
        evented: false
      });
      
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      // Set the clipping area to match the product image area
      setProductImageArea({
        x: left,
        y: top,
        width: computedWidth,
        height: computedHeight
      });
    });
  };

  const handleTemplateChange = (template) => {
    if (!canvas || !template) return;
    
    setSelectedTemplate(template);
    setRequiredFields(template.requiredFields || []);
    setFieldInputs({});
    setCustomizations({});
    
    // Keep background image
    const bgImage = canvas.backgroundImage;
    canvas.clear();
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
    
    // Load template elements
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
      elementsData.objects.forEach(obj => {
        fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
          const enlivenedObject = enlivenedObjects[0];
          
          // Keep required field IDs and placeholder properties
          if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
            enlivenedObject.set({
              hasControls: true,
              lockUniScaling: false,
              lockRotation: false,
              selectable: true
            });
          }
          
          canvas.add(enlivenedObject);
          canvas.renderAll();
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
  
    // For image objects, use the original file path if it exists.
    const imageContent = obj.type === 'image'
      ? (obj.data.originalFilePath || obj.toDataURL({ format: 'png', quality: 1, multiplier: 4 }))
      : null;
  
    setCustomizations(prev => ({
      ...prev,
      [obj.data.id]: {
        type: obj.data.type || 'text',
        content: (obj.type === 'i-text' || obj.type === 'text')
          ? obj.text
          : imageContent,
        image: obj.type === 'image' ? imageContent : null,
        properties: {
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fill: obj.fill,
          position: { x: obj.left, y: obj.top },
          scale: { x: obj.scaleX, y: obj.scaleY }
        }
      }
    }));
  
    if (obj.data?.required) {
      setFieldInputs(prev => ({
        ...prev,
        [obj.data.id]: (obj.type === 'i-text' || obj.type === 'text')
          ? obj.text
          : (obj.data.originalFilePath ? obj.data.originalFilePath : obj.toDataURL())
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

  const handleFieldInput = async (fieldId, value, type) => {
    if (!canvas) return;
    
    const fields = canvas.getObjects().filter(obj => obj.data?.id === fieldId);
    if (!fields.length) return;
    
    const field = fields[0];
    
    if ((type === 'image' || type === 'logo') && value instanceof File) {
      if (!productImageArea) {
        alert("Please select a product image first");
        return;
      }
      const originalDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(value);
      });
  
      setFieldInputs(prev => ({
        ...prev,
        [fieldId]: {
          displayData: originalDataUrl, // For preview
          originalFile: value // Keep original file
        }
      }));
  
      fabric.Image.fromURL(originalDataUrl, (img) => {
        const scale = Math.min(field.width / img.width, field.height / img.height);
        
        img.set({
          left: field.left,
          top: field.top,
          scaleX: scale,
          scaleY: scale,
          data: {
            ...field.data,
            originalFile: value
          }
        });
        img.clipPath = new fabric.Rect({
          left: productImageArea.x,
          top: productImageArea.y,
          width: productImageArea.width,
          height: productImageArea.height,
          absolutePositioned: true,
        });
  
        canvas.remove(field);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    }
  
    if (type === 'text' && (field.type === 'i-text' || field.type === 'text')) {
      field.set('text', value);
      setFieldInputs(prev => ({ ...prev, [fieldId]: value }));
      handleObjectModified({ target: field });
    } else if ((type === 'image' || type === 'logo') && value instanceof File) {
      if (!productImageArea) {
        alert("Please select a product image first");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          const scale = Math.min(
            field.width * field.scaleX / img.width,
            field.height * field.scaleY / img.height
          );
  
          img.set({
            left: field.left,
            top: field.top,
            scaleX: scale,
            scaleY: scale,
            data: field.data
          });
  
          img.clipPath = new fabric.Rect({
            left: productImageArea.x,
            top: productImageArea.y,
            width: productImageArea.width,
            height: productImageArea.height,
            absolutePositioned: true,
          });
  
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
    if (!productImageArea) {
      alert("Please select a product image first");
      return;
    }
  
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
    // Apply clipping so the text is only visible within the product image area
    text.clipPath = new fabric.Rect({
      left: productImageArea.x,
      top: productImageArea.y,
      width: productImageArea.width,
      height: productImageArea.height,
      absolutePositioned: true,
    });
  
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setCustomText('');
    handleObjectSelected({ target: text });
    updateCanvasVersion();
  };
  
  const handleCustomImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;
    if (!productImageArea) {
      alert("Please select a product image first");
      return;
    }
  
    // file validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)');
      return;
    }
  
    // size validation (e.g., 50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      alert('File is too large. Please upload an image smaller than 50MB.');
      return;
    }
  
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
  
      // Upload image
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
            img.data = {
              type: 'custom-image',
              id: `custom_${Date.now()}`,
              originalFilePath: filePath,
            };
          
            // Apply clipping so the image is only visible within the product image area
            img.clipPath = new fabric.Rect({
              left: productImageArea.x,
              top: productImageArea.y,
              width: productImageArea.width,
              height: productImageArea.height,
              absolutePositioned: true,
            });
          
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
            setSelectedObject(img); // <-- This line ensures the design tools appear for the new image.
            canvas.renderAll();
            handleObjectModified({ target: img });
            updateCanvasVersion();
          });
      };
      reader.readAsDataURL(file);
  
    } catch (error) {
      console.error('Image upload failed:', error);
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

  // NEW: Open the cart modal after validating product in-stock and quantity
  const openCartModal = () => {
    if (!selectedProduct || !canvas) return;
  
    if (!selectedProduct.inStock) {
      alert('This product is currently out of stock');
      return;
    }
  
    if (quantity < (selectedProduct?.minimumOrder || 1)) {
      alert(`Minimum order quantity is ${selectedProduct.minimumOrder}`);
      return;
    }
  
    setShowCartModal(true);
  };

  // NEW: Refactored function to add item to cart (same logic as before)
  const addItemToCart = async () => {
    const customElements = canvas.getObjects().filter(obj => obj !== canvas.backgroundImage);
  
    // Process custom fields from canvas objects
    const customFields = customElements.map(obj => {
      if (obj.data?.type === 'image' || obj.data?.type === 'logo') {
        return {
          fieldId: obj.data?.id || `custom_${Date.now()}`,
          type: obj.data.type,
          imageUrl: obj.data?.originalFilePath || fullImagePath || null, // Store the image URL
          content: (obj.data && obj.data.originalFilePath)
            ? obj.data.originalFilePath
            : obj.toDataURL({ format: 'png', quality: 1, multiplier: 4 }),
          properties: {
            fontSize: null,
            fontFamily: null,
            fill: null,
            position: { x: obj.left || 0, y: obj.top || 0 },
            scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
          }
        };
      }
      if (obj.type === 'text' || obj.type === 'i-text') {
        return {
          fieldId: obj.data?.id || `custom_${Date.now()}`,
          type: 'text',
          content: obj.text,
          properties: {
            fontSize: obj.fontSize || null,
            fontFamily: obj.fontFamily || null,
            fill: obj.fill || null,
            position: { x: obj.left || 0, y: obj.top || 0 },
            scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
          }
        };
      }
      // Default case
      return {
        fieldId: obj.data?.id || `custom_${Date.now()}`,
        type: obj.type,
        imageUrl: obj.data?.originalFilePath || fullImagePath || null,
        content: obj.toDataURL('png'),
        properties: {
          position: { x: obj.left || 0, y: obj.top || 0 },
          scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
        }
      };
    });
  
    const imageField = customFields.find(field =>
      field.type === 'image' &&
      typeof field.content === 'string' &&
      field.content.startsWith('/upload/')
    );
    const previewImage = imageField ? imageField.content : canvas.toDataURL('image/png');
  
    const customization = {
      template: selectedTemplate?._id || null,
      preview: previewImage,
      description: orderDescription || '',
      customFields: customFields,
      requiredFields: Object.entries(fieldInputs).map(([fieldId, value]) => {
        const fieldDef = requiredFields.find(f => f.id === fieldId);
        const fieldType = fieldDef?.type || 'text';
        const isImageField = typeof value === 'object' && value.displayData;
        
        return {
          fieldId,
          type: fieldType,
          imageUrl: isImageField ? value.displayData : null,
          value: isImageField ? value.displayData : value
        };
      })
    };
  
    await addToCart({
      product: selectedProduct,
      quantity: parseInt(quantity),
      customization
    });
  };

  // NEW: Handler for confirming the Add-To-Cart from the modal.
  // Parameter "redirect" is true when proceeding to checkout.
  const handleConfirmAddToCart = async (redirect) => {
    try {
      await addItemToCart();
      setShowCartModal(false);
      setShowCartNotification(true);
      if (redirect) {
        setTimeout(() => {
          setShowCartNotification(false);
          navigate('/cart');
        }, 3000);
      } else {
        setTimeout(() => {
          setShowCartNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">


      {/* Header */}
      <ProductHeader selectedProduct={selectedProduct} />

      {showCartNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
            <p className="text-xl">Item added to cart successfully!</p>
            </div>
        </div>
        )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Canvas and Product Info Column */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <canvas ref={canvasRef} className="border rounded-lg w-full max-w-[500px]" />

          {/* Product Images */}
          {selectedProduct?.images && selectedProduct.images.length > 0 && (
            <div className="mt-4 grid grid-cols-6 gap-2">
              {reorderedImages.map((image, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded p-1 ${selectedProductImage === index ? 'border-blue-500' : 'border-gray-200'}`}
                  onClick={() => {
                    setSelectedProductImage(index);
                    loadProductImage(image.data);
                  }}
                >
                  <img
                    src={image.data}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}

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
            {/* <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
            <p className="text-gray-600 mt-2">{selectedProduct?.description}</p> */}
            <p className="text-lg font-semibold mt-2">
              {/* Price:{" "}
              {selectedProduct?.pricingTiers.length != null && selectedProduct?.pricingTiers.length > 0 ? (
                ` $${selectedProduct.pricingTiers[0]['price'].toFixed(2)} And Lower`
              ) : (
                `$${selectedProduct?.basePrice.toFixed(2)}`
              )}
              {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  + {[selectedProduct.hasGST && 'GST', selectedProduct.hasPST && 'PST'].filter(Boolean).join(' + ')}
                </span>
              )} */}
            </p>
          </div>

          {/* Out-of-stock Get Notified (only shown if product is not in stock) */}
          {!selectedProduct?.inStock && (
            <>
                <button className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-semibold cursor-not-allowed">
                    Out of Stock
                </button>
                {!showNotifyForm ? (
                <button 
                    onClick={() => setShowNotifyForm(true)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                    {/* Replace the SVG below with your bill svc icon component if needed */}
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Notify me
                </button>
                ) : (
                <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="text-xl font-semibold text-blue-800 mb-2">Get Notified</h4>
                    <p className="text-sm text-blue-700 mb-2">
                    Enter your email and/or phone number to receive a notification when this product becomes available.
                    </p>
                    <div className="space-y-2">
                    <input
                        type="email"
                        placeholder="Your Email"
                        value={notifyContact.email}
                        onChange={(e) => setNotifyContact(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        type="tel"
                        placeholder="Your Phone Number"
                        value={notifyContact.phone}
                        onChange={(e) => setNotifyContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <button
                        onClick={handleRemindMe}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                        Notify Me
                    </button>
                    </div>
                </div>
                )}
            </>
            )}

          {/* {!selectedProduct?.inStock && (
            <>
              <button className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-semibold cursor-not-allowed">
                Out of Stock
              </button>
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="text-xl font-semibold text-blue-800 mb-2">Get Notified</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Enter your email and/or phone number to receive a notification when this product becomes available.
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={notifyContact.email}
                    onChange={(e) => setNotifyContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone Number"
                    value={notifyContact.phone}
                    onChange={(e) => setNotifyContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <button
                    onClick={handleRemindMe}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    Notify Me When Available
                  </button>
                </div>
              </div>
            </>
          )} */}
        </div>

        {/* Design and Customization Column */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <h2 className="text-lg font-bold mb-3">Design The Product</h2>

          {/* <div className="flex justify-around">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setDesignMode("upload")}
            >
              Upload Your Design
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setDesignMode("customize")}
            >
              Customize Your Product
            </button>
          </div> */}
          <div className="w-full max-w-2xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                className="bg-indigo-600 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-md shadow-sm transition duration-200 ease-in-out flex items-center justify-center"
                onClick={() => setDesignMode("upload")}
                >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                Upload Your Design
                </button>
                
                <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-md shadow-sm transition duration-200 ease-in-out flex items-center justify-center"
                onClick={() => setDesignMode("customize")}
                >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Customize Your Product
                </button>
            </div>
            </div>

          {designMode === "upload" && (
            <div className="mt-4">
              <label className="block font-medium mb-2">Add Custom Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomImage}
                className="w-full"
              />
            </div>
          )}

          {designMode === "customize" && (
            <>
              <div>
                <div className="grid grid-cols-2 gap-4">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template._id}
                      className={`p-3 border-2 rounded cursor-pointer ${selectedTemplate?._id === template._id ? 'border-blue-500' : 'border-gray-200'}`}
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
            </>
          )}

          {/* Always show Quantity and Special Instructions */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                {selectedProduct?.pricingTiers?.length > 0 ? (
                  <select
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    className="w-56 px-3 py-2 border rounded"
                    disabled={!selectedProduct?.inStock}
                  >
                    {getBundleOptions().map(option => (
                      <option key={option} value={option}>
                        {option === 10000 ? `+${option}` : option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={selectedProduct?.minimumOrder || 1}
                    max="10000"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || selectedProduct?.minimumOrder || 1)}
                    className="w-full px-3 py-2 border rounded"
                    disabled={!selectedProduct?.inStock}
                  />
                )}
                {selectedProduct?.pricingTiers?.length > 0 && (
                  quantity === 10000 ? (
                    <div style={{minWidth: '250px'}}>
                      <div className="mt-2 p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg shadow-md">
                        <p className="font-semibold text-lg">We'll Contact You</p>
                        <p className="text-sm">To provide the best deal for you</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Current price: ${currentUnitPrice}/unit
                    </span>
                  )
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
        </div>
      </div>

      {/* NEW: Add To Cart Button (shown at the end of the page) for in-stock products */}
      {selectedProduct?.inStock && (
        <div className="mt-8">
          <button
            onClick={openCartModal}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors duration-200"
          >
            Add to Cart - ${ (currentUnitPrice * quantity).toFixed(2) }
          </button>
        </div>
      )}

      {/* NEW: Modal for Add-To-Cart confirmation */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            {/* Close button */}
            <button 
                onClick={() => setShowCartModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            
            {/* Header */}
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Order Summary</h3>
            </div>
            
            {/* Content */}
            <div className="space-y-4">
                {/* Product info could go here */}
                
                {/* Total */}
                <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${(currentUnitPrice * quantity).toFixed(2)}</span>
                </div>
                
                {/* Taxes */}
                {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
                    <div className="mt-2 text-sm text-gray-500 border-t pt-2">
                    <div className="flex justify-between items-center">
                        <span>Taxes:</span>
                        <span>{[
                        selectedProduct.hasGST && 'GST', 
                        selectedProduct.hasPST && 'PST'
                        ].filter(Boolean).join(' + ')}</span>
                    </div>
                    </div>
                )}
                </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col space-y-3 mt-6">
                <button 
                onClick={() => handleConfirmAddToCart(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Proceed to Checkout
                </button>
                
                <button 
                onClick={() => handleConfirmAddToCart(false)} 
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Continue Shopping
                </button>
            </div>
            </div>
        </div>
        )}

      {remindPopup.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg shadow-lg p-6">
            <p className="text-lg text-gray-800">{remindPopup.message}</p>
            <button
              onClick={() => setRemindPopup({ show: false, message: "" })}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductEditor;







// // src/pages/ProductCustomization.js
// import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
// import axios from "axios";
// import { useParams, useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import Lottie from "lottie-react"; 
// import cartAnimation from '../assets/cartAnimation.json';

// const ProductCustomization = () => {
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
//   const [showCartNotification, setShowCartNotification] = useState(false);
//   // holds the area of the product image on the canvas
//   const [productImageArea, setProductImageArea] = useState(null);

//   const [remindPopup, setRemindPopup] = useState({ show: false, message: "" });


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
//   const [canvasVersion, setCanvasVersion] = useState(0);
//   const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
//   const [notifyContact, setNotifyContact] = useState({ email: "", phone: "" });

//   // Reorder images: show the 2nd, 3rd, … images first, then the 1st image at the end
//   const reorderedImages =
//     selectedProduct?.images && selectedProduct.images.length > 1
//       ? [...selectedProduct.images.slice(1), selectedProduct.images[0]]
//       : selectedProduct?.images || [];

//   const updateCanvasVersion = () => {
//     setCanvasVersion(prev => prev + 1);
//   };

//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

//   const getBundleOptions = () => {
//     if (!selectedProduct?.pricingTiers || selectedProduct.pricingTiers.length === 0) {
//       return [];
//     }
//     // Map each tier to its maxQuantity if exists, otherwise minQuantity
//     const options = selectedProduct.pricingTiers.map(tier =>
//       tier.maxQuantity ? tier.maxQuantity : tier.minQuantity
//     );
//     // Remove duplicates and sort options
//     const uniqueOptions = Array.from(new Set(options)).sort((a, b) => a - b);
//     // Always include 10000 if not already present
//     if (!uniqueOptions.includes(10000)) {
//       uniqueOptions.push(10000);
//       uniqueOptions.sort((a, b) => a - b);
//     }
//     return uniqueOptions;
//   };

//   const handleRemindMe = async () => {
//     try {
//       const data = {};
//       if (notifyContact.email) data.email = notifyContact.email;
//       if (notifyContact.phone) data.phone = notifyContact.phone;
//       if (!data.email && !data.phone) {
//         setRemindPopup({ show: true, message: "Please enter your email and/or phone." });
//         return;
//       }
//       const headers = isUserLoggedIn ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {};
//       const response = await axios.post(`/api/products/${productId}/remind-me`, data, { headers });
//       setRemindPopup({ show: true, message: response.data.message });
//     } catch (error) {
//       console.error("Error setting reminder:", error);
//       setRemindPopup({ show: true, message: "Failed to set reminder. Please try again." });
//     }
//   };

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
//     // Get the container's width and choose the canvas width accordingly (max 500px)
//     const containerWidth = canvasRef.current.parentElement.offsetWidth;
//     const canvasWidth = containerWidth < 500 ? containerWidth : 500;
    
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: canvasWidth - 50,
//       height: canvasWidth, // keep it square, adjust if needed
//       backgroundColor: '#ffffff'
//     });
    
//     // Enable selection
//     fabricCanvas.selection = true;
  
//     // Add event listeners (no changes here)
//     fabricCanvas.on('mouse:down', function(opt) {
//       const evt = opt.e;
//       if (evt.altKey === true) {
//         this.isDragging = true;
//         this.selection = false;
//         this.lastPosX = evt.clientX;
//         this.lastPosY = evt.clientY;
//       }
//     });
    
//     fabricCanvas.on('object:added', function(e) {
//       const obj = e.target;
//       obj.set({
//         selectable: true,
//         hasControls: true,
//         hasBorders: true
//       });
//       updateCanvasVersion();
//     });
    
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
//           const defaultImageData = productRes.data.images[1]
//             ? productRes.data.images[1].data
//             : productRes.data.images[0].data;
//           loadProductImage(defaultImageData);
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
//       const computedWidth = img.width * scale;
//       const computedHeight = img.height * scale;
//       const left = (canvas.width - computedWidth) / 2;
//       const top = (canvas.height - computedHeight) / 2;
      
//       img.set({
//         scaleX: scale,
//         scaleY: scale,
//         left: left,
//         top: top,
//         selectable: false,
//         evented: false
//       });
      
//       canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
//       // Set the clipping area to match the product image area
//       setProductImageArea({
//         x: left,
//         y: top,
//         width: computedWidth,
//         height: computedHeight
//       });
//     });
//   };

//   const handleTemplateChange = (template) => {
//     if (!canvas || !template) return;
    
//     setSelectedTemplate(template);
//     setRequiredFields(template.requiredFields || []);
//     setFieldInputs({});
//     setCustomizations({});
    
//     // Keep background image
//     const bgImage = canvas.backgroundImage;
//     canvas.clear();
//     canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
    
//     // Load template elements
//     let elementsData = template.elements;
//     if (typeof template.elements === 'string') {
//       try {
//         elementsData = JSON.parse(template.elements);
//       } catch (error) {
//         console.error('Error parsing template elements:', error);
//         return;
//       }
//     }
    
//     if (elementsData && elementsData.objects) {
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
          
//           // Keep required field IDs and placeholder properties
//           if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
//             enlivenedObject.set({
//               hasControls: true,
//               lockUniScaling: false,
//               lockRotation: false,
//               selectable: true
//             });
//           }
          
//           canvas.add(enlivenedObject);
//           canvas.renderAll();
//         });
//       });
//     }
//   };

//   const handleObjectSelected = (event) => {
//     let obj;
    
//     // Handle both direct object passing and event passing
//     if (event.target) {
//       obj = event.target;
//     } else if (event.selected && event.selected[0]) {
//       obj = event.selected[0];
//     } else {
//       return;
//     }
  
//     console.log('Object selected:', {
//       type: obj.type,
//       text: obj.text,
//       fontFamily: obj.fontFamily,
//       fontSize: obj.fontSize,
//       fill: obj.fill
//     });
  
//     setSelectedObject(obj);
//     setSelectedColor(obj.fill || '#000000');
//     setFillColor(obj.fill === 'transparent' ? 'transparent' : obj.fill);
    
//     if (obj.type === 'i-text' || obj.type === 'text') {
//       setSelectedFontSize(obj.fontSize?.toString() || '20');
//       setSelectedFontFamily(obj.fontFamily || 'Arial');
//       setCustomText(obj.text || '');
//     }
  
//     // Force a re-render
//     updateCanvasVersion();
//   };

//   const handleObjectModified = (e) => {
//     const obj = e.target;
//     if (!obj || !obj.data?.id) return;
  
//     // For image objects, use the original file path if it exists.
//     const imageContent = obj.type === 'image'
//       ? (obj.data.originalFilePath || obj.toDataURL({ format: 'png', quality: 1, multiplier: 4 }))
//       : null;
  
//     setCustomizations(prev => ({
//       ...prev,
//       [obj.data.id]: {
//         type: obj.data.type || 'text',
//         content: (obj.type === 'i-text' || obj.type === 'text')
//           ? obj.text
//           : imageContent,
//         image: obj.type === 'image' ? imageContent : null,
//         properties: {
//           fontSize: obj.fontSize,
//           fontFamily: obj.fontFamily,
//           fill: obj.fill,
//           position: { x: obj.left, y: obj.top },
//           scale: { x: obj.scaleX, y: obj.scaleY }
//         }
//       }
//     }));
  
//     if (obj.data?.required) {
//       setFieldInputs(prev => ({
//         ...prev,
//         [obj.data.id]: (obj.type === 'i-text' || obj.type === 'text')
//           ? obj.text
//           : (obj.data.originalFilePath ? obj.data.originalFilePath : obj.toDataURL())
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

//   const handleFieldInput = async (fieldId, value, type) => {
//     if (!canvas) return;
    
//     const fields = canvas.getObjects().filter(obj => obj.data?.id === fieldId);
//     if (!fields.length) return;
    
//     const field = fields[0];
    
//     if ((type === 'image' || type === 'logo') && value instanceof File) {
//       if (!productImageArea) {
//         alert("Please select a product image first");
//         return;
//       }
//       const originalDataUrl = await new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onload = (e) => resolve(e.target.result);
//         reader.readAsDataURL(value);
//       });
  
//       setFieldInputs(prev => ({
//         ...prev,
//         [fieldId]: {
//           displayData: originalDataUrl, // For preview
//           originalFile: value // Keep original file
//         }
//       }));
  
//       fabric.Image.fromURL(originalDataUrl, (img) => {
//         const scale = Math.min(field.width / img.width, field.height / img.height);
        
//         img.set({
//           left: field.left,
//           top: field.top,
//           scaleX: scale,
//           scaleY: scale,
//           data: {
//             ...field.data,
//             originalFile: value
//           }
//         });
//         img.clipPath = new fabric.Rect({
//           left: productImageArea.x,
//           top: productImageArea.y,
//           width: productImageArea.width,
//           height: productImageArea.height,
//           absolutePositioned: true,
//         });
  
//         canvas.remove(field);
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//       });
//     }
  
//     if (type === 'text' && (field.type === 'i-text' || field.type === 'text')) {
//       field.set('text', value);
//       setFieldInputs(prev => ({ ...prev, [fieldId]: value }));
//       handleObjectModified({ target: field });
//     } else if ((type === 'image' || type === 'logo') && value instanceof File) {
//       if (!productImageArea) {
//         alert("Please select a product image first");
//         return;
//       }
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         fabric.Image.fromURL(e.target.result, (img) => {
//           const scale = Math.min(
//             field.width * field.scaleX / img.width,
//             field.height * field.scaleY / img.height
//           );
  
//           img.set({
//             left: field.left,
//             top: field.top,
//             scaleX: scale,
//             scaleY: scale,
//             data: field.data
//           });
  
//           img.clipPath = new fabric.Rect({
//             left: productImageArea.x,
//             top: productImageArea.y,
//             width: productImageArea.width,
//             height: productImageArea.height,
//             absolutePositioned: true,
//           });
  
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
//     if (!productImageArea) {
//       alert("Please select a product image first");
//       return;
//     }
  
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
//     // Apply clipping so the text is only visible within the product image area
//     text.clipPath = new fabric.Rect({
//       left: productImageArea.x,
//       top: productImageArea.y,
//       width: productImageArea.width,
//       height: productImageArea.height,
//       absolutePositioned: true,
//     });
  
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//     setCustomText('');
//     handleObjectSelected({ target: text });
//     updateCanvasVersion();
//   };
  
//   const handleCustomImage = async (e) => {
//     const file = e.target.files[0];
//     if (!file || !canvas) return;
//     if (!productImageArea) {
//       alert("Please select a product image first");
//       return;
//     }
  
//     // file validation
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
//     if (!validTypes.includes(file.type)) {
//       alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)');
//       return;
//     }
  
//     // size validation (e.g., 50MB limit)
//     const maxSize = 50 * 1024 * 1024; // 50MB in bytes
//     if (file.size > maxSize) {
//       alert('File is too large. Please upload an image smaller than 50MB.');
//       return;
//     }
  
//     try {
//       // Create form data
//       const formData = new FormData();
//       formData.append('image', file);
  
//       // Upload image
//       const response = await axios.post('/api/upload-image', formData, {
//         headers: { 
//           'Content-Type': 'multipart/form-data'
//         }
//       });
  
//       const { filePath } = response.data;
  
//       // Create preview and add to canvas
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         fabric.Image.fromURL(event.target.result, (img) => {
//           img.data = {
//             type: 'custom-image',
//             id: `custom_${Date.now()}`,
//             originalFilePath: filePath,
//           };
  
//           // Apply clipping so the image is only visible within the product image area
//           img.clipPath = new fabric.Rect({
//             left: productImageArea.x,
//             top: productImageArea.y,
//             width: productImageArea.width,
//             height: productImageArea.height,
//             absolutePositioned: true,
//           });
  
//           img.scaleToWidth(200);
//           img.set({
//             left: canvas.width / 2,
//             top: canvas.height / 2,
//             originX: 'center',
//             originY: 'center',
//             cornerSize: 12,
//             cornerColor: '#ffffff',
//             cornerStrokeColor: '#333333',
//             transparentCorners: false,
//             cornerStyle: 'circle'
//           });
//           canvas.add(img);
//           canvas.setActiveObject(img);
//           canvas.renderAll();
//           handleObjectModified({ target: img });
//           updateCanvasVersion();
//         });
//       };
//       reader.readAsDataURL(file);
  
//     } catch (error) {
//       console.error('Image upload failed:', error);
//       alert('Failed to upload image. Please try again.');
//     }
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
  
//     if (!selectedProduct.inStock) {
//       alert('This product is currently out of stock');
//       return;
//     }
  
//     if (quantity < (selectedProduct.minimumOrder || 1)) {
//       alert(`Minimum order quantity is ${selectedProduct.minimumOrder}`);
//       return;
//     }
  
//     try {
  
//       const customElements = canvas.getObjects().filter(obj => obj !== canvas.backgroundImage);
  
//       // Process custom fields from canvas objects
//       const customFields = customElements.map(obj => {
//         if (obj.data?.type === 'image' || obj.data?.type === 'logo') {
//           return {
//             fieldId: obj.data?.id || `custom_${Date.now()}`,
//             type: obj.data.type,
//             imageUrl: obj.data?.originalFilePath || fullImagePath || null, // Store the image URL
//             content: (obj.data && obj.data.originalFilePath)
//               ? obj.data.originalFilePath
//               : obj.toDataURL({ format: 'png', quality: 1, multiplier: 4 }),
//             properties: {
//               fontSize: null,
//               fontFamily: null,
//               fill: null,
//               position: { x: obj.left || 0, y: obj.top || 0 },
//               scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
//             }
//           };
//         }
//         if (obj.type === 'text' || obj.type === 'i-text') {
//           return {
//             fieldId: obj.data?.id || `custom_${Date.now()}`,
//             type: 'text',
//             content: obj.text,
//             properties: {
//               fontSize: obj.fontSize || null,
//               fontFamily: obj.fontFamily || null,
//               fill: obj.fill || null,
//               position: { x: obj.left || 0, y: obj.top || 0 },
//               scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
//             }
//           };
//         }
//         // Default case
//         return {
//           fieldId: obj.data?.id || `custom_${Date.now()}`,
//           type: obj.type,
//           imageUrl: obj.data?.originalFilePath || fullImagePath || null,
//           content: obj.toDataURL('png'),
//           properties: {
//             position: { x: obj.left || 0, y: obj.top || 0 },
//             scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 }
//           }
//         };
//       });
  
//       // Determine the preview image.
//       // If a custom field exists with type "image" and a file path, use that.
//       // Otherwise, fall back to the composite canvas snapshot.
//       const imageField = customFields.find(field =>
//         field.type === 'image' &&
//         typeof field.content === 'string' &&
//         field.content.startsWith('/upload/')
//       );
//       const previewImage = imageField ? imageField.content : canvas.toDataURL('image/png');
  
//       const customization = {
//         template: selectedTemplate?._id || null,
//         preview: previewImage, // Use the real file URL if available
//         description: orderDescription || '',
//         customFields: customFields,
//         requiredFields: Object.entries(fieldInputs).map(([fieldId, value]) => {
//           const fieldDef = requiredFields.find(f => f.id === fieldId);
//           const fieldType = fieldDef?.type || 'text';
//           const isImageField = typeof value === 'object' && value.displayData;
          
//           return {
//             fieldId,
//             type: fieldType,
//             imageUrl: isImageField ? value.displayData : null,
//             value: isImageField ? value.displayData : value
//           };
//         })
//       };
  
//       // Now add the product to the cart using your existing logic.
//       await addToCart({
//         product: selectedProduct,
//         quantity: parseInt(quantity),
//         customization
//       });
  
//       // After successfully adding to cart:
//       setShowCartNotification(true);
//       setTimeout(() => {
//         setShowCartNotification(false);
//         navigate('/cart');
//       }, 3000);
      
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       alert('Failed to add item to cart. Please try again.');
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Canvas and Product Info Column */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <canvas ref={canvasRef} className="border rounded-lg w-full max-w-[500px]" />

//           {showCartNotification && (
//             <div className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-in-out">
//               <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center space-y-4">
//                 <Lottie animationData={cartAnimation} loop={false} className="h-24 w-24" />
//                 <p className="text-xl">Item added to cart successfully!</p>
//               </div>
//             </div>
//           )}

//           {/* Product Images */}
//           {selectedProduct?.images && selectedProduct.images.length > 0 && (
//             <div className="mt-4 grid grid-cols-6 gap-2">
//               {reorderedImages.map((image, index) => (
//                 <div
//                   key={index}
//                   className={`cursor-pointer border-2 rounded p-1 ${
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
//                     className="w-full h-full object-cover rounded"
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Customization Controls */}
//           {selectedObject && (
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
//                   ` $${selectedProduct.pricingTiers[0]['price'].toFixed(2)} And Lower`
//                 ) : (
//                   `$${selectedProduct?.basePrice.toFixed(2)}`
//                 )}
//               {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
//                 <span className="text-sm font-normal text-gray-600 ml-2">
//                   + {[selectedProduct.hasGST && 'GST', selectedProduct.hasPST && 'PST'].filter(Boolean).join(' + ')}
//                 </span>
//               )}
//             </p>
//           </div>

//           <div className="mt-4">
//             {!selectedProduct?.inStock && (
//               <p className="text-red-600 font-medium mt-2">Out of Stock</p>
//             )}
            
//             {selectedProduct?.minimumOrder > 1 && (
//               <p className="text-blue-600 mt-2">
//                 Minimum Order: {selectedProduct.minimumOrder} units
//               </p>
//             )}
            
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
            
//             <p className="text-lg font-semibold mt-2">
//             {quantity === 10000 ? (
//               <div className="text-lg font-semibold mt-2">
//               </div>
//             ) : (
//               <p className="text-lg font-semibold mt-2">
//                 Unit Price: ${currentUnitPrice}
//                 <br />
//                 Total: ${(currentUnitPrice * quantity).toFixed(2)}
//                 {(selectedProduct?.hasGST || selectedProduct?.hasPST) && (
//                   <span className="text-sm font-normal text-gray-600 ml-2">
//                     + {[selectedProduct.hasGST && 'GST', selectedProduct.hasPST && 'PST'].filter(Boolean).join(' + ')}
//                   </span>
//                 )}
//               </p>
//             )}
//             </p>
//           </div>

//           <div className="mt-4 space-y-4">
//             {selectedProduct?.inStock ? (
//               <button
//                 onClick={handleAddToCart}
//                 disabled={
//                   (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
//                   quantity < (selectedProduct?.minimumOrder || 1)
//                 }
//                 className={`w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold
//                   ${(
//                     (selectedTemplate && requiredFields.some(field => !fieldInputs[field.id])) ||
//                     quantity < (selectedProduct?.minimumOrder || 1)
//                   )
//                     ? 'opacity-50 cursor-not-allowed'
//                     : 'hover:bg-green-600 transition-colors duration-200'
//                   }`}
//               >
//                 {quantity === 10000 
//                   ? 'Add to Cart'
//                   : `Add to Cart - $${(currentUnitPrice * quantity).toFixed(2)}`
//                 }
//               </button>
//             ) : (
//               <>
//                 <button className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-semibold cursor-not-allowed">
//                   Out of Stock
//                 </button>
//                 <div className="p-4 border rounded-lg bg-blue-50">
//                   <h4 className="text-xl font-semibold text-blue-800 mb-2">Get Notified</h4>
//                   <p className="text-sm text-blue-700 mb-2">
//                     Enter your email and/or phone number to receive a notification when this product becomes available.
//                   </p>
//                   <div className="space-y-2">
//                     <input
//                       type="email"
//                       placeholder="Your Email"
//                       value={notifyContact.email}
//                       onChange={(e) => setNotifyContact(prev => ({ ...prev, email: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                     />
//                     <input
//                       type="tel"
//                       placeholder="Your Phone Number"
//                       value={notifyContact.phone}
//                       onChange={(e) => setNotifyContact(prev => ({ ...prev, phone: e.target.value }))}
//                       className="w-full px-3 py-2 border rounded"
//                     />
//                     <button
//                       onClick={handleRemindMe}
//                       className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
//                     >
//                       Notify Me When Available
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>

//           {selectedProduct?.hasGST || selectedProduct?.hasPST ? (
//             <p className="text-sm text-gray-500 text-center">
//               *Final price will include applicable taxes ({[
//                 selectedProduct.hasGST && 'GST',
//                 selectedProduct.hasPST && 'PST'
//               ].filter(Boolean).join(' + ')})
//             </p>
//           ) : null}

//         </div>

//         {/* Design and Customization Column */}
//         <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-3">Design The Product</h3>
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

//           <div className="space-y-4">
//             <div>
//               <label className="block font-medium mb-2">Quantity</label>
//               <div className="flex items-center gap-2">
//                 {selectedProduct?.pricingTiers?.length > 0 ? (
//                   <select
//                     value={quantity}
//                     onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={!selectedProduct?.inStock}
//                   >
//                     {getBundleOptions().map(option => (
//                       <option key={option} value={option}>
//                        {option === 10000 ? `+${option}` : option}
//                       </option>
//                     ))}
//                   </select>
//                 ) : (
//                   <input
//                     type="number"
//                     min={selectedProduct?.minimumOrder || 1}
//                     max="10000"
//                     value={quantity}
//                     onChange={(e) => handleQuantityChange(parseInt(e.target.value) || selectedProduct?.minimumOrder || 1)}
//                     className="w-full px-3 py-2 border rounded"
//                     disabled={!selectedProduct?.inStock}
//                   />
//                 )}
//                 {selectedProduct?.pricingTiers?.length > 0 && (
//                   quantity === 10000 ? (
//                     <div style={{minWidth: 250+'px'}}>
//                       <div className="mt-2 p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg shadow-md">
//                         <p className="font-semibold text-lg">We'll Contact You</p>
//                         <p className="text-sm">To provide the best deal for you</p>
//                       </div>
//                     </div>
//                   ) : (
//                     <span className="text-sm text-gray-500">
//                       Current price: ${currentUnitPrice}/unit
//                     </span>
//                   )
//                 )}
//               </div>
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
//         </div>

//         {remindPopup.show && (
//           <div className="fixed inset-0 flex items-center justify-center z-50">
//             <div className="bg-white border rounded-lg shadow-lg p-6">
//               <p className="text-lg text-gray-800">{remindPopup.message}</p>
//               <button
//                 onClick={() => setRemindPopup({ show: false, message: "" })}
//                 className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}


//       </div>
//     </div>
//   );
// };

// export default ProductCustomization;