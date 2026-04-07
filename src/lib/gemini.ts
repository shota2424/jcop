// ============================================================
// JCOP v4.0 - Gemini API Wrapper
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedEvent } from './types';

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());

// ---------- Parse text from LINE message ----------
export async function parseTextToEvent(text: string): Promise<ParsedEvent[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
あなたはイベントスケジュール抽出AIです。
以下のテキストからイベント情報を抽出し、JSON配列として返してください。

出力形式:
[
  {
    "title": "イベント名",
    "dateTime": "YYYY-MM-DDTHH:mm:ss",
    "location": "場所",
    "category": "カテゴリ（例会、委員会、理事会、研修、懇親会、その他）",
    "detail": "詳細情報"
  }
]

ルール:
- 日時が明確でない場合は、推測してください
- 年が不明な場合は、直近の未来の日付を使ってください
- 複数のイベントがある場合はすべて抽出してください
- イベントが見つからない場合は空配列を返してください
- JSON以外のテキストは出力しないでください

テキスト:
${text}
`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as ParsedEvent[];
  } catch {
    console.error('Failed to parse Gemini response:', response);
    return [];
  }
}

// ---------- Parse file (PDF/Image) to events ----------
export async function parseFileToEvents(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedEvent[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
あなたはイベントスケジュール抽出AIです。
添付されたファイル（${fileName}）からすべてのイベント・スケジュール情報を抽出し、JSON配列として返してください。

出力形式:
[
  {
    "title": "イベント名",
    "dateTime": "YYYY-MM-DDTHH:mm:ss",
    "location": "場所",
    "category": "カテゴリ（例会、委員会、理事会、研修、懇親会、その他）",
    "detail": "詳細情報"
  }
]

ルール:
- すべての日程を漏れなく抽出してください
- 日時が部分的にしか記載されていない場合（例: 3月10日のみ）は、時刻を00:00:00としてください
- 年が不明な場合は、2026年として扱ってください
- カテゴリは内容から推測してください
- JSON以外のテキストは出力しないでください
`;

  const base64Data = fileBuffer.toString('base64');
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
  ]);

  const response = result.response.text();
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as ParsedEvent[];
  } catch {
    console.error('Failed to parse Gemini response:', response);
    return [];
  }
}

// ---------- Generate agenda content ----------
export async function generateAgendaContent(
  templateText: string,
  eventData: {
    title: string;
    date: string;
    attendeeCount: number;
    totalMembers: number;
    bills: { title: string; status: string }[];
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
以下の会議アジェンダテンプレートに、最新のデータを流し込んでください。

テンプレート:
${templateText}

流し込むデータ:
- 会議タイトル: ${eventData.title}
- 開催日: ${eventData.date}
- 出席予定人数: ${eventData.attendeeCount} / ${eventData.totalMembers}
- 上程議案一覧:
${eventData.bills.map((b, i) => `  ${i + 1}. ${b.title}（${b.status}）`).join('\n')}

テンプレートの書式を維持しながら、データを適切な箇所に挿入してください。
テンプレート以外の余計なテキストは追加しないでください。
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
