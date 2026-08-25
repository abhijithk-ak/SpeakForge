import { TrendingUp } from 'lucide-react';
import './PageStubs.css';

const ProgressPage = () => (
  <div className="page-stub">
    <TrendingUp size={32} className="stub-icon" />
    <h1 className="stub-title">Your progress</h1>
    <p className="stub-desc">Your daily streaks, minutes practiced, and performance trends over time.</p>
  </div>
);

export default ProgressPage;
