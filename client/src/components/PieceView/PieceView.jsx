import { useId } from 'react';
import { usePieceText } from '../../hooks/usePieceText.js';
import { parseFrontMatter, pieceDescription } from '../../utils/content.js';
import { installFile } from '../../utils/install.js';
import Callout from '../Callout/Callout.jsx';
import CopyButton from '../CopyButton/CopyButton.jsx';
import InstallPanel from '../InstallPanel/InstallPanel.jsx';
import Markdown from '../Markdown/Markdown.jsx';
import Skeleton from '../Skeleton/Skeleton.jsx';
import styles from './PieceView.module.css';

/**
 * Uma peça: cabeçalho (título com nível `headingLevel`, nome, descrição, Copiar), instalação pelo terminal e texto.
 * Falha ao carregar vira aviso só nesta peça, sem derrubar as outras.
 */
export default function PieceView({ piece, headingLevel = 2 }) {
  const headId = useId();
  const state = usePieceText(piece.file);

  if (state.status === 'loading') return <Skeleton />;
  if (state.status === 'error') {
    return (
      <section className={styles.piece}>
        <Callout kind="error">{`Não foi possível carregar "${piece.file}": ${state.error.message}`}</Callout>
      </section>
    );
  }

  const { meta, body } = parseFrontMatter(state.text);
  const description = pieceDescription(meta);
  const toInstall = installFile(piece, meta, body);
  const Heading = `h${headingLevel}`;

  return (
    <section className={styles.piece} aria-labelledby={headId}>
      <div className={`${styles.head} anim-rise`}>
        <div>
          <Heading id={headId}>{piece.title}</Heading>
          {meta.name && meta.name !== piece.title && <code className={styles.name}>{meta.name}</code>}
          {description && <p>{description}</p>}
        </div>
        <CopyButton
          label="Copiar peça"
          getText={() => state.text}
          ariaLabel={`Copiar peça: ${piece.title}`}
          className={styles.copy}
        />
      </div>
      {toInstall && (
        <InstallPanel
          summary={`${toInstall.append ? 'Acrescentar a' : 'Salvar'} "${toInstall.path}" pelo terminal`}
          files={[toInstall]}
        />
      )}
      <Markdown body={body} titles={[piece.title, meta.name]} />
    </section>
  );
}
