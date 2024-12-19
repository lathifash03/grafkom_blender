"use strict";

let rotation = { x: 0, y: 0 }; // Global rotation
let zoom = 1; // Global zoom
let isDragging = false; // State to track mouse dragging
let lastMousePosition = { x: 0, y: 0 }; // Last mouse position

function createHandler(canvas) {
  // Mouse Down Event
  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastMousePosition.x = e.clientX;
    lastMousePosition.y = e.clientY;
  });

  // Mouse Move Event
  canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePosition.x;
      const deltaY = e.clientY - lastMousePosition.y;

      rotation.x += deltaY * 0.01; // Update rotation x
      rotation.y += deltaX * 0.01; // Update rotation y

      lastMousePosition.x = e.clientX;
      lastMousePosition.y = e.clientY;
    }
  });

  // Mouse Up Event
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Scroll Event for Zoom
  canvas.addEventListener("wheel", (e) => {
    zoom += e.deltaY * -0.001; 
    zoom = Math.min(Math.max(0.5, zoom), 3); 
    e.preventDefault();
  });
}