// ==========================================
// Urdu AI — Google Scholarship Apps Script (COMBINED)
// ==========================================
//
// This script handles BOTH:
// 1. Google Form submissions → welcome email (existing, on Form_Responses1 tab)
// 2. App registrations → new tab (AppRegistrations)
//
// HOW TO SET UP:
// 1. Open your Google Sheet (the one linked to Google Form)
// 2. Create a new tab called "AppRegistrations"
// 3. In Row 1 of AppRegistrations, add these headers:
//    A: Timestamp | B: Full Name | C: Email | D: City | E: Phone
//    F: Source | G: Device ID | H: Status | I: Enrolled Date | J: Notes
// 4. Go to Extensions → Apps Script
// 5. REPLACE all existing code with this entire file
// 6. Click Save
// 7. Deploy → Manage Deployments → pencil → New version → Deploy
//    (Or if first time: Deploy → New Deployment → Web App → Execute as Me → Anyone)
// 8. Copy the URL and give it to Antigravity
//
// IMPORTANT: Your existing form trigger stays the same.
// Go to Triggers (clock icon) and make sure
// "sendWelcomeEmailOnFormSubmit" is set to run on "Form Submit"
// ==========================================

// ⚙️ CONFIGURATION
const CONFIG = {
  APP_SHEET_NAME: 'AppRegistrations',    // New tab for app registrations
  API_KEY: 'URAI-SCHOLARSHIP-2026',
  MAX_SPOTS_PER_WEEK: 500,              // Change this anytime — app auto-adjusts
  ADMIN_EMAIL: 'qaisar.roonjha@gmail.com',
  SENDER_NAME: 'Qaisar Roonjha from Urdu AI',
  REPLY_TO: 'ai@urduai.org'
};

// ==========================================
// PART 1: GOOGLE FORM — Welcome Email (EXISTING)
// Trigger: On Form Submit
// ==========================================
function sendWelcomeEmailOnFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = e.range.getRow();
  const name = sheet.getRange(row, 2).getValue();     // Column B
  const email = sheet.getRange(row, 4).getValue();     // Column D
  const statusCell = sheet.getRange(row, 16);          // Column P

  if (!email.includes("@") || !email.includes(".")) {
    statusCell.setValue("Invalid Email");
    return;
  }

  const subject = `${name} – گوگل سرٹیفکیٹ | Urdu AI`;
  const htmlMessage = `
    <div style="direction: rtl; font-family: 'Noto Nastaliq Urdu', Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">
      <p><strong>دوست،</strong> <br><strong>${name}</strong></p>
      <p>السلام علیکم!</p>
      <p>ہمیں خوشی ہے کہ آپ نے اردو اے آئی کے تحت <strong>مفت Google AI Certification</strong> کے لیے رجسٹریشن مکمل کی۔ آپ کی معلومات ہمیں موصول ہو چکی ہیں۔</p>
      <div style="background-color: #fce4ec; padding: 15px; border: 2px solid #ec407a; border-radius: 8px; font-weight: bold; color: #880e4f;">
        ⚠️ <u>نوٹ:</u> یہ کورس مکمل طور پر <strong>100٪ فری</strong> فراہم کیا جا رہا ہے۔ آپ کو کچھ بھی ادا کرنے کی ضرورت نہیں۔
      </div>
      <div style="background-color: #fff3e0; padding: 15px; border: 2px solid #ff9800; border-radius: 8px; font-weight: bold; color: #e65100; margin-top: 20px;">
        📌 <u>خاص نوٹ:</u> اگر آپ اسکالرشپ کے ذریعے داخلہ حاصل کرتے ہیں، تو برائے مہربانی یاد رکھیں کہ:
        <br><br>
        <strong>یہ اسکالرشپ صرف 5 دنوں کے لیے فعال ہوگی</strong>۔ اگر آپ نے اس مدت میں کورس مکمل نہیں کیا تو آپ کا اسکالرشپ لنک غیر فعال ہو جائے گا۔
        <br><br>
        <em>وجہ:</em> ہمارے پاس ہزاروں نئے درخواست دہندگان موجود ہیں جو انتظار میں ہیں۔ ہم ان افراد کو ترجیح دے رہے ہیں جو تیزی سے مکمل کر سکیں، تاکہ ہم مزید نئے طلباء کو دعوت دے سکیں۔
      </div>
      <p>ہماری ٹیم آپ کی رجسٹریشن کا جائزہ لے گی۔ اگر آپ کو اسکالرشپ کے لیے منتخب کیا گیا تو آپ کو <strong>Coursera</strong> کی جانب سے ایک ای میل موصول ہوگی، جس میں کورس شروع کرنے کا لنک ہوگا۔</p>
      <p>یہ ایک مقبول اسکالرشپ ہے — اگر آپ کو اسکالرشپ مل جائے، تو براہ کرم کورس کو جلد از جلد مکمل کریں تاکہ نئی رجسٹریشنز کے لیے جگہ بن سکے۔</p>
      <hr style="margin: 25px 0;">
      <h3 style="color: #1a237e;">📌 انتظار کے دوران آپ یہ تین کام ضرور کریں:</h3>
      <ul style="list-style: none; padding-left: 0;">
        <li>
          <p style="font-weight: bold;">📥 اردو اے آئی نیوز لیٹر کے لیے سبسکرائب کریں:</p>
          <p>اگر آپ چاہتے ہیں کہ اے آئی کی دُنیا سے کوئی بھی خبر، فری ٹولز یا گائیڈز آپ سے مِس نہ ہوں، تو نیچے دیے گئے لنک پر سبسکرائب کریں:</p>
          <a href="https://updates.urduai.org/subscribe" target="_blank" style="display: inline-block; background-color: #004d40; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">📰 اردو اے آئی نیوز لیٹر حاصل کریں</a>
        </li>
        <li style="margin-top: 15px;">
          <a href="https://www.youtube.com/@Urduaiorg" target="_blank" style="display: inline-block; background-color: #c62828; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">📺 ہمارا یوٹیوب چینل دیکھیں</a>
        </li>
        <li style="margin-top: 15px;">
          <a href="https://www.facebook.com/groups/urduaiorg" target="_blank" style="display: inline-block; background-color: #1565c0; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">👥 ہمارا فیس بک گروپ جوائن کریں</a>
        </li>
      </ul>
      <p style="margin-top: 25px;">آپ کا اردو اے آئی کمیونٹی میں خیرمقدم ہے — جہاں ہم اپنی زبان میں سیکھتے ہیں، آگے بڑھتے ہیں، اور دوسروں کو بھی ساتھ لے کر چلتے ہیں۔</p>
      <p><strong>دعاؤں کے ساتھ،</strong><br>قیصر رونجھا<br>بانی، Urdu AI | @UrduAiOrg<br><a href="https://urduai.org" target="_blank">www.urduai.org</a></p>
    </div>
  `;

  const options = {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage,
  };

  try {
    MailApp.sendEmail(email, subject, '', options);
    statusCell.setValue("Sent");
  } catch (error) {
    statusCell.setValue("Error");
    Logger.log("Email sending failed: " + error);
  }
}

