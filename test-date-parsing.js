// Test script to verify date parsing fix
const parseDate = (dateString) => {
  if (!dateString) return null;

  // If it's already a valid Date object, return it
  if (dateString instanceof Date) return dateString;

  // For ISO date strings like "2025-09-17", create a date at UTC midnight
  // This ensures consistent date storage regardless of server timezone
  if (
    typeof dateString === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    // Use the ISO format with explicit UTC timezone to avoid timezone issues
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  // For other formats, try parsing normally
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return parsed;
};

// Test cases
console.log("Testing date parsing:");
console.log('Input: "2025-09-17"');
const testDate1 = parseDate("2025-09-17");
console.log("Parsed:", testDate1);
console.log("ISO String:", testDate1.toISOString());
console.log("Local Date String:", testDate1.toDateString());
console.log("");

console.log('Input: "2025-10-06"');
const testDate2 = parseDate("2025-10-06");
console.log("Parsed:", testDate2);
console.log("ISO String:", testDate2.toISOString());
console.log("Local Date String:", testDate2.toDateString());
console.log("");

console.log("Testing old method:");
console.log('new Date("2025-09-17"):', new Date("2025-09-17"));
console.log(
  'new Date("2025-09-17").toISOString():',
  new Date("2025-09-17").toISOString()
);
