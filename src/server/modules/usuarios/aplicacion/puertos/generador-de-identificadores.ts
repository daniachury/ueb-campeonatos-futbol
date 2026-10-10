/** Puerto: entrega un identificador único para cada usuario nuevo. */
export interface GeneradorDeIdentificadores {
  generar(): string;
}
