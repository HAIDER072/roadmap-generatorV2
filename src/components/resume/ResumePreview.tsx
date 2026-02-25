import React from 'react';
import { PDFViewer, Font } from '@react-pdf/renderer';
import { useResumeContext } from '../../contexts/ResumeContext';
import { ResumePDF } from './ResumePDF';

// Register Fonts
const FONTS = [
    "Roboto", "Lato", "Montserrat", "OpenSans", "Raleway",
    "Caladea", "Lora", "RobotoSlab", "PlayfairDisplay", "Merriweather"
];

let fontsRegistered = false;
const registerFonts = () => {
    if (fontsRegistered) return;
    FONTS.forEach(font => {
        Font.register({
            family: font,
            fonts: [
                { src: `/fonts/${font}-Regular.ttf` },
                { src: `/fonts/${font}-Bold.ttf`, fontWeight: "bold" },
            ]
        });
    });
    fontsRegistered = true;
};
registerFonts();

const ResumePreview: React.FC = () => {
    const { resume, settings } = useResumeContext();

    return (
        <div className="w-full h-full min-h-[500px] bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700">
            <PDFViewer width="100%" height="100%" className="border-0">
                {/* We pass isPDF=true to correctly format text-based SVG icons in PDF */}
                <ResumePDF resume={resume} settings={settings} isPDF={true} />
            </PDFViewer>
        </div>
    );
};

export default ResumePreview;
