// BIR-Compliant Business Settings
// These settings are stored in localStorage and used for all receipts and reports

const BIR_SETTINGS_KEY = "bir_settings";

export const DEFAULT_BIR_SETTINGS = {
  // Business/Header Data
  businessName: "WTF! Samgyup",
  businessAddress: "123 Restaurant Street, City, Philippines",
  tin: "XXX-XXX-XXX-XXX",
  vatRegistered: true, // true = VAT, false = Non-VAT
  
  // PTU (Permit to Use)
  ptuNumber: "",
  ptuDateIssued: "",
  
  // Accredited Supplier Info
  supplierName: "",
  supplierAddress: "",
  supplierTin: "",
  accreditationNumber: "",
  accreditationDateIssued: "",
  accreditationValidUntil: "",
  
  // Serial Number Range
  serialNumberStart: "0001",
  serialNumberEnd: "9999",
  
  // Terminal Info
  terminalId: "T001",
  machineSerialNumber: "",
  
  // Footer Text
  footerText: "THIS INVOICE/RECEIPT SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF THE PERMIT TO USE.",
};

// Get BIR settings from localStorage
export function getBIRSettings() {
  try {
    const stored = localStorage.getItem(BIR_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_BIR_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Error loading BIR settings:", e);
  }
  return DEFAULT_BIR_SETTINGS;
}

// Save BIR settings to localStorage
export function saveBIRSettings(settings) {
  try {
    localStorage.setItem(BIR_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error("Error saving BIR settings:", e);
    return false;
  }
}

// Generate sequential invoice number
export function generateInvoiceNumber(receiptCounter, settings = null) {
  const s = settings || getBIRSettings();
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const seqPart = String(receiptCounter).padStart(4, "0");
  return `SI-${datePart}-${seqPart}`;
}

// Format TIN with dashes
export function formatTIN(tin) {
  if (!tin) return "";
  const cleaned = tin.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9, 12)}`;
  }
  return tin;
}

// Compute VAT breakdown
export function computeVATBreakdown(grossAmount, isVATExempt = false, discountRate = 0) {
  const discountedGross = grossAmount * (1 - discountRate);
  
  if (isVATExempt) {
    return {
      grossAmount,
      discountAmount: grossAmount * discountRate,
      vatableSales: 0,
      vatAmount: 0,
      vatExemptSales: discountedGross,
      zeroRatedSales: 0,
      netAmount: discountedGross,
    };
  }
  
  const vatableSales = discountedGross / 1.12;
  const vatAmount = discountedGross - vatableSales;
  
  return {
    grossAmount,
    discountAmount: grossAmount * discountRate,
    vatableSales,
    vatAmount,
    vatExemptSales: 0,
    zeroRatedSales: 0,
    netAmount: discountedGross,
  };
}

// Z-Reading counter management
const Z_COUNTER_KEY = "z_counter";
const GRAND_TOTAL_KEY = "grand_accumulated_total";
const DAILY_COUNTERS_KEY = "daily_counters";

export function getZCounter() {
  try {
    return parseInt(localStorage.getItem(Z_COUNTER_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function incrementZCounter() {
  const next = getZCounter() + 1;
  localStorage.setItem(Z_COUNTER_KEY, String(next));
  return next;
}

export function getGrandAccumulatedTotal() {
  try {
    return parseFloat(localStorage.getItem(GRAND_TOTAL_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function updateGrandAccumulatedTotal(amount) {
  const current = getGrandAccumulatedTotal();
  const newTotal = current + amount;
  localStorage.setItem(GRAND_TOTAL_KEY, String(newTotal));
  return newTotal;
}

// Daily counters (reset on Z-reading)
export function getDailyCounters() {
  try {
    const stored = localStorage.getItem(DAILY_COUNTERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading daily counters:", e);
  }
  return {
    date: new Date().toDateString(),
    beginningOR: 1,
    endingOR: 0,
    grossSales: 0,
    totalDiscounts: 0,
    vatableSales: 0,
    vatAmount: 0,
    vatExemptSales: 0,
    netSales: 0,
    transactionCount: 0,
    voidCount: 0,
    voidAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    cashInDrawer: 0,
  };
}

export function updateDailyCounters(updates) {
  const current = getDailyCounters();
  const updated = { ...current, ...updates };
  localStorage.setItem(DAILY_COUNTERS_KEY, JSON.stringify(updated));
  return updated;
}

export function resetDailyCounters(startingOR) {
  const newCounters = {
    date: new Date().toDateString(),
    beginningOR: startingOR,
    endingOR: startingOR - 1,
    grossSales: 0,
    totalDiscounts: 0,
    vatableSales: 0,
    vatAmount: 0,
    vatExemptSales: 0,
    netSales: 0,
    transactionCount: 0,
    voidCount: 0,
    voidAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    cashInDrawer: 0,
  };
  localStorage.setItem(DAILY_COUNTERS_KEY, JSON.stringify(newCounters));
  return newCounters;
}

// Audit trail logging
const AUDIT_LOG_KEY = "audit_log";

export function addAuditLog(entry) {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    const log = stored ? JSON.parse(stored) : [];
    log.push({
      ...entry,
      timestamp: new Date().toISOString(),
      systemDate: new Date().toLocaleDateString("en-PH"),
      systemTime: new Date().toLocaleTimeString("en-PH"),
    });
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log));
    return true;
  } catch (e) {
    console.error("Error adding audit log:", e);
    return false;
  }
}

export function getAuditLog(limit = 100) {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    if (stored) {
      const log = JSON.parse(stored);
      return log.slice(-limit);
    }
  } catch (e) {
    console.error("Error loading audit log:", e);
  }
  return [];
}

// eSales export data generation
export function generateESalesData(year, month, txns) {
  const settings = getBIRSettings();
  
  // Filter transactions by month/year
  const filteredTxns = txns.filter(t => {
    const d = new Date(t.closedAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  
  // Group by day
  const byDay = {};
  filteredTxns.forEach(t => {
    const d = new Date(t.closedAt);
    const day = d.getDate();
    if (!byDay[day]) {
      byDay[day] = {
        grossSales: 0,
        discounts: 0,
        vatableSales: 0,
        vatAmount: 0,
        vatExemptSales: 0,
        netSales: 0,
        transactionCount: 0,
      };
    }
    byDay[day].grossSales += t.grossAmount || t.finalBill;
    byDay[day].discounts += t.discountAmount || 0;
    byDay[day].vatableSales += t.vatableSales || 0;
    byDay[day].vatAmount += t.vatAmount || 0;
    byDay[day].vatExemptSales += t.vatExemptSales || 0;
    byDay[day].netSales += t.finalBill;
    byDay[day].transactionCount++;
  });
  
  return {
    tin: settings.tin,
    month,
    year,
    terminalId: settings.terminalId,
    machineSerialNumber: settings.machineSerialNumber,
    dailyBreakdown: byDay,
    totals: {
      grossSales: Object.values(byDay).reduce((s, d) => s + d.grossSales, 0),
      discounts: Object.values(byDay).reduce((s, d) => s + d.discounts, 0),
      vatableSales: Object.values(byDay).reduce((s, d) => s + d.vatableSales, 0),
      vatAmount: Object.values(byDay).reduce((s, d) => s + d.vatAmount, 0),
      vatExemptSales: Object.values(byDay).reduce((s, d) => s + d.vatExemptSales, 0),
      netSales: Object.values(byDay).reduce((s, d) => s + d.netSales, 0),
    },
  };
}
