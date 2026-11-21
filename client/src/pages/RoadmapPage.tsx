import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Search,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import type { IRoadmap, IRoadmapStats, IRecommendation } from '../types/roadmap';
import { roadmapApi } from '../utils/roadmapApi';
import RoadmapWizard from '../components/roadmap/RoadmapWizard';
import RoadmapStatsBar from '../components/roadmap/RoadmapStatsBar';
import TopicCard from '../components/roadmap/TopicCard';
import RecommendationsModal from '../components/roadmap/RecommendationsModal';
import logo2 from '../assets/new2.png';

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<IRoadmap | null>(null);
  const [stats, setStats] = useState<IRoadmapStats | null>(null);
  const [recommendation, setRecommendation] = useState<IRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefreshingAi, setIsRefreshingAi] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [expandedWeeks, setExpandedWeeks] = useState<{ [weekNum: number]: boolean }>({});

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    setIsLoading(true);
    try {
      const data = await roadmapApi.getActive();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        setStats(data.stats);

        // Expand current week by default
        const curWk = data.stats?.currentWeek || 1;
        setExpandedWeeks({ [curWk]: true, [curWk + 1]: true });

        // Load recommendations in background
        roadmapApi.getRecommendations().then((rec) => {
          if (rec) setRecommendation(rec);
        });
      } else {
        setRoadmap(null);
        setStats(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (params: {
    careerGoal: string;
    academicYear: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
    weeklyHours: number;
    targetWeeks: number;
  }) => {
    setIsGenerating(true);
    try {
      const data = await roadmapApi.generate({
        ...params,
        forceRegenerate: true,
      });
      setRoadmap(data.roadmap);
      setStats(data.stats);
      setShowWizardModal(false);

      const curWk = data.stats?.currentWeek || 1;
      setExpandedWeeks({ [curWk]: true, [curWk + 1]: true });

      // Refresh recommendations
      const rec = await roadmapApi.refreshRecommendations();
      if (rec) setRecommendation(rec);
    } catch (err) {
      alert(`Failed to generate roadmap: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTopic = async (
    topicId: string,
    payload: {
      status?: 'pending' | 'in_progress' | 'completed';
      confidenceScore?: number;
      notes?: string;
    }
  ) => {
    try {
      const data = await roadmapApi.updateTopic(topicId, payload);
      setRoadmap(data.roadmap);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to update topic:', err);
    }
  };

  const handleRefreshAi = async () => {
    setIsRefreshingAi(true);
    try {
      const rec = await roadmapApi.refreshRecommendations();
      if (rec) setRecommendation(rec);
    } finally {
      setIsRefreshingAi(false);
    }
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  // Group topics by week
  const groupedWeeks = useMemo(() => {
    if (!roadmap) return [];

    const weeksMap: { [week: number]: { week: number; module: string; topics: typeof roadmap.topics } } = {};

    roadmap.topics.forEach((topic) => {
      if (!weeksMap[topic.week]) {
        weeksMap[topic.week] = {
          week: topic.week,
          module: topic.module,
          topics: [],
        };
      }
      weeksMap[topic.week].topics.push(topic);
    });

    return Object.values(weeksMap).sort((a, b) => a.week - b.week);
  }, [roadmap]);

  // Filtered weeks & topics
  const filteredWeeks = useMemo(() => {
    if (!groupedWeeks.length) return [];

    return groupedWeeks
      .map((weekData) => {
        if (selectedWeek !== 'all' && weekData.week !== selectedWeek) {
          return null;
        }

        const filteredTopics = weekData.topics.filter((topic) => {
          if (statusFilter !== 'all' && topic.status !== statusFilter) {
            return false;
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = topic.title.toLowerCase().includes(q);
            const matchDesc = topic.description.toLowerCase().includes(q);
            const matchModule = topic.module.toLowerCase().includes(q);
            const matchResource = (topic.resources || []).some((r) => r.title.toLowerCase().includes(q));
            return matchTitle || matchDesc || matchModule || matchResource;
          }
          return true;
        });

        if (filteredTopics.length === 0) return null;

        return {
          ...weekData,
          topics: filteredTopics,
        };
      })
      .filter(Boolean) as typeof groupedWeeks;
  }, [groupedWeeks, selectedWeek, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/90 backdrop-blur-md border-b-2 border-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo2} alt="CareerFlow Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ffe4e6] text-[#e11d48] border border-[#18181b]">
              Roadmaps & Learning
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-[#3f3f46]">
            <Link to="/builder" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#71717a]" />
              <span>Resume Builder</span>
            </Link>
            <Link to="/ats" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#71717a]" />
              <span>ATS Scanner</span>
            </Link>
            <Link to="/roadmap" className="text-[#e11d48] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#e11d48]" />
              <span>Learning Roadmap</span>
            </Link>
          </nav>

          {/* Action Header Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {roadmap && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 sketch-btn-red text-xs font-black cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Study Coach</span>
                <span className="sm:hidden">Coach</span>
              </button>
            )}

            <Link
              to="/"
              className="px-3.5 py-2 sketch-btn-white text-xs font-bold hover:bg-[#f4f4f5] transition-all cursor-pointer"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#18181b] border-t-[#e11d48] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#71717a]">Loading your personalized roadmap...</p>
          </div>
        ) : !roadmap || showWizardModal ? (
          /* Wizard View when no active roadmap */
          <RoadmapWizard onGenerate={handleGenerate} isLoading={isGenerating} />
        ) : (
          /* Active Roadmap Dashboard */
          <>
            {/* Top Roadmap Info Header Card */}
            <div className="sketch-card p-6 sm:p-8 bg-white space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#e11d48] text-white">
                      {roadmap.careerGoal}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#faf8f5] border border-[#18181b] text-[#141416]">
                      {roadmap.academicYear}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-[#e4e4e7] text-[#52525b]">
                      {roadmap.experienceLevel} level
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-[#e4e4e7] text-[#52525b]">
                      {roadmap.weeklyHours} hrs/week
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-[#141416] tracking-tight">
                    {roadmap.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-[#52525b] mt-1 max-w-3xl leading-relaxed">
                    {roadmap.description}
                  </p>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowWizardModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 sketch-btn-white text-xs font-bold cursor-pointer"
                    title="Change career track or academic timeline"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#71717a]" />
                    <span>Change Track</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 sketch-btn-red text-xs font-black cursor-pointer shadow-xs"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>AI Coach Insights</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              {stats && <RoadmapStatsBar stats={stats} totalWeeks={roadmap.totalWeeks} />}
            </div>

            {/* Filter & Search Toolbar */}
            <div className="sketch-card p-4 sm:p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics, tools, or resources..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-[#faf8f5] border border-[#18181b] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#e11d48] focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#a1a1aa] hover:text-[#18181b] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Segmented Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {(
                    [
                      { id: 'all', label: 'All Topics' },
                      { id: 'in_progress', label: 'In Progress' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'pending', label: 'Pending' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === tab.id
                          ? 'bg-[#18181b] text-white shadow-xs'
                          : 'bg-[#faf8f5] text-[#52525b] border border-[#e4e4e7] hover:border-[#18181b]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week Quick Jump Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#f4f4f5] text-xs font-bold">
                <span className="text-[11px] text-[#71717a] uppercase tracking-wider shrink-0 mr-1">
                  Weeks:
                </span>
                <button
                  onClick={() => setSelectedWeek('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedWeek === 'all'
                      ? 'bg-[#e11d48] text-white shadow-xs'
                      : 'bg-white border border-[#e4e4e7] text-[#52525b] hover:border-[#18181b]'
                  }`}
                >
                  All Weeks ({groupedWeeks.length})
                </button>
                {groupedWeeks.map((w) => {
                  const isCurrent = stats?.currentWeek === w.week;
                  const isDone = w.topics.every((t) => t.status === 'completed');
                  return (
                    <button
                      key={w.week}
                      onClick={() => setSelectedWeek(w.week)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        selectedWeek === w.week
                          ? 'bg-[#e11d48] text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#ffe4e6] text-[#e11d48] border border-[#e11d48]'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-white border border-[#e4e4e7] text-[#52525b] hover:border-[#18181b]'
                      }`}
                    >
                      <span>Week {w.week}</span>
                      {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Week-by-Week Accordion List */}
            {filteredWeeks.length === 0 ? (
              <div className="sketch-card p-12 text-center bg-white space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#faf8f5] border-2 border-[#18181b] flex items-center justify-center mx-auto text-[#71717a]">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#141416]">No topics match your filter</h3>
                <p className="text-xs text-[#71717a]">
                  Try clearing your search query or selecting "All Topics".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSelectedWeek('all');
                  }}
                  className="px-4 py-2 sketch-btn-white text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredWeeks.map((weekData) => {
                  const isOpen = expandedWeeks[weekData.week] ?? true;
                  const completedInWeek = weekData.topics.filter((t) => t.status === 'completed').length;
                  const totalInWeek = weekData.topics.length;
                  const isWeekComplete = completedInWeek === totalInWeek && totalInWeek > 0;
                  const isCurrentActive = stats?.currentWeek === weekData.week;

                  return (
                    <div
                      key={weekData.week}
                      className={`sketch-card overflow-hidden transition-all bg-white ${
                        isCurrentActive ? 'ring-2 ring-[#e11d48]' : ''
                      }`}
                    >
                      {/* Week Header Bar */}
                      <div
                        onClick={() => toggleWeek(weekData.week)}
                        className="p-5 bg-white hover:bg-[#faf8f5] transition-colors flex items-center justify-between cursor-pointer border-b border-[#f4f4f5]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl border-2 border-[#18181b] flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                              isWeekComplete
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : isCurrentActive
                                ? 'bg-[#e11d48] text-white'
                                : 'bg-white text-[#18181b]'
                            }`}
                          >
                            W{weekData.week}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base sm:text-lg font-black text-[#141416]">
                                Week {weekData.week} — {weekData.module}
                              </h2>
                              {isCurrentActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ffe4e6] text-[#e11d48] border border-[#e11d48] hidden sm:inline">
                                  Current Focus
                                </span>
                              )}
                              {isWeekComplete && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 hidden sm:inline">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#71717a] font-medium mt-0.5">
                              {completedInWeek} of {totalInWeek} milestones achieved
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Mini Progress Bar for Week */}
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="w-24 h-2 bg-[#f4f4f5] rounded-full border border-[#e4e4e7] overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${totalInWeek ? (completedInWeek / totalInWeek) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#71717a]">
                              {totalInWeek ? Math.round((completedInWeek / totalInWeek) * 100) : 0}%
                            </span>
                          </div>

                          <div className="p-1 rounded-lg border border-[#e4e4e7] bg-white text-[#71717a]">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Topics inside the Week */}
                      {isOpen && (
                        <div className="p-4 sm:p-6 bg-[#faf8f5]/40 space-y-4">
                          {weekData.topics.map((topic) => (
                            <TopicCard
                              key={topic._id}
                              topic={topic}
                              onUpdate={handleUpdateTopic}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* AI Recommendations Modal */}
      <RecommendationsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        recommendation={recommendation}
        onRefresh={handleRefreshAi}
        isRefreshing={isRefreshingAi}
        roadmapTitle={roadmap?.title}
      />
    </div>
  );
}
