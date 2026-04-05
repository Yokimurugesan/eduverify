import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaFilePdf, FaBalanceScale, FaUserGraduate, FaRobot, FaClipboardList, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const ComparisonPage = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrityStatus, setIntegrityStatus] = useState({ status: 'checking', message: 'Verifying Hash...' });

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${API_BASE_URL}/comparison/${docId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
        setError(null);
        
        // After fetching data, check file integrity
        try {
          const intRes = await axios.get(`${API_BASE_URL}/check-integrity/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIntegrityStatus({ status: intRes.data.integrity, message: intRes.data.message });
        } catch (intErr) {
          setIntegrityStatus({ status: 'ERROR', message: 'Integrity Check Failed' });
        }
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

  const isMatched = (field) => {
    if (!data.formData || !data.ocrData) return false;
    let ocrVal = data.ocrData[field];
    let formVal = data.formData[field];
    
    if (field === 'cgpa') {
        ocrVal = parseFloat(ocrVal || 0).toFixed(2);
        formVal = parseFloat(formVal || 0).toFixed(2);
    }
    return ocrVal && formVal && ocrVal.toString().toLowerCase().trim() === formVal.toString().toLowerCase().trim();
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 border border-white/20">
        <div className="relative">
            <div className="w-24 h-24 border-8 border-indigo-100 rounded-full"></div>
            <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-center animate-pulse">
            <h4 className="text-gray-900 font-black text-2xl mb-2 italic">Analyzing Integrity...</h4>
            <p className="text-gray-500 font-medium text-sm">Cross-matching OCR data with student input.</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full border-4 border-red-50">
        <div className="bg-red-100 p-3 rounded-2xl text-red-600 w-fit mb-6">
            <FaExclamationTriangle className="text-2xl" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Sync Error</h3>
        <p className="text-gray-600 mb-8 leading-relaxed text-sm">{typeof error === 'string' ? error : "Could not fetch verification comparison data."}</p>
        <button onClick={() => navigate('/admin/dashboard')} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black tracking-wide hover:bg-gray-800 transition-all shadow-xl active:scale-95">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Premium Navigation Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm px-6 sm:px-12 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="group flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-all font-black text-sm uppercase tracking-widest"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FaArrowLeft className="text-sm" />
              </div>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            
            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600">
                <FaBalanceScale className="text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase italic">Auditor Console</h1>
                <p className="text-[10px] font-bold text-indigo-500/60 mt-1 uppercase tracking-wider">Secure Document Certification</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className={`hidden lg:flex items-center gap-3 px-6 py-3 bg-white border rounded-2xl shadow-sm ${
                 integrityStatus.status === 'VALID' ? 'border-emerald-100' : 
                 integrityStatus.status === 'TAMPERED' ? 'border-rose-500 bg-rose-50' : 'border-gray-100'
             }`}>
                 <div className={`w-2.5 h-2.5 rounded-full ${
                     integrityStatus.status === 'VALID' ? 'bg-emerald-500' : 
                     integrityStatus.status === 'TAMPERED' ? 'bg-rose-600 animate-ping' : 'bg-gray-300'
                 }`}></div>
                 <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                     integrityStatus.status === 'TAMPERED' ? 'text-rose-700' : 'text-gray-500'
                 }`}>
                     File Integrity: {integrityStatus.message}
                 </span>
             </div>
             {data.status === 'verified' ? (
                <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-fade-in">
                    <FaCheckCircle className="text-lg" />
                    <span className="text-xs font-black uppercase tracking-wider">Integrity Confirmed</span>
                </div>
             ) : (
                <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl flex items-center gap-3 border border-rose-100 animate-pulse">
                    <FaExclamationTriangle className="text-lg" />
                    <span className="text-xs font-black uppercase tracking-wider">Mismatch Detected</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto mt-12 px-6 sm:px-12 animate-zoom-in">
          {!data.ocrData ? (
             <div className="bg-white rounded-[48px] border border-gray-100 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center text-orange-400 mb-6 border-4 border-white shadow-xl shadow-orange-100">
                    <FaInfoCircle className="text-4xl" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic">Legacy Data Detected</h4>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-12 leading-relaxed font-medium">
                    This document hasn't been scanned by our AI accountability engine yet. Start the process now.
                </p>
                <button 
                    onClick={handleRunOcr}
                    className="bg-indigo-600 hover:bg-black text-white px-12 py-5 rounded-3xl font-black shadow-[0_20px_40px_-5px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center gap-4 group"
                >
                    <FaBalanceScale className="group-hover:rotate-12 transition-transform" /> Trigger AI Scan & Re-Sync
                </button>
             </div>
          ) : (
            <div className="space-y-12">
                {/* Global Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[36px] shadow-sm border border-gray-50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
                       <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center text-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                           <FaUserGraduate className="text-2xl" />
                       </div>
                       <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Student Record</p>
                           <p className="text-xl font-black text-gray-900 tracking-tight leading-none">{data.studentDetail?.name}</p>
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-[36px] shadow-sm border border-gray-50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
                       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all transform group-hover:-rotate-6 ${
                           data.status === 'verified' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                       }`}>
                           {data.status === 'verified' ? <FaCheckCircle /> : <FaExclamationTriangle className="animate-bounce" />}
                       </div>
                       <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Verification Verdict</p>
                           <p className={`text-xl font-black tracking-tight leading-none ${
                               data.status === 'verified' ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-rose-600 group-hover:text-rose-700'
                           }`}>{data.status.toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-[36px] shadow-sm border border-gray-50 flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
                       <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
                           <FaClipboardList className="text-2xl" />
                       </div>
                       <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Authority Status</p>
                           <p className="text-xl font-black text-gray-900 tracking-tight leading-none">{data.formStatus.toUpperCase()}</p>
                       </div>
                    </div>
                </div>

                {/* Main Audit Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* Left: Component-wise Audit */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between mb-2">
                           <div className="bg-gray-900 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 italic">
                              <FaRobot /> Forensic Extraction Results
                           </div>
                           <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Confidence: Grade A</span>
                        </div>
                        
                        {[
                            { label: 'GPA Calculation', key: 'cgpa', icon: <FaBalanceScale />, desc: 'Cumulative total from extraction' },
                            { label: 'Semester Identifier', key: 'semester', icon: <FaInfoCircle />, desc: 'Current term reference matches' }
                        ].map((field, idx) => (
                            <div key={idx} className="bg-white rounded-[40px] border border-gray-100 p-10 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative group">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                                            {field.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider italic leading-none">{field.label}</h4>
                                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{field.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${
                                        isMatched(field.key) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 pulse-warning'
                                    }`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{isMatched(field.key) ? 'Consistent' : 'Discrepancy'}</span>
                                        {isMatched(field.key) ? <FaCheckCircle /> : <FaExclamationTriangle className="animate-bounce" />}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-50 group-hover:bg-indigo-50 hidden md:block transition-all"></div>
                                    
                                    <div className="bg-[#fbfcff] p-6 rounded-3xl border border-blue-50/50">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FaRobot className="text-xs" /> AI Forensic Proof</p>
                                        <p className="text-2xl font-black text-gray-900 italic tracking-tight">
                                            {field.key === 'cgpa' && data.ocrData?.[field.key] ? parseFloat(data.ocrData[field.key]).toFixed(2) : data.ocrData?.[field.key] || 'N/A'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-[#fdfdff] p-6 rounded-3xl border border-indigo-50/50 text-right group-hover:bg-white transition-all">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center justify-end gap-2">Student Declaration <FaClipboardList className="text-xs" /></p>
                                        <p className="text-2xl font-black text-gray-900 italic tracking-tight">
                                            {data.formData?.[field.key] ? 
                                                (field.key === 'cgpa' ? parseFloat(data.formData[field.key]).toFixed(2) : data.formData[field.key]) 
                                                : <span className="text-gray-200">Awaiting...</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Side: PDF Viewer Summary */}
                    <div className="flex flex-col gap-10 lg:sticky lg:top-36 h-fit">
                        <div className="bg-white rounded-[56px] border-2 border-gray-100 p-12 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 min-h-[500px]">
                            {/* Animated Background Gradients */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-50/30 rounded-full blur-3xl group-hover:bg-rose-100/50 transition-all duration-700"></div>
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-all duration-700"></div>
                            
                            <FaFilePdf className="absolute bottom-10 right-10 text-[200px] text-gray-50/30 group-hover:text-rose-100/20 transition-all duration-700 transform rotate-12 group-hover:scale-125" />
                            
                            <div className="relative z-10 flex flex-col items-center gap-10">
                                <div className="w-32 h-32 bg-rose-50 rounded-[44px] flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-[0_25px_50px_-12px_rgba(244,63,94,0.3)] border-8 border-white">
                                    <FaFilePdf className="text-5xl" />
                                </div>
                                
                                <div className="text-center space-y-4">
                                    <h5 className="text-4xl font-black text-gray-900 italic tracking-tighter uppercase leading-none">Security Evidence</h5>
                                    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[300px] mx-auto uppercase tracking-wide">
                                        Original student mark sheet is ready for forensic physical auditing.
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        const token = localStorage.getItem('accessToken');
                                        window.open(`${API_BASE_URL}/files/${data.fileName || docId}?token=${token}`, '_blank');
                                    }}
                                    className="bg-gray-900 hover:bg-rose-600 text-white w-full sm:w-auto px-16 py-6 rounded-[32px] font-black tracking-widest text-xs uppercase shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group/btn"
                                >
                                    Review Forensics <FaEye className="text-xl group-hover/btn:scale-125 transition-transform" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-indigo-600 rounded-[36px] p-8 flex justify-between items-center text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                             <div className="relative z-10">
                                 <h6 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Vault Certificate</h6>
                                 <p className="text-md font-black italic tracking-tight">Authenticated Document Hash: {docId.slice(0, 16)}...</p>
                             </div>
                             <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30">
                                 <FaRobot className="text-2xl" />
                             </div>
                             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
          )}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.98) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .pulse-warning { animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 
            0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(244, 63, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: #e2e8f0; 
            border-radius: 20px; 
            border: 3px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default ComparisonPage;
