// Utilitaires de cryptographie utilisant CryptoJS (alternative pour dev seulement)
import CryptoJS from 'crypto-js';

// Simuler une paire de clés pour le développement
export const generateKeyPair = async () => {
  try {
    // Générer une "clé" aléatoire pour simuler RSA en dev
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return {
      privateKey: privateKey,
      publicKey: publicKey
    };
  } catch (error) {
    console.error('Erreur lors de la génération des clés :', error);
    throw error;
  }
};

// Exportation de clé publique
export const exportPublicKey = async (publicKey) => {
  return publicKey; // Déjà sous forme de string
};

// Importation de clé publique
export const importPublicKey = async (key) => {
  return key; // La clé est déjà utilisable
};

// Chiffrement d'un message avec AES (pour simulation uniquement)
export const encryptMessage = async (publicKey, message) => {
  try {
    // Utiliser la clé publique comme clé de chiffrement (pour simulation)
    const encrypted = CryptoJS.AES.encrypt(message, publicKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Erreur lors du chiffrement du message :', error);
    throw error;
  }
};

// Déchiffrement d'un message
export const decryptMessage = async (privateKey, encryptedMessage) => {
  try {
    // Utiliser la clé privée pour déchiffrer
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erreur lors du déchiffrement du message :', error);
    throw error;
  }
};

// Ces fonctions ne sont plus nécessaires avec CryptoJS
export const bufferToBase64 = (buffer) => buffer;
export const base64ToBuffer = (base64) => base64;
