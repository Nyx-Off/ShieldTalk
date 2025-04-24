import { useState, useEffect } from 'react';

// Version simplifiée pour le développement sans WebCrypto
const useKeyStorage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storedKeys, setStoredKeys] = useState(null);

  // Initialisation
  useEffect(() => {
    const storedKeysJSON = localStorage.getItem('shieldtalk_keys');
    if (storedKeysJSON) {
      try {
        setStoredKeys(JSON.parse(storedKeysJSON));
      } catch (err) {
        setError('Erreur lors de la récupération des clés');
      }
    }
    setLoading(false);
  }, []);

  // Sauvegarde des clés
  const saveKeys = async (keyPair) => {
    try {
      localStorage.setItem('shieldtalk_keys', JSON.stringify(keyPair));
      setStoredKeys(keyPair);
      return keyPair;
    } catch (err) {
      setError('Erreur lors de la sauvegarde des clés');
      throw err;
    }
  };

  // Récupération des clés
  const getKeys = async () => {
    if (storedKeys) {
      return storedKeys;
    }
    return null;
  };

  return {
    loading,
    error,
    saveKeys,
    getKeys
  };
};

export default useKeyStorage;
