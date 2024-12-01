const corsHeaders = {
    'Access-Control-Allow-Origin': '*',  // For development, you might want to restrict this
    'Access-Control-Allow-Headers': [
      'authorization',
      'x-client-info',
      'apikey',
      'content-type',
      'Authorization',
      'X-Client-Info',
      'Apikey'
    ].join(', '),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
  
  export { corsHeaders }