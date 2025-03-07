import React from 'react';

interface IntegrationModalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  storageDirectory: string;
  onShowSettings: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  activeTab,
  setActiveTab,
  onClose,
  storageDirectory,
  onShowSettings,
  onFileSelect,
  onFileDrop
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-90vh overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Integrations & File Management</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'import' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'export' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'webhooks' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            Webhooks
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div>
              <h3 className="font-medium mb-4">Import Files</h3>
              <div className="mb-4">
                <label className="block mb-2">Document Type</label>
                <select className="w-full p-2 border rounded">
                  <option>Strategy Document</option>
                  <option>Canvas</option>
                  <option>OKRs</option>
                  <option>Financial Projection</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">File Type</label>
                <select className="w-full p-2 border rounded">
                  <option>Excel (.xlsx)</option>
                  <option>Word (.docx)</option>
                  <option>PDF (.pdf)</option>
                  <option>JSON (.json)</option>
                  <option>CSV (.csv)</option>
                  <option>Markdown (.md)</option>
                </select>
              </div>
              
              {/* Display storage directory info */}
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <p className="text-sm">
                  <strong>Storage Directory:</strong> {storageDirectory || 'No directory set (files will be saved to root)'}
                </p>
                <p className="text-xs mt-1">
                  Files will be converted to JSON format and saved to this location.
                  <button 
                    className="ml-2 text-blue-500 underline"
                    onClick={onShowSettings}
                  >
                    Change
                  </button>
                </p>
              </div>
              
              <div 
                className="mb-4 p-4 border-2 border-dashed border-gray-300 text-center rounded cursor-pointer hover:bg-gray-50"
                onClick={() => document.getElementById('fileUpload')?.click()}
                onDrop={onFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>Drag & drop files here or <span className="text-blue-500">browse</span></p>
                <p className="text-xs text-gray-500 mt-1">Files will be automatically converted to JSON format</p>
                <input 
                  id="fileUpload" 
                  type="file" 
                  className="hidden" 
                  onChange={onFileSelect}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Import from URL</h4>
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="https://" 
                    className="flex-1 p-2 border rounded-l"
                  />
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-r">
                    Import
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Import from Cloud Services</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>Google Drive</span>
                  </button>
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>Dropbox</span>
                  </button>
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>OneDrive</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <h3 className="font-medium mb-4">Export Documents</h3>
              
              <div className="mb-4">
                <label className="block mb-2">Select Content to Export</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-strategy" className="mr-2" defaultChecked />
                    <label htmlFor="exp-strategy">Strategy Document</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-canvas" className="mr-2" />
                    <label htmlFor="exp-canvas">Canvas</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-okrs" className="mr-2" />
                    <label htmlFor="exp-okrs">OKRs</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-financial" className="mr-2" />
                    <label htmlFor="exp-financial">Financial Projection</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-all" className="mr-2" />
                    <label htmlFor="exp-all">All Documents (Bundle)</label>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">Export Format</label>
                <select className="w-full p-2 border rounded">
                  <option>PDF (.pdf)</option>
                  <option>Word (.docx)</option>
                  <option>Excel (.xlsx)</option>
                  <option>JSON (.json)</option>
                  <option>Markdown (.md)</option>
                  <option>PowerPoint (.pptx)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Export Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-comments" className="mr-2" />
                    <label htmlFor="exp-comments">Include Comments</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-version" className="mr-2" defaultChecked />
                    <label htmlFor="exp-version">Include Version History</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-suggestions" className="mr-2" />
                    <label htmlFor="exp-suggestions">Include Improvement Suggestions</label>
                  </div>
                </div>
              </div>
              
              <div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                  Export Selected
                </button>
              </div>
            </div>
          )}
          
          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div>
              <h3 className="font-medium mb-4">Webhook Integrations</h3>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Active Integrations</h4>
                <div className="border rounded divide-y">
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Notion</p>
                      <p className="text-sm text-gray-500">Syncs Strategy & OKRs</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 border rounded text-sm">Configure</button>
                      <button className="px-2 py-1 border rounded text-sm text-red-500">Disconnect</button>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-gray-500">Notifies on document changes</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 border rounded text-sm">Configure</button>
                      <button className="px-2 py-1 border rounded text-sm text-red-500">Disconnect</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Connect New Integration</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Google Sheets</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Airtable</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Asana</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Jira</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Trello</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Microsoft Teams</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Custom Webhook</h4>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Webhook Name" 
                    className="w-full p-2 border rounded"
                  />
                  <input 
                    type="text" 
                    placeholder="Webhook URL" 
                    className="w-full p-2 border rounded"
                  />
                  <select className="w-full p-2 border rounded">
                    <option>Trigger: Document Updated</option>
                    <option>Trigger: Comment Added</option>
                    <option>Trigger: Suggestion Implemented</option>
                    <option>Trigger: All Changes</option>
                  </select>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded">
                    Add Webhook
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button 
            className="text-gray-500 px-4 py-2 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;