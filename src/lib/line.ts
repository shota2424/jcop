// ============================================================
// JCOP v4.0 - LINE Messaging API Helper
// ============================================================

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

// ---------- Send push message to group ----------
export async function sendPushMessage(
  to: string, // groupId or userId
  messages: Record<string, unknown>[]
): Promise<boolean> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to, messages }),
    });
    return res.ok;
  } catch (err) {
    console.error('LINE push message failed:', err);
    return false;
  }
}

// ---------- Get group member count ----------
export async function getGroupMemberCount(groupId: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/group/${groupId}/members/count`,
      {
        headers: {
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}

// ---------- Build text mention message ----------
export function buildMentionText(
  names: string[],
  eventTitle: string
): string {
  const mentions = names.map((n) => `@${n}`).join(' ');
  return `📋 【出欠リマインド】\n\n${eventTitle}\n\n${mentions}\n\n出欠が未回答です！\n下記のリンクから回答をお願いします 🙏`;
}
