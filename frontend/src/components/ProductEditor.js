
import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { fabric } from "fabric";
import axios from "axios";

// Cart Context for Global Cart Management
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const ProductEditor = () => {
    const canvasRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { cart, setCart } = useCart();

    useEffect(() => {
        axios.get("/api/products").then(response => {
            setProducts(response.data);
            if (response.data.length > 0) {
                setSelectedProduct(response.data[0]);
            }
        });
    }, []);

    useEffect(() => {
        const canvas = new fabric.Canvas("productCanvas", {
            width: 400,
            height: 400,
            backgroundColor: "#fff"
        });
        canvasRef.current = canvas;
        return () => canvas.dispose();
    }, []);

    const addText = () => {
        const text = new fabric.Text("Your Text", { left: 50, top: 50 });
        canvasRef.current.add(text);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            fabric.Image.fromURL(e.target.result, (img) => {
                img.scale(0.5);
                canvasRef.current.add(img);
            });
        };
        reader.readAsDataURL(file);
    };

    const addToCart = () => {
        const imageData = canvasRef.current.toDataURL();
        setCart([...cart, { product: selectedProduct, customization: imageData }]);
    };

    return (
        <div>
            <h1>Custom Packaging Store</h1>
            <select onChange={(e) => setSelectedProduct(products.find(p => p._id === e.target.value))}>
                {products.map(product => (
                    <option key={product._id} value={product._id}>{product.name}</option>
                ))}
            </select>
            <canvas id="productCanvas"></canvas>
            <input type="file" onChange={handleImageUpload} />
            <button onClick={addText}>Add Text</button>
            <button onClick={addToCart}>Add to Cart</button>
            <h3>Cart ({cart.length} items)</h3>
        </div>
    );
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    return (
        <CartContext.Provider value={{ cart, setCart }}>
            {children}
        </CartContext.Provider>
    );
};

export default ProductEditor;


// import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
// import axios from "axios";

// const ProductEditor = () => {
//     const canvasRef = useRef(null);
//     const [cart, setCart] = useState([]);

//     useEffect(() => {
//         const canvas = new fabric.Canvas("productCanvas", {
//             width: 400,
//             height: 400,
//             backgroundColor: "#fff"
//         });
//         canvasRef.current = canvas;

//         return () => {
//             canvas.dispose();
//         };
//     }, []);

//     const addText = () => {
//         const text = new fabric.Text("Your Text", { left: 50, top: 50 });
//         canvasRef.current.add(text);
//     };

//     const addToCart = () => {
//         setCart([...cart, "Customized Product"]);
//     };

//     return (
//         <div>
//             <h1>Custom Packaging Store</h1>
//             <canvas id="productCanvas"></canvas>
//             <button onClick={addText}>Add Text</button>
//             <button onClick={addToCart}>Add to Cart</button>
//             <h3>Cart ({cart.length} items)</h3>
//         </div>
//     );
// };

// export default ProductEditor;
