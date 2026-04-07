// ============================================================
// JCOP v4.0 - Google Apps Script: LINE Webhook
// ============================================================
// このスクリプトをGoogle Spreadsheetの「拡張機能 > Apps Script」に貼り付けてください。
// デプロイ後、LINE Developers ConsoleのWebhook URLに設定します。
//
// 機能:
// 1. LINEグループに投稿されたメッセージを受信
// 2. JCOP API（Next.js）にテキストを送信してAI解析
// 3. 解析されたイベント情報を自動でスプレッドシートに登録

// ---- 設定 ----
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';
const JCOP_API_BASE_URL = 'https://your-jcop-app.vercel.app';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

/**
 * LINE Webhookのエンドポイント
 * LINEからのPOSTリクエストを処理する
 */
function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    const events = json.events;
    
    for (const event of events) {
      // テキストメッセージのみ処理
      if (event.type === 'message' && event.message.type === 'text') {
        processTextMessage(event);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * テキストメッセージを処理
 * 「#登録」で始まるメッセージをAI解析にかける
 */
function processTextMessage(event) {
  const text = event.message.text;
  
  // 「#登録」コマンドで始まるメッセージのみ処理
  if (!text.startsWith('#登録')) {
    return;
  }
  
  const messageBody = text.replace('#登録', '').trim();
  if (!messageBody) {
    replyMessage(event.replyToken, '登録するイベント情報を入力してください。\n\n例:\n#登録\n第1回例会のご案内\n日時：5月15日 19:00〜\n場所：市民交流センター');
    return;
  }
  
  // JCOP APIでAI解析
  try {
    const response = UrlFetchApp.fetch(JCOP_API_BASE_URL + '/api/ai/parse-text', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: messageBody }),
      muteHttpExceptions: true,
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success && result.data && result.data.length > 0) {
      // 各イベントをスプレッドシートに登録
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('events');
      let registeredCount = 0;
      
      for (const parsedEvent of result.data) {
        const eventId = 'EVT-' + Date.now() + '-' + registeredCount;
        sheet.appendRow([
          eventId,
          parsedEvent.title || '',
          parsedEvent.dateTime || '',
          parsedEvent.location || '',
          parsedEvent.category || 'その他',
          parsedEvent.detail || '',
          '', // documentUrl
        ]);
        registeredCount++;
      }
      
      // 結果を返信
      const titles = result.data.map(function(e) { return '✅ ' + e.title; }).join('\n');
      replyMessage(event.replyToken, 
        '📋 ' + registeredCount + '件のイベントを登録しました！\n\n' + titles
      );
    } else {
      replyMessage(event.replyToken, '⚠️ イベント情報を抽出できませんでした。\nもう少し詳しく入力してみてください。');
    }
  } catch (error) {
    console.error('AI parse error:', error);
    replyMessage(event.replyToken, '❌ 処理中にエラーが発生しました。\n管理者に連絡してください。');
  }
}

/**
 * LINEに返信メッセージを送信
 */
function replyMessage(replyToken, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,
    },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }],
    }),
  });
}
