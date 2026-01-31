import '../app/globals.css';
import { AuthProvider } from '../utils/AuthContext';
import RouteLoading from '../components/RouteLoading';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <RouteLoading />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
