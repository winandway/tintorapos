const DESTINOS: Record<string, string> = {
  app: "/app",
  dos_pasos: "/entrar/dos-pasos",
  dos_pasos_activar: "/entrar/activar-dos-pasos",
  cambiar_clave: "/entrar/cambiar-clave",
};

export function destinoSiguiente(siguiente: string): string {
  return DESTINOS[siguiente] ?? "/app";
}
