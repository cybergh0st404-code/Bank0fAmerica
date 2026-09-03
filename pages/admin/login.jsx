// Route disabled for security.
// Only the secret slug route is allowed for administrator access.
export default function AdminLoginDisabled() {
  return null;
}

export async function getServerSideProps() {
  return {
    notFound: true,
  };
}
