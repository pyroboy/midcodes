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
	return [...billings].sort(
		(a, b) => new Date(a.billing_date).getTime() - new Date(b.billing_date).getTime()
	);
}

function getCustomDisplayStatus(billing: any): string {
	// Enhanced status calculation with better data handling
	if (!billing) return 'UNKNOWN';
	
	const totalAmount = billing.amount || 0;
	const penaltyAmount = billing.penalty_amount || 0;
	const paidAmount = billing.paid_amount || 0;
	const totalDue = totalAmount + penaltyAmount;
	
	// Check if fully paid
	if (totalDue - paidAmount <= 0) {
		return 'PAID';
	}
	
	// Check if has penalties
	if (penaltyAmount > 0) {
		return 'PENALIZED';
	}

	// Check if overdue
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dueDate = billing.due_date ? new Date(billing.due_date) : null;
	
	if (dueDate && dueDate < today) {
		if (paidAmount > 0) {
			return 'OVERDUE_PARTIAL';
		}
		return 'OVERDUE';
	}

	// Default status based on payment amount
	if (paidAmount > 0 && paidAmount < totalDue) {
		return 'PARTIAL';
	}
	
	return billing.status || 'PENDING';
}

// --- UPDATED FUNCTION ---
function generateLeasePrintHTML(lease: Lease): string {
	const currentDate = new Date();
	const sortedBillings = sortBillingsByDate(lease.billings || []);

	// Overall totals for the summary section
	const totalAmount = sortedBillings.reduce((sum, b) => sum + (b.amount || 0), 0);
	const totalPenalties = sortedBillings.reduce((sum, b) => sum + (b.penalty_amount || 0), 0);
	const totalPaid = sortedBillings.reduce((sum, b) => sum + (b.paid_amount || 0), 0);

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
    .status-partial { color: #ffc107; font-weight: bold; }
    .status-overdue { color: #dc3545; font-weight: bold; }
    .status-penalized { color: #dc3545; font-weight: bold; }
    .status-overdue-partial { color: #dc3545; font-weight: bold; }
    .status-unknown { color: #6c757d; font-weight: bold; }
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
       <p><strong>Unit:</strong> ${(lease.rental_unit as any)?.name || lease.rental_unit?.rental_unit_number || `Unit ${(lease.rental_unit as any)?.number || 'N/A'}`}</p>
       <p><strong>Property:</strong> ${lease.rental_unit?.property?.name || 'N/A'}</p>
       <p><strong>Lease Period:</strong> ${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}</p>
     </div>
     <div class="account-info">
       <h3>Tenants</h3>
       ${
					lease.lease_tenants && lease.lease_tenants.length > 0
						? lease.lease_tenants
								.map(
									(tenant) => `
           <p><strong>${tenant.name || 'Unknown Tenant'}</strong>${tenant.contact_number ? ` • ${tenant.contact_number}` : ''}${tenant.email ? ` • ${tenant.email}` : ''}</p>
         `
								)
								.join('')
						: '<p><em>No tenants assigned</em></p>'
				}
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
      ${
				sortedBillings.length > 0
					? sortedBillings
							.map((billing) => {
								const displayStatus = getCustomDisplayStatus(billing);
								const billAmount = billing.amount || 0;
								const penaltyAmount = billing.penalty_amount || 0;
								const totalDue = billAmount + penaltyAmount;
								const paymentsMade = billing.paid_amount || 0;
								const itemBalance = totalDue - paymentsMade;

								// Enhanced payment details with better error handling
								const paymentDetailsHtml =
									billing.allocations && billing.allocations.length > 0
										? billing.allocations
												.filter((alloc: any) => alloc.payment && !alloc.payment.reverted_at)
												.map((alloc: any) => {
													if (!alloc.payment) return '';
													const methodDisplay =
														alloc.payment.method === 'SECURITY_DEPOSIT'
															? `SECURITY DEPOSIT`
															: alloc.payment.method || 'UNKNOWN';
													const paymentDate = alloc.payment.paid_at ? formatDate(alloc.payment.paid_at) : 'Unknown Date';
													const paymentAmount = formatCurrency(alloc.amount || 0);
													return `<div>${paymentDate}: ${methodDisplay} (${paymentAmount})</div>`;
												})
												.filter((detail: string) => detail !== '')
												.join('')
										: '-';

								// Enhanced status class mapping
								const statusClass = displayStatus.toLowerCase().replace('_', '-');

								return `
          <tr>
            <td class="center">${billing.billing_date ? formatDate(billing.billing_date) : 'N/A'}</td>
            <td>${billing.type || 'Unknown'}${billing.utility_type ? ` - ${billing.utility_type}` : ''}${billing.notes ? ` (${billing.notes})` : ''}</td>
            <td class="center">${billing.due_date ? formatDate(billing.due_date) : 'N/A'}</td>
            <td class="center status-${statusClass}">${displayStatus}</td>
            <td class="amount">${formatCurrency(billAmount)}</td>
            <td class="amount">${penaltyAmount > 0 ? formatCurrency(penaltyAmount) : '-'}</td>
            <td class="amount"><strong>${formatCurrency(totalDue)}</strong></td>
            <td class="amount" style="color: #28a745;">${paymentsMade > 0 ? formatCurrency(paymentsMade) : '-'}</td>
            <td class="payment-details">${paymentDetailsHtml}</td>
            <td class="amount ${itemBalance > 0 ? 'balance-positive' : ''}"><strong>${formatCurrency(itemBalance)}</strong></td>
          </tr>
        `;
							})
							.join('')
					: `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px; color: #666;">
            No billing statements available
          </td>
        </tr>
      `
			}
    </tbody>
  </table>

     <div class="totals-section">
     <table class="totals-table">
       <tr>
         <td class="label">Total Amount Due:</td>
         <td class="amount">${formatCurrency(totalAmount)} + ${formatCurrency(totalPenalties)}</td>
       </tr>
       <tr>
         <td class="label">Total Payments Made:</td>
         <td class="amount" style="color: #28a745;">-${formatCurrency(totalPaid)}</td>
       </tr>
       <tr class="total-row">
         <td class="label">Current Balance Due:</td>
         <td class="amount">${formatCurrency(lease.balance || 0)}</td>
       </tr>

               ${(() => {
									// Get all security deposit billings
									const securityDepositBillings = sortedBillings.filter(
										(b) => b.type === 'SECURITY_DEPOSIT'
									);

									if (securityDepositBillings.length > 0) {
										// Calculate security deposit totals
										const totalBilledSecurityDeposit = securityDepositBillings.reduce(
											(sum, b) => sum + (b.amount || 0),
											0
										);
										const totalPaidToSecurityDeposit = securityDepositBillings.reduce(
											(sum, b) => sum + (b.paid_amount || 0),
											0
										);
										const unpaidSecurityDeposit = securityDepositBillings.reduce(
											(sum, b) => sum + ((b.amount || 0) - (b.paid_amount || 0)),
											0
										);

										// Calculate amount used from security deposit for other billings - exclude reverted payments
										let amountUsed = 0;
										sortedBillings.forEach((billing) => {
											if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
												billing.allocations.forEach((allocation: any) => {
													if (allocation.payment && allocation.payment.method === 'SECURITY_DEPOSIT' && !allocation.payment.reverted_at) {
														amountUsed += allocation.amount || 0;
													}
												});
											}
										});

										return `
              <tr>
                <td class="label" colspan="2" style="text-align: center; font-weight: bold; padding-top: 10px; border-top: 1px solid #ccc;">
                  Security Deposit Info
                </td>
              </tr>
              <tr>
                <td class="label">Total Billed Security Deposit:</td>
                <td class="amount">${formatCurrency(totalBilledSecurityDeposit)}</td>
              </tr>
                             <tr>
                 <td class="label">Available Deposit:</td>
                 <td class="amount">${formatCurrency(totalPaidToSecurityDeposit - amountUsed)}</td>
               </tr>
              <tr>
                <td class="label">Unpaid Security Deposit:</td>
                <td class="amount">${formatCurrency(unpaidSecurityDeposit)}</td>
              </tr>
              <tr>
                <td class="label">Amount Used:</td>
                <td class="amount">${formatCurrency(amountUsed)}</td>
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

export function printAllLeases(leases: any[]): void {
	const iframe = document.createElement('iframe');
	iframe.style.position = 'absolute';
	iframe.style.width = '0';
	iframe.style.height = '0';
	iframe.style.border = 'none';
	document.body.appendChild(iframe);

	const html = generateAllLeasesPrintHTML(leases);

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

function generateAllLeasesPrintHTML(leases: any[]): string {
	const currentDate = new Date();
	
	// Calculate totals with better data handling
	const totalLeases = leases.length;
	const totalBalance = leases.reduce((sum, lease) => sum + (lease.balance || 0), 0);
	const paidLeases = leases.filter(lease => !lease.balance || lease.balance <= 0).length;
	const unpaidLeases = totalLeases - paidLeases;

	return `
<html>
<head>
  <title>All Leases Summary Report</title>
  <style>
    @page { margin: 0.5cm; size: portrait; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 9px; 
      color: #333; 
      margin: 0; 
      padding: 8px; 
      line-height: 1.3; 
    }
    .report-header { 
      text-align: center; 
      margin-bottom: 20px; 
      padding-bottom: 10px; 
      border-bottom: 2px solid #000; 
    }
    .report-title { 
      font-size: 24px; 
      font-weight: bold; 
      margin: 0 0 5px 0; 
    }
    .report-subtitle { 
      font-size: 12px; 
      color: #666; 
      margin: 0; 
    }
    .summary-stats { 
      display: flex; 
      justify-content: space-around; 
      margin-bottom: 20px; 
      padding: 10px; 
      background: #f8f9fa; 
      border-radius: 5px; 
    }
    .stat-item { 
      text-align: center; 
    }
    .stat-value { 
      font-size: 16px; 
      font-weight: bold; 
      color: #007bff; 
    }
    .stat-label { 
      font-size: 10px; 
      color: #666; 
    }
    .leases-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px; 
    }
    .leases-table th { 
      background: #f5f5f5; 
      border: 1px solid #ddd; 
      padding: 4px 6px; 
      text-align: left; 
      font-size: 8px; 
      font-weight: bold; 
    }
    .leases-table td { 
      border: 1px solid #ddd; 
      padding: 3px 4px; 
      font-size: 8px; 
    }
    .status-paid { 
      color: #28a745; 
      font-weight: bold; 
    }
    .status-pending { 
      color: #ffc107; 
      font-weight: bold; 
    }
    .status-partial { 
      color: #ffc107; 
      font-weight: bold; 
    }
    .status-overdue { 
      color: #dc3545; 
      font-weight: bold; 
    }
    .status-overdue-partial { 
      color: #dc3545; 
      font-weight: bold; 
    }
    .status-penalized { 
      color: #dc3545; 
      font-weight: bold; 
    }
    .status-unknown { 
      color: #6c757d; 
      font-weight: bold; 
    }
    .balance-positive { 
      color: #dc3545; 
      font-weight: bold; 
    }
    .balance-zero { 
      color: #28a745; 
    }
    .balance-pending { 
      color: #ffc107; 
      font-weight: bold; 
    }
    .due-date-pending { 
      color: #ffc107; 
      font-weight: bold; 
    }
    .due-date-overdue { 
      color: #dc3545; 
      font-weight: bold; 
    }
    .footer { 
      margin-top: 20px; 
      text-align: center; 
      font-size: 9px; 
      color: #666; 
      border-top: 1px solid #ccc; 
      padding-top: 10px; 
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">Leases Summary Report</h1>
    <p class="report-subtitle">Property Management System</p>
  </div>

  <div class="summary-stats">
    <div class="stat-item">
      <div class="stat-value">${totalLeases}</div>
      <div class="stat-label">Total Leases</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: #28a745;">${paidLeases}</div>
      <div class="stat-label">Paid Up</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: #dc3545;">${unpaidLeases}</div>
      <div class="stat-label">With Balance</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: #dc3545;">${formatCurrency(totalBalance)}</div>
      <div class="stat-label">Total Outstanding</div>
    </div>
  </div>

  <table class="leases-table">
    <thead>
      <tr>
        <th style="width: 30%;">Lease Name</th>
        <th style="width: 35%;">Tenants</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 10%;">Balance</th>
        <th style="width: 10%;">Due Date</th>
      </tr>
    </thead>
    <tbody>
      ${leases.map((lease) => {
        const balance = lease.balance || 0;
        const hasBalance = balance > 0;
        
        // Enhanced tenant name extraction
        const tenantNames = lease.lease_tenants && lease.lease_tenants.length > 0
          ? lease.lease_tenants.map((lt: any) => {
              // Handle different tenant data structures
              if (lt.tenants) {
                return lt.tenants.full_name || lt.tenants.name || 'Unknown Tenant';
              }
              return lt.name || lt.full_name || 'Unknown Tenant';
            }).join(', ')
          : 'No tenants assigned';

        // Enhanced billing status calculation
        const hasBillings = lease.billings && lease.billings.length > 0;
        let hasPayments = false;
        let nextDueDate = null;
        let daysOverdue = 0;
        
        if (hasBillings) {
          // Check for payments
          lease.billings.forEach((billing: any) => {
            if (billing.allocations && billing.allocations.length > 0) {
              hasPayments = true;
            }
          });
          
          // Find next due date and calculate overdue days
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const unpaidBillings = lease.billings.filter((billing: any) => {
            const totalDue = (billing.amount || 0) + (billing.penalty_amount || 0);
            const paidAmount = billing.paid_amount || 0;
            return totalDue > paidAmount;
          });
          
          if (unpaidBillings.length > 0) {
            // Find the earliest due date among unpaid billings
            const dueDates = unpaidBillings
              .map((billing: any) => billing.due_date ? new Date(billing.due_date) : null)
              .filter((date: Date | null) => date !== null)
              .sort((a: Date, b: Date) => a.getTime() - b.getTime());
            
            if (dueDates.length > 0) {
              nextDueDate = dueDates[0];
              if (nextDueDate < today) {
                daysOverdue = Math.floor((today.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24));
              }
            }
          }
        }
        
        // Enhanced status determination
        let status = '';
        let statusClass = '';
        let balanceClass = '';
        let dueDateDisplay = '-';
        let dueDateClass = '';
        
        if (!hasBillings) {
          status = 'NO BILLINGS';
          statusClass = 'status-unknown';
          balanceClass = '';
          dueDateDisplay = '-';
        } else if (!hasPayments && !hasBalance) {
          status = 'NO PAYMENTS';
          statusClass = 'status-unknown';
          balanceClass = '';
          dueDateDisplay = '-';
        } else if (!hasBalance) {
          status = 'PAID';
          statusClass = 'status-paid';
          balanceClass = 'balance-zero';
          dueDateDisplay = '-';
        } else {
          if (daysOverdue > 0) {
            status = 'OVERDUE';
            statusClass = 'status-overdue';
            balanceClass = 'balance-positive';
            dueDateDisplay = nextDueDate ? `${formatDate(nextDueDate)} (${daysOverdue} days)` : '-';
            dueDateClass = 'due-date-overdue';
          } else {
            status = 'PENDING';
            statusClass = 'status-pending';
            balanceClass = 'balance-pending';
            dueDateDisplay = nextDueDate ? formatDate(nextDueDate) : '-';
            dueDateClass = 'due-date-pending';
          }
        }

        return `
          <tr>
            <td><strong>${lease.name || `Lease #${lease.id}`}</strong></td>
            <td>${tenantNames}</td>
            <td class="${statusClass}">${status}</td>
            <td class="${balanceClass}">${formatCurrency(balance)}</td>
            <td class="${dueDateClass}">${dueDateDisplay}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Generated:</strong> ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</p>
    <p>Dormitory Management System - Leases Summary Report</p>
  </div>
</body>
</html>`;
}
