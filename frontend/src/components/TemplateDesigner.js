// // src/components/TemplateDesigner.js
import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

const TemplateDesigner = ({ onSave, initialTemplate, categories }) => {
  const [canvas, setCanvas] = useState(null);
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [category, setCategory] = useState(initialTemplate?.category || '');
  const canvasRef = useRef(null);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
    //  backgroundColor: '#ffffff'
      backgroundColor: null
    });
    setCanvas(fabricCanvas);
    
    if (initialTemplate) {
      loadTemplate(initialTemplate);
    }

    return () => fabricCanvas.dispose();
  }, []);

  const loadTemplate = (template) => {
    if (!canvas) return;
    setTemplateName(template.name);
    setCategory(template.category);
    if (template.elements) {
      canvas.loadFromJSON(template.elements, canvas.renderAll.bind(canvas));
    }
  };

  useEffect(() => {
    if (initialTemplate && canvas) {
      loadTemplate(initialTemplate);
    }
  }, [initialTemplate, canvas]);

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
      data: { type }
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
      top: 100
    });

    canvas.add(group);
    canvas.setActiveObject(group);
  };

  // const handleSave = () => {
  //   if (!canvas || !templateName || !category) return;
    
  //   const template = {
  //     name: templateName,
  //     category,
  //     elements: canvas.toJSON(),
  //     preview: canvas.toDataURL()
  //   };

  //   onSave(template);
  // };
  // When saving a template in TemplateDesigner
  const handleSave = () => {
    if (!canvas) return;
    
    const templateData = {
      name: templateName,
      category,
      elements: {
        version: canvas.version,
        objects: canvas.getObjects().map(obj => obj.toObject()),
      },
      preview: canvas.toDataURL({
        format: 'png',
        backgroundColor: null // Ensures transparent background
      })
    };
    
    onSave(templateData);
  };

  const handleDelete = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
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
        <button
          onClick={addText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Text
        </button>
        <button
          onClick={() => addShape('rect')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => addShape('circle')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Circle
        </button>
        <button
          onClick={() => addPlaceholder('image')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Image Placeholder
        </button>
        <button
          onClick={() => addPlaceholder('logo')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Logo Placeholder
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Selected
        </button>
      </div>

      <div className="mb-6 border rounded p-4">
        <canvas ref={canvasRef} />
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Save Template
      </button>
    </div>
  );
};

export default TemplateDesigner;


// // src/components/TemplateDesigner.js
// import React, { useState, useRef, useEffect } from 'react';
// import { fabric } from 'fabric';
// import axios from 'axios';

// const TemplateDesigner = ({ onSave, initialTemplate }) => {
//   const [canvas, setCanvas] = useState(null);
//   const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
//   const [category, setCategory] = useState(initialTemplate?.category || '');
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//       width: 500,
//       height: 500,
//       backgroundColor: '#ffffff'
//     });
//     setCanvas(fabricCanvas);
    
//     if (initialTemplate) {
//       loadTemplate(initialTemplate);
//     }

//     return () => fabricCanvas.dispose();
//   }, [initialTemplate]);

//   const addText = () => {
//     const text = new fabric.IText('Edit Text', {
//       left: 100,
//       top: 100,
//       editable: true,
//       fontFamily: 'Arial'
//     });
//     canvas.add(text);
//     canvas.setActiveObject(text);
//   };

//   const addPlaceholder = (type) => {
//     const placeholder = new fabric.Rect({
//       left: 100,
//       top: 100,
//       width: 100,
//       height: 100,
//       fill: 'rgba(200,200,200,0.5)',
//       stroke: '#666',
//       strokeDashArray: [5, 5],
//       data: { type }
//     });
//     canvas.add(placeholder);
//     canvas.setActiveObject(placeholder);
//   };

//   const handleSave = async () => {
//     const template = {
//       name: templateName,
//       category,
//       elements: canvas.toJSON(),
//       preview: canvas.toDataURL()
//     };

//     try {
//       const { data } = await axios.post('/api/templates', template, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       onSave(data);
//     } catch (error) {
//       console.error('Error saving template:', error);
//     }
//   };

//   const loadTemplate = (template) => {
//     setTemplateName(template.name);
//     setCategory(template.category);
//     canvas.loadFromJSON(template.elements, canvas.renderAll.bind(canvas));
//   };

//   return (
//     <div className="p-4">
//       <div className="mb-4">
//         <input
//           type="text"
//           value={templateName}
//           onChange={(e) => setTemplateName(e.target.value)}
//           placeholder="Template Name"
//           className="w-full px-3 py-2 border rounded"
//         />
//       </div>

//       <div className="mb-4">
//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value)}
//           className="w-full px-3 py-2 border rounded"
//         >
//           <option value="">Select Category</option>
//           <option value="bags">Bags</option>
//           <option value="boxes">Boxes</option>
//           {/* Add more categories */}
//         </select>
//       </div>

//       <div className="mb-4 flex space-x-2">
//         <button
//           onClick={addText}
//           className="px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Add Text
//         </button>
//         <button
//           onClick={() => addPlaceholder('image')}
//           className="px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Add Image Placeholder
//         </button>
//         <button
//           onClick={() => addPlaceholder('logo')}
//           className="px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Add Logo Placeholder
//         </button>
//       </div>

//       <div className="border rounded p-4 mb-4">
//         <canvas ref={canvasRef} className="border" />
//       </div>

//       <button
//         onClick={handleSave}
//         className="px-4 py-2 bg-green-500 text-white rounded"
//       >
//         Save Template
//       </button>
//     </div>
//   );
// };

// export default TemplateDesigner;