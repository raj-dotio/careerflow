import { BlueprintTopic, careerBlueprints, getTrackKey } from './roadmapBlueprints.js';

export interface GenerateRoadmapParams {
  careerGoal: string;
  academicYear?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  interests?: string[];
  weeklyHours?: number;
  targetWeeks?: number;
  description?: string;
  geminiApiKey?: string;
}

export interface RecommendationResult {
  summary: string;
  nextTopics: Array<{
    title: string;
    reason: string;
    expectedOutcome: string;
  }>;
  practiceProjects: Array<{
    title: string;
    description: string;
    focusArea: string;
  }>;
  resources: Array<{
    title: string;
    url: string;
    type?: string;
  }>;
  revisionAreas: Array<{
    title: string;
    reason: string;
  }>;
  weakAreas: string[];
  encouragement: string;
}

function cleanJsonOutput(raw: string): string {
  const stripped = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = stripped.indexOf('{');
  const firstBracket = stripped.indexOf('[');
  let startIdx = -1;
  let endChar = '}';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const lastIdx = stripped.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      return stripped.slice(startIdx, lastIdx + 1);
    }
  }
  return stripped;
}

// Universal Curriculum Director System Instructions for Gemini
const ROADMAP_ARCHITECT_SYSTEM_INSTRUCTION = `
You are a World-Class Academic Dean, Placement Director, and Master Educator across all technical, scientific, creative, and professional disciplines.
Your mission is to architect an exhaustive, highly practical, week-by-week learning roadmap tailored precisely to the learner's chosen career or subject goal, target duration in weeks, weekly bandwidth, and stated interests.

CRITICAL RULES FOR DOMAIN INTEGRITY & ACCURACY:
1. PURE DOMAIN ACCURACY (NO IRRELEVANT JARGON):
   - You MUST adapt 100% to the subject requested by the learner.
   - If the user asks for PHOTOGRAPHY: Every week, topic, milestone, and project MUST be purely about photography (e.g., Camera Gear & Exposure Triangle, Shutter Speed & Aperture Depth of Field, Composition & Natural Lighting, Studio Lighting & Flash Strobes, Lens Optics & Focal Lengths, RAW Processing & Color Grading in Adobe Lightroom/Photoshop, Portrait & Street Photography, Curating a Professional Client Portfolio).
     NEVER mention software engineering terms (no "APIs", no "databases", no "Docker", no "OWASP security", no "microservices", no "system architecture") for non-software topics!
   - If the user asks for GRAPHIC DESIGN / UI: Every week must be about typography, color harmony, layout grid, Figma, Photoshop, Illustrator, visual branding, user testing, design systems.
   - If the user asks for MUSIC PRODUCTION: Every week must be about DAW workflow, audio synthesis, mixing, mastering, EQ, compression, song arrangement.
   - If the user asks for FINANCE / TRADING: Every week must be about financial statements, valuation, DCF modeling, equities, macroeconomics, portfolio risk.
   - If the user asks for SOFTWARE / TECH (e.g., Full Stack, Blockchain, AI/ML, DevOps): Cover modern cutting-edge tech stacks, frameworks, design patterns, testing, and deployment.

2. EXACT WEEK DURATION MATCHING:
   - The user will specify the exact number of weeks needed (targetWeeks, e.g., 4, 6, 8, 10, or 12 weeks).
   - Your generated curriculum MUST span EXACTLY from Week 1 up to Week targetWeeks.
   - Each week must be a distinct, progressive milestone building directly on previous weeks.

3. AUTONOMOUS CURATION:
   - If the user does not provide specific topics of interest, you MUST autonomously select the most important industry-standard core topics for that exact domain.

4. STRUCTURE PER TOPIC (JSON):
   For each milestone (one per week), provide:
   - week: Integer (1 to targetWeeks)
   - module: "Module X: [Thematic Title]"
   - phase: "Phase X: [Stage Name]" (e.g., "Phase 1: Foundations", "Phase 2: Core Craft", "Phase 3: Advanced Portfolio")
   - title: Specific milestone topic title in that domain
   - description: 2-3 precise sentences detailing the concept and why professionals master it
   - estimatedHours: Integer calibrated to weekly commitment
   - difficulty: Exactly "beginner", "intermediate", or "advanced"
   - practiceProject: A tangible hands-on assignment or creative project for this week
   - aiNotes: Senior Mentor wisdom highlighting practical tips, common mistakes, or portfolio advice
   - resources: Exactly 3 to 4 high-quality resources:
     * title: String
     * url: Valid URL or authoritative resource (YouTube channel, official docs, tutorials)
     * type: "youtube" | "docs" | "exercise" | "project"
     * duration: Optional duration string (e.g. "1h 30m")

5. STRICT JSON OUTPUT:
   Return ONLY a valid JSON object matching the requested schema. No markdown outside JSON.
`;

