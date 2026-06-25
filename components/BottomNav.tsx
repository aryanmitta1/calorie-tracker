'use client';

export type Tab = 'today' | 'add' | 'history';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '◎' },
  { id: 'add', label: 'Add Food', icon: '＋' },
  { id: 'history', label: 'History', icon: '📊' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-[#0f0f0f]/95 backdrop-blur border-t border-zinc-800">
      <div className="max-w-sm mx-auto flex">
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:scale-95 ${
                isActive ? 'text-blue-400' : 'text-zinc-600'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
