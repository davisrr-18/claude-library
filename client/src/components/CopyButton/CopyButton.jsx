import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import { copyText } from './copyText.js';

const RESULT_MS = 1800;

/** Botão que copia `getText()` e mostra o resultado por 1,8 s (anunciado por aria-live). */
export default function CopyButton({ label, getText, ariaLabel, className }) {
  const [result, setResult] = useState(null); // null | 'ok' | 'fail'
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    setResult((await copyText(getText())) ? 'ok' : 'fail');
    clearTimeout(timer.current); // clique duplo não encurta o aviso
    timer.current = setTimeout(() => setResult(null), RESULT_MS);
  };
  const [icon, text] =
    result === 'ok'
      ? ['check', 'Copiado!']
      : result === 'fail'
        ? ['x', 'Não foi possível copiar']
        : ['copy', label];

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      aria-live="polite"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
      <span>{text}</span>
    </Button>
  );
}
