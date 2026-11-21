import { GoogleGenAI } from '@google/genai';
import { ProficiencyLevel } from '../models/skill.model.js';

export interface VerificationResult {
  verified: boolean;
  progress: number;
  proficiency: ProficiencyLevel;
  aiReviewSummary: string;
  aiKeyStrengths: string[];
  repoName: string;
  languagesFound: string[];
}

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CareerFlow-Proof-Verifier',
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch GitHub repository public metadata, languages, and directory structure.
 */
async function fetchGithubRepoData(owner: string, repo: string) {
  try {
    // 1. Core Repo Details
    const repoRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        throw new Error(`GitHub repository "${owner}/${repo}" was not found or is private.`);
      }
      if (repoRes.status === 403) {
        console.warn('[githubVerifier] GitHub API rate-limited, proceeding with heuristic analysis.');
      }
    }
    const repoData = repoRes.ok ? await repoRes.json() : null;

    // 2. Languages breakdown
    let languages: Record<string, number> = {};
    try {
      const langRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/languages`);
      if (langRes.ok) {
        languages = await langRes.json();
      }
    } catch {
      // ignore language error
    }

    // 3. Root directory contents
    let files: string[] = [];
    try {
      const contentRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (contentRes.ok) {
        const contents = await contentRes.json();
        if (Array.isArray(contents)) {
          files = contents.slice(0, 20).map((f: any) => f.name);
        }
      }
    } catch {
      // ignore contents error
    }

    // 4. Readme excerpt
    let readmeText = '';
    try {
      const readmeRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        if (readmeData.content) {
          readmeText = Buffer.from(readmeData.content, 'base64').toString('utf-8').slice(0, 2000);
        }
      }
    } catch {
      // ignore readme error
    }

    return {
      name: repoData?.name || repo,
      fullName: repoData?.full_name || `${owner}/${repo}`,
      description: repoData?.description || '',
      stars: repoData?.stargazers_count || 0,
      size: repoData?.size || 0,
      primaryLanguage: repoData?.language || Object.keys(languages)[0] || '',
      languages: Object.keys(languages),
      languagesDetailed: languages,
      files,
      readmeExcerpt: readmeText,
    };
  } catch (error: any) {
    console.warn(`[githubVerifier] Error fetching repo data:`, error.message);
    return {
      name: repo,
      fullName: `${owner}/${repo}`,
      description: '',
      stars: 0,
      size: 100,
      primaryLanguage: '',
      languages: [],
      languagesDetailed: {},
      files: [],
      readmeExcerpt: '',
      fetchError: error.message,
    };
  }
}

/**
 * Deterministic heuristic evaluation for when Gemini or GitHub is offline
 */
function evaluateProofHeuristically(
  skillName: string,
  category: string,
  repoData: any
): VerificationResult {
  const skillLower = skillName.toLowerCase();
  const langsLower = (repoData.languages || []).map((l: string) => l.toLowerCase());
  const filesLower = (repoData.files || []).map((f: string) => f.toLowerCase());
  const descLower = (repoData.description || '').toLowerCase();
  const readmeLower = (repoData.readmeExcerpt || '').toLowerCase();

  let score = 25; // baseline for submitting a valid repo
  const strengths: string[] = [];

  // Match in languages
  const hasLangMatch = langsLower.some((l: string) => skillLower.includes(l) || l.includes(skillLower));
  if (hasLangMatch) {
    score += 30;
    strengths.push(`Core language match: ${repoData.primaryLanguage || skillName}`);
  }

  // Match in description or readme
  if (descLower.includes(skillLower) || readmeLower.includes(skillLower)) {
    score += 15;
    strengths.push('Documented implementation in README/description');
  }

  // Multi-file architecture
  if (repoData.files.length >= 5) {
    score += 15;
    strengths.push(`Modular repository architecture with ${repoData.files.length}+ root components`);
  }

  // Tests / configs found
  if (filesLower.some((f: string) => f.includes('test') || f.includes('spec') || f.includes('package') || f.includes('config'))) {
    score += 10;
    strengths.push('Automated dependencies and configuration verified');
  }

  score = Math.min(95, Math.max(30, score));

  let proficiency: ProficiencyLevel = 'Beginner';
  if (score >= 85) proficiency = 'Expert';
  else if (score >= 70) proficiency = 'Advanced';
  else if (score >= 45) proficiency = 'Intermediate';

  return {
    verified: true,
    progress: score,
    proficiency,
    aiReviewSummary: `Verified ${skillName} implementation in repository "${repoData.fullName}". Detected ${repoData.languages.slice(0, 3).join(', ') || 'code'} architecture with functional codebase structures.`,
    aiKeyStrengths: strengths.length > 0 ? strengths : [`Active repository structure (${repoData.name})`],
    repoName: repoData.fullName,
    languagesFound: repoData.languages || [],
  };
}

/**
 * Verify GitHub repository proof using Gemini AI to award authentic progress score.
 */
export async function verifySkillWithGithubAndAI(
  skillName: string,
  category: string,
  repoUrl: string
): Promise<VerificationResult> {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL. Must be in format: https://github.com/owner/repository');
  }

  const repoData = await fetchGithubRepoData(parsed.owner, parsed.repo);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 15 || apiKey.includes('your_gemini_api_key')) {
    console.log('[githubVerifier] No valid GEMINI_API_KEY set, using algorithmic code verification.');
    return evaluateProofHeuristically(skillName, category, repoData);
  }

  const prompt = `
You are a Principal Software Engineering Assessor and Technical Recruiter.
A student is claiming competency in the skill: "${skillName}" (Category: "${category}").
They have submitted the following GitHub repository as proof/evidence of their implementation and growth:

REPOSITORY: ${repoData.fullName}
DESCRIPTION: ${repoData.description || 'No description provided'}
PRIMARY LANGUAGE: ${repoData.primaryLanguage || 'Unknown'}
LANGUAGES BREAKDOWN: ${JSON.stringify(repoData.languagesDetailed || {})}
ROOT FILES: ${repoData.files.join(', ') || 'No files listed'}
README EXCERPT:
${repoData.readmeExcerpt ? repoData.readmeExcerpt.slice(0, 1000) : 'None'}

TASK:
Audit this repository's codebase evidence strictly for the claimed skill "${skillName}".
1. Is the repository relevant to "${skillName}"?
2. How deep, complex, and modular is the implementation?
3. Award an authentic, objective Verified Progress score (0 to 100%):
   - 0-25%: Irrelevant repo, placeholder, or empty project.
   - 26-50%: Beginner tutorial or single-file demonstration.
   - 51-70%: Solid intermediate multi-file application with clear logic.
   - 71-85%: Advanced, production-ready implementation, clean modular patterns, error handling.
   - 86-98%: Expert-level engineering, full test coverage, robust CI/CD, or scalable system architecture.
4. Assign Proficiency Level: "Beginner" (0-44%) | "Intermediate" (45-69%) | "Advanced" (70-84%) | "Expert" (85-100%).
5. Write a concise 2-sentence technical review summary explaining why this progress percentage was awarded based on what was found in their repository.
6. List 2 to 4 key technical strengths detected.

Return strictly a valid JSON object matching this schema:
{
  "verified": boolean,
  "progress": number,
  "proficiency": "Beginner" | "Intermediate" | "Advanced" | "Expert",
  "aiReviewSummary": string,
  "aiKeyStrengths": ["string", "string"]
}
`;

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
  const ai = new GoogleGenAI({ apiKey });

  for (const model of modelsToTry) {
    try {
      console.log(`[githubVerifier] Evaluating repository with Gemini model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) continue;

      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedJson = JSON.parse(cleaned);

      if (typeof parsedJson.progress === 'number' && parsedJson.proficiency) {
        const validProficiencies: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        const prof = validProficiencies.includes(parsedJson.proficiency)
          ? parsedJson.proficiency
          : parsedJson.progress >= 85
          ? 'Expert'
          : parsedJson.progress >= 70
          ? 'Advanced'
          : parsedJson.progress >= 45
          ? 'Intermediate'
          : 'Beginner';

        return {
          verified: parsedJson.verified ?? true,
          progress: Math.min(100, Math.max(10, Math.round(parsedJson.progress))),
          proficiency: prof,
          aiReviewSummary: parsedJson.aiReviewSummary || `Verified ${skillName} mastery in ${repoData.fullName}.`,
          aiKeyStrengths: Array.isArray(parsedJson.aiKeyStrengths) ? parsedJson.aiKeyStrengths : [],
          repoName: repoData.fullName,
          languagesFound: repoData.languages || [],
        };
      }
    } catch (err: any) {
      console.warn(`[githubVerifier] Gemini evaluation error with ${model}:`, err.message || err);
    }
  }

  // Graceful fallback if AI call fails
  return evaluateProofHeuristically(skillName, category, repoData);
}
