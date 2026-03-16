import { MarketingNav } from '@/app/components/marketing-nav'

type Entry = {
  version: string
  date: string
  tag: 'new' | 'improvement' | 'fix'
  changes: string[]
}

const CHANGELOG: Entry[] = [
  {
    version: '0.5.0',
    date: 'March 15, 2026',
    tag: 'new',
    changes: [
      'Added status labels to documents (Draft, In Progress, Review, Done)',
      'Added Recently Viewed row on the home dashboard',
      'Recently viewed titles resolve live from current state after renames',
      'Redesigned landing page with scroll-aware collapsing nav',
      'Added infinite feature keyword slider to landing page',
      'Added Changelog page',
    ],
  },
  {
    version: '0.4.0',
    date: 'March 10, 2026',
    tag: 'new',
    changes: [
      'Added pinning for documents and folders with star button',
      'Added sort controls (Updated, Name, Created)',
      'Added filter controls (All, Folders, Docs)',
      'Added grid and list view toggle',
      'Pinned items shown in a dedicated section above all items',
      'Hover panel on folders now updates live during drag-and-drop',
    ],
  },
  {
    version: '0.3.0',
    date: 'March 5, 2026',
    tag: 'new',
    changes: [
      'Added drag-and-drop to move documents and folders',
      'Added folder hover panel showing contents on hover',
      'Folder hover panel previews dragged item before drop',
      'Added Rename and Duplicate to document context menu',
      'Nav back/forward buttons now refresh page data',
    ],
  },
  {
    version: '0.2.0',
    date: 'February 28, 2026',
    tag: 'new',
    changes: [
      'Added nested folder support with breadcrumb navigation',
      'Added block editor with slash commands',
      'Supported block types: Text, Heading 1–3, Bullet List, Numbered List, Quote, Code',
      'Added global search palette (⌘K) for documents and folders',
      'Added sidebar with recent documents and folder tree',
    ],
  },
  {
    version: '0.1.0',
    date: 'February 20, 2026',
    tag: 'new',
    changes: [
      'Initial release',
      'User authentication via Supabase (email + Google OAuth)',
      'Create, rename, and delete documents and folders',
      'Document editor with editable title',
      'Home dashboard with folder and document cards',
    ],
  },
]

const tagStyles = {
  new: 'text-primary bg-primary/10',
  improvement: 'text-highlight bg-highlight/10',
  fix: 'text-green-400 bg-green-400/10',
}

const tagLabels = {
  new: 'New',
  improvement: 'Improvement',
  fix: 'Fix',
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-secondary text-white">
      <MarketingNav />

      <div className="max-w-2xl mx-auto px-8 pt-32 pb-24">
        {/* Header */}
        <p className="font-ui text-sm text-primary tracking-[0.5em] uppercase mb-4">What&apos;s new</p>
        <h1 className="font-display text-8xl text-white mb-2">CHANGELOG</h1>
        <div className="h-1.5 w-32 bg-highlight mb-10" />
        <p className="font-ui text-lg text-white/40 mb-16">
          Every release, every fix, every feature — tracked here.
        </p>

        {/* Entries */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-white/8" />

          <div className="flex flex-col gap-14">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="pl-8 relative">
                {/* Timeline dot */}
                <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-primary/60" />

                {/* Version + date */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-3xl text-white tracking-widest">{entry.version}</span>
                  <span className={`font-ui text-sm px-2 py-0.5 rounded ${tagStyles[entry.tag]}`}>
                    {tagLabels[entry.tag]}
                  </span>
                  <span className="font-ui text-sm text-white/25 ml-auto">{entry.date}</span>
                </div>

                {/* Changes */}
                <ul className="flex flex-col gap-2">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3 font-ui text-lg text-white/60">
                      <span className="mt-2 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between">
        <span className="font-display text-xl text-white/20 tracking-widest">AEGIS</span>
        <span className="font-ui text-xs text-white/20 tracking-[0.3em] uppercase">2026</span>
      </footer>
    </div>
  )
}
