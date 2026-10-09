import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="pagina">
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe.</p>
      <Link to="/torneos">Volver a los torneos</Link>
    </section>
  );
}
