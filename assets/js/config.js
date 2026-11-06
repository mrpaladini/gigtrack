/* GigTrack — configuração pública do site (gigtrack.com.br)
 *
 * Estes valores são PÚBLICOS por natureza: a chave "publishable" do Supabase só dá acesso ao que
 * as regras de segurança (RLS) do banco permitem. Nunca coloque aqui a chave "secret"/service_role.
 */
window.GIGTRACK_CONFIG = {
  SUPABASE_URL: 'https://ttaxdkoaecxomsagnoxu.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_cE5rMGnVRh-j5U2pfHqPKQ_7anYnpf_',

  // Endpoint PHP que busca a cifra no Cifra Club (roda na própria Hostinger).
  CIFRA_API: '/api/cifra.php'
};
