// src/components/admin/CategoryManagement.js
import React, { useState } from 'react';
import axios from 'axios';
import { PaginatedList } from './PaginatedList';

const CategoryManagement = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  categories, 
  onEdit, 
  onDelete, 
  isEdit,
  setNotification 
}) => {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setFormData({ ...formData, image: compressedImage });
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }
  };

const compressImage = async (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
  
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // Clear canvas with transparent background
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));        };
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit();
      setShowEditForm(false);
      
      // Set success notification
      setNotification({
        type: 'success',
        message: isEdit ? 'Category updated successfully!' : 'Category added successfully!'
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      // Set error notification
      setNotification({
        type: 'error',
        message: error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'add'} category`
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // const handleDelete = async (categoryId) => {
  //   try {
  //     await onDelete('categories', categoryId);
  //     setNotification({
  //       type: 'success',
  //       message: 'Category deleted successfully!'
  //     });
  //     setTimeout(() => setNotification(null), 3000);
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.error || 'Failed to delete category';
  //     setNotification({
  //       type: 'error',
  //       message: errorMessage
  //     });
  //     setTimeout(() => setNotification(null), 3000);
  //   }
  // };
  const handleDelete = (categoryId) => {
    onDelete('categories', categoryId);
  };
  

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Category</h3>
      
      {/* Show list of categories when in edit mode and not showing edit form */}
      {isEdit && !showEditForm && (
        <PaginatedList 
          items={categories} 
          renderItem={(category) => (
            <div key={category._id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow" style={{marginBottom: 10+"px"}}>
              {category.image && (
                <img 
                  src={category.image.data || category.image} 
                  alt={category.name} 
                  className="w-24 h-24 object-cover mr-4 rounded"
                />
              )}
              <div className="flex-grow">
                <h4 className="font-bold">{category.name}</h4>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    onEdit(category);
                    setShowEditForm(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                {/* <button
                  onClick={() => handleDelete(category._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button> */}
                <button
  onClick={() => handleDelete(category._id)}
  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
>
  Delete
</button>

              </div>
            </div>
          )}
        />
      )}
    
      {/* Show form when adding or editing */}
      {(!isEdit || showEditForm) && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          {isEdit && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setFormData({ name: '', description: '', image: null });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Image</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full"
            />
            {formData.image && (
              <img 
                src={typeof formData.image === 'string' ? formData.image : formData.image.data} 
                alt="Preview" 
                className="mt-2 h-32 object-contain"
              />
            )}
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {isEdit ? 'Update' : 'Add'} Category
          </button>
        </form>
      )}
    </div>
  );
};

export default CategoryManagement;