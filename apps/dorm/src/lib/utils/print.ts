import type { Lease } from '$lib/types/lease';
import { formatDate, formatCurrency } from './format';

export function printLeaseInvoice(lease: Lease): void {
  // This function remains unchanged.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const html = generateLeasePrintHTML(lease);

  iframe.contentDocument?.open();
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();

  iframe.onload = () => {
    iframe?.contentWindow?.focus();
    setTimeout(() => {
      if (iframe) {
        iframe.contentWindow?.print();
        // Clean up iframe after print
        setTimeout(() => {
          iframe.remove();
        }, 1000);
      }
    }, 100);
  };
}

function sortBillingsByDate(billings: any[]): any[] {
  // This function remains unchanged.
  if (!billings) return [];
  return [...billings].sort((a, b) => new Date(a.billing_date).getTime() - new Date(b.billing_date).getTime());
}

function getCustomDisplayStatus(billing: any): string {
  // This function remains unchanged.
  if ((billing.amount + (billing.penalty_amount || 0) - billing.paid_amount) <= 0) {
    return 'PAID';
  }
  if (billing.penalty_amount > 0) {
    return 'PENALIZED';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = new Date(billing.due_date) < today;

  if (isOverdue) {
    if (billing.status === 'PARTIAL' || billing.paid_amount > 0) {
      return 'OVERDUE-PARTIAL';
    }
    return 'OVERDUE';
  }

  return billing.status; // PENDING or PARTIAL
}

// --- UPDATED FUNCTION ---
function generateLeasePrintHTML(lease: Lease): string {
  const currentDate = new Date();
  const sortedBillings = sortBillingsByDate(lease.billings || []);

  // Overall totals for the summary section
  const totalAmount = sortedBillings.reduce((sum, b) => sum + b.amount, 0);
  const totalPenalties = sortedBillings.reduce((sum, b) => sum + (b.penalty_amount || 0), 0);
  const totalPaid = sortedBillings.reduce((sum, b) => sum + b.paid_amount, 0);

  return `
<html>
<head>
  <title>Invoice - ${lease.name}</title>
  <style>
    /* All CSS styles remain the same as your original code */
    @page { margin: 0.5cm; size: portrait; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #333; margin: 0; padding: 10px; line-height: 1.3; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #000; }
    .invoice-title { font-size: 24px; font-weight: bold; margin: 0; }
    .invoice-info { text-align: right; font-size: 9px; }
    .company-info { margin-bottom: 15px; }
    .lease-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .lease-info, .account-info { flex: 1; }
    .lease-info h3, .account-info h3 { margin: 0 0 8px 0; font-size: 12px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
    .lease-info p, .account-info p { margin: 2px 0; font-size: 9px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f5f5f5; border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 8px; font-weight: bold; vertical-align: middle; }
    .items-table td { border: 1px solid #ddd; padding: 4px 6px; font-size: 8px; vertical-align: top; }
    .items-table .amount { text-align: right; }
    .items-table .center { text-align: center; }
    .items-table .balance-positive { color: #dc3545; font-weight: bold; }
    .payment-details { text-align: left; line-height: 1.4; }
    .status-paid { color: #28a745; font-weight: bold; }
    .status-pending { color: #ffc107; font-weight: bold; }
    .status-overdue { color: #dc3545; font-weight: bold; }
    .status-penalized { color: #dc3545; font-weight: bold; }
    .status-overdue-partial { color: #dc3545; font-weight: bold; }
    .totals-section { margin-top: 20px; }
    .totals-table { width: 100%; border-collapse: collapse; }
    .totals-table td { padding: 4px 8px; font-size: 9px; border: none; }
    .totals-table .label { text-align: right; font-weight: bold; }
    .totals-table .amount { text-align: right; }
    .totals-table .total-row { border-top: 2px solid #000; font-weight: bold; font-size: 10px; }
    .footer { margin-top: 30px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
  </style>
</head>
<body>


     <div class="lease-details">
     <div class="lease-info">
       <h3>Lease Information</h3>
       <p><strong>Lease:</strong> ${lease.name || `#${lease.id}`}</p>
       <p><strong>Unit:</strong> Unit • Floor ${lease.rental_unit?.floor?.floor_number || 'N/A'} • Bedspacer</p>
       <p><strong>Property:</strong> ${lease.rental_unit?.property?.name || 'N/A'}</p>
       <p><strong>Lease Period:</strong> ${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}</p>
     </div>
     <div class="account-info">
       <h3>Account Summary</h3>
       <p><strong>Monthly Rent:</strong> ${formatCurrency(lease.rent_amount)}</p>
       <p><strong>Security Deposit:</strong> ${formatCurrency(lease.security_deposit)}</p>
       <p><strong>Current Balance:</strong> ${formatCurrency(lease.balance)}</p>
       <p><strong>Status:</strong> ${lease.status}</p>
     </div>
   </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 7%;">Date</th>
        <th>Description</th>
        <th style="width: 7%;">Due Date</th>
        <th style="width: 8%;">Status</th>
        <th style="width: 9%;">Bill Amount</th>
        <th style="width: 9%;">Penalty</th>
        <th style="width: 9%;">Total Due</th>
        <th style="width: 9%;">Payments Made</th>
        <th style="width: 14%;">Payment Details</th>
        <th style="width: 9%;">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${sortedBillings.length > 0 ? sortedBillings.map(billing => {
        const displayStatus = getCustomDisplayStatus(billing);
        const billAmount = billing.amount;
        const penaltyAmount = billing.penalty_amount || 0;
        const totalDue = billAmount + penaltyAmount;
        const paymentsMade = billing.paid_amount || 0;
        const itemBalance = totalDue - paymentsMade;

        const paymentDetailsHtml = billing.allocations && billing.allocations.length > 0
          ? billing.allocations.map((alloc: any) =>
              `<div>${formatDate(alloc.payment.paid_at)}: ${alloc.payment.method} (${formatCurrency(alloc.amount)})</div>`
            ).join('')
          : '-';

        return `
          <tr>
            <td class="center">${formatDate(billing.billing_date)}</td>
            <td>${billing.type}${billing.utility_type ? ` - ${billing.utility_type}` : ''}${billing.notes ? ` (${billing.notes})` : ''}</td>
            <td class="center">${formatDate(billing.due_date)}</td>
            <td class="center status-${displayStatus.toLowerCase().replace('_', '-')}">${displayStatus}</td>
            <td class="amount">${formatCurrency(billAmount)}</td>
            <td class="amount">${penaltyAmount > 0 ? formatCurrency(penaltyAmount) : '-'}</td>
            <td class="amount"><strong>${formatCurrency(totalDue)}</strong></td>
            <td class="amount" style="color: #28a745;">${paymentsMade > 0 ? formatCurrency(paymentsMade) : '-'}</td>
            <td class="payment-details">${paymentDetailsHtml}</td>
            <td class="amount ${itemBalance > 0 ? 'balance-positive' : ''}"><strong>${formatCurrency(itemBalance)}</strong></td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px; color: #666;">
            No billing statements available
          </td>
        </tr>
      `}
    </tbody>
  </table>

     <div class="totals-section">
     <table class="totals-table">

         <td class="label">Total Amount Due:</td>
         <td class="amount">${formatCurrency(totalAmount)} + ${formatCurrency(totalPenalties)}</td>
       </tr>
             <tr>
         <td class="label">Total Payments Made:</td>
         <td class="amount" style="color: #28a745;">-${formatCurrency(totalPaid)}</td>
       </tr>
       <tr class="total-row">
         <td class="label">Current Balance Due:</td>
         <td class="amount">${formatCurrency(lease.balance)}</td>
       </tr>

       ${(() => {
         // Get all security deposit billings and sum all allocations (partial payments) for all of them
         const securityDepositBillings = sortedBillings.filter(b => b.type === 'SECURITY_DEPOST');
         // Sum all allocations for all security deposit billings
         const totalSecurityPaid = securityDepositBillings.reduce((sum, b) => {
           if (b.allocations && Array.isArray(b.allocations)) {
             // Sum all allocations for this billing and add to sum
             return sum + b.allocations.reduce((aSum: number, alloc: { amount?: number }) => aSum + (alloc.amount || 0), 0);
           }
           // Fallback to paid_amount if allocations are missing
           return sum + (b.paid_amount || 0);
         }, 0);
         if (securityDepositBillings.length > 0) {
           return `
             <tr>
               <td class="label">Security Deposit:</td>
               <td class="amount">${formatCurrency(totalSecurityPaid)}</td>
             </tr>
           `;
         }
         return '';
       })()}
     </table>
   </div>

  <div class="footer">
    <p><strong>Generated:</strong> ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</p>
    <p>For questions about this statement, please contact the property management office.</p>
  </div>
</body>
</html>`;
}