import React from 'react';
import AIInterview from '../components/AIInterview';

/**
 * Interview Demo Page
 * Example usage of the AI Interview component
 */
const InterviewDemo = () => {
  // Example job context - customize based on your needs
  const jobContext = {
    position: 'Full Stack Developer',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
    totalQuestions: 5,
    description: 'We are looking for an experienced Full Stack Developer to join our team.',
    requirements: [
      '3+ years of experience with JavaScript',
      'Strong knowledge of React and Node.js',
      'Experience with MongoDB or similar databases',
      'Understanding of RESTful APIs',
    ]
  };

  const handleInterviewComplete = (result) => {
    console.log('Interview completed!', result);
    
    // You can handle the results here:
    // - Save to database
    // - Show results page
    // - Generate report
    // - Send email notification
    
    alert('Interview completed! Check console for results.');
  };

  return (
    <div className="interview-demo-page">
      <AIInterview 
        jobContext={jobContext}
        onInterviewComplete={handleInterviewComplete}
      />
    </div>
  );
};

export default InterviewDemo;
