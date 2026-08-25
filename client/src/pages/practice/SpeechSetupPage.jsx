import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowLeft } from 'lucide-react';
import '../PageStubs.css';

const SpeechSetupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-stub">
      <Mic size={32} className="stub-icon" />
      <h1 className="stub-title">2-Minute Speech Setup</h1>
      <p className="stub-desc">Setup configuration options are coming in Phase 3.</p>
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/practice')}
        style={{ marginTop: '16px' }}
      >
        <ArrowLeft size={16} /> Back to Practice
      </button>
    </div>
  );
};

export default SpeechSetupPage;
