import React, { useEffect, useState, useRef } from 'react';
import { fabric } from 'fabric';

const ProductViewTransformer = ({ 
  frontCanvas,
  rotatedImageUrl,
  canvasVersion
}) => {
  const [rotatedCanvas, setRotatedCanvas] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      selection: false,
      interactive: false
    });
    
    setRotatedCanvas(canvas);
    return () => canvas.dispose();
  }, []);


  const calculateTransform = (obj, width, height) => {
    const horizontalAngle = 8;    // Reduced from 10 for more subtle rotation
    const verticalAngle = 1.5;    // Reduced from 2
  
    const relX = obj.left / width;
    const relY = obj.top / height;
  
    const bagTransform = {
      front: {
        scaleX: 0.96,
        scaleY: 0.98,
        skewX: 0.06,
        skewY: 0.02,
        offsetX: -20,      // Changed from -30 to -20 (moves everything right)
        offsetY: -15
      },
      side: {
        scaleX: 0.22,
        scaleY: 0.98,
        skewX: -0.10,      // Reduced from -0.12
        skewY: 0.02
      },
      depth: 0.1
    };
  
    const newX = width * (
      relX * bagTransform.front.scaleX + 
      relY * bagTransform.front.skewX +
      (1 - relX) * bagTransform.side.scaleX * 0.10  // Reduced from 0.12
    ) + bagTransform.front.offsetX;
  
    const newY = height * (
      relY * bagTransform.front.scaleY +
      relX * bagTransform.front.skewY +
      (1 - relY) * bagTransform.side.skewY * 0.06
    ) + bagTransform.front.offsetY;
  
    const perspectiveScale = 1 - (relY * bagTransform.depth);
  
    const isText = obj.type === 'text' || obj.type === 'i-text';
    const textAdjustment = isText ? {
      skewX: horizontalAngle * (relY * 0.4),    // Reduced from 0.5
      skewY: verticalAngle * (relX * 0.2),      // Reduced from 0.3
      charSpacing: obj.charSpacing ? obj.charSpacing * (1 + relY * 0.12) : 0,
      left: newX - 8      // Reduced from -12 to move text more right
    } : {};
  
    return {
      left: isText ? textAdjustment.left : newX,
      top: newY,
      scaleX: obj.scaleX * perspectiveScale * bagTransform.front.scaleX,
      scaleY: obj.scaleY * perspectiveScale * bagTransform.front.scaleY,
      angle: obj.angle + (horizontalAngle * relY * 0.5) + (verticalAngle * relX * 0.5),  // Reduced from 0.7
      opacity: Math.max(0.9, 1 - relY * 0.1),
      ...(isText ? {
        skewX: textAdjustment.skewX,
        skewY: textAdjustment.skewY,
        charSpacing: textAdjustment.charSpacing
      } : {})
    };
  };
  
//   const calculateTransform = (obj, width, height) => {
//     const horizontalAngle = 10;  
//     const verticalAngle = 2;     
  
//     const relX = obj.left / width;
//     const relY = obj.top / height;
  
//     const bagTransform = {
//       front: {
//         scaleX: 0.96,      // More subtle scaling
//         scaleY: 0.98,      // More subtle scaling
//         skewX: 0.06,       // Reduced skew
//         skewY: 0.02,       // Reduced skew
//         offsetX: -30,      // Reduced offset
//         offsetY: -5        // Reduced offset
//       },
//       side: {
//         scaleX: 0.22,      // More subtle side effect
//         scaleY: 0.98,
//         skewX: -0.12,      // Reduced skew
//         skewY: 0.02
//       },
//       depth: 0.1           // More subtle depth
//     };
  
//     const newX = width * (
//       relX * bagTransform.front.scaleX + 
//       relY * bagTransform.front.skewX +
//       (1 - relX) * bagTransform.side.scaleX * 0.12
//     ) + bagTransform.front.offsetX;
  
//     const newY = height * (
//       relY * bagTransform.front.scaleY +
//       relX * bagTransform.front.skewY +
//       (1 - relY) * bagTransform.side.skewY * 0.06
//     ) + bagTransform.front.offsetY;
  
//     const perspectiveScale = 1 - (relY * bagTransform.depth);
  
//     const isText = obj.type === 'text' || obj.type === 'i-text';
//     const textAdjustment = isText ? {
//       skewX: horizontalAngle * (relY * 0.5),    // More subtle text skew
//       skewY: verticalAngle * (relX * 0.3),      // More subtle text skew
//       charSpacing: obj.charSpacing ? obj.charSpacing * (1 + relY * 0.12) : 0,
//       left: newX - 12     // Reduced offset
//     } : {};
  
//     return {
//       left: isText ? textAdjustment.left : newX,
//       top: newY,
//       scaleX: obj.scaleX * perspectiveScale * bagTransform.front.scaleX,
//       scaleY: obj.scaleY * perspectiveScale * bagTransform.front.scaleY,
//       angle: obj.angle + (horizontalAngle * relY * 0.7) + (verticalAngle * relX * 0.7),
//       opacity: Math.max(0.9, 1 - relY * 0.1),    // Even more subtle opacity change
//       ...(isText ? {
//         skewX: textAdjustment.skewX,
//         skewY: textAdjustment.skewY,
//         charSpacing: textAdjustment.charSpacing
//       } : {})
//     };
//   };

  useEffect(() => {
    if (!rotatedCanvas || !frontCanvas || !rotatedImageUrl) return;

    const updateRotatedView = async () => {
      rotatedCanvas.clear();

      // Load background image
      await new Promise((resolve) => {
        fabric.Image.fromURL(rotatedImageUrl, (img) => {
          const scale = Math.min(
            rotatedCanvas.width / img.width,
            rotatedCanvas.height / img.height
          ) * 0.9;

          img.set({
            scaleX: scale,
            scaleY: scale,
            left: (rotatedCanvas.width - img.width * scale) / 2,
            top: (rotatedCanvas.height - img.height * scale) / 2,
            selectable: false,
            evented: false
          });

          rotatedCanvas.setBackgroundImage(img, rotatedCanvas.renderAll.bind(rotatedCanvas));
          resolve();
        });
      });

      // Group objects by their vertical position
      const objects = frontCanvas.getObjects()
        .filter(obj => obj !== frontCanvas.backgroundImage)
        .sort((a, b) => a.top - b.top);

      // Transform and add objects
      for (const obj of objects) {
        await new Promise((resolve) => {
          obj.clone((clonedObj) => {
            const transformedProps = calculateTransform(
              obj,
              frontCanvas.width,
              frontCanvas.height
            );

            clonedObj.set({
              ...transformedProps,
              selectable: false,
              evented: false
            });

            rotatedCanvas.add(clonedObj);
            resolve();
          });
        });
      }

      rotatedCanvas.renderAll();
    };

    updateRotatedView();
  }, [frontCanvas, rotatedCanvas, rotatedImageUrl, canvasVersion]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="border rounded" />
    </div>
  );
};

export default ProductViewTransformer;