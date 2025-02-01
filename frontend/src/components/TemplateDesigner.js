// // src/components/TemplateDesign.js
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
          setRequiredFields(prev => prev.map(field => 
            field.id === obj.data.id 
              ? { ...field, placeholder: textContent }
              : field
          ));
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

    switch(type) {
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
      left: placeholder.left + placeholder.width/2,
      top: placeholder.top + placeholder.height/2
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
    if (!canvas || !templateName || !category) return;
    
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
    
    console.log('Saving template with data:', templateData);
    onSave(templateData);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">

      <div className="mb-6 space-y-4">
         <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template Name"
          className="w-full px-4 py-2 border rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-wrap gap-2">
          <button onClick={() => addText()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Text Field
          </button>
          <button onClick={() => addShape('rect')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Rectangle
          </button>
          <button onClick={() => addShape('circle')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Circle
          </button>
          <button onClick={() => addPlaceholder('image')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Image Placeholder
          </button>
          <button onClick={() => addPlaceholder('logo')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Logo Placeholder
          </button>
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          />
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Delete Selected
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Stroke Color</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => {
                setSelectedColor(e.target.value);
                updateSelectedObject();
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Fill Color</label>
            <input
              type="color"
              value={fillColor === 'transparent' ? '#ffffff' : fillColor}
              onChange={(e) => {
                setFillColor(e.target.value);
                updateSelectedObject();
              }}
              className="w-full"
            />
            <label className="flex items-center mt-1">
              <input
                type="checkbox"
                checked={fillColor === 'transparent'}
                onChange={(e) => {
                  setFillColor(e.target.checked ? 'transparent' : '#ffffff');
                  updateSelectedObject();
                }}
                className="mr-2"
              />
              Transparent
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Font Size</label>
            <select
              value={selectedFontSize}
              onChange={(e) => {
                setSelectedFontSize(e.target.value);
                updateSelectedObject();
              }}
              className="w-full px-2 py-1 border rounded"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Font Family</label>
            <select
              value={selectedFontFamily}
              onChange={(e) => {
                setSelectedFontFamily(e.target.value);
                updateSelectedObject();
              }}
              className="w-full px-2 py-1 border rounded"
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Text Content</label>
            <input
              type="text"
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                updateSelectedObject();
              }}
              className="w-full px-2 py-1 border rounded"
              placeholder="Enter text"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 border rounded p-4">
        <canvas ref={canvasRef} className="border"/>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Required Fields ({requiredFields.length})</h3>
        <ul className="space-y-1 text-sm">
          {requiredFields.map((field, index) => (
            <li key={field.id} className="text-gray-600">
              {index + 1}. {field.type} {field.placeholder ? `- "${field.placeholder}"` : ''}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Save Template
      </button>
    </div>
  );
};

export default TemplateDesigner;












//working but has required filed wrong counting
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

//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

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
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
          
//           // Preserve placeholder properties
//           if (enlivenedObject.data?.isPlaceholder) {
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
//           top: 100
//         });
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//         updateRequiredFields();
//       });
//     };
//     reader.readAsDataURL(file);
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
//     updateRequiredFields();
//   };

//   const addText = () => {
//     if (!canvas) return;
//     const text = new fabric.IText(textContent || 'Edit Text', {
//       left: 100,
//       top: 100,
//       fontSize: parseInt(selectedFontSize),
//       fontFamily: selectedFontFamily,
//       fill: selectedColor,
//       required: true,
//       placeholder: 'Enter text here',
//       data: { fieldType: 'text', required: true }
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//     updateRequiredFields();
//   };

//   const addPlaceholder = (type) => {
//     if (!canvas) return;
    
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
//         fieldType: type
//       }
//     });
    
//     const label = new fabric.Text(type.toUpperCase(), {
//       left: placeholder.left + placeholder.width/2,
//       top: placeholder.top + placeholder.height/2,
//       fontSize: 14,
//       originX: 'center',
//       originY: 'center',
//       selectable: false
//     });

//     const group = new fabric.Group([placeholder, label], {
//       left: 100,
//       top: 100,
//       data: { 
//         type,
//         isPlaceholder: true,
//         required: true,
//         fieldType: type
//       }
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//     canvas.renderAll();
//     updateRequiredFields();
//   };

//   const updateRequiredFields = () => {
//     const fields = canvas.getObjects()
//       .filter(obj => obj.data?.required)
//       .map(obj => ({
//         type: obj.data.fieldType,
//         placeholder: obj.data.placeholder || '',
//         id: obj.data.id || Date.now()
//       }));
//     setRequiredFields(fields);
//   };

//   const updateSelectedObject = () => {
//     const obj = canvas.getActiveObject();
//     if (!obj) return;

//     const updates = {
//       stroke: selectedColor
//     };

//     if (obj.type === 'i-text' || obj.type === 'text') {
//       updates.fill = selectedColor;
//       updates.fontSize = parseInt(selectedFontSize);
//       updates.fontFamily = selectedFontFamily;
//       if (textContent !== obj.text) {
//         updates.text = textContent;
//       }
//     } else {
//       updates.fill = fillColor;
//     }

//     obj.set(updates);
//     canvas.renderAll();
//     updateRequiredFields();
//   };

//   const handleDelete = () => {
//     const obj = canvas.getActiveObject();
//     if (obj) {
//       canvas.remove(obj);
//       canvas.discardActiveObject();
//       canvas.renderAll();
//       updateRequiredFields();
//     }
//   };

//   const handleSave = () => {
//     if (!canvas || !templateName || !category) return;
    
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
//       requiredFields: requiredFields
//     };
    
//     onSave(templateData);
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       <div className="mb-6 space-y-4">
//         <input
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
//         <h3 className="font-medium mb-2">Required Fields</h3>
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





// // src/components/TemplateDesign.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';

// const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category?._id || initialTemplate?.category || '');
//   const canvasRef = useRef(null);
//   const [selectedColor, setSelectedColor] = useState('#000000');
//   const [selectedFontSize, setSelectedFontSize] = useState('20');
//   const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');

//   const fontFamilies = [
//     'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
//     'Helvetica', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
//   ];

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: 'transparent'
//     });
    
//     // Enable object modification
//     fabricCanvas.selection = true;
//     fabricCanvas.on('object:selected', handleObjectSelected);
//     fabricCanvas.on('selection:cleared', handleSelectionCleared);
    
//     setCanvas(fabricCanvas);
//     return () => fabricCanvas.dispose();
//   }, []);

//   useEffect(() => {
//     if (canvas && initialTemplate) {
//       loadTemplate(initialTemplate);
//     }
//   }, [canvas, initialTemplate]);

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
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
          
//           // Preserve placeholder properties
//           if (enlivenedObject.data?.isPlaceholder) {
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

//   const handleObjectSelected = (e) => {
//     const selectedObject = e.target;
//     if (selectedObject) {
//       setSelectedColor(selectedObject.fill || '#000000');
//       setSelectedFontSize(selectedObject.fontSize?.toString() || '20');
//       setSelectedFontFamily(selectedObject.fontFamily || 'Arial');
//     }
//   };

//   const handleSelectionCleared = () => {
//     setSelectedColor('#000000');
//     setSelectedFontSize('20');
//     setSelectedFontFamily('Arial');
//   };

//   const addText = () => {
//     if (!canvas) return;
//     const text = new fabric.IText('Edit Text', {
//       left: 100,
//       top: 100,
//       fontSize: parseInt(selectedFontSize),
//       fontFamily: selectedFontFamily,
//       fill: selectedColor,
//       editable: true
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//   };

//   const addShape = (type) => {
//     if (!canvas) return;
//     let shape;

//     const shapeProps = {
//       left: 100,
//       top: 100,
//       fill: selectedColor,
//       stroke: '#000',
//       strokeWidth: 2,
//       selectable: true,
//       hasControls: true
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
    
//     const placeholder = new fabric.Rect({
//       left: 100,
//       top: 100,
//       width: 150,
//       height: 150,
//       fill: 'rgba(200,200,200,0.5)',
//       stroke: '#666',
//       strokeDashArray: [5, 5],
//       selectable: true,
//       hasControls: true,
//       data: { type, isPlaceholder: true }
//     });
    
//     const label = new fabric.Text(type.toUpperCase(), {
//       left: placeholder.left + placeholder.width/2,
//       top: placeholder.top + placeholder.height/2,
//       fontSize: 14,
//       originX: 'center',
//       originY: 'center',
//       selectable: false
//     });

//     const group = new fabric.Group([placeholder, label], {
//       left: 100,
//       top: 100,
//       selectable: true,
//       hasControls: true,
//       data: { type, isPlaceholder: true }
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//     canvas.renderAll();
//   };

//   const updateSelectedObject = () => {
//     const activeObject = canvas.getActiveObject();
//     if (activeObject) {
//       if (activeObject.type === 'i-text' || activeObject.type === 'text') {
//         activeObject.set({
//           fill: selectedColor,
//           fontSize: parseInt(selectedFontSize),
//           fontFamily: selectedFontFamily
//         });
//       } else {
//         activeObject.set({
//           fill: selectedColor
//         });
//       }
//       canvas.renderAll();
//     }
//   };

//   const handleSave = () => {
//     if (!canvas || !templateName || !category) return;
    
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
//       })
//     };
    
//     onSave(templateData);
//   };

//   const handleDelete = () => {
//     const activeObject = canvas.getActiveObject();
//     if (activeObject) {
//       canvas.remove(activeObject);
//       canvas.discardActiveObject();
//       canvas.renderAll();
//     }
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       <div className="mb-6 space-y-4">
//         <input
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

//       <div className="mb-6 space-y-4">
//         <div className="flex flex-wrap gap-4 items-center">
//           <button onClick={addText} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//             Add Text
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
//           <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//             Delete Selected
//           </button>
//         </div>

//         <div className="flex flex-wrap gap-4 items-center">
//           <div className="flex items-center gap-2">
//             <label>Color:</label>
//             <input
//               type="color"
//               value={selectedColor}
//               onChange={(e) => {
//                 setSelectedColor(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="w-12 h-8"
//             />
//           </div>

//           <div className="flex items-center gap-2">
//             <label>Font Size:</label>
//             <select
//               value={selectedFontSize}
//               onChange={(e) => {
//                 setSelectedFontSize(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="px-2 py-1 border rounded"
//             >
//               {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
//                 <option key={size} value={size}>{size}px</option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-2">
//             <label>Font Family:</label>
//             <select
//               value={selectedFontFamily}
//               onChange={(e) => {
//                 setSelectedFontFamily(e.target.value);
//                 updateSelectedObject();
//               }}
//               className="px-2 py-1 border rounded"
//             >
//               {fontFamilies.map(font => (
//                 <option key={font} value={font}>{font}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="mb-6 border rounded p-4">
//         <canvas ref={canvasRef} className="border"/>
//       </div>

//       <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;






// // working but simple
// // src/components/TemplateDesigner.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';

// const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category || '');
//   const canvasRef = useRef(null);
//   const [elements, setElements] = useState({
//     texts: [],
//     shapes: [],
//     placeholders: []
//   });

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: 'transparent'
//     });
//     setCanvas(fabricCanvas);
    
//     return () => fabricCanvas.dispose();
//   }, []);

//   useEffect(() => {
//     if (canvas && initialTemplate) {
//       console.log('Initial template provided:', initialTemplate); // Debug log
//       loadTemplate(initialTemplate);
//     }
//   }, [canvas, initialTemplate]);


//   useEffect(() => {
//     if (canvas && initialTemplate) {
//       console.log('Loading initial template:', initialTemplate);
      
//       // Set template name and category
//       setTemplateName(initialTemplate.name);
//       setCategory(initialTemplate.category._id || initialTemplate.category);
  
//       // Clear canvas
//       canvas.clear();
  
//       // Parse elements if needed
//       let elementsData = initialTemplate.elements;
//       if (typeof elementsData === 'string') {
//         try {
//           elementsData = JSON.parse(elementsData);
//         } catch (error) {
//           console.error('Error parsing template elements:', error);
//           return;
//         }
//       }
  
//       console.log('Template elements data:', elementsData);
  
//       // Load objects
//       if (elementsData && elementsData.objects) {
//         elementsData.objects.forEach(obj => {
//           fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//             const enlivenedObject = enlivenedObjects[0];
            
//             // Restore placeholder properties
//             if (enlivenedObject.data?.isPlaceholder) {
//               enlivenedObject.set({
//                 hasControls: true,
//                 lockUniScaling: false,
//                 lockRotation: false
//               });
//             }
            
//             canvas.add(enlivenedObject);
//             canvas.renderAll();
//           });
//         });
//       }
//     }
//   }, [canvas, initialTemplate]);

//   const loadTemplate = (template) => {
//     if (!canvas) return;
    
//     console.log('Loading template:', template); // Debug log
//     setTemplateName(template.name);
//     setCategory(template.category);
    
//     // Clear existing canvas
//     canvas.clear();
    
//     // If template has elements as string, parse it
//     let elementsData = template.elements;
//     if (typeof template.elements === 'string') {
//       try {
//         elementsData = JSON.parse(template.elements);
//       } catch (error) {
//         console.error('Error parsing template elements:', error);
//       }
//     }

//     // Load the objects
//     if (elementsData && elementsData.objects) {
//       elementsData.objects.forEach(obj => {
//         fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
//           const enlivenedObject = enlivenedObjects[0];
//           if (enlivenedObject.data?.isPlaceholder) {
//             // Restore placeholder properties
//             enlivenedObject.set({
//               hasControls: true,
//               lockUniScaling: false,
//               lockRotation: false
//             });
//           }
//           canvas.add(enlivenedObject);
//           canvas.renderAll();
//         });
//       });
//     }
//   };

//   const addText = () => {
//     if (!canvas) return;
//     const text = new fabric.IText('Edit Text', {
//       left: 100,
//       top: 100,
//       fontSize: 20,
//       fontFamily: 'Arial'
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     updateElements();
//   };

//   const addShape = (type) => {
//     if (!canvas) return;
//     let shape;

//     switch(type) {
//       case 'rect':
//         shape = new fabric.Rect({
//           left: 100,
//           top: 100,
//           width: 100,
//           height: 100,
//           fill: 'transparent',
//           stroke: '#000',
//           strokeWidth: 2
//         });
//         break;
//       case 'circle':
//         shape = new fabric.Circle({
//           left: 100,
//           top: 100,
//           radius: 50,
//           fill: 'transparent',
//           stroke: '#000',
//           strokeWidth: 2
//         });
//         break;
//       default:
//         return;
//     }

//     canvas.add(shape);
//     canvas.setActiveObject(shape);
//     updateElements();
//   };

//   const addPlaceholder = (type) => {
//     if (!canvas) return;
//     const placeholder = new fabric.Rect({
//       left: 100,
//       top: 100,
//       width: 150,
//       height: 150,
//       fill: 'rgba(200,200,200,0.5)',
//       stroke: '#666',
//       strokeDashArray: [5, 5],
//       data: { type, isPlaceholder: true }
//     });
    
//     const label = new fabric.Text(type.toUpperCase(), {
//       left: placeholder.left + placeholder.width/2,
//       top: placeholder.top + placeholder.height/2,
//       fontSize: 14,
//       originX: 'center',
//       originY: 'center',
//       selectable: false
//     });

//     const group = new fabric.Group([placeholder, label], {
//       left: 100,
//       top: 100,
//       data: { type, isPlaceholder: true }
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//     updateElements();
//   };

//   const updateElements = () => {
//     const objects = canvas.getObjects();
//     const updatedElements = {
//       texts: objects.filter(obj => obj.type === 'i-text' || obj.type === 'text'),
//       shapes: objects.filter(obj => obj.type === 'rect' || obj.type === 'circle'),
//       placeholders: objects.filter(obj => obj.data?.isPlaceholder)
//     };
//     setElements(updatedElements);
//   };

//   const handleSave = () => {
//     if (!canvas || !templateName || !category) return;
    
//     // Ensure elements are properly formatted
//     const templateData = {
//       name: templateName,
//       category: category,
//       elements: {
//         version: canvas.version,
//         objects: canvas.getObjects().map(obj => ({
//           ...obj.toObject(['data']),
//           data: obj.data // Preserve placeholder data
//         }))
//       },
//       preview: canvas.toDataURL({
//         format: 'png',
//         backgroundColor: null
//       })
//     };
    
//     console.log('Saving template with data:', templateData);
//     onSave(templateData);
//   };

//   const handleImageUpload = (e) => {
//     if (!canvas) return;
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       fabric.Image.fromURL(event.target.result, (img) => {
//         img.scaleToWidth(200);
//         canvas.add(img);
//         canvas.setActiveObject(img);
//         canvas.renderAll();
//         updateElements();
//       });
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleDelete = () => {
//     const activeObject = canvas.getActiveObject();
//     if (activeObject) {
//       canvas.remove(activeObject);
//       canvas.renderAll();
//       updateElements();
//     }
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       <div className="mb-6 space-y-4">
//         <input
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

//       <div className="mb-6 space-x-2">
//         <button onClick={addText} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Add Text
//         </button>
//         <button onClick={() => addShape('rect')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Add Rectangle
//         </button>
//         <button onClick={() => addShape('circle')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Add Circle
//         </button>
//         <button onClick={() => addPlaceholder('image')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Add Image Placeholder
//         </button>
//         <button onClick={() => addPlaceholder('logo')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//           Add Logo Placeholder
//         </button>
//         <input
//           type="file"
//           onChange={handleImageUpload}
//           accept="image/*"
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         />
//         <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//           Delete Selected
//         </button>
//       </div>

//       <div className="mb-6 border rounded p-4" >
//         <canvas ref={canvasRef}/>
//       </div>

//       <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;
