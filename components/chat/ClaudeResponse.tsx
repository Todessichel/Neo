import React from 'react';

interface ClaudeResponseProps {
  response: {
    id: number;
    response: string;
  };
  isLatest?: boolean;
}

const ClaudeResponse: React.FC<ClaudeResponseProps> = ({ 
  response, 
  isLatest = false 
}) => {
  // Ensure response and response.response are valid
  const responseText = response?.response || 'No response available';

  return (
    <div className={`${isLatest ? 'animate-fade-in' : ''}`}>
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold mr-2">C</div>
        <h3 className="font-semibold">Claude AI</h3>
      </div>
      <div className="prose prose-sm max-w-none">
        {/* Format the response text with proper paragraphs */}
        {responseText.split('\n\n').map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>
            {paragraph.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < paragraph.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ClaudeResponse;