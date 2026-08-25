import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft } from 'lucide-react';
import '../PageStubs.css';

const InterviewSetupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-stub">
      <Briefcase size={32} className="stub-icon" />
      <h1 className="stub-title">Mock Interview Setup</h1>
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

export default InterviewSetupPage;
