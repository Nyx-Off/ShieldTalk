// Utilitaires de cryptographie utilisant CryptoJS (pour développement)
import CryptoJS from 'crypto-js';

// Générer une paire de clés
export const generateKeyPair = async () => {
  try {
    // Pour le développement, on utilise une clé simple
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    // La clé publique est juste un hash de la clé privée (simplification)
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    console.log('Clés générées:', { privateKey, publicKey });
    
    return {
      privateKey,
      publicKey
    };
  } catch (error) {
    console.error('Erreur lors de la génération des clés :', error);
    throw error;
  }
};

// Exportation de clé publique
export const exportPublicKey = async (publicKey) => {
  console.log('Clé publique exportée:', publicKey);
  return publicKey;
};

// Importation de clé publique
export const importPublicKey = async (key) => {
  console.log('Clé publique importée:', key);
  return key;
};

// Chiffrement d'un message avec la clé publique du destinataire
export const encryptMessage = async (publicKey, message) => {
  try {
    // Générer une clé de session (une clé AES unique pour ce message)
    const sessionKey = CryptoJS.lib.WordArray.random(16).toString();
    
    // Chiffrer le message avec la clé de session
    const encryptedMessage = CryptoJS.AES.encrypt(message, sessionKey).toString();
    
    // Chiffrer la clé de session avec la clé publique (simulation)
    // Dans un vrai système, on utiliserait RSA ou ECDH, mais ici on simule
    const encryptedSessionKey = CryptoJS.AES.encrypt(sessionKey, publicKey).toString();
    
    // Combiner les deux éléments chiffrés en un seul message
    const fullEncrypted = JSON.stringify({
      message: encryptedMessage,
      sessionKey: encryptedSessionKey
    });
    
    console.log('Message chiffré avec session key:', fullEncrypted.substring(0, 30) + '...');
    return fullEncrypted;
  } catch (error) {
    console.error('Erreur lors du chiffrement du message :', error);
    throw error;
  }
};

// Déchiffrement d'un message avec la clé privée du destinataire
export const decryptMessage = async (privateKey, encryptedData) => {
  try {
    console.log('Déchiffrement avec clé privée:', privateKey.substring(0, 10) + '...');
    console.log('Message à déchiffrer:', encryptedData.substring(0, 30) + '...');
    
    // Analyser les composants du message chiffré
    let parsed;
    try {
      parsed = JSON.parse(encryptedData);
    } catch (err) {
      console.error('Format de message incorrect:', err);
      return '[Format de message incorrect]';
    }
    
    // Déchiffrer la clé de session avec la clé privée
    const sessionKeyBytes = CryptoJS.AES.decrypt(parsed.sessionKey, privateKey);
    const sessionKey = sessionKeyBytes.toString(CryptoJS.enc.Utf8);
    
    if (!sessionKey) {
      console.error('Échec du déchiffrement de la clé de session');
      return '[Erreur de déchiffrement]';
    }
    
    // Déchiffrer le message avec la clé de session
    const messageBytes = CryptoJS.AES.decrypt(parsed.message, sessionKey);
    const decrypted = messageBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      console.error('Échec du déchiffrement du message');
      return '[Erreur de déchiffrement]';
    }
    
    console.log('Message déchiffré:', decrypted);
    return decrypted;
  } catch (error) {
    console.error('Erreur lors du déchiffrement :', error);
    // En cas d'erreur, on retourne un message d'erreur au lieu de propager l'exception
    return '[Erreur de déchiffrement]';
  }
};

// Fonctions utilitaires
export const bufferToBase64 = (buffer) => buffer;
export const base64ToBuffer = (base64) => base64;
