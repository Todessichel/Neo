// NEOStrategyPlatform.tsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { FileSystemProvider } from './contexts/FileSystemContext';
import { AIAssistantProvider } from './contexts/AIAssistantContext';
import Layout from './layout/Layout';

const NEOStrategyPlatform: React.FC = () => {
  return (
    <AuthProvider>
      <FileSystemProvider>
        <DocumentProvider>
          <AIAssistantProvider>
            <Layout />
          </AIAssistantProvider>
        </DocumentProvider>
      </FileSystemProvider>
    </AuthProvider>
  );
};

export default NEOStrategyPlatform;