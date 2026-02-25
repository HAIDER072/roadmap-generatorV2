import { View } from "@react-pdf/renderer";
import {
  ResumePDFBulletList,
  ResumePDFSection,
  ResumePDFText,
} from "./common";
import { styles, spacing } from "./styles";
import type { ResumeEducation } from "../../../contexts/ResumeContext";

export const ResumePDFEducation = ({
  heading,
  educations,
  themeColor,
  showBulletPoints,
}: {
  heading: string;
  educations: ResumeEducation[];
  themeColor: string;
  showBulletPoints: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading}>
      {educations.filter(e => !e.hidden).map(
        ({ school, degree, date, gpa, descriptions = [] }, idx, array) => {
          // Hide school name if it is the same as the previous school
          const hideSchoolName =
            idx > 0 && school === array[idx - 1].school;
          const showDescriptions = descriptions.join() !== "";

          return (
            <View key={idx}>
              {!hideSchoolName && (
                <ResumePDFText bold={true}>{school}</ResumePDFText>
              )}
              <View
                style={{
                  ...styles.flexRowBetween,
                  marginTop: hideSchoolName
                    ? "-" + spacing["1"]
                    : spacing["1.5"],
                }}
              >
                <ResumePDFText>{`${gpa
                  ? `${degree} - ${Number(gpa) ? gpa + " GPA" : gpa}`
                  : degree
                  }`}</ResumePDFText>
                <ResumePDFText>{date}</ResumePDFText>
              </View>
              {showDescriptions && (
                <View style={{ ...styles.flexCol, marginTop: spacing["1.5"] }}>
                  <ResumePDFBulletList
                    items={descriptions}
                    showBulletPoints={showBulletPoints}
                  />
                </View>
              )}
            </View>
          );
        }
      )}
    </ResumePDFSection>
  );
};
