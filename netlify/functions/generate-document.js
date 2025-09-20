// netlify/functions/generate-document.js
// Proxy function to handle document generation requests to probate automation app

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { formType, data } = JSON.parse(event.body);
    
    console.log('Proxying request to probate automation app');
    console.log('Form type:', formType);
    
    // Call your working probate automation API
    const response = await fetch('https://probateformautomation.netlify.app/.netlify/functions/process-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('Probate API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Probate API error:', errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (formType && result.pdfs && result.pdfs[formType]) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${formType}.pdf"`,
          'Access-Control-Allow-Origin': '*',
        },
        body: result.pdfs[formType],
        isBase64Encoded: true
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(result)
      };
    }
  } catch (error) {
    console.error('Error in proxy function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to generate document',
        details: error.message 
      })
    };
  }
};
