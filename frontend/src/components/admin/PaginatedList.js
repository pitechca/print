// src/components/amin/PaginatedList.js
import React, { useState } from 'react';

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return (
    <div className="flex justify-center space-x-2 mt-4">
      {[...Array(totalPages)].map((_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index + 1)}
          className={`px-4 py-2 rounded ${
            currentPage === index + 1 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

export const PaginatedList = ({ items, renderItem, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sort items from latest to earliest
  const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
      {currentItems.map(renderItem)}
      {items.length > itemsPerPage && (
        <Pagination 
          totalItems={items.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};