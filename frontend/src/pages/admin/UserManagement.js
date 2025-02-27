// src/components/admin/UserManagement.js
import React, { useState, useEffect } from "react";
import { Search, Mail, Phone, Calendar } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&limit=10&search=${search}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (data.error) {
        console.error("Error:", data.error);
        setUsers([]);
        setTotalPages(1);
        return;
      }

      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 pt-16">
     <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <form onSubmit={handleSearch} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
      </form>
    </div>

    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="hidden md:block"> {/* Table only visible on medium screens and up */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-1" />
                      {user.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile card view - only visible on small screens */}
      <div className="md:hidden">
          {users && users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} className="border-b border-gray-200 p-4">
                <div className="mb-2">
                  <div className="text-base font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email}
                  </div>
                </div>
                <div className="flex flex-wrap gap-y-2 text-sm">
                  <div className="w-full flex items-center text-gray-500">
                    <Phone className="h-4 w-4 mr-1" />
                    {user.phone}
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>


        {users && users.length > 0 && (
            <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
              <div className="flex w-full justify-between sm:hidden mb-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page{" "}
                    <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    {totalPages <= 5 ? (
                      // Show all page numbers if 5 or fewer
                      [...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === idx + 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))
                    ) : (
                      // Show limited page numbers with ellipsis for better mobile experience
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          1
                        </button>
                        {currentPage > 3 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        {currentPage !== 1 && currentPage !== totalPages && (
                          <button
                            className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                          >
                            {currentPage}
                          </button>
                        )}
                        {currentPage < totalPages - 2 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === totalPages
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default UserManagement;
