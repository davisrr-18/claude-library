import Crumbs from '../../components/Crumbs/Crumbs.jsx';
import TierSection from '../../components/TierSection/TierSection.jsx';

/** Página de um nível: a mesma faixa da Home, com o nível como h1 e os cards como h2. */
export default function Tier({ tier, entries, tab, onTab }) {
  return (
    <>
      <Crumbs items={[{ label: 'Início', href: '#/' }, { label: tier.title }]} />
      <TierSection
        tier={tier}
        entries={entries}
        tab={tab}
        onTab={onTab}
        heading={1}
        cardHeading={2}
        link={false}
      />
    </>
  );
}
