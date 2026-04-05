import React, { useState, useCallback } from 'react';
import { FaCloudUploadAlt, FaFileAlt, FaCheckCircle, FaTimesCircle, FaSpinner, FaQrcode } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const UploadDocument = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [semester, setSemester] = useState('Semester 1'); // Default to Semester 1
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setVerificationResult(null);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setVerificationResult(null);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setSemester('Semester 1');
    setVerificationResult(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setVerificationResult(null);
    
    const formData = new FormData();
    formData.append('type', 'marksheet'); 
    formData.append('semester', semester);
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Show auto-verification result
      setVerificationResult(response.data);
      setIsUploading(false);
      
      if (onUploadComplete) {
        setTimeout(() => onUploadComplete(), 2000);
      }
      
    } catch (err) {
      alert("Upload failed: " + (err.response?.data || err.message));
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in-up w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Upload New Certificate</h3>
        <p className="text-sm text-gray-500 mt-1">
          Accepted formats: PDF, JPG, PNG (Max 5MB) • Auto-verified on upload
        </p>
      </div>

      {/* Verification Result Card */}
      {verificationResult && (
        <div className={`mb-6 rounded-xl border-2 p-6 animate-fade-in-up ${
          verificationResult.status === 'verified' 
            ? 'border-green-300 bg-green-50' 
            : verificationResult.status === 'pending'
              ? 'border-blue-300 bg-blue-50'
              : 'border-red-300 bg-red-50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {verificationResult.status === 'verified' && <FaCheckCircle className="text-3xl text-green-600" />}
            {verificationResult.status === 'rejected' && <FaTimesCircle className="text-3xl text-red-600" />}
            {verificationResult.status === 'pending' && <FaSpinner className="text-3xl text-blue-600 animate-spin" />}
            <div>
              <h4 className={`text-lg font-bold ${
                verificationResult.status === 'verified' ? 'text-green-800' : 
                verificationResult.status === 'rejected' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {verificationResult.status === 'verified' && '✅ Document Auto-Verified!'}
                {verificationResult.status === 'rejected' && '❌ Document Auto-Rejected'}
                {verificationResult.status === 'pending' && '⏳ Confirmation Required'}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {verificationResult.message}
              </p>
              <div className="flex gap-2 mb-2">
                 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{verificationResult.semester || semester}</span>
              </div>
              {verificationResult.extractedData ? (
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded-lg border border-blue-100 flex flex-wrap gap-4 text-xs font-medium">
                  <div><span className="text-gray-500 mr-1">Extracted Name:</span> <span className="text-gray-900">{verificationResult.extractedData.name || 'Not Found'}</span></div>
                  <div><span className="text-gray-500 mr-1">Extracted CGPA:</span> <span className="text-blue-600 font-bold">{verificationResult.extractedData.cgpa || 'Not Found'}</span></div>
                </div>
              ) : (
                verificationResult.type === 'marksheet' && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Note: No specific data could be extracted from this document via OCR.
                  </div>
                )
              )}
            </div>
          </div>

          {verificationResult.rejectionReason && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-800">
                Reason: {verificationResult.rejectionReason}
              </p>
            </div>
          )}

          {verificationResult.qrCode && (
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FaQrcode className="text-green-600" />
                <span className="text-sm font-semibold text-green-800">Verification QR Code</span>
              </div>
              <img 
                src={verificationResult.qrCode} 
                alt="Verification QR Code" 
                className="mx-auto w-48 h-48 rounded-lg shadow-md"
              />
              <p className="text-xs text-gray-500 mt-2">
                Scan this QR code to publicly verify the document
              </p>
            </div>
          )}

          <button 
            onClick={resetUpload}
            className="w-full mt-4 btn-secondary py-2 text-sm"
          >
            Upload Another Document
          </button>
        </div>
      )}

      {/* Upload Area (hidden after result) */}
      {!verificationResult && (
        <div className="space-y-6">
          {/* Semester Selection */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <label className="block text-sm font-semibold text-gray-700 mb-2">Target Semester</label>
             <div className="grid grid-cols-2 gap-2">
                {semesters.map(sem => (
                  <button
                    key={sem}
                    type="button" 
                    onClick={() => setSemester(sem)}
                    className={`py-2 px-3 text-sm font-bold rounded-lg transition-all ${
                      semester === sem 
                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {sem}
                  </button>
                ))}
             </div>
          </div>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:bg-gray-100'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex justify-center mb-4">
                <FaCloudUploadAlt className={`text-5xl ${isDragging ? 'text-blue-500 animate-bounce' : 'text-gray-400'}`} />
              </div>
              <p className="text-lg font-medium mb-1">
                Drag & Drop your document here
              </p>
              <p className="text-sm mb-4">or</p>
              <label className="cursor-pointer">
                <span className="btn-secondary inline-block">Browse Files</span>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="bg-white border text-center border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <FaFileAlt className="text-2xl" />
                </div>
                <div className="text-left flex-1 truncate">
                  <p className="font-semibold text-gray-900 truncate" title={file.name}>{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB • <span className="text-blue-600 font-bold">{semester}</span></p>
                </div>
                {!isUploading && (
                  <button 
                    onClick={resetUpload}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    Clear
                  </button>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 font-medium md:px-2">
                    <span className="flex items-center gap-2"><FaSpinner className="animate-spin text-blue-500" /> Uploading & Verifying...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-200 relative overflow-hidden" 
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-[slideRight_1s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Running automated verification checks...</p>
                </div>
              ) : (
                <button 
                  onClick={uploadFile}
                  className="w-full btn-primary py-3"
                >
                  Upload {semester} Document
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default UploadDocument;
