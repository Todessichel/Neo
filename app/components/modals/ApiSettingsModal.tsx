// src/components/ApiSettingsModal.tsx
import React, { useState } from 'react';

interface ApiSettingsModalProps {
  claudeApiKey: string;
  setClaudeApiKey: (key: string) => void;
  apiStatus: 'inactive' | 'active' | 'error';
  setShowSettingsModal: (show: boolean) => void;
  setSuccessMessage: (message: string | null) => void;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  claudeApiKey,
  setClaudeApiKey,
  apiStatus,
  setShowSettingsModal,
  setSuccessMessage,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);
  
  const saveApiKey = () => {
    setClaudeApiKey(apiKeyInput);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('claudeApiKey', apiKeyInput);
    }
    
    setShowSettingsModal(false);
    setSuccessMessage('Claude API key saved');
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Claude API Settings</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowSettingsModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Claude API Key
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              type="password" 
              placeholder="sk-ant-api..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your API key will be stored in browser localStorage. Get your API key from the Anthropic Console.
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">API Status</h4>
            <div className="p-3 bg-gray-100 rounded text-sm">
              <p><strong>Status:</strong> {
                apiStatus === 'active' ? 
                  <span className="text-green-600">Active</span> : 
                  apiStatus === 'error' ? 
                    <span className="text-red-600">Error</span> :
                    <span className="text-yellow-600">Inactive</span>
              }</p>
              <p className="mt-1"><strong>Model:</strong> claude-3-opus-20240229</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <button 
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={saveApiKey}
            >
              Save API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettingsModal;