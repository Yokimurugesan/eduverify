import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaFilePdf, FaBalanceScale, FaUserGraduate, FaRobot, FaClipboardList, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../apiConfig';

const ComparisonModal = ({ docId, onClose }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${API_BASE_URL}/comparison/${docId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (docId) fetchComparison();
  }, [docId]);

  const handleRunOcr = async () => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem('accessToken');
        await axios.post(`${API_BASE_URL}/admin/process-ocr/${docId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const res = await axios.get(`${API_BASE_URL}/comparison/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
    } catch (err) {
        alert("OCR failed: " + (err.response?.data || err.message));
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-xl">
      <div className="bg-white p-12 rounded-[40px] shadow-2xl flex flex-col items-center gap-8 border border-white/20">
        <div className="relative">
            <div className="w-24 h-24 border-8 border-indigo-100 rounded-full"></div>
            <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-center animate-pulse">
            <h4 className="text-gray-900 font-black text-2xl mb-2 italic">Analyzing Integrity...</h4>
            <p className="text-gray-500 font-medium">Cross-matching OCR data with student input.</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] backdrop-blur-xl">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full border-4 border-red-50">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-red-100 p-3 rounded-2xl text-red-600">
             <FaExclamationTriangle className="text-2xl" />
          </div>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><FaTimes /></button>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">{typeof error === 'string' ? error : "Could not fetch verification comparison data."}</p>
        <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black tracking-wide hover:bg-gray-800 transition-all shadow-xl active:scale-95">Close & Return</button>
      </div>
    </div>
  );

  const isMatched = (field) => {
    if (!data.formData || !data.ocrData) return false;
    let ocrVal = data.ocrData[field];
    let formVal = data.formData[field];
    if (field === 'cgpa') {
        ocrVal = parseFloat(ocrVal || 0).toFixed(2);
        formVal = parseFloat(formVal || 0).toFixed(2);
    }
    return ocrVal && formVal && ocrVal.toString().toLowerCase() === formVal.toString().toLowerCase();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-4 sm:p-8 backdrop-blur-2xl overflow-hidden">
      <div className="bg-[#f8fafc] w-full max-w-6xl h-full sm:h-auto sm:max-h-[92vh] rounded-[32px] sm:rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/20">
        
        {/* Fixed Header */}
        <div className="bg-white px-6 sm:px-10 py-6 sm:py-8 flex justify-between items-center border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4 sm:gap-5">
             <div className="bg-indigo-600 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <FaBalanceScale className="text-xl sm:text-2xl" />
             </div>
             <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Verification Audit Log</h3>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Security Panel v2.0</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full invisible sm:visible"></span>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-tight invisible sm:visible">System Integrity Check</p>
                </div>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="group bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 active:scale-90"
            title="Esc - Close"
          >
            <FaTimes className="text-xl sm:text-2xl group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        {!data.ocrData ? (
             <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center text-orange-400 mb-6 border-4 border-white shadow-xl shadow-orange-100">
                    <FaInfoCircle className="text-4xl" />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">AI Extraction Missing</h4>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                    This document was from an older system and hasn't been scanned by our AI engine yet.
                </p>
                <button 
                    onClick={handleRunOcr}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-3xl font-black shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] transition-all active:scale-95 flex items-center gap-4 group"
                >
                    <FaBalanceScale className="group-hover:scale-125 transition-transform" /> Trigger AI Scan & Re-Sync
                </button>
             </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-8 sm:space-y-10">
                
                {/* Overall Identity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5">
                       <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                           <FaUserGraduate className="text-xl sm:text-2xl" />
                       </div>
                       <div className="min-w-0">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated Student</p>
                           <p className="text-md sm:text-lg font-black text-gray-800 tracking-tight truncate">{data.studentDetail?.name}</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5">
                       <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                           data.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                       }`}>
                           {data.status === 'verified' ? <FaCheckCircle /> : <FaExclamationTriangle className="animate-bounce" />}
                       </div>
                       <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Verification</p>
                           <p className={`text-md sm:text-lg font-black tracking-tight ${
                               data.status === 'verified' ? 'text-emerald-600' : 'text-rose-600'
                           }`}>{data.status.toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5">
                       <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                           <FaClipboardList className="text-xl sm:text-2xl" />
                       </div>
                       <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sync Authority</p>
                           <p className="text-md sm:text-lg font-black text-gray-800 tracking-tight">{data.formStatus.toUpperCase()}</p>
                       </div>
                    </div>
                </div>

                {/* Main Comparison Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
                    
                    {/* Visual Comparison Cards */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Field-by-Field Analysis</h4>
                            <span className="text-[10px] bg-gray-900 text-white px-2.5 py-1 rounded-full font-bold">1:1 Check</span>
                        </div>
                        
                        {[
                            { label: 'Full Student Name', key: 'name', icon: <FaUserGraduate /> },
                            { label: 'Cumulative CGPA', key: 'cgpa', icon: <FaBalanceScale /> },
                            { label: 'Current Semester', key: 'semester', icon: <FaInfoCircle /> }
                        ].map((field, idx) => (
                            <div key={idx} className="group relative bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                <div className="flex justify-between items-start mb-5 sm:mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {field.icon}
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider">{field.label}</span>
                                    </div>
                                    <div className={`p-2 rounded-lg sm:p-2.5 sm:rounded-xl ${
                                        isMatched(field.key) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 pulse-warning'
                                    }`}>
                                        {isMatched(field.key) ? <FaCheckCircle className="text-md sm:text-lg" /> : <FaExclamationTriangle className="text-md sm:text-lg" />}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 sm:gap-8 relative">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-50 group-hover:bg-indigo-50 transition-colors"></div>
                                    
                                    <div className="min-w-0">
                                        <p className="text-[8px] sm:text-[9px] font-bold text-blue-500 uppercase mb-2 flex items-center gap-1.5"><FaRobot /> AI Data</p>
                                        <p className="text-sm sm:text-md font-black text-gray-900 leading-tight truncate">
                                            {field.key === 'cgpa' && data.ocrData?.[field.key] ? parseFloat(data.ocrData[field.key]).toFixed(2) : data.ocrData?.[field.key] || '—'}
                                        </p>
                                    </div>
                                    
                                    <div className="text-right min-w-0">
                                        <p className="text-[8px] sm:text-[9px] font-bold text-indigo-500 uppercase mb-2 flex items-center justify-end gap-1.5">Student <FaClipboardList /></p>
                                        <p className="text-sm sm:text-md font-black text-gray-900 leading-tight truncate">
                                            {data.formData?.[field.key] ? 
                                                (field.key === 'cgpa' ? parseFloat(data.formData[field.key]).toFixed(2) : data.formData[field.key]) 
                                                : <span className="text-gray-300 italic font-medium">Waiting...</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Side: PDF Preview Info */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-[40px] border border-gray-100 p-8 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group hover:shadow-2xl transition-all duration-500 flex-grow md:min-h-[400px]">
                            {/* Decorative Background Icon */}
                            <FaFilePdf className="absolute -top-10 -right-10 text-[150px] sm:text-[200px] text-gray-50 group-hover:text-rose-50/50 transition-colors duration-700 rotate-12" />
                            
                            <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-50 rounded-[28px] sm:rounded-[32px] flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-rose-100">
                                    <FaFilePdf className="text-3xl sm:text-4xl" />
                                </div>
                                
                                <div className="text-center space-y-2">
                                    <h5 className="text-xl sm:text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Original Submission</h5>
                                    <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                                        Audit evidence from student is available for certification.
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => window.open(`${BACKEND_URL}/uploads/${data.fileName || docId}`, '_blank')}
                                    className="bg-gray-900 group-hover:bg-rose-600 text-white w-full sm:w-auto px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-black tracking-widest text-[10px] sm:text-xs uppercase shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Review Marksheet <FaEye className="text-lg" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

        {/* Sticky Footer */}
        <div className="bg-white px-6 sm:px-10 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>
                 <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Live Accountability Check Active</span>
             </div>
             <p className="text-[8px] sm:text-[10px] font-bold text-gray-300 uppercase">© 2026 EduVerify | Secure Student Auditing</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-zoom-in { animation: zoom-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.9) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .pulse-warning { animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 
            0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: #e2e8f0; 
            border-radius: 10px; 
            border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        body { overflow: hidden; }
      `}} />
    </div>
  );
};

export default ComparisonModal;
