/**
 * Policy generation: the ONE place to plug in a real AI model later.
 *
 * Today ("template" mode): fills the database template's placeholders with the organisation's details.
 * Later ("ai" mode): set POLICY_GENERATOR=ai and implement generateWithAI() using Gemini or
 * Azure OpenAI (read the API key from an env var here, server-side only). It must return the same shape:
 *
 *   { title: string, sections: [{ number, title, content }] }   // content: lines separated by "\n", bullets start with "• "
 */

export const POLICY_TITLES = {
  'Health & Safety': 'Occupational Health & Safety Policy',
  'Fire Safety': 'Fire Safety & Prevention Policy',
  'Data Protection': 'Personal Data Protection Policy',
  'Information Security': 'Information Security Policy',
  'Anti-Bribery': 'Anti-Bribery & Corruption Policy',
  'Incident Reporting': 'Incident Reporting & Investigation Procedure',
  'Emergency Evacuation': 'Emergency Evacuation Plan',
  'Code of Conduct': 'Employee Code of Conduct',
};

// Optional sections the user can switch off in the wizard
export const OPTIONAL_SECTION_TITLES = {
  roles: 'Roles & Responsibilities',
  training: 'Training',
  reporting: 'Reporting',
  review: 'Review & Approval',
};

const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => (vars[key] !== undefined && vars[key] !== null && vars[key] !== '' ? String(vars[key]) : m));
}

function fromTemplate({ template, details, framework, include, effectiveDate, reviewDate }) {
  const vars = {
    company_name: details.company_name,
    industry: details.industry || 'business',
    employee_count: details.employee_count ?? '',
    location: details.location || 'the countries where it operates',
    framework_name: framework.name,
    effective_date: fmtDate(effectiveDate),
    review_date: fmtDate(reviewDate),
  };
  const excluded = new Set(Object.entries(OPTIONAL_SECTION_TITLES).filter(([k]) => include?.[k] === false).map(([, t]) => t));
  const sections = template.sections
    .filter((s) => !excluded.has(s.title))
    .map((s, i) => ({ number: i + 1, title: s.title, content: fill(s.body, vars) }));
  return { title: POLICY_TITLES[template.policy_type] || `${template.policy_type} Policy`, sections };
}

// eslint-disable-next-line no-unused-vars
async function generateWithAI(input) {
  // Example sketch:
  //   const base = fromTemplate(input);                         // use the template as the skeleton / prompt
  //   const resp = await fetch(AI_ENDPOINT, { headers: { 'api-key': process.env.AI_API_KEY }, body: ... });
  //   return { title: base.title, sections: parsedSections };
  return fromTemplate(input);
}

/**
 * @param {object} input
 * @param {{ policy_type: string, sections: {title:string, body:string}[] }} input.template
 * @param {{ company_name: string, industry?: string, employee_count?: number, location?: string }} input.details
 * @param {{ name: string, code: string }} input.framework
 * @param {Record<'roles'|'training'|'reporting'|'review', boolean>} [input.include]
 * @param {string} input.effectiveDate  YYYY-MM-DD
 * @param {string} input.reviewDate     YYYY-MM-DD
 */
export async function generatePolicy(input) {
  if (process.env.POLICY_GENERATOR === 'ai') return generateWithAI(input);
  return fromTemplate(input);
}
