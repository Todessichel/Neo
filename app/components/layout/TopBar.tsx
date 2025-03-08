import React from 'react';

interface TopBarProps {
  user: any;
  projectId: string;
  projectList: any[];
  lastSyncedAt: Date | null;
  logoutUser: () => Promise<void>;
}

const TopBar: React.FC<TopBarProps> = ({
  user,
  projectId,
  projectList,
  lastSyncedAt,
  logoutUser
}) => {
  if (!user) return null;

  const currentProject = projectList.find(p => p.id === projectId);
  const projectName = projectId !== 'default-project' 
    ? (currentProject?.name || projectId) 
    : 'No Project Selected';

  return (
    <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white p-2 flex justify-between items-center z-10">
      <div className="flex items-center">
        <span className="font-medium ml-2">
          {user.email} | Project: {projectName}
        </span>
      </div>
      <div className="flex items-center">
        {lastSyncedAt && (
          <span className="text-sm mr-4">
            Last synced: {lastSyncedAt.toLocaleTimeString()}
          </span>
        )}
        <button 
          className="text-white hover:text-gray-200 text-sm"
          onClick={logoutUser}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default TopBar;