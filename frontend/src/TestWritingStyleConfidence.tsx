import React from 'react';

// Test step by step imports
// Step 1: Try importing Heroicons (used by WritingStyleConfidence)
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Step 2: Try importing authStore (test different path)
// import { useAuthStore } from './stores/authStore';

// Step 3: Try importing writingAnalyticsService (fix path)
// TEMPORARILY DISABLED - import writingAnalyticsService from './services/writingAnalyticsService';

// Step 4: Try importing WritingStyleConfidence directly
import WritingStyleConfidence from './components/WritingStyleConfidence';

// Test if WritingStyleConfidence can be imported without errors
const TestWritingStyleConfidence: React.FC = () => {
  // const { user } = useAuthStore();

  return (
    <div className="p-4">
      <h1>Testing WritingStyleConfidence Import</h1>
      <p>If you see this, the basic component structure works.</p>

      {/* Try to import WritingStyleConfidence step by step */}
      <div className="mt-4">
        <p>Step 1: Basic React component ✅</p>
        <p>Step 2: Heroicons import <CheckCircleIcon className="inline h-4 w-4 text-green-500" /> ✅</p>
        <p>Step 3: AuthStore import (commented out for testing)</p>
        <p>Step 4: WritingAnalyticsService import (commented out)</p>
        <p>Step 5: Try importing WritingStyleConfidence directly...</p>

        {/* Test the actual component */}
        <div className="mt-4 border border-gray-300 rounded p-4">
          <h4 className="font-medium mb-2">Testing WritingStyleConfidence Component:</h4>
          <WritingStyleConfidence className="max-w-md" />
        </div>
      </div>
    </div>
  );
};

export default TestWritingStyleConfidence;