// Synthesize a specialized fallback track when Gemini is offline or unavailable
function synthesizeCustomFallbackTrack(params: GenerateRoadmapParams): BlueprintTopic[] {
  const goal = params.careerGoal.trim();
  const totalWeeks = Math.max(2, Math.min(24, params.targetWeeks || 6));
  const hours = params.weeklyHours || 8;
  const q = goal.toLowerCase();

  // Photography & Visual Arts Track
  if (q.includes('photo') || q.includes('camera') || q.includes('cinematograph') || q.includes('videograph')) {
    const photoCurriculum = [
      {
        week: 1,
        module: 'Module 1: Camera Mechanics & Exposure Fundamentals',
        phase: 'Phase 1: Foundations',
        title: 'Mastering the Exposure Triangle (Aperture, Shutter Speed, ISO)',
        description: 'Understand how sensor sensitivity, shutter duration, and lens f-stops interact to create properly exposed images with creative depth of field and motion control.',
        estimatedHours: Math.round(hours * 0.9),
        difficulty: 'beginner' as const,
        practiceProject: 'Manual Mode Photo Shoot: Capture 10 photos of the same subject varying depth of field and shutter motion blur.',
        aiNotes: 'Always shoot in RAW format instead of JPEG to preserve maximum dynamic range in shadows and highlights.',
        resources: [
          { title: 'Peter McKinnon: Camera Basics & The Exposure Triangle', url: 'https://www.youtube.com/watch?v=V7z7BAZdt2M', type: 'youtube' as const, duration: '15m' },
          { title: 'Cambridge in Colour: Photography Concepts & Tutorials', url: 'https://www.cambridgeincolour.com/', type: 'docs' as const },
          { title: 'B&H Photo Video: Understanding Shutter Speed & Aperture', url: 'https://www.bhphotovideo.com/explora/photography', type: 'docs' as const },
        ],
      },
      {
        week: 2,
        module: 'Module 1: Optics, Focal Lengths & Composition',
        phase: 'Phase 1: Foundations',
        title: 'Lenses, Focal Lengths & Visual Composition Rules',
        description: 'Learn how focal lengths (wide, prime, telephoto) distort and compress perspectives. Apply rule of thirds, leading lines, framing, and negative space.',
        estimatedHours: Math.round(hours * 1.0),
        difficulty: 'beginner' as const,
        practiceProject: 'Composition Challenge: Shoot 15 deliberate images demonstrating leading lines, symmetry, and golden ratio framing.',
        aiNotes: 'A fast 50mm f/1.8 prime lens is the best affordable lens to learn creative portraiture and low-light photography.',
        resources: [
          { title: 'Sean Tucker: The Art of Visual Composition', url: 'https://www.youtube.com/c/SeanTuckerphoto', type: 'youtube' as const, duration: '22m' },
          { title: 'Digital Photography School: Guide to Lenses & Focal Lengths', url: 'https://digital-photography-school.com/', type: 'docs' as const },
        ],
      },
      {
        week: 3,
        module: 'Module 2: Natural & Ambient Lighting Mastery',
        phase: 'Phase 2: Applied Craft',
        title: 'Direction of Light, Golden Hour & Shadow Control',
        description: 'Harness sunlight, golden hour backlighting, blue hour mood, side lighting, and diffusers/reflectors to shape contrast and emotion.',
        estimatedHours: Math.round(hours * 1.1),
        difficulty: 'intermediate' as const,
        practiceProject: 'Golden Hour Portrait Series: Photograph a subject during sunrise or sunset utilizing rim lighting and reflector fill.',
        aiNotes: 'Look at the catchlights in the subjects eyes to evaluate the direction and softness of your light source.',
        resources: [
          { title: 'Mango Street: Mastering Natural Light Photography', url: 'https://www.youtube.com/c/MangoStreetLab', type: 'youtube' as const, duration: '18m' },
          { title: 'Strobist: Lighting 101 Guide', url: 'https://strobist.blogspot.com/', type: 'docs' as const },
        ],
      },
      {
        week: 4,
        module: 'Module 2: Studio Lighting & Flash Strobes',
        phase: 'Phase 2: Applied Craft',
        title: 'Off-Camera Flash (Speedlights, Softboxes & Modifiers)',
        description: 'Explore key light, fill light, hair light, softboxes, umbrellas, grids, and flash sync speeds for commercial and studio portraiture.',
        estimatedHours: Math.round(hours * 1.1),
        difficulty: 'intermediate' as const,
        practiceProject: '3-Point Studio Lighting Setup: Execute high-key and low-key portrait setups with off-camera flash.',
        aiNotes: 'The larger the light source relative to the subject, the softer the shadows will appear.',
        resources: [
          { title: 'Adorama TV: Studio Portrait Lighting Masterclass', url: 'https://www.youtube.com/c/Adorama', type: 'youtube' as const, duration: '45m' },
          { title: 'Fstoppers: Off-Camera Flash Fundamentals', url: 'https://fstoppers.com/', type: 'docs' as const },
        ],
      },
      {
        week: 5,
        module: 'Module 3: Post-Processing & RAW Color Grading',
        phase: 'Phase 3: Production & Portfolio',
        title: 'Adobe Lightroom & Photoshop RAW Development Workflow',
        description: 'Master tone curves, HSL color grading, local masking brushes, skin retouching, lens profile corrections, and sharpening for export.',
        estimatedHours: Math.round(hours * 1.2),
        difficulty: 'advanced' as const,
        practiceProject: 'Color Grading Suite: Edit and color grade 10 RAW photos in Adobe Lightroom with a cohesive editorial aesthetic.',
        aiNotes: 'Use the tone curve to set your black point and white point before tweaking individual color saturation.',
        resources: [
          { title: 'PHLEARN: Photoshop & Lightroom Tutorials', url: 'https://www.youtube.com/c/PhlearnLLC', type: 'youtube' as const, duration: '1h 10m' },
          { title: 'Adobe Lightroom Official User Guide', url: 'https://helpx.adobe.com/lightroom-classic/user-guide.html', type: 'docs' as const },
        ],
      },
      {
        week: 6,
        module: 'Module 3: Portfolio Curation & Client Delivery',
        phase: 'Phase 3: Production & Portfolio',
        title: 'Client Shoots, Visual Storytelling & Portfolio Launch',
        description: 'Curate your best 15-20 images into a cohesive online portfolio. Learn contracts, client communication, print vs web color spaces (sRGB vs AdobeRGB).',
        estimatedHours: Math.round(hours * 1.2),
        difficulty: 'advanced' as const,
        practiceProject: 'Launch a standalone online photography portfolio gallery featuring your top 15 edited works with artist statement.',
        aiNotes: 'Always export for web using sRGB color profile to ensure consistent color rendition across smartphones and computer screens.',
        resources: [
          { title: 'Sean Tucker: How to Build a Photography Portfolio', url: 'https://www.youtube.com/watch?v=184qXJ-R9V0', type: 'youtube' as const, duration: '20m' },
          { title: '500px & Behance Photography Best Practices', url: 'https://www.behance.net/galleries/photography', type: 'docs' as const },
        ],
      },
    ];

    // Slice or repeat according to requested weeks
    return photoCurriculum.slice(0, totalWeeks).map((item, idx) => ({
      ...item,
      week: idx + 1,
    }));
  }

  // Blockchain / Web3
  if (q.includes('web3') || q.includes('blockchain') || q.includes('smart contract') || q.includes('crypto')) {
    const web3Track = [
      {
        week: 1,
        module: 'Module 1: Blockchain Cryptography & Decentralization',
        phase: 'Phase 1: Foundations',
        title: 'Cryptographic Primitives, Hashing & P2P Networks',
        description: 'Understand SHA-256, public-private key cryptography, Elliptic Curve signatures, Merkle trees, and consensus mechanisms.',
        estimatedHours: Math.round(hours * 0.9),
        difficulty: 'beginner' as const,
        practiceProject: 'Implement a minimal Proof-of-Work blockchain prototype in TypeScript/Python with block validation.',
        aiNotes: 'Understand why immutability relies on Merkle root hashes and cryptographic block links.',
        resources: [
          { title: 'Bitcoin Whitepaper by Satoshi Nakamoto', url: 'https://bitcoin.org/bitcoin.pdf', type: 'docs' as const },
          { title: '3Blue1Brown: How Does Bitcoin Actually Work?', url: 'https://www.youtube.com/watch?v=bBC-nXj3nG4', type: 'youtube' as const, duration: '26m' },
        ],
      },
      {
        week: 2,
        module: 'Module 1: Ethereum & EVM Architecture',
        phase: 'Phase 1: Foundations',
        title: 'Ethereum Virtual Machine (EVM), Gas & Accounts',
        description: 'Explore state trees, gas mechanics, account types (EOA vs Contract), transactions lifecycle, and bytecode execution.',
        estimatedHours: Math.round(hours * 1.0),
        difficulty: 'beginner' as const,
        practiceProject: 'Connect to Sepolia testnet using Ethers.js/Viem to read block data, inspect gas fees, and broadcast signed transactions.',
        aiNotes: 'Gas optimization is critical. Every storage SSTORE operation costs 20,000 gas; use memory or calldata whenever possible.',
        resources: [
          { title: 'Ethereum.org: Official Developer Documentation', url: 'https://ethereum.org/en/developers/docs/', type: 'docs' as const },
          { title: 'Mastering Ethereum Free Book by Andreas Antonopoulos', url: 'https://github.com/ethereumbook/ethereumbook', type: 'docs' as const },
        ],
      },
      {
        week: 3,
        module: 'Module 2: Solidity Smart Contract Engineering',
        phase: 'Phase 2: Core Smart Contracts',
        title: 'Solidity Syntax, Inheritance & OpenZeppelin',
        description: 'Master visibility modifiers, mappings, structs, events, inheritance patterns, and standard ERC-20 / ERC-721 token standards.',
        estimatedHours: Math.round(hours * 1.2),
        difficulty: 'intermediate' as const,
        practiceProject: 'Write and deploy an ERC-20 staking and reward token contract with OpenZeppelin security contracts.',
        aiNotes: 'Never use tx.origin for authentication; always check msg.sender to prevent phishing attacks.',
        resources: [
          { title: 'Solidity Official Documentation', url: 'https://docs.soliditylang.org/', type: 'docs' as const },
          { title: 'Patrick Collins: Solidity & Foundry Full Course', url: 'https://www.youtube.com/watch?v=sas02qSFZ74', type: 'youtube' as const, duration: '8h 20m' },
        ],
      },
      {
        week: 4,
        module: 'Module 2: Development Frameworks & Testing',
        phase: 'Phase 2: Core Smart Contracts',
        title: 'Foundry / Hardhat, Fuzz Testing & Local Forking',
        description: 'Write comprehensive automated unit, integration, and property-based fuzz tests for smart contracts.',
        estimatedHours: Math.round(hours * 1.1),
        difficulty: 'intermediate' as const,
        practiceProject: 'Build a Foundry test suite with 100% test coverage and stateless/stateful fuzz tests.',
        aiNotes: 'Foundry runs tests in native Solidity at lightning speed; use vm.prank and vm.deal to simulate multiple users.',
        resources: [
          { title: 'Foundry Book Official', url: 'https://book.getfoundry.sh/', type: 'docs' as const },
        ],
      },
      {
        week: 5,
        module: 'Module 3: Security & Smart Contract Auditing',
        phase: 'Phase 3: Production Security',
        title: 'Reentrancy, Oracle Manipulation & Attack Vectors',
        description: 'Study flash loan attacks, front-running, sandwich attacks, reentrancy guards, Checks-Effects-Interactions pattern, and Slither.',
        estimatedHours: Math.round(hours * 1.3),
        difficulty: 'advanced' as const,
        practiceProject: 'Audit an intentionally vulnerable DeFi vault contract, exploit reentrancy, and fix it using CEI pattern.',
        aiNotes: 'Follow the Checks-Effects-Interactions pattern strictly: update internal state variables before sending external tokens/ETH.',
        resources: [
          { title: 'Damn Vulnerable DeFi CTF Challenges', url: 'https://www.damnvulnerabledefi.xyz/', type: 'exercise' as const },
        ],
      },
      {
        week: 6,
        module: 'Module 3: Web3 Full Stack Integration & Capstone',
        phase: 'Phase 3: Production Security',
        title: 'Wagmi, Viem, The Graph & Decentralized UI',
        description: 'Build responsive decentralized web applications (dApps) connecting MetaMask/WalletConnect, IPFS storage, and subgraph indexing.',
        estimatedHours: Math.round(hours * 1.2),
        difficulty: 'advanced' as const,
        practiceProject: 'Deploy a complete Decentralized Lending or Automated Market Maker (AMM) dApp with live Web3 frontend.',
        aiNotes: 'Always handle chain switching, disconnected wallet states, and pending transaction toasts gracefully.',
        resources: [
          { title: 'Wagmi React Hooks Documentation', url: 'https://wagmi.sh/', type: 'docs' as const },
        ],
      },
    ];
    return web3Track.slice(0, totalWeeks).map((item, idx) => ({ ...item, week: idx + 1 }));
  }

  // Generic Domain Fallback (Neutral, adaptable to any topic)
  const genericSteps = [
    {
      module: `Module 1: ${goal} Core Foundations`,
      phase: 'Phase 1: Foundations',
      title: `${goal} Fundamentals & Essential Tooling`,
      description: `Establish core vocabulary, professional standards, workspace setup, and fundamental techniques in ${goal}.`,
      difficulty: 'beginner' as const,
      practiceProject: `Complete a hands-on introductory project implementing foundational principles in ${goal}.`,
      aiNotes: `Spend time mastering the foundational principles before introducing advanced tools or shortcuts.`,
      resources: [
        { title: `${goal} Comprehensive Overview & Fundamentals`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '1h 30m' },
        { title: `Authoritative Guide & Best Practices for ${goal}`, url: 'https://en.wikipedia.org', type: 'docs' as const },
      ],
    },
    {
      module: `Module 1: Practical Applied Concepts`,
      phase: 'Phase 1: Foundations',
      title: `Applied Techniques & Methodologies in ${goal}`,
      description: `Deep dive into the primary practical workflows, industry methods, and standards expected from a practitioner in ${goal}.`,
      difficulty: 'beginner' as const,
      practiceProject: `Create a structured exercise project applying core real-world techniques.`,
      aiNotes: `Document your work process to identify areas where your execution can become more efficient.`,
      resources: [
        { title: `${goal} Practical Demonstration Video`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '1h 15m' },
        { title: `Industry Reference Guide`, url: 'https://medium.com', type: 'docs' as const },
      ],
    },
    {
      module: `Module 2: Advanced Techniques & Quality Standards`,
      phase: 'Phase 2: Core Craft',
      title: `Advanced Methods & Precision in ${goal}`,
      description: `Focus on nuances, quality benchmarking, advanced problem-solving, and efficient execution strategies.`,
      difficulty: 'intermediate' as const,
      practiceProject: `Execute an intermediate project requiring precision, refinement, and professional polish.`,
      aiNotes: `Compare your output against top industry practitioners to spot subtle gaps in quality.`,
      resources: [
        { title: `Deep-Dive Masterclass Tutorial`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '2h 00m' },
        { title: `Advanced Guidelines & Case Studies`, url: 'https://scholar.google.com', type: 'docs' as const },
      ],
    },
    {
      module: `Module 2: Real-World Workflow & Problem Solving`,
      phase: 'Phase 2: Core Craft',
      title: `Integrated Workflows & Real-World Scenarios in ${goal}`,
      description: `Apply your knowledge to solve complex, realistic challenges with tight constraints and high standards.`,
      difficulty: 'intermediate' as const,
      practiceProject: `Simulate a real-world client or project brief and deliver a complete solution.`,
      aiNotes: `Emphasize consistency and reliability under realistic time constraints.`,
      resources: [
        { title: `Real-World Case Study Walkthrough`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '1h 45m' },
      ],
    },
    {
      module: `Module 3: Portfolio Mastery & Professional Delivery`,
      phase: 'Phase 3: Portfolio & Launch',
      title: `Quality Refinement, Polish & Review in ${goal}`,
      description: `Audit, refine, and elevate your deliverables to meet professional client and hiring standards.`,
      difficulty: 'advanced' as const,
      practiceProject: `Perform a comprehensive critique and overhaul of your previous work to reach showcase quality.`,
      aiNotes: `Constructive feedback from mentors or peers is the fastest catalyst for leveling up.`,
      resources: [
        { title: `Professional Critique & Review Strategies`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '45m' },
      ],
    },
    {
      module: `Module 3: Capstone Showcase & Portfolio Launch`,
      phase: 'Phase 3: Portfolio & Launch',
      title: `${goal} Capstone Showcase & Career Presentation`,
      description: `Produce an authoritative, portfolio-grade capstone project ready to showcase to clients, employers, or peers.`,
      difficulty: 'advanced' as const,
      practiceProject: `Publish and present your final ${goal} capstone project with detailed process documentation.`,
      aiNotes: `Be prepared to present your decision-making and creative process clearly to potential clients or interviewers.`,
      resources: [
        { title: `Portfolio Building & Career Presentation Guide`, url: 'https://www.youtube.com', type: 'youtube' as const, duration: '1h 00m' },
      ],
    },
  ];

  const results: BlueprintTopic[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const template = genericSteps[(w - 1) % genericSteps.length];
    results.push({
      week: w,
      module: `Module ${Math.ceil((w / totalWeeks) * 3)}: ${template.module.split(': ')[1] || template.module}`,
      phase: w <= Math.ceil(totalWeeks * 0.35) ? 'Phase 1: Foundations' : w <= Math.ceil(totalWeeks * 0.7) ? 'Phase 2: Core Craft' : 'Phase 3: Portfolio & Mastery',
      title: `${template.title} (Week ${w})`,
      description: template.description,
      estimatedHours: Math.round(hours * (0.9 + (w / totalWeeks) * 0.3)),
      difficulty: (w <= Math.ceil(totalWeeks * 0.35) ? 'beginner' : w <= Math.ceil(totalWeeks * 0.7) ? 'intermediate' : 'advanced') as 'beginner' | 'intermediate' | 'advanced',
      practiceProject: template.practiceProject,
      aiNotes: template.aiNotes,
      resources: template.resources,
    });
  }

  return results;
}

