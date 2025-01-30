// src/components/TemplateDesigner.js
import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
  const [canvas, setCanvas] = useState(null);
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [category, setCategory] = useState(initialTemplate?.category || '');
  const canvasRef = useRef(null);
  const [elements, setElements] = useState({
    texts: [],
    shapes: [],
    placeholders: []
  });

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent'
    });
    setCanvas(fabricCanvas);
    
    return () => fabricCanvas.dispose();
  }, []);

  useEffect(() => {
    if (canvas && initialTemplate) {
      console.log('Initial template provided:', initialTemplate); // Debug log
      loadTemplate(initialTemplate);
    }
  }, [canvas, initialTemplate]);


  useEffect(() => {
    if (canvas && initialTemplate) {
      console.log('Loading initial template:', initialTemplate);
      
      // Set template name and category
      setTemplateName(initialTemplate.name);
      setCategory(initialTemplate.category._id || initialTemplate.category);
  
      // Clear canvas
      canvas.clear();
  
      // Parse elements if needed
      let elementsData = initialTemplate.elements;
      if (typeof elementsData === 'string') {
        try {
          elementsData = JSON.parse(elementsData);
        } catch (error) {
          console.error('Error parsing template elements:', error);
          return;
        }
      }
  
      console.log('Template elements data:', elementsData);
  
      // Load objects
      if (elementsData && elementsData.objects) {
        elementsData.objects.forEach(obj => {
          fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
            const enlivenedObject = enlivenedObjects[0];
            
            // Restore placeholder properties
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
    }
  }, [canvas, initialTemplate]);

  const loadTemplate = (template) => {
    if (!canvas) return;
    
    console.log('Loading template:', template); // Debug log
    setTemplateName(template.name);
    setCategory(template.category);
    
    // Clear existing canvas
    canvas.clear();
    
    // If template has elements as string, parse it
    let elementsData = template.elements;
    if (typeof template.elements === 'string') {
      try {
        elementsData = JSON.parse(template.elements);
      } catch (error) {
        console.error('Error parsing template elements:', error);
      }
    }

    // Load the objects
    if (elementsData && elementsData.objects) {
      elementsData.objects.forEach(obj => {
        fabric.util.enlivenObjects([obj], (enlivenedObjects) => {
          const enlivenedObject = enlivenedObjects[0];
          if (enlivenedObject.data?.isPlaceholder) {
            // Restore placeholder properties
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

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Edit Text', {
      left: 100,
      top: 100,
      fontSize: 20,
      fontFamily: 'Arial'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    updateElements();
  };

  const addShape = (type) => {
    if (!canvas) return;
    let shape;

    switch(type) {
      case 'rect':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 2
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 2
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    updateElements();
  };

  const addPlaceholder = (type) => {
    if (!canvas) return;
    const placeholder = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 150,
      fill: 'rgba(200,200,200,0.5)',
      stroke: '#666',
      strokeDashArray: [5, 5],
      data: { type, isPlaceholder: true }
    });
    
    const label = new fabric.Text(type.toUpperCase(), {
      left: placeholder.left + placeholder.width/2,
      top: placeholder.top + placeholder.height/2,
      fontSize: 14,
      originX: 'center',
      originY: 'center',
      selectable: false
    });

    const group = new fabric.Group([placeholder, label], {
      left: 100,
      top: 100,
      data: { type, isPlaceholder: true }
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    updateElements();
  };

  const updateElements = () => {
    const objects = canvas.getObjects();
    const updatedElements = {
      texts: objects.filter(obj => obj.type === 'i-text' || obj.type === 'text'),
      shapes: objects.filter(obj => obj.type === 'rect' || obj.type === 'circle'),
      placeholders: objects.filter(obj => obj.data?.isPlaceholder)
    };
    setElements(updatedElements);
  };

  const handleSave = () => {
    if (!canvas || !templateName || !category) return;
    
    // Ensure elements are properly formatted
    const templateData = {
      name: templateName,
      category: category,
      elements: {
        version: canvas.version,
        objects: canvas.getObjects().map(obj => ({
          ...obj.toObject(['data']),
          data: obj.data // Preserve placeholder data
        }))
      },
      preview: canvas.toDataURL({
        format: 'png',
        backgroundColor: null
      })
    };
    
    console.log('Saving template with data:', templateData);
    onSave(templateData);
  };

  const handleImageUpload = (e) => {
    if (!canvas) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateElements();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      updateElements();
    }
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

      <div className="mb-6 space-x-2">
        <button onClick={addText} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Add Text
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

      <div className="mb-6 border rounded p-4" >
        <canvas ref={canvasRef}/>
      </div>

      <button onClick={handleSave} className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Save Template
      </button>
    </div>
  );
};

export default TemplateDesigner;






// // working but simple
// // // src/components/TemplateDesigner.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';

// const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category || '');
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//     //  backgroundColor: '#ffffff'
//       backgroundColor: null
//     });
//     setCanvas(fabricCanvas);
    
//     if (initialTemplate) {
//       loadTemplate(initialTemplate);
//     }

//     return () => fabricCanvas.dispose();
//   }, []);

//   const loadTemplate = (template) => {
//     if (!canvas) return;
//     setTemplateName(template.name);
//     setCategory(template.category);
//     if (template.elements) {
//       canvas.loadFromJSON(template.elements, canvas.renderAll.bind(canvas));
//     }
//   };

//   useEffect(() => {
//     if (initialTemplate && canvas) {
//       loadTemplate(initialTemplate);
//     }
//   }, [initialTemplate, canvas]);

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
//       data: { type }
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
//       top: 100
//     });

//     canvas.add(group);
//     canvas.setActiveObject(group);
//   };

//   // const handleSave = () => {
//   //   if (!canvas || !templateName || !category) return;
    
//   //   const template = {
//   //     name: templateName,
//   //     category,
//   //     elements: canvas.toJSON(),
//   //     preview: canvas.toDataURL()
//   //   };

//   //   onSave(template);
//   // };
//   // When saving a template in TemplateDesigner
//   const handleSave = () => {
//     if (!canvas) return;
    
//     const templateData = {
//       name: templateName,
//       category,
//       elements: {
//         version: canvas.version,
//         objects: canvas.getObjects().map(obj => obj.toObject()),
//       },
//       preview: canvas.toDataURL({
//         format: 'png',
//         backgroundColor: null // Ensures transparent background
//       })
//     };
    
//     onSave(templateData);
//   };

//   const handleDelete = () => {
//     const activeObject = canvas.getActiveObject();
//     if (activeObject) {
//       canvas.remove(activeObject);
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

//       <div className="mb-6 space-x-2">
//         <button
//           onClick={addText}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Text
//         </button>
//         <button
//           onClick={() => addShape('rect')}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Rectangle
//         </button>
//         <button
//           onClick={() => addShape('circle')}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Circle
//         </button>
//         <button
//           onClick={() => addPlaceholder('image')}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Image Placeholder
//         </button>
//         <button
//           onClick={() => addPlaceholder('logo')}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Logo Placeholder
//         </button>
//         <button
//           onClick={handleDelete}
//           className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//         >
//           Delete Selected
//         </button>
//       </div>

//       <div className="mb-6 border rounded p-4">
//         <canvas ref={canvasRef} />
//       </div>

//       <button
//         onClick={handleSave}
//         className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//       >
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;

