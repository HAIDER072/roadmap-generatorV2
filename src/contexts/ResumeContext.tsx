import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Types ---
export interface ResumeProfile {
    name: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: string;
}

export interface ResumeWorkExperience {
    company: string;
    jobTitle: string;
    date: string;
    descriptions: string[];
    hidden?: boolean;
}

export interface ResumeEducation {
    school: string;
    degree: string;
    date: string;
    gpa: string;
    descriptions: string[];
    hidden?: boolean;
}

export interface ResumeProject {
    project: string;
    date: string;
    descriptions: string[];
    hidden?: boolean;
}

export interface FeaturedSkill {
    skill: string;
    rating: number;
}

export interface ResumeSkills {
    featuredSkills: FeaturedSkill[];
    descriptions: string[];
}

export interface ResumeCustom {
    descriptions: string[];
}

export interface Resume {
    profile: ResumeProfile;
    workExperiences: ResumeWorkExperience[];
    educations: ResumeEducation[];
    projects: ResumeProject[];
    skills: ResumeSkills;
    custom: ResumeCustom;
}

export type ShowForm = "workExperiences" | "educations" | "projects" | "skills" | "custom";

export interface Settings {
    themeColor: string;
    fontFamily: string;
    fontSize: string;
    documentSize: string;
    formToShow: Record<ShowForm, boolean>;
    formToHeading: Record<ShowForm, string>;
    formsOrder: ShowForm[];
    showBulletPoints: Record<ShowForm, boolean>;
}

// --- Initial State ---
export const initialProfile: ResumeProfile = {
    name: "",
    summary: "",
    email: "",
    phone: "",
    location: "",
    url: "",
};

export const initialWorkExperience: ResumeWorkExperience = {
    company: "",
    jobTitle: "",
    date: "",
    descriptions: [],
};

export const initialEducation: ResumeEducation = {
    school: "",
    degree: "",
    gpa: "",
    date: "",
    descriptions: [],
};

export const initialProject: ResumeProject = {
    project: "",
    date: "",
    descriptions: [],
};

export const initialFeaturedSkill: FeaturedSkill = { skill: "", rating: 4 };
export const initialFeaturedSkills: FeaturedSkill[] = Array(6).fill({ ...initialFeaturedSkill });
export const initialSkills: ResumeSkills = {
    featuredSkills: initialFeaturedSkills,
    descriptions: [],
};

export const initialCustom: ResumeCustom = {
    descriptions: [],
};

export const initialResumeState: Resume = {
    profile: initialProfile,
    workExperiences: [initialWorkExperience],
    educations: [initialEducation],
    projects: [initialProject],
    skills: initialSkills,
    custom: initialCustom,
};

export const initialSettings: Settings = {
    themeColor: "#38bdf8",
    fontFamily: "Roboto",
    fontSize: "11",
    documentSize: "Letter",
    formToShow: {
        workExperiences: true,
        educations: true,
        projects: true,
        skills: true,
        custom: false,
    },
    formToHeading: {
        workExperiences: "WORK EXPERIENCE",
        educations: "EDUCATION",
        projects: "PROJECT",
        skills: "SKILLS",
        custom: "CUSTOM SECTION",
    },
    formsOrder: ["workExperiences", "educations", "projects", "skills", "custom"],
    showBulletPoints: {
        workExperiences: true, // open-resume missed this in type definition but it's needed
        educations: true,
        projects: true,
        skills: true,
        custom: true,
    },
};

// --- Context Definition ---
interface ResumeContextType {
    resume: Resume;
    setResume: React.Dispatch<React.SetStateAction<Resume>>;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;

    // Helpers
    updateProfile: (field: keyof ResumeProfile, value: string) => void;
    updateWorkExperience: (idx: number, field: keyof ResumeWorkExperience, value: any) => void;
    updateEducation: (idx: number, field: keyof ResumeEducation, value: any) => void;
    updateProject: (idx: number, field: keyof ResumeProject, value: any) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [resume, setResume] = useState<Resume>(() => {
        const saved = localStorage.getItem('resumeState');
        return saved ? JSON.parse(saved) : initialResumeState;
    });
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('resumeSettings');
        return saved ? JSON.parse(saved) : initialSettings;
    });

    // Sync to local storage on change
    React.useEffect(() => {
        localStorage.setItem('resumeState', JSON.stringify(resume));
    }, [resume]);

    React.useEffect(() => {
        localStorage.setItem('resumeSettings', JSON.stringify(settings));
    }, [settings]);

    const updateProfile = (field: keyof ResumeProfile, value: string) => {
        setResume(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    };

    const updateWorkExperience = (idx: number, field: keyof ResumeWorkExperience, value: any) => {
        setResume(prev => {
            const newList = [...prev.workExperiences];
            newList[idx] = { ...newList[idx], [field]: value };
            return { ...prev, workExperiences: newList };
        });
    };

    const updateEducation = (idx: number, field: keyof ResumeEducation, value: any) => {
        setResume(prev => {
            const newList = [...prev.educations];
            newList[idx] = { ...newList[idx], [field]: value };
            return { ...prev, educations: newList };
        });
    };

    const updateProject = (idx: number, field: keyof ResumeProject, value: any) => {
        setResume(prev => {
            const newList = [...prev.projects];
            newList[idx] = { ...newList[idx], [field]: value };
            return { ...prev, projects: newList };
        });
    };

    return (
        <ResumeContext.Provider value={{
            resume,
            setResume,
            settings,
            setSettings,
            updateProfile,
            updateWorkExperience,
            updateEducation,
            updateProject
        }}>
            {children}
        </ResumeContext.Provider>
    );
};

export const useResumeContext = () => {
    const context = useContext(ResumeContext);
    if (context === undefined) {
        throw new Error('useResumeContext must be used within a ResumeProvider');
    }
    return context;
};
