// On viuen les dades de la botiga.
//   supabase → base de dades a Supabase (la web pot estar en un allotjament estàtic)
//   local    → servidor Node d'aquest ordinador (node fundicat/server.js), per provar
// La clau "publishable" és pública: la seguretat la posen les regles de la base de dades.
// Mai no hi posis la clau secreta (sb_secret_… / service_role).
window.FUNDICAT_BACKEND = {
  type: 'supabase',
  url: 'https://njdshoqawgssbouogfuy.supabase.co',
  key: 'sb_publishable_Figw53QZVqD8OwiVUWQ3wg_DVZ30Zni',
};
