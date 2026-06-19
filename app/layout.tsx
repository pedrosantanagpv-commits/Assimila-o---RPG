import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Assimilação Tracking',
  description: 'Controle de pontos e alocações de conflitos do Assimilação RPG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
