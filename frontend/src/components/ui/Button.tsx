import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon';
import {
  buttonClasses,
  iconSizeFor,
  type ButtonSize,
  type ButtonVariant,
  type IconPosition,
} from './button-styles';

interface BaseButtonProps {
  /** Texto visible del botón. Puede omitirse si es solo icono y se pasa aria-label. */
  label?: ReactNode;
  /** Nombre del icono dentro de /icons.svg */
  icon?: string;
  iconPosition?: IconPosition;
  /** Clase extra para el icono (por ejemplo para rotarlo) */
  iconClass?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { href?: undefined };

type ButtonAsLink = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

type PropsInternas = BaseButtonProps & {
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
  [key: string]: unknown;
};

export default function Button(props: ButtonProps) {
  const {
    label,
    icon,
    iconPosition = 'left',
    iconClass = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    href,
    target,
    rel,
    ...rest
  } = props as PropsInternas;

  const clases = buttonClasses({ variant, size, fullWidth, className });
  const claseIcono = [iconSizeFor(size), iconClass].filter(Boolean).join(' ');

  const contenido = (
    <>
      {icon && iconPosition === 'left' && <Icon name={icon} className={claseIcono} />}
      {label}
      {icon && iconPosition === 'right' && <Icon name={icon} className={claseIcono} />}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={clases}
        {...(rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {contenido}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={clases}
      {...(rest as unknown as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {contenido}
    </button>
  );
}
