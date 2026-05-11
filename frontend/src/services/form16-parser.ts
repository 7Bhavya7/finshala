// ═══════════════════════════════════════════════
// FORM 16 PDF PARSER — Browser-Compatible
// Uses pdfjs-dist (works in Vite/browser)
// ═══════════════════════════════════════════════

import type { ParsedForm16 } from './tax-wizard-engine';

// ═══════════════════════════════════════════════
// PARSER CLASS
// ═══════════════════════════════════════════════

export class Form16Parser {
  /**
   * Parse a Form 16 PDF from an ArrayBuffer (e.g. from file input).
   * Now proxying to Python backend for extraction.
   */
  async parse(arrayBuffer: ArrayBuffer, password?: string): Promise<ParsedForm16> {
    const formData = new FormData();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'form16.pdf');
    if (password) {
      formData.append('password', password);
    }

    const response = await fetch('/api/parse-form16', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'password_required' || data.error === 'password_incorrect') {
        throw new Error(data.message || 'Password error');
      }
      throw new Error(data.error || 'Failed to parse PDF');
    }

    return data as ParsedForm16;
  }

  // ── LLM Fallback — called when confidence < 60% ──

  async enhanceWithAI(result: ParsedForm16): Promise<ParsedForm16 & { ai_assisted: boolean }> {
    if (result.parse_confidence >= 60) {
      return { ...result, ai_assisted: false };
    }

    try {
      // Dynamically import to avoid circular deps
      const { finshalaAI } = await import('./llm-service');

      const prompt = `Parse this Form 16 text and extract financial data as JSON:
\`\`\`
${result.raw_text_preview || ''}
\`\`\`

Return ONLY a JSON object with these fields (numbers only, no commas):
{
  "gross_salary": 0,
  "basic_salary": 0,
  "hra_received": 0,
  "standard_deduction": 50000,
  "professional_tax": 0,
  "sec_80c": 0,
  "sec_80d": 0,
  "sec_80ccd_1b": 0,
  "total_taxable_income": 0,
  "tax_on_income": 0,
  "cess": 0,
  "tds_deducted": 0,
  "employee_pan": "",
  "employer_tan": "",
  "employee_name": "",
  "employer_name": "",
  "regime": "old"
}`;

      const aiResp = await finshalaAI.parseForm16WithAI(prompt);

      // Try to parse AI JSON response
      const jsonMatch = aiResp.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);

        // Merge: AI fills gaps where regex returned 0
        if (!result.salary.gross_salary && aiData.gross_salary) result.salary.gross_salary = aiData.gross_salary;
        if (!result.salary.basic_salary && aiData.basic_salary) result.salary.basic_salary = aiData.basic_salary;
        if (!result.salary.hra_received && aiData.hra_received) result.salary.hra_received = aiData.hra_received;
        if (!result.exemptions.standard_deduction && aiData.standard_deduction) result.exemptions.standard_deduction = aiData.standard_deduction;
        if (!result.exemptions.professional_tax && aiData.professional_tax) result.exemptions.professional_tax = aiData.professional_tax;
        if (!result.deductions.sec_80c && aiData.sec_80c) result.deductions.sec_80c = aiData.sec_80c;
        if (!result.deductions.sec_80d && aiData.sec_80d) result.deductions.sec_80d = aiData.sec_80d;
        if (!result.deductions.sec_80ccd_1b && aiData.sec_80ccd_1b) result.deductions.sec_80ccd_1b = aiData.sec_80ccd_1b;
        if (!result.tax_computation.total_taxable_income && aiData.total_taxable_income) result.tax_computation.total_taxable_income = aiData.total_taxable_income;
        if (!result.tax_computation.tax_on_income && aiData.tax_on_income) result.tax_computation.tax_on_income = aiData.tax_on_income;
        if (!result.tax_computation.cess && aiData.cess) result.tax_computation.cess = aiData.cess;
        if (!result.tax_computation.tds_deducted && aiData.tds_deducted) result.tax_computation.tds_deducted = aiData.tds_deducted;
        if (!result.employee_pan && aiData.employee_pan) result.employee_pan = aiData.employee_pan;
        if (!result.employer_tan && aiData.employer_tan) result.employer_tan = aiData.employer_tan;
        if (!result.employee_name && aiData.employee_name) result.employee_name = aiData.employee_name;
        if (!result.employer_name && aiData.employer_name) result.employer_name = aiData.employer_name;
        if (aiData.regime) result.tax_computation.regime_used = aiData.regime;

        // Recalculate totals
        result.salary.total_gross = result.salary.gross_salary + result.salary.perquisites + result.salary.profits_in_lieu;
        result.exemptions.total_exemptions = result.exemptions.hra_exemption + result.exemptions.lta_exemption + result.exemptions.standard_deduction + result.exemptions.professional_tax;
        result.deductions.total_deductions = result.deductions.sec_80c + result.deductions.sec_80d + result.deductions.sec_80ccd_1b + result.deductions.sec_80ccd_2 + result.deductions.sec_80e + result.deductions.sec_80g + result.deductions.sec_80tta + result.deductions.sec_24b;
        result.tax_computation.total_tax = result.tax_computation.tax_on_income + result.tax_computation.surcharge + result.tax_computation.cess;
        result.total_tds_deposited = result.tax_computation.tds_deducted;

        // Boost confidence since AI filled gaps
        result.parse_confidence = Math.min(result.parse_confidence + 30, 95);
      }

      return { ...result, ai_assisted: true };
    } catch {
      // AI failed, return regex-only result
      return { ...result, ai_assisted: false };
    }
  }
}
