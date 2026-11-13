import AdminTransactionsPage from '../admin/transactions';

export default AdminTransactionsPage;

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
        destination: '/admin/transactions',
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

