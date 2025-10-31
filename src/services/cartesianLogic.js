/**
 * Cartesian Logic Engine
 * Based on NLP Master Practitioner Manual - Chapter 2: Quantum Linguistics
 *
 * The four quadrants of Cartesian Logic:
 * 1. Theorem (AB): What would happen if you did?
 * 2. Converse (~AB): What wouldn't happen if you did?
 * 3. Inverse (A~B): What would happen if you didn't?
 * 4. Non-Mirror Image Reverse (~A~B): What wouldn't happen if you didn't?
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, route through backend
});

/**
 * Parse the belief to extract the verb type (being/doing/having)
 * @param {string} belief - The user's limiting belief
 * @returns {object} - Parsed belief structure
 */
export function parseBelief(belief) {
  const beliefLower = belief.toLowerCase().trim();

  // Detect verb type
  let verbType = 'doing'; // default
  if (beliefLower.match(/\b(am|is|are|be|being)\b/)) {
    verbType = 'being';
  } else if (beliefLower.match(/\b(have|has|having|had|get|getting|got)\b/)) {
    verbType = 'having';
  }

  return {
    original: belief,
    verbType,
    isNegative: beliefLower.includes("can't") || beliefLower.includes("cannot") || beliefLower.includes("not")
  };
}

/**
 * Generate Cartesian Logic questions using GPT-5
 * @param {string} belief - The user's limiting belief
 * @returns {Promise<object>} - Object containing the four questions
 */
export async function generateCartesianQuestions(belief) {
  const parsed = parseBelief(belief);

  const systemPrompt = `You are an expert NLP Master Practitioner specializing in Quantum Linguistics and Cartesian Logic.

Your task is to take a limiting belief and generate exactly 4 questions following the Cartesian Coordinates framework:

1. THEOREM (AB) - What would happen if you did/were/had [belief]?
2. CONVERSE (~AB) - What wouldn't happen if you did/were/had [belief]?
3. INVERSE (A~B) - What would happen if you didn't/weren't/hadn't [belief]?
4. NON-MIRROR IMAGE REVERSE (~A~B) - What wouldn't happen if you didn't/weren't/hadn't [belief]?

Rules:
- Make questions therapeutically powerful and thought-provoking
- Use natural, conversational language
- Preserve the essence of the belief while challenging it
- Keep each question concise (under 20 words)
- Return ONLY the 4 questions as a JSON object with keys: theorem, converse, inverse, nonMirrorReverse`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5', // Using GPT-5 as specified
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate Cartesian Logic questions for this belief: "${belief}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating questions:', error);
    // Fallback to template-based questions
    return generateTemplateQuestions(belief, parsed);
  }
}

/**
 * Fallback: Generate template-based questions (no API needed)
 * @param {string} belief - The user's limiting belief
 * @param {object} parsed - Parsed belief structure
 * @returns {object} - Object containing the four questions
 */
function generateTemplateQuestions(belief, parsed) {
  const { verbType, isNegative } = parsed;

  // Simple template-based generation
  const baseVerb = verbType === 'being' ? 'were' : verbType === 'having' ? 'had' : 'did';
  const negativeVerb = verbType === 'being' ? "weren't" : verbType === 'having' ? "hadn't" : "didn't";

  return {
    theorem: `What would happen if you ${baseVerb} able to ${belief.toLowerCase().replace(/^i\s+(can't|cannot|am not|don't|haven't)\s+/i, '')}?`,
    converse: `What wouldn't happen if you ${baseVerb} able to ${belief.toLowerCase().replace(/^i\s+(can't|cannot|am not|don't|haven't)\s+/i, '')}?`,
    inverse: `What would happen if you ${negativeVerb} able to ${belief.toLowerCase().replace(/^i\s+(can't|cannot|am not|don't|haven't)\s+/i, '')}?`,
    nonMirrorReverse: `What wouldn't happen if you ${negativeVerb} able to ${belief.toLowerCase().replace(/^i\s+(can't|cannot|am not|don't|haven't)\s+/i, '')}?`
  };
}

/**
 * Format questions for display
 * @param {object} questions - Questions object from generateCartesianQuestions
 * @returns {array} - Array of formatted question objects
 */
export function formatQuestionsForDisplay(questions) {
  return [
    {
      id: 1,
      label: 'Theorem (AB)',
      description: 'What would happen if you did?',
      question: questions.theorem,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 2,
      label: 'Converse (~AB)',
      description: "What wouldn't happen if you did?",
      question: questions.converse,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 3,
      label: 'Inverse (A~B)',
      description: "What would happen if you didn't?",
      question: questions.inverse,
      color: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 4,
      label: 'Non-Mirror Reverse (~A~B)',
      description: "What wouldn't happen if you didn't?",
      question: questions.nonMirrorReverse,
      color: 'bg-violet-100 text-violet-800'
    }
  ];
}
