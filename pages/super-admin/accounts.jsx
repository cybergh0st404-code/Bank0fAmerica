import AdminAccountsPage from '../admin/accounts';

export default AdminAccountsPage;

export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.cookies?.session_token;
  const { verifySessionToken } = await import('../../lib/security.js');
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return {
      notFound: true,
    };
  }

  if (session.role === 'admin') {
    return {
      redirect: {
        destination: '/admin/accounts',
        permanent: false,
      },
    };
  }

  if (session.role !== 'superadmin') {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
}

