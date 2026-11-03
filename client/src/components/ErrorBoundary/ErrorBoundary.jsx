import { Component } from 'react';
import Callout from '../Callout/Callout.jsx';

/** Se uma tela quebrar ao renderizar, mostra o aviso no lugar dela (o topo e a navegação continuam). Use `key` para limpar ao trocar de rota. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) return <Callout kind="error">{`Erro ao exibir a página: ${error.message}`}</Callout>;
    return this.props.children;
  }
}
