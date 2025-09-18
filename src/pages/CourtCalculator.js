import React from 'react';
import CourtDateCalculator from '../components/CourtDateCalculator';

const CourtCalculator = () => {
  return (
    <div className="court-calculator-page">
      <div className="page-header">
        <h1>Court Date Calculator</h1>
        <p>Calculate deadlines and important dates for your cases</p>
      </div>
      
      <CourtDateCalculator />
    </div>
  );
};

export default CourtCalculator;
