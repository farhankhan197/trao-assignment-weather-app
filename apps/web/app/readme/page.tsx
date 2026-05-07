import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function ReadmePage() {
  // Read the root README.md at build/request time
  const readmePath = join(process.cwd(), '..', '..', 'README.md');
  let content: string;
  try {
    content = readFileSync(readmePath, 'utf-8');
  } catch {
    content = '# README not found';
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-3xl mx-auto bg-[var(--bg-glass)] backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xl p-8 md:p-12">
        <article className="readme-content text-[var(--text-primary)] text-sm md:text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
