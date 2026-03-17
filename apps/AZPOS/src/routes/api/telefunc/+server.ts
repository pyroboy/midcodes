import type { RequestHandler } from '@sveltejs/kit'

// Static imports for all telefunc modules
// import * as authTelefunc from '$lib/server/telefuncs/auth.telefunc'
// import * as cartTelefunc from '$lib/server/telefuncs/cart.telefunc'
import * as categoryTelefunc from '$lib/server/telefuncs/category.telefunc'
// import * as discountTelefunc from '$lib/server/telefuncs/discount.telefunc'
// import * as groceryCartTelefunc from '$lib/server/telefuncs/groceryCart.telefunc'
import * as inventoryTelefunc from '$lib/server/telefuncs/inventory.telefunc'
// import * as modifierTelefunc from '$lib/server/telefuncs/modifier.telefunc'
// import * as paymentTelefunc from '$lib/server/telefuncs/payment.telefunc'
import * as productTelefunc from '$lib/server/telefuncs/product.telefunc'
// import * as productBatchTelefunc from '$lib/server/telefuncs/productBatch.telefunc'
// import * as profitMarginTelefunc from '$lib/server/telefuncs/profitMargin.telefunc'
import * as purchaseOrderTelefunc from '$lib/server/telefuncs/purchaseOrder.telefunc'
import * as receivingTelefunc from '$lib/server/telefuncs/receiving.telefunc'
// import * as receiptTelefunc from '$lib/server/telefuncs/receipt.telefunc'
import * as returnsTelefunc from '$lib/server/telefuncs/returns.telefunc'
// import * as salesTelefunc from '$lib/server/telefuncs/sales.telefunc'
// import * as sessionTelefunc from '$lib/server/telefuncs/session.telefunc'
// import * as settingsTelefunc from '$lib/server/telefuncs/settings.telefunc'
// import * as stockTransactionTelefunc from '$lib/server/telefuncs/stockTransaction.telefunc'
// import * as supplierPerformanceTelefunc from '$lib/server/telefuncs/supplier-performance.telefunc'
import * as supplierTelefunc from '$lib/server/telefuncs/supplier.telefunc'
// import * as themeTelefunc from '$lib/server/telefuncs/theme.telefunc'
// import * as transactionTelefunc from '$lib/server/telefuncs/transaction.telefunc'
// import * as userTelefunc from '$lib/server/telefuncs/user.telefunc'
import * as viewTelefunc from '$lib/server/telefuncs/view.telefunc'

// Module registry for function lookup
const TELEFUNC_REGISTRY = {
  // auth: authTelefunc,
  // cart: cartTelefunc,
  category: categoryTelefunc,
  // discount: discountTelefunc,
  // groceryCart: groceryCartTelefunc,
  inventory: inventoryTelefunc,
  // modifier: modifierTelefunc,
  // payment: paymentTelefunc,
  receiving: receivingTelefunc,
  product: productTelefunc,
  // productBatch: productBatchTelefunc,
  // profitMargin: profitMarginTelefunc,
  purchaseOrder: purchaseOrderTelefunc,
  // receipt: receiptTelefunc,
  returns: returnsTelefunc,
  // sales: salesTelefunc,
  // session: sessionTelefunc,
  // settings: settingsTelefunc,
  // stockTransaction: stockTransactionTelefunc,
  // 'supplier-performance': supplierPerformanceTelefunc,
  supplier: supplierTelefunc,
  // theme: themeTelefunc,
  // transaction: transactionTelefunc,
  // user: userTelefunc,
  view: viewTelefunc
} as const;

// Custom Telefunc handler for telefuncName/telefuncArgs format
export const POST: RequestHandler = async (event) => {
  console.log('📡 [TELEFUNC SERVER] Request received:', {
    method: event.request.method,
    url: event.url.pathname,
    hasBody: event.request.body !== null
  });

  try {
    const body = await event.request.text();
    console.log('📡 [TELEFUNC SERVER] Request body:', body);

    // Parse the custom request format
    const { telefuncName, telefuncArgs } = JSON.parse(body);
    
    if (!telefuncName) {
      throw new Error('Missing telefuncName');
    }

    console.log('📡 [TELEFUNC SERVER] Parsed request:', { telefuncName, telefuncArgs });

    // Generic function discovery - search through all available modules
    let telefuncFunction;
    
    for (const [moduleName, telefuncModule] of Object.entries(TELEFUNC_REGISTRY)) {
      telefuncFunction = telefuncModule[telefuncName as keyof typeof telefuncModule];
      
      if (telefuncFunction && typeof telefuncFunction === 'function') {
        console.log(`📡 [TELEFUNC SERVER] Found function '${telefuncName}' in module '${moduleName}'`);
        break;
      }
    }
    
    if (!telefuncFunction) {
      throw new Error(`Telefunc function '${telefuncName}' not found in any available modules: ${Object.keys(TELEFUNC_REGISTRY).join(', ')}`);
    }

    // Set up context for the telefunc function
    // Telefunc uses a global context system
    
    const context = {
      user: event.locals.user,
      request: event.request
    };

    // Call the telefunc function with the provided arguments and context
    const args = Array.isArray(telefuncArgs) ? telefuncArgs : [];
    // Temporarily store context (telefunc functions use getContext())
    global.telefuncContext = context;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (telefuncFunction as (...args: any[]) => Promise<any>)(...args);
      
      console.log(' [TELEFUNC SERVER] Function result:', { success: true, hasResult: !!result });
      
      // Return the result in the expected format
      return new Response(JSON.stringify({ ret: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } finally {
      // Clean up context
      delete global.telefuncContext;
    }

  } catch (error) {
    console.error(' [TELEFUNC SERVER] Error:', error);
    
    // Clean up context on error
    delete global.telefuncContext;

    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle other HTTP methods
export const GET = POST
export const PUT = POST
export const DELETE = POST
