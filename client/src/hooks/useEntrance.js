import { createContext, useContext } from 'react';

/** Função que encerra a fase de entrada: o que for recriado depois (busca, filtro, aba) não repete a animação. */
export const EndEntranceContext = createContext(() => {});
export const useEndEntrance = () => useContext(EndEntranceContext);
