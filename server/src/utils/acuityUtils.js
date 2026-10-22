/**
 * Centralized Clinical Acuity and Department Routing Configuration
 * Conforms to Emergency Severity Index (ESI) 5-Level Triage Standards
 */

const ACUITY_LEVELS = {
  IMMEDIATE: 'Immediate',     // Level 1: Resuscitation / Immediate life threat (Red)
  EMERGENT: 'Emergent',       // Level 2: Emergent / High risk / Time-critical (Orange)
  URGENT: 'Urgent',           // Level 3: Urgent / Multiple resources needed (Yellow)
  LESS_URGENT: 'Less Urgent', // Level 4: Less Urgent / One resource needed (Green)
  NON_URGENT: 'Non-urgent'    // Level 5: Non-urgent / No resources needed (Blue)
};

// Priority ordering: lower number = higher clinical priority
const ACUITY_PRIORITY = {
  [ACUITY_LEVELS.IMMEDIATE]: 1,
  [ACUITY_LEVELS.EMERGENT]: 2,
  [ACUITY_LEVELS.URGENT]: 3,
  [ACUITY_LEVELS.LESS_URGENT]: 4,
  [ACUITY_LEVELS.NON_URGENT]: 5
};

// Standard Acuity Color Mapping (Emergency Severity Index standard)
const ACUITY_COLORS = {
  [ACUITY_LEVELS.IMMEDIATE]: 'Red',
  [ACUITY_LEVELS.EMERGENT]: 'Orange',
  [ACUITY_LEVELS.URGENT]: 'Yellow',
  [ACUITY_LEVELS.LESS_URGENT]: 'Green',
  [ACUITY_LEVELS.NON_URGENT]: 'Blue',
  1: 'Red',
  2: 'Orange',
  3: 'Yellow',
  4: 'Green',
  5: 'Blue'
};

// Standard Hospital Departments
const VALID_DEPARTMENTS = [
  'Emergency',
  'Emergency / Critical Care',
  'General Medical',
  'Outpatient'
];

// Configurable Department Routing Rules by ESI Acuity
const DEPARTMENT_ROUTING = {
  [ACUITY_LEVELS.IMMEDIATE]: 'Emergency',
  [ACUITY_LEVELS.EMERGENT]: 'Emergency / Critical Care',
  [ACUITY_LEVELS.URGENT]: 'General Medical',
  [ACUITY_LEVELS.LESS_URGENT]: 'General Medical',
  [ACUITY_LEVELS.NON_URGENT]: 'Outpatient'
};

// Maximum Acceptable Waiting Time Thresholds (in minutes)
const WAITING_TIME_THRESHOLDS_MINUTES = {
  [ACUITY_LEVELS.IMMEDIATE]: 0,    // Immediate resuscitation (0 min)
  [ACUITY_LEVELS.EMERGENT]: 10,   // Emergent (10 mins)
  [ACUITY_LEVELS.URGENT]: 30,     // Urgent (30 mins)
  [ACUITY_LEVELS.LESS_URGENT]: 60, // Less Urgent (60 mins)
  [ACUITY_LEVELS.NON_URGENT]: 120  // Non-urgent (120 mins)
};

/**
 * Normalizes any acuity input (strings, legacy names, levels) to standard 5-level ESI.
 * @param {string|number} acuity 
 * @returns {string} Normalized ESI acuity level
 */
function normalizeAcuity(acuity) {
  if (acuity === undefined || acuity === null || acuity === '') return ACUITY_LEVELS.URGENT;
  const str = String(acuity).trim().toLowerCase();

  // ESI Level 1
  if (str === 'immediate' || str === 'resuscitation' || str === 'critical' || str === 'level 1' || str === '1' || str === 'red') {
    return ACUITY_LEVELS.IMMEDIATE;
  }
  // ESI Level 2
  if (str === 'emergent' || str === 'high' || str === 'level 2' || str === '2' || str === 'orange' || str === 'amber') {
    return ACUITY_LEVELS.EMERGENT;
  }
  // ESI Level 3
  if (str === 'urgent' || str === 'moderate' || str === 'medium' || str === 'level 3' || str === '3' || str === 'yellow') {
    return ACUITY_LEVELS.URGENT;
  }
  // ESI Level 4
  if (str === 'less urgent' || str === 'lessurgent' || str === 'level 4' || str === '4' || str === 'green') {
    return ACUITY_LEVELS.LESS_URGENT;
  }
  // ESI Level 5
  if (str === 'non-urgent' || str === 'nonurgent' || str === 'low' || str === 'level 5' || str === '5' || str === 'blue') {
    return ACUITY_LEVELS.NON_URGENT;
  }

  return ACUITY_LEVELS.URGENT;
}

/**
 * Maps an acuity level (normalized string, integer 1-5, or alias) to its standard triage colour.
 * @param {string|number} acuity 
 * @returns {string} Standardized color ('Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue')
 */
function getAcuityColor(acuity) {
  if (acuity === undefined || acuity === null || acuity === '') return 'Yellow';
  const norm = normalizeAcuity(acuity);
  return ACUITY_COLORS[norm] || 'Yellow';
}

/**
 * Maps predicted acuity to the appropriate hospital department.
 * @param {string} acuity 
 * @returns {string} Department name
 */
function getDepartmentForAcuity(acuity) {
  const norm = normalizeAcuity(acuity);
  return DEPARTMENT_ROUTING[norm] || 'General Medical';
}

/**
 * Returns numeric priority level for sorting (1 is highest priority).
 * @param {string} acuity 
 * @returns {number}
 */
function getAcuityPriority(acuity) {
  const norm = normalizeAcuity(acuity);
  return ACUITY_PRIORITY[norm] || 99;
}

/**
 * Returns maximum acceptable waiting time in minutes for acuity level.
 * @param {string} acuity 
 * @returns {number}
 */
function getWaitingThresholdMinutes(acuity) {
  const norm = normalizeAcuity(acuity);
  return WAITING_TIME_THRESHOLDS_MINUTES[norm] ?? 60;
}

const VALID_ACUITY_TOKENS = new Set([
  '1', '2', '3', '4', '5',
  'level 1', 'level 2', 'level 3', 'level 4', 'level 5',
  'immediate', 'resuscitation', 'critical', 'red',
  'emergent', 'high', 'orange', 'amber',
  'urgent', 'moderate', 'medium', 'yellow',
  'less urgent', 'lessurgent', 'green',
  'non-urgent', 'nonurgent', 'low', 'blue'
]);

/**
 * Validates if acuity string is recognized.
 * @param {string|number} acuity 
 * @returns {boolean}
 */
function isValidAcuity(acuity) {
  if (acuity === null || acuity === undefined || acuity === '') return false;
  const str = String(acuity).trim().toLowerCase();
  return VALID_ACUITY_TOKENS.has(str);
}

module.exports = {
  ACUITY_LEVELS,
  ACUITY_PRIORITY,
  ACUITY_COLORS,
  VALID_DEPARTMENTS,
  DEPARTMENT_ROUTING,
  WAITING_TIME_THRESHOLDS_MINUTES,
  getDepartmentForAcuity,
  getAcuityPriority,
  getWaitingThresholdMinutes,
  getAcuityColor,
  normalizeAcuity,
  isValidAcuity
};
