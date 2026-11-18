/**
 * Efecto "máquina de escribir" para textos del hero.
 *
 * Marca los elementos con data-escribe="titulo" | "parrafo" | "boton" y
 * llama a escribir(contenedor). Se escriben en el orden en que aparecen:
 * - titulo / parrafo: letra por letra.
 * - boton: la caja del botón se despliega mientras se teclea su texto.
 * Cada tipo tiene una duración fija (DURACION), sin importar cuántas letras
 * tenga: toda la secuencia dura ~1.3 s.
 *
 * Accesible: cada elemento conserva su texto completo para lectores de
 * pantalla (copia sr-only); las letras sueltas van con aria-hidden.
 * Sin JS se ve el texto normal; con "reducir movimiento" aparece de golpe.
 * Estilos: .escribe-* en src/styles/global.css.
 */

type Tipo = 'titulo' | 'parrafo' | 'boton';

/** ms que tarda en escribirse cada elemento según su tipo. */
const DURACION: Record<Tipo, number> = {
  titulo: 380,
  parrafo: 340,
  boton: 90,
};
const PAUSA_ENTRE = 30; // ms entre un elemento y el siguiente

const dormir = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const cuadro = () => new Promise<number>((r) => requestAnimationFrame(r));

/** Parte los nodos de texto en <span class="escribe-letra"> agrupadas por palabra. */
function partir(el: HTMLElement): HTMLElement[] {
  const letras: HTMLElement[] = [];
  const texto = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const nodos: Text[] = [];
  const recorrido = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (recorrido.nextNode()) nodos.push(recorrido.currentNode as Text);

  for (const nodo of nodos) {
    if (!nodo.data.trim()) continue;
    const frag = document.createDocumentFragment();
    nodo.data.split(/(\s+)/).forEach((trozo) => {
      if (!trozo) return;
      if (/^\s+$/.test(trozo)) {
        frag.append(document.createTextNode(' '));
        return;
      }
      const palabra = document.createElement('span');
      palabra.className = 'escribe-palabra';
      palabra.setAttribute('aria-hidden', 'true');
      for (const c of trozo) {
        const letra = document.createElement('span');
        letra.className = 'escribe-letra';
        letra.textContent = c;
        palabra.append(letra);
        letras.push(letra);
      }
      frag.append(palabra);
    });
    nodo.replaceWith(frag);
  }
  const copia = document.createElement('span');
  copia.className = 'sr-only';
  copia.textContent = texto;
  el.append(copia);
  return letras;
}

export async function escribir(contenedor: HTMLElement) {
  const elementos = [...contenedor.querySelectorAll<HTMLElement>('[data-escribe]')];
  if (!elementos.length) return;
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const partes = elementos.map((el) => ({ el, tipo: (el.dataset.escribe || 'parrafo') as Tipo, letras: partir(el) }));
  contenedor.classList.add('escribe-listo'); // ya se pueden mostrar (las letras siguen ocultas)

  if (quieto) {
    partes.forEach(({ el, letras }) => {
      letras.forEach((l) => l.classList.add('is-on'));
      el.classList.add('escribe-visto', 'escribe-fin');
    });
    return;
  }

  for (const { el, tipo, letras } of partes) {
    el.classList.add('escribe-visto');
    /* Las letras se revelan en proporción al tiempo transcurrido (por cuadro),
       así la duración es exacta aunque haya muchas letras. */
    const duracion = DURACION[tipo];
    const inicio = await cuadro();
    let mostradas = 0;
    while (mostradas < letras.length) {
      const ahora = await cuadro();
      const meta = Math.min(letras.length, Math.ceil(((ahora - inicio) / duracion) * letras.length));
      for (; mostradas < meta; mostradas++) letras[mostradas].classList.add('is-on');
    }
    el.classList.add('escribe-fin'); // muestra iconos, etc.
    await dormir(PAUSA_ENTRE);
  }
}
