import React from 'react';
import Layout from '../components/layout/Layout';
import { AuthProvider } from '../hooks/useAuth';
import { DocumentsProvider } from '../hooks/useDocuments';
import { SuggestionsProvider } from '../hooks/useSuggestions';
import { UIStateProvider } from '../hooks/useUIState';

const NEOStrategyPlatformPage: React.FC = () => {
  return (
    <AuthProvider>
      <DocumentsProvider>
        <SuggestionsProvider>
          <UIStateProvider>
            <Layout />
          </UIStateProvider>
        </SuggestionsProvider>
      </DocumentsProvider>
    </AuthProvider>
  );
};

export default NEOStrategyPlatformPage;