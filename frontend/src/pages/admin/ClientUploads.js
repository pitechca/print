// src/pages/admin/ClientUploads.js
import React, { useState, useEffect } from 'react';
import { 
  Download, Trash2, Eye, Filter, Search, ChevronLeft, 
  ChevronRight, Image as ImageIcon, Calendar, User, ShoppingCart, Package
} from 'lucide-react';
import axios from 'axios';

const ClientUploads = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    inCart: false,
    inOrder: false,
    userOnly: false,
    visitorOnly: false,
    dateRange: { start: '', end: '' }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'user', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  const imagesPerPage = 12;

  useEffect(() => {
    fetchImages();
  }, [currentPage, searchTerm, filters, sortBy, sortOrder]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: imagesPerPage,
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...filters.inCart && { inCart: true },
        ...filters.inOrder && { inOrder: true },
        ...filters.userOnly && { userOnly: true },
        ...filters.visitorOnly && { visitorOnly: true },
        ...filters.dateRange.start && { startDate: filters.dateRange.start },
        ...filters.dateRange.end && { endDate: filters.dateRange.end }
      });

      const response = await axios.get(`/api/admin/uploads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setImages(response.data.images);
      setTotalPages(Math.ceil(response.data.total / imagesPerPage));
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (image) => {
    try {
      const token = localStorage.getItem('token');
      window.open(`/api/admin/uploads/download/${image._id}?token=${token}`, '_blank');
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleViewImage = (image) => {
    setModalImage(image);
  };

  const handleViewDetails = async (image) => {
    try {
      setImageDetails(null); // Clear previous details
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/uploads/${image._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImageDetails(response.data);
    } catch (error) {
      console.error('Error fetching image details:', error);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/uploads/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the images list after successful deletion
      setImages(images.filter(img => img._id !== imageId));
      
      // Close the modal if it's the deleted image
      if (modalImage && modalImage._id === imageId) {
        setModalImage(null);
      }
      
      // Close details modal if it's the deleted image
      if (imageDetails && imageDetails._id === imageId) {
        setImageDetails(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete the image. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchImages();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      inCart: false,
      inOrder: false,
      userOnly: false,
      visitorOnly: false,
      dateRange: { start: '', end: '' }
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSort = (sortType) => {
    if (sortBy === sortType) {
      // Toggle sort order if clicking the same sort type
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort type and default to descending order
      setSortBy(sortType);
      setSortOrder('desc');
    }
  };

  if (loading ) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /> */}
        <img src='../images/loading.gif'/>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Clients' Uploaded Images</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by filename, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <button 
              type="submit" 
              className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          
          {/* Filter Toggle Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'}`}
          >
            <Filter className="h-5 w-5" />
            <span>Filter</span>
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </h3>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="px-3 py-2 border rounded text-sm"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="px-3 py-2 border rounded text-sm"
                />
              </div>
            </div>
            
            {/* Usage Filters */}
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Usage
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inCart}
                    onChange={(e) => handleFilterChange('inCart', e.target.checked)}
                    className="mr-2"
                  />
                  Images in Cart
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inOrder}
                    onChange={(e) => handleFilterChange('inOrder', e.target.checked)}
                    className="mr-2"
                  />
                  Images in Orders
                </label>
              </div>
            </div>
            
            {/* User Type Filters */}
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Uploader Type
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.userOnly}
                    onChange={(e) => handleFilterChange('userOnly', e.target.checked)}
                    className="mr-2"
                  />
                  Registered Users
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.visitorOnly}
                    onChange={(e) => handleFilterChange('visitorOnly', e.target.checked)}
                    className="mr-2"
                  />
                  Visitors
                </label>
              </div>
            </div>
            
            {/* Sort Options */}
            <div>
              <h3 className="font-medium mb-2">Sort By</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSort('date')}
                  className={`px-3 py-1 rounded text-sm ${sortBy === 'date' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'} flex items-center`}
                >
                  Date 
                  {sortBy === 'date' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
                <button 
                  onClick={() => handleSort('user')}
                  className={`px-3 py-1 rounded text-sm ${sortBy === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'} flex items-center`}
                >
                  User 
                  {sortBy === 'user' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
                <button 
                  onClick={() => handleSort('size')}
                  className={`px-3 py-1 rounded text-sm ${sortBy === 'size' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'} flex items-center`}
                >
                  File Size 
                  {sortBy === 'size' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-600 hover:text-red-800 mr-2"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                fetchImages();
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}
      
      {/* No Results */}
      {!loading && images.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Images Found</h3>
          <p className="text-gray-500 mb-4">
            {Object.values(filters).some(filter => 
              filter === true || (typeof filter === 'object' && Object.values(filter).some(val => val !== ''))
            ) || searchTerm 
              ? 'Try adjusting your filters or search terms' 
              : 'No uploaded images available in the system'}
          </p>
          {(Object.values(filters).some(filter => 
            filter === true || (typeof filter === 'object' && Object.values(filter).some(val => val !== ''))
          ) || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
      
      {/* Images Grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {images.map(image => (
            <div key={image._id} className="bg-white rounded-lg shadow overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Image Preview */}
              <div 
                className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center"
                onClick={() => handleViewImage(image)}
              >
                <img 
                  src={`/upload/${image.path}`} 
                  alt={image.originalName || 'Uploaded image'} 
                  className="h-full w-full object-cover cursor-pointer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                
                {/* Image Status Indicators */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {image.inCart && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      In Cart
                    </span>
                  )}
                  {image.inOrder && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Ordered
                    </span>
                  )}
                </div>
                
                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    className="p-2 bg-white rounded-full text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewImage(image);
                    }}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 bg-white rounded-full text-green-600 hover:text-green-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 bg-white rounded-full text-red-600 hover:text-red-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image._id);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Image Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-800 truncate" title={image.originalName}>
                  {image.originalName || 'Unnamed Image'}
                </h3>
                
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(image.createdAt)}
                </div>
                
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {image.userId ? 'User' : 'Visitor'}: {image.uploadedBy || 'Anonymous'}
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </span>
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => handleViewDetails(image)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 my-6">
          <button 
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            // Show first 3 pages, last 3 pages, and pages around current page
            const page = i + 1;
            const showPage = page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1;
            
            if (!showPage && (page === 4 || page === totalPages - 3)) {
              return <span key={i} className="px-3 py-1">...</span>;
            }
            
            return showPage ? (
              <button
                key={i}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-full ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {page}
              </button>
            ) : null;
          })}
          
          <button 
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Full Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-medium text-lg">{modalImage.originalName}</h3>
              <button 
                onClick={() => setModalImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 flex justify-center">
              <img 
                src={`/api/uploads/${modalImage.path}`} 
                alt={modalImage.originalName || 'Uploaded image'} 
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => handleDownload(modalImage)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => handleDeleteImage(modalImage._id)}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={deleting}
              >
                {deleting ? (
                  <span className="animate-pulse">Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setModalImage(null);
                  handleViewDetails(modalImage);
                }}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Details Modal */}
      {imageDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-medium text-lg">Image Details</h3>
              <button 
                onClick={() => setImageDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Thumbnail */}
              <div className="flex flex-col items-center">
                <div className="w-full h-48 mb-4 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
                  <img 
                    src={`/upload/${imageDetails.path}`} 
                    alt={imageDetails.originalName} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleViewImage(imageDetails)}
                    className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(imageDetails)}
                    className="flex items-center px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteImage(imageDetails._id)}
                    className="flex items-center px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    disabled={deleting}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Details List */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Filename</h4>
                  <p className="font-medium">{imageDetails.originalName}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Upload Date</h4>
                  <p>{formatDate(imageDetails.createdAt)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Uploader</h4>
                  <p className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    {imageDetails.userId ? (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">User</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1">Visitor</span>
                    )}
                    {imageDetails.uploadedBy || 'Anonymous'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">File Details</h4>
                  <p>Size: {formatFileSize(imageDetails.size)}</p>
                  <p>Type: {imageDetails.mimetype}</p>
                  <p>Dimensions: {imageDetails.width || '?'}×{imageDetails.height || '?'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {imageDetails.inCart && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        In Cart ({imageDetails.cartCount || 1})
                      </span>
                    )}
                    {imageDetails.inOrder && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        In Orders ({imageDetails.orderCount || 1})
                      </span>
                    )}
                    {!imageDetails.inCart && !imageDetails.inOrder && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        Not in use
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Show related orders if any */}
                {imageDetails.orders && imageDetails.orders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Related Orders</h4>
                    <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                      {imageDetails.orders.map(order => (
                        <div key={order._id} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                          <span>#{order._id.slice(-6)}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientUploads;