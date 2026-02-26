/**
 * Parse structured fields from an event's description + location text.
 *
 * UMN parking events typically look like:
 *   Description:
 *     Event Rate: $10
 *     Locations: University Ave. Ramp
 *     Event: Gopher Football
 *   Location: University Ave Ramp, Minneapolis, MN 55455
 */

export interface ParsedEventDetails {
  rampNames: string[]
  eventRate: string | null
  eventName: string | null
}

export function parseEventDetails(
  description: string,
  location: string,
  summary: string,
): ParsedEventDetails {
  // --- Event Rate ---
  // Matches: "Event Rate: $10", "Event Rate:$10.00", "Rate: $5/vehicle"
  const rateMatch =
    description.match(/event\s+rate\s*:\s*(\$[\d.,]+(?:\s*\/\s*\w+)?)/i) ??
    description.match(/\brate\s*:\s*(\$[\d.,]+(?:\s*\/\s*\w+)?)/i)
  const eventRate = rateMatch ? rateMatch[1].trim() : null

  // --- Ramp / Location names (may be comma-separated list) ---
  const descLocMatch = description.match(/locations?\s*:\s*([^\n\r\\]+)/i)
  let rampNames: string[]

  if (descLocMatch) {
    // "University Ave. Ramp, 4th Street Ramp" → two entries
    rampNames = descLocMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } else if (location) {
    // Pull out "X Ramp" / "X Garage" / "X Lot" from the location field
    const rampMatch = location.match(
      /^([^,]+?(?:ramp|garage|lot|structure|deck)[^,]*)/i,
    )
    rampNames = [rampMatch ? rampMatch[1].trim() : location.split(',')[0].trim()]
  } else {
    rampNames = [summary]
  }

  // --- Event Name ---
  // Matches: "Event: Gopher Football", "For Event: Concert at Northrop"
  const eventMatch = description.match(/(?:for\s+)?event\s*:\s*([^\n\r\\]+)/i)
  const eventName = eventMatch ? eventMatch[1].trim() : null

  return { rampNames, eventRate, eventName }
}
