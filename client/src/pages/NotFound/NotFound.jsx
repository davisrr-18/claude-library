import Button from '../../components/Button/Button.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import Icon from '../../components/Icon/Icon.jsx';

export default function NotFound() {
  return (
    <EmptyState
      icon={<Icon name="search" size={28} />}
      title="Página não encontrada"
      headingLevel={1}
      action={<Button href="#/">Voltar ao início</Button>}
    >
      O endereço não existe ou o card foi movido.
    </EmptyState>
  );
}
