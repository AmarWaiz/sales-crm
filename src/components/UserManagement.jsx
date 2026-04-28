// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  UserCheck,
  X,
  Lock,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const UserManagement = ({ onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    password: '',
    role: 'agent'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
    setUsers(allUsers);
  };

  const handleAddUser = () => {
    if (!formData.id || !formData.name || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    const existingUser = users.find(u => u.id === formData.id);
    if (existingUser) {
      toast.error('User ID already exists');
      return;
    }

    const newUser = {
      id: formData.id,
      name: formData.name,
      password: formData.password,
      role: formData.role
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('crm_users', JSON.stringify(updatedUsers));
    loadUsers();
    setShowAddModal(false);
    setFormData({ id: '', name: '', password: '', role: 'agent' });
    toast.success(`User ${formData.name} added successfully`);
    if (onUserUpdate) onUserUpdate();
  };

  const handleDeleteUser = () => {
    if (!showDeleteConfirm?.id) {
      setShowDeleteConfirm(null);
      return;
    }

    if (showDeleteConfirm.id === 'admin1') {
      toast.error('Cannot delete the main admin account');
      setShowDeleteConfirm(null);
      return;
    }

    const updatedUsers = users.filter(u => u.id !== showDeleteConfirm.id);
    localStorage.setItem('crm_users', JSON.stringify(updatedUsers));
    loadUsers();
    setShowDeleteConfirm(null);
    toast.success(`User ${showDeleteConfirm.name} deleted successfully`);
    if (onUserUpdate) onUserUpdate();
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="role-badge admin"><Shield size={12} /> Administrator</span>;
    }
    return <span className="role-badge agent"><UserCheck size={12} /> Sales Agent</span>;
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <div className="header-icon">
            <Users size={28} />
          </div>
          <div>
            <h2>User Management</h2>
            <p>Add, edit or remove system users</p>
          </div>
        </div>
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="user-stats">
        <div className="user-stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="user-stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="user-stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'agent').length}</div>
          <div className="stat-label">Sales Agents</div>
        </div>
      </div>

      <div className="users-list">
        {users.length === 0 ? (
          <div className="empty-users">
            <Users size={48} />
            <p>No users found</p>
            <p className="empty-subtext">Click "Add New User" to create users</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-left">
                <div className="user-avatar-large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <p className="user-id">ID: {user.id}</p>
                  <div className="user-role-badge">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>
              <div className="user-card-right">
                {user.id !== 'admin1' && (
                  <button 
                    onClick={() => setShowDeleteConfirm({ id: user.id, name: user.name })}
                    className="delete-user-btn"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                {user.id === 'admin1' && (
                  <span className="protected-badge">
                    <Shield size={14} />
                    Protected Account
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="user-delete-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="user-delete-modal" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={48} color="#f44336" />
            <h4>Delete User?</h4>
            <p>Are you sure you want to delete <strong>{showDeleteConfirm?.name}</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                onClick={handleDeleteUser}
                className="confirm-delete"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="cancel-delete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label><User size={16} /> User ID *</label>
                <input
                  type="text"
                  placeholder="e.g., agent3, john123"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase()})}
                />
              </div>
              <div className="form-group">
                <label><User size={16} /> Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Agent"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><Lock size={16} /> Password *</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><Shield size={16} /> Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="agent">Sales Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleAddUser}>
                <CheckCircle size={16} />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;