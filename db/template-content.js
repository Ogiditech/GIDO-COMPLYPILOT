// Source content for db/seed.sql. Edit here, then run `npm run db:build-seed` to regenerate seed.sql.
// Placeholders filled at generation time:
//   {{company_name}} {{industry}} {{employee_count}} {{location}} {{framework_name}} {{effective_date}} {{review_date}}
// Body text: one paragraph or bullet per line; bullets start with "• ".

export const FRAMEWORKS = [
  { code: 'ISO45001', name: 'ISO 45001', description: 'The international standard for occupational health and safety management systems. It helps you prevent work-related injury and ill health and keep improving safety performance.' },
  { code: 'ISO27001', name: 'ISO 27001', description: 'The international standard for information security management systems (ISMS). It helps you protect the confidentiality, integrity and availability of information using a risk-based set of controls.' },
  { code: 'UAE_PDPL', name: 'UAE PDPL', description: 'UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data. It sets the rules for collecting, using, sharing and protecting personal data in the UAE.' },
  { code: 'OSHAD', name: 'Abu Dhabi OSHAD', description: 'The Abu Dhabi Occupational Safety and Health System Framework (OSHAD-SF). It is mandatory for many entities in Abu Dhabi and sets out the elements, mechanisms and codes of practice for managing workplace safety.' },
  { code: 'GDPR', name: 'GDPR', description: 'The EU General Data Protection Regulation (2016/679). It applies when you process personal data of people in the EU, and covers lawful processing, individual rights and breach notification.' },
  { code: 'BEST_PRACTICE', name: 'General Best Practice', description: 'A plain-language, framework-neutral approach based on widely recognised good practice. A sensible starting point when no specific standard or regulation applies.' },
];

// Which frameworks have a dedicated template for each policy type
export const MATRIX = {
  'Health & Safety': ['ISO45001', 'OSHAD', 'BEST_PRACTICE'],
  'Fire Safety': ['OSHAD', 'BEST_PRACTICE'],
  'Data Protection': ['UAE_PDPL', 'GDPR', 'BEST_PRACTICE'],
  'Information Security': ['ISO27001', 'BEST_PRACTICE'],
  'Anti-Bribery': ['BEST_PRACTICE', 'UAE_PDPL'],
  'Incident Reporting': ['OSHAD', 'ISO45001'],
  'Emergency Evacuation': ['OSHAD', 'BEST_PRACTICE'],
  'Code of Conduct': ['BEST_PRACTICE', 'ISO45001'],
};