// Rule-based deterministic generator
export function generateFallbackRoadmap(params: GenerateRoadmapParams): {
  title: string;
  description: string;
  totalWeeks: number;
  topics: Array<BlueprintTopic & { orderIndex: number; completionPercent: number; confidenceScore: number; status: 'pending'; notes: string }>;
} {
  const trackKey = getTrackKey(params.careerGoal, params.interests || []);
  const targetWeeks = Math.max(2, Math.min(24, params.targetWeeks || 8));
  let baseTopics = careerBlueprints[trackKey];

  // If role is custom and not matched by standard blueprints
  if (!baseTopics || (trackKey === 'fullstack' && !params.careerGoal.toLowerCase().includes('full'))) {
    baseTopics = synthesizeCustomFallbackTrack(params);
  } else {
    // Trim or adapt to requested weeks
    baseTopics = baseTopics.slice(0, targetWeeks).map((item, idx) => ({ ...item, week: idx + 1 }));
  }

  const academicLabel = params.academicYear || 'Learner';
  const hours = params.weeklyHours || 8;
  const level = params.experienceLevel || 'beginner';

  const topics = baseTopics.map((item, index) => {
    const adjustedHours = Math.max(
      4,
      Math.round((item.estimatedHours * (hours / 8)))
    );

    let customizedAiNotes = item.aiNotes;
    if (level === 'beginner') {
      customizedAiNotes = `${item.aiNotes} (Take extra time to practice hands-on; recommended for ${academicLabel}).`;
    } else if (level === 'advanced') {
      customizedAiNotes = `${item.aiNotes} (Focus directly on professional edge cases, quality, and real-world delivery).`;
    }

    return {
      ...item,
      orderIndex: index + 1,
      estimatedHours: adjustedHours,
      completionPercent: 0,
      confidenceScore: 50,
      status: 'pending' as const,
      notes: '',
      aiNotes: customizedAiNotes,
    };
  });

  const title = `${params.careerGoal} Comprehensive Roadmap`;
  const description = `Tailored for ${academicLabel} (${level} level, ${hours} hrs/week, ${targetWeeks} weeks). Focus: ${(params.interests || []).slice(0, 4).join(', ') || 'Core Skills & Practice'}.`;

  return {
    title,
    description,
    totalWeeks: targetWeeks,
    topics,
  };
}

