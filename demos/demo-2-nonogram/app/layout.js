import './globals.css';

export const metadata = {
  title: 'Nonogram',
  description: 'A Picross / Nonogram puzzle game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
