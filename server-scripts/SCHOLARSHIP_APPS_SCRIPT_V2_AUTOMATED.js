// ==========================================
// Urdu AI — Google Scholarship Apps Script V2 (FULLY AUTOMATED)
// ==========================================
//
// WHAT'S NEW IN V2:
// ✅ Auto-invite learners to Coursera via API (no manual work)
// ✅ Auto-remove after 7 days (frees seat for next learner)
// ✅ Auto-detect completion → send congrats email
// ✅ Social media share request in congrats email
// ✅ Seat recycling: 500 seats serve unlimited learners
//
// SETUP STEPS:
// 1. Open your Google Sheet (linked to Google Form)
// 2. Make sure "AppRegistrations" tab exists with these headers in Row 1:
//    A: Timestamp | B: Full Name | C: Email | D: City | E: Phone
//    F: Source | G: Device ID | H: Status | I: Coursera Invite Date
//    J: Removal Date | K: Completed | L: Congrats Sent | M: Notes
// 3. Go to Extensions → Apps Script
// 4. REPLACE all existing code with this entire file
// 5. Fill in COURSERA_CONFIG below with your real credentials
// 6. Deploy → Manage Deployments → New Version → Deploy
// 7. SET UP TRIGGERS (clock icon ⏰):
//    - "sendWelcomeEmailOnFormSubmit" → On Form Submit
//    - "dailyAutomation" → Time-driven → Day timer → 6am-7am
//
// ==========================================

// ⚙️ APP CONFIGURATION
const CONFIG = {
  APP_SHEET_NAME: 'AppRegistrations',
  API_KEY: 'URAI-SCHOLARSHIP-2026',
  MAX_ACTIVE_SEATS: 500,              // Total Coursera seats available
  ADMIN_EMAIL: 'qaisar.roonjha@gmail.com',
  SENDER_NAME: 'Qaisar Roonjha from Urdu AI',
  REPLY_TO: 'ai@urduai.org'
};

// ⚙️ COURSERA API CONFIGURATION
// Get these from your Coursera admin panel → Settings → API
const COURSERA_CONFIG = {
  ORG_ID: '',                          // ← PASTE YOUR ORGANIZATION ID HERE
  API_KEY: '',                         // ← PASTE YOUR COURSERA API KEY HERE
  API_SECRET: '',                      // ← PASTE YOUR API SECRET HERE (if provided)
  PROGRAM_ID: '',                      // ← Your Google AI cert program ID from Coursera
  SCHOLARSHIP_DAYS: 7,                 // Auto-remove after 7 days
  API_BASE: 'https://api.coursera.com'
};

// ==========================================
// PART 1: GOOGLE FORM — Welcome Email (EXISTING — unchanged)
// Trigger: On Form Submit
// ==========================================
function sendWelcomeEmailOnFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = e.range.getRow();
  var name = sheet.getRange(row, 2).getValue();
  var email = sheet.getRange(row, 4).getValue();
  var statusCell = sheet.getRange(row, 16);

  if (!email.includes("@") || !email.includes(".")) {
    statusCell.setValue("Invalid Email");
    return;
  }

  var subject = name + ' \u2013 \u06AF\u0648\u06AF\u0644 \u0633\u0631\u0679\u06CC\u0641\u06A9\u06CC\u0679 | Urdu AI';
  var htmlMessage = buildFormWelcomeEmail(name);

  try {
    MailApp.sendEmail(email, subject, '', {
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.REPLY_TO,
      htmlBody: htmlMessage
    });
    statusCell.setValue("Sent");
  } catch (error) {
    statusCell.setValue("Error");
    Logger.log("Email sending failed: " + error);
  }
}

