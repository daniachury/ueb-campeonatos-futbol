import { REGLAS_CONTRASENA } from '@shared/usuarios/reglas-registro-jugador';
import estilos from './IndicadorDeContrasena.module.css';

interface ReglaDeContrasena {
  nombreCorto: string;
  descripcion: string;
  seCumple: boolean;
}

function evaluarReglasDeContrasena(contrasena: string): ReglaDeContrasena[] {
  return [
    {
      nombreCorto: `${REGLAS_CONTRASENA.longitudMinima}+`,
      descripcion: `${REGLAS_CONTRASENA.longitudMinima} o más caracteres`,
      seCumple: contrasena.length >= REGLAS_CONTRASENA.longitudMinima,
    },
    {
      nombreCorto: 'letra',
      descripcion: 'una letra',
      seCumple: REGLAS_CONTRASENA.patronAlMenosUnaLetra.test(contrasena),
    },
    {
      nombreCorto: 'número',
      descripcion: 'un número',
      seCumple: REGLAS_CONTRASENA.patronAlMenosUnNumero.test(contrasena),
    },
  ];
}

interface PropiedadesIndicadorDeContrasena {
  id: string;
  contrasena: string;
}

/** Tres barras que se encienden a medida que la contraseña cumple cada regla. */
export function IndicadorDeContrasena({ id, contrasena }: PropiedadesIndicadorDeContrasena) {
  const reglas = evaluarReglasDeContrasena(contrasena);
  const cantidadDeReglasCumplidas = reglas.filter((regla) => regla.seCumple).length;
  const cumpleTodas = cantidadDeReglasCumplidas === reglas.length;

  return (
    <div id={id} className={estilos.indicador}>
      {reglas.map((regla) => (
        <span
          key={regla.nombreCorto}
          aria-hidden="true"
          className={regla.seCumple ? `${estilos.barra} ${estilos.barraEncendida}` : estilos.barra}
        />
      ))}
      <span
        aria-hidden="true"
        className={cumpleTodas ? `${estilos.texto} ${estilos.textoCompleto}` : estilos.texto}
      >
        {reglas.map((regla) => regla.nombreCorto).join(' · ')}
      </span>
      <span className="solo-lectores">
        Debe tener {reglas.map((regla) => regla.descripcion).join(', ')}. Cumple{' '}
        {cantidadDeReglasCumplidas} de {reglas.length}.
      </span>
    </div>
  );
}