// ==========================================
// PART 2: APP REGISTRATION — POST endpoint
// Receives scholarship applications from the Urdu AI app
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.apiKey !== CONFIG.API_KEY) {
      return respond(401, { error: 'Unauthorized' });
    }

    var sheet = getAppSheet();
    if (!sheet) {
      return respond(500, { error: 'AppRegistrations tab not found. Please create it.' });
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

    // Add new application to AppRegistrations tab
    sheet.appendRow([
      new Date().toISOString(),       // A: Timestamp
      data.fullName || '',            // B: Full Name
      data.email || '',               // C: Email
      data.city || '',                // D: City
      data.phone || '',               // E: Phone
      'App',                          // F: Source (App vs Form)
      data.deviceId || '',            // G: Device ID
      'Pending',                      // H: Status (Pending / Enrolled / Expired)
      '',                             // I: Enrolled Date
      ''                              // J: Notes
    ]);

    // Send welcome email to app applicant
    try {
      sendAppWelcomeEmail(data.fullName, data.email);
    } catch (emailErr) {
      Logger.log('App welcome email error: ' + emailErr.message);
    }

    return respond(200, {
      success: true,
      message: 'Application received! You will get access within 48 hours.',
      messageUr: '\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644! \u0622\u067E \u06A9\u0648 48 \u06AF\u06BE\u0646\u0679\u0648\u06BA \u0645\u06CC\u06BA \u0631\u0633\u0627\u0626\u06CC \u0645\u0644 \u062C\u0627\u0626\u06D2 \u06AF\u06CC\u06D4'
    });

  } catch (error) {
    Logger.log('doPost error: ' + error.message);
    return respond(500, { error: error.message });
  }
}

