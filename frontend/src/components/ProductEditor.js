import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import axios from "axios";

const ProductEditor = () => {
    const canvasRef = useRef(null);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const canvas = new fabric.Canvas("productCanvas", {
            width: 400,
            height: 400,
            backgroundColor: "#fff"
        });
        canvasRef.current = canvas;

        return () => {
            canvas.dispose();
        };
    }, []);

    const addText = () => {
        const text = new fabric.Text("Your Text", { left: 50, top: 50 });
        canvasRef.current.add(text);
    };

    const addToCart = () => {
        setCart([...cart, "Customized Product"]);
    };

    return (
        <div>
            <h1>Custom Packaging Store</h1>
            <canvas id="productCanvas"></canvas>
            <button onClick={addText}>Add Text</button>
            <button onClick={addToCart}>Add to Cart</button>
            <h3>Cart ({cart.length} items)</h3>
        </div>
    );
};

export default ProductEditor;
