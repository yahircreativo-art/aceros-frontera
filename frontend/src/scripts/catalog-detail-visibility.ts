const actualizarVisibilidadDetalle = (detalle: boolean) => {
  document.querySelectorAll<HTMLElement>('[data-hide-on-product-detail]').forEach((elemento) => {
    elemento.classList.toggle('hidden', detalle);
  });

  document.querySelectorAll<HTMLElement>('[data-product-detail-layout]').forEach((elemento) => {
    const clasesNormales = elemento.dataset.productDetailLayout?.split(/\s+/).filter(Boolean) ?? [];
    const clasesCompactas =
      elemento.dataset.productDetailCompact?.split(/\s+/).filter(Boolean) ?? [];

    clasesNormales.forEach((clase) => elemento.classList.toggle(clase, !detalle));
    clasesCompactas.forEach((clase) => elemento.classList.toggle(clase, detalle));
  });
};

const sincronizarConUrl = () =>
  actualizarVisibilidadDetalle(new URL(window.location.href).searchParams.has('producto'));

window.addEventListener('catalog-product-detail', () => actualizarVisibilidadDetalle(true));
window.addEventListener('catalog-product-close', () => actualizarVisibilidadDetalle(false));
window.addEventListener('catalog-reset', sincronizarConUrl);
window.addEventListener('popstate', sincronizarConUrl);
sincronizarConUrl();
