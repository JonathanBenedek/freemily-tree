// Copy this file to config.js and fill in the values from your own Google Cloud
// project. See the README, section "Self-hosting", for step-by-step instructions.
//
// These values are not secrets: they are sent to every visitor's browser. They are
// protected by restrictions you set in Google Cloud (allowed websites and APIs),
// so each deployment must use its own.
window.FREEMILY_CONFIG = {
  // OAuth 2.0 Client ID (type "Web application"), with your site's address under
  // "Authorised JavaScript origins".
  googleClientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

  // Browser API key, restricted to your site's address and to the
  // Google Picker API, Google Sheets API and Google Drive API.
  googleApiKey: 'YOUR_BROWSER_API_KEY',

  // Your Google Cloud project number (Cloud overview > Dashboard > Project info).
  googleAppId: 'YOUR_PROJECT_NUMBER',
};
