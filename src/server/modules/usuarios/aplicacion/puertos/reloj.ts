/** Puerto: dice qué fecha y hora es. Existe para que las pruebas puedan fijar el tiempo. */
export interface Reloj {
  ahora(): Date;
}
