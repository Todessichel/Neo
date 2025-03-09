// components/documents/DocumentViewer.tsx
import React from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import CanvasDocument from './CanvasDocument';
import StrategyDocument from './StrategyDocument';
import FinancialDocument from './FinancialDocument';
import OKRDocument from './OKRDocument';

const DocumentViewer: React.FC = () => {
  const { activeDocument, isSyncing } = useDocuments();
  
  return (
    <div className={`flex-1 bg-white m-4 mb-2 rounded shadow overflow-auto ${isSyncing ? 'opacity-50' : ''}`}>
      {isSyncing && <SyncingOverlay />}
      
      {activeDocument === 'Canvas' && <CanvasDocument />}
      {activeDocument === 'Strategy' && <StrategyDocument />}
      {activeDocument === 'Financial Projection' && <FinancialDocument />}
      {activeDocument === 'OKRs' && <OKRDocument />}
    </div>
  );
};

export default DocumentViewer;