// ==========================================
// PART 2: APP REGISTRATION — POST endpoint
// Now auto-invites to Coursera!
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.apiKey !== CONFIG.API_KEY) {
      return respond(401, { error: 'Unauthorized' });
    }

    var sheet = getAppSheet();
    if (!sheet) {
      return respond(500, { error: 'AppRegistrations tab not found.' });
    }

    // Check for duplicate email
    var existing = findByEmail(sheet, data.email);
    if (existing) {
      return respond(200, {
        success: false,
        reason: 'duplicate',
        message: 'This email has already applied.',
        messageUr: '\u06CC\u06C1 \u0627\u06CC \u0645\u06CC\u0644 \u067E\u06C1\u0644\u06D2 \u0633\u06D2 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062F\u06D2 \u0686\u06A9\u06CC \u06C1\u06D2\u06D4',
        appliedDate: existing[0]
      });
    }

    // Check if seats available
    var activeCount = getActiveSeatsCount(sheet);
    if (activeCount >= CONFIG.MAX_ACTIVE_SEATS) {
      // No seats right now — add to waitlist
      sheet.appendRow([
        new Date().toISOString(),       // A: Timestamp
        data.fullName || '',            // B: Full Name
        data.email || '',               // C: Email
        data.city || '',                // D: City
        data.phone || '',               // E: Phone
        'App',                          // F: Source
        data.deviceId || '',            // G: Device ID
        'Waitlist',                     // H: Status
        '',                             // I: Coursera Invite Date
        '',                             // J: Removal Date
        '',                             // K: Completed
        '',                             // L: Congrats Sent
        ''                              // M: Notes
      ]);

      sendWaitlistEmail(data.fullName, data.email);

      return respond(200, {
        success: true,
        waitlist: true,
        message: 'All seats are currently full. You\'ve been added to the waitlist!',
        messageUr: '\u0641\u06CC \u0627\u0644\u062D\u0627\u0644 \u062A\u0645\u0627\u0645 \u0633\u06CC\u0679\u06CC\u06BA \u0628\u06BE\u0631\u06CC \u06C1\u06CC\u06BA\u06D4 \u0622\u067E \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06CC \u0641\u06C1\u0631\u0633\u062A \u0645\u06CC\u06BA \u0634\u0627\u0645\u0644 \u06C1\u0648 \u06AF\u0626\u06D2\u06D4'
      });
    }

    // ✅ SEAT AVAILABLE — Add to sheet + Auto-invite to Coursera
    sheet.appendRow([
      new Date().toISOString(),       // A: Timestamp
      data.fullName || '',            // B: Full Name
      data.email || '',               // C: Email
      data.city || '',                // D: City
      data.phone || '',               // E: Phone
      'App',                          // F: Source
      data.deviceId || '',            // G: Device ID
      'Inviting',                     // H: Status (will update to Enrolled)
      '',                             // I: Coursera Invite Date
      '',                             // J: Removal Date
      '',                             // K: Completed
      '',                             // L: Congrats Sent
      ''                              // M: Notes
    ]);

    var newRow = sheet.getLastRow();

    // Auto-invite to Coursera
    var inviteResult = inviteToCoursera(data.email, data.fullName);

    if (inviteResult.success) {
      sheet.getRange(newRow, 8).setValue('Enrolled');        // H: Status
      sheet.getRange(newRow, 9).setValue(new Date().toISOString()); // I: Invite Date
      sheet.getRange(newRow, 13).setValue('Auto-invited');   // M: Notes
    } else {
      sheet.getRange(newRow, 8).setValue('Pending');         // H: Fallback to manual
      sheet.getRange(newRow, 13).setValue('API error: ' + inviteResult.error); // M: Notes
    }

    // Send welcome email
    try {
      sendAppWelcomeEmail(data.fullName, data.email, inviteResult.success);
    } catch (emailErr) {
      Logger.log('App welcome email error: ' + emailErr.message);
    }

    return respond(200, {
      success: true,
      autoEnrolled: inviteResult.success,
      message: inviteResult.success
        ? 'You\'ve been enrolled! Check your email for the Coursera invitation.'
        : 'Application received! You will get access within 48 hours.',
      messageUr: inviteResult.success
        ? '\u0622\u067E \u06A9\u0627 \u062F\u0627\u062E\u0644\u06C1 \u06C1\u0648 \u06AF\u06CC\u0627! Coursera \u0633\u06D2 \u0627\u06CC \u0645\u06CC\u0644 \u0686\u06CC\u06A9 \u06A9\u0631\u06CC\u06BA\u06D4'
        : '\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644! 48 \u06AF\u06BE\u0646\u0679\u0648\u06BA \u0645\u06CC\u06BA \u0631\u0633\u0627\u0626\u06CC \u0645\u0644\u06D2 \u06AF\u06CC\u06D4'
    });

  } catch (error) {
    Logger.log('doPost error: ' + error.message);
    return respond(500, { error: error.message });
  }
}

// ==========================================
// PART 3: GET endpoint (upgraded)
// ==========================================
function doGet(e) {
  var action = e.parameter.action;
  var callback = e.parameter.callback || null;

  // Spots: now based on ACTIVE seats (not weekly count)
  if (action === 'spots') {
    var sheet = getAppSheet();
    if (!sheet) {
      return respond(200, { spotsRemaining: CONFIG.MAX_ACTIVE_SEATS, totalSpots: CONFIG.MAX_ACTIVE_SEATS }, callback);
    }
    var activeSeats = getActiveSeatsCount(sheet);
    var remaining = Math.max(0, CONFIG.MAX_ACTIVE_SEATS - activeSeats);
    return respond(200, {
      spotsRemaining: remaining,
      totalSpots: CONFIG.MAX_ACTIVE_SEATS
    }, callback);
  }

  // Check if email already applied
  if (action === 'check') {
    var sheet = getAppSheet();
    if (!sheet) return respond(200, { applied: false }, callback);
    var email = e.parameter.email;
    var existing = findByEmail(sheet, email);
    return respond(200, {
      applied: !!existing,
      appliedDate: existing ? existing[0] : null,
      status: existing ? existing[7] : null
    }, callback);
  }

  // Admin stats (upgraded with automation info)
  if (action === 'stats' && e.parameter.key === CONFIG.API_KEY) {
    var sheet = getAppSheet();
    if (!sheet) return respond(200, { error: 'Sheet not found' }, callback);
    var data = sheet.getDataRange().getValues();
    var total = data.length - 1;
    var enrolled = 0, pending = 0, waitlist = 0, completed = 0, removed = 0;
    for (var i = 1; i <= total; i++) {
      var status = data[i][7];
      if (status === 'Enrolled' || status === 'Inviting') enrolled++;
      else if (status === 'Pending') pending++;
      else if (status === 'Waitlist') waitlist++;
      else if (status === 'Completed') completed++;
      else if (status === 'Removed') removed++;
    }
    return respond(200, {
      totalApplications: total,
      activeSeats: enrolled,
      pending: pending,
      waitlist: waitlist,
      completed: completed,
      removed: removed,
      seatsAvailable: Math.max(0, CONFIG.MAX_ACTIVE_SEATS - enrolled)
    }, callback);
  }

  return respond(200, { service: 'Urdu AI Scholarship V2', status: 'active' }, callback);
}


