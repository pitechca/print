// src/components/admin/TemplateManagement.js
import React, { useState } from 'react';
import { PaginatedList } from './PaginatedList';
import TemplateDesigner from '../TemplateDesigner';

const TemplateManagement = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  categories,
  templates, 
  onEdit, 
  onDelete, 
  isEdit,
  setNotification 
}) => {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit();
      setShowEditForm(false);
      
      setNotification({
        type: 'success',
        message: isEdit ? 'Template updated successfully!' : 'Template added successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'add'} template`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Template</h3>

      {/* Show list of templates when in edit mode and not showing edit form */}
      {isEdit && !showEditForm && (
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
                <button
                  onClick={() => {
                    onEdit(template);
                    setShowEditForm(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete('templates', template._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}

      {/* Show template designer when adding or editing */}
      {(!isEdit || showEditForm) && (
        <div className="bg-white p-6 rounded-lg shadow">
          {isEdit && (
            <div className="flex justify-end mb-4">
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
          )}
          
          <TemplateDesigner 
            onSave={(template) => {
              setFormData(template);
              handleSubmit({ preventDefault: () => {} });
            }}
            initialTemplate={isEdit ? formData : null}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;