// AI-powered Roadmap generation with Gemini
export async function generateRoadmap(params: GenerateRoadmapParams): Promise<{
  title: string;
  description: string;
  totalWeeks: number;
  topics: Array<BlueprintTopic & { orderIndex: number; completionPercent: number; confidenceScore: number; status: 'pending'; notes: string }>;
}> {
  const targetWeeks = Math.max(2, Math.min(24, params.targetWeeks || 8));
  const fallback = generateFallbackRoadmap({ ...params, targetWeeks });

  const apiKey =
    params.geminiApiKey?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.length < 10) {
    console.log('[RoadmapAiService] No valid GEMINI_API_KEY provided, utilizing custom track synthesis.');
    return fallback;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

    const userSpecifiedInterests =
      params.interests && params.interests.length > 0
        ? params.interests.join(', ')
        : 'None provided. (CRITICAL INSTRUCTION: Since the user has not listed specific topics, YOU must autonomously determine and select the essential, modern professional skills, tools, and practices specifically for this exact subject/goal).';

    const prompt = `
Create an industry-grade, week-wise personalized learning roadmap for this learner:

Learner Profile:
- Target Career / Skill Goal: ${params.careerGoal}
- Duration Requested: EXACTLY ${targetWeeks} WEEKS (Week 1 through Week ${targetWeeks})
- Academic Year / Cohort: ${params.academicYear || 'Learner'}
- Experience Level: ${params.experienceLevel || 'beginner'}
- Topics of High Interest: ${userSpecifiedInterests}
- Weekly Study Hours: ${params.weeklyHours || 8} hours/week

CRITICAL INSTRUCTIONS:
1. DOMAIN PURITY: The curriculum must be 100% relevant to "${params.careerGoal}". If "${params.careerGoal}" is photography, videography, art, design, music, business, or trades, DO NOT include any software programming or web development concepts! Keep it strictly focused on the craft of ${params.careerGoal}.
2. EXACT DURATION: You MUST generate EXACTLY ${targetWeeks} topics, exactly one topic for each week from Week 1 to Week ${targetWeeks}.
3. Return ONLY valid JSON matching this exact structure:
{
  "title": "string (e.g. ${params.careerGoal} Professional Roadmap)",
  "description": "string (2-3 sentences overview of the learning trajectory)",
  "totalWeeks": ${targetWeeks},
  "topics": [
    {
      "week": 1,
      "module": "Module 1: [Thematic Title]",
      "phase": "Phase 1: Foundations",
      "title": "string (specific milestone in ${params.careerGoal})",
      "description": "string (2-3 sentences depth for this topic)",
      "estimatedHours": number,
      "difficulty": "beginner" | "intermediate" | "advanced",
      "practiceProject": "string (concrete hands-on project or assignment)",
      "aiNotes": "string (Senior Mentor Pro-Tip on practical tips and gotchas)",
      "resources": [
        {
          "title": "string",
          "url": "https://...",
          "type": "youtube" | "docs" | "exercise" | "project",
          "duration": "string (e.g. 1h 30m)"
        }
      ]
    }
  ]
}
`;

    // Prioritize models that are active and recommended for new users
    const modelsToTry = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[RoadmapAiService] Calling Gemini model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: ROADMAP_ARCHITECT_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text || '';
        const cleanJson = cleanJsonOutput(responseText);
        const parsed = JSON.parse(cleanJson);

        if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
          console.log(`[RoadmapAiService] Successfully generated ${parsed.topics.length} topics via ${modelName}!`);

          const topicsWithDefaults = parsed.topics.map((t: any, idx: number) => ({
            week: Number(t.week) || idx + 1,
            module: t.module || `Module ${Math.ceil(((idx + 1) / parsed.topics.length) * 3)}`,
            phase: t.phase || (idx < parsed.topics.length / 3 ? 'Phase 1: Foundations' : idx < (parsed.topics.length * 2) / 3 ? 'Phase 2: Core Craft' : 'Phase 3: Portfolio & Launch'),
            title: t.title || `Milestone ${idx + 1}`,
            description: t.description || '',
            orderIndex: idx + 1,
            estimatedHours: Number(t.estimatedHours) || Math.max(4, Math.round((params.weeklyHours || 8) * 0.9)),
            difficulty: ['beginner', 'intermediate', 'advanced'].includes(t.difficulty)
              ? t.difficulty
              : 'beginner',
            practiceProject: t.practiceProject || 'Complete a hands-on project demonstrating this milestone.',
            aiNotes: t.aiNotes || 'Focus on understanding core fundamentals and steady practice.',
            resources: Array.isArray(t.resources) && t.resources.length > 0
              ? t.resources.map((r: any) => ({
                  title: r.title || 'Recommended Resource',
                  url: r.url || 'https://www.youtube.com',
                  type: ['youtube', 'docs', 'exercise', 'project'].includes(r.type) ? r.type : 'youtube',
                  duration: r.duration || '1h 00m',
                }))
              : fallback.topics[idx % fallback.topics.length]?.resources || [],
            completionPercent: 0,
            confidenceScore: 50,
            status: 'pending' as const,
            notes: '',
          }));

          return {
            title: parsed.title || fallback.title,
            description: parsed.description || fallback.description,
            totalWeeks: targetWeeks,
            topics: topicsWithDefaults,
          };
        }
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`[RoadmapAiService] Model ${modelName} failed, trying next:`, modelErr);
      }
    }

    if (lastError) {
      console.warn('[RoadmapAiService] All Gemini models failed or quota limit reached, falling back to synthesizer:', lastError);
    }
  } catch (error) {
    console.warn('[RoadmapAiService] Gemini initialization error, using custom synthesizer:', error);
  }

  return fallback;
}

