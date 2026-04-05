import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import StudentLogin from './StudentLogin';
import StudentRegister from './StudentRegister';
import UploadDocument from './UploadDocument';
import { FaUserGraduate, FaSignOutAlt, FaFileUpload, FaListAlt, FaCheckCircle, FaTimesCircle, FaClock, FaTrash, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../apiConfig';

const StudentDashboardMain = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [profile, setProfile] = useState({ name: 'Student', email: '' });
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/student');

        const profileRes = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileRes.data);

        const docsRes = await axios.get(`${API_BASE_URL}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocuments(docsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            navigate('/student');
        }
      }
    };
    fetchData();
  }, [navigate]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Refresh documents after upload
    const token = localStorage.getItem('accessToken');
    axios.get(`${API_BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setDocuments(res.data)).catch(console.error);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document submission?")) return;

    try {
        const token = localStorage.getItem('accessToken');
        await axios.delete(`${API_BASE_URL}/documents/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        handleUploadComplete(); // Refresh list
    } catch (err) {
        alert("Delete failed: " + (err.response?.data || err.message));
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'pending': return <FaClock className="text-yellow-500 text-xl" />;
      case 'rejected': return <FaTimesCircle className="text-red-500 text-xl" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUserGraduate className="text-xl text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{profile.name}</h1>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-content max-w-5xl mx-auto space-y-8">
        
        {/* Actions Menu */}
        <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-4">
          <button 
            onClick={() => setShowUpload(false)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${!showUpload ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <FaListAlt /> My Documents
          </button>
          <button 
            onClick={() => setShowUpload(true)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${showUpload ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <FaFileUpload /> Upload New Document
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {showUpload ? (
            <UploadDocument onUploadComplete={handleUploadComplete} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc, idx) => (
                <div 
                  key={doc._id}
                  className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <div className={`px-2.5 py-1 text-[10px] w-fit font-bold rounded-full border ${getStatusColor(doc.status)} uppercase tracking-wider`}>
                          {doc.status}
                        </div>
                      </div>
                      {getStatusIcon(doc.status)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 capitalize">
                      {doc.semester || 'N/A'} {(doc.type || "").replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2 truncate" title={doc.originalName}>{doc.originalName}</p>
                    
                    {doc.type === 'marksheet' && (
                      <div className="bg-blue-50 bg-opacity-50 p-2 rounded-lg border border-blue-100 mb-2">
                        {doc.extractedData ? (
                          <>
                            <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                              <span>Extracted Name:</span>
                              <span className="font-semibold text-gray-900">{doc.extractedData.studentName || 'Not Found'}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-600">
                              <span>Extracted CGPA:</span>
                              <span className="font-bold text-blue-700">{doc.extractedData.cgpa || 'Not Found'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-gray-400 italic text-center">
                            OCR Data Not Found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] text-gray-300">v1.2-OCR-Enabled</span>
                    <span className="text-xs text-gray-500">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => window.open(`${BACKEND_URL}/uploads/${doc.fileName}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                            <FaEye /> View
                        </button>
                        <button 
                            onClick={() => handleDelete(doc._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <FaTrash />
                        </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Card Template */}
              <button 
                onClick={() => setShowUpload(true)}
                className="glass-card border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center p-6 min-h-[220px] transition-colors group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${documents.length * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FaFileUpload className="text-xl" />
                </div>
                <span className="font-semibold text-gray-700">Upload New</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<StudentLogin />} />
      <Route path="register" element={<StudentRegister />} />
      <Route path="dashboard" element={<StudentDashboardMain />} />
    </Routes>
  );
};

export default StudentDashboard;
