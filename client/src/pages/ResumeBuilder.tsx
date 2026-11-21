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
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { type ResumeData, initialSampleResume } from '../utils/sampleResume';
import logo2 from '../assets/new2.png';

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
            id: `exp_${Date.now()}`,
            company: 'Tech Company Inc.',
            position: 'Software Engineer',
            location: 'Bengaluru / Remote',
            date: 'June 2025 – Present',
            summary: '• Architected resilient microservices reducing API latency by 35%.\n• Collaborated with product team on high-concurrency event ingestion.',
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
            id: `edu_${Date.now()}`,
            institution: 'National Institute of Technology',
            degree: 'B.Tech in Computer Science',
            fieldOfStudy: 'Computer Science & Engineering',
            score: '8.8 / 10 CGPA',
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
            id: `proj_${Date.now()}`,
            name: 'Distributed Cloud Storage Engine',
            description: 'Engineered high-throughput sharded distributed file cache in Go and Redis with Raft consensus.',
            url: 'https://github.com/candidate/cloud-storage',
            keywords: ['Go', 'Redis', 'Docker', 'gRPC'],
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
            id: `skill_${Date.now()}`,
            name: newSkillGroup.trim(),
            keywords: ['Skill 1', 'Skill 2'],
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
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white">
      {/* Print isolation style */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #resume-printable {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>

      {/* 1. Header Toolbar (No Print) */}
      <header className="no-print sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b-2 border-[#18181b] px-4 sm:px-6 py-2.5">
        <div className="max-w-[1500px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
              <img src={logo2} alt="CareerFlow Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            <span className="text-[#a1a1aa] font-bold">/</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white sketch-border-sm text-[12px] font-bold text-[#141416]">
              <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Reactive Resume Builder</span>
            </div>
            {saveStatus && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold rounded-lg border-2 border-emerald-600 shadow-[1px_1px_0px_#059669]">
                {saveStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-bold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#141416]" />
              <span>Home</span>
            </Link>

            <Link
              to="/skills"
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-bold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Skill Tracker</span>
            </Link>

            <button
              onClick={handleTestAts}
              className="sketch-btn-red px-3.5 py-1.5 text-[12px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#18181b] cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Check ATS Score</span>
            </button>

            <button
              onClick={handlePrint}
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
              title="Load full student template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sample</span>
            </button>

            <button
              onClick={handleExportJson}
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
              title="Export Reactive Resume JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="sketch-btn-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
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
              className="sketch-btn-white px-3.5 py-1.5 text-[12px] font-bold hover:bg-[#ffe4e6] flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Page Sub-Header / Status Banner (Full width across top so both main cards start at exact same level) */}
      <div className="no-print max-w-[1500px] mx-auto px-4 sm:px-6 pt-5 pb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white sketch-border-sm text-[12px] font-bold text-[#141416]">
          <Flame className="w-3.5 h-3.5 text-[#e11d48]" />
          <span>Campus Placement Simulator · Reactive Resume Engine</span>
        </div>
        <span className="font-hand text-[16px] text-[#e11d48] font-bold transform -rotate-1">
          ✨ Live Real-Time ATS Rendered Preview · Auto-Saved
        </span>
      </div>

      {/* 3. Main Workspace Layout - Left & Right Columns Aligned at Exact Same Level */}
      <div className="max-w-[1500px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================
            LEFT COLUMN: SECTION ACCORDION FORM EDITOR (No Print)
            Styled with organic hand-drawn sketch-border like Image 1
        ========================================================= */}
        <div className="no-print lg:col-span-5 bg-white sketch-border flex flex-col h-[calc(100vh-135px)] lg:sticky lg:top-[85px] overflow-hidden">
          {/* Section Navigation Tabs with comfortable headroom */}
          <div className="border-b-2 border-[#18181b] pt-4 pb-2.5 px-4 flex overflow-x-auto gap-2 bg-[#faf8f5] items-center">
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
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e11d48] text-white sketch-border-sm'
                      : 'bg-white text-[#3f3f46] hover:bg-[#ffe4e6] border border-[#18181b]/30 rounded-[10px]'
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
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#e11d48]" />
                    <span>Personal Information</span>
                  </h3>
                  <span className="font-hand text-[15px] text-[#e11d48] font-bold">✨ Contact &amp; Links</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">FULL NAME</label>
                  <input
                    type="text"
                    value={resume.basics.name}
                    onChange={(e) =>
                      setResume({ ...resume, basics: { ...resume.basics, name: e.target.value } })
                    }
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">HEADLINE / TARGET ROLE</label>
                  <input
                    type="text"
                    value={resume.basics.headline}
                    onChange={(e) =>
                      setResume({ ...resume, basics: { ...resume.basics, headline: e.target.value } })
                    }
                    placeholder="e.g. Full-Stack Software Engineer"
                    className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">EMAIL</label>
                    <input
                      type="email"
                      value={resume.basics.email}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, email: e.target.value } })
                      }
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">PHONE</label>
                    <input
                      type="text"
                      value={resume.basics.phone}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, phone: e.target.value } })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">LOCATION</label>
                    <input
                      type="text"
                      value={resume.basics.location}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, location: e.target.value } })
                      }
                      placeholder="Bengaluru, India"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">PORTFOLIO / WEBSITE</label>
                    <input
                      type="text"
                      value={resume.basics.url}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, url: e.target.value } })
                      }
                      placeholder="https://rahul.dev"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">GITHUB PROFILE</label>
                    <input
                      type="text"
                      value={resume.basics.github || ''}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, github: e.target.value } })
                      }
                      placeholder="github.com/rahul"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">LINKEDIN URL</label>
                    <input
                      type="text"
                      value={resume.basics.linkedin || ''}
                      onChange={(e) =>
                        setResume({ ...resume, basics: { ...resume.basics, linkedin: e.target.value } })
                      }
                      placeholder="linkedin.com/in/rahul"
                      className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1.5 uppercase">
                    EXECUTIVE SUMMARY (OBJECTIVE)
                  </label>
                  <textarea
                    rows={4}
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    placeholder="Brief 2-3 sentence overview of your technical background, core impact, and target placement goals..."
                    className="w-full px-3.5 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#e11d48]" />
                    <span>Work &amp; Internship Experience</span>
                  </h3>
                  <button
                    onClick={addExperience}
                    className="sketch-btn-white px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#ffe4e6] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e11d48]" /> Add Role
                  </button>
                </div>

                {resume.sections.experience.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-4 sketch-border-sm bg-[#faf8f5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-0.5 bg-[#ffe4e6] text-[#e11d48] font-mono font-bold text-[11px] rounded-md border border-[#e11d48]/30">
                        ROLE #{idx + 1}
                      </span>
                      <button
                        onClick={() => deleteExperience(exp.id)}
                        className="p-1 text-[#e11d48] hover:bg-[#ffe4e6] rounded-md transition-colors cursor-pointer"
                        title="Delete this role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white font-bold focus:outline-none focus:border-[#e11d48]"
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white font-medium focus:outline-none focus:border-[#e11d48]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white font-mono focus:outline-none focus:border-[#e11d48]"
                      />
                      <input
                        placeholder="Location (e.g. Remote / Bengaluru)"
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-1">
                        BULLET POINTS &amp; ACHIEVEMENTS (Use • for bullets)
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
                        placeholder="• Architected backend microservices using Node.js and TypeScript, decreasing response time by 35%."
                        className="w-full px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48] leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: EDUCATION */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#e11d48]" />
                    <span>Education &amp; Academics</span>
                  </h3>
                  <button
                    onClick={addEducation}
                    className="sketch-btn-white px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#ffe4e6] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e11d48]" /> Add Degree
                  </button>
                </div>

                {resume.sections.education.map((edu, idx) => (
                  <div key={edu.id || idx} className="p-4 sketch-border-sm bg-[#faf8f5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-0.5 bg-[#ffe4e6] text-[#e11d48] font-mono font-bold text-[11px] rounded-md border border-[#e11d48]/30">
                        DEGREE #{idx + 1}
                      </span>
                      <button
                        onClick={() => deleteEducation(edu.id)}
                        className="p-1 text-[#e11d48] hover:bg-[#ffe4e6] rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
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
                      className="w-full px-3 py-2 sketch-border-sm text-[12px] bg-white font-bold focus:outline-none focus:border-[#e11d48]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        placeholder="Degree (e.g. B.Tech in CSE)"
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                      <input
                        placeholder="GPA / Score (e.g. 8.8 CGPA)"
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                    </div>

                    <input
                      placeholder="Graduation Year / Dates (e.g. 2022 – 2026)"
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
                      className="w-full px-3 py-2 sketch-border-sm text-[12px] bg-white font-mono focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: SKILLS */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#e11d48]" />
                    <span>Technical Skills Matrix</span>
                  </h3>
                  <Link to="/skills" className="font-hand text-[15px] text-[#e11d48] font-bold hover:underline">
                    → Sync with Skill Tracker
                  </Link>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillGroup}
                    onChange={(e) => setNewSkillGroup(e.target.value)}
                    placeholder="New Skill Group (e.g. DevOps & Cloud)"
                    className="flex-1 px-3.5 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                  />
                  <button
                    onClick={addSkillGroup}
                    className="sketch-btn-red px-4 py-2 text-[12px] font-bold text-white cursor-pointer"
                  >
                    Add Group
                  </button>
                </div>

                {resume.sections.skills.map((group) => (
                  <div key={group.id} className="p-4 sketch-border-sm bg-[#faf8f5] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[13px] text-[#18181b]">{group.name}</span>
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
                        className="p-1 text-[#e11d48] hover:bg-[#ffe4e6] rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                      {group.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-white sketch-border-sm text-[11px] font-bold text-[#141416] flex items-center gap-1.5"
                        >
                          {kw}
                          <button
                            onClick={() => removeKeywordFromSkill(group.id, kw)}
                            className="text-[#a1a1aa] hover:text-[#e11d48] font-black ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Keyword to Group */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newSkillTag[group.id] || ''}
                        onChange={(e) => setNewSkillTag({ ...newSkillTag, [group.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addKeywordToSkill(group.id)}
                        placeholder="Add skill tag (press Enter)..."
                        className="flex-1 px-3 py-1.5 text-[11px] sketch-border-sm bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                      <button
                        onClick={() => addKeywordToSkill(group.id)}
                        className="sketch-btn-white px-3 py-1 text-[11px] font-bold hover:bg-[#ffe4e6] cursor-pointer"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-[#e11d48]" />
                    <span>Key Technical Projects</span>
                  </h3>
                  <button
                    onClick={addProject}
                    className="sketch-btn-white px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#ffe4e6] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e11d48]" /> Add Project
                  </button>
                </div>

                {resume.sections.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="p-4 sketch-border-sm bg-[#faf8f5] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-0.5 bg-[#ffe4e6] text-[#e11d48] font-mono font-bold text-[11px] rounded-md border border-[#e11d48]/30">
                        PROJECT #{idx + 1}
                      </span>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="p-1 text-[#e11d48] hover:bg-[#ffe4e6] rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white font-bold focus:outline-none focus:border-[#e11d48]"
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
                        className="px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Architecture & impact description (e.g. Built high-concurrency event ingestion pipeline)..."
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
                      className="w-full px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48] leading-relaxed"
                    />

                    <input
                      placeholder="Tech keywords comma-separated (e.g. Go, Redis, Docker, gRPC)"
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
                      className="w-full px-3 py-1.5 text-[11px] sketch-border-sm bg-white font-mono focus:outline-none focus:border-[#e11d48]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: HONORS */}
            {activeTab === 'awards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#e11d48]" />
                    <span>Certifications &amp; Honors</span>
                  </h3>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-2 uppercase">CERTIFICATIONS</label>
                  {resume.sections.certifications.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2.5">
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
                        className="flex-1 px-3 py-2 sketch-border-sm text-[12px] bg-white font-medium focus:outline-none focus:border-[#e11d48]"
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
                        className="w-1/3 px-3 py-2 sketch-border-sm text-[12px] bg-white focus:outline-none focus:border-[#e11d48]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: STYLE / THEME */}
            {activeTab === 'style' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                  <h3 className="font-extrabold text-[15px] text-[#18181b] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e11d48]" />
                    <span>Template Design &amp; Typography</span>
                  </h3>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-2 uppercase">TEMPLATE DESIGN</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'modern', name: 'Modern Editorial' },
                      { id: 'classic', name: 'Classic ATS Tech' },
                      { id: 'minimal', name: 'Silicon Minimal' },
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
                        className={`p-3 sketch-border-sm text-left text-[12px] font-bold transition-all cursor-pointer ${
                          resume.metadata.template === tpl.id
                            ? 'bg-[#ffe4e6] text-[#e11d48]'
                            : 'bg-white text-[#18181b] hover:bg-[#faf8f5]'
                        }`}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#71717a] mb-2 uppercase">PRIMARY ACCENT COLOR</label>
                  <div className="flex gap-3">
                    {['#e11d48', '#18181b', '#0066cc', '#059669', '#7c3aed'].map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setResume({
                            ...resume,
                            metadata: { ...resume.metadata, themeColor: color },
                          })
                        }
                        className={`w-9 h-9 rounded-full border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] transition-transform cursor-pointer ${
                          resume.metadata.themeColor === color ? 'scale-115 ring-2 ring-[#18181b] ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
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
            Styled with organic hand-drawn sketch-border like Image 1
            Aligned horizontally at the EXACT SAME LEVEL as Left Editor
        ========================================================= */}
        <div className="lg:col-span-7 flex justify-center">
          {/* Printable A4 Container with organic hand-drawn sketch-border */}
          <div
            id="resume-printable"
            className="w-full max-w-[820px] bg-white sketch-border p-8 sm:p-12 transition-all text-[#1d1d1f]"
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
                    : resume.metadata.themeColor || '#e11d48',
              }}
            >
              <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#18181b]">
                {resume.basics.name || 'Your Full Name'}
              </h1>
              <p
                className="text-[14px] sm:text-[15px] font-bold mt-0.5"
                style={{ color: resume.metadata.themeColor || '#e11d48' }}
              >
                {resume.basics.headline || 'Full-Stack Software Engineer'}
              </p>

              {/* Contact Icons Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#52525b] mt-2.5 font-sans font-medium">
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
                  style={{ color: resume.metadata.themeColor || '#e11d48' }}
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
