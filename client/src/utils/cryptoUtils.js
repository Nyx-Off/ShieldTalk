// Version simplifiée qui fonctionne à coup sûr
import CryptoJS from 'crypto-js';

// Générer une paire de clés
export const generateKeyPair = async () => {
  try {
    // Une seule clé pour tout faire (version simplifiée)
    const secretKey = CryptoJS.lib.WordArray.random(32).toString();
    
    console.log('Clé secrète générée (version simplifiée)');
    
    return {
      privateKey: secretKey,
      publicKey: secretKey
    };
  } catch (error) {
    console.error('Erreur lors de la génération des clés :', error);
    throw error;
  }
};

// Exportation de clé publique
export const exportPublicKey = async (publicKey) => {
  console.log('Clé publique exportée (simplifiée)');
  return publicKey;
};

// Importation de clé publique
export const importPublicKey = async (key) => {
  console.log('Clé publique importée (simplifiée)');
  return key;
};

// Chiffrement d'un message
export const encryptMessage = async (publicKey, message) => {
  try {
    console.log('Chiffrement avec clé (simplifiée)');
    const encrypted = CryptoJS.AES.encrypt(message, publicKey).toString();
    console.log('Message chiffré (simplifié)');
    return encrypted;
  } catch (error) {
    console.error('Erreur lors du chiffrement du message :', error);
    throw error;
  }
};

// Déchiffrement d'un message
export const decryptMessage = async (privateKey, encryptedMessage) => {
  try {
    console.log('Déchiffrement avec clé (simplifiée)');
    
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error("Résultat de déchiffrement vide");
    }
    
    console.log('Message déchiffré (simplifié)');
    return decrypted;
  } catch (error) {
    console.error('Erreur lors du déchiffrement :', error);
    return '[Erreur: ' + error.message + ']';
  }
};

// Fonctions utilitaires
export const bufferToBase64 = (buffer) => buffer;
export const base64ToBuffer = (base64) => base64;
