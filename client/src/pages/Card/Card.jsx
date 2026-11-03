import { useInstallFiles } from '../../hooks/useInstallFiles.js';
import { plural, tierHref, tierLevel } from '../../utils/format.js';
import { groupPiecesByType } from '../../utils/tabs.js';
import Callout from '../../components/Callout/Callout.jsx';
import CardAside from '../../components/CardAside/CardAside.jsx';
import CardHero from '../../components/CardHero/CardHero.jsx';
import Crumbs from '../../components/Crumbs/Crumbs.jsx';
import InstallPanel from '../../components/InstallPanel/InstallPanel.jsx';
import Pager from '../../components/Pager/Pager.jsx';
import PieceTabs from '../../components/PieceTabs/PieceTabs.jsx';
import PieceView from '../../components/PieceView/PieceView.jsx';
import styles from './Card.module.css';

/** Página de um card: cabeçalho, abas por tipo de peça, as peças do tipo escolhido e a navegação entre cards. */
export default function Card({ tier, card, activeType }) {
  const { files: installFiles, failed: installFailed } = useInstallFiles(card);
  const groups = groupPiecesByType(card.pieces);
  const current = groups.find((g) => g.type === activeType) || groups[0];
  const siblings = tier.cards;
  const at = siblings.findIndex((c) => c.id === card.id);
  const prev = siblings[at - 1];
  const next = siblings[at + 1];
  const hasAside = siblings.length > 1;

  return (
    <>
      <Crumbs
        items={[
          { label: 'Início', href: '#/' },
          { label: tier.title, href: tierHref(tier.id) },
          { label: card.title },
        ]}
      />
      <CardHero tier={tier} level={tierLevel(tier.id)} card={card} />
      <div className={`${styles.layout} ${hasAside ? styles.hasAside : ''}`.trim()}>
        <div className={styles.main}>
          {/* Pacote com 2 ou mais arquivos instaláveis: um bloco que instala todos de uma vez. */}
          {installFiles.length >= 2 && (
            <div className={styles.install}>
              <InstallPanel
                summary={`Instalar o pacote inteiro pelo terminal (${installFiles.length} arquivos)`}
                files={installFiles}
              />
            </div>
          )}
          {installFailed > 0 && (
            <Callout kind="error">{`${plural(installFailed, ['peça do pacote não carregou', 'peças do pacote não carregaram'])}: a instalação pelo terminal pode estar incompleta.`}</Callout>
          )}
          {groups.length > 0 && <PieceTabs tier={tier} card={card} groups={groups} current={current} />}
          {card.pieces.length ? (
            <div className={styles.panel}>
              {current.pieces.map((p) => (
                <PieceView key={p.file} piece={p} headingLevel={2} />
              ))}
            </div>
          ) : (
            <Callout>Este card ainda não tem peças.</Callout>
          )}
          {(prev || next) && <Pager tier={tier} prev={prev} next={next} />}
        </div>
        {hasAside && <CardAside tier={tier} cards={siblings} currentId={card.id} />}
      </div>
    </>
  );
}
