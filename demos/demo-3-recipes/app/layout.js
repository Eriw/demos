import './globals.css';

export const metadata = {
  title: 'Receptbok',
  description: 'Välj ett recept och bocka av ingredienser och steg',
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
