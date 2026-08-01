/**
 * Secure Message Board — Google Apps Script backend.
 *
 * Deploy this script bound to the Google Sheet that will store messages
 * (Extensions > Apps Script from inside the Sheet). See setup.md for
 * full deployment steps.
 *
 * Required Script Property:
 *   APP_PASSWORD = the shared password used to log in.
 */

var SHEET_NAME = 'Messages';
var SESSION_TTL_SECONDS = 3600;      // 1 hour session
var LOCKOUT_TTL_SECONDS = 3600;      // 1 hour lockout
var MAX_FAILED_ATTEMPTS = 3;         // 4th attempt triggers the lock
var MAX_MESSAGE_LENGTH = 2000;

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doGet(e) {
  return ContentService
    .createTextOutput('Secure Message Board API')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ success: false, message: 'Invalid request' });
  }

  var result;
  switch (data.action) {
    case 'status':
      result = handleStatus_(data);
      break;
    case 'login':
      result = handleLogin_(data);
      break;
    case 'getMessages':
      result = handleGetMessages_(data);
      break;
    case 'postMessage':
      result = handlePostMessage_(data);
      break;
    case 'clearMessages':
      result = handleClearMessages_(data);
      break;
    default:
      result = { success: false, message: 'Unknown action' };
  }
  return jsonOutput_(result);
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handleStatus_(data) {
  var clientId = String(data.clientId || 'unknown');
  return { success: true, locked: isLocked_(clientId) };
}

function handleLogin_(data) {
  var clientId = String(data.clientId || 'unknown');

  if (isLocked_(clientId)) {
    return { success: false, message: 'Unauthorized', locked: true };
  }

  var appPassword = PropertiesService.getScriptProperties().getProperty('APP_PASSWORD');
  if (!appPassword) {
    // Do not leak configuration details to the client.
    return { success: false, message: 'Unauthorized' };
  }

  var suppliedPassword = String(data.password || '');

  if (suppliedPassword === appPassword) {
    clearFailedAttempts_(clientId);
    var token = Utilities.getUuid();
    CacheService.getScriptCache().put('session_' + token, clientId, SESSION_TTL_SECONDS);
    return { success: true, token: token };
  }

  var nowLocked = registerFailedAttempt_(clientId);
  return { success: false, message: 'Unauthorized', locked: nowLocked };
}

function handleGetMessages_(data) {
  if (!validateToken_(data.token)) {
    return { success: false, message: 'Unauthorized' };
  }
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  var messages = [];
  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    messages = values.map(function (row) {
      return { id: row[0], timestamp: row[1], text: row[2] };
    });
    messages.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }
  return { success: true, messages: messages };
}

function handlePostMessage_(data) {
  if (!validateToken_(data.token)) {
    return { success: false, message: 'Unauthorized' };
  }

  var text = String(data.text || '').trim();
  if (!text) {
    return { success: false, message: 'Message cannot be empty' };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.substring(0, MAX_MESSAGE_LENGTH);
  }

  var id = Utilities.getUuid();
  var timestamp = new Date().toISOString();
  getSheet_().appendRow([id, timestamp, text]);

  return { success: true, message: { id: id, timestamp: timestamp, text: text } };
}

function handleClearMessages_(data) {
  if (!validateToken_(data.token)) {
    return { success: false, message: 'Unauthorized' };
  }
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function validateToken_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('session_' + token) !== null;
}

// ---------------------------------------------------------------------------
// Brute-force protection helpers
// ---------------------------------------------------------------------------

function isLocked_(clientId) {
  return CacheService.getScriptCache().get('lock_' + clientId) !== null;
}

/** Increments the failed-attempt counter; returns true if this attempt triggered a lockout. */
function registerFailedAttempt_(clientId) {
  var cache = CacheService.getScriptCache();
  var key = 'fail_' + clientId;
  var count = parseInt(cache.get(key) || '0', 10) + 1;

  if (count > MAX_FAILED_ATTEMPTS) {
    cache.put('lock_' + clientId, '1', LOCKOUT_TTL_SECONDS);
    cache.remove(key);
    return true;
  }

  cache.put(key, String(count), LOCKOUT_TTL_SECONDS);
  return false;
}

function clearFailedAttempts_(clientId) {
  var cache = CacheService.getScriptCache();
  cache.remove('fail_' + clientId);
  cache.remove('lock_' + clientId);
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Timestamp', 'Message']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ---------------------------------------------------------------------------
// Output helper
// ---------------------------------------------------------------------------

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
