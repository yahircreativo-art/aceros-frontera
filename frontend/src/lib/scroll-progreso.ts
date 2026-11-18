/**
 * Progreso de scroll de un elemento como variable CSS --p (0 → 1).
 *
 * modo "paso":   0 cuando el borde superior entra por abajo de la pantalla,
 *                1 cuando el borde inferior sale por arriba.
 * modo "fijo":   para secciones altas con un hijo sticky: 0 cuando la
 *                sección toca el borde superior, 1 cuando termina.
 * modo "entrada": 0 cuando entra por abajo, 1 cuando su centro llega al
 *                centro de la pantalla (útil para "armar" algo al llegar).
 *
 * Solo calcula mientras el elemento está en pantalla. Con "reducir
 * movimiento" deja --p en 1 y no escucha el scroll.
 */
type Modo = 'paso' | 'fijo' | 'entrada';

export function progresoScroll(el: HTMLElement, modo: Modo = 'paso', alCambiar?: (p: number) => void) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.setProperty('--p', '1');
    alCambiar?.(1);
    return;
  }
  let visible = false;
  let pendiente = false;

  const calcular = () => {
    pendiente = false;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    let p: number;
    if (modo === 'fijo') p = -r.top / Math.max(1, r.height - vh);
    else if (modo === 'entrada') p = (vh - r.top) / Math.max(1, vh / 2 + r.height / 2);
    else p = (vh - r.top) / (vh + r.height);
    p = Math.min(1, Math.max(0, p));
    el.style.setProperty('--p', p.toFixed(4));
    alCambiar?.(p);
  };
  const programar = () => {
    if (!visible || pendiente) return;
    pendiente = true;
    requestAnimationFrame(calcular);
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    programar();
  }).observe(el);
  window.addEventListener('scroll', programar, { passive: true });
  window.addEventListener('resize', programar);
  calcular();
}

/** Añade .is-visible a los elementos cuando entran en pantalla (una sola vez). */
export function alAparecer(elementos: Iterable<Element>, umbral = 0.25, alVer?: (el: Element) => void) {
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-visible');
        alVer?.(e.target);
        obs.unobserve(e.target);
      }
    },
    { threshold: umbral },
  );
  for (const el of elementos) obs.observe(el);
}

/** Cuenta de 0 al número de data-cuenta (respeta sufijos en el HTML). */
export function contar(el: HTMLElement, duracion = 1400) {
  const fin = Number(el.dataset.cuenta);
  if (!Number.isFinite(fin) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now();
  const tic = (t: number) => {
    const p = Math.min(1, (t - t0) / duracion);
    el.textContent = String(Math.round(fin * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tic);
  };
  el.textContent = '0';
  requestAnimationFrame(tic);
}
