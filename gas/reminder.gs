// ============================================================
// JCOP v4.0 - Google Apps Script: Reminder
// ============================================================
// このスクリプトをGoogle Spreadsheetの「拡張機能 > Apps Script」に貼り付けてください。
// トリガーで毎日自動実行させることで、リマインドを自動化できます。
//
// 設定方法:
// 1. Apps Script エディタで「トリガー」を開く
// 2. 「トリガーを追加」→ sendDailyReminders を選択
// 3. 「時間ベースのトリガー」→ 「日タイマー」→ 午前9時〜10時 に設定

// ---- 設定 ----
const REMINDER_LINE_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';
const REMINDER_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const REMINDER_GROUP_ID = 'YOUR_LINE_GROUP_ID'; // LINEグループID
const REMINDER_LIFF_URL = 'https://liff.line.me/YOUR_LIFF_ID';
const REMINDER_DAYS_BEFORE = 3; // イベントの何日前からリマインドするか

/**
 * 毎日実行: 直近イベントの未回答者にリマインド
 */
function sendDailyReminders() {
  const ss = SpreadsheetApp.openById(REMINDER_SPREADSHEET_ID);
  const eventsSheet = ss.getSheetByName('events');
  const attendancesSheet = ss.getSheetByName('attendances');
  const membersSheet = ss.getSheetByName('members');
  
  // 全データ取得
  const eventsData = eventsSheet.getDataRange().getValues();
  const attendancesData = attendancesSheet.getDataRange().getValues();
  const membersData = membersSheet.getDataRange().getValues();
  
  // ヘッダー行を除外
  const events = eventsData.slice(1);
  const attendances = attendancesData.slice(1);
  const members = membersData.slice(1);
  
  const now = new Date();
  const reminderThreshold = new Date();
  reminderThreshold.setDate(now.getDate() + REMINDER_DAYS_BEFORE);
  
  for (const eventRow of events) {
    const eventId = eventRow[0];
    const eventTitle = eventRow[1];
    const eventDate = new Date(eventRow[2]);
    
    // 直近のイベントかチェック
    if (eventDate < now || eventDate > reminderThreshold) continue;
    
    // そのイベントに回答済みのメール一覧
    const respondedEmails = new Set();
    for (const att of attendances) {
      if (att[0] === eventId) {
        respondedEmails.add(att[1]);
      }
    }
    
    // 未回答メンバーを特定
    const unresponded = [];
    for (const member of members) {
      const email = member[1];
      const lineName = member[4] || member[0];
      if (!respondedEmails.has(email)) {
        unresponded.push(lineName);
      }
    }
    
    if (unresponded.length === 0) continue;
    
    // Flex Messageでリマインド送信
    const formattedDate = Utilities.formatDate(eventDate, 'Asia/Tokyo', 'M月d日(E) HH:mm');
    const mentionNames = unresponded.map(function(n) { return '@' + n; }).join(' ');
    
    const flexMessage = {
      type: 'flex',
      altText: '【出欠リマインド】' + eventTitle,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '📋 出欠リマインド', weight: 'bold', size: 'lg', color: '#FFFFFF' }
          ],
          backgroundColor: '#3b82f6',
          paddingAll: '16px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: eventTitle, weight: 'bold', size: 'md', wrap: true },
            { type: 'text', text: '📅 ' + formattedDate, size: 'sm', color: '#666666', margin: 'md' },
            { type: 'separator', margin: 'lg' },
            { type: 'text', text: '以下の方、出欠未回答です！', size: 'sm', color: '#ef4444', margin: 'lg', weight: 'bold' },
            { type: 'text', text: mentionNames, size: 'sm', color: '#333333', wrap: true, margin: 'md' },
            { type: 'text', text: '未回答: ' + unresponded.length + '名', size: 'xs', color: '#999999', margin: 'md' }
          ],
          paddingAll: '16px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: { type: 'uri', label: '今すぐ回答する', uri: REMINDER_LIFF_URL },
              style: 'primary',
              color: '#3b82f6'
            }
          ],
          paddingAll: '12px'
        }
      }
    };
    
    // LINEグループに送信
    sendLineMessage(REMINDER_GROUP_ID, [flexMessage]);
    
    // ログ
    console.log('Reminder sent for: ' + eventTitle + ' (' + unresponded.length + ' unresponded)');
  }
}

/**
 * LINE Messaging APIでメッセージを送信
 */
function sendLineMessage(to, messages) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + REMINDER_LINE_TOKEN,
    },
    payload: JSON.stringify({
      to: to,
      messages: messages,
    }),
    muteHttpExceptions: true,
  });
}

/**
 * テスト用: 手動でリマインドを送信
 */
function testReminder() {
  sendDailyReminders();
}
