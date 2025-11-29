import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../utils/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ProBank - Professional Online Banking System',
  description: 'Your secure and reliable online banking solution.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
