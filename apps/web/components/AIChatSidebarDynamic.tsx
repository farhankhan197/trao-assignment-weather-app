'use client';

import dynamic from 'next/dynamic';

const AIChatSidebar = dynamic(() => import('./AIChatSidebar').then((mod) => mod.AIChatSidebar), {
  ssr: false,
});

export default function AIChatSidebarDynamic() {
  return <AIChatSidebar />;
}
