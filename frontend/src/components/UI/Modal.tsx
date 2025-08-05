import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  // The outer div acts as the translucent background and listens for clicks.
  // Clicking this background will trigger the onClose function.
  // The inner div is the actual modal content container.
  // We use e.stopPropagation() on the inner div to prevent clicks inside the
  // modal content from bubbling up and accidentally closing the modal.
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-sans"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg transition-all duration-300 transform scale-95" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* The close button for the modal, positioned in the top-right corner */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 focus:outline-none"
        >
          {/* Close icon using inline SVG for easy styling and no external dependencies */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* This is where the children (the modal content) will be rendered */}
        {children}
      </div>
    </div>
  );
};

export default Modal;