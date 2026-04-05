import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import DocumentTable from './DocumentTable';
import ReferenceUpload from './ReferenceUpload';
import ComparisonPage from './ComparisonPage';
import StatusPieChart from '../charts/StatusPieChart';
import UploadBarChart from '../charts/UploadBarChart';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaChartBar, FaSignOutAlt, FaDatabase } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

const DashboardMain = () => {
  const [documents, setDocuments] = useState([]);
  const [statsData, setStatsData] = useState({ verified: 0, pending: 0, rejected: 0, total: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const fetchDocuments = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return navigate('/admin');

      const res = await axios.get(`${API_BASE_URL}/admin/documents?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const docs = res.data.documents || [];
      setDocuments(docs);
      
      let verified = 0, pending = 0, rejected = 0;
      docs.forEach(d => {
        if (d.status === 'verified') verified++;
        else if (d.status === 'pending') pending++;
        else if (d.status === 'rejected') rejected++;
      });
      setStatsData({ verified, pending, rejected, total: docs.length });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const stats = [
    { title: 'Total Documents', value: statsData.total, icon: <FaFileAlt />, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pending Documents', value: statsData.pending, icon: <FaFileAlt />, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Verified Documents', value: statsData.verified, icon: <FaCheckCircle />, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Rejected Documents', value: statsData.rejected, icon: <FaTimesCircle />, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaChartBar className="text-xl text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors">
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'overview' 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <FaChartBar /> Overview & Student Submissions
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'references' 
                  ? 'text-purple-600 border-purple-600' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <FaDatabase /> Reference Documents
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content space-y-8">
        {activeTab === 'overview' ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div 
                  key={idx} 
                  className="stat-card hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <span className="text-gray-500 font-medium text-sm">{stat.title}</span>
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{stat.value}</h2>
                  <div className="stat-icon">{stat.icon}</div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Trends</h3>
                <div className="flex-grow flex items-center justify-center">
                  <UploadBarChart />
                </div>
              </div>
              <div className="glass-card p-6 flex flex-col h-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Status Overview</h3>
                <div className="flex-grow flex items-center justify-center">
                  <StatusPieChart data={{ verified: statsData.verified, pending: statsData.pending, rejected: statsData.rejected }} />
                </div>
              </div>
            </div>

            {/* Student Submissions Table */}
            <DocumentTable documents={documents} />
          </>
        ) : (
          <ReferenceUpload />
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="register" element={<AdminRegister />} />
      <Route path="dashboard" element={<DashboardMain />} />
      <Route path="dashboard/comparison/:docId" element={<ComparisonPage />} />
    </Routes>
  );
};

export default AdminDashboard;
