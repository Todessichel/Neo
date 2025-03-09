'use client';

import React from 'react';
import Layout from '../components/layout/Layout';
import DocumentViewer from '../components/documents/DocumentViewer';
import ChatInterface from '../components/chat/ChatInterface';

// Context Providers
import { AuthProvider } from '../contexts/AuthContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { DocumentProvider } from '../contexts/DocumentContext';
import { FileSystemProvider } from '../contexts/FileSystemContext';
import { SuggestionsProvider } from '../contexts/SuggestionsContext';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';

/**
 * Main page component that sets up the application with all providers
 */
export default function Home() {
  return (
    <AuthProvider>
      <UIStateProvider>
        <FileSystemProvider>
          <DocumentProvider>
            <SuggestionsProvider>
              <AIAssistantProvider>
                <Layout>
                  <div className="flex flex-col h-full">
                    {/* Document Viewer (takes most of the space) */}
                    <div className="flex-1 overflow-auto">
                      <DocumentViewer />
                    </div>
                    
                    {/* Chat Interface (fixed at bottom) */}
                    <div className="mt-auto">
                      <ChatInterface />
                    </div>
                  </div>
                </Layout>
              </AIAssistantProvider>
            </SuggestionsProvider>
          </DocumentProvider>
        </FileSystemProvider>
      </UIStateProvider>
    </AuthProvider>
  );
}