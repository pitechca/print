// src/pages/AdminDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HomeIcon,FolderPlusIcon, FolderPenIcon, PackageOpenIcon, PackagePlusIcon, FilePlus2Icon,
  FilePenLineIcon, TicketPercentIcon, ShoppingBagIcon, ImageIcon, BellIcon, Users as UsersIcon,
  NewspaperIcon as Notification, Loader2 as Loader2Icon, } from "lucide-react";
import CategoryManagement from "../components/admin/CategoryManagement";
import ProductManagement from "../components/admin/ProductManagement";
import OrderManagement from "../components/admin/OrderManagement";
import CouponManagement from "../components/admin/CouponManagement";
import Overview from "../components/admin/Overview";
import TemplateManagement from "../components/admin/TemplateManagement";
import MediaManager from "./admin/MediaManager";
import ClientsManagement from "../components/admin/ClientsManagement";
import NotificationsManagement from "../components/admin/NotificationsManagement";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = {
  categories: { data: null, timestamp: 0 },
  products: { data: null, timestamp: 0 },
  templates: { data: null, timestamp: 0 },
};

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [formData, setFormData] = useState({
    category: { name: "", description: "", image: null },
    product: {
      name: "",
      category: "",
      basePrice: "",
      description: "",
      templates: [],
    },
    template: { name: "", category: "", elements: {}, preview: "" },
  });

  // New states for mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const [mobileLoading, setMobileLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to handle sidebar tab click on mobile
  const handleSidebarItemClick = (menu) => {
    if (isMobile) {
      setMobileLoading(true);
      setTimeout(() => {
        setActiveMenu(menu);
        setMobileLoading(false);
        setMobileSidebarVisible(false);
      }, 500);
    } else {
      setActiveMenu(menu);
    }
  };

  // Optimized data fetching with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const now = Date.now();
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const fetchIfNeeded = async (type, endpoint) => {
        if (
          forceRefresh ||
          !cache[type].data ||
          now - cache[type].timestamp > CACHE_DURATION
        ) {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: headers,
          });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          cache[type] = { data, timestamp: now };
          return data;
        }
        return cache[type].data;
      };

      const [categoriesData, productsData, templatesData] = await Promise.all([
        fetchIfNeeded("categories", "/api/categories"),
        fetchIfNeeded("products", "/api/products"),
        fetchIfNeeded("templates", "/api/templates"),
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        type: "error",
        message: "Failed to load data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = useCallback(
    async (type) => {
      try {
        const data = { ...formData[type] };
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        let response;

        if (type === "category") {
          const categoryData = {
            name: data.name,
            description: data.description,
            image: data.image,
          };

          if (selectedItem) {
            response = await fetch(`/api/categories/${selectedItem._id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify(categoryData),
            });
          } else {
            response = await fetch("/api/categories", {
              method: "POST",
              headers,
              body: JSON.stringify(categoryData),
            });
          }
        }

        if (type === "product") {
          const productData = {
            name: data.name,
            category: data.category,
            basePrice: !!data.basePrice,
            description: data.description,
            hasGST: !!data.hasGST,
            hasPST: !!data.hasPST,
            images: data.images,
            isFeatured: !!data.isFeatured,
            inStock: !!data.inStock,
            minimumOrder: data.minimumOrder || 1,
            sku: data.sku,
            pricingTiers: data.pricingTiers || [],
            dimensions: data.dimensions || {},
            metadata: data.metadata || {},
          };

          if (selectedItem) {
            response = await fetch(`/api/products/${selectedItem._id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify(productData),
            });
          } else {
            response = await fetch("/api/products", {
              method: "POST",
              headers,
              body: JSON.stringify(productData),
            });
          }
        }
        
        if (type === "template") {
          const templateData = {
            name: formData.template.name,
            category: formData.template.category,
            elements: formData.template.elements || {},
            preview: formData.template.preview,
          };
  
          console.log("Template data being submitted:", templateData);
          console.log("Selected item:", selectedItem);
  
          if (selectedItem && selectedItem._id) {
            console.log(`Updating template with ID: ${selectedItem._id}`);
            response = await fetch(`/api/templates/${selectedItem._id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify(templateData),
            });
          } else {
            console.log("Creating new template");
            response = await fetch("/api/templates", {
              method: "POST",
              headers,
              body: JSON.stringify(templateData),
            });
          }
        }

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error ||
              `Failed to ${selectedItem ? "update" : "create"} ${type}`
          );
        }

        await fetchData(true); // Force refresh data
        setFormData((prev) => ({
          ...prev,
          [type]: {
            name: "",
            description: "",
            image: null,
            category: "",
            basePrice: "",
            templates: [],
            elements: {},
            preview: "",
            hasGST: false,
            hasPST: false,
          },
        }));
        setSelectedItem(null);

        setNotification({
          type: "success",
          message:
            responseData.message ||
            `${type} ${selectedItem ? "updated" : "created"} successfully!`,
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error(
          `Error ${selectedItem ? "updating" : "creating"} ${type}:`,
          error
        );
        setNotification({
          type: "error",
          message:
            error.message ||
            `Failed to ${selectedItem ? "update" : "add"} ${type}`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    },
    [formData, selectedItem, fetchData]
  );

  const handleEdit = useCallback((item, type) => {
    const editableItem = {
      ...item,
      image: item.image?.data || item.image,
    };

    if (type === "product") {
      const editableProduct = {
        ...item,
        _id: item._id,
        category: item.category?._id || item.category,
        images: item.images?.map((img) => img.data || img),
        hasGST: !!item.hasGST,
        hasPST: !!item.hasPST,
      };

      setSelectedItem(item);
      setFormData((prev) => ({ ...prev, [type]: editableProduct }));
      setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
      return;
    }

    setSelectedItem(item);
    setFormData((prev) => ({ ...prev, [type]: editableItem }));
    setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
  }, []);

  const handleDelete = useCallback(
    (type, id) => {
      console.log(`Attempting to delete ${type} with ID: ${id}`);
      setConfirmDialog({
        message: `Are you sure you want to delete this ${type.slice(0, -1)}?`,
        onConfirm: async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/${type}/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || `Failed to delete ${type}`);
            }
            await fetchData(true); // Force refresh after deletion
            setNotification({
              type: "success",
              message:
                data.message || `${type.slice(0, -1)} deleted successfully!`,
            });
            setTimeout(() => setNotification(null), 3000);
          } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            setNotification({
              type: "error",
              message: error.message || `Failed to delete ${type}`,
            });
            setTimeout(() => setNotification(null), 3000);
          } finally {
            setConfirmDialog(null);
          }
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    },
    [fetchData]
  );

  // Memoized sidebar items
  const sidebarItems = useMemo(
    () => [
      { label: "Overview", menu: "overview", icon: HomeIcon },
      { label: "Categories", menu: "categories", icon: FolderPenIcon }, 
      { label: "Products", menu: "products", icon: PackageOpenIcon },
      { label: "Templates", menu: "templates", icon: FilePenLineIcon }, 
      { label: "Orders", menu: "orders", icon: ShoppingBagIcon },
      { label: "Clients", menu: "clients", icon: UsersIcon },
      { label: "Coupons", menu: "couponManagement", icon: TicketPercentIcon },
      { label: "Media Manager", menu: "mediaManager", icon: ImageIcon },
      { label: "Notifications", menu: "notifications", icon: BellIcon }, 
    ],
    []
  );

  // Updated SidebarItem for a more refined look (modified for mobile behavior)
  const SidebarItem = React.memo(({ label, menu, icon }) => (
    <button
      onClick={() => handleSidebarItemClick(menu)}
      className={`w-full flex items-center justify-start text-left px-4 py-2 space-x-2 rounded transition-colors duration-200 ${
        activeMenu === menu
          ? "bg-blue-100 text-blue-600"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon &&
        React.cloneElement(icon, {
          className: `h-5 w-5 ${
            activeMenu === menu ? "text-blue-600" : "text-gray-500"
          }`,
        })}
      <span>{label}</span>
    </button>
  ));

  const renderSidebar = () => (
    <div className="w-full md:w-64 bg-white shadow-md overflow-y-auto md:sticky md:top-0" style={{ height: "calc(100vh )", boxShadow: 'none', border: 'none' }}>
      {isMobile && (
        <div className="flex justify-between items-center p-4 border-b bg-gray-100">
          <h2 className="text-xl font-bold">Dashboard Menu</h2>
          <button 
            onClick={() => setMobileSidebarVisible(false)}
            className="text-2xl font-bold p-2 hover:bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}
      {!isMobile && (
        <div className="p-4 border-b ">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>
      )}
      <nav className="flex flex-wrap gap-2 p-4 md:flex-col md:space-y-2 md:space-x-0" style={{ boxShadow: 'none', border: 'none' }}>
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.menu}
            label={item.label}
            menu={item.menu}
            icon={<item.icon className="mr-2"/>}
            style={{ boxShadow: 'none', border: 'none' }}
          />
        ))}
      </nav>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "overview":
        return <Overview />;
      case "categories": 
      case "addCategory":
      case "editCategory":
        return (
          <CategoryManagement
            formData={formData.category}
            setFormData={(data) =>
              setFormData((prev) => ({ ...prev, category: data }))
            }
            onSubmit={() => handleSubmit("category")}
            categories={categories}
            onEdit={(item) => handleEdit(item, "category")}
            onDelete={handleDelete}
            isEdit={true} // Always set isEdit to true for the merged category tab
            setNotification={setNotification}
            setActiveMenu={setActiveMenu} // Pass setActiveMenu to allow switching between add/edit modes
          />
        );
      case "products": 
      case "addProduct":
      case "editProduct":
        return (
          <ProductManagement
            formData={formData.product}
            setFormData={(data) =>
              setFormData((prev) => ({ ...prev, product: data }))
            }
            onSubmit={() => handleSubmit("product")}
            categories={categories}
            products={products}
            onEdit={(item) => handleEdit(item, "product")}
            onDelete={handleDelete}
            isEdit={true} // Always set isEdit to true for the merged product tab
            setNotification={setNotification}
            setActiveMenu={setActiveMenu} // Pass setActiveMenu to allow internal mode switching
          />
        );
      case "templates": 
      case "createTemplate": 
      case "editTemplate":
        return (
          <TemplateManagement
            formData={formData.template}
            setFormData={(data) =>
              setFormData((prev) => ({ ...prev, template: data }))
            }
            onSubmit={() => handleSubmit("template")}
            categories={categories}
            templates={templates}
            onEdit={(item) => handleEdit(item, "template")}
            onDelete={handleDelete}
            isEdit={true}
            setNotification={setNotification}
            setActiveMenu={setActiveMenu}
          />
          );
      case "orders":
        return <OrderManagement />;
      case "couponManagement":
        return <CouponManagement />;
      case "mediaManager":
        return <MediaManager />;
      case "clients":
        return <ClientsManagement />;
      case "notifications":
        return <NotificationsManagement />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <img src='../images/loading.gif'/>
      </div>
    );
  }

  return (
    <>
      {/* Delete Confirmation */}
      {confirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 border rounded shadow-lg">
            <p className="mb-4 text-lg font-medium">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={confirmDialog.onConfirm}
              >
                Yes
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={confirmDialog.onCancel}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`${
              notification.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            } border p-[100px] rounded relative`}
            role="alert"
          >
            <span className="block sm:inline">{notification.message}</span>
            <button
              className="absolute top-0 right-0 p-4"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="sticky top-0 p-4 bg-white shadow-md flex items-center justify-between md:hidden z-30">
          <span className="text-xl font-bold">Admin Dashboard</span>
          <button
            onClick={() => setMobileSidebarVisible(true)}
            className="p-2 text-2xl font-bold rounded-full hover:bg-gray-100 h-10 w-10 flex items-center justify-center"
            aria-label="Open menu"
          >
            ≡
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
        {!isMobile && renderSidebar()}
        {isMobile && mobileSidebarVisible && (
          <>
            {/* Dark overlay behind the sidebar */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40" 
              onClick={() => setMobileSidebarVisible(false)}
            ></div>
            {/* Mobile sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white">
              {renderSidebar()}
            </div>
          </>
        )}
        <div className="flex-1 p-8">
          {mobileLoading && (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
              {/* <Loader2Icon className="h-12 w-12 animate-spin text-blue-500" />
              <span className="mt-4 text-xl font-medium text-blue-500">
                Loading...
              </span> */}
             <img src='../images/loading.gif'/>

            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;








// // work well with sepearet add and edit product, ctaegory and template
// // src/pages/AdminDashboard.js
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { HomeIcon,FolderPlusIcon, FolderPenIcon, PackageOpenIcon, PackagePlusIcon, FilePlus2Icon,
//   FilePenLineIcon, TicketPercentIcon, ShoppingBagIcon, ImageIcon, BellIcon, Users as UsersIcon,
//   NewspaperIcon as Notification, Loader2 as Loader2Icon, } from "lucide-react";
// import CategoryManagement from "../components/admin/CategoryManagement";
// import ProductManagement from "../components/admin/ProductManagement";
// import OrderManagement from "../components/admin/OrderManagement";
// import CouponManagement from "../components/admin/CouponManagement";
// import Overview from "../components/admin/Overview";
// import TemplateManagement from "../components/admin/TemplateManagement";
// import { PaginatedList } from "../components/admin/PaginatedList";
// import TemplateDesigner from "../components/TemplateDesigner";
// import MediaManager from "./admin/MediaManager";
// // import { Users as UsersIcon } from "lucide-react";
// import ClientsManagement from "../components/admin/ClientsManagement";
// import NotificationsManagement from "../components/admin/NotificationsManagement";

// // Cache configuration
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// const cache = {
//   categories: { data: null, timestamp: 0 },
//   products: { data: null, timestamp: 0 },
//   templates: { data: null, timestamp: 0 },
// };

// const AdminDashboard = () => {
//   const [activeMenu, setActiveMenu] = useState("overview");
//   const [categories, setCategories] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [templates, setTemplates] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState(null);
//   const [confirmDialog, setConfirmDialog] = useState(null);

//   const [formData, setFormData] = useState({
//     category: { name: "", description: "", image: null },
//     product: {
//       name: "",
//       category: "",
//       basePrice: "",
//       description: "",
//       templates: [],
//     },
//     template: { name: "", category: "", elements: {}, preview: "" },
//   });

//   // New states for mobile view
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//   const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
//   const [mobileLoading, setMobileLoading] = useState(false);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Function to handle sidebar tab click on mobile
//   const handleSidebarItemClick = (menu) => {
//     if (isMobile) {
//       setMobileLoading(true);
//       setTimeout(() => {
//         setActiveMenu(menu);
//         setMobileLoading(false);
//         setMobileSidebarVisible(false);
//       }, 500);
//     } else {
//       setActiveMenu(menu);
//     }
//   };

//   // Optimized data fetching with caching
//   const fetchData = useCallback(async (forceRefresh = false) => {
//     try {
//       setLoading(true);
//       const now = Date.now();
//       const token = localStorage.getItem("token");
//       const headers = { Authorization: `Bearer ${token}` };

//       const fetchIfNeeded = async (type, endpoint) => {
//         if (
//           forceRefresh ||
//           !cache[type].data ||
//           now - cache[type].timestamp > CACHE_DURATION
//         ) {
//           const response = await fetch(endpoint, {
//             method: "GET",
//             headers: headers,
//           });
//           if (!response.ok)
//             throw new Error(`HTTP error! status: ${response.status}`);
//           const data = await response.json();
//           cache[type] = { data, timestamp: now };
//           return data;
//         }
//         return cache[type].data;
//       };

//       const [categoriesData, productsData, templatesData] = await Promise.all([
//         fetchIfNeeded("categories", "/api/categories"),
//         fetchIfNeeded("products", "/api/products"),
//         fetchIfNeeded("templates", "/api/templates"),
//       ]);

//       setCategories(categoriesData);
//       setProducts(productsData);
//       setTemplates(templatesData);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setNotification({
//         type: "error",
//         message: "Failed to load data. Please try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleSubmit = useCallback(
//     async (type) => {
//       try {
//         const data = { ...formData[type] };
//         const token = localStorage.getItem("token");
//         const headers = {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         };
//         let response;

//         if (type === "category") {
//           const categoryData = {
//             name: data.name,
//             description: data.description,
//             image: data.image,
//           };

//           if (selectedItem) {
//             response = await fetch(`/api/categories/${selectedItem._id}`, {
//               method: "PUT",
//               headers,
//               body: JSON.stringify(categoryData),
//             });
//           } else {
//             response = await fetch("/api/categories", {
//               method: "POST",
//               headers,
//               body: JSON.stringify(categoryData),
//             });
//           }
//         }

//         if (type === "product") {
//           const productData = {
//             name: data.name,
//             category: data.category,
//             basePrice: !!data.basePrice,
//             description: data.description,
//             hasGST: !!data.hasGST,
//             hasPST: !!data.hasPST,
//             images: data.images,
//             isFeatured: !!data.isFeatured,
//             inStock: !!data.inStock,
//             minimumOrder: data.minimumOrder || 1,
//             sku: data.sku,
//             pricingTiers: data.pricingTiers || [],
//             dimensions: data.dimensions || {},
//             metadata: data.metadata || {},
//           };

//           if (selectedItem) {
//             response = await fetch(`/api/products/${selectedItem._id}`, {
//               method: "PUT",
//               headers,
//               body: JSON.stringify(productData),
//             });
//           } else {
//             response = await fetch("/api/products", {
//               method: "POST",
//               headers,
//               body: JSON.stringify(productData),
//             });
//           }
//         } else if (type === "template") {
//           const templateData = {
//             name: formData.template.name,
//             category: formData.template.category,
//             elements: formData.template.elements || {},
//             preview: formData.template.preview,
//           };

//           if (selectedItem) {
//             response = await fetch(`/api/templates/${selectedItem._id}`, {
//               method: "PUT",
//               headers,
//               body: JSON.stringify(templateData),
//             });
//           } else {
//             response = await fetch("/api/templates", {
//               method: "POST",
//               headers,
//               body: JSON.stringify(templateData),
//             });
//           }
//         }

//         const responseData = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             responseData.error ||
//               `Failed to ${selectedItem ? "update" : "create"} ${type}`
//           );
//         }

//         await fetchData(true); // Force refresh data
//         setFormData((prev) => ({
//           ...prev,
//           [type]: {
//             name: "",
//             description: "",
//             image: null,
//             category: "",
//             basePrice: "",
//             templates: [],
//             elements: {},
//             preview: "",
//             hasGST: false,
//             hasPST: false,
//           },
//         }));
//         setSelectedItem(null);

//         setNotification({
//           type: "success",
//           message:
//             responseData.message ||
//             `${type} ${selectedItem ? "updated" : "created"} successfully!`,
//         });
//         setTimeout(() => setNotification(null), 3000);
//       } catch (error) {
//         console.error(
//           `Error ${selectedItem ? "updating" : "creating"} ${type}:`,
//           error
//         );
//         setNotification({
//           type: "error",
//           message:
//             error.message ||
//             `Failed to ${selectedItem ? "update" : "add"} ${type}`,
//         });
//         setTimeout(() => setNotification(null), 3000);
//       }
//     },
//     [formData, selectedItem, fetchData]
//   );

//   const handleEdit = useCallback((item, type) => {
//     const editableItem = {
//       ...item,
//       image: item.image?.data || item.image,
//     };

//     if (type === "product") {
//       const editableProduct = {
//         ...item,
//         _id: item._id,
//         category: item.category?._id || item.category,
//         images: item.images?.map((img) => img.data || img),
//         hasGST: !!item.hasGST,
//         hasPST: !!item.hasPST,
//       };

//       setSelectedItem(item);
//       setFormData((prev) => ({ ...prev, [type]: editableProduct }));
//       setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
//       return;
//     }

//     setSelectedItem(item);
//     setFormData((prev) => ({ ...prev, [type]: editableItem }));
//     setActiveMenu(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);
//   }, []);

//   // const handleDelete = useCallback(async (type, id) => {
//   //   if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
//   //     return;
//   //   }
//   //
//   //   try {
//   //     const token = localStorage.getItem('token');
//   //     const response = await fetch(`/api/${type}/${id}`, {
//   //       method: 'DELETE',
//   //       headers: {
//   //         'Authorization': `Bearer ${token}`
//   //       }
//   //     });
//   //
//   //     const data = await response.json();
//   //
//   //     if (!response.ok) {
//   //       throw new Error(data.error || `Failed to delete ${type}`);
//   //     }
//   //
//   //     await fetchData(true); // Force refresh after deletion
//   //
//   //     setNotification({
//   //       type: 'success',
//   //       message: data.message || `${type.slice(0, -1)} deleted successfully!`
//   //     });
//   //     setTimeout(() => setNotification(null), 3000);
//   //   } catch (error) {
//   //     console.error(`Error deleting ${type}:`, error);
//   //     setNotification({
//   //       type: 'error',
//   //       message: error.message || `Failed to delete ${type}`
//   //     });
//   //     setTimeout(() => setNotification(null), 3000);
//   //   }
//   // }, [fetchData]);
//   const handleDelete = useCallback(
//     (type, id) => {
//       setConfirmDialog({
//         message: `Are you sure you want to delete this ${type.slice(0, -1)}?`,
//         onConfirm: async () => {
//           try {
//             const token = localStorage.getItem("token");
//             const response = await fetch(`/api/${type}/${id}`, {
//               method: "DELETE",
//               headers: { Authorization: `Bearer ${token}` },
//             });
//             const data = await response.json();
//             if (!response.ok) {
//               throw new Error(data.error || `Failed to delete ${type}`);
//             }
//             await fetchData(true); // Force refresh after deletion
//             setNotification({
//               type: "success",
//               message:
//                 data.message || `${type.slice(0, -1)} deleted successfully!`,
//             });
//             setTimeout(() => setNotification(null), 3000);
//           } catch (error) {
//             console.error(`Error deleting ${type}:`, error);
//             setNotification({
//               type: "error",
//               message: error.message || `Failed to delete ${type}`,
//             });
//             setTimeout(() => setNotification(null), 3000);
//           } finally {
//             setConfirmDialog(null);
//           }
//         },
//         onCancel: () => {
//           setConfirmDialog(null);
//         },
//       });
//     },
//     [fetchData]
//   );

//   // Memoized sidebar items
//   const sidebarItems = useMemo(
//     () => [
//       { label: "Overview", menu: "overview", icon: HomeIcon },
//       { label: "Add Category", menu: "addCategory", icon: FolderPlusIcon },
//       { label: "Edit Categories", menu: "editCategory", icon: FolderPenIcon },
//       { label: "Add Product", menu: "addProduct", icon: PackagePlusIcon },
//       { label: "Edit Products", menu: "editProduct", icon: PackageOpenIcon },
//       { label: "Create Template", menu: "createTemplate", icon: FilePlus2Icon },
//       { label: "Edit Templates", menu: "editTemplate", icon: FilePenLineIcon },
//       { label: "Coupons", menu: "couponManagement", icon: TicketPercentIcon },
//       { label: "Orders", menu: "orders", icon: ShoppingBagIcon },
//       { label: "Media Manager", menu: "mediaManager", icon: ImageIcon },
//       { label: "Clients", menu: "clients", icon: UsersIcon },
//       { label: "Notifications", menu: "notifications", icon: BellIcon }, // New tab
//     ],
//     []
//   );

//   // Updated SidebarItem for a more refined look (modified for mobile behavior)
//   const SidebarItem = React.memo(({ label, menu, icon }) => (
//     <button
//       onClick={() => handleSidebarItemClick(menu)}
//       className={`w-full flex items-center justify-start text-left px-4 py-2 space-x-2 rounded transition-colors duration-200 ${
//         activeMenu === menu
//           ? "bg-blue-100 text-blue-600"
//           : "text-gray-600 hover:bg-gray-50"
//       }`}
//     >
//       {icon &&
//         React.cloneElement(icon, {
//           className: `h-5 w-5 ${
//             activeMenu === menu ? "text-blue-600" : "text-gray-500"
//           }`,
//         })}
//       <span>{label}</span>
//     </button>
//   ));

//   // Updated renderSidebar for wide screens: sticky with adjusted height and overflow
//   const renderSidebar = () => (
//     <div
//       className="w-full md:w-64 bg-white shadow-md overflow-y-auto md:sticky md:top-0"
//       style={{ height: "calc(100vh )",            
//         boxShadow: 'none', 
//         border: 'none', 
//       }}
//     >
//       <div className="p-4 border-b">
//         <h2 className="text-xl font-bold">Admin Dashboard</h2>
//       </div>
//       <nav className="flex flex-wrap gap-2 p-4 md:flex-col md:space-y-2 md:space-x-0"
//                   style={{ 
//                     boxShadow: 'none', 
//                     border: 'none', 
//                   }}>
//         {sidebarItems.map((item) => (
//           <SidebarItem
//             key={item.menu}
//             label={item.label}
//             menu={item.menu}
//             icon={<item.icon className="mr-2"/>}
//             style={{ 
//               boxShadow: 'none', 
//               border: 'none', 
//             }}
//           />
//         ))}
//       </nav>
//     </div>
//   );

//   const renderContent = () => {
//     switch (activeMenu) {
//       case "overview":
//         return <Overview />;
//       case "addCategory":
//       case "editCategory":
//         return (
//           <CategoryManagement
//             formData={formData.category}
//             setFormData={(data) =>
//               setFormData((prev) => ({ ...prev, category: data }))
//             }
//             onSubmit={() => handleSubmit("category")}
//             categories={categories}
//             onEdit={(item) => handleEdit(item, "category")}
//             onDelete={handleDelete}
//             isEdit={activeMenu === "editCategory"}
//             setNotification={setNotification}
//           />
//         );
//       case "addProduct":
//       case "editProduct":
//         return (
//           <ProductManagement
//             formData={formData.product}
//             setFormData={(data) =>
//               setFormData((prev) => ({ ...prev, product: data }))
//             }
//             onSubmit={() => handleSubmit("product")}
//             categories={categories}
//             products={products}
//             onEdit={(item) => handleEdit(item, "product")}
//             onDelete={handleDelete}
//             isEdit={activeMenu === "editProduct"}
//             setNotification={setNotification}
//           />
//         );
//       case "createTemplate":
//         return (
//           <TemplateDesigner
//             onSave={(template) => {
//               setFormData((prev) => ({ ...prev, template }));
//               handleSubmit("template");
//             }}
//             categories={categories}
//           />
//         );
//       case "editTemplate":
//         return (
//           <TemplateManagement
//             formData={formData.template}
//             setFormData={(data) =>
//               setFormData((prev) => ({ ...prev, template: data }))
//             }
//             onSubmit={() => handleSubmit("template")}
//             categories={categories}
//             templates={templates}
//             onEdit={(item) => handleEdit(item, "template")}
//             onDelete={handleDelete}
//             isEdit={activeMenu === "editTemplate"}
//             setNotification={setNotification}
//           />
//         );
//       case "orders":
//         return <OrderManagement />;
//       case "couponManagement":
//         return <CouponManagement />;
//       case "mediaManager":
//         return <MediaManager />;
//       case "clients":
//         return <ClientsManagement />;
//       case "notifications":
//         return <NotificationsManagement />;
//       default:
//         return null;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <img src='../images/loading.gif'/>
//       </div>
//     );
//   }

//   return (
//     <>
//       {isMobile && (
//         <div className="p-4 bg-white shadow-md flex items-center justify-between md:hidden">
//           {mobileSidebarVisible ? (
//             <>
//               <span className="text-xl font-bold">Menu</span>
//               <button
//                 onClick={() => setMobileSidebarVisible(false)}
//                 className="text-xl font-bold"
//               >
//                 X
//               </button>
//             </>
//           ) : (
//             <>
//               <span className="text-xl font-bold">Admin Dashboard</span>
//               <button
//                 onClick={() => setMobileSidebarVisible(true)}
//                 className="text-xl font-bold"
//               >
//                 ≡
//               </button>
//             </>
//           )}
//         </div>
//       )}
//       <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
//         {!isMobile && renderSidebar()}
//         {isMobile && mobileSidebarVisible && (
//           <div className="fixed inset-0 z-40">{renderSidebar()}</div>
//         )}
//         <div className="flex-1 p-8">
//           {mobileLoading && (
//             <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
//               {/* <Loader2Icon className="h-12 w-12 animate-spin text-blue-500" />
//               <span className="mt-4 text-xl font-medium text-blue-500">
//                 Loading...
//               </span> */}
//              <img src='../images/loading.gif'/>

//             </div>
//           )}
//           {renderContent()}
//         </div>
//       </div>
//     </>
//   );
// };

// export default AdminDashboard;
