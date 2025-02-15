// src/components/TemplateDesign.js
import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
  const [canvas, setCanvas] = useState(null);
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [category, setCategory] = useState(initialTemplate?.category?._id || initialTemplate?.category || '');
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [selectedFontSize, setSelectedFontSize] = useState('20');
  const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
  const [textContent, setTextContent] = useState('');
  const [requiredFields, setRequiredFields] = useState([]);
  const [lastId, setLastId] = useState(1);

  const fontFamilies = [
    'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
    'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
  ];

  const handleImageUpload = (e) => {
    if (!canvas) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.scaleToWidth(200);
        img.set({
          left: 100,
          top: 100,
          data: { type: 'image' }
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const updateSelectedObject = () => {
    const obj = canvas.getActiveObject();
    if (!obj) return;

    if (obj.type === 'i-text' || obj.type === 'text') {
      obj.set({
        fill: selectedColor,
        fontSize: parseInt(selectedFontSize),
        fontFamily: selectedFontFamily
      });
      if (textContent !== obj.text) {
        obj.set('text', textContent);
        // Update required fields if this is a text field
        if (obj.data?.id) {
          setRequiredFields(prev =>
            prev.map(field =>
              field.id === obj.data.id ? { ...field, placeholder: textContent } : field
            )
          );
        }
      }
    } else {
      // For shapes and other objects
      obj.set({
        stroke: selectedColor,
        fill: fillColor
      });
    }
    canvas.renderAll();
  };

  const generateUniqueId = () => {
    setLastId(prev => prev + 1);
    return `field_${lastId}`;
  };

  const loadTemplate = (template) => {
    if (!canvas) return;

    setTemplateName(template.name);
    setCategory(template.category._id || template.category);

    canvas.clear();
    let elementsData = template.elements;

    if (typeof elementsData === 'string') {
      try {
        elementsData = JSON.parse(elementsData);
      } catch (error) {
        console.error('Error parsing template elements:', error);
        return;
      }
    }

    if (elementsData && elementsData.objects) {
      let loadedFields = [];
      elementsData.objects.forEach(obj => {
        fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
          const enlivenedObject = enlivenedObjects[0];
          if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
            const fieldId = enlivenedObject.data.id || generateUniqueId();
            enlivenedObject.set({
              hasControls: true,
              lockUniScaling: false,
              lockRotation: false,
              selectable: true,
              data: { ...enlivenedObject.data, id: fieldId }
            });
            loadedFields.push({
              id: fieldId,
              type: enlivenedObject.data.type || 'text',
              placeholder: enlivenedObject.data.placeholder || ''
            });
          }
          canvas.add(enlivenedObject);
          canvas.renderAll();
        });
      });
      setRequiredFields(loadedFields);
    }
  };

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent'
    });
    fabricCanvas.selection = true;
    fabricCanvas.on('object:selected', handleObjectSelected);
    fabricCanvas.on('selection:cleared', handleSelectionCleared);
    setCanvas(fabricCanvas);
    return () => fabricCanvas.dispose();
  }, []);

  // Set the background image based on the selected category
  useEffect(() => {
    if (canvas && categories && category) {
      const selectedCategory = categories.find((cat) => cat._id === category);
      if (selectedCategory && selectedCategory.name === 'Paper Bags') {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        canvas.setBackgroundImage(
          '/images/Temp-bags-with-handles.png',
          canvas.renderAll.bind(canvas),
          {
            originX: 'center',
            originY: 'center',
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            scaleX: 2.5 / 3,
            scaleY: 2.5 / 3,
            opacity: 0.9,
          }
        );
      } else {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
      }
    }
  }, [category, canvas, categories]);

  useEffect(() => {
    if (canvas && initialTemplate) {
      loadTemplate(initialTemplate);
    }
  }, [canvas, initialTemplate]);

  const handleObjectSelected = (e) => {
    const obj = e.target;
    if (obj) {
      setSelectedColor(obj.stroke || '#000000');
      setFillColor(obj.fill || 'transparent');
      setSelectedFontSize(obj.fontSize?.toString() || '20');
      setSelectedFontFamily(obj.fontFamily || 'Arial');
      if (obj.text) setTextContent(obj.text);
    }
  };

  const handleSelectionCleared = () => {
    setSelectedColor('#000000');
    setFillColor('transparent');
    setSelectedFontSize('20');
    setSelectedFontFamily('Arial');
    setTextContent('');
  };

  const addText = () => {
    if (!canvas) return;
    const fieldId = generateUniqueId();
    const text = new fabric.IText(textContent || 'Edit Text', {
      left: 100,
      top: 100,
      fontSize: parseInt(selectedFontSize),
      fontFamily: selectedFontFamily,
      fill: selectedColor,
      data: {
        type: 'text',
        required: true,
        id: fieldId,
        placeholder: textContent || 'Edit Text'
      }
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    setRequiredFields(prev => [
      ...prev,
      {
        id: fieldId,
        type: 'text',
        placeholder: textContent || 'Edit Text'
      }
    ]);
  };

  const addShape = (type) => {
    if (!canvas) return;
    let shape;
    const shapeProps = {
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: selectedColor,
      strokeWidth: 2
    };
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          ...shapeProps,
          width: 100,
          height: 100
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...shapeProps,
          radius: 50
        });
        break;
      default:
        return;
    }
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addPlaceholder = (type) => {
    if (!canvas) return;
    const fieldId = generateUniqueId();
    const placeholder = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 150,
      fill: 'rgba(200,200,200,0.5)',
      stroke: '#666',
      strokeDashArray: [5, 5],
      data: {
        type,
        isPlaceholder: true,
        required: true,
        id: fieldId
      }
    });
    const label = new fabric.Text(type.toUpperCase(), {
      fontSize: 14,
      originX: 'center',
      originY: 'center',
      selectable: false
    });
    label.set({
      left: placeholder.left + placeholder.width / 2,
      top: placeholder.top + placeholder.height / 2
    });
    const group = new fabric.Group([placeholder, label], {
      left: 100,
      top: 100,
      data: {
        type,
        isPlaceholder: true,
        required: true,
        id: fieldId
      }
    });
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();

    setRequiredFields(prev => [
      ...prev,
      {
        id: fieldId,
        type,
        placeholder: type.toUpperCase()
      }
    ]);
  };

  const handleDelete = () => {
    const obj = canvas.getActiveObject();
    if (obj) {
      if (obj.data?.id) {
        setRequiredFields(prev => prev.filter(field => field.id !== obj.data.id));
      }
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const handleSave = () => {
    if (!canvas) {
      alert("Canvas is not ready!");
      return;
    }
    if (!templateName.trim() || !category.trim()) {
      alert("Template Name and Category are required!");
      return;
    }
    // Temporarily remove the background image before generating the preview
    const prevBg = canvas.backgroundImage;
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));

    const templateData = {
      name: templateName,
      category: category,
      elements: {
        version: canvas.version,
        objects: canvas.getObjects().map(obj => ({
          ...obj.toObject(['data']),
          data: obj.data
        }))
      },
      preview: canvas.toDataURL({
        format: 'png',
        backgroundColor: null
      }),
      requiredFields
    };

    // Restore the background image (for the design UI) if needed.
    canvas.setBackgroundImage(prevBg, canvas.renderAll.bind(canvas));

    console.log('Saving template with data:', templateData);
    onSave(templateData);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Sidebar: Controls */}
          <div className="w-full md:w-1/3 border-r border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6">Controls</h2>
            {/* Add Elements */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Add Elements</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={addText} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Add Text
                </button>
                <button onClick={() => addShape('rect')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Rectangle
                </button>
                <button onClick={() => addShape('circle')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Circle
                </button>
                <button onClick={() => addPlaceholder('image')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Image Placeholder
                </button>
                <button onClick={() => addPlaceholder('logo')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Logo Placeholder
                </button>
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="px-3 py-2 border rounded"
                />
                <button onClick={handleDelete} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 col-span-2">
                  Delete Selected
                </button>
              </div>
            </div>
            {/* Properties */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Properties</h3>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium">Stroke Color</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    updateSelectedObject();
                  }}
                  className="w-full h-10 p-0 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium">Fill Color</label>
                <input
                  type="color"
                  value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    updateSelectedObject();
                  }}
                  className="w-full h-10 p-0 border rounded"
                />
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={fillColor === 'transparent'}
                    onChange={(e) => {
                      setFillColor(e.target.checked ? 'transparent' : '#ffffff');
                      updateSelectedObject();
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-600 text-sm">Transparent</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium">Font Size</label>
                <select
                  value={selectedFontSize}
                  onChange={(e) => {
                    setSelectedFontSize(e.target.value);
                    updateSelectedObject();
                  }}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium">Font Family</label>
                <select
                  value={selectedFontFamily}
                  onChange={(e) => {
                    setSelectedFontFamily(e.target.value);
                    updateSelectedObject();
                  }}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium">Text Content</label>
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    updateSelectedObject();
                  }}
                  placeholder="Enter text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Right Side: Canvas & Header/Requirements */}
          <div className="w-full md:w-2/3 flex flex-col">
            {/* Header with Template Name & Category */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-1">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template Name"
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Canvas Area */}
            <div className="p-6 flex items-center justify-center bg-gray-50">
              <div className="border border-gray-300 rounded shadow-lg">
                <canvas ref={canvasRef} className="block" />
              </div>
            </div>
            {/* Requirements & Save Button */}
            <div className="p-6 border-t border-gray-200">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-3">Required Fields ({requiredFields.length})</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {requiredFields.map((field, index) => (
                    <li key={field.id}>
                      {index + 1}. {field.type} {field.placeholder ? `- "${field.placeholder}"` : ''}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={handleSave} className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                Save Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDesigner;







//working with simple ui
// // // src/components/TemplateDesign.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';

// const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category?._id || initialTemplate?.category || '');
//   const canvasRef = useRef(null);
//   const [selectedColor, setSelectedColor] = useState('#000000');
//   const [fillColor, setFillColor] = useState('transparent');
//   const [selectedFontSize, setSelectedFontSize] = useState('20');
//   const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
//   const [textContent, setTextContent] = useState('');
//   const [requiredFields, setRequiredFields] = useState([]);
//   const [lastId, setLastId] = useState(1);

//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

//   const handleImageUpload = (e) => {
//     if (!canvas) return;
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {
//         img.scaleToWidth(200);
//         img.set({
//           left: 100,
//           top: 100,
//           data: { type: 'image' }
//         });
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//       });
//     };
//     reader.readAsDataURL(file);
//   };

//   const updateSelectedObject = () => {
//     const obj = canvas.getActiveObject();
//     if (!obj) return;

//     if (obj.type === 'i-text' || obj.type === 'text') {
//       obj.set({
//         fill: selectedColor,
//         fontSize: parseInt(selectedFontSize),
//         fontFamily: selectedFontFamily
//       });
//       if (textContent !== obj.text) {
//         obj.set('text', textContent);
        
//         // Update required fields if this is a text field
//         if (obj.data?.id) {
//           setRequiredFields(prev => prev.map(field => 
//             field.id === obj.data.id 
//               ? { ...field, placeholder: textContent }
//               : field
//           ));
//         }
//       }
//     } else {
//       // For shapes and other objects
//       obj.set({
//         stroke: selectedColor,
//         fill: fillColor
//       });
//     }
    
//     canvas.renderAll();
//   };
  
//   const generateUniqueId = () => {
//     setLastId(prev => prev + 1);
//     return `field_${lastId}`;
//   };

//   const loadTemplate = (template) => {
//     if (!canvas) return;
    
//     setTemplateName(template.name);
//     setCategory(template.category._id || template.category);
    
//     canvas.clear();
//     let elementsData = template.elements;
    
//     if (typeof elementsData === 'string') {
//       try {
//         elementsData = JSON.parse(elementsData);
//       } catch (error) {
//         console.error('Error parsing template elements:', error);
//         return;
//       }
//     }

//     if (elementsData && elementsData.objects) {
//       let loadedFields = [];
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
          
//           if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
//             const fieldId = enlivenedObject.data.id || generateUniqueId();
//             enlivenedObject.set({
//               hasControls: true,
//               lockUniScaling: false,
//               lockRotation: false,
//               selectable: true,
//               data: { ...enlivenedObject.data, id: fieldId }
//             });
            
//             loadedFields.push({
//               id: fieldId,
//               type: enlivenedObject.data.type || 'text',
//               placeholder: enlivenedObject.data.placeholder || ''
//             });
//           }
          
//           canvas.add(enlivenedObject);
//           canvas.renderAll();
//         });
//       });
//       setRequiredFields(loadedFields);
//     }
//   };

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: 'transparent'
//     });
    
//     fabricCanvas.selection = true;
//     fabricCanvas.on('object:selected', handleObjectSelected);
//     fabricCanvas.on('selection:cleared', handleSelectionCleared);
    
//     setCanvas(fabricCanvas);
//     return () => fabricCanvas.dispose();
//   }, []);


// // Use an effect to conditionally set the background image when category changes
// useEffect(() => {
//   if (canvas && categories && category) {
//     // Find the selected category object from the categories list
//     const selectedCategory = categories.find((cat) => cat._id === category);

//     // Check if the category name exist)
//     if (selectedCategory && selectedCategory.name === 'Paper Bags') {
//       console.log(selectedCategory);
//       const canvasWidth = canvas.getWidth();
//       const canvasHeight = canvas.getHeight();
//       canvas.setBackgroundImage(
//         '/images/Temp-bags-with-handles.png',
//         canvas.renderAll.bind(canvas),
//         {
//           originX: 'center',
//           originY: 'center',
//           left: canvasWidth / 2,
//           top: canvasHeight / 2,
//           scaleX: 2.5 / 3, // Scale the image width to 2/3 of its original size
//           scaleY: 2.5 / 3, // Scale the image height to 2/3 of its original size
//           // adjust opacity or other properties if desired:
//           opacity: 0.9,
//         }
//       );
//     } else {
//       canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
//     }
//   }
// }, [category, canvas, categories]);


//   useEffect(() => {
//     if (canvas && initialTemplate) {
//       loadTemplate(initialTemplate);
//     }
//   }, [canvas, initialTemplate]);

//   const handleObjectSelected = (e) => {
//     const obj = e.target;
//     if (obj) {
//       setSelectedColor(obj.stroke || '#000000');
//       setFillColor(obj.fill || 'transparent');
//       setSelectedFontSize(obj.fontSize?.toString() || '20');
//       setSelectedFontFamily(obj.fontFamily || 'Arial');
//       if (obj.text) setTextContent(obj.text);
//     }
//   };

//   const handleSelectionCleared = () => {
//     setSelectedColor('#000000');
//     setFillColor('transparent');
//     setSelectedFontSize('20');
//     setSelectedFontFamily('Arial');
//     setTextContent('');
//   };

//   const addText = () => {
//     if (!canvas) return;
//     const fieldId = generateUniqueId();
//     const text = new fabric.IText(textContent || 'Edit Text', {
//       left: 100,
//       top: 100,
//       fontSize: parseInt(selectedFontSize),
//       fontFamily: selectedFontFamily,
//       fill: selectedColor,
//       data: { 
//         type: 'text',
//         required: true,
//         id: fieldId,
//         placeholder: textContent || 'Edit Text'
//       }
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();

//     setRequiredFields(prev => [
//       ...prev,
//       {
//         id: fieldId,
//         type: 'text',
//         placeholder: textContent || 'Edit Text'
//       }
//     ]);
//   };

//   const addShape = (type) => {
//     if (!canvas) return;
//     let shape;

//     const shapeProps = {
//       left: 100,
//       top: 100,
//       fill: fillColor,
//       stroke: selectedColor,
//       strokeWidth: 2
//     };

//     switch(type) {
//       case 'rect':
//         shape = new fabric.Rect({
//           ...shapeProps,
//           width: 100,
//           height: 100
//         });
//         break;
//       case 'circle':
//         shape = new fabric.Circle({
//           ...shapeProps,
//           radius: 50
//         });
//         break;
//       default:
//         return;
//     }

//     canvas.add(shape);
//     canvas.setActiveObject(shape);
//     canvas.renderAll();
//   };

//   const addPlaceholder = (type) => {
//     if (!canvas) return;
//     const fieldId = generateUniqueId();
    
//     const placeholder = new fabric.Rect({
//       left: 100,
//       top: 100,
//       width: 150,
//       height: 150,
//       fill: 'rgba(200,200,200,0.5)',
//       stroke: '#666',
//       strokeDashArray: [5, 5],
//       data: { 
//         type,
//         isPlaceholder: true,
//         required: true,
//         id: fieldId
//       }
//     });
    
//     const label = new fabric.Text(type.toUpperCase(), {
//       fontSize: 14,
//       originX: 'center',
//       originY: 'center',
//       selectable: false
//     });

//     label.set({
//       left: placeholder.left + placeholder.width/2,
//       top: placeholder.top + placeholder.height/2
//     });

//     const group = new fabric.Group([placeholder, label], {
//       left: 100,
//       top: 100,
//       data: { 
//         type,
//         isPlaceholder: true,
//         required: true,
//         id: fieldId
//       }
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//     canvas.renderAll();

//     setRequiredFields(prev => [
//       ...prev,
//       {
//         id: fieldId,
//         type,
//         placeholder: type.toUpperCase()
//       }
//     ]);
//   };

//   const handleDelete = () => {
//     const obj = canvas.getActiveObject();
//     if (obj) {
//       if (obj.data?.id) {
//         setRequiredFields(prev => prev.filter(field => field.id !== obj.data.id));
//       }
//       canvas.remove(obj);
//       canvas.discardActiveObject();
//       canvas.renderAll();
//     }
//   };

//   const handleSave = () => {
//     if (!canvas || !templateName || !category) return;
    
//       // Temporarily remove the background image before generating the preview
//       const prevBg = canvas.backgroundImage;
//       canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
  
//     const templateData = {
//       name: templateName,
//       category: category,
//       elements: {
//         version: canvas.version,
//         objects: canvas.getObjects().map(obj => ({
//           ...obj.toObject(['data']),
//           data: obj.data
//         }))
//       },
//       preview: canvas.toDataURL({
//         format: 'png',
//         backgroundColor: null
//       }),
//       requiredFields
//     };
    
//        // Restore the background image in the canvas (for the design UI) if needed.
//        canvas.setBackgroundImage(prevBg, canvas.renderAll.bind(canvas));

//     console.log('Saving template with data:', templateData);
//     onSave(templateData);
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       {/* Template Name and Category Selection */}
//       <div className="mb-6 space-y-4">
//          <input
//           type="text"
//           value={templateName}
//           onChange={(e) => setTemplateName(e.target.value)}
//           placeholder="Template Name"
//           className="w-full px-4 py-2 border rounded"
//         />

//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value)}
//           className="w-full px-4 py-2 border rounded"
//         >
//           <option value="">Select Category</option>
//           {categories.map(cat => (
//             <option key={cat._id} value={cat._id}>
//               {cat.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="mb-6 grid grid-cols-2 gap-4">
//         <div className="col-span-2 flex flex-wrap gap-2">
//           <button onClick={() => addText()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Text Field
//           </button>
//           <button onClick={() => addShape('rect')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Rectangle
//           </button>
//           <button onClick={() => addShape('circle')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Circle
//           </button>
//           <button onClick={() => addPlaceholder('image')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Image Placeholder
//           </button>
//           <button onClick={() => addPlaceholder('logo')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Logo Placeholder
//           </button>
//           <input
//             type="file"
//             onChange={handleImageUpload}
//             accept="image/*"
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           />
//           <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//             Delete Selected
//           </button>
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium">Stroke Color</label>
//             <input
//               type="color"
//               value={selectedColor}
//               onChange={(e) => {
//                 setSelectedColor(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Fill Color</label>
//             <input
//               type="color"
//               value={fillColor === 'transparent' ? '#ffffff' : fillColor}
//               onChange={(e) => {
//                 setFillColor(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full"
//             />
//             <label className="flex items-center mt-1">
//               <input
//                 type="checkbox"
//                 checked={fillColor === 'transparent'}
//                 onChange={(e) => {
//                   setFillColor(e.target.checked ? 'transparent' : '#ffffff');
//                   updateSelectedObject();
//                 }}
//                 className="mr-2"
//               />
//               Transparent
//             </label>
//           </div>
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium">Font Size</label>
//             <select
//               value={selectedFontSize}
//               onChange={(e) => {
//                 setSelectedFontSize(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//             >
//               {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
//                 <option key={size} value={size}>{size}px</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Font Family</label>
//             <select
//               value={selectedFontFamily}
//               onChange={(e) => {
//                 setSelectedFontFamily(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//             >
//               {fontFamilies.map(font => (
//                 <option key={font} value={font}>{font}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Text Content</label>
//             <input
//               type="text"
//               value={textContent}
//               onChange={(e) => {
//                 setTextContent(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//               placeholder="Enter text"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="mb-6 border rounded p-4">
//         <canvas ref={canvasRef} className="border"/>
//       </div>

//       <div className="mb-4">
//         <h3 className="font-medium mb-2">Required Fields ({requiredFields.length})</h3>
//         <ul className="space-y-1 text-sm">
//           {requiredFields.map((field, index) => (
//             <li key={field.id} className="text-gray-600">
//               {index + 1}. {field.type} {field.placeholder ? `- "${field.placeholder}"` : ''}
//             </li>
//           ))}
//         </ul>
//       </div>

//       <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;









// // // src/components/TemplateDesign.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';

// const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category?._id || initialTemplate?.category || '');
//   const canvasRef = useRef(null);
//   const [selectedColor, setSelectedColor] = useState('#000000');
//   const [fillColor, setFillColor] = useState('transparent');
//   const [selectedFontSize, setSelectedFontSize] = useState('20');
//   const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
//   const [textContent, setTextContent] = useState('');
//   const [requiredFields, setRequiredFields] = useState([]);
//   const [lastId, setLastId] = useState(1);

//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

//   const handleImageUpload = (e) => {
//     if (!canvas) return;
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {
//         img.scaleToWidth(200);
//         img.set({
//           left: 100,
//           top: 100,
//           data: { type: 'image' }
//         });
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//       });
//     };
//     reader.readAsDataURL(file);
//   };

//   const updateSelectedObject = () => {
//     const obj = canvas.getActiveObject();
//     if (!obj) return;

//     if (obj.type === 'i-text' || obj.type === 'text') {
//       obj.set({
//         fill: selectedColor,
//         fontSize: parseInt(selectedFontSize),
//         fontFamily: selectedFontFamily
//       });
//       if (textContent !== obj.text) {
//         obj.set('text', textContent);
        
//         // Update required fields if this is a text field
//         if (obj.data?.id) {
//           setRequiredFields(prev => prev.map(field => 
//             field.id === obj.data.id 
//               ? { ...field, placeholder: textContent }
//               : field
//           ));
//         }
//       }
//     } else {
//       // For shapes and other objects
//       obj.set({
//         stroke: selectedColor,
//         fill: fillColor
//       });
//     }
    
//     canvas.renderAll();
//   };
  
//   const generateUniqueId = () => {
//     setLastId(prev => prev + 1);
//     return `field_${lastId}`;
//   };

//   const loadTemplate = (template) => {
//     if (!canvas) return;
    
//     setTemplateName(template.name);
//     setCategory(template.category._id || template.category);
    
//     canvas.clear();
//     let elementsData = template.elements;
    
//     if (typeof elementsData === 'string') {
//       try {
//         elementsData = JSON.parse(elementsData);
//       } catch (error) {
//         console.error('Error parsing template elements:', error);
//         return;
//       }
//     }

//     if (elementsData && elementsData.objects) {
//       let loadedFields = [];
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
          
//           if (enlivenedObject.data?.isPlaceholder || enlivenedObject.data?.required) {
//             const fieldId = enlivenedObject.data.id || generateUniqueId();
//             enlivenedObject.set({
//               hasControls: true,
//               lockUniScaling: false,
//               lockRotation: false,
//               selectable: true,
//               data: { ...enlivenedObject.data, id: fieldId }
//             });
            
//             loadedFields.push({
//               id: fieldId,
//               type: enlivenedObject.data.type || 'text',
//               placeholder: enlivenedObject.data.placeholder || ''
//             });
//           }
          
//           canvas.add(enlivenedObject);
//           canvas.renderAll();
//         });
//       });
//       setRequiredFields(loadedFields);
//     }
//   };

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: 'transparent'
//     });
    
//     fabricCanvas.selection = true;
//     fabricCanvas.on('object:selected', handleObjectSelected);
//     fabricCanvas.on('selection:cleared', handleSelectionCleared);
    
//     setCanvas(fabricCanvas);
//     return () => fabricCanvas.dispose();
//   }, []);


// // Use an effect to conditionally set the background image when category changes
// useEffect(() => {
//   if (canvas && categories && category) {
//     // Find the selected category object from the categories list
//     const selectedCategory = categories.find((cat) => cat._id === category);

//     // Check if the category name exist)
//     if (selectedCategory && selectedCategory.name === 'Paper Bags') {
//       console.log(selectedCategory);
//       const canvasWidth = canvas.getWidth();
//       const canvasHeight = canvas.getHeight();
//       canvas.setBackgroundImage(
//         '/images/Temp-bags-with-handles.png',
//         canvas.renderAll.bind(canvas),
//         {
//           originX: 'center',
//           originY: 'center',
//           left: canvasWidth / 2,
//           top: canvasHeight / 2,
//           scaleX: 2.5 / 3, // Scale the image width to 2/3 of its original size
//           scaleY: 2.5 / 3, // Scale the image height to 2/3 of its original size
//           // adjust opacity or other properties if desired:
//           opacity: 0.9,
//         }
//       );
//     } else {
//       canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
//     }
//   }
// }, [category, canvas, categories]);


//   useEffect(() => {
//     if (canvas && initialTemplate) {
//       loadTemplate(initialTemplate);
//     }
//   }, [canvas, initialTemplate]);

//   const handleObjectSelected = (e) => {
//     const obj = e.target;
//     if (obj) {
//       setSelectedColor(obj.stroke || '#000000');
//       setFillColor(obj.fill || 'transparent');
//       setSelectedFontSize(obj.fontSize?.toString() || '20');
//       setSelectedFontFamily(obj.fontFamily || 'Arial');
//       if (obj.text) setTextContent(obj.text);
//     }
//   };

//   const handleSelectionCleared = () => {
//     setSelectedColor('#000000');
//     setFillColor('transparent');
//     setSelectedFontSize('20');
//     setSelectedFontFamily('Arial');
//     setTextContent('');
//   };

//   const addText = () => {
//     if (!canvas) return;
//     const fieldId = generateUniqueId();
//     const text = new fabric.IText(textContent || 'Edit Text', {
//       left: 100,
//       top: 100,
//       fontSize: parseInt(selectedFontSize),
//       fontFamily: selectedFontFamily,
//       fill: selectedColor,
//       data: { 
//         type: 'text',
//         required: true,
//         id: fieldId,
//         placeholder: textContent || 'Edit Text'
//       }
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();

//     setRequiredFields(prev => [
//       ...prev,
//       {
//         id: fieldId,
//         type: 'text',
//         placeholder: textContent || 'Edit Text'
//       }
//     ]);
//   };

//   const addShape = (type) => {
//     if (!canvas) return;
//     let shape;

//     const shapeProps = {
//       left: 100,
//       top: 100,
//       fill: fillColor,
//       stroke: selectedColor,
//       strokeWidth: 2
//     };

//     switch(type) {
//       case 'rect':
//         shape = new fabric.Rect({
//           ...shapeProps,
//           width: 100,
//           height: 100
//         });
//         break;
//       case 'circle':
//         shape = new fabric.Circle({
//           ...shapeProps,
//           radius: 50
//         });
//         break;
//       default:
//         return;
//     }

//     canvas.add(shape);
//     canvas.setActiveObject(shape);
//     canvas.renderAll();
//   };

//   const addPlaceholder = (type) => {
//     if (!canvas) return;
//     const fieldId = generateUniqueId();
    
//     const placeholder = new fabric.Rect({
//       left: 100,
//       top: 100,
//       width: 150,
//       height: 150,
//       fill: 'rgba(200,200,200,0.5)',
//       stroke: '#666',
//       strokeDashArray: [5, 5],
//       data: { 
//         type,
//         isPlaceholder: true,
//         required: true,
//         id: fieldId
//       }
//     });
    
//     const label = new fabric.Text(type.toUpperCase(), {
//       fontSize: 14,
//       originX: 'center',
//       originY: 'center',
//       selectable: false
//     });

//     label.set({
//       left: placeholder.left + placeholder.width/2,
//       top: placeholder.top + placeholder.height/2
//     });

//     const group = new fabric.Group([placeholder, label], {
//       left: 100,
//       top: 100,
//       data: { 
//         type,
//         isPlaceholder: true,
//         required: true,
//         id: fieldId
//       }
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//     canvas.renderAll();

//     setRequiredFields(prev => [
//       ...prev,
//       {
//         id: fieldId,
//         type,
//         placeholder: type.toUpperCase()
//       }
//     ]);
//   };

//   const handleDelete = () => {
//     const obj = canvas.getActiveObject();
//     if (obj) {
//       if (obj.data?.id) {
//         setRequiredFields(prev => prev.filter(field => field.id !== obj.data.id));
//       }
//       canvas.remove(obj);
//       canvas.discardActiveObject();
//       canvas.renderAll();
//     }
//   };

//   const handleSave = () => {
//     if (!canvas || !templateName || !category) return;
    
//       // Temporarily remove the background image before generating the preview
//       const prevBg = canvas.backgroundImage;
//       canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
  
//     const templateData = {
//       name: templateName,
//       category: category,
//       elements: {
//         version: canvas.version,
//         objects: canvas.getObjects().map(obj => ({
//           ...obj.toObject(['data']),
//           data: obj.data
//         }))
//       },
//       preview: canvas.toDataURL({
//         format: 'png',
//         backgroundColor: null
//       }),
//       requiredFields
//     };
    
//        // Restore the background image in the canvas (for the design UI) if needed.
//        canvas.setBackgroundImage(prevBg, canvas.renderAll.bind(canvas));

//     console.log('Saving template with data:', templateData);
//     onSave(templateData);
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       {/* Template Name and Category Selection */}
//       <div className="mb-6 space-y-4">
//          <input
//           type="text"
//           value={templateName}
//           onChange={(e) => setTemplateName(e.target.value)}
//           placeholder="Template Name"
//           className="w-full px-4 py-2 border rounded"
//         />

//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value)}
//           className="w-full px-4 py-2 border rounded"
//         >
//           <option value="">Select Category</option>
//           {categories.map(cat => (
//             <option key={cat._id} value={cat._id}>
//               {cat.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="mb-6 grid grid-cols-2 gap-4">
//         <div className="col-span-2 flex flex-wrap gap-2">
//           <button onClick={() => addText()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Text Field
//           </button>
//           <button onClick={() => addShape('rect')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Rectangle
//           </button>
//           <button onClick={() => addShape('circle')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Circle
//           </button>
//           <button onClick={() => addPlaceholder('image')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Image Placeholder
//           </button>
//           <button onClick={() => addPlaceholder('logo')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Logo Placeholder
//           </button>
//           <input
//             type="file"
//             onChange={handleImageUpload}
//             accept="image/*"
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           />
//           <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//             Delete Selected
//           </button>
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium">Stroke Color</label>
//             <input
//               type="color"
//               value={selectedColor}
//               onChange={(e) => {
//                 setSelectedColor(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Fill Color</label>
//             <input
//               type="color"
//               value={fillColor === 'transparent' ? '#ffffff' : fillColor}
//               onChange={(e) => {
//                 setFillColor(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full"
//             />
//             <label className="flex items-center mt-1">
//               <input
//                 type="checkbox"
//                 checked={fillColor === 'transparent'}
//                 onChange={(e) => {
//                   setFillColor(e.target.checked ? 'transparent' : '#ffffff');
//                   updateSelectedObject();
//                 }}
//                 className="mr-2"
//               />
//               Transparent
//             </label>
//           </div>
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium">Font Size</label>
//             <select
//               value={selectedFontSize}
//               onChange={(e) => {
//                 setSelectedFontSize(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//             >
//               {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
//                 <option key={size} value={size}>{size}px</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Font Family</label>
//             <select
//               value={selectedFontFamily}
//               onChange={(e) => {
//                 setSelectedFontFamily(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//             >
//               {fontFamilies.map(font => (
//                 <option key={font} value={font}>{font}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Text Content</label>
//             <input
//               type="text"
//               value={textContent}
//               onChange={(e) => {
//                 setTextContent(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-full px-2 py-1 border rounded"
//               placeholder="Enter text"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="mb-6 border rounded p-4">
//         <canvas ref={canvasRef} className="border"/>
//       </div>

//       <div className="mb-4">
//         <h3 className="font-medium mb-2">Required Fields ({requiredFields.length})</h3>
//         <ul className="space-y-1 text-sm">
//           {requiredFields.map((field, index) => (
//             <li key={field.id} className="text-gray-600">
//               {index + 1}. {field.type} {field.placeholder ? `- "${field.placeholder}"` : ''}
//             </li>
//           ))}
//         </ul>
//       </div>

//       <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;
