import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useKeyStorage from '../hooks/useKeyStorage';
import { generateKeyPair, exportPublicKey, importPublicKey, encryptMessage, decryptMessage } from '../utils/cryptoUtils';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [usernameSet, setUsernameSet] = useState(false);
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const { loading, error, saveKeys, getKeys } = useKeyStorage();
  const [keyPair, setKeyPair] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialisation des clés et de la connexion socket
  useEffect(() => {
    const init = async () => {
      if (loading) return;
      
      try {
        // Récupération ou génération des clés
        let keys = await getKeys();
        if (!keys) {
          const newKeyPair = await generateKeyPair();
          await saveKeys(newKeyPair);
          keys = newKeyPair;
        }
        setKeyPair(keys);
        
        // Connexion au serveur
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);
        
        newSocket.on('connect', async () => {
          console.log('Connecté au serveur');
          setInitialized(true);
        });
        
        newSocket.on('message', (data) => {
          if (data.to === username || data.from === username) {
            handleIncomingMessage(data);
          }
        });
        
        newSocket.on('user_joined', (data) => {
          setUsers(prevUsers => ({
            ...prevUsers,
            [data.username]: { publicKey: data.publicKey }
          }));
        });
        
        newSocket.on('user_list', (userList) => {
          setUsers(userList);
        });
        
        return () => {
          newSocket.disconnect();
        };
      } catch (err) {
        console.error('Erreur d\'initialisation :', err);
      }
    };
    
    init();
  }, [loading]);

  // Gestion des messages entrants
  const handleIncomingMessage = async (data) => {
    if (data.to === username) {
      try {
        // Déchiffrement du message reçu
        const decryptedContent = await decryptMessage(keyPair.privateKey, data.content);
        
        setMessages(prevMessages => [...prevMessages, {
          from: data.from,
          content: decryptedContent,
          timestamp: new Date(),
          incoming: true
        }]);
      } catch (err) {
        console.error('Erreur de déchiffrement :', err);
      }
    } else {
      // Mes messages envoyés
      setMessages(prevMessages => [...prevMessages, {
        to: data.to,
        content: data.localContent, // Contenu non chiffré pour l'affichage
        timestamp: new Date(),
        incoming: false
      }]);
    }
  };

  // Défilement automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enregistrement du nom d'utilisateur
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && socket && keyPair) {
      const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
      socket.emit('register_user', { username, publicKey: publicKeyJwk });
      setUsernameSet(true);
    }
  };

  // Envoi d'un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() && selectedUser && socket) {
      try {
        const recipientPublicKey = await importPublicKey(users[selectedUser].publicKey);
        const encryptedContent = await encryptMessage(recipientPublicKey, inputMessage);
        
        const messageData = {
          from: username,
          to: selectedUser,
          content: encryptedContent,
          timestamp: new Date().toISOString(),
          localContent: inputMessage // Version non chiffrée pour l'afficheur
        };
        
        socket.emit('message', messageData);
        setInputMessage('');
      } catch (err) {
        console.error('Erreur d\'envoi de message :', err);
      }
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  if (!usernameSet) {
    return (
      <div className="username-form">
        <h2>Bienvenue sur ShieldTalk</h2>
        <p>Messagerie chiffrée de bout en bout</p>
        <form onSubmit={handleUsernameSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Entrez votre nom d'utilisateur"
            required
          />
          <button type="submit" disabled={!initialized}>Commencer à discuter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Utilisateurs</h2>
        <ul className="user-list">
          {Object.keys(users).filter(user => user !== username).map(user => (
            <li
              key={user}
              className={selectedUser === user ? 'selected' : ''}
              onClick={() => setSelectedUser(user)}
            >
              {user}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="chat">
        <div className="chat-header">
          {selectedUser ? `Conversation avec ${selectedUser}` : 'Sélectionnez un utilisateur'}
        </div>
        
        <div className="messages">
          {messages
            .filter(msg => (msg.from === selectedUser && msg.to === username) || 
                         (msg.from === username && msg.to === selectedUser))
            .map((msg, index) => (
              <div key={index} className={`message ${msg.incoming ? 'incoming' : 'outgoing'}`}>
                <div className="content">{msg.content}</div>
                <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          }
          <div ref={messagesEndRef} />
        </div>
        
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tapez votre message..."
            disabled={!selectedUser}
          />
          <button type="submit" disabled={!selectedUser}>Envoyer</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
