import React from 'react';
import { ResumeProvider } from '../contexts/ResumeContext';
import ResumeForm from '../components/resume/ResumeForm';
import ResumePreview from '../components/resume/ResumePreview';
import { ResumeDropzone } from '../components/resume/ResumeDropzone';

const ResumeBuilderContent = () => {
    const [hasStarted, setHasStarted] = React.useState(false);

    if (!hasStarted) {
        return (
            <div className="pt-24 pb-12 min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <ResumeDropzone onComplete={() => setHasStarted(true)} />
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
                <div className="flex flex-col md:flex-row gap-6 h-full">
                    {/* Left side: Editor */}
                    <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Resume Builder</h1>
                            <p className="text-xs text-slate-500 font-medium">Auto-saving locally</p>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ResumeForm />
                        </div>
                    </div>

                    {/* Right side: Live Preview */}
                    <div className="w-full md:w-1/2 h-[500px] md:h-full flex flex-col">
                        <div className="mb-2 flex justify-between items-end">
                            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Live Preview</h2>
                        </div>
                        <div className="flex-1">
                            <ResumePreview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResumeUpdatePage: React.FC = () => {
    return (
        <ResumeProvider>
            <ResumeBuilderContent />
        </ResumeProvider>
    );
};

export default ResumeUpdatePage;
