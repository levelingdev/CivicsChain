import { useContext } from 'react';
import { CivicChainContext } from '../context/CivicChainContext';

export const useCivicChain = () => {
  const context = useContext(CivicChainContext);
  
  if (!context) {
    throw new Error("useCivicChain must be used within a CivicChainProvider");
  }
  
  return context;
};