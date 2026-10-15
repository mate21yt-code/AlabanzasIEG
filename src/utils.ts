// src/utils.ts
export function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes.map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    if (!isNaN(fecha.getTime())) {
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      };
      const formateado = new Intl.DateTimeFormat('es-AR', opciones).format(fecha);
      return formateado.charAt(0).toUpperCase() + formateado.slice(1);
    }
  }
  return fechaStr;
}