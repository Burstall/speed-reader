'use client';

import { useState } from 'react';
import { TextInput } from './TextInput';
import { PdfUpload } from './PdfUpload';
import { UrlInput } from './UrlInput';

type TabId = 'text' | 'pdf' | 'url';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'pdf',
    label: 'PDF',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'url',
    label: 'URL',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

export function ContentTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('text');

  return (
    <div className="flex flex-col gap-4">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium
              border-b-2 transition-colors -mb-px
              ${activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'text' && <TextInput />}
        {activeTab === 'pdf' && <PdfUpload />}
        {activeTab === 'url' && <UrlInput />}
      </div>
    </div>
  );
}
