import React, { useState } from 'react';
import {
  Clock,
  Code2,
  ArrowRight,
  Layers,
  Database,
  Cpu,
  Globe,
  Shield,
  Smartphone,
  Plus,
  X,
  Compass,
  Wand2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface WizardProps {
  onGenerate: (params: {
    careerGoal: string;
    academicYear: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
    weeklyHours: number;
    targetWeeks: number;
  }) => Promise<void>;
  isLoading: boolean;
  initialGoal?: string;
}

const CAREER_PRESETS = [
  {
    id: 'fullstack',
    title: 'Full Stack Web Developer',
    icon: Globe,
    tag: 'Highest Demand',
  },
  {
    id: 'frontend',
    title: 'Frontend Engineer',
    icon: Code2,
    tag: 'UI & Design',
  },
  {
    id: 'backend',
    title: 'Backend & Systems Engineer',
    icon: Database,
    tag: 'High Scale',
  },
  {
    id: 'aiml',
    title: 'AI & Machine Learning Engineer',
    icon: Cpu,
    tag: 'Trending 2026',
  },
  {
    id: 'datascience',
    title: 'Data Scientist & Analytics',
    icon: Layers,
    tag: 'Analytical',
  },
  {
    id: 'devops',
    title: 'Cloud & DevOps SRE',
    icon: Shield,
    tag: 'Infrastructure',
  },
  {
    id: 'mobile',
    title: 'Mobile App Developer',
    icon: Smartphone,
    tag: 'Cross-Platform',
  },
  {
    id: 'blockchain',
    title: 'Web3 & Blockchain Engineer',
    icon: Wand2,
    tag: 'Smart Contracts',
  },
];

const ACADEMIC_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Pre-Final Placement)',
  'Final Year (Campus Hiring)',
  'Recent Graduate / Job Seeker',
  'Self-Taught / Career Transition',
];

const EXPERIENCE_LEVELS: Array<{
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  desc: string;
}> = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'Just starting or learning fundamentals; step-by-step paced curriculum.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'Built basic projects; focus on advanced workflows and production quality.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'Deep mastery, performance benchmarks, and portfolio-grade deliverables.',
  },
];

const WEEK_PRESETS = [
  { weeks: 4, label: '4 Weeks', desc: 'Intensive Sprint' },
  { weeks: 6, label: '6 Weeks', desc: 'Fast Track' },
  { weeks: 8, label: '8 Weeks', desc: 'Standard Track' },
  { weeks: 10, label: '10 Weeks', desc: 'Extended Deep Dive' },
  { weeks: 12, label: '12 Weeks', desc: 'Comprehensive Mastery' },
];

const SUGGESTED_INTEREST_TAGS = [
  'System Design',
  'Data Structures & Algorithms',
  'Generative AI & LLMs',
  'Cloud & Docker',
  'Frontend UI/UX',
  'REST APIs & Microservices',
  'PostgreSQL & MongoDB',
  'Web Security',
];

