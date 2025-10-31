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

CRITICAL RULES - Quantum Linguistics requires pure logical transformation:
- Use the EXACT wording from the belief - do NOT add reframes, timeframes, or qualifiers
- Do NOT add phrases like "even for two minutes", "just for", "today", "this week", etc.
- Do NOT make therapeutic suggestions or embellishments
- Transform ONLY the logical structure (positive/negative) according to Cartesian coordinates
- REMOVE all modal verbs (can/can't/could/couldn't/should/would capability) and use simple past tense (did/didn't)
- Convert first person "I" to second person "you" for proper questioning format
- Keep each question concise (under 20 words)
- Return ONLY the 4 questions as a JSON object with keys: theorem, converse, inverse, nonMirrorReverse

Examples:
Belief: "I can't get up and workout"
Correct: "What would happen if you did get up and workout?"
WRONG: "What would happen if you could get up and workout?"
WRONG: "What would happen if you got up and worked out for just two minutes?"

Belief: "I'm not confident"
Correct: "What would happen if you were confident?"
WRONG: "What would happen if you could be confident?"`;


  try {
    console.log('Calling GPT-5 API for question generation...');
    const response = await openai.chat.completions.create({
      model: 'gpt-5', // Using GPT-5 as specified
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate Cartesian Logic questions for this belief: "${belief}"` }
      ],
      response_format: { type: "json_object" },
      reasoning_effort: "medium", // GPT-5 parameter: balanced reasoning
      verbosity: "medium", // GPT-5 parameter: concise but complete
      // Note: temperature, top_p, logprobs NOT supported for GPT-5
    });

    const content = response.choices[0].message.content;
    console.log('GPT-5 response received successfully');
    return JSON.parse(content);
  } catch (error) {
    console.error('GPT-5 API Error - falling back to template questions');
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
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

  // Clean the belief - convert from first person to second person
  let cleanedBelief = belief.trim();

  // Remove negative prefixes and convert "I" statements to "you" statements
  cleanedBelief = cleanedBelief
    .replace(/^I\s+can't\s+/i, 'you did ')
    .replace(/^I\s+cannot\s+/i, 'you did ')
    .replace(/^I\s+am\s+not\s+/i, 'you were ')
    .replace(/^I\s+don't\s+/i, 'you did ')
    .replace(/^I\s+haven't\s+/i, 'you had ')
    .replace(/^I'm\s+/i, 'you were ')
    .replace(/^I\s+am\s+/i, 'you were ')
    .replace(/^I\s+/i, 'you ');

  // Convert all pronouns from first person to second person
  cleanedBelief = cleanedBelief
    .replace(/\bmyself\b/gi, 'yourself')
    .replace(/\bme\b/gi, 'you')
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bmine\b/gi, 'yours');

  // For negative beliefs, create positive version
  const positiveAction = cleanedBelief;

  // Create negative version by reversing
  let negativeAction;
  if (cleanedBelief.includes('did ')) {
    negativeAction = cleanedBelief.replace('did ', "didn't ");
  } else if (cleanedBelief.includes('were ')) {
    negativeAction = cleanedBelief.replace('were ', "weren't ");
  } else if (cleanedBelief.includes('had ')) {
    negativeAction = cleanedBelief.replace('had ', "hadn't ");
  } else {
    negativeAction = 'you did not ' + cleanedBelief.replace(/^you\s+/, '');
  }

  return {
    theorem: `What would happen if ${positiveAction}?`,
    converse: `What wouldn't happen if ${positiveAction}?`,
    inverse: `What would happen if ${negativeAction}?`,
    nonMirrorReverse: `What wouldn't happen if ${negativeAction}?`
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
