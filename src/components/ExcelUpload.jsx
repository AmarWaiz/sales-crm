// src/components/ExcelUpload.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  Users,
  X,
  Database,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const ExcelUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const [agents, setAgents] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadAgents();
    const onStorage = (event) => {
      if (!event.key || event.key === 'crm_users') {
        loadAgents();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loadAgents = () => {
    const allUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
    const agentUsers = allUsers.filter(user => user.role === 'agent' || !user.role);
    setAgents(agentUsers);
  };

  const processFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error('File is empty');
          return;
        }
        
        setFileData(data);
        setPreview(data.slice(0, 5));
        toast.success(`Loaded ${data.length} leads from ${file.name}`);
      } catch (error) {
        toast.error('Error reading file. Please check the format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      toast.error('Please upload an Excel or CSV file');
    }
  };

  const handleUpload = async () => {
    if (!fileData || fileData.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    for (let i = 0; i <= 100; i += 20) {
      setTimeout(() => setUploadProgress(i), i * 10);
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Pass the selected agent ID to assign leads
      api.uploadLeads(fileData, assignTo || null);
      
      const assignedAgent = agents.find(a => String(a.id) === String(assignTo));
      const agentName = assignTo ? (assignedAgent?.name || `ID ${assignTo}`) : 'Unassigned';
      toast.success(`Successfully imported ${fileData.length} leads and assigned to ${agentName}.`);
      onUploadComplete();
      setFileData(null);
      setPreview([]);
      setFileName('');
      setAssignTo('');
      setUploadProgress(0);
    } catch (error) {
      toast.error('Error uploading leads');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { 
        Name: 'John Doe', 
        Phone: '+923001234567', 
        Product: 'Solar Panel System', 
        City: 'Karachi', 
        Notes: 'Interested in home installation' 
      },
      { 
        Name: 'Jane Smith', 
        Phone: '+923001234568', 
        Product: 'AC Maintenance', 
        City: 'Lahore', 
        Notes: 'Commercial client' 
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    XLSX.writeFile(wb, 'leads_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const clearFile = () => {
    setFileData(null);
    setPreview([]);
    setFileName('');
    setAssignTo('');
  };

  return (
    <div className="excel-upload-container">
      {!fileData ? (
        <>
          <div className="upload-header">
            <div className="header-left">
              <div className="header-icon">
                <FileSpreadsheet size={32} />
              </div>
              <div>
                <h2>Import Leads from Excel</h2>
                <p>Upload your leads file to get started with sales management</p>
              </div>
            </div>
            <button className="download-template" onClick={downloadTemplate}>
              <Download size={18} />
              Download Template
            </button>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon blue">
                <TrendingUp size={20} />
              </div>
              <div>
                <h4>Bulk Import</h4>
                <p>Upload hundreds of leads at once</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon green">
                <UserCheck size={20} />
              </div>
              <div>
                <h4>Assign to Agent</h4>
                <p>Auto-assign leads to specific agents</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon orange">
                <Database size={20} />
              </div>
              <div>
                <h4>Auto Mapping</h4>
                <p>Automatic column detection</p>
              </div>
            </div>
          </div>

          <div 
            className={`drop-zone ${dragOver ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-content">
              <div className="upload-icon">
                <Upload size={48} />
              </div>
              <h3>Drag & drop your Excel file here</h3>
              <p>or</p>
              <label className="browse-btn">
                Browse Files
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} hidden />
              </label>
              <div className="file-types">
                <span>.xlsx</span>
                <span>.xls</span>
                <span>.csv</span>
              </div>
            </div>
          </div>

          <div className="template-preview">
            <div className="preview-title">
              <Sparkles size={18} />
              <span>Sample Template Format</span>
            </div>
            <div className="preview-grid">
              <div className="preview-row header">
                <div>Name</div>
                <div>Phone</div>
                <div>Product</div>
                <div>City</div>
                <div>Notes</div>
              </div>
              <div className="preview-row">
                <div>John Doe</div>
                <div>+923001234567</div>
                <div>Solar Panel</div>
                <div>Karachi</div>
                <div>Interested</div>
              </div>
              <div className="preview-row">
                <div>Jane Smith</div>
                <div>+923001234568</div>
                <div>AC Service</div>
                <div>Lahore</div>
                <div>Commercial</div>
              </div>
            </div>
          </div>

          <div className="info-box">
            <AlertCircle size={18} />
            <span>
              <strong>Required columns:</strong> Name, Phone, Product, City
              <span className="separator">•</span>
              Notes (optional)
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon">
                <FileText size={24} />
              </div>
              <div>
                <h3>{fileData.length} Leads Ready to Import</h3>
                <p>{fileName}</p>
              </div>
            </div>
            <button className="remove-file" onClick={clearFile}>
              <X size={18} />
              Remove
            </button>
          </div>

          {/* Agent Assignment Section */}
          <div className="assign-agent-section">
            <div className="assign-agent-header">
              <Users size={18} color="#06D889" />
              <span>Assign to Agent</span>
            </div>
            <div className="assign-agent-content">
              <select 
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="agent-select"
              >
                <option value="">-- Select an Agent --</option>
                {agents.map(agent => (
                  <option key={agent.id} value={String(agent.id)}>
                    {agent.name} ({agent.id})
                  </option>
                ))}
              </select>
              <p className="assign-hint">
                {assignTo ? (
                  `Leads will be assigned to ${agents.find(a => String(a.id) === String(assignTo))?.name || 'selected agent'}`
                ) : (
                  "Leads will be unassigned. Admin can assign them later."
                )}
              </p>
              {agents.length === 0 && (
                <p className="assign-hint">No agents found. Add agent users from User Management to enable assignment.</p>
              )}
            </div>
          </div>

          <div className="data-preview">
            <div className="preview-header">
              <Database size={18} />
              <span>Data Preview (First 5 rows)</span>
              <span className="total-badge">{fileData.length} total records</span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {preview.length > 0 && Object.keys(preview[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>
                          {String(val).length > 35 ? String(val).substring(0, 35) + '...' : String(val)}
                          
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {uploading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p>Importing... {uploadProgress}%</p>
            </div>
          )}

          <div className="upload-actions">
            <button className="btn-import" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>Importing...</>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Import {fileData.length} Leads
                </>
              )}
            </button>
            <button className="btn-cancel" onClick={clearFile}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExcelUpload;