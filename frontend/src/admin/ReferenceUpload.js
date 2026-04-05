import React, { useState, useEffect, useCallback } from 'react';
import { FaCloudUploadAlt, FaFileAlt, FaCheckCircle, FaSpinner, FaDatabase, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const ReferenceUpload = () => {
  const [file, setFile] = useState(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [semester, setSemester] = useState('Semester 1'); // Keep the semester
  const [docType, setDocType] = useState('marksheet');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [references, setReferences] = useState([]);
  const [totalRefs, setTotalRefs] = useState(0);


  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  const fetchReferences = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/admin/references`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferences(res.data.references || []);
      setTotalRefs(res.data.totalReferences || 0);
    } catch (err) {
      console.error("Failed to fetch references:", err);
    }
  }, []);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !studentEmail || !studentName) {
      alert("Please provide the student email, name, and select a file");
      return;
    }


    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('type', docType);
    formData.append('studentEmail', studentEmail);
    formData.append('studentName', studentName);
    formData.append('semester', semester);
    formData.append('file', file);


    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_BASE_URL}/admin/upload-reference`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const { message, studentName: ocrName, cgpa: ocrCgpa, semester: savedSem, type: savedType } = res.data;
      const detail = ocrName || ocrCgpa
        ? ` ${savedSem} ${(savedType || 'marksheet').replace('_', ' ')} confirmed in system. — Name: "${ocrName || 'N/A'}", CGPA: ${ocrCgpa ?? 'N/A'}`
        : ` ${savedSem} ${(savedType || 'marksheet').replace('_', ' ')} uploaded. (OCR could not extract data)`;
      
      setUploadResult({ success: true, message: message + '.' + detail });
      setFile(null);
      setStudentEmail('');
      setStudentName('');
      setSemester('Semester 1');
      fetchReferences();

    } catch (err) {
      setUploadResult({ 
        success: false, 
        message: err.response?.data?.message || err.response?.data || err.message 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this reference?")) return;

    try {
        const token = localStorage.getItem('accessToken');
        await axios.delete(`${API_BASE_URL}/admin/references/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchReferences();
    } catch (err) {
        alert("Delete failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="glass-card p-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <FaDatabase className="text-purple-600 text-xl" />
          <h3 className="text-lg font-bold text-gray-900">Upload Reference Document</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Upload original/official documents to build the reference database. Student uploads will be auto-verified by matching against these records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Manual) *</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Email *</label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="e.g. rahul@university.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Semester *</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-blue-600"
            >
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="marksheet">Marksheet</option>
              <option value="degree_certificate">Degree Certificate</option>
            </select>
          </div>
        </div>


        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Original Document File *</label>
          {file ? (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <FaFileAlt className="text-purple-600" />
              <span className="text-sm font-medium text-gray-800 truncate flex-1">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTrash className="text-sm" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
              <FaCloudUploadAlt className="text-2xl text-gray-400" />
              <span className="text-sm text-gray-500">Click to select file (PDF, JPG, PNG)</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            </label>
          )}
          <p className="text-xs text-gray-400 mt-2">Only the CGPA will be auto-extracted via AI. The Name is provided manually above.</p>

        </div>

        {uploadResult && (
          <div className={`rounded-lg p-3 mb-4 text-sm font-medium ${
            uploadResult.success 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {uploadResult.success ? <FaCheckCircle className="inline mr-1" /> : null}
            {uploadResult.message}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading || !file || !studentEmail || !studentName}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            isUploading || !file || !studentEmail || !studentName
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
          }`}

        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" /> Uploading & Extracting...
            </span>
          ) : (
            'Upload to Reference Database'
          )}
        </button>
      </div>

      {/* Reference List */}
      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="px-6 py-4 border-b border-gray-100 bg-white bg-opacity-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Reference Database <span className="text-sm font-normal text-gray-500">({totalRefs} records)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 bg-opacity-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA (OCR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {references.map((ref, idx) => (
                <tr key={ref._id} className="hover:bg-purple-50 hover:bg-opacity-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ref.studentName}</div>
                    <div className="text-xs text-gray-500">{ref.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold">
                    {ref.cgpa != null ? ref.cgpa.toFixed(2) : <span className="text-gray-400 font-normal">N/A</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {ref.semester || 'N/A'} {(ref.type || "").replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                        Verified Reference
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 truncate max-w-[120px]" title={ref.originalName}>
                     {ref.originalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(ref._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Reference"
                    >
                      <FaTrash className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))}

              {references.length === 0 && (
                <tr>
                   <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                    No reference documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferenceUpload;