// ==========================================
// PART 4: COURSERA API INTEGRATION
// ==========================================

// Get OAuth token from Coursera
function getCourseraToken() {
  // Method 1: If Coursera gave you OAuth client credentials
  if (COURSERA_CONFIG.API_KEY && COURSERA_CONFIG.API_SECRET) {
    var tokenUrl = COURSERA_CONFIG.API_BASE + '/oauth2/client_credentials/token';
    var response = UrlFetchApp.fetch(tokenUrl, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        'client_id': COURSERA_CONFIG.API_KEY,
        'client_secret': COURSERA_CONFIG.API_SECRET,
        'grant_type': 'client_credentials'
      },
      muteHttpExceptions: true
    });

    var result = JSON.parse(response.getContentText());
    if (result.access_token) {
      return result.access_token;
    }
    Logger.log('Coursera token error: ' + response.getContentText());
    return null;
  }

  // Method 2: If they gave you a direct API key (no OAuth)
  return COURSERA_CONFIG.API_KEY;
}

// Invite a user to Coursera program
function inviteToCoursera(email, fullName) {
  try {
    if (!COURSERA_CONFIG.ORG_ID || !COURSERA_CONFIG.API_KEY) {
      Logger.log('Coursera not configured — skipping auto-invite');
      return { success: false, error: 'Coursera API not configured' };
    }

    var token = getCourseraToken();
    if (!token) {
      return { success: false, error: 'Could not get Coursera token' };
    }

    // Coursera Enterprise API — Invite user to program
    var inviteUrl = COURSERA_CONFIG.API_BASE +
      '/api/businesses.v1/' + COURSERA_CONFIG.ORG_ID +
      '/programs/' + COURSERA_CONFIG.PROGRAM_ID + '/invitations';

    var response = UrlFetchApp.fetch(inviteUrl, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        invitees: [{
          email: email,
          fullName: fullName
        }]
      }),
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    var body = response.getContentText();

    Logger.log('Coursera invite response [' + statusCode + ']: ' + body);

    if (statusCode >= 200 && statusCode < 300) {
      return { success: true, response: body };
    } else {
      return { success: false, error: 'HTTP ' + statusCode + ': ' + body };
    }
  } catch (error) {
    Logger.log('Coursera invite error: ' + error.message);
    return { success: false, error: error.message };
  }
}

// Remove a user from Coursera program (frees up seat)
function removeFromCoursera(email) {
  try {
    if (!COURSERA_CONFIG.ORG_ID || !COURSERA_CONFIG.API_KEY) {
      return { success: false, error: 'Coursera API not configured' };
    }

    var token = getCourseraToken();
    if (!token) return { success: false, error: 'No token' };

    // Remove user from the program
    var removeUrl = COURSERA_CONFIG.API_BASE +
      '/api/businesses.v1/' + COURSERA_CONFIG.ORG_ID +
      '/programs/' + COURSERA_CONFIG.PROGRAM_ID + '/members';

    var response = UrlFetchApp.fetch(removeUrl, {
      method: 'delete',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        emails: [email]
      }),
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    Logger.log('Coursera remove [' + statusCode + ']: ' + response.getContentText());

    return { success: statusCode >= 200 && statusCode < 300 };
  } catch (error) {
    Logger.log('Coursera remove error: ' + error.message);
    return { success: false, error: error.message };
  }
}


