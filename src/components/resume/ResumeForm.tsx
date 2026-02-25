import React from 'react';
import { useResumeContext } from '../../contexts/ResumeContext';

const ResumeForm: React.FC = () => {
    const { resume, setResume, settings, setSettings, updateProfile, updateWorkExperience, updateEducation, updateProject } = useResumeContext();
    const { profile, workExperiences } = resume;

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            <div>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => updateProfile('name', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => updateProfile('email', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                        <input
                            type="text"
                            value={profile.phone}
                            onChange={(e) => updateProfile('phone', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="(123) 456-7890"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Location</label>
                        <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => updateProfile('location', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="City, State"
                        />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Summary</label>
                        <textarea
                            value={profile.summary}
                            onChange={(e) => updateProfile('summary', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white h-24 resize-none"
                            placeholder="A brief summary of your professional background..."
                        />
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Work Experience</h2>
                    <button
                        onClick={() => setSettings({ ...settings, formToShow: { ...settings.formToShow, workExperiences: !settings.formToShow.workExperiences } })}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        title={settings.formToShow.workExperiences ? "Hide section in PDF" : "Show section in PDF"}
                    >
                        {settings.formToShow.workExperiences ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        )}
                    </button>
                </div>
                {workExperiences.map((exp, idx) => (
                    <div key={idx} className="p-4 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 relative pr-12">
                        <button
                            onClick={() => updateWorkExperience(idx, 'hidden', !exp.hidden)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={exp.hidden ? "Show experience in PDF" : "Hide experience in PDF"}
                        >
                            {exp.hidden ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Company</label>
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateWorkExperience(idx, 'company', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={exp.jobTitle}
                                    onChange={(e) => updateWorkExperience(idx, 'jobTitle', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="text"
                                    value={exp.date}
                                    onChange={(e) => updateWorkExperience(idx, 'date', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder="Jan 2020 - Present"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description (one bullet per line, text wraps automatically)</label>
                                <textarea
                                    value={exp.descriptions.join('\n')}
                                    onChange={(e) => updateWorkExperience(idx, 'descriptions', e.target.value.split('\n'))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Education Section */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Education</h2>
                    <button
                        onClick={() => setSettings({ ...settings, formToShow: { ...settings.formToShow, educations: !settings.formToShow.educations } })}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        title={settings.formToShow.educations ? "Hide section in PDF" : "Show section in PDF"}
                    >
                        {settings.formToShow.educations ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        )}
                    </button>
                </div>
                {resume.educations.map((edu, idx) => (
                    <div key={idx} className="p-4 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 relative pr-12">
                        <button
                            onClick={() => updateEducation(idx, 'hidden', !edu.hidden)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={edu.hidden ? "Show education in PDF" : "Hide education in PDF"}
                        >
                            {edu.hidden ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">School/University</label>
                                <input
                                    type="text"
                                    value={edu.school}
                                    onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Degree</label>
                                <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="text"
                                    value={edu.date}
                                    onChange={(e) => updateEducation(idx, 'date', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder="Aug 2022 - May 2026"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">GPA (Optional)</label>
                                <input
                                    type="text"
                                    value={edu.gpa}
                                    onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder="3.8"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Additional Information (one bullet per line, text wraps automatically)</label>
                                <textarea
                                    value={edu.descriptions.join('\n')}
                                    onChange={(e) => updateEducation(idx, 'descriptions', e.target.value.split('\n'))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Projects Section */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Projects</h2>
                    <button
                        onClick={() => setSettings({ ...settings, formToShow: { ...settings.formToShow, projects: !settings.formToShow.projects } })}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        title={settings.formToShow.projects ? "Hide section in PDF" : "Show section in PDF"}
                    >
                        {settings.formToShow.projects ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        )}
                    </button>
                </div>
                {resume.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 relative pr-12">
                        <button
                            onClick={() => updateProject(idx, 'hidden', !proj.hidden)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={proj.hidden ? "Show project in PDF" : "Hide project in PDF"}
                        >
                            {proj.hidden ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={proj.project}
                                    onChange={(e) => updateProject(idx, 'project', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="text"
                                    value={proj.date}
                                    onChange={(e) => updateProject(idx, 'date', e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder="Fall 2023"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description (one per line)</label>
                                <textarea
                                    value={proj.descriptions.join('\n')}
                                    onChange={(e) => updateProject(idx, 'descriptions', e.target.value.split('\n'))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Skills Section */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Skills</h2>
                    <button
                        onClick={() => setSettings({ ...settings, formToShow: { ...settings.formToShow, skills: !settings.formToShow.skills } })}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        title={settings.formToShow.skills ? "Hide section in PDF" : "Show section in PDF"}
                    >
                        {settings.formToShow.skills ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        )}
                    </button>
                </div>
                <div className="p-4 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Skills List (one per line)</label>
                        <textarea
                            value={resume.skills.descriptions.join('\n')}
                            onChange={(e) => {
                                const newResume = { ...resume, skills: { ...resume.skills, descriptions: e.target.value.split('\n') } };
                                setResume(newResume);
                            }}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white h-32 resize-none"
                            placeholder="Languages: C++, JavaScript...&#10;Frameworks: React, Node.js..."
                        />
                    </div>
                </div>
            </div>
            {/* Settings Section */}
            <div>
                <div className="flex items-center gap-2 mb-4 mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-800 dark:text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Resume Setting</h2>
                </div>

                <div className="flex flex-col gap-6 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">

                    {/* Theme Color */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme Color</label>
                            <span className="text-sm text-sky-400">{settings.themeColor}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "#f87171", "#ef4444", "#fb923c", "#f97316", "#fbbf24", "#f59e0b",
                                "#22c55e", "#15803d", "#38bdf8", "#0ea5e9", "#818cf8", "#6366f1"
                            ].map((color, idx) => (
                                <button
                                    key={idx}
                                    style={{ backgroundColor: color }}
                                    className={`w-10 h-10 rounded-md flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 ${settings.themeColor === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-300' : ''}`}
                                    onClick={() => {
                                        setSettings({ ...settings, themeColor: color });
                                    }}
                                >
                                    {settings.themeColor === color && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Font Family</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: "Roboto", label: "Roboto" },
                                { id: "Lato", label: "Lato" },
                                { id: "Montserrat", label: "Montserrat" },
                                { id: "OpenSans", label: "Open Sans" },
                                { id: "Raleway", label: "Raleway" },
                                { id: "Caladea", label: "Caladea" },
                                { id: "Lora", label: "Lora" },
                                { id: "RobotoSlab", label: "Roboto Slab" },
                                { id: "PlayfairDisplay", label: "Playfair Display" },
                                { id: "Merriweather", label: "Merriweather" },
                            ].map((font, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSettings({ ...settings, fontFamily: font.id });
                                    }}
                                    className={`px-4 py-2 border rounded-md text-sm transition-colors w-[calc(20%-10px)] min-w-[120px] ${settings.fontFamily === font.id ? 'text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    style={settings.fontFamily === font.id ? { backgroundColor: settings.themeColor, borderColor: settings.themeColor } : {}}
                                >
                                    {font.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Font Size (pt)</label>
                            <span className="text-sm text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-600 pb-0.5">{settings.fontSize}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {["Compact", "Standard", "Large"].map((sizeLabel, idx) => {
                                // Default mapped standard size to open-resume's 11pt, compact 10, large 12
                                const standardSizePt = 11;
                                const compactSizePt = standardSizePt - 1;
                                const fontSizePt = String(compactSizePt + idx);
                                const isSelected = fontSizePt === settings.fontSize;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSettings({ ...settings, fontSize: fontSizePt });
                                        }}
                                        className={`px-4 py-2 border rounded-md text-sm transition-colors min-w-[100px] ${isSelected ? 'text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        style={isSelected ? { backgroundColor: settings.themeColor, borderColor: settings.themeColor } : {}}
                                    >
                                        {sizeLabel}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Document Size */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Document Size</label>
                        <div className="flex flex-wrap gap-3">
                            {["Letter", "A4"].map((type, idx) => {
                                const isSelected = type === settings.documentSize;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSettings({ ...settings, documentSize: type });
                                        }}
                                        className={`px-4 py-2 border rounded-md text-sm transition-colors min-w-[120px] flex flex-col items-center justify-center ${isSelected ? 'text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        style={isSelected ? { backgroundColor: settings.themeColor, borderColor: settings.themeColor } : {}}
                                    >
                                        <span>{type}</span>
                                        <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-slate-500'}`}>{type === 'Letter' ? '(US, Canada)' : '(other countries)'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ResumeForm;