// ==========================================
// PART 3: APP QUERIES — GET endpoint
// ?action=spots          → remaining spots + total (for smart counter)
// ?action=check&email=x  → check if already applied
// ?action=stats&key=x    → admin stats
// ==========================================
function doGet(e) {
  var action = e.parameter.action;
  var callback = e.parameter.callback || null;

  // Smart spots counter: ?action=spots
  // Returns spotsRemaining + totalSpots so the app can calculate % automatically
  // Works whether MAX_SPOTS_PER_WEEK is 500, 1000, or 5000
  if (action === 'spots') {
    var sheet = getAppSheet();
    if (!sheet) {
      return respond(200, { spotsRemaining: CONFIG.MAX_SPOTS_PER_WEEK, totalSpots: CONFIG.MAX_SPOTS_PER_WEEK }, callback);
    }
    var spotsUsed = getWeeklySpotsUsed(sheet);
    var remaining = Math.max(0, CONFIG.MAX_SPOTS_PER_WEEK - spotsUsed);
    return respond(200, {
      spotsRemaining: remaining,
      totalSpots: CONFIG.MAX_SPOTS_PER_WEEK,
      weekOf: getWeekStart().toISOString()
    }, callback);
  }

  // Check if email already applied: ?action=check&email=xxx
  if (action === 'check') {
    var sheet = getAppSheet();
    if (!sheet) {
      return respond(200, { applied: false, error: 'Sheet not ready' }, callback);
    }
    var email = e.parameter.email;
    var existing = findByEmail(sheet, email);
    return respond(200, {
      applied: !!existing,
      appliedDate: existing ? existing[0] : null,
      status: existing ? existing[7] : null
    }, callback);
  }

  // Stats (admin only): ?action=stats&key=API_KEY
  if (action === 'stats' && e.parameter.key === CONFIG.API_KEY) {
    var sheet = getAppSheet();
    if (!sheet) {
      return respond(200, { error: 'AppRegistrations tab not found' }, callback);
    }
    var data = sheet.getDataRange().getValues();
    var total = data.length - 1;
    var enrolled = 0, pending = 0;
    for (var i = 1; i <= total; i++) {
      if (data[i][7] === 'Enrolled') enrolled++;
      if (data[i][7] === 'Pending') pending++;
    }
    return respond(200, {
      totalApplications: total,
      enrolled: enrolled,
      pending: pending,
      spotsRemaining: Math.max(0, CONFIG.MAX_SPOTS_PER_WEEK - getWeeklySpotsUsed(sheet)),
      weekOf: getWeekStart().toISOString()
    }, callback);
  }

  // Default — proves the script is alive
  return respond(200, {
    service: 'Urdu AI Google Scholarship Registration',
    status: 'active'
  }, callback);
}