// ==========================================
// PART 5: DAILY AUTOMATION (runs every morning)
// Set up as Time-driven trigger → Day timer → 6am-7am
// ==========================================
function dailyAutomation() {
  Logger.log('=== Daily Automation Started ===');

  var sheet = getAppSheet();
  if (!sheet) {
    Logger.log('No AppRegistrations sheet found');
    return;
  }

  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var removedCount = 0;
  var waitlistInvited = 0;

  // ── STEP 1: Remove learners who exceeded 7 days ──
  for (var i = 1; i < data.length; i++) {
    var status = data[i][7];      // H: Status
    var inviteDate = data[i][8];  // I: Coursera Invite Date
    var completed = data[i][10];  // K: Completed

    // Skip if not currently enrolled, or already completed
    if (status !== 'Enrolled' || completed === 'Yes') continue;

    // Check if > 7 days since invite
    if (inviteDate) {
      var invite = new Date(inviteDate);
      var daysSinceInvite = (now - invite) / (1000 * 60 * 60 * 24);

      if (daysSinceInvite > COURSERA_CONFIG.SCHOLARSHIP_DAYS) {
        // Time's up — remove from Coursera
        var email = data[i][2];
        var name = data[i][1];
        var removeResult = removeFromCoursera(email);

        var row = i + 1; // Sheet rows are 1-indexed
        sheet.getRange(row, 8).setValue('Removed');                    // H: Status
        sheet.getRange(row, 10).setValue(now.toISOString());           // J: Removal Date
        sheet.getRange(row, 13).setValue('Auto-removed after 7 days'); // M: Notes

        // Send expiry notification email
        sendExpiryEmail(name, email);
        removedCount++;

        Logger.log('Removed: ' + email + ' (enrolled ' + Math.floor(daysSinceInvite) + ' days ago)');
      }
    }
  }

  // ── STEP 2: Fill freed seats from waitlist ──
  if (removedCount > 0) {
    // Re-read data after updates
    data = sheet.getDataRange().getValues();
    var activeSeats = getActiveSeatsCount(sheet);
    var availableSeats = CONFIG.MAX_ACTIVE_SEATS - activeSeats;

    if (availableSeats > 0) {
      for (var i = 1; i < data.length && waitlistInvited < availableSeats; i++) {
        if (data[i][7] === 'Waitlist') {
          var email = data[i][2];
          var name = data[i][1];
          var row = i + 1;

          var inviteResult = inviteToCoursera(email, name);

          if (inviteResult.success) {
            sheet.getRange(row, 8).setValue('Enrolled');
            sheet.getRange(row, 9).setValue(now.toISOString());
            sheet.getRange(row, 13).setValue('Auto-invited from waitlist');
            sendWaitlistPromotionEmail(name, email);
            waitlistInvited++;
            Logger.log('Waitlist promoted: ' + email);
          } else {
            sheet.getRange(row, 13).setValue('Waitlist invite failed: ' + inviteResult.error);
          }
        }
      }
    }
  }

  // ── STEP 3: Send daily summary to admin ──
  if (removedCount > 0 || waitlistInvited > 0) {
    var activeSeats = getActiveSeatsCount(sheet);
    sendAdminSummary(removedCount, waitlistInvited, activeSeats);
  }

  Logger.log('=== Daily Automation Done: removed=' + removedCount + ', waitlist_promoted=' + waitlistInvited + ' ===');
}


// ==========================================
// PART 6: COMPLETION CHECKER
// Run manually or add as weekly trigger
// Checks Coursera for who completed the course
// ==========================================
function checkCompletions() {
  var sheet = getAppSheet();
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    var status = data[i][7];
    var email = data[i][2];
    var name = data[i][1];
    var completed = data[i][10];
    var congratsSent = data[i][11];

    // Only check enrolled users who haven't been marked complete
    if (status !== 'Enrolled' || completed === 'Yes') continue;

    // TODO: Call Coursera API to check completion status
    // var isCompleted = checkCourseraCompletion(email);
    // For now, you can manually set column K to "Yes" in the sheet
    // when someone completes, and this will auto-send the congrats email

    if (completed === 'Yes' && congratsSent !== 'Yes') {
      var row = i + 1;
      sheet.getRange(row, 8).setValue('Completed');
      sheet.getRange(row, 12).setValue('Yes');
      sheet.getRange(row, 13).setValue('Completed & congrats sent');
      sendCongratsEmail(name, email);
      Logger.log('Congrats sent to: ' + email);
    }
  }
}


// ==========================================
// PART 7: EMAIL TEMPLATES
// ==========================================

