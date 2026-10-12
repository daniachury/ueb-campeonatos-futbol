import { useState, type FormEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import type { SedeResumen } from '../../../../shared/sedes/contrato-sedes';
import estilos from './ModalSede.module.css';

interface ModalSedeProps {
  estaAbierto: boolean;
  sedeEditar?: SedeResumen | null;
  estaCargando?: boolean;
  errorExterno?: string | null;
  alGuardar: (datos: {
    nombre: string;
    direccion: string;
    ciudad: string;
    indicaciones?: string;
  }) => Promise<void>;
  alCerrar: () => void;
}

export function ModalSede({
  estaAbierto,
  sedeEditar,
  estaCargando = false,
  errorExterno,
  alGuardar,
  alCerrar,
}: ModalSedeProps) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('Bogotá');
  const [indicaciones, setIndicaciones] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [estabaAbierto, setEstabaAbierto] = useState(estaAbierto);
  const [sedeAnterior, setSedeAnterior] = useState(sedeEditar);

  if (estaAbierto !== estabaAbierto || sedeEditar !== sedeAnterior) {
    setEstabaAbierto(estaAbierto);
    setSedeAnterior(sedeEditar);
    if (estaAbierto) {
      if (sedeEditar) {
        setNombre(sedeEditar.nombre);
        setDireccion(sedeEditar.direccion);
        setCiudad(sedeEditar.ciudad);
        setIndicaciones(sedeEditar.indicaciones ?? '');
      } else {
        setNombre('');
        setDireccion('');
        setCiudad('Bogotá');
        setIndicaciones('');
      }
      setErrorLocal(null);
    }
  }

  if (!estaAbierto) return null;

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorLocal(null);

    if (nombre.trim().length < 3 || nombre.trim().length > 80) {
      setErrorLocal('El nombre de la sede debe tener entre 3 y 80 caracteres');
      return;
    }
    if (direccion.trim().length < 5 || direccion.trim().length > 150) {
      setErrorLocal('La dirección debe tener entre 5 y 150 caracteres');
      return;
    }
    if (ciudad.trim().length < 2 || ciudad.trim().length > 60) {
      setErrorLocal('La ciudad debe tener entre 2 y 60 caracteres');
      return;
    }
    if (indicaciones.trim().length > 300) {
      setErrorLocal('Las indicaciones no pueden superar 300 caracteres');
      return;
    }

    try {
      await alGuardar({
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        indicaciones: indicaciones.trim() ? indicaciones.trim() : undefined,
      });
    } catch (err: unknown) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al guardar la sede');
    }
  }

  const errorMostrar = errorExterno || errorLocal;

  return (
    <div className={estilos.fondo} role="dialog" aria-modal="true">
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 className={estilos.titulo}>
            {sedeEditar ? 'Editar Sede' : 'Nueva Sede'}
          </h2>
        </div>

        <form onSubmit={manejarSubmit} className={estilos.formulario}>
          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-nombre-sede" className={estilos.etiqueta}>
              Nombre de la sede *
            </label>
            <input
              id="campo-nombre-sede"
              className={estilos.campo}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Complejo El Bosque"
              required
            />
          </div>

          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-direccion-sede" className={estilos.etiqueta}>
              Dirección *
            </label>
            <input
              id="campo-direccion-sede"
              className={estilos.campo}
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Av. Cra 9 # 131A-02"
              required
            />
          </div>

          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-ciudad-sede" className={estilos.etiqueta}>
              Ciudad *
            </label>
            <input
              id="campo-ciudad-sede"
              className={estilos.campo}
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Bogotá"
              required
            />
          </div>

          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-indicaciones-sede" className={estilos.etiqueta}>
              Indicaciones (opcional)
            </label>
            <textarea
              id="campo-indicaciones-sede"
              className={`${estilos.campo} ${estilos.areaTexto}`}
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Ej. Entrada por la portería norte vehicular"
            />
          </div>

          {errorMostrar && <p className={estilos.error}>{errorMostrar}</p>}

          <div className={estilos.pie}>
            <Boton
              tipo="button"
              variante="secundario"
              tamano="mediano"
              anchoCompleto={false}
              estaDeshabilitado={estaCargando}
              alPulsar={alCerrar}
            >
              Cancelar
            </Boton>
            <Boton
              tipo="submit"
              variante="principal"
              tamano="mediano"
              anchoCompleto={false}
              estaCargando={estaCargando}
            >
              Guardar sede
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
