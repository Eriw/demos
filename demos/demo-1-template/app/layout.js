import './globals.css';

export const metadata = {
  title: 'Demo',
  description: 'A Claude Code demo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
