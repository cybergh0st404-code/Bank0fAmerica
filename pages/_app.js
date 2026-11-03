import '../app/globals.css';
import { AuthProvider } from '../utils/AuthContext';
import RouteLoading from '../components/RouteLoading';
import InactivityTracker from '../components/InactivityTracker';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <RouteLoading />
      <InactivityTracker />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
