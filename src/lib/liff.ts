// ============================================================
// JCOP v4.0 - LINE LIFF SDK Helper (Client-side only)
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import type { Liff } from '@line/liff';

export function useLiff() {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    import('@line/liff')
      .then((liffModule) => {
        const liffInstance = liffModule.default;
        liffInstance
          .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' })
          .then(() => {
            setLiff(liffInstance);
            setIsReady(true);
          })
          .catch((err: Error) => {
            setError(err.message);
          });
      })
      .catch((err: Error) => {
        setError(`LIFF SDK load failed: ${err.message}`);
      });
  }, []);

  return { liff, error, isReady };
}

// ---------- Build Flex Message for attendance reminder ----------
export function buildAttendanceFlexMessage(
  eventTitle: string,
  eventDate: string,
  unrespondedNames: string[],
  liffUrl: string
) {
  const nameList = unrespondedNames.map((n) => `@${n}`).join(' ');

  return {
    type: 'flex' as const,
    altText: `【出欠確認】${eventTitle}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 出欠確認リマインド',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
          },
        ],
        backgroundColor: '#3b82f6',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: eventTitle,
            weight: 'bold',
            size: 'md',
            wrap: true,
          },
          {
            type: 'text',
            text: `📅 ${eventDate}`,
            size: 'sm',
            color: '#666666',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'text',
            text: '以下の方、出欠未回答です！',
            size: 'sm',
            color: '#ef4444',
            margin: 'lg',
            weight: 'bold',
          },
          {
            type: 'text',
            text: nameList,
            size: 'sm',
            color: '#333333',
            wrap: true,
            margin: 'md',
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '今すぐ回答する',
              uri: liffUrl,
            },
            style: 'primary',
            color: '#3b82f6',
          },
        ],
        paddingAll: '12px',
      },
    },
  };
}
