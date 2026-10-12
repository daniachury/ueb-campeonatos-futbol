export interface PartidoDelFixture { localId: string; visitanteId: string; jornada: number; }

export function crearFixture(equipos: string[]): PartidoDelFixture[] {
  const lista = [...equipos];
  if (lista.length % 2 !== 0) lista.push('DESCANSA');
  const partidos: PartidoDelFixture[] = [];
  const jornadas = lista.length - 1;
  for (let jornada = 0; jornada < jornadas; jornada += 1) {
    for (let indice = 0; indice < lista.length / 2; indice += 1) {
      const local = lista[indice]; const visitante = lista[lista.length - 1 - indice];
      if (local !== 'DESCANSA' && visitante !== 'DESCANSA') partidos.push({ localId: local, visitanteId: visitante, jornada: jornada + 1 });
    }
    const ultimo = lista.pop();
    if (ultimo) lista.splice(1, 0, ultimo);
  }
  return partidos;
}
