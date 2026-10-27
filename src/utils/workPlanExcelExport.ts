import ExcelJS from 'exceljs';
import { AnnualWorkPlan } from '../types.js';

export interface WorkPlanExportOptions {
  departmentName?: string;
  year?: number;
  filenamePrefix?: string;
}

/**
 * Exports Annual Work Plans to a beautifully formatted Excel workbook using ExcelJS.
 * Structure:
 * Level 1 Grouped Headers: OUTCOME | ALIGNMENT | OUTPUT | KEY ACTIVITIES | INPUT
 * Level 2 Column Headers (15 Columns):
 *   1. Outcome
 *   2. Alignment
 *   3. Output
 *   4. KPI
 *   5. Reporting Frequency
 *   6. Annual Performance Indicators
 *   7. Type of Activities
 *   8. Means of Verification
 *   9. Baseline
 *   10. Target
 *   11. Annual Target
 *   12. Total Budget (NGN)
 *   13. Funding Source
 *   14. Responsible Officer
 *   15. Division
 */
export async function exportWorkPlansToExcel(
  workPlans: AnnualWorkPlan[],
  options: WorkPlanExportOptions = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'National Bureau of Statistics (NBS)';
  workbook.lastModifiedBy = 'NBS Statutory Planning System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Annual Work Plan Matrix', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '4:5',
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2
      }
    },
    views: [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }]
  });

  // Reusable Borders
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF004D2A' } },
    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
  };

  // Row 1: Title Banner - Top Institutional Header
  worksheet.mergeCells('A1:O1');
  const titleRow1 = worksheet.getCell('A1');
  titleRow1.value = 'FEDERAL REPUBLIC OF NIGERIA — NATIONAL BUREAU OF STATISTICS (NBS)';
  titleRow1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF004D2A' } };
  titleRow1.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };
  worksheet.getRow(1).height = 26;

  // Row 2: Subtitle Banner
  worksheet.mergeCells('A2:O2');
  const titleRow2 = worksheet.getCell('A2');
  const yearText = options.year || (workPlans[0]?.work_plan_year ?? new Date().getFullYear());
  const deptText = options.departmentName || 'Institutional Compilation (All Departments)';
  titleRow2.value = `STATUTORY ANNUAL WORK PLAN MATRIX — FISCAL YEAR ${yearText}`;
  titleRow2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF006B3F' } };
  titleRow2.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF4FBF6' }
  };
  worksheet.getRow(2).height = 20;

  // Row 3: Metadata Details
  worksheet.mergeCells('A3:O3');
  const titleRow3 = worksheet.getCell('A3');
  titleRow3.value = `Department: ${deptText}  |  Total Approved Projects: ${workPlans.length}  |  Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  titleRow3.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF4B5563' } };
  titleRow3.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 18;

  // --------------------------------------------------------------------------
  // TWO-LEVEL HEADER STRUCTURE
  // --------------------------------------------------------------------------
  // Row 4: LEVEL 1 GROUPED HEADERS
  // 1. OUTCOME (Col A)
  // 2. ALIGNMENT (Col B)
  // 3. OUTPUT (Col C)
  // 4. KEY ACTIVITIES (Cols D to K merged: KPI to Annual Target)
  // 5. INPUT (Cols L to O merged: Budget to Division)
  const row4 = worksheet.getRow(4);
  row4.height = 24;

  worksheet.getCell('A4').value = 'OUTCOME';
  worksheet.getCell('B4').value = 'ALIGNMENT';
  worksheet.getCell('C4').value = 'OUTPUT';

  worksheet.mergeCells('D4:K4');
  worksheet.getCell('D4').value = 'KEY ACTIVITIES';

  worksheet.mergeCells('L4:O4');
  worksheet.getCell('L4').value = 'INPUT';

  // Apply styling to Row 4 (Deep Federal Green)
  for (let c = 1; c <= 15; c++) {
    const cell = worksheet.getRow(4).getCell(c);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006B3F' } // NBS Federal Green
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;
  }

  // Row 5: LEVEL 2 DETAILED FIELD HEADERS
  // Order:
  // 1: Outcome
  // 2: Alignment
  // 3: Output
  // 4: KPI
  // 5: Reporting Frequency
  // 6: Annual Performance Indicators
  // 7: Type of Activities
  // 8: Means of Verification
  // 9: Baseline
  // 10: Target
  // 11: Annual Target
  // 12: Total Budget (NGN)
  // 13: Funding Source
  // 14: Responsible Officer
  // 15: Division
  const level2Headers = [
    'Outcome',
    'Alignment',
    'Output',
    'KPI',
    'Reporting Frequency',
    'Annual Performance Indicators',
    'Type of Activities',
    'Means of Verification',
    'Baseline',
    'Target',
    'Annual Target',
    'Total Budget (NGN)',
    'Funding Source',
    'Responsible Officer',
    'Division'
  ];

  const row5 = worksheet.getRow(5);
  row5.height = 28;

  level2Headers.forEach((header, index) => {
    const cell = row5.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF165B33' } // Rich dark green accent
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF004D2A' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF004D2A' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  // Enable AutoFilter on Level 2 header row (columns 1 to 15)
  worksheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: 15 }
  };

  // --------------------------------------------------------------------------
  // DATA ROWS
  // --------------------------------------------------------------------------
  let currentRowIndex = 6;

  workPlans.forEach((wp, wpIdx) => {
    const row = worksheet.getRow(currentRowIndex);
    row.height = 36; // Generous height for wrapped text

    const isEven = wpIdx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF9FBF9';

    // Map fields safely
    const outcomeVal = wp.outcome || wp.objective || '';
    const alignmentVal = wp.alignment || 'National Development Plan';
    const outputVal = wp.output || wp.project_name || '';
    const kpiVal = wp.kpi || wp.annual_performance_indicator || '';
    const reportingFreqVal = wp.reporting_frequency || 'Quarterly';
    const annualIndicatorVal = wp.annual_performance_indicators || wp.annual_performance_indicator || '';
    const typeOfActivitiesVal = wp.type_of_activities || 'Survey';
    const meansOfVerificationVal = wp.means_of_verification || 'Published Statistical Report';
    const baselineVal = wp.baseline || '—';
    const targetVal = wp.target || '';
    const annualTargetVal = wp.annual_target || wp.target || '';
    const budgetVal = Number(wp.total_budget) || 0;
    const fundingSourceVal = wp.funding_source || 'Appropriation';
    const responsibleOfficerVal = wp.responsible_officer || wp.staff_responsible || 'Unassigned';
    const divisionVal = wp.division || '—';

    // Set Cell Values strictly in order:
    // 1. Outcome
    row.getCell(1).value = outcomeVal;
    // 2. Alignment
    row.getCell(2).value = alignmentVal;
    // 3. Output
    row.getCell(3).value = outputVal;
    // 4. KPI
    row.getCell(4).value = kpiVal;
    // 5. Reporting Frequency
    row.getCell(5).value = reportingFreqVal;
    // 6. Annual Performance Indicators
    row.getCell(6).value = annualIndicatorVal;
    // 7. Type of Activities
    row.getCell(7).value = typeOfActivitiesVal;
    // 8. Means of Verification
    row.getCell(8).value = meansOfVerificationVal;
    // 9. Baseline
    row.getCell(9).value = baselineVal;
    // 10. Target
    row.getCell(10).value = targetVal;
    // 11. Annual Target
    row.getCell(11).value = annualTargetVal;
    // 12. Total Budget
    const budgetCell = row.getCell(12);
    budgetCell.value = budgetVal;
    budgetCell.numFmt = '#,##0.00';
    // 13. Funding Source
    row.getCell(13).value = fundingSourceVal;
    // 14. Responsible Officer
    row.getCell(14).value = responsibleOfficerVal;
    // 15. Division
    row.getCell(15).value = divisionVal;

    // Apply formatting to every data cell in this row
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1F2937' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.border = thinBorder;

      // Alignments:
      if (c === 12) {
        // Total Budget: Right aligned, bold
        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF111827' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (c === 2 || c === 5 || c === 7 || c === 9 || c === 13) {
        // Alignment, Reporting Frequency, Type, Baseline, Funding Source: Centered
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        // Others: Left aligned, wrapped text
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    }

    currentRowIndex++;
  });

  // --------------------------------------------------------------------------
  // TOTAL SUMMARY ROW AT THE BOTTOM
  // --------------------------------------------------------------------------
  const summaryRowIndex = currentRowIndex;
  worksheet.mergeCells(`A${summaryRowIndex}:K${summaryRowIndex}`);
  const summaryLabelCell = worksheet.getCell(`A${summaryRowIndex}`);
  summaryLabelCell.value = 'TOTAL INSTITUTIONAL BUDGET ALLOCATION (NGN):';
  summaryLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF004D2A' } };
  summaryLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
  summaryLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };

  const summaryBudgetCell = worksheet.getCell(`L${summaryRowIndex}`);
  if (workPlans.length > 0) {
    summaryBudgetCell.value = {
      formula: `SUM(L6:L${summaryRowIndex - 1})`,
      result: workPlans.reduce((acc, wp) => acc + (Number(wp.total_budget) || 0), 0)
    };
  } else {
    summaryBudgetCell.value = 0;
  }
  summaryBudgetCell.numFmt = '#,##0.00';
  summaryBudgetCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF004D2A' } };
  summaryBudgetCell.alignment = { horizontal: 'right', vertical: 'middle' };
  summaryBudgetCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };

  // Trailing empty cells for Funding Source, Responsible Officer, and Division (M to O)
  worksheet.mergeCells(`M${summaryRowIndex}:O${summaryRowIndex}`);
  const trailingCell = worksheet.getCell(`M${summaryRowIndex}`);
  trailingCell.value = '';
  trailingCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };

  // Border for summary row
  const summaryBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF006B3F' } },
    bottom: { style: 'double', color: { argb: 'FF006B3F' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  };
  for (let c = 1; c <= 15; c++) {
    worksheet.getRow(summaryRowIndex).getCell(c).border = summaryBorder;
  }
  worksheet.getRow(summaryRowIndex).height = 24;

  // --------------------------------------------------------------------------
  // COLUMN WIDTHS SIZED CAREFULLY FOR WRAPPING & PROPORTIONAL DISPLAY
  // --------------------------------------------------------------------------
  const columnWidths = [
    32, // 1: Outcome
    26, // 2: Alignment
    28, // 3: Output
    30, // 4: KPI
    18, // 5: Reporting Frequency
    28, // 6: Annual Performance Indicators
    20, // 7: Type of Activities
    26, // 8: Means of Verification
    16, // 9: Baseline
    22, // 10: Target
    22, // 11: Annual Target
    22, // 12: Total Budget
    18, // 13: Funding Source
    24, // 14: Responsible Officer
    22  // 15: Division
  ];

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  // --------------------------------------------------------------------------
  // WRITE BUFFER AND INITIATE BROWSER DOWNLOAD
  // --------------------------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeDept = (deptText || 'NBS').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${options.filenamePrefix || 'NBS_Work_Plan'}_${yearText}_${safeDept}.xlsx`;

  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(downloadUrl);
  }, 100);
}
