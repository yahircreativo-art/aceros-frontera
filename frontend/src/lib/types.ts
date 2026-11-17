export interface Producto {
  slug: string;
  clave: string;
  nombre: string;
  categoria: string;
  imagen: string;
  linkEditado?: string;
  sku?: string;
  marca?: string;
  precio?: number;
  precioAnterior?: number;
  rating?: number;
  reviews?: number;
  stock?: number | boolean;
  envioGratis?: boolean;
  destacado?: boolean;
  etiquetas?: string[];
  resumen?: string;
  especificaciones?: Record<string, string>;
}
