import React from 'react';

interface LeftSidebarProps {
  activeDocument: string;
  setActiveDocument: (document: string) => void;
  inconsistencyCount: Record<string, number>;
  setShowIntegrationModal: (show: boolean) => void;
  setShowLoginModal: (show: boolean) => void;
  user: any;
  projectList: any[];
  projectId: string;
  setProjectId: (id: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeDocument,
  setActiveDocument,
  inconsistencyCount,
  setShowIntegrationModal,
  setShowLoginModal,
  user,
  projectList,
  projectId,
  setProjectId
}) => {
  const documentTypes = ['Canvas', 'Strategy', 'Financial Projection', 'OKRs'];

  return (
    <div className="w-64 bg-gray-200 p-4">
      <h2 className="text-xl font-bold mb-4">Project Files</h2>
      <div className="space-y-2">
        {documentTypes.map((doc) => (
          <div 
            key={doc} 
            className={`p-2 rounded cursor-pointer flex justify-between items-center ${
              activeDocument === doc ? 'bg-blue-100 font-semibold' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => setActiveDocument(doc)}
          >
            <span>{doc}</span>
            {inconsistencyCount[doc] > 0 ? (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {inconsistencyCount[doc]}
              </span>
            ) : (
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                0
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-2">
        <button 
          className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center"
          onClick={() => setShowIntegrationModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Import/Export
        </button>
        
        {!user && (
          <button 
            className="w-full bg-green-500 text-white p-2 rounded flex items-center justify-center"
            onClick={() => setShowLoginModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            Sign In
          </button>
        )}
        
        {user && projectList.length > 0 && (
          <div className="mt-4">
            <label className="block mb-1 font-medium text-sm">Select Project</label>
            <select 
              className="w-full p-2 border rounded"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projectList.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;