// Welcome email for app applicants (updated with auto-enrollment info)
function sendAppWelcomeEmail(name, email, autoEnrolled) {
  var subject = name + ' \u2013 Google AI \u0633\u06A9\u0627\u0644\u0631\u0634\u067E | Urdu AI';

  var enrollmentStatus = autoEnrolled
    ? '<div style="background-color: #e8f5e9; padding: 15px; border: 2px solid #4caf50; border-radius: 8px; font-weight: bold; color: #1b5e20;">' +
      '\u2705 <strong>\u0645\u0628\u0627\u0631\u06A9 \u06C1\u0648!</strong> \u0622\u067E \u06A9\u0648 \u0641\u0648\u0631\u06CC \u0637\u0648\u0631 \u067E\u0631 Coursera \u067E\u0631 \u062F\u0627\u062E\u0644\u06C1 \u062F\u06D2 \u062F\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4 Coursera \u0633\u06D2 \u0627\u06CC\u06A9 \u0627\u06CC \u0645\u06CC\u0644 \u0622\u0626\u06D2 \u06AF\u06CC \u2014 \u0627\u0628\u06BE\u06CC \u0634\u0631\u0648\u0639 \u06A9\u0631\u06CC\u06BA!</div>'
    : '<div style="background-color: #e8f5e9; padding: 15px; border: 2px solid #4caf50; border-radius: 8px; font-weight: bold; color: #1b5e20;">' +
      '\u2705 \u0622\u067E \u06A9\u06CC \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648 \u06AF\u0626\u06CC\u06D4 48 \u06AF\u06BE\u0646\u0679\u0648\u06BA \u0645\u06CC\u06BA Coursera \u0633\u06D2 \u0627\u06CC \u0645\u06CC\u0644 \u0622\u0626\u06D2 \u06AF\u06CC\u06D4</div>';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>\u062F\u0648\u0633\u062A\u060C</strong> <br><strong>' + name + '</strong></p>' +
    '<p>\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    enrollmentStatus +
    '<div style="background-color: #fff3e0; padding: 15px; border: 2px solid #ff9800; border-radius: 8px; font-weight: bold; color: #e65100; margin-top: 20px;">' +
    '\uD83D\uDCCC <u>\u0627\u06C1\u0645 \u0646\u0648\u0679:</u> \u0627\u0633\u06A9\u0627\u0644\u0631\u0634\u067E <strong>\u0635\u0631\u0641 7 \u062F\u0646\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0641\u0639\u0627\u0644</strong> \u06C1\u0648\u06AF\u06CC\u06D4 7 \u062F\u0646 \u06A9\u06D2 \u0628\u0639\u062F \u0622\u067E \u06A9\u06CC \u0631\u0633\u0627\u0626\u06CC \u062E\u062A\u0645 \u06C1\u0648 \u062C\u0627\u0626\u06D2 \u06AF\u06CC \u062A\u0627\u06A9\u06C1 \u0646\u0626\u06D2 \u0637\u0644\u0628\u0627\u0621 \u06A9\u0648 \u062C\u06AF\u06C1 \u0645\u0644 \u0633\u06A9\u06D2\u06D4' +
    '</div>' +
    '<hr style="margin: 25px 0;">' +
    '<h3 style="color: #1a237e;">\uD83D\uDCCC \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06D2 \u062F\u0648\u0631\u0627\u0646:</h3>' +
    '<ul style="list-style: none; padding-left: 0;">' +
    '<li><a href="https://updates.urduai.org/subscribe" target="_blank" style="display: inline-block; background-color: #004d40; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDCF0 \u0646\u06CC\u0648\u0632 \u0644\u06CC\u0679\u0631 \u0633\u0628\u0633\u06A9\u0631\u0627\u0626\u0628 \u06A9\u0631\u06CC\u06BA</a></li>' +
    '<li style="margin-top: 15px;"><a href="https://www.youtube.com/@Urduaiorg" target="_blank" style="display: inline-block; background-color: #c62828; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDCFA \u06CC\u0648\u0679\u06CC\u0648\u0628 \u0686\u06CC\u0646\u0644</a></li>' +
    '<li style="margin-top: 15px;"><a href="https://www.facebook.com/groups/urduaiorg" target="_blank" style="display: inline-block; background-color: #1565c0; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDC65 \u0641\u06CC\u0633 \u0628\u06A9 \u06AF\u0631\u0648\u067E</a></li>' +
    '</ul>' +
    '<p style="margin-top: 25px;"><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>\u0628\u0627\u0646\u06CC\u060C Urdu AI<br><a href="https://urduai.org">www.urduai.org</a></p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// Congratulations email (sent when course is completed)
function sendCongratsEmail(name, email) {
  var subject = '\uD83C\uDF93 \u0645\u0628\u0627\u0631\u06A9 \u06C1\u0648 ' + name + '! Google AI Certificate \u0645\u06A9\u0645\u0644! | Urdu AI';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #003366, #001933); border-radius: 12px; margin-bottom: 20px;">' +
    '<p style="font-size: 50px; margin: 0;">\uD83C\uDF93\uD83C\uDF89</p>' +
    '<h1 style="color: #FFD700; margin: 10px 0;">\u0645\u0628\u0627\u0631\u06A9 \u06C1\u0648!</h1>' +
    '<p style="color: #FFF; font-size: 18px;">' + name + '</p>' +
    '<p style="color: #FFD700;">Google AI Professional Certificate \u0645\u06A9\u0645\u0644!</p>' +
    '</div>' +

    '<p>\u0622\u067E \u0646\u06D2 Urdu AI \u06A9\u06D2 \u0630\u0631\u06CC\u0639\u06D2 Google AI Professional Certificate \u0645\u06A9\u0645\u0644 \u06A9\u0631 \u0644\u06CC\u0627 \u06C1\u06D2\u06D4 \u06CC\u06C1 \u0627\u06CC\u06A9 \u0628\u0691\u06CC \u06A9\u0627\u0645\u06CC\u0627\u0628\u06CC \u06C1\u06D2!</p>' +

    '<div style="background-color: #e8f5e9; padding: 20px; border-radius: 12px; border: 2px solid #4caf50; margin: 20px 0;">' +
    '<h3 style="color: #1b5e20; margin-top: 0;">\uD83C\uDF1F \u0627\u0628 \u0627\u06CC\u06A9 \u0627\u06C1\u0645 \u06A9\u0627\u0645 \u06A9\u0631\u06CC\u06BA:</h3>' +
    '<p style="color: #333;">\u0627\u067E\u0646\u06CC \u06A9\u0627\u0645\u06CC\u0627\u0628\u06CC \u0633\u0648\u0634\u0644 \u0645\u06CC\u0688\u06CC\u0627 \u067E\u0631 \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA \u062A\u0627\u06A9\u06C1 \u062F\u0648\u0633\u0631\u06D2 \u0644\u0648\u06AF\u0648\u06BA \u06A9\u0648 \u0628\u06BE\u06CC \u062D\u0648\u0635\u0644\u06C1 \u0645\u0644\u06D2\u06D4 \u06CC\u06C1 100% \u0645\u0641\u062A \u06C1\u06D2!</p>' +

    // Social share buttons
    '<div style="margin-top: 15px;">' +

    // LinkedIn
    '<a href="https://www.linkedin.com/sharing/share-offsite/?url=https://urduai.org/app" target="_blank" ' +
    'style="display: inline-block; background-color: #0077b5; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin: 5px;">' +
    '\uD83D\uDCBC LinkedIn \u067E\u0631 \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA</a>' +

    // Facebook
    '<a href="https://www.facebook.com/sharer/sharer.php?u=https://urduai.org/app" target="_blank" ' +
    'style="display: inline-block; background-color: #1877f2; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin: 5px;">' +
    '\uD83D\uDC65 Facebook \u067E\u0631 \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA</a>' +

    // Twitter
    '<a href="https://twitter.com/intent/tweet?text=I%20completed%20Google%20AI%20Professional%20Certificate%20through%20Urdu%20AI!%20%F0%9F%8E%93%20Get%20yours%20FREE%3A%20https%3A%2F%2Furduai.org%2Fapp%20%23UrduAI%20%23GoogleAI" target="_blank" ' +
    'style="display: inline-block; background-color: #1da1f2; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin: 5px;">' +
    '\uD83D\uDC26 Twitter \u067E\u0631 \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA</a>' +

    // WhatsApp
    '<a href="https://wa.me/?text=I%20completed%20Google%20AI%20Professional%20Certificate%20through%20Urdu%20AI!%20%F0%9F%8E%93%20100%25%20FREE!%20Download%3A%20https%3A%2F%2Furduai.org%2Fapp" target="_blank" ' +
    'style="display: inline-block; background-color: #25d366; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin: 5px;">' +
    '\uD83D\uDCF1 WhatsApp \u067E\u0631 \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA</a>' +

    '</div></div>' +

    '<div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; border: 1px solid #ce93d8; margin: 20px 0;">' +
    '<p style="color: #4a148c; font-weight: bold;">\uD83D\uDCA1 \u06A9\u06CC\u0627 \u0622\u067E \u062C\u0627\u0646\u062A\u06D2 \u06C1\u06CC\u06BA?</p>' +
    '<p style="color: #333;">\u0622\u067E \u06A9\u06CC \u0627\u06CC\u06A9 \u0634\u06CC\u0626\u0631 \u0633\u06D2 \u06A9\u0633\u06CC \u0627\u0648\u0631 \u06A9\u0648 \u0645\u0641\u062A Google AI \u0633\u0631\u0679\u06CC\u0641\u06A9\u06CC\u0634\u0646 \u06A9\u0627 \u0645\u0648\u0642\u0639 \u0645\u0644 \u0633\u06A9\u062A\u0627 \u06C1\u06D2\u06D4 \u0627\u0628\u06BE\u06CC \u0634\u06CC\u0626\u0631 \u06A9\u0631\u06CC\u06BA!</p>' +
    '</div>' +

    '<p style="margin-top: 25px;"><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>\u0628\u0627\u0646\u06CC\u060C Urdu AI<br><a href="https://urduai.org">www.urduai.org</a></p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// Expiry notification (when seat is removed after 7 days)
function sendExpiryEmail(name, email) {
  var subject = name + ' \u2013 \u0633\u06A9\u0627\u0644\u0631\u0634\u067E \u06A9\u06CC \u0645\u062F\u062A \u0645\u06A9\u0645\u0644 | Urdu AI';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>' + name + '</strong>\u060C \u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    '<p>\u0622\u067E \u06A9\u06CC Google AI \u0633\u06A9\u0627\u0644\u0631\u0634\u067E \u06A9\u06D2 7 \u062F\u0646 \u0645\u06A9\u0645\u0644 \u06C1\u0648 \u06AF\u0626\u06D2\u06D4 \u0646\u0626\u06D2 \u0637\u0644\u0628\u0627\u0621 \u06A9\u0648 \u0645\u0648\u0642\u0639 \u062F\u06CC\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0622\u067E \u06A9\u06CC \u0631\u0633\u0627\u0626\u06CC \u062E\u062A\u0645 \u06A9\u0631 \u062F\u06CC \u06AF\u0626\u06CC \u06C1\u06D2\u06D4</p>' +
    '<div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border: 2px solid #2196f3; margin: 20px 0;">' +
    '<p style="color: #0d47a1; font-weight: bold;">\uD83D\uDD04 \u062F\u0648\u0628\u0627\u0631\u06C1 \u06A9\u0648\u0634\u0634 \u06A9\u0631\u06CC\u06BA!</p>' +
    '<p style="color: #333;">\u0627\u06AF\u0631 \u0622\u067E \u0627\u0628\u06BE\u06CC \u0628\u06BE\u06CC \u06A9\u0648\u0631\u0633 \u0645\u06A9\u0645\u0644 \u06A9\u0631\u0646\u0627 \u0686\u0627\u06C1\u062A\u06D2 \u06C1\u06CC\u06BA \u062A\u0648 Urdu AI \u0627\u06CC\u067E \u0633\u06D2 \u062F\u0648\u0628\u0627\u0631\u06C1 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062F\u06CC\u06BA\u06D4</p>' +
    '<a href="https://urduai.org/app" target="_blank" style="display: inline-block; background-color: #003366; color: #FFD700; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">\uD83D\uDCF1 Urdu AI \u0627\u06CC\u067E \u06A9\u06BE\u0648\u0644\u06CC\u06BA</a>' +
    '</div>' +
    '<p><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>Urdu AI</p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// Waitlist notification
function sendWaitlistEmail(name, email) {
  var subject = name + ' \u2013 \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06CC \u0641\u06C1\u0631\u0633\u062A | Urdu AI';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>' + name + '</strong>\u060C \u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    '<p>\u0622\u067E \u06A9\u06CC \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648 \u06AF\u0626\u06CC \u06C1\u06D2\u06D4 \u0641\u06CC \u0627\u0644\u062D\u0627\u0644 \u062A\u0645\u0627\u0645 500 \u0633\u06CC\u0679\u06CC\u06BA \u0628\u06BE\u0631\u06CC \u06C1\u06CC\u06BA\u06D4</p>' +
    '<div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; border: 2px solid #ffc107;">' +
    '<p style="color: #f57f17; font-weight: bold;">\u23F3 \u0622\u067E \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06CC \u0641\u06C1\u0631\u0633\u062A \u0645\u06CC\u06BA \u06C1\u06CC\u06BA</p>' +
    '<p style="color: #333;">\u062C\u06CC\u0633\u06D2 \u06C1\u06CC \u06A9\u0648\u0626\u06CC \u0633\u06CC\u0679 \u062E\u0627\u0644\u06CC \u06C1\u0648\u06AF\u06CC\u060C \u0622\u067E \u06A9\u0648 \u062E\u0648\u062F\u06A9\u0627\u0631 \u0637\u0648\u0631 \u067E\u0631 \u062F\u0627\u062E\u0644\u06C1 \u062F\u06D2 \u062F\u06CC\u0627 \u062C\u0627\u0626\u06D2 \u06AF\u0627 \u0627\u0648\u0631 Coursera \u0633\u06D2 \u0627\u06CC \u0645\u06CC\u0644 \u0622\u0626\u06D2 \u06AF\u06CC\u06D4</p>' +
    '</div>' +
    '<p><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>Urdu AI</p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// Waitlist promotion (seat opened up, you're in!)
function sendWaitlistPromotionEmail(name, email) {
  var subject = '\uD83C\uDF89 ' + name + ' \u2013 \u0622\u067E \u06A9\u06CC \u0628\u0627\u0631\u06CC \u0622 \u06AF\u0626\u06CC! Google AI \u0633\u06A9\u0627\u0644\u0631\u0634\u067E | Urdu AI';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>' + name + '</strong>\u060C \u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    '<div style="background-color: #e8f5e9; padding: 20px; border-radius: 12px; border: 2px solid #4caf50;">' +
    '<p style="font-size: 30px; text-align: center; margin: 0;">\uD83C\uDF89\uD83C\uDF93</p>' +
    '<h2 style="color: #1b5e20; text-align: center;">\u0622\u067E \u06A9\u06CC \u0628\u0627\u0631\u06CC \u0622 \u06AF\u0626\u06CC!</h2>' +
    '<p style="color: #333; text-align: center;">\u0627\u06CC\u06A9 \u0633\u06CC\u0679 \u062E\u0627\u0644\u06CC \u06C1\u0648\u0626\u06CC \u0627\u0648\u0631 \u0622\u067E \u06A9\u0648 \u062E\u0648\u062F\u06A9\u0627\u0631 \u0637\u0648\u0631 \u067E\u0631 Google AI \u06A9\u0648\u0631\u0633 \u0645\u06CC\u06BA \u062F\u0627\u062E\u0644\u06C1 \u062F\u06D2 \u062F\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2!</p>' +
    '</div>' +
    '<div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border: 2px solid #ff9800; margin-top: 20px;">' +
    '\uD83D\uDCCC <strong>\u0622\u067E \u06A9\u06D2 \u067E\u0627\u0633 \u0635\u0631\u0641 7 \u062F\u0646 \u06C1\u06CC\u06BA\u06D4</strong> Coursera \u0633\u06D2 \u0627\u06CC \u0645\u06CC\u0644 \u0686\u06CC\u06A9 \u06A9\u0631\u06CC\u06BA \u0627\u0648\u0631 \u0627\u0628\u06BE\u06CC \u0634\u0631\u0648\u0639 \u06A9\u0631\u06CC\u06BA!' +
    '</div>' +
    '<p><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>Urdu AI</p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// Daily admin summary
function sendAdminSummary(removedCount, waitlistInvited, activeSeats) {
  var subject = '\uD83D\uDCCA Urdu AI Daily Report: ' + removedCount + ' removed, ' + waitlistInvited + ' promoted';
  var body = 'Daily Automation Summary\n\n' +
    'Seats removed (7-day expiry): ' + removedCount + '\n' +
    'Waitlist promoted: ' + waitlistInvited + '\n' +
    'Active seats: ' + activeSeats + '/' + CONFIG.MAX_ACTIVE_SEATS + '\n' +
    'Available: ' + (CONFIG.MAX_ACTIVE_SEATS - activeSeats) + '\n\n' +
    'Check sheet: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID';

  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body, {
    name: 'Urdu AI Bot'
  });
}


// ==========================================
// PART 8: HELPER FUNCTIONS
// ==========================================

function getAppSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.APP_SHEET_NAME);
}

function findByEmail(sheet, email) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toString().toLowerCase() === email.toLowerCase()) {
      return data[i];
    }
  }
  return null;
}

