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

// Chiffrement d'un message
export const encryptMessage = async (publicKey, message) => {
  try {
    // Utiliser la clé publique comme clé de chiffrement (simulation)
    console.log('Chiffrement avec la clé:', publicKey);
    const encrypted = CryptoJS.AES.encrypt(message, publicKey).toString();
    console.log('Message chiffré:', encrypted.substring(0, 20) + '...');
    return encrypted;
  } catch (error) {
    console.error('Erreur lors du chiffrement du message :', error);
    throw error;
  }
};

// Déchiffrement d'un message
export const decryptMessage = async (privateKey, encryptedMessage) => {
  try {
    console.log('Déchiffrement avec clé privée:', privateKey);
    console.log('Message à déchiffrer:', encryptedMessage.substring(0, 20) + '...');
    
    // Déchiffrement du message avec CryptoJS
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
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
