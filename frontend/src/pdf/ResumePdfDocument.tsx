import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { ResumeData } from '../types';

// Register a font that supports Hebrew
Font.register({
  family: 'NotoSansHebrew',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanshebrew/NotoSansHebrew%5Bwdth%2Cwght%5D.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanshebrew/NotoSansHebrew%5Bwdth%2Cwght%5D.ttf',
      fontWeight: 'bold',
    },
  ],
});

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf',
      fontWeight: 'bold',
    },
  ],
});

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '');
}

const BLUE = '#1A365D';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'NotoSans',
  },
  pageRtl: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'NotoSansHebrew',
  },
  header: {
    backgroundColor: BLUE,
    padding: 15,
    marginBottom: 10,
    marginTop: -30,
    marginLeft: -30,
    marginRight: -30,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  contact: {
    fontSize: 9,
    color: '#FFFFFF',
    marginTop: 4,
  },
  summary: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BLUE,
    borderBottomWidth: 1,
    borderBottomColor: '#000041',
    paddingBottom: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  bullet: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 1,
    lineHeight: 1.3,
  },
  skillsText: {
    fontSize: 9,
    marginBottom: 2,
  },
});

interface Props {
  data: ResumeData;
  rtl?: boolean;
}

export default function ResumePdfDocument({ data, rtl }: Props) {
  const experience = Array.isArray(data.experience) ? data.experience.filter(Boolean) : [];
  const projects = Array.isArray(data.projects) ? data.projects.filter(Boolean) : [];
  const education = Array.isArray(data.education) ? data.education.filter(Boolean) : [];
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
  const languages = Array.isArray(data.languages) ? data.languages.filter(Boolean) : [];

  const contactParts = [data.phone, data.email, data.linkedin].filter(Boolean);

  const eduHeading = data.education_heading || (rtl ? 'השכלה וקורסים' : 'Education & Courses');
  const expHeading = data.experience_heading || (rtl ? 'ניסיון תעסוקתי' : 'Experience');
  const projHeading = data.projects_heading || (rtl ? 'פרויקטים' : 'Projects');
  const milHeading = data.military_heading || (rtl ? 'שירות צבאי' : 'Military Service');
  const langHeading = data.languages_heading || (rtl ? 'שפות' : 'Languages');
  const skillHeading = data.skills_heading || (rtl ? 'כישורים' : 'Skills');

  const textAlign = rtl ? 'right' as const : 'left' as const;

  return (
    <Document>
      <Page size="A4" style={rtl ? styles.pageRtl : styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.name, { textAlign }]}>{stripBold(data.name || '')}</Text>
          {data.title && <Text style={[styles.title, { textAlign }]}>{stripBold(data.title)}</Text>}
          {contactParts.length > 0 && (
            <Text style={[styles.contact, { textAlign }]}>{contactParts.join(' | ')}</Text>
          )}
        </View>

        {/* Summary */}
        {data.summary && (
          <Text style={[styles.summary, { textAlign }]}>{stripBold(data.summary)}</Text>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{eduHeading}</Text>
            {education.map((edu, i) => (
              <View key={i}>
                <Text style={[styles.subHeading, { textAlign }]}>
                  {edu.dates} | {edu.degree || ''} — {edu.institution || ''}
                </Text>
                {Array.isArray(edu.bullets) && edu.bullets.map((b, j) => (
                  <Text key={j} style={[styles.bullet, { textAlign }]}>• {stripBold(b)}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{expHeading}</Text>
            {experience.map((exp, i) => (
              <View key={i}>
                <Text style={[styles.subHeading, { textAlign }]}>
                  {exp.dates} | {exp.role || ''} — {exp.company || ''}
                </Text>
                {Array.isArray(exp.bullets) && exp.bullets.map((b, j) => (
                  <Text key={j} style={[styles.bullet, { textAlign }]}>• {stripBold(b)}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{projHeading}</Text>
            {projects.map((proj, i) => (
              <View key={i}>
                <Text style={[styles.subHeading, { textAlign }]}>
                  {proj.name || ''} ({proj.dates || ''})
                </Text>
                {Array.isArray(proj.bullets) && proj.bullets.map((b, j) => (
                  <Text key={j} style={[styles.bullet, { textAlign }]}>• {stripBold(b)}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Military Service */}
        {data.military_service && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{milHeading}</Text>
            <Text style={[styles.subHeading, { textAlign }]}>
              {data.military_service.dates} | {data.military_service.role}
            </Text>
            {data.military_service.details && (
              <Text style={[styles.bullet, { textAlign }]}>{data.military_service.details}</Text>
            )}
          </View>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{langHeading}</Text>
            <Text style={[styles.skillsText, { textAlign }]}>{languages.join(' • ')}</Text>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View>
            <Text style={[styles.sectionHeading, { textAlign }]}>{skillHeading}</Text>
            <Text style={[styles.skillsText, { textAlign }]}>{skills.map(s => stripBold(s)).join(' • ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
