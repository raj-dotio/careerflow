import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Check,
  Printer,
  FileCheck,
  RotateCcw,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { type ResumeData, initialSampleResume } from '../utils/sampleResume';

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style'>('basics');
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('careerflow_active_resume');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore error
      }
    }
    return initialSampleResume;
  });

  const [saveStatus, setSaveStatus] = useState<string>('');
  const [newSkillGroup, setNewSkillGroup] = useState('');
  const [newSkillTag, setNewSkillTag] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('careerflow_active_resume', JSON.stringify(resume));
  }, [resume]);

  const handlePrint = () => {
    window.print();
  };

  const handleTestAts = () => {
    localStorage.setItem('careerflow_active_resume', JSON.stringify(resume));
    navigate('/ats');
  };

  const handleLoadSample = () => {
    setResume(initialSampleResume);
    setSaveStatus('Loaded sample data!');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${resume.basics.name.toLowerCase().replace(/\s+/g, '_')}_resume.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.basics && parsed.sections) {
            setResume(parsed);
            setSaveStatus('Imported successfully!');
            setTimeout(() => setSaveStatus(''), 2500);
          } else {
            alert('Invalid Reactive Resume JSON format');
          }
        } catch {
          alert('Failed to parse JSON file');
        }
      };
    }
  };

  const handleSaveToCloud = async () => {
    setSaveStatus('Saving to server...');
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });
      if (res.ok) {
        setSaveStatus('Saved to server database!');
      } else {
        setSaveStatus('Saved locally (Offline Mode)');
      }
    } catch {
      setSaveStatus('Saved locally (Offline Mode)');
    }
    setTimeout(() => setSaveStatus(''), 2500);
  };

  // Add Item Handlers
  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        experience: [
          ...prev.sections.experience,
          {
            id: `exp-${Date.now()}`,
            company: 'Tech Company Inc.',
            position: 'Software Engineer',
            location: 'Remote',
            date: 'Jan 2025 – Present',
            summary: '• Designed and implemented high-performance backend microservices.\n• Collaborated on core product architecture.',
          },
        ],
      },
    }));
  };

  const deleteExperience = (id: string) => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        experience: prev.sections.experience.filter((e) => e.id !== id),
      },
    }));
  };

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        education: [
          ...prev.sections.education,
          {
            id: `edu-${Date.now()}`,
            institution: 'University of Technology',
            degree: 'Bachelor of Science in Computer Science',
            fieldOfStudy: 'Software Engineering',
            score: 'GPA: 3.8 / 4.0',
            date: '2022 – 2026',
          },
        ],
      },
    }));
  };

  const deleteEducation = (id: string) => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        education: prev.sections.education.filter((e) => e.id !== id),
      },
    }));
  };

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        projects: [
          ...prev.sections.projects,
          {
            id: `proj-${Date.now()}`,
            name: 'New Cloud Application',
            description: 'Architected full-stack web application with responsive UI and authenticated RESTful APIs.',
            url: 'https://github.com/my-project',
            keywords: ['React', 'Node.js', 'PostgreSQL'],
          },
        ],
      },
    }));
  };

  const deleteProject = (id: string) => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        projects: prev.sections.projects.filter((p) => p.id !== id),
      },
    }));
  };

  const addSkillGroup = () => {
    if (!newSkillGroup.trim()) return;
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        skills: [
          ...prev.sections.skills,
          {
            id: `sk-${Date.now()}`,
            name: newSkillGroup.trim(),
            keywords: [],
          },
        ],
      },
    }));
    setNewSkillGroup('');
  };

  const addKeywordToSkill = (skillId: string) => {
    const tag = newSkillTag[skillId];
    if (!tag || !tag.trim()) return;

    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        skills: prev.sections.skills.map((s) =>
          s.id === skillId ? { ...s, keywords: [...s.keywords, tag.trim()] } : s
        ),
      },
    }));

    setNewSkillTag((prev) => ({ ...prev, [skillId]: '' }));
  };

  const removeKeywordFromSkill = (skillId: string, keyword: string) => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        skills: prev.sections.skills.map((s) =>
          s.id === skillId ? { ...s, keywords: s.keywords.filter((k) => k !== keyword) } : s
        ),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-[#141416] font-sans antialiased">
      {/* 1. Header Toolbar (No Print) */}
      <header className="no-print sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#e11d48] border border-[#18181b] flex items-center justify-center p-1 text-white">
                <GraduationCap className="w-full h-full" />
              </div>
              <span className="font-extrabold text-[16px] text-[#141416]">CareerFlow</span>
            </Link>
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-semibold text-[13px] text-[#71717a]">Reactive Resume Builder</span>
            {saveStatus && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold rounded-md border border-emerald-200">
                {saveStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestAts}
              className="px-3.5 py-1.5 bg-[#e11d48] text-white rounded-md text-[12px] font-bold hover:bg-[#be123c] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Check ATS Score</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-medium hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
              title="Load full student template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sample</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-medium hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
              title="Export Reactive Resume JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-medium hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleSaveToCloud}
              className="px-3 py-1.5 bg-[#18181b] text-white rounded-md text-[12px] font-bold hover:bg-black transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="max-w-[1440px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================
            LEFT COLUMN: SECTION ACCORDION FORM EDITOR (No Print)
        ========================================================= */}
        <div className="no-print lg:col-span-5 bg-white rounded-[16px] border border-[#e4e4e7] shadow-xs flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          {/* Section Navigation Tabs */}
          <div className="border-b border-[#e4e4e7] p-2 flex overflow-x-auto gap-1 bg-[#fafafa]">
            {[
              { id: 'basics', label: 'Basics', icon: User },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'skills', label: 'Skills', icon: Code2 },
              { id: 'projects', label: 'Projects', icon: FolderGit2 },
              { id: 'awards', label: 'Honors', icon: Award },
              { id: 'style', label: 'Theme', icon: Sparkles },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[#e11d48] border border-[#e4e4e7] shadow-xs'
                      : 'text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body (Scrollable) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[13px]">
            {/* TAB: BASICS */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[15px] text-[#18181b]">Personal Information</h3>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-1">FULL NAME</label>
                  <input
                    type="text"
                    value={resume.basics.name}
                    onChange={(e) =>
                      setResume({ ...resume, basics: { ...resume.basics, name: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-1">HEADLINE / TARGET ROLE</label>
                  <input
                    type="text"
                    value={resume.basics.headline}
                    onChange={(e) =>
                      setResume({ ...resume, basics: { ...resume.basics, headline: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">EMAIL</label>
                    <input
                      type="email"
                      value={resume.basics.email}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, email: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">PHONE</label>
                    <input
                      type="text"
                      value={resume.basics.phone}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, phone: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">LOCATION</label>
                    <input
                      type="text"
                      value={resume.basics.location}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, location: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">WEBSITE / PORTFOLIO</label>
                    <input
                      type="text"
                      value={resume.basics.url}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, url: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">GITHUB PROFILE</label>
                    <input
                      type="text"
                      value={resume.basics.github || ''}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, github: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">LINKEDIN URL</label>
                    <input
                      type="text"
                      value={resume.basics.linkedin || ''}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, linkedin: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-1">
                    EXECUTIVE SUMMARY (OBJECTIVE)
                  </label>
                  <textarea
                    rows={4}
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] focus:outline-none focus:border-[#e11d48]"
                  />
                </div>
              </div>
            )}

            {/* TAB: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15px] text-[#18181b]">Work &amp; Internship Experience</h3>
                  <button
                    onClick={addExperience}
                    className="px-2.5 py-1 bg-[#18181b] text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-black"
                  >
                    <Plus className="w-3 h-3" /> Add Role
                  </button>
                </div>

                {resume.sections.experience.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-3.5 rounded-lg border border-[#e4e4e7] bg-[#fafafa] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#e11d48]">ROLE #{idx + 1}</span>
                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete this role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              experience: prev.sections.experience.map((it) =>
                                it.id === exp.id ? { ...it, company: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                      <input
                        placeholder="Position Title"
                        value={exp.position}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              experience: prev.sections.experience.map((it) =>
                                it.id === exp.id ? { ...it, position: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Dates (e.g. June 2025 – Aug 2025)"
                        value={exp.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              experience: prev.sections.experience.map((it) =>
                                it.id === exp.id ? { ...it, date: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                      <input
                        placeholder="Location"
                        value={exp.location || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              experience: prev.sections.experience.map((it) =>
                                it.id === exp.id ? { ...it, location: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#71717a] mb-1">
                        BULLET POINTS &amp; ACHIEVEMENTS (Use • for bullet points)
                      </label>
                      <textarea
                        rows={4}
                        value={exp.summary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              experience: prev.sections.experience.map((it) =>
                                it.id === exp.id ? { ...it, summary: val } : it
                              ),
                            },
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: EDUCATION */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15px] text-[#18181b]">Education &amp; Academics</h3>
                  <button
                    onClick={addEducation}
                    className="px-2.5 py-1 bg-[#18181b] text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-black"
                  >
                    <Plus className="w-3 h-3" /> Add Degree
                  </button>
                </div>

                {resume.sections.education.map((edu, idx) => (
                  <div key={edu.id || idx} className="p-3.5 rounded-lg border border-[#e4e4e7] bg-[#fafafa] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#e11d48]">ENTRY #{idx + 1}</span>
                      <button
                        onClick={() => deleteEducation(edu.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      placeholder="University / College Name"
                      value={edu.institution}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResume((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            education: prev.sections.education.map((it) =>
                              it.id === edu.id ? { ...it, institution: val } : it
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Degree (e.g. B.Tech / B.S.)"
                        value={edu.degree}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              education: prev.sections.education.map((it) =>
                                it.id === edu.id ? { ...it, degree: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                      <input
                        placeholder="GPA / Score"
                        value={edu.score || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              education: prev.sections.education.map((it) =>
                                it.id === edu.id ? { ...it, score: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                    </div>

                    <input
                      placeholder="Graduation Year / Dates"
                      value={edu.date}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResume((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            education: prev.sections.education.map((it) =>
                              it.id === edu.id ? { ...it, date: val } : it
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: SKILLS */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[15px] text-[#18181b]">Technical Skills Categorization</h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillGroup}
                    onChange={(e) => setNewSkillGroup(e.target.value)}
                    placeholder="New Skill Group (e.g. DevOps & Cloud)"
                    className="flex-1 px-3 py-1.5 rounded border border-[#d4d4d8] text-[12px]"
                  />
                  <button
                    onClick={addSkillGroup}
                    className="px-3 py-1.5 bg-[#18181b] text-white rounded text-[12px] font-bold hover:bg-black"
                  >
                    Add Group
                  </button>
                </div>

                {resume.sections.skills.map((group) => (
                  <div key={group.id} className="p-3.5 rounded-lg border border-[#e4e4e7] bg-[#fafafa] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[13px] text-[#18181b]">{group.name}</span>
                      <button
                        onClick={() =>
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              skills: prev.sections.skills.filter((s) => s.id !== group.id),
                            },
                          }))
                        }
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {group.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-[#d4d4d8] rounded text-[11px] font-medium text-[#18181b] flex items-center gap-1"
                        >
                          {kw}
                          <button
                            onClick={() => removeKeywordFromSkill(group.id, kw)}
                            className="text-[#a1a1aa] hover:text-red-500 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Keyword to Group */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newSkillTag[group.id] || ''}
                        onChange={(e) => setNewSkillTag({ ...newSkillTag, [group.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addKeywordToSkill(group.id)}
                        placeholder="Add skill tag (press Enter)..."
                        className="flex-1 px-2.5 py-1 text-[11px] rounded border border-[#d4d4d8] bg-white"
                      />
                      <button
                        onClick={() => addKeywordToSkill(group.id)}
                        className="px-2.5 py-1 bg-[#e11d48] text-white rounded text-[11px] font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15px] text-[#18181b]">Key Technical Projects</h3>
                  <button
                    onClick={addProject}
                    className="px-2.5 py-1 bg-[#18181b] text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-black"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>

                {resume.sections.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="p-3.5 rounded-lg border border-[#e4e4e7] bg-[#fafafa] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#e11d48]">PROJECT #{idx + 1}</span>
                      <button onClick={() => deleteProject(proj.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Project Name"
                        value={proj.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              projects: prev.sections.projects.map((it) =>
                                it.id === proj.id ? { ...it, name: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white font-semibold"
                      />
                      <input
                        placeholder="GitHub / Live Demo Link"
                        value={proj.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              projects: prev.sections.projects.map((it) =>
                                it.id === proj.id ? { ...it, url: val } : it
                              ),
                            },
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                      />
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Architecture & impact description..."
                      value={proj.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResume((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            projects: prev.sections.projects.map((it) =>
                              it.id === proj.id ? { ...it, description: val } : it
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px] bg-white"
                    />

                    <input
                      placeholder="Tech keywords comma-separated (e.g. Go, Redis, Docker)"
                      value={proj.keywords.join(', ')}
                      onChange={(e) => {
                        const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setResume((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            projects: prev.sections.projects.map((it) =>
                              it.id === proj.id ? { ...it, keywords: arr } : it
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1 text-[11px] rounded border border-[#d4d4d8] bg-white font-mono"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: HONORS */}
            {activeTab === 'awards' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[15px] text-[#18181b]">Certifications &amp; Honors</h3>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-1">CERTIFICATIONS</label>
                  {resume.sections.certifications.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        value={c.name}
                        placeholder="Certificate Title"
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              certifications: prev.sections.certifications.map((it, idx) =>
                                idx === i ? { ...it, name: val } : it
                              ),
                            },
                          }));
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px]"
                      />
                      <input
                        value={c.issuer}
                        placeholder="Issuer (e.g. AWS)"
                        onChange={(e) => {
                          const val = e.target.value;
                          setResume((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              certifications: prev.sections.certifications.map((it, idx) =>
                                idx === i ? { ...it, issuer: val } : it
                              ),
                            },
                          }));
                        }}
                        className="w-1/3 px-2.5 py-1.5 rounded border border-[#d4d4d8] text-[12px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: STYLE / THEME */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[15px] text-[#18181b]">Template &amp; Formatting</h3>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-2">TEMPLATE DESIGN</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', name: 'Modern Clean' },
                      { id: 'classic', name: 'Classic ATS' },
                      { id: 'minimal', name: 'Tech Minimal' },
                      { id: 'executive', name: 'Executive Dark' },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() =>
                          setResume({
                            ...resume,
                            metadata: { ...resume.metadata, template: tpl.id as 'modern' | 'classic' | 'minimal' | 'executive' },
                          })
                        }
                        className={`p-3 rounded-lg border text-left text-[12px] font-bold transition-all ${
                          resume.metadata.template === tpl.id
                            ? 'border-[#e11d48] bg-[#fef2f2] text-[#e11d48]'
                            : 'border-[#d4d4d8] bg-white text-[#18181b]'
                        }`}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#71717a] mb-2">PRIMARY ACCENT COLOR</label>
                  <div className="flex gap-2">
                    {['#0066cc', '#e11d48', '#059669', '#7c3aed', '#18181b'].map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setResume({
                            ...resume,
                            metadata: { ...resume.metadata, themeColor: color },
                          })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          resume.metadata.themeColor === color ? 'scale-110 border-black' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: REAL-TIME A4 LIVE RESUME PREVIEW
        ========================================================= */}
        <div className="lg:col-span-7 flex justify-center">
          {/* Printable A4 Container */}
          <div
            id="resume-printable"
            className="w-full max-w-[800px] bg-white rounded-[12px] border border-[#e4e4e7] p-8 sm:p-12 shadow-md transition-all text-[#1d1d1f]"
            style={{ minHeight: '1050px' }}
          >
            {/* 1. Header & Contact Details */}
            <div
              className={`pb-4 border-b ${
                resume.metadata.template === 'minimal' ? 'border-[#e4e4e7]' : 'border-b-2'
              }`}
              style={{
                borderColor:
                  resume.metadata.template === 'classic'
                    ? '#18181b'
                    : resume.metadata.themeColor || '#0066cc',
              }}
            >
              <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#18181b]">
                {resume.basics.name || 'Your Full Name'}
              </h1>
              <p
                className="text-[14px] sm:text-[15px] font-medium mt-0.5"
                style={{ color: resume.metadata.themeColor || '#0066cc' }}
              >
                {resume.basics.headline || 'Full-Stack Software Engineer'}
              </p>

              {/* Contact Icons Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#52525b] mt-2.5 font-sans">
                {resume.basics.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.email}
                  </span>
                )}
                {resume.basics.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.phone}
                  </span>
                )}
                {resume.basics.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.location}
                  </span>
                )}
                {resume.basics.url && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.url.replace(/^https?:\/\//, '')}
                  </span>
                )}
                {resume.basics.github && (
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.github.replace(/^https?:\/\//, '')}
                  </span>
                )}
                {resume.basics.linkedin && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#71717a]" />
                    {resume.basics.linkedin.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Professional Summary */}
            {resume.summary && (
              <div className="mt-4">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-1.5"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Summary
                </h4>
                <p className="text-[12px] sm:text-[13px] leading-relaxed text-[#3f3f46]">
                  {resume.summary}
                </p>
              </div>
            )}

            {/* 3. Education Section */}
            {resume.sections.education.length > 0 && (
              <div className="mt-4">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-2"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Education
                </h4>
                <div className="space-y-2">
                  {resume.sections.education.map((edu, i) => (
                    <div key={i} className="flex justify-between items-baseline text-[12px]">
                      <div>
                        <span className="font-bold text-[#18181b] block">{edu.institution}</span>
                        <span className="text-[#52525b]">
                          {edu.degree} {edu.score && `· ${edu.score}`}
                        </span>
                      </div>
                      <span className="text-[#71717a] font-mono text-[11px] shrink-0">{edu.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Experience Section */}
            {resume.sections.experience.length > 0 && (
              <div className="mt-5">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-2"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Experience
                </h4>
                <div className="space-y-3.5">
                  {resume.sections.experience.map((exp, i) => (
                    <div key={i} className="text-[12px]">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-[#18181b]">{exp.position}</span>
                          <span className="text-[#52525b] font-medium"> — {exp.company}</span>
                        </div>
                        <span className="text-[#71717a] font-mono text-[11px] shrink-0">
                          {exp.date} {exp.location && `· ${exp.location}`}
                        </span>
                      </div>
                      <div className="mt-1 whitespace-pre-line text-[#3f3f46] text-[12px] leading-relaxed">
                        {exp.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Projects Section */}
            {resume.sections.projects.length > 0 && (
              <div className="mt-5">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-2"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Key Projects
                </h4>
                <div className="space-y-3">
                  {resume.sections.projects.map((proj, i) => (
                    <div key={i} className="text-[12px]">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-[#18181b]">{proj.name}</span>
                        {proj.keywords.length > 0 && (
                          <span className="text-[11px] font-mono text-[#71717a]">
                            [{proj.keywords.join(', ')}]
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[#3f3f46] text-[12px] leading-relaxed">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Technical Skills Section */}
            {resume.sections.skills.length > 0 && (
              <div className="mt-5">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-2"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Technical Skills
                </h4>
                <div className="space-y-1.5 text-[12px]">
                  {resume.sections.skills.map((sk, i) => (
                    <div key={i} className="flex items-baseline">
                      <span className="font-bold text-[#18181b] w-36 shrink-0">{sk.name}:</span>
                      <span className="text-[#3f3f46]">{sk.keywords.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Awards & Certifications */}
            {(resume.sections.certifications.length > 0 || resume.sections.awards.length > 0) && (
              <div className="mt-5 pt-2 border-t border-[#f4f4f5]">
                <h4
                  className="text-[12px] font-bold tracking-wider uppercase font-mono mb-1.5"
                  style={{ color: resume.metadata.themeColor || '#0066cc' }}
                >
                  Certifications &amp; Honors
                </h4>
                <div className="space-y-1 text-[12px] text-[#3f3f46]">
                  {resume.sections.certifications.map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span>• {c.name} — <span className="text-[#71717a]">{c.issuer}</span></span>
                      <span className="text-[#71717a] font-mono text-[11px]">{c.date}</span>
                    </div>
                  ))}
                  {resume.sections.awards.map((a, i) => (
                    <div key={i} className="flex justify-between">
                      <span>• {a.title} — <span className="text-[#71717a]">{a.awarder}</span></span>
                      <span className="text-[#71717a] font-mono text-[11px]">{a.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