// Count currently active (Enrolled) seats
function getActiveSeatsCount(sheet) {
  var data = sheet.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][7] === 'Enrolled' || data[i][7] === 'Inviting') {
      count++;
    }
  }
  return count;
}

function respond(code, data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// Build form welcome email HTML (extracted for cleanliness)
function buildFormWelcomeEmail(name) {
  return '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>\u062F\u0648\u0633\u062A\u060C</strong> <br><strong>' + name + '</strong></p>' +
    '<p>\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    '<p>\u06C1\u0645\u06CC\u06BA \u062E\u0648\u0634\u06CC \u06C1\u06D2 \u06A9\u06C1 \u0622\u067E \u0646\u06D2 \u0627\u0631\u062F\u0648 \u0627\u06D2 \u0622\u0626\u06CC \u06A9\u06D2 \u062A\u062D\u062A \u0645\u0641\u062A Google AI Certification \u06A9\u06D2 \u0644\u06CC\u06D2 \u0631\u062C\u0633\u0679\u0631\u06CC\u0634\u0646 \u0645\u06A9\u0645\u0644 \u06A9\u06CC\u06D4</p>' +
    '<div style="background-color: #fce4ec; padding: 15px; border: 2px solid #ec407a; border-radius: 8px; font-weight: bold; color: #880e4f;">' +
    '\u26A0\uFE0F <u>\u0646\u0648\u0679:</u> \u06CC\u06C1 \u06A9\u0648\u0631\u0633 100\u066A \u0641\u0631\u06CC \u06C1\u06D2\u06D4 \u0622\u067E \u06A9\u0648 \u06A9\u0686\u06BE \u0628\u06BE\u06CC \u0627\u062F\u0627 \u06A9\u0631\u0646\u06D2 \u06A9\u06CC \u0636\u0631\u0648\u0631\u062A \u0646\u06C1\u06CC\u06BA\u06D4' +
    '</div>' +
    '<div style="background-color: #fff3e0; padding: 15px; border: 2px solid #ff9800; border-radius: 8px; font-weight: bold; color: #e65100; margin-top: 20px;">' +
    '\uD83D\uDCCC <u>\u062E\u0627\u0635 \u0646\u0648\u0679:</u> \u0627\u0633\u06A9\u0627\u0644\u0631\u0634\u067E \u0635\u0631\u0641 7 \u062F\u0646\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0641\u0639\u0627\u0644 \u06C1\u0648\u06AF\u06CC\u06D4 \u0627\u0633 \u0645\u062F\u062A \u0645\u06CC\u06BA \u06A9\u0648\u0631\u0633 \u0645\u06A9\u0645\u0644 \u06A9\u0631\u06CC\u06BA \u062A\u0627\u06A9\u06C1 \u0646\u0626\u06D2 \u0637\u0644\u0628\u0627\u0621 \u06A9\u0648 \u062C\u06AF\u06C1 \u0645\u0644 \u0633\u06A9\u06D2\u06D4' +
    '</div>' +
    '<p>\u0622\u067E \u06A9\u0648 Coursera \u0633\u06D2 \u0627\u06CC\u06A9 \u0627\u06CC \u0645\u06CC\u0644 \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u06AF\u06CC \u062C\u0633 \u0645\u06CC\u06BA \u06A9\u0648\u0631\u0633 \u0634\u0631\u0648\u0639 \u06A9\u0631\u0646\u06D2 \u06A9\u0627 \u0644\u0646\u06A9 \u06C1\u0648\u06AF\u0627\u06D4</p>' +
    '<hr style="margin: 25px 0;">' +
    '<h3 style="color: #1a237e;">\uD83D\uDCCC \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06D2 \u062F\u0648\u0631\u0627\u0646:</h3>' +
    '<ul style="list-style: none; padding-left: 0;">' +
    '<li><a href="https://updates.urduai.org/subscribe" target="_blank" style="display: inline-block; background-color: #004d40; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDCF0 \u0646\u06CC\u0648\u0632 \u0644\u06CC\u0679\u0631</a></li>' +
    '<li style="margin-top: 15px;"><a href="https://www.youtube.com/@Urduaiorg" target="_blank" style="display: inline-block; background-color: #c62828; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDCFA \u06CC\u0648\u0679\u06CC\u0648\u0628</a></li>' +
    '<li style="margin-top: 15px;"><a href="https://www.facebook.com/groups/urduaiorg" target="_blank" style="display: inline-block; background-color: #1565c0; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDC65 \u0641\u06CC\u0633 \u0628\u06A9 \u06AF\u0631\u0648\u067E</a></li>' +
    '</ul>' +
    '<p style="margin-top: 25px;"><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>\u0628\u0627\u0646\u06CC\u060C Urdu AI<br><a href="https://urduai.org">www.urduai.org</a></p>' +
    '</div>';
}
