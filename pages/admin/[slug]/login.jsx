export async function getServerSideProps(context) {
  const { slug } = context.params;
  const { getAdminSecretSlug } = await import('../../../lib/security.js');
  const configuredSlug = getAdminSecretSlug();

  if (!configuredSlug || !slug || slug !== configuredSlug) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: `/super-admin/${slug}/login`,
      permanent: false,
    },
  };
}

export default function LegacyAdminSlugLogin() {
  return null;
}