// Framework-specific additions merged into the base sections
export const OVERLAYS = {
  ISO45001: {
    purpose: 'This policy forms part of {{company_name}}\'s occupational health and safety (OH&S) management system and is aligned with ISO 45001:2018, Clause 5.2 (OH&S policy).',
    procedure: [
      '• Consult and involve non-managerial workers in hazard identification, risk assessment and decisions on controls (ISO 45001 Clause 5.4).',
      '• Identify legal and other requirements that apply and evaluate compliance with them at planned intervals (Clauses 6.1.3 and 9.1.2).',
      '• Set measurable OH&S objectives and plan how they will be achieved (Clause 6.2).',
    ],
    reporting: '• Incidents and nonconformities are investigated, root causes identified and corrective actions tracked to closure (Clause 10.2).',
    review: 'Performance against this policy is considered in management review (Clause 9.3) and used to drive continual improvement (Clause 10.3).',
  },
  ISO27001: {
    purpose: 'This policy supports {{company_name}}\'s information security management system (ISMS) in line with ISO/IEC 27001:2022, Clause 5.2 (Policy).',
    procedure: [
      '• Select controls through a documented information security risk assessment and record them in the Statement of Applicability (Clause 6.1.3).',
      '• Apply the relevant Annex A controls, including access control, cryptography, supplier security and logging and monitoring.',
    ],
    reporting: '• Information security events are reported through the agreed channel and assessed to decide whether they are incidents (Annex A 5.24–5.26 and 6.8).',
    review: 'This policy is reviewed at planned intervals and when significant changes occur, and its effectiveness is considered in management review (Clause 9.3).',
  },
  UAE_PDPL: {
    purpose: 'This policy is designed to support compliance with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and its executive regulations as they are issued.',
    procedure: [
      '• Process personal data only with the data subject\'s consent or another basis permitted under the PDPL, and only for clear, specific purposes.',
      '• Honour data subject rights, including access, correction, erasure, restriction and objection, within the required timeframes.',
      '• Transfer personal data outside the UAE only where the PDPL permits it, such as to a country with adequate protection or under appropriate safeguards.',
    ],
    reporting: '• Personal data breaches that may affect individuals\' privacy are reported to the UAE Data Office and, where required, to the affected individuals without undue delay.',
    review: 'This policy will be updated as the PDPL executive regulations and UAE Data Office guidance develop.',
  },
  OSHAD: {
    purpose: 'This policy is aligned with the Abu Dhabi Occupational Safety and Health System Framework (OSHAD-SF), including Element 1 (Roles, Responsibilities and Self-Regulation).',
    procedure: [
      '• Maintain an OSH management system proportionate to {{company_name}}\'s risk rating, as required by OSHAD-SF.',
      '• Apply the OSHAD-SF Codes of Practice that are relevant to the hazards present in {{industry}} operations.',
      '• Keep OSH records and documentation available for inspection by the relevant Sector Regulatory Authority.',
    ],
    reporting: '• Reportable incidents are notified to the relevant Abu Dhabi Sector Regulatory Authority within the timeframes set by the OSHAD-SF incident notification mechanism.',
    review: 'OSH performance is reported to the relevant Sector Regulatory Authority as required by OSHAD-SF, and this policy is reviewed in line with any new or revised Codes of Practice.',
  },
  GDPR: {
    purpose: 'This policy is designed to support compliance with the EU General Data Protection Regulation (Regulation (EU) 2016/679, "GDPR") wherever {{company_name}} processes personal data of individuals in the EU.',
    procedure: [
      '• Apply the GDPR principles in Article 5: lawfulness, fairness and transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity and confidentiality; and accountability.',
      '• Keep a record of processing activities (Article 30) and carry out a Data Protection Impact Assessment for high-risk processing (Article 35).',
      '• Put written contracts that meet Article 28 in place with every processor.',
    ],
    reporting: '• Personal data breaches are notified to the lead supervisory authority within 72 hours of becoming aware, unless unlikely to result in a risk to individuals (Article 33), and to the individuals concerned where the risk is high (Article 34).',
    review: 'This policy is reviewed in light of guidance from the European Data Protection Board and relevant supervisory authorities.',
  },
  BEST_PRACTICE: {
    purpose: 'This policy follows widely recognised good practice and the laws and regulations that apply in {{location}}.',
    procedure: [
      '• Check applicable legal requirements in {{location}} at least once a year and update this policy where needed.',
    ],
    reporting: '',
    review: '{{company_name}} will benchmark this policy against recognised industry good practice when it is reviewed.',
  },
};

