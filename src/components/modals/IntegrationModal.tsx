import React from 'react';

interface IntegrationModalProps {
  onClose: () => void;
  onShowSettings: () => void;
  storageDirectory: string;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  onClose,
  onShowSettings,
  storageDirectory,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Document Management</h3>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium mb-2">Directory Setup</h4>
            <p className="text-gray-600 mb-4">
              You need to select a directory where your documents are stored.
            </p>
            {storageDirectory ? (
              <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                <p className="font-medium text-blue-700">Current Directory:</p>
                <p className="text-blue-800 break-all">{storageDirectory}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
                <p className="text-yellow-800">No directory selected. Please set a storage directory.</p>
              </div>
            )}
            <button 
              onClick={onShowSettings}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Select Directory
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;