// Rule-based and AI recommendations engine
export async function generateRecommendations(
  roadmap: { title: string; careerGoal: string },
  topics: Array<{
    title: string;
    phase: string;
    status: string;
    confidenceScore: number;
    completionPercent: number;
    notes?: string;
    practiceProject?: string;
    resources?: Array<{ title: string; url: string; type?: string }>;
  }>
): Promise<RecommendationResult> {
  const completedTopics = topics.filter((t) => t.status === 'completed');
  const inProgressTopics = topics.filter((t) => t.status === 'in_progress');
  const pendingTopics = topics.filter((t) => t.status === 'pending');
  const lowConfidenceTopics = topics.filter((t) => Number(t.confidenceScore) < 65);

  const fallbackNext = (inProgressTopics.length > 0 ? inProgressTopics : pendingTopics)
    .slice(0, 3)
    .map((topic, i) => ({
      title: topic.title,
      reason: i === 0
        ? `Primary current priority in ${topic.phase}. Completing this unlocks crucial proficiency.`
        : `Sequential milestone toward mastering ${roadmap.careerGoal}.`,
      expectedOutcome: `Gain practical proficiency in ${topic.title} and apply it in real projects.`,
    }));

  const fallbackProjects = (inProgressTopics.length > 0 ? inProgressTopics : pendingTopics)
    .slice(0, 2)
    .map((topic) => ({
      title: `${topic.title} Practical Sprint`,
      description: topic.practiceProject || `Create a portfolio piece showcasing ${topic.title}.`,
      focusArea: topic.phase,
    }));

  const fallbackRevision = lowConfidenceTopics.slice(0, 3).map((topic) => ({
    title: topic.title,
    reason: `Confidence is logged at ${topic.confidenceScore}%. A 30-minute revision or hands-on practice session is recommended.`,
  }));

  const uniqueWeakPhases = Array.from(new Set(lowConfidenceTopics.map((t) => t.phase))).slice(0, 3);

  const curatedResources = pendingTopics
    .flatMap((t) => t.resources || [])
    .slice(0, 6)
    .map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type || 'docs',
    }));

  const summary =
    completedTopics.length === 0
      ? `Welcome to your ${roadmap.title}! Start with Week 1 (${fallbackNext[0]?.title || 'Foundations'}) to build strong momentum.`
      : `Great progress! You have completed ${completedTopics.length} of ${topics.length} topics (${Math.round((completedTopics.length / topics.length) * 100)}%). Focus on ${fallbackNext[0]?.title || 'your next milestone'}.`;

  const encouragement =
    completedTopics.length > topics.length / 2
      ? 'You are over halfway through your curriculum! Your consistency is turning into real capability.'
      : 'Consistency is the single biggest predictor of success. Protect your weekly study hours!';

  const fallbackResult: RecommendationResult = {
    summary,
    nextTopics: fallbackNext,
    practiceProjects: fallbackProjects,
    revisionAreas: fallbackRevision,
    weakAreas: uniqueWeakPhases.length > 0 ? uniqueWeakPhases : ['Foundations Review'],
    resources: curatedResources,
    encouragement,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    return fallbackResult;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

    const prompt = `
Analyze this student's learning progress and generate smart coaching recommendations:
Goal: ${roadmap.title}
Completed topics count: ${completedTopics.length}
Pending topics count: ${pendingTopics.length}
Topics with low confidence: ${lowConfidenceTopics.map((t) => `${t.title} (${t.confidenceScore}%)`).join(', ') || 'None'}

Return ONLY valid JSON matching this schema:
{
  "summary": "string",
  "nextTopics": [
    { "title": "string", "reason": "string", "expectedOutcome": "string" }
  ],
  "practiceProjects": [
    { "title": "string", "description": "string", "focusArea": "string" }
  ],
  "revisionAreas": [
    { "title": "string", "reason": "string" }
  ],
  "weakAreas": ["string"],
  "encouragement": "string"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: 'You are an Elite Academic Coach and Placement Director analyzing student performance metrics.',
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const cleanJson = cleanJsonOutput(responseText);
    const parsed = JSON.parse(cleanJson);

    if (parsed && Array.isArray(parsed.nextTopics)) {
      return {
        summary: parsed.summary || fallbackResult.summary,
        nextTopics: parsed.nextTopics.length > 0 ? parsed.nextTopics : fallbackResult.nextTopics,
        practiceProjects: Array.isArray(parsed.practiceProjects) && parsed.practiceProjects.length > 0
          ? parsed.practiceProjects
          : fallbackResult.practiceProjects,
        revisionAreas: Array.isArray(parsed.revisionAreas) && parsed.revisionAreas.length > 0
          ? parsed.revisionAreas
          : fallbackResult.revisionAreas,
        weakAreas: Array.isArray(parsed.weakAreas) && parsed.weakAreas.length > 0
          ? parsed.weakAreas
          : fallbackResult.weakAreas,
        resources: fallbackResult.resources,
        encouragement: parsed.encouragement || fallbackResult.encouragement,
      };
    }
  } catch (err) {
    console.warn('[RoadmapAiService] Gemini recommendations error, using fallback:', err);
  }

  return fallbackResult;
}
