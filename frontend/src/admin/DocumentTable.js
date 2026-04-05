import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaFilter, FaRobot, FaUserShield, FaCheck, FaTimes, FaTrash, FaBalanceScale } from 'react-icons/fa';
import { BACKEND_URL, API_BASE_URL } from '../apiConfig';
import axios from 'axios';

const DocumentTable = ({ documents }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_BASE_URL}/forms/sync-responses`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Sync Complete!\nSynced: ${res.data.syncedCount}\nVerified: ${res.data.verifiedCount}\nMismatches: ${res.data.mismatchCount}`);
      window.location.reload();
    } catch (err) {
      alert("Sync failed: " + (err.response?.data || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const docsToRender = documents || [];
  
  const filteredDocs = filter === 'All' 
    ? docsToRender 
    : docsToRender.filter(doc => doc.status === filter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>Verified</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>Rejected</span>;
      default:
        return <span className="capitalize">{status}</span>;
    }
  };

  const getVerifiedByBadge = (verifiedBy) => {
    if (verifiedBy === 'auto') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <FaRobot className="text-[10px]" /> Auto
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FaUserShield className="text-[10px]" /> Admin
      </span>
    );
  };

  const handleAction = async (id, action) => {
    let reason = '';
    if (action === 'reject') {
        reason = prompt("Enter rejection reason:");
        if (reason === null) return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this document?`)) return;

    try {
        const token = localStorage.getItem('accessToken');
        await axios.patch(`${API_BASE_URL}/verify/${id}`, { action, reason }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        window.location.reload(); // Simple refresh to update UI
    } catch (err) {
        alert("Action failed: " + (err.response?.data || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this document?")) return;

    try {
        const token = localStorage.getItem('accessToken');
        await axios.delete(`${API_BASE_URL}/documents/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        window.location.reload();
    } catch (err) {
        alert("Delete failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white bg-opacity-50">
        <div className="flex items-center gap-4">
          <h3 className="text-lg leading-6 font-semibold text-gray-900">Recent Documents</h3>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
              isSyncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <FaBalanceScale className={isSyncing ? 'animate-spin' : ''} /> 
            {isSyncing ? 'Syncing...' : 'Sync Form Responses'}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-400" />
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['All', 'pending', 'verified', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 capitalize ${
                  filter === f 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 bg-opacity-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Details</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comparison</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified By</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredDocs.map((doc, idx) => (
              <tr key={idx} className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-150 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{doc.userId?.name || doc.studentName}</div>
                  <div className="text-xs text-gray-500 truncate w-32" title={doc._id || doc.id}>{doc._id || doc.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 capitalize">
                  {doc.semester || 'N/A'} {(doc.type || "").replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : doc.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(doc.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => navigate(`/admin/dashboard/comparison/${doc._id}`)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition-all shadow-md active:scale-95 ${
                      doc.extractedData?.formStatus === 'confirmed' ? 'bg-green-600 text-white hover:bg-green-700' :
                      doc.extractedData?.formStatus === 'mismatch' ? 'bg-red-600 text-white hover:bg-red-700' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <FaBalanceScale className="text-sm" /> 
                    {
                      doc.extractedData?.formStatus === 'confirmed' ? 'MATCHED' : 
                      doc.extractedData?.formStatus === 'mismatch' ? 'MISMATCH' : 
                      'CROSS-CHECK'
                    }
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getVerifiedByBadge(doc.verifiedBy || 'auto')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate" title={doc.rejectionReason || '—'}>
                  {doc.rejectionReason || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button 
                    className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                    title="View Document" 
                    onClick={() => window.open(`${BACKEND_URL}/uploads/${doc.fileName}`, '_blank')}
                  >
                    <FaEye className="text-lg" />
                  </button>

                  {doc.status === 'pending' && (
                    <>
                      <button 
                        className="text-green-600 hover:text-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        title="Verify" 
                        onClick={() => handleAction(doc._id, 'verify')}
                      >
                        <FaCheck className="text-lg" />
                      </button>
                      <button 
                        className="text-yellow-600 hover:text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        title="Reject" 
                        onClick={() => handleAction(doc._id, 'reject')}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </>
                  )}

                  <button 
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                    title="Delete" 
                    onClick={() => handleDelete(doc._id)}
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                  No documents found matching the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DocumentTable;
