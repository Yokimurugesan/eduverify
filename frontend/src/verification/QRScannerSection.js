import React, { useState, useEffect } from 'react';
import { FaQrcode, FaCamera } from 'react-icons/fa';

const QRScannerSection = ({ onScanComplete, isVerifying }) => {
  const [isScanning, setIsScanning] = useState(false);

  // Simulate scanning process
  useEffect(() => {
    let timer;
    if (isScanning) {
      timer = setTimeout(() => {
        setIsScanning(false);
        if (onScanComplete) onScanComplete('MOCK_QR_DATA_123');
      }, 3000); // 3 seconds to "scan"
    }
    return () => clearTimeout(timer);
  }, [isScanning, onScanComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
      
      {!isScanning && !isVerifying ? (
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex flex-col items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => setIsScanning(true)}>
            <FaCamera className="text-3xl" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Scan QR Code</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
            Point your camera at the QR code on the certificate to verify its authenticity.
          </p>
          <button 
            onClick={() => setIsScanning(true)}
            className="btn-primary py-2 px-6 text-sm"
          >
            Start Camera Scanner
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-sm aspect-square bg-gray-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
          {/* Mock Camera Viewfinder */}
          <div className="absolute inset-8 border-2 border-white opacity-30 rounded-lg"></div>
          
          {/* Corner Markers */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
          <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
          
          <FaQrcode className="text-white opacity-20 text-6xl" />

          {/* Animated Scanning Line */}
          <div className="scan-line"></div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm shadow-sm pointer-events-none">
              Scanning code... hold steady
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScannerSection;
