/**
 * Spreadsheet formula-injection protection for CSV cells.
 *
 * Cells that begin with = + - @ TAB or CR can be interpreted as formulas
 * when opened in Excel/LibreOffice. We neutralize them by prefixing a
 * single quote. The quote is visible in the cell text but prevents formula
 * execution. Empty values are left unchanged.
 *
 * Documented behavior — do not remove without an explicit alternative policy.
 */

const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

export function neutralizeCsvFormula(value: string): string {
  if (!value) {
    return value;
  }
  if (DANGEROUS_PREFIX.test(value)) {
    return `'${value}`;
  }
  return value;
}
