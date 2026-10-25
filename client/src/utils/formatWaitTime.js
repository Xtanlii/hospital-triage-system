/**
 * Formats a duration in minutes into a concise, human-readable string.
 * Examples:
 *   0   -> "0 mins"
 *   1   -> "1 min"
 *   14  -> "14 mins"
 *   49  -> "49 mins"
 *   59  -> "59 mins"
 *   60  -> "1hr"
 *   61  -> "1hr 1 min"
 *   70  -> "1hr 10 mins"
 *   80  -> "1hr 20 mins"
 *   135 -> "2hrs 15 mins"
 *
 * @param {number|string} minutes
 * @returns {string}
 */
export function formatWaitTime(minutes) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  if (mins < 60) {
    return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  }
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  const hrPart = `${hrs}${hrs === 1 ? 'hr' : 'hrs'}`;
  if (rem === 0) {
    return hrPart;
  }
  return `${hrPart} ${rem} ${rem === 1 ? 'min' : 'mins'}`;
}