// ==========================================
// WELCOME EMAIL FOR APP APPLICANTS
// Same style as form email but adapted for app users
// ==========================================
function sendAppWelcomeEmail(name, email) {
  var subject = name + ' \u2013 \u06AF\u0648\u06AF\u0644 AI \u0633\u06A9\u0627\u0644\u0631\u0634\u067E \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644 | Urdu AI';

  var htmlMessage = '<div style="direction: rtl; font-family: Noto Nastaliq Urdu, Tahoma, Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 16px;">' +
    '<p><strong>\u062F\u0648\u0633\u062A\u060C</strong> <br><strong>' + name + '</strong></p>' +
    '<p>\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645!</p>' +
    '<p>\u0645\u0628\u0627\u0631\u06A9 \u06C1\u0648! \u0622\u067E \u0646\u06D2 <strong>Urdu AI Master Class</strong> \u0645\u06A9\u0645\u0644 \u06A9\u0631 \u06A9\u06D2 Google AI Certification \u06A9\u06D2 \u0644\u06CC\u06D2 \u0627\u06C1\u0644\u06CC\u062A \u062D\u0627\u0635\u0644 \u06A9\u0631 \u0644\u06CC \u06C1\u06D2\u06D4 \u0622\u067E \u06A9\u06CC \u0633\u06A9\u0627\u0644\u0631\u0634\u067E \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648 \u06AF\u0626\u06CC \u06C1\u06D2\u06D4</p>' +
    '<div style="background-color: #e8f5e9; padding: 15px; border: 2px solid #4caf50; border-radius: 8px; font-weight: bold; color: #1b5e20;">' +
    '\u2705 \u0622\u067E \u06A9\u0648 Urdu AI \u0627\u06CC\u067E \u0633\u06D2 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062F\u06CC\u0646\u06D2 \u06A9\u06CC \u0648\u062C\u06C1 \u0633\u06D2 <strong>\u062A\u0631\u062C\u06CC\u062D\u06CC \u0631\u0633\u0627\u0626\u06CC</strong> \u062F\u06CC \u062C\u0627\u0626\u06D2 \u06AF\u06CC\u06D4' +
    '</div>' +
    '<div style="background-color: #fff3e0; padding: 15px; border: 2px solid #ff9800; border-radius: 8px; font-weight: bold; color: #e65100; margin-top: 20px;">' +
    '\uD83D\uDCCC <u>\u062E\u0627\u0635 \u0646\u0648\u0679:</u> \u0627\u0633\u06A9\u0627\u0644\u0631\u0634\u067E <strong>\u0635\u0631\u0641 5 \u062F\u0646\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0641\u0639\u0627\u0644</strong> \u06C1\u0648\u06AF\u06CC\u06D4 \u0627\u0633 \u0645\u062F\u062A \u0645\u06CC\u06BA \u06A9\u0648\u0631\u0633 \u0645\u06A9\u0645\u0644 \u06A9\u0631\u06CC\u06BA \u062A\u0627\u06A9\u06C1 \u0646\u0626\u06D2 \u0637\u0644\u0628\u0627\u0621 \u06A9\u0648 \u062C\u06AF\u06C1 \u0645\u0644 \u0633\u06A9\u06D2\u06D4' +
    '</div>' +
    '<p>\u0622\u067E \u06A9\u0648 <strong>48 \u06AF\u06BE\u0646\u0679\u0648\u06BA</strong> \u0645\u06CC\u06BA Coursera \u0633\u06D2 \u0627\u06CC\u06A9 \u0627\u06CC \u0645\u06CC\u0644 \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u06AF\u06CC \u062C\u0633 \u0645\u06CC\u06BA \u06A9\u0648\u0631\u0633 \u0634\u0631\u0648\u0639 \u06A9\u0631\u0646\u06D2 \u06A9\u0627 \u0644\u0646\u06A9 \u06C1\u0648\u06AF\u0627\u06D4</p>' +
    '<hr style="margin: 25px 0;">' +
    '<h3 style="color: #1a237e;">\uD83D\uDCCC \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u06D2 \u062F\u0648\u0631\u0627\u0646:</h3>' +
    '<ul style="list-style: none; padding-left: 0;">' +
    '<li>' +
    '<a href="https://updates.urduai.org/subscribe" target="_blank" style="display: inline-block; background-color: #004d40; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">\uD83D\uDCF0 \u0627\u0631\u062F\u0648 \u0627\u06D2 \u0622\u0626\u06CC \u0646\u06CC\u0648\u0632 \u0644\u06CC\u0679\u0631 \u062D\u0627\u0635\u0644 \u06A9\u0631\u06CC\u06BA</a>' +
    '</li>' +
    '<li style="margin-top: 15px;">' +
    '<a href="https://www.youtube.com/@Urduaiorg" target="_blank" style="display: inline-block; background-color: #c62828; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDCFA \u06C1\u0645\u0627\u0631\u0627 \u06CC\u0648\u0679\u06CC\u0648\u0628 \u0686\u06CC\u0646\u0644 \u062F\u06CC\u06A9\u06BE\u06CC\u06BA</a>' +
    '</li>' +
    '<li style="margin-top: 15px;">' +
    '<a href="https://www.facebook.com/groups/urduaiorg" target="_blank" style="display: inline-block; background-color: #1565c0; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none;">\uD83D\uDC65 \u06C1\u0645\u0627\u0631\u0627 \u0641\u06CC\u0633 \u0628\u06A9 \u06AF\u0631\u0648\u067E \u062C\u0648\u0627\u0626\u0646 \u06A9\u0631\u06CC\u06BA</a>' +
    '</li>' +
    '</ul>' +
    '<p style="margin-top: 25px;"><strong>\u062F\u0639\u0627\u0624\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE\u060C</strong><br>\u0642\u06CC\u0635\u0631 \u0631\u0648\u0646\u062C\u06BE\u0627<br>\u0628\u0627\u0646\u06CC\u060C Urdu AI | @UrduAiOrg<br><a href="https://urduai.org" target="_blank">www.urduai.org</a></p>' +
    '</div>';

  MailApp.sendEmail(email, subject, '', {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlMessage
  });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Safe getter — returns null instead of crashing if tab doesn't exist
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

// Weekly spots tracking — counts registrations since Monday
function getWeekStart() {
  var now = new Date();
  var day = now.getDay(); // 0=Sun, 1=Mon...
  var diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  var weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  return weekStart;
}

function getWeeklySpotsUsed(sheet) {
  var weekStart = getWeekStart();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var count = 0;
  for (var i = 0; i < timestamps.length; i++) {
    var ts = new Date(timestamps[i][0]);
    if (ts >= weekStart) {
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