export default function RoadmapWizard({ onGenerate, isLoading }: WizardProps) {
  // Goal Input State
  const [careerGoal, setCareerGoal] = useState<string>('Full Stack Web Developer');

  // Duration in Weeks
  const [targetWeeks, setTargetWeeks] = useState<number>(8);

  const [academicYear, setAcademicYear] = useState<string>('3rd Year (Pre-Final Placement)');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [weeklyHours, setWeeklyHours] = useState<number>(10);

  // Optional Interests State
  const [allInterests, setAllInterests] = useState<string[]>(SUGGESTED_INTEREST_TAGS);
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState<string>('');

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomInterest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInterestInput.trim();
    if (!trimmed) return;

    if (!allInterests.includes(trimmed)) {
      setAllInterests((prev) => [trimmed, ...prev]);
    }
    if (!interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
    }
    setCustomInterestInput('');
  };

  const handleRemoveInterest = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllInterests((prev) => prev.filter((t) => t !== tag));
    setInterests((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalGoal = careerGoal.trim() || 'Software Engineer';

    onGenerate({
      careerGoal: finalGoal,
      academicYear,
      experienceLevel,
      interests,
      weeklyHours,
      targetWeeks,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header (No Gemini AI line) */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-[#141416] tracking-tight">
          Design Your Personal Learning Roadmap
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#52525b] max-w-2xl mx-auto">
          Enter any target career or skill goal below. We will architect a structured, week-by-week curriculum tailored to your duration with free video tutorials, documentation, and practical assignments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="sketch-card p-6 sm:p-8 space-y-8 bg-white">
        {/* Step 1: Target Career Goal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-[#141416] uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#e11d48]" />
              <span>1. Enter Your Target Career or Course Goal</span>
            </label>
            <span className="text-xs text-[#71717a] font-medium hidden sm:inline">
              Type any role (e.g. Photography, Full Stack, UI/UX, AI/ML)
            </span>
          </div>

          {/* Prominent Top Goal Entry Field */}
          <div className="relative">
            <input
              type="text"
              required
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Photography, Full Stack Web Developer, Blockchain, UI/UX Design, Data Science..."
              className="w-full pl-4 pr-12 py-3.5 bg-[#faf8f5] border-2 border-[#18181b] rounded-2xl text-base font-extrabold text-[#141416] focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:bg-white shadow-xs transition-all"
            />
            {careerGoal && (
              <button
                type="button"
                onClick={() => setCareerGoal('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717a] hover:text-[#18181b] bg-white border border-[#d4d4d8] rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Preset Selector Grid */}
          <div>
            <span className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider block mb-2">
              Popular Career Roles (Click to auto-fill):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CAREER_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected =
                  careerGoal.trim().toLowerCase() === preset.title.toLowerCase();
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setCareerGoal(preset.title)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-[#e11d48] bg-[#fff1f2] shadow-xs ring-1 ring-[#e11d48]'
                        : 'border-[#e4e4e7] bg-white hover:border-[#18181b] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#e11d48] text-white' : 'bg-[#f4f4f5] text-[#18181b]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#141416] truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-[#71717a] truncate mt-0.5">
                        {preset.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Roadmap Duration (How many weeks do you need?) */}
        <div className="bg-[#faf8f5] p-5 rounded-2xl border-2 border-[#18181b] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-[#141416] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e11d48]" />
              <span>2. Roadmap Duration: How many weeks do you need?</span>
            </label>
            <span className="text-base font-black text-[#e11d48] bg-white px-3 py-0.5 rounded-lg border border-[#18181b]">
              {targetWeeks} Weeks
            </span>
          </div>

          <p className="text-xs text-[#71717a]">
            Choose your target timeframe. Your curriculum will be structured into exactly {targetWeeks} sequential weekly milestones.
          </p>

          {/* Preset Duration Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {WEEK_PRESETS.map((p) => {
              const isSelected = targetWeeks === p.weeks;
              return (
                <button
                  type="button"
                  key={p.weeks}
                  onClick={() => setTargetWeeks(p.weeks)}
                  className={`py-2 px-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'border-[#e11d48] bg-[#e11d48] text-white shadow-xs'
                      : 'border-[#18181b] bg-white text-[#18181b] hover:bg-[#f4f4f5]'
                  }`}
                >
                  <div className="text-xs font-black">{p.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#71717a]'}`}>
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Slider for custom weeks */}
          <div className="pt-2">
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(Number(e.target.value))}
              className="w-full accent-[#e11d48] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-bold text-[#71717a] mt-1">
              <span>2 Weeks (Sprint)</span>
              <span>6 Weeks</span>
              <span>8 Weeks (Recommended)</span>
              <span>12 Weeks</span>
              <span>16 Weeks (Extended)</span>
            </div>
          </div>
        </div>

        {/* Step 3: Academic Year & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold text-[#141416] uppercase tracking-wider mb-2">
              3. Academic Year / Cohort
            </label>
            <div className="relative">
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafafa] border-2 border-[#18181b] rounded-xl text-sm font-semibold text-[#141416] focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:bg-white"
              >
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[#71717a] mt-1.5">
              Milestones align with recruitment cycles, hiring bars, or independent study pacing.
            </p>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-[#141416] uppercase tracking-wider mb-2">
              4. Current Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setExperienceLevel(lvl.id)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer text-center ${
                    experienceLevel === lvl.id
                      ? 'border-[#e11d48] bg-[#e11d48] text-white shadow-xs'
                      : 'border-[#18181b] bg-white text-[#18181b] hover:bg-[#f4f4f5]'
                  }`}
                >
                  {lvl.title}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#71717a] mt-2">
              {EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.desc}
            </p>
          </div>
        </div>

        {/* Step 4: Weekly Commitment Slider */}
        <div className="bg-[#faf8f5] p-5 rounded-2xl border-2 border-[#18181b]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-extrabold text-[#141416] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#e11d48]" />
              <span>5. Weekly Study Target:</span>
              <span className="text-base font-black text-[#e11d48] bg-white px-2.5 py-0.5 rounded-lg border border-[#18181b]">
                {weeklyHours} Hours / Week
              </span>
            </label>
            <span className="text-xs text-[#71717a] font-medium hidden sm:inline">
              ~{Math.round(weeklyHours / 7)} hr {Math.round((weeklyHours % 7) * 8.5)} mins/day
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={25}
            step={1}
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(Number(e.target.value))}
            className="w-full accent-[#e11d48] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-bold text-[#71717a] mt-1">
            <span>4 hrs (Casual)</span>
            <span>10 hrs (Standard)</span>
            <span>16 hrs (Intense)</span>
            <span>25 hrs (Full-Time)</span>
          </div>
        </div>

        {/* Step 5: Topics of High Interest (Optional) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-sm font-extrabold text-[#141416] uppercase tracking-wider">
              6. Specific Topics of Interest <span className="text-[#71717a] font-medium normal-case">(Optional)</span>
            </label>
            <span className="text-xs text-[#e11d48] font-semibold">
              ✦ If left blank, curriculum is curated automatically for this role
            </span>
          </div>

          <p className="text-xs text-[#71717a]">
            Leave empty for automatic curriculum selection, or add specific topics you want included.
          </p>

          {/* Interactive Tag Pills */}
          <div className="flex flex-wrap gap-2">
            {allInterests.map((tag) => {
              const isSelected = interests.includes(tag);
              const isCustom = !SUGGESTED_INTEREST_TAGS.includes(tag);
              return (
                <div
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#18181b] bg-[#18181b] text-white shadow-xs'
                      : 'border-[#d4d4d8] bg-white text-[#52525b] hover:border-[#18181b] hover:text-[#18181b]'
                  }`}
                >
                  <span>{isSelected ? '✓ ' : '+ '}</span>
                  <span>{tag}</span>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveInterest(tag, e)}
                      className="ml-1 text-[#a1a1aa] hover:text-rose-400 p-0.5 rounded-full cursor-pointer"
                      title="Remove custom tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Topic Input Form */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
                placeholder="Add any specific topic or tool for this course..."
                className="w-full px-3.5 py-2 text-xs font-semibold bg-[#faf8f5] border-2 border-[#18181b] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#e11d48] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomInterest}
              className="px-4 py-2 sketch-btn-white text-xs font-bold hover:bg-[#18181b] hover:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-4 border-t border-[#f4f4f5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#71717a]">
            ✦ Includes interactive week-by-week checklists, confidence trackers, and study notes.
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 sketch-btn-red text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Architecting {targetWeeks}-Week Curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate My {targetWeeks}-Week Roadmap</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
