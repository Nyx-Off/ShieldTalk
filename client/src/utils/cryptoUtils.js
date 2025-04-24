// Utilitaires de cryptographie utilisant l'API Web Crypto

// Génération de paire de clés RSA
export const generateKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
    
    return keyPair;
  } catch (error) {
    console.error('Erreur lors de la génération des clés :', error);
    throw error;
  }
};

// Exportation de clé publique au format JWK
export const exportPublicKey = async (publicKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey("jwk", publicKey);
    return exported;
  } catch (error) {
    console.error('Erreur lors de l\'exportation de la clé publique :', error);
    throw error;
  }
};

// Importation de clé publique depuis le format JWK
export const importPublicKey = async (jwkKey) => {
  try {
    const key = await window.crypto.subtle.importKey(
      "jwk",
      jwkKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
    return key;
  } catch (error) {
    console.error('Erreur lors de l\'importation de la clé publique :', error);
    throw error;
  }
};

// Chiffrement d'un message avec la clé publique du destinataire
export const encryptMessage = async (publicKey, message) => {
  try {
    // Conversion du message en ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Chiffrement avec la clé publique
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      data
    );
    
    // Conversion en base64 pour la transmission
    return bufferToBase64(encrypted);
  } catch (error) {
    console.error('Erreur lors du chiffrement du message :', error);
    throw error;
  }
};

// Déchiffrement d'un message avec sa propre clé privée
export const decryptMessage = async (privateKey, encryptedMessage) => {
  try {
    // Conversion depuis base64 en ArrayBuffer
    const encryptedData = base64ToBuffer(encryptedMessage);
    
    // Déchiffrement avec la clé privée
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedData
    );
    
    // Conversion du résultat en texte
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Erreur lors du déchiffrement du message :', error);
    throw error;
  }
};

// Utilitaires de conversion
export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};
