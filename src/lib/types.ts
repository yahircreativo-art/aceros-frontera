export interface Producto {
  slug: string;
  sku?: string;
  nombre: string;
  marca?: string;
  categoria: string;
  precio?: number;
  precioAnterior?: number;
  rating: number;
  reviews: number;
  stock?: number;
  envioGratis: boolean;
  destacado: boolean;
  imagen: string;
  etiquetas: string[];
  resumen: string;
  especificaciones?: Record<string, string>;
}
