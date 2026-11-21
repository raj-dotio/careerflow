import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  GraduationCap,
  FileText,
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Target,
  ShieldCheck,
  Flame,
  Layers,
  BookOpen,
  Zap,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillItem {
  _id: string;
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  progress: number;
  proofUrl?: string;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const CATEGORIES = [
  'All',
  'Frontend',
  'Backend',
  'Programming',
  'Database',
  'DevOps & Cloud',
  'Core CS & DSA',
  'AI & Data Science',
];

const QUICK_SKILL_SUGGESTIONS = [
  { name: 'React', category: 'Frontend' },
  { name: 'TypeScript', category: 'Programming' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Python', category: 'Programming' },
  { name: 'Data Structures & Algorithms', category: 'Core CS & DSA' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Docker', category: 'DevOps & Cloud' },
  { name: 'System Design', category: 'Core CS & DSA' },
];

const INITIAL_SKILLS: SkillItem[] = [
  {
    _id: 'init-1',
    name: 'React 19 & Next.js',
    category: 'Frontend',
    proficiency: 'Advanced',
    progress: 88,
    proofUrl: 'https://github.com',
    description: 'Developed modern single-page apps with server components, hooks, and responsive Tailwind styling.',
  },
  {
    _id: 'init-2',
    name: 'TypeScript',
    category: 'Programming',
    proficiency: 'Advanced',
    progress: 85,
    proofUrl: 'https://github.com',
    description: 'Strict type safety, generics, utility types, and full-stack API integration.',
  },
  {
    _id: 'init-3',
    name: 'Node.js & Express',
    category: 'Backend',
    proficiency: 'Intermediate',
    progress: 75,
    proofUrl: 'https://github.com',
    description: 'RESTful architecture, JWT authentication, rate limiting, and database abstraction.',
  },
  {
    _id: 'init-4',
    name: 'Data Structures & Algorithms',
    category: 'Core CS & DSA',
    proficiency: 'Intermediate',
    progress: 72,
    proofUrl: 'https://leetcode.com',
    description: 'Solved 250+ algorithmic challenges covering Trees, Graphs, Dynamic Programming, and Two Pointers.',
  },
  {
    _id: 'init-5',
    name: 'PostgreSQL & SQL',
    category: 'Database',
    proficiency: 'Advanced',
    progress: 80,
    proofUrl: 'https://github.com',
    description: 'Complex relational schemas, foreign keys, index optimization, and transactional isolation.',
  },
  {
    _id: 'init-6',
    name: 'Docker & CI/CD',
    category: 'DevOps & Cloud',
    proficiency: 'Beginner',
    progress: 55,
    proofUrl: 'https://github.com',
    description: 'Containerizing multi-service web apps and automated testing via GitHub Actions.',
  },
];

export default function SkillTracker() {
  const [skills, setSkills] = useState<SkillItem[]>(() => {
    const saved = localStorage.getItem('careerflow_study_skills');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_SKILLS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'progress-desc' | 'progress-asc' | 'name-asc'>('progress-desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Frontend',
    proficiency: 'Intermediate' as ProficiencyLevel,
    progress: 60,
    proofUrl: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('careerflow_study_skills', JSON.stringify(skills));
  }, [skills]);

  // Fetch from backend API with fallback
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/skills');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setSkills(json.data);
          }
        }
      } catch {
        console.warn('Backend /api/skills unreachable, using local persistence.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Dashboard Stats Computation
  const stats = useMemo(() => {
    const totalSkills = skills.length;
    if (totalSkills === 0) {
      return {
        totalSkills: 0,
        strongestSkill: null,
        weakestSkill: null,
        averageProgress: 0,
        verifiedCount: 0,
        categoryCount: 0,
      };
    }

    const sorted = [...skills].sort((a, b) => b.progress - a.progress);
    const strongestSkill = sorted[0];
    const weakestSkill = sorted[sorted.length - 1];
    const totalProgress = skills.reduce((acc, s) => acc + s.progress, 0);
    const averageProgress = Math.round(totalProgress / totalSkills);
    const verifiedCount = skills.filter((s) => s.proofUrl && s.proofUrl.trim().length > 0).length;
    const categoryCount = new Set(skills.map((s) => s.category)).size;

    return {
      totalSkills,
      strongestSkill,
      weakestSkill,
      averageProgress,
      verifiedCount,
      categoryCount,
    };
  }, [skills]);

  // 2. Filter & Sort Skills
  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => {
        const matchesCategory =
          selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'progress-desc') return b.progress - a.progress;
        if (sortBy === 'progress-asc') return a.progress - b.progress;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [skills, selectedCategory, searchTerm, sortBy]);

  // 3. Radar Chart Data Preparation
  const radarData = useMemo(() => {
    if (skills.length === 0) return [];
    // If user has many skills, prioritize displaying top 10 on radar for readability
    const sourceSkills = skills.slice(0, 10);
    return sourceSkills.map((s) => ({
      skill: s.name.length > 14 ? s.name.substring(0, 12) + '...' : s.name,
      fullName: s.name,
      progress: s.progress,
      proficiency: s.proficiency,
      category: s.category,
      fullMark: 100,
    }));
  }, [skills]);

  // Handle Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingSkill(null);
    setFormData({
      name: '',
      category: 'Frontend',
      proficiency: 'Intermediate',
      progress: 60,
      proofUrl: '',
      description: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Open Modal for Edit
  const handleOpenEditModal = (skill: SkillItem) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      progress: skill.progress,
      proofUrl: skill.proofUrl || '',
      description: skill.description || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Skill name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Skill name must be at least 2 characters';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      errors.progress = 'Progress must be between 0% and 100%';
    }

    if (formData.proofUrl.trim()) {
      try {
        const parsed = new URL(formData.proofUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.proofUrl = 'URL must start with http:// or https://';
        }
      } catch {
        errors.proofUrl = 'Please enter a valid web URL (e.g., https://github.com/...)';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit Form (Add or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      proficiency: formData.proficiency,
      progress: Number(formData.progress),
      proofUrl: formData.proofUrl.trim(),
      description: formData.description.trim(),
    };

    try {
      if (editingSkill) {
        // Edit Operation
        const updatedSkills = skills.map((s) =>
          s._id === editingSkill._id ? { ...s, ...payload, updatedAt: new Date() } : s
        );
        setSkills(updatedSkills);

        // Try backend PUT
        fetch(`/api/skills/${editingSkill._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});

        showToast(`"${payload.name}" updated successfully!`);
      } else {
        // Add Operation
        const newSkill: SkillItem = {
          _id: `skill-${Date.now()}`,
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setSkills([newSkill, ...skills]);

        // Try backend POST
        fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data?._id) {
              setSkills((prev) =>
                prev.map((s) => (s._id === newSkill._id ? { ...s, _id: json.data._id } : s))
              );
            }
          })
          .catch(() => {});

        showToast(`"${payload.name}" added to your skill tracker!`);
      }

      setIsModalOpen(false);
    } catch {
      showToast('An unexpected error occurred.', 'error');
    }
  };

  // Handle Delete Skill
  const handleDeleteSkill = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your skills?`)) {
      setSkills((prev) => prev.filter((s) => s._id !== id));
      fetch(`/api/skills/${id}`, { method: 'DELETE' }).catch(() => {});
      showToast(`"${name}" removed.`, 'success');
    }
  };

  // Proficiency Badge Colors
  const getProficiencyBadge = (level: ProficiencyLevel) => {
    switch (level) {
      case 'Expert':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Advanced':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Beginner':
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  // Progress Bar Gradient
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-[#059669]';
    if (progress >= 60) return 'bg-[#e11d48]';
    if (progress >= 40) return 'bg-[#0284c7]';
    return 'bg-[#d97706]';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-lg border-2 border-[#18181b] shadow-[4px_4px_0px_#18181b] flex items-center gap-2 text-[13px] font-bold ${
              toastMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* 1. Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-xs">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#e11d48] border border-[#18181b] flex items-center justify-center p-1 text-white">
                <GraduationCap className="w-full h-full" />
              </div>
              <span className="font-extrabold text-[16px] text-[#141416]">CareerFlow</span>
            </Link>
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-semibold text-[13px] text-[#71717a]">Study Skill Tracker</span>
            {isLoading && (
              <span className="text-[11px] font-mono text-[#e11d48] animate-pulse ml-1">
                Syncing...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/builder"
              className="px-3.5 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Resume Builder</span>
            </Link>

            <Link
              to="/ats"
              className="px-3.5 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>ATS Diagnostics</span>
            </Link>

            <Link
              to="/challenge/setup"
              className="px-3.5 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Quick Challenge</span>
            </Link>

            <button
              onClick={handleOpenAddModal}
              className="sketch-btn-red px-3.5 py-1.5 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <div className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 bg-white sketch-border-sm text-[12px] font-mono font-bold text-[#e11d48] inline-block">
              STUDENT MASTERY &amp; EVIDENCE MATRIX
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              Verified Portfolio Tracker
            </span>
          </div>
          <h1 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-[#141416]">
            Study Skill Mastery Tracker
          </h1>
          <p className="text-[15px] text-[#6b7280]">
            Track engineering competencies, proficiency curves, and attach proof repositories for recruiters and placement readiness.
          </p>
        </div>

        {/* 3. Skill Dashboard Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Skills */}
          <div className="sketch-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#71717a] uppercase">Total Skills</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#e11d48]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[32px] font-extrabold text-[#141416] leading-none block">
                {stats.totalSkills}
              </span>
              <span className="text-[11px] text-[#71717a] mt-1 block">
                across {stats.categoryCount} disciplines
              </span>
            </div>
          </div>

          {/* Card 2: Strongest Skill */}
          <div className="sketch-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#71717a] uppercase">Top Competency</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[18px] font-extrabold text-[#141416] leading-snug block truncate">
                {stats.strongestSkill ? stats.strongestSkill.name : 'None'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {stats.strongestSkill ? `${stats.strongestSkill.progress}% Mastered` : 'Add skills'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Needs Improvement */}
          <div className="sketch-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#71717a] uppercase">Focus Priority</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[18px] font-extrabold text-[#141416] leading-snug block truncate">
                {stats.weakestSkill ? stats.weakestSkill.name : 'None'}
              </span>
              <span className="text-[11px] text-[#71717a] mt-1 block">
                {stats.weakestSkill ? `Currently at ${stats.weakestSkill.progress}%` : 'Add skills to evaluate'}
              </span>
            </div>
          </div>

          {/* Card 4: Average Progress */}
          <div className="sketch-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#71717a] uppercase">Average Progress</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-extrabold text-[#141416] leading-none block">
                  {stats.averageProgress}%
                </span>
              </div>
              <div className="w-full bg-[#e4e4e7] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#e11d48] h-full rounded-full transition-all duration-700"
                  style={{ width: `${stats.averageProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Verified Proofs */}
          <div className="sketch-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#71717a] uppercase">Verified Proofs</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[32px] font-extrabold text-[#141416] leading-none block">
                {stats.verifiedCount}
              </span>
              <span className="text-[11px] text-[#71717a] mt-1 block">
                {stats.totalSkills > 0
                  ? `${Math.round((stats.verifiedCount / stats.totalSkills) * 100)}% verified with repos`
                  : 'Add proofs'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Radar Chart & Skill Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Radar Chart (7 Cols) */}
          <div className="lg:col-span-7 sketch-card p-6 bg-white flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[#e5e7eb] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#e11d48]" />
                <h3 className="font-bold text-[16px] text-[#141416]">
                  Interactive Competency Radar
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#71717a] bg-[#faf8f5] px-2.5 py-1 rounded border border-[#e4e4e7]">
                Scale: 0 - 100% Mastery
              </span>
            </div>

            {radarData.length >= 3 ? (
              <div className="w-full h-[330px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: '#18181b', fontSize: 11, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#a1a1aa"
                      tick={{ fontSize: 9, fill: '#71717a' }}
                    />
                    <Radar
                      name="Proficiency Level"
                      dataKey="progress"
                      stroke="#e11d48"
                      strokeWidth={2.5}
                      fill="#e11d48"
                      fillOpacity={0.35}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#18181b] text-white p-2.5 rounded-lg text-[12px] shadow-lg border border-black/20">
                              <span className="font-bold block text-white">{data.fullName}</span>
                              <span className="text-[#a1a1aa] block text-[11px]">{data.category}</span>
                              <div className="mt-1 flex items-center justify-between gap-4">
                                <span className="text-[#f43f5e] font-semibold">{data.proficiency}</span>
                                <span className="font-mono font-bold text-white">{data.progress}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#e4e4e7] rounded-xl bg-[#faf8f5]">
                <Layers className="w-10 h-10 text-[#a1a1aa] mb-2" />
                <h4 className="font-bold text-[15px] text-[#141416]">Need At Least 3 Skills for Radar Geometry</h4>
                <p className="text-[12px] text-[#71717a] max-w-sm mt-1">
                  Add 3 or more skills to plot a dynamic multi-axis polygon and visualize your full technical profile.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="sketch-btn-red px-4 py-1.5 text-[12px] font-bold mt-4"
                >
                  + Add Next Skill
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-[#f4f4f5] flex items-center justify-between text-[11px] text-[#71717a]">
              <span>Dynamic polygon updates automatically as you adjust skills</span>
              <span className="font-bold text-[#e11d48]">Target: Balanced Full-Stack Curve</span>
            </div>
          </div>

          {/* Side Insight Panel (5 Cols) */}
          <div className="lg:col-span-5 sketch-card p-6 bg-white flex flex-col justify-between space-y-4">
            <div className="border-b-2 border-dashed border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-[16px] text-[#141416]">
                  Skill Distribution &amp; Balance
                </h3>
              </div>
              <p className="text-[12px] text-[#71717a] mt-1">
                Visualizing tier allocation across your tracked disciplines.
              </p>
            </div>

            {/* Proficiency Breakdown Bars */}
            <div className="space-y-3">
              {(['Expert', 'Advanced', 'Intermediate', 'Beginner'] as ProficiencyLevel[]).map((level) => {
                const count = skills.filter((s) => s.proficiency === level).length;
                const percentage = skills.length > 0 ? Math.round((count / skills.length) * 100) : 0;
                return (
                  <div key={level} className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#e4e4e7]">
                    <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-[#141416]">
                        <span className={`w-2 h-2 rounded-full ${getProficiencyBadge(level).split(' ')[0]}`} />
                        {level}
                      </span>
                      <span className="text-[#71717a]">
                        {count} skills ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#e4e4e7] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          level === 'Expert'
                            ? 'bg-emerald-600'
                            : level === 'Advanced'
                            ? 'bg-purple-600'
                            : level === 'Intermediate'
                            ? 'bg-blue-600'
                            : 'bg-stone-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Placement Advice Box */}
            <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-mono font-bold text-amber-900 block mb-0.5">
                💡 RECRUITER INSIGHT
              </span>
              <p className="text-[12px] text-amber-950 leading-relaxed">
                Aim for at least <strong>3 Advanced or Expert</strong> core technologies with valid proof links (GitHub repos or live URLs) to clear corporate ATS thresholds.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Filter & Controls Bar */}
        <div className="sketch-card p-5 bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by skill name, category, or keyword..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[#71717a] hover:text-[#141416]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown & Add CTA */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono text-[#71717a]">SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-md border border-[#d4d4d8] text-[12px] font-semibold bg-[#faf8f5] focus:outline-none"
                >
                  <option value="progress-desc">Highest Mastery (%)</option>
                  <option value="progress-asc">Lowest Mastery (%)</option>
                  <option value="name-asc">Alphabetical (A - Z)</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="sketch-btn-red px-4 py-2 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f4f4f5]">
            <span className="text-[11px] font-mono text-[#71717a] mr-1">CATEGORY:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#18181b] text-white shadow-2xs'
                    : 'bg-[#faf8f5] text-[#71717a] hover:bg-[#f4f4f5] border border-[#e4e4e7]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Skill Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[18px] text-[#141416]">
              Tracked Skills ({filteredSkills.length})
            </h3>
            <span className="text-[12px] text-[#71717a]">
              Showing {filteredSkills.length} of {skills.length} competencies
            </span>
          </div>

          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSkills.map((skill) => (
                <div
                  key={skill._id}
                  className="sketch-card p-5 bg-white flex flex-col justify-between space-y-4 group hover:border-[#e11d48] transition-colors"
                >
                  {/* Card Header: Title & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#e11d48] uppercase tracking-wider block">
                          {skill.category}
                        </span>
                        <h4 className="text-[18px] font-bold text-[#141416] mt-0.5 leading-snug">
                          {skill.name}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${getProficiencyBadge(
                          skill.proficiency
                        )}`}
                      >
                        {skill.proficiency}
                      </span>
                    </div>

                    {/* Description */}
                    {skill.description && (
                      <p className="text-[12px] text-[#4b5563] mt-2.5 line-clamp-2 leading-relaxed">
                        {skill.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Progress & Proof URL */}
                  <div className="space-y-3 pt-2 border-t border-[#f4f4f5]">
                    {/* Progress Bar with Number */}
                    <div>
                      <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                        <span className="text-[#71717a]">Mastery Progress</span>
                        <span className="font-mono text-[#141416]">{skill.progress}%</span>
                      </div>
                      <div className="w-full bg-[#e4e4e7] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressColor(
                            skill.progress
                          )}`}
                          style={{ width: `${skill.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Proof Link & Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      {skill.proofUrl && skill.proofUrl.trim() ? (
                        <a
                          href={skill.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#059669] hover:underline bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Proof</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 text-emerald-600" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#a1a1aa] italic">No proof link attached</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(skill)}
                          className="p-1.5 rounded hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer"
                          title="Edit skill"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill._id, skill.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#71717a] hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sketch-card p-12 bg-white text-center space-y-3">
              <BookOpen className="w-12 h-12 text-[#a1a1aa] mx-auto" />
              <h4 className="font-bold text-[18px] text-[#141416]">No Skills Match Your Filters</h4>
              <p className="text-[13px] text-[#71717a] max-w-md mx-auto">
                Try searching with different terms or select another category, or add a brand-new skill to your competency radar.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="sketch-btn-red px-5 py-2.5 text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7. Add / Edit Skill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="sketch-card bg-white p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#e11d48]" />
                <h3 className="font-extrabold text-[18px] text-[#141416]">
                  {editingSkill ? 'Edit Competency Skill' : 'Add New Study Skill'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#71717a] hover:text-[#141416] p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestion Chips (when adding) */}
            {!editingSkill && (
              <div>
                <span className="text-[11px] font-mono text-[#71717a] block mb-1.5">
                  QUICK-ADD SUGGESTIONS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SKILL_SUGGESTIONS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, name: s.name, category: s.category })}
                      className="text-[11px] px-2.5 py-1 rounded bg-[#faf8f5] hover:bg-[#fee2e2] text-[#141416] border border-[#e4e4e7] transition-colors cursor-pointer"
                    >
                      + {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Skill Name */}
              <div>
                <label className="block text-[12px] font-mono font-bold text-[#141416] mb-1">
                  SKILL NAME *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. React, TypeScript, Python, DSA, PostgreSQL..."
                  className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
                />
                {formErrors.name && (
                  <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.name}</p>
                )}
              </div>

              {/* Category & Proficiency Level in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#141416] mb-1">
                    CATEGORY *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Programming">Programming</option>
                    <option value="Database">Database</option>
                    <option value="DevOps & Cloud">DevOps &amp; Cloud</option>
                    <option value="Core CS & DSA">Core CS &amp; DSA</option>
                    <option value="AI & Data Science">AI &amp; Data Science</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-mono font-bold text-[#141416] mb-1">
                    PROFICIENCY LEVEL
                  </label>
                  <select
                    value={formData.proficiency}
                    onChange={(e) =>
                      setFormData({ ...formData, proficiency: e.target.value as ProficiencyLevel })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
                  >
                    <option value="Beginner">Beginner (Foundation)</option>
                    <option value="Intermediate">Intermediate (Practitioner)</option>
                    <option value="Advanced">Advanced (Production-Ready)</option>
                    <option value="Expert">Expert (Architectural)</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider (0-100%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-mono font-bold text-[#141416]">
                    SKILL MASTERY PROGRESS (%)
                  </label>
                  <span className="font-mono font-bold text-[14px] text-[#e11d48]">
                    {formData.progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="w-full h-2 bg-[#e4e4e7] rounded-lg appearance-none cursor-pointer accent-[#e11d48]"
                />
                {formErrors.progress && (
                  <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.progress}</p>
                )}
              </div>

              {/* Proof / Evidence URL */}
              <div>
                <label className="block text-[12px] font-mono font-bold text-[#141416] mb-1">
                  PROOF / EVIDENCE URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.proofUrl}
                  onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                  placeholder="https://github.com/your-username/project-repo"
                  className="w-full px-3 py-2 rounded-md border border-[#d4d4d8] text-[13px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
                />
                <span className="text-[11px] text-[#71717a] mt-0.5 block">
                  Link your GitHub repo, LeetCode profile, live deployment, or certified credential.
                </span>
                {formErrors.proofUrl && (
                  <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.proofUrl}</p>
                )}
              </div>

              {/* Description / Summary Notes */}
              <div>
                <label className="block text-[12px] font-mono font-bold text-[#141416] mb-1">
                  BRIEF DESCRIPTION / HIGHLIGHTS (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Mastered concurrent channels, microservices, and high-throughput REST APIs."
                  className="w-full p-2.5 rounded-md border border-[#d4d4d8] text-[12px] bg-[#faf8f5] focus:outline-none focus:border-[#e11d48]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f4f4f5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#d4d4d8] text-[13px] font-semibold text-[#71717a] hover:bg-[#f4f4f5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sketch-btn-red px-5 py-2 text-[13px] font-bold cursor-pointer"
                >
                  {editingSkill ? 'Save Changes' : 'Add Competency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