// Base content per policy type (8 sections each)
export const BASE = {
  'Health & Safety': {
    title: 'Occupational Health & Safety Policy',
    purpose: '{{company_name}} is committed to providing safe and healthy working conditions for everyone affected by its {{industry}} activities, and to preventing work-related injury and ill health.',
    scope: 'This policy applies to all {{employee_count}} employees of {{company_name}}, as well as contractors, subcontractors, visitors and anyone else working at or visiting sites under {{company_name}}\'s control in {{location}}.',
    definitions: [
      '• Hazard: anything with the potential to cause harm.',
      '• Risk: the combination of the likelihood of harm and its severity.',
      '• Near miss: an event that could have caused injury or damage but did not.',
      '• PPE: personal protective equipment, such as safety footwear, gloves, eye and hearing protection.',
    ],
    lead: 'HSE Manager',
    procedure: [
      'To achieve its commitment, {{company_name}} will:',
      '• Identify hazards and assess risks before work begins, and review assessments when work changes.',
      '• Apply the hierarchy of controls: eliminate, substitute, engineer, administrate, then protect with PPE.',
      '• Provide safe plant, equipment and systems of work, and suitable PPE at no cost to workers.',
      '• Give every worker the right to stop work they reasonably believe to be unsafe, without fear of reprisal.',
      '• Monitor workplace conditions through inspections, audits and health surveillance where required.',
    ],
    training: [
      '• All new starters complete health and safety induction before starting work.',
      '• Task-specific training (for example, working at height, manual handling or forklift operation) is given before workers carry out those tasks.',
      '• Refresher training is completed at least annually, and training records are kept.',
    ],
    reporting: [
      '• All incidents, near misses and unsafe conditions must be reported to a supervisor immediately and logged within 24 hours.',
      '• Workers can raise safety concerns with their manager, a safety representative or the HSE Manager at any time.',
    ],
  },
  'Fire Safety': {
    title: 'Fire Safety & Prevention Policy',
    purpose: '{{company_name}} will prevent fires wherever reasonably practicable and make sure that, if a fire does happen, everyone can escape safely and damage is kept to a minimum.',
    scope: 'This policy covers all premises, warehouses, vehicles and temporary sites under the control of {{company_name}} in {{location}}, and everyone on them.',
    definitions: [
      '• Fire risk assessment: a structured review of fire hazards, the people at risk and the controls in place.',
      '• Fire warden: a trained person responsible for checking an area and helping evacuation during a fire.',
      '• Hot work: any work that produces flames, sparks or heat, such as welding, cutting or grinding.',
    ],
    lead: 'Fire Safety Coordinator',
    procedure: [
      '• Carry out and document a fire risk assessment for each premises, reviewed annually or after significant change.',
      '• Keep escape routes, fire exits and fire-fighting equipment clear, signed and maintained at all times.',
      '• Test fire alarms weekly, and service extinguishers, sprinklers and emergency lighting to the maintenance schedule.',
      '• Control ignition sources through a hot work permit system and safe storage of flammable materials.',
      '• Appoint enough trained fire wardens to cover every floor and every shift.',
    ],
    training: [
      '• All staff receive fire safety awareness training at induction and annually afterwards.',
      '• Fire wardens receive role-specific training and refresher training at least every two years.',
      '• Fire drills are held at least twice a year and the results recorded.',
    ],
    reporting: [
      '• Any fire, however small, and any damaged or missing fire equipment must be reported to the Fire Safety Coordinator immediately.',
      '• Blocked exits and fire hazards must be reported and made safe straight away.',
    ],
  },
  'Data Protection': {
    title: 'Personal Data Protection Policy',
    purpose: '{{company_name}} respects the privacy of its customers, employees and partners, and is committed to processing personal data lawfully, fairly and transparently.',
    scope: 'This policy applies to all personal data processed by {{company_name}}, in any format, and to all employees, contractors and third-party processors who handle it on {{company_name}}\'s behalf.',
    definitions: [
      '• Personal data: any information relating to an identified or identifiable living person.',
      '• Sensitive personal data: data revealing health, ethnicity, religion, biometrics, criminal records or similar.',
      '• Processing: anything done with personal data, including collecting, storing, using, sharing and deleting it.',
      '• Data subject: the person the personal data is about.',
    ],
    lead: 'Data Protection Officer',
    procedure: [
      '• Collect only the personal data needed for a specified, explicit and legitimate purpose.',
      '• Tell individuals clearly how their data will be used, through privacy notices.',
      '• Keep personal data accurate and up to date, and keep it no longer than the retention schedule allows.',
      '• Protect personal data with appropriate technical and organisational security measures.',
      '• Assess new systems and projects for privacy risk before they go live.',
    ],
    training: [
      '• All staff complete data protection training at induction and annually afterwards.',
      '• Staff who handle sensitive personal data or customer databases receive additional role-specific training.',
    ],
    reporting: [
      '• Suspected personal data breaches must be reported to the Data Protection Officer immediately.',
      '• Requests from individuals to exercise their data rights must be passed to the Data Protection Officer on the day they are received.',
    ],
  },
  'Information Security': {
    title: 'Information Security Policy',
    purpose: '{{company_name}} will protect the confidentiality, integrity and availability of its information assets and the information entrusted to it by customers and partners.',
    scope: 'This policy applies to all information systems, devices, networks, cloud services and data owned or used by {{company_name}}, and to every person who uses them.',
    definitions: [
      '• Information asset: any data, system or device that has value to {{company_name}}.',
      '• MFA: multi-factor authentication, meaning a sign-in that needs two or more types of proof.',
      '• Security incident: an event that could compromise the confidentiality, integrity or availability of information.',
    ],
    lead: 'Information Security Manager',
    procedure: [
      '• Grant access on a least-privilege, need-to-know basis and review access rights at least quarterly.',
      '• Enforce multi-factor authentication for email, remote access and all privileged accounts.',
      '• Encrypt laptops, mobile devices and sensitive data in transit and at rest.',
      '• Apply critical security patches within 14 days and keep anti-malware protection active on all endpoints.',
      '• Back up critical data regularly and test restoration at least twice a year.',
      '• Classify information as Public, Internal, Confidential or Restricted and handle it accordingly.',
    ],
    training: [
      '• All users complete security awareness training at induction and annually afterwards.',
      '• Regular phishing simulations are run, and extra coaching is given where needed.',
    ],
    reporting: [
      '• Suspected security incidents, lost devices and phishing emails must be reported to the IT service desk immediately.',
    ],
  },
  'Anti-Bribery': {
    title: 'Anti-Bribery & Corruption Policy',
    purpose: '{{company_name}} has zero tolerance for bribery and corruption in any form, and is committed to acting with integrity in all its business dealings.',
    scope: 'This policy applies to all directors, employees, agents, consultants, distributors and other business partners acting for or on behalf of {{company_name}}, wherever they are located.',
    definitions: [
      '• Bribe: anything of value offered, promised, given or received to improperly influence a decision.',
      '• Facilitation payment: a small unofficial payment to speed up a routine government action.',
      '• Public official: anyone who holds a legislative, administrative or judicial position, or works for a government body or state-owned company.',
    ],
    lead: 'Compliance Officer',
    procedure: [
      '• Never offer, give, request or accept a bribe, directly or through a third party.',
      '• Do not make facilitation payments, even where they may be customary locally.',
      '• Record all gifts and hospitality above the approved threshold in the Gifts & Hospitality Register, and get prior approval where required.',
      '• Carry out risk-based due diligence on agents, suppliers and partners before engaging them.',
      '• Keep accurate books and records that fairly reflect every transaction.',
    ],
    training: [
      '• All employees complete anti-bribery training at induction and every year afterwards.',
      '• Higher-risk roles, such as procurement, sales and government relations, receive enhanced training.',
    ],
    reporting: [
      '• Any request for, or offer of, a bribe must be reported to the Compliance Officer immediately.',
      '• Concerns can be raised confidentially through the speak-up channel. Retaliation against anyone reporting in good faith is prohibited.',
    ],
  },
  'Incident Reporting': {
    title: 'Incident Reporting & Investigation Procedure',
    purpose: '{{company_name}} will make sure that all incidents, near misses and dangerous occurrences are reported, investigated and learned from, so that they are not repeated.',
    scope: 'This procedure applies to all employees, contractors and visitors at {{company_name}} sites in {{location}}, and to all work-related activities.',
    definitions: [
      '• Incident: an unplanned event that results in injury, ill health, damage or loss.',
      '• Near miss: an unplanned event that did not cause harm but had the potential to.',
      '• Root cause: the underlying reason an incident happened.',
      '• Corrective action: a step taken to remove the cause of an incident and stop it happening again.',
    ],
    lead: 'HSE Manager',
    procedure: [
      '• Make the area safe and give first aid where needed, and call the emergency services if required.',
      '• Report the incident to a supervisor immediately and record it in the incident log within 24 hours.',
      '• Preserve evidence where it is safe to do so, and take photographs and witness statements.',
      '• Investigate in proportion to the actual and potential severity, using root-cause analysis.',
      '• Agree corrective actions with named owners and due dates, and track them to completion.',
      '• Share lessons learned across {{company_name}}.',
    ],
    training: [
      '• All staff are trained on how and when to report incidents at induction.',
      '• Supervisors and investigators receive training in incident investigation and root-cause analysis.',
    ],
    reporting: [
      '• Monthly incident statistics, including near misses, are reported to senior management.',
    ],
  },
  'Emergency Evacuation': {
    title: 'Emergency Evacuation Plan',
    purpose: '{{company_name}} will make sure that everyone on its premises can be evacuated quickly and safely in an emergency.',
    scope: 'This plan applies to all buildings and sites operated by {{company_name}} in {{location}}, and to everyone present, including visitors, contractors and people with disabilities.',
    definitions: [
      '• Assembly point: the designated safe location where people gather after evacuating.',
      '• Incident Controller: the person in charge of the evacuation until the emergency services arrive.',
      '• PEEP: a Personal Emergency Evacuation Plan for someone who may need help to evacuate.',
    ],
    lead: 'Emergency Response Coordinator',
    procedure: [
      '• Display evacuation routes and assembly point maps prominently on every floor.',
      '• On hearing the alarm, stop work, leave by the nearest safe exit and go directly to the assembly point. Do not use lifts.',
      '• Fire wardens sweep their zones and report to the Incident Controller at the assembly point.',
      '• Account for all staff and visitors using sign-in records.',
      '• Re-enter buildings only when the emergency services or Incident Controller give the all-clear.',
      '• Prepare a PEEP for every person who needs help to evacuate.',
    ],
    training: [
      '• All staff and regular contractors are briefed on evacuation procedures at induction.',
      '• Evacuation drills are held at least twice a year, timed and reviewed for improvements.',
    ],
    reporting: [
      '• Problems found during drills, such as blocked routes or alarms that cannot be heard, are reported and fixed promptly.',
    ],
  },
  'Code of Conduct': {
    title: 'Employee Code of Conduct',
    purpose: 'This Code sets out the standards of behaviour {{company_name}} expects from everyone who works for it, and reflects its values of integrity, respect and accountability.',
    scope: 'This Code applies to all employees, directors, temporary staff and contractors of {{company_name}}, wherever they work.',
    definitions: [
      '• Conflict of interest: a situation where personal interests could influence, or appear to influence, business decisions.',
      '• Harassment: unwanted conduct that violates a person\'s dignity or creates an intimidating or hostile environment.',
      '• Confidential information: non-public information about {{company_name}}, its customers or partners.',
    ],
    lead: 'HR Manager',
    procedure: [
      '• Treat colleagues, customers and partners with dignity and respect. Harassment, bullying and discrimination are never acceptable.',
      '• Avoid conflicts of interest and declare any that arise to your manager.',
      '• Protect company assets, confidential information and intellectual property.',
      '• Comply with all applicable laws and regulations in {{location}} and every country where {{company_name}} operates.',
      '• Use company systems and social media responsibly.',
    ],
    training: [
      '• All staff read and acknowledge this Code at induction and complete a refresher every year.',
    ],
    reporting: [
      '• Concerns about breaches of this Code can be raised with a line manager, HR, or confidentially through the speak-up channel.',
      '• {{company_name}} will not tolerate retaliation against anyone who raises a concern in good faith.',
    ],
  },
};

// Extra framework-specific procedure content for particular combinations
export const SPECIFIC = {
  'Anti-Bribery|UAE_PDPL': [
    '• Due diligence screening and speak-up reports involve personal data. Process it only as permitted under the PDPL, keep it confidential and retain it no longer than necessary.',
  ],
  'Code of Conduct|ISO45001': [
    '• Follow all safety rules, wear required PPE and never work under the influence of alcohol or drugs.',
    '• Take part in consultation on health and safety matters and use your right to stop unsafe work.',
  ],
  'Incident Reporting|ISO45001': [
    '• Involve workers in investigating incidents and in deciding corrective actions.',
  ],
  'Fire Safety|OSHAD': [
    '• Coordinate fire safety arrangements with Abu Dhabi Civil Defence requirements and keep civil defence approvals current.',
  ],
};
