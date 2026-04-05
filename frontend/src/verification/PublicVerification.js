import React, { useState, useEffect } from 'react';
import { FaQrcode, FaSearch, FaCheckCircle, FaShieldAlt, FaFilePdf, FaLock, FaBuilding, FaUserCheck, FaCalendarAlt, FaFingerprint } from 'react-icons/fa';
import QRScannerSection from './QRScannerSection';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

const PublicVerification = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('documentId');
  const [documentId, setDocumentId] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setDocumentId(idParam);
      setActiveTab('documentId');
      autoVerify(idParam);
    }
  }, [searchParams]);

  const autoVerify = async (id) => {
    setIsVerifying(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/scan/${id}`);
      if (res.data.valid) {
        setResult({
          id: id,
          studentName: res.data.studentName,
          college: res.data.institution || 'Registered Institution',
          type: res.data.documentType,
          status: 'VERIFIED',
          date: new Date().toLocaleDateString()
        });
      }
    } catch (err) {
      console.error("Auto-verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyDocument = async (paramId = null) => {
    if (!email) {
      alert("Student email is required for secure authentication.");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    const formData = new FormData();
    formData.append('email', email);
    
    if (file && activeTab === 'file') {
      formData.append('file', file);
    } else if (paramId || documentId) {
      formData.append('id', paramId || documentId);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/public-verify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.valid) {
        setResult({
          id: paramId || documentId || 'VAULT_CERTIFIED_FILE',
          studentName: res.data.studentName,
          college: res.data.institution || 'Verified Academic Institution',
          type: res.data.documentType,
          status: 'AUTHENTICATED',
          date: new Date(res.data.verifiedOn).toLocaleDateString()
        });
      }
    } catch (err) {
      alert(err.response?.data || "Verification Failed: Record not found or integrity check failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    verifyDocument();
  };

  const handleQRScanResult = (qrData) => {
    let id = qrData;
    if (id.includes('/')) id = id.split('/').pop();
    setDocumentId(id);
    if (email) {
      verifyDocument(id);
    } else {
      alert("Please enter the student's registered email to securely unlock the verification vault.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 py-20 font-inter">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 flex flex-col md:flex-row transition-all duration-500 hover:shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)]">
        
        {/* Verification Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-14 relative z-10 bg-white">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
               <FaLock className="text-[10px]" /> Secure Validation Portal
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase italic">
              Academic <span className="text-indigo-600">Gateway</span>
            </h2>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Authenticate credentials via Document ID, Scan, or SHA-256 Vault-Certified Files.
            </p>
          </div>

          {!result ? (
            <div className="space-y-8">
              {/* Mandatory Email Field */}
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 group-focus-within:text-indigo-600 transition-colors">
                  01. Student Registration Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full pl-5 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-gray-900"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex bg-gray-100/60 p-1.5 rounded-2xl">
                {['documentId', 'qr', 'file'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                      activeTab === tab ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab === 'documentId' && <><FaSearch className="inline mr-2" /> ID</>}
                    {tab === 'qr' && <><FaQrcode className="inline mr-2" /> Scan</>}
                    {tab === 'file' && <><FaFilePdf className="inline mr-2" /> Cert</>}
                  </button>
                ))}
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                {activeTab === 'documentId' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">02. Document Serial Number</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold tracking-wider"
                      placeholder="Enter Vault ID"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                    />
                  </div>
                )}

                {activeTab === 'file' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">02. Upload Certified Record</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                        <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        id="verify-file-upload"
                        />
                        <label htmlFor="verify-file-upload" className="cursor-pointer">
                            <FaShieldAlt className="text-4xl text-indigo-200 mx-auto mb-4" />
                            <span className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                                {file ? file.name : "Select Stamped PDF"}
                            </span>
                        </label>
                    </div>
                  </div>
                )}

                {activeTab === 'qr' ? (
                  <QRScannerSection onScanComplete={handleQRScanResult} isVerifying={isVerifying} />
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-black text-white py-5 rounded-2xl font-black tracking-[0.2em] text-xs uppercase shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    disabled={isVerifying || !email}
                  >
                    {isVerifying ? 'Initializing Vault Check...' : 'Verify Authenticity'}
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-500">
                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[32px] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5">
                        <FaCheckCircle className="text-[180px] text-emerald-600" />
                    </div>
                    
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                            <FaCheckCircle className="text-4xl text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight italic mb-2">Record Validated</h3>
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-8">Official Academic Authenticity confirmed</p>

                        <div className="space-y-4 text-left">
                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <FaUserCheck />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Holder</p>
                                    <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{result.studentName}</p>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <FaBuilding />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Source</p>
                                    <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{result.college}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <FaCalendarAlt />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Valid On</p>
                                        <p className="text-xs font-black text-gray-900 uppercase italic">{result.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                        onClick={() => {
                            setResult(null);
                            setDocumentId('');
                        }}
                        className="mt-8 w-full bg-white text-emerald-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                        >
                        Verify Another Record
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Informational Side Panel */}
        <div className="hidden md:flex w-1/2 flex-col justify-between bg-[#0f172a] text-white p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-indigo-600/30">
                <FaLock className="text-2xl" />
            </div>
            <h3 className="text-5xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
              Level 2<br/><span className="text-indigo-500">Security</span><br/>Network
            </h3>
            <p className="text-indigo-100/50 text-[10px] font-black uppercase tracking-[0.3em] mb-12">
              Zero-Trust Architecture
            </p>

            <div className="space-y-8">
                <div className="flex gap-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FaFingerprint />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1 italic">Vult-Certified Hashing</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Cryptographic validation ensures document records haven't been modified since certification.</p>
                    </div>
                </div>

                <div className="flex gap-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FaFilePdf />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1 italic">Digital Watermarking</h4>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Official PDFs are stamped with non-removable verification identifiers and live QR triggers.</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[95%] animate-pulse"></div>
                    </div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Academic Node Stability: 99.9%</p>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicVerification;
