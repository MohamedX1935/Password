import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  description?: string;
}

export default function Card({ title, description, children }: CardProps) {
  return (
    <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40">
      {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
      {description && <p className="text-sm text-slate-300">{description}</p>}
      <div className="mt-3 space-y-2 text-slate-100">{children}</div>
    </section>
  );
}
