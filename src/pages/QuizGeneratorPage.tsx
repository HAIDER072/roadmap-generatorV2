import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, AlertCircle, Loader2, CheckCircle2, XCircle, ArrowRight, Type } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

const QuizGeneratorPage: React.FC = () => {
    const { darkMode } = useTheme();
    const [inputMode, setInputMode] = useState<'file' | 'topic'>('file');
    const [topicInput, setTopicInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [questionsCount, setQuestionsCount] = useState<number>(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);

    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
            setQuizData(null);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowResults(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const generateQuiz = async () => {
        if (inputMode === 'file' && !file) {
            setError('Please upload a file first.');
            return;
        }

        if (inputMode === 'topic' && !topicInput.trim()) {
            setError('Please enter a topic first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('questionsCount', questionsCount.toString());

        if (inputMode === 'file' && file) {
            formData.append('file', file);
        } else if (inputMode === 'topic' && topicInput.trim()) {
            formData.append('topic', topicInput.trim());
        }

        try {
            const response = await fetch('http://localhost:3001/api/generate-quiz', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate quiz');
            }

            setQuizData(data.questions);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowResults(false);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred while generating the quiz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        if (showResults) return;

        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
    };

    const calculateScore = () => {
        if (!quizData) return 0;
        let score = 0;
        quizData.forEach((q, index) => {
            if (selectedAnswers[index] === q.correctAnswer) {
                score++;
            }
        });
        return score;
    };

    return (
        <div className={`min-h-screen pt-24 pb-12 transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
            }`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        AI Quiz Generator
                    </h1>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Upload any PDF, Excel, or Word document and generate an interactive MCQ quiz instantly!
                    </p>
                </div>

                {!quizData && (
                    <div className={`p-8 rounded-2xl shadow-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 shadow-slate-900/50' : 'bg-white shadow-slate-200/50'
                        }`}>

                        {/* Input Mode Tabs */}
                        <div className="flex justify-center mb-8">
                            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                <button
                                    onClick={() => { setInputMode('file'); setError(null); }}
                                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${inputMode === 'file'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Document</span>
                                </button>
                                <button
                                    onClick={() => { setInputMode('topic'); setError(null); }}
                                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${inputMode === 'topic'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <Type className="w-4 h-4" />
                                    <span>Topic</span>
                                </button>
                            </div>
                        </div>

                        {inputMode === 'file' ? (
                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 ${darkMode
                                    ? 'border-slate-600 hover:border-blue-500 bg-slate-800/50'
                                    : 'border-slate-300 hover:border-blue-500 bg-slate-50'
                                    }`}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                                    onChange={handleFileChange}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            {file.name.endsWith('.pdf') ? <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" /> : <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{file.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="text-sm text-red-500 hover:text-red-700"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Click or drag file to upload</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Supports PDF, DOCX, XLSX, TXT (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    What topic would you like to be quizzed on?
                                </label>
                                <textarea
                                    value={topicInput}
                                    onChange={(e) => {
                                        setTopicInput(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="e.g. World War II major battles, Basics of React Component Lifecycle, Quantum Physics..."
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 min-h-[120px] resize-y ${darkMode
                                            ? 'bg-slate-800/50 border-slate-600 focus:border-blue-500 text-white placeholder-slate-500'
                                            : 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-400'
                                        }`}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center space-x-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="w-full sm:w-auto flex items-center space-x-4">
                                <label className="font-medium whitespace-nowrap">Number of Questions:</label>
                                <select
                                    value={questionsCount}
                                    onChange={(e) => setQuestionsCount(Number(e.target.value))}
                                    className={`w-full sm:w-32 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${darkMode
                                        ? 'bg-slate-700 border-slate-600 focus:border-blue-500'
                                        : 'bg-white border-slate-300 focus:border-blue-500'
                                        }`}
                                >
                                    <option value={5}>5 Questions</option>
                                    <option value={10}>10 Questions</option>
                                    <option value={15}>15 Questions</option>
                                    <option value={20}>20 Questions</option>
                                    <option value={30}>30 Questions</option>
                                </select>
                            </div>

                            <button
                                onClick={generateQuiz}
                                disabled={(inputMode === 'file' && !file) || (inputMode === 'topic' && !topicInput.trim()) || isLoading}
                                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${((inputMode === 'file' && !file) || (inputMode === 'topic' && !topicInput.trim()) || isLoading)
                                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30'
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating Quiz...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        <span>Generate Quiz</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Quiz Interface */}
                {quizData && quizData.length > 0 && (
                    <div className="space-y-6">
                        <div className={`flex items-center justify-between p-4 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-slate-800' : 'bg-white'
                            }`}>
                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Progress</span>
                                    <span className="font-semibold">{currentQuestionIndex + 1} of {quizData.length}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setQuizData(null);
                                    setFile(null);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'
                                    }`}
                            >
                                New Quiz
                            </button>
                        </div>

                        {!showResults ? (
                            <div className={`p-8 rounded-2xl shadow-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 shadow-slate-900/50' : 'bg-white shadow-slate-200/50'
                                }`}>
                                <h2 className="text-xl font-semibold mb-6">
                                    {currentQuestionIndex + 1}. {quizData[currentQuestionIndex].question}
                                </h2>

                                <div className="space-y-4">
                                    {quizData[currentQuestionIndex].options.map((option, idx) => {
                                        const isSelected = selectedAnswers[currentQuestionIndex] === option;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(option)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                                    : darkMode
                                                        ? 'border-slate-700 hover:border-slate-500 bg-slate-700/50'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <span>{option}</span>
                                                {isSelected && <div className="w-4 h-4 rounded-full bg-blue-500" />}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="mt-8 flex justify-between items-center">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentQuestionIndex === 0
                                            ? 'opacity-50 cursor-not-allowed text-slate-500'
                                            : darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    {currentQuestionIndex === quizData.length - 1 ? (
                                        <button
                                            onClick={() => setShowResults(true)}
                                            disabled={!selectedAnswers[currentQuestionIndex]}
                                            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${!selectedAnswers[currentQuestionIndex]
                                                ? 'bg-slate-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
                                                }`}
                                        >
                                            View Results
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentQuestionIndex(Math.min(quizData.length - 1, currentQuestionIndex + 1))}
                                            disabled={!selectedAnswers[currentQuestionIndex]}
                                            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 text-white transition-colors ${!selectedAnswers[currentQuestionIndex]
                                                ? 'bg-slate-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                                }`}
                                        >
                                            <span>Next</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Results View
                            <div className={`p-8 rounded-2xl shadow-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 shadow-slate-900/50' : 'bg-white shadow-slate-200/50'
                                }`}>
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                                    <p className="text-xl">
                                        You scored <span className="font-bold text-blue-500">{calculateScore()}</span> out of {quizData.length}
                                    </p>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mt-4 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-1000"
                                            style={{ width: `${(calculateScore() / quizData.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8 mt-10">
                                    {quizData.map((q, qIndex) => {
                                        const userAnswer = selectedAnswers[qIndex];
                                        const isCorrect = userAnswer === q.correctAnswer;

                                        return (
                                            <div key={qIndex} className={`p-6 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
                                                }`}>
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <h3 className="text-lg font-medium">
                                                        {qIndex + 1}. {q.question}
                                                    </h3>
                                                    {isCorrect ? (
                                                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {q.options.map((opt, oIndex) => {
                                                        let optionClass = darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200';

                                                        if (opt === q.correctAnswer) {
                                                            optionClass = 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300';
                                                        } else if (opt === userAnswer && !isCorrect) {
                                                            optionClass = 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300';
                                                        }

                                                        return (
                                                            <div key={oIndex} className={`p-3 rounded-lg border ${optionClass}`}>
                                                                {opt}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-blue-50 text-blue-800'
                                                    }`}>
                                                    <span className="font-semibold mr-2">Explanation:</span>
                                                    {q.explanation}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizGeneratorPage;
