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
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [distributionMode, setDistributionMode] = useState('round-robin');
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
    const agentUsers = api.getUsers().filter(user => user.role === 'agent');
    setAgents(agentUsers);
  };

  const calculateDistributionPreview = (leadCount, agentIds, mode) => {
    const counts = agentIds.reduce((result, agentId) => {
      result[agentId] = 0;
      return result;
    }, {});

    if (leadCount === 0 || agentIds.length === 0) {
      return counts;
    }

    if (mode === 'balanced') {
      const baseCount = Math.floor(leadCount / agentIds.length);
      const remainder = leadCount % agentIds.length;

      agentIds.forEach((agentId, index) => {
        counts[agentId] = baseCount + (index < remainder ? 1 : 0);
      });

      return counts;
    }

    for (let index = 0; index < leadCount; index += 1) {
      const agentId = agentIds[index % agentIds.length];
      counts[agentId] += 1;
    }

    return counts;
  };

  const distributionPreview = calculateDistributionPreview(
    fileData?.length || 0,
    selectedAgentIds,
    distributionMode
  );

  const toggleSelectedAgent = (agentId) => {
    setSelectedAgentIds((currentAgentIds) => (
      currentAgentIds.includes(agentId)
        ? currentAgentIds.filter((selectedAgentId) => selectedAgentId !== agentId)
        : [...currentAgentIds, agentId]
    ));
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
      api.uploadLeads(fileData, selectedAgentIds, distributionMode);

      const assignmentText = selectedAgentIds.length > 0
        ? `assigned to ${selectedAgentIds.length} agent${selectedAgentIds.length === 1 ? '' : 's'}`
        : 'left unassigned';
      toast.success(`${fileData.length} leads imported and ${assignmentText}.`);
      onUploadComplete();
      setFileData(null);
      setPreview([]);
      setFileName('');
      setSelectedAgentIds([]);
      setDistributionMode('round-robin');
      setUploadProgress(0);
    } catch (error) {
      toast.error(error?.message || 'Error uploading leads');
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
    setSelectedAgentIds([]);
    setDistributionMode('round-robin');
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
                <h4>Assign to Agents</h4>
                <p>Distribute leads across your sales team</p>
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
              <span>Assign to Agents</span>
            </div>
            <div className="assign-agent-content">
              <div className="distribution-mode">
                <label>
                  <input
                    type="radio"
                    name="distributionMode"
                    value="round-robin"
                    checked={distributionMode === 'round-robin'}
                    onChange={(e) => setDistributionMode(e.target.value)}
                  />
                  Round-Robin
                </label>
                <label>
                  <input
                    type="radio"
                    name="distributionMode"
                    value="balanced"
                    checked={distributionMode === 'balanced'}
                    onChange={(e) => setDistributionMode(e.target.value)}
                  />
                  Balanced
                </label>
              </div>

              <div className="agent-checkbox-list">
                {agents.map(agent => (
                  <label key={agent.id} className="agent-checkbox-option">
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.includes(agent.id)}
                      onChange={() => toggleSelectedAgent(agent.id)}
                    />
                    <span>{agent.name} ({agent.id})</span>
                  </label>
                ))}
              </div>

              <p className="assign-hint">
                {selectedAgentIds.length > 0 ? (
                  `${fileData.length} leads will be distributed to ${selectedAgentIds.length} selected agent${selectedAgentIds.length === 1 ? '' : 's'}.`
                ) : (
                  "Leads will be unassigned. Admin can assign them later."
                )}
              </p>

              {selectedAgentIds.length > 0 && (
                <div className="distribution-preview">
                  <div className="preview-header">
                    <Sparkles size={16} />
                    <span>Assignment Preview</span>
                  </div>
                  {selectedAgentIds.map((agentId) => {
                    const agent = agents.find((agentItem) => agentItem.id === agentId);
                    return (
                      <div key={agentId} className="distribution-preview-row">
                        <span>{agent?.name || agentId}</span>
                        <strong>{distributionPreview[agentId] || 0} leads</strong>
                      </div>
                    );
                  })}
                </div>
              )}

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
