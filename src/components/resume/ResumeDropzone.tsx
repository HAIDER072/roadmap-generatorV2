import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { parseResumeFromPdf } from 'lib/parse-resume-from-pdf';
import { useResumeContext } from '../../contexts/ResumeContext';

export const ResumeDropzone: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const { setResume } = useResumeContext();

    const handleFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            return;
        }
        setError('');
        setIsParsing(true);

        try {
            const fileUrl = URL.createObjectURL(file);
            const parsedResume = await parseResumeFromPdf(fileUrl);
            setResume(parsedResume);
            onComplete();
        } catch (err) {
            console.error(err);
            setError('Failed to parse the PDF. Please try another file or start from scratch.');
        } finally {
            setIsParsing(false);
        }
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Import Existing Resume</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">Upload your current PDF resume to automatically extract your experience, skills, and education.</p>

            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
            >
                <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isDragActive ? 'Drop PDF here' : 'Drag & drop your PDF here'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">or click to browse files</p>

                <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer transition-colors">
                    Browse File
                    <input type="file" className="hidden" accept=".pdf" onChange={onChange} disabled={isParsing} />
                </label>
            </div>

            {error && <p className="text-red-500 mt-4 font-medium text-sm">{error}</p>}

            {isParsing && (
                <div className="mt-6 flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-blue-600 dark:text-blue-400 font-medium text-sm animate-pulse">Parsing your resume... this may take a moment</p>
                </div>
            )}

            <div className="mt-8 flex items-center w-full">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="px-4 text-sm text-slate-400 uppercase font-semibold tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
                onClick={() => onComplete()}
                className="mt-8 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium flex items-center transition-colors"
            >
                <FileText className="w-4 h-4 mr-2" />
                Start from scratch
            </button>
        </div>
    );
};
