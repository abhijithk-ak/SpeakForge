import { BarChart2 } from 'lucide-react';
import './PageStubs.css';

const ResultsPage = () => (
  <div className="page-stub">
    <BarChart2 size={32} className="stub-icon" />
    <h1 className="stub-title">Session results</h1>
    <p className="stub-desc">Your evaluation scores and feedback summary will load here.</p>
  </div>
);

export default ResultsPage;
