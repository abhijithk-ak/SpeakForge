import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { getProfile, updateProfile } from '../services/profileService';
import './ProfilePage.css';

function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    email: '',
    created_at: '',
    full_name: '',
    role: '',
    experience_level: '',
    primary_goal: '',
    employment_status: '',
    target_role: '',
    preferred_coach: 'professional'
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const data = await getProfile();
        setProfile({
          email: data.email || '',
          created_at: data.created_at || '',
          full_name: data.full_name || '',
          role: data.role || 'other',
          experience_level: data.experience_level || 'beginner',
          primary_goal: data.primary_goal || 'communication',
          employment_status: data.employment_status || 'other',
          target_role: data.target_role || '',
          preferred_coach: data.preferred_coach || 'professional'
        });
      } catch (err) {
        console.error(err);
        setError('Failed to fetch profile settings. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const updated = await updateProfile({
        full_name: profile.full_name,
        role: profile.role,
        experience_level: profile.experience_level,
        primary_goal: profile.primary_goal,
        employment_status: profile.employment_status,
        target_role: profile.target_role || null,
        preferred_coach: profile.preferred_coach
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="skeleton skeleton-header" style={{ width: '180px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '380px', marginTop: '16px' }}></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Your Profile</h1>
        <p className="dashboard-subtitle">Manage your account information and practice agent preferences.</p>
      </header>

      {success && (
        <div className="profile-alert alert-success" role="alert">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="profile-alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="profile-sections-layout">
        
        {/* Left Section: Account details (Read-only) */}
        <section className="profile-aside-card card-panel">
          <div className="aside-user-avatar-row">
            <div className="aside-avatar-circle">
              <User size={32} />
            </div>
            <div className="aside-avatar-meta">
              <h2 className="aside-user-name">{profile.full_name || 'SpeakForge User'}</h2>
              <span className="aside-user-plan-badge">Free Plan</span>
            </div>
          </div>

          <hr className="profile-divider" />

          <div className="aside-details-list">
            <div className="aside-detail-item">
              <Mail size={16} className="detail-item-icon" />
              <div className="detail-item-content">
                <span className="detail-item-title">Email Address</span>
                <span className="detail-item-value">{profile.email}</span>
              </div>
            </div>

            <div className="aside-detail-item">
              <Calendar size={16} className="detail-item-icon" />
              <div className="detail-item-content">
                <span className="detail-item-title">Member Since</span>
                <span className="detail-item-value">{formatDate(profile.created_at)}</span>
              </div>
            </div>

            <div className="aside-detail-item">
              <Shield size={16} className="detail-item-icon" />
              <div className="detail-item-content">
                <span className="detail-item-title">Access Level</span>
                <span className="detail-item-value">Standard Member</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Section: Form profile configurations */}
        <form onSubmit={handleSubmit} className="profile-main-form card-panel">
          <h2 className="profile-section-title">Practice Settings</h2>

          <div className="form-fields-grid">
            
            {/* Full Name */}
            <div className="form-field-group">
              <label htmlFor="full_name" className="form-field-label">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                className="form-field-input"
                value={profile.full_name}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </div>

            {/* Current Occupation / Role */}
            <div className="form-field-group">
              <label htmlFor="role" className="form-field-label">What do you currently do?</label>
              <select
                id="role"
                name="role"
                className="form-field-select"
                value={profile.role}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="student">Student</option>
                <option value="graduate">Recent graduate</option>
                <option value="developer">Software developer</option>
                <option value="professional">Other professional</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="form-field-group">
              <label htmlFor="experience_level" className="form-field-label">Experience Level</label>
              <select
                id="experience_level"
                name="experience_level"
                className="form-field-select"
                value={profile.experience_level}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="beginner">Beginner (No experience)</option>
                <option value="entry">Entry level (Under 1 year)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="experienced">Experienced (3+ years)</option>
              </select>
            </div>

            {/* Primary Goal */}
            <div className="form-field-group">
              <label htmlFor="primary_goal" className="form-field-label">Primary Goal</label>
              <select
                id="primary_goal"
                name="primary_goal"
                className="form-field-select"
                value={profile.primary_goal}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="interviews">Prepare for job interviews</option>
                <option value="communication">Improve communication skills</option>
                <option value="confidence">Build speaking confidence</option>
                <option value="client">Practice client communication</option>
                <option value="speaking">Public speaking improvement</option>
              </select>
            </div>

            {/* Employment Status */}
            <div className="form-field-group">
              <label htmlFor="employment_status" className="form-field-label">Employment Status</label>
              <select
                id="employment_status"
                name="employment_status"
                className="form-field-select"
                value={profile.employment_status}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="seeking">Currently job seeking</option>
                <option value="student">Student</option>
                <option value="employed">Employed</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Target Role */}
            <div className="form-field-group">
              <label htmlFor="target_role" className="form-field-label">Target Role</label>
              <input
                type="text"
                id="target_role"
                name="target_role"
                className="form-field-input"
                placeholder="e.g. Software Engineer, Product Manager"
                value={profile.target_role}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            {/* Preferred Coach Persona */}
            <div className="form-field-group form-field-full-width">
              <label htmlFor="preferred_coach" className="form-field-label">Preferred Coach Personality</label>
              <select
                id="preferred_coach"
                name="preferred_coach"
                className="form-field-select"
                value={profile.preferred_coach}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="supportive">Supportive (Encouraging, gentle guidance)</option>
                <option value="professional">Professional (Balanced, standard assessment)</option>
                <option value="strict">Strict (Direct, focus on technical accuracy)</option>
                <option value="challenging">Challenging (Asks difficult questions under pressure)</option>
              </select>
            </div>

          </div>

          <div className="profile-form-footer">
            <button type="submit" className="btn btn-primary profile-save-btn" disabled={isSaving}>
              {isSaving ? (
                <><Loader size={16} className="spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ProfilePage;
