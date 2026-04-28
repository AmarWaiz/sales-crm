// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { User, Lock, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(id, password);
    
    if (result.success) {
      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="background-pattern">
        <div className="floating-shape-1"></div>
        <div className="floating-shape-2"></div>
        <div className="floating-shape-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-brand-top">
          <span className="brand-pill">
            <Sparkles size={14} />
            Smart Sales Workspace
          </span>
        </div>

        <div className="logo-container">
          <div className="logo-icon login-logo-icon">
            <img src="/logo.svg" alt="Logo" className="header-logo-img" />
          </div>
          <h1 className="title">Morrowbiz CRM</h1>
          <p className="subtitle">Multi-Agent Sales Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="User ID"
              required
              className="login-input"
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="login-input"
            />
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            <LogIn size={18} />
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer-note">
          <ShieldCheck size={16} />
          <span>Secure login for admins and sales agents</span>
        </div>
      </div>
    </div>
  );
};

export default Login;