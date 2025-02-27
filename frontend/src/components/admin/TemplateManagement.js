// src/components/admin/TemplateManagement.js
import React, { useState, useEffect } from 'react';
import { PaginatedList } from './PaginatedList';
import TemplateDesigner from '../TemplateDesigner';
import { Pencil, Trash2, FilePlus2 } from 'lucide-react';

const TemplateManagement = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  categories,
  templates, 
  onEdit, 
  onDelete, 
  isEdit,
  setNotification,
  setActiveMenu
}) => {
  const [showEditForm, setShowEditForm] = useState(false);

  // Ensure we reset the form when component mounts or when templates change
  useEffect(() => {
    setShowEditForm(false);
    setFormData({ name: '', category: '', elements: {}, preview: '' });
  }, [templates.length]);

  // Function to switch to Add Template mode
  const handleAddTemplateClick = () => {
    setShowEditForm(true);
    setFormData({ name: '', category: '', elements: {}, preview: '' });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    try {
      // Log before submission to help debug
      console.log("Submitting template data:", formData);
      
      // Validation
      if (!formData.name || !formData.category) {
        setNotification({
          type: 'error',
          message: 'Template name and category are required'
        });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      await onSubmit();
      setShowEditForm(false);
      
      setNotification({
        type: 'success',
        message: formData._id ? 'Template updated successfully!' : 'Template added successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Template submission error:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || `Failed to ${formData._id ? 'update' : 'add'} template`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Templates</h3>
        
        {/* Add Template button */}
        {!showEditForm && (
          <button
            onClick={handleAddTemplateClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <FilePlus2 className="h-5 w-5 mr-2" />
            Add Template
          </button>
        )}
      </div>

      {/* Show list of templates when not showing edit/add form */}
      {!showEditForm && (
        <PaginatedList 
          items={templates}
          renderItem={(template) => (
            <div key={template._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-4">
              {template.preview && (
                <img 
                  src={template.preview} 
                  alt={template.name}
                  className="w-24 h-32 object-contain mr-4"
                />
              )}
              <div className="flex-grow">
                <h4 className="font-bold">{template.name}</h4>
                <p className="text-gray-600">Category: {template.category?.name}</p>
              </div>
              <div className="flex space-x-2">
                {/* <button
                  onClick={() => {
                    onEdit(template);
                    setShowEditForm(true);
                  }}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit template"
                >
                  <Pencil className="h-5 w-5" />
                </button> */}
                <button
                  onClick={() => onDelete('templates', template._id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        />
      )}

      {/* Show template designer when adding or editing */}
      {showEditForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">
              {formData._id ? 'Edit' : 'Add'} Template
            </h4>
            <button
              onClick={() => {
                setShowEditForm(false);
                setFormData({ name: '', category: '', elements: {}, preview: '' });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          
          <TemplateDesigner 
            onSave={(template) => {
              console.log("Template from designer:", template);
              setFormData(template);
              handleSubmit();
            }}
            initialTemplate={formData._id ? formData : null}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;





// // work well without seperating of create and edit template
// // src/components/admin/TemplateManagement.js
// import React, { useState } from 'react';
// import { PaginatedList } from './PaginatedList';
// import TemplateDesigner from '../TemplateDesigner';

// const TemplateManagement = ({ 
//   formData, 
//   setFormData, 
//   onSubmit, 
//   categories,
//   templates, 
//   onEdit, 
//   onDelete, 
//   isEdit,
//   setNotification 
// }) => {
//   const [showEditForm, setShowEditForm] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await onSubmit();
//       setShowEditForm(false);
      
//       setNotification({
//         type: 'success',
//         message: isEdit ? 'Template updated successfully!' : 'Template added successfully!'
//       });
//       setTimeout(() => setNotification(null), 3000);
//     } catch (error) {
//       setNotification({
//         type: 'error',
//         message: error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'add'} template`
//       });
//       setTimeout(() => setNotification(null), 3000);
//     }
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Template</h3>

//       {/* Show list of templates when in edit mode and not showing edit form */}
//       {isEdit && !showEditForm && (
//         <PaginatedList 
//           items={templates}
//           renderItem={(template) => (
//             <div key={template._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-4">
//               {template.preview && (
//                 <img 
//                   src={template.preview} 
//                   alt={template.name}
//                   className="w-24 h-32 object-contain mr-4"
//                 />
//               )}
//               <div className="flex-grow">
//                 <h4 className="font-bold">{template.name}</h4>
//                 <p className="text-gray-600">Category: {template.category?.name}</p>
//               </div>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => {
//                     onEdit(template);
//                     setShowEditForm(true);
//                   }}
//                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => onDelete('templates', template._id)}
//                   className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           )}
//         />
//       )}

//       {/* Show template designer when adding or editing */}
//       {(!isEdit || showEditForm) && (
//         <div className="bg-white p-6 rounded-lg shadow">
//           {isEdit && (
//             <div className="flex justify-end mb-4">
//               <button
//                 onClick={() => {
//                   setShowEditForm(false);
//                   setFormData({ name: '', category: '', elements: {}, preview: '' });
//                 }}
//                 className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//               >
//                 Cancel
//               </button>
//             </div>
//           )}
          
//           <TemplateDesigner 
//             onSave={(template) => {
//               setFormData(template);
//               handleSubmit({ preventDefault: () => {} });
//             }}
//             initialTemplate={isEdit ? formData : null}
//             categories={categories}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default TemplateManagement;