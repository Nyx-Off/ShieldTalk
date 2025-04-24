import { useState, useEffect } from 'react';

// Nom de la base de données et du store
const DB_NAME = 'ShieldTalkDB';
const KEY_STORE = 'keys';
const DB_VERSION = 1;

const useKeyStorage = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialisation de la base de données
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(KEY_STORE)) {
            db.createObjectStore(KEY_STORE, { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          setDb(event.target.result);
          setLoading(false);
        };
        
        request.onerror = (event) => {
          setError(`Erreur d'initialisation de la base de données: ${event.target.error}`);
          setLoading(false);
        };
      } catch (err) {
        setError(`Erreur: ${err.message}`);
        setLoading(false);
      }
    };
    
    initDB();
  }, []);

  // Sauvegarde des clés
  const saveKeys = async (keyPair) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }
      
      try {
        const transaction = db.transaction([KEY_STORE], 'readwrite');
        const store = transaction.objectStore(KEY_STORE);
        
        // Extraction des clés publique et privée au format JWK
        Promise.all([
          window.crypto.subtle.exportKey('jwk', keyPair.publicKey),
          window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
        ]).then(([publicJwk, privateJwk]) => {
          // Stockage des clés
          const keyData = {
            id: 'userKeyPair',
            publicKey: publicJwk,
            privateKey: privateJwk,
            createdAt: new Date().toISOString()
          };
          
          const request = store.put(keyData);
          
          request.onsuccess = () => resolve(keyData);
          request.onerror = (event) => reject(event.target.error);
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  // Récupération des clés
  const getKeys = async () => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Base de données non initialisée'));
        return;
      }
      
      try {
        const transaction = db.transaction([KEY_STORE], 'readonly');
        const store = transaction.objectStore(KEY_STORE);
        const request = store.get('userKeyPair');
        
        request.onsuccess = async () => {
          const data = request.result;
          
          if (!data) {
            resolve(null);
            return;
          }
          
          // Conversion des clés JWK en objets CryptoKey
          try {
            const publicKey = await window.crypto.subtle.importKey(
              'jwk',
              data.publicKey,
              {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
              },
              true,
              ['encrypt']
            );
            
            const privateKey = await window.crypto.subtle.importKey(
              'jwk',
              data.privateKey,
              {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
              },
              true,
              ['decrypt']
            );
            
            resolve({ publicKey, privateKey });
          } catch (err) {
            reject(err);
          }
        };
        
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  };

  return {
    loading,
    error,
    saveKeys,
    getKeys
  };
};

export default useKeyStorage;
