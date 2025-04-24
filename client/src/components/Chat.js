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
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialisation des clés et de la connexion socket
  useEffect(() => {
    const init = async () => {
      if (loading) return;
      
      try {
        // Récupération ou génération des clés
        let keys = await getKeys();
        if (!keys) {
          console.log("Génération de nouvelles clés");
          const newKeyPair = await generateKeyPair();
          await saveKeys(newKeyPair);
          keys = newKeyPair;
        } else {
          console.log("Clés récupérées du stockage");
        }
        
        setKeyPair(keys);
        console.log("Clés définies dans l'état");
        
        // Connexion au serveur
        setConnectionStatus('connecting');
        const newSocket = io({
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000
        });
        
        socketRef.current = newSocket;
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
          console.log('Connecté au serveur, socketId:', newSocket.id);
          setSocketConnected(true);
          setConnectionStatus('connected');
          setInitialized(true);
          
          // Si l'utilisateur était déjà connecté, ré-enregistrer
          if (usernameSet && username) {
            reregisterUser(newSocket, keys, username);
          }
        });
        
        newSocket.on('disconnect', () => {
          console.log('Déconnecté du serveur');
          setSocketConnected(false);
          setConnectionStatus('disconnected');
        });
        
        newSocket.on('connect_error', (err) => {
          console.log('Erreur de connexion:', err);
          setConnectionStatus('disconnected');
        });
        
        newSocket.on('message', (data) => {
          console.log('Message reçu:', data);
          handleIncomingMessage(data);
        });
        
        newSocket.on('user_joined', (data) => {
          console.log('Utilisateur rejoint:', data.username);
          setUsers(prevUsers => ({
            ...prevUsers,
            [data.username]: { publicKey: data.publicKey }
          }));
        });
        
        newSocket.on('user_list', (userList) => {
          console.log('Liste des utilisateurs reçue:', Object.keys(userList));
          setUsers(userList);
        });
        
        newSocket.on('user_left', (username) => {
          console.log('Utilisateur parti:', username);
          setUsers(prevUsers => {
            const newUsers = { ...prevUsers };
            delete newUsers[username];
            return newUsers;
          });
        });
        
        // Ping périodique pour maintenir la connexion
        const pingInterval = setInterval(() => {
          if (newSocket.connected) {
            newSocket.emit('ping');
          }
        }, 30000);
        
        return () => {
          clearInterval(pingInterval);
          newSocket.disconnect();
        };
      } catch (err) {
        console.error('Erreur d\'initialisation :', err);
        setConnectionStatus('disconnected');
      }
    };
    
    init();
  }, [loading]);
  
  // Fonction pour réenregistrer l'utilisateur après une reconnexion
  const reregisterUser = async (socket, keys, username) => {
    try {
      const publicKeyExported = await exportPublicKey(keys.publicKey);
      socket.emit('register_user', { 
        username, 
        publicKey: publicKeyExported 
      });
      console.log('Utilisateur réenregistré après reconnexion:', username);
    } catch (err) {
      console.error('Erreur lors du réenregistrement:', err);
    }
  };

  // Gestion des messages entrants
  const handleIncomingMessage = async (data) => {
    console.log(`Traitement du message: de=${data.from}, à=${data.to}, username=${username}`);
    
    try {
      if (data.to === username) {
        // C'est un message que je reçois
        console.log('Déchiffrement du message entrant');
        let decryptedContent;
        
        try {
          decryptedContent = await decryptMessage(keyPair.privateKey, data.content);
        } catch (err) {
          console.error('Erreur de déchiffrement, utilisation du contenu brut:', err);
          decryptedContent = "Impossible de déchiffrer le message";
        }
        
        console.log('Message déchiffré:', decryptedContent);
        
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            from: data.from,
            to: data.to,
            content: decryptedContent,
            timestamp: data.timestamp || new Date(),
            incoming: true
          }
        ]);
      } else if (data.from === username) {
        // C'est un message que j'ai envoyé
        console.log('Ajout de mon message envoyé à l\'historique');
        
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            from: data.from,
            to: data.to,
            content: data.localContent || data.content,
            timestamp: data.timestamp || new Date(),
            incoming: false
          }
        ]);
      }
    } catch (err) {
      console.error('Erreur lors du traitement du message:', err);
    }
  };

  // Défilement automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enregistrement du nom d'utilisateur
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (username.trim() && socketConnected && keyPair) {
      console.log('Enregistrement de l\'utilisateur:', username);
      try {
        const publicKeyExported = await exportPublicKey(keyPair.publicKey);
        console.log('Clé publique exportée:', publicKeyExported);
        
        socketRef.current.emit('register_user', { 
          username, 
          publicKey: publicKeyExported 
        });
        
        setUsernameSet(true);
      } catch (err) {
        console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', err);
      }
    } else {
      console.warn('Impossible d\'enregistrer l\'utilisateur:', {
        usernameProvided: !!username.trim(),
        socketConnected,
        keyPairGenerated: !!keyPair
      });
    }
  };

  // Envoi d'un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() && selectedUser && socketConnected) {
      console.log(`Envoi d'un message à ${selectedUser}: ${inputMessage}`);
      
      try {
        const recipientPublicKey = await importPublicKey(users[selectedUser].publicKey);
        console.log('Clé publique du destinataire importée');
        
        const encryptedContent = await encryptMessage(recipientPublicKey, inputMessage);
        console.log('Message chiffré');
        
        const messageData = {
          from: username,
          to: selectedUser,
          content: encryptedContent,
          timestamp: new Date().toISOString(),
          localContent: inputMessage // Version non chiffrée pour l'afficheur
        };
        
        console.log('Émission du message via WebSocket');
        socketRef.current.emit('message', messageData);
        
        // Ajouter le message à la liste des messages immédiatement pour une UX réactive
        setMessages(prevMessages => [
          ...prevMessages,
          {
            from: username,
            to: selectedUser,
            content: inputMessage,
            timestamp: new Date(),
            incoming: false
          }
        ]);
        
        setInputMessage('');
      } catch (err) {
        console.error('Erreur d\'envoi de message :', err);
      }
    } else {
      console.warn('Impossible d\'envoyer le message:', {
        messageProvided: !!inputMessage.trim(),
        userSelected: !!selectedUser,
        socketConnected
      });
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
          <button 
            type="submit" 
            disabled={connectionStatus !== 'connected'}
          >
            {connectionStatus === 'connected' ? "Commencer à discuter" : "Connexion en cours..."}
          </button>
        </form>
        {connectionStatus !== 'connected' && (
          <p className="connection-status">
            {connectionStatus === 'connecting' ? 'Connexion au serveur en cours...' : 'Déconnecté du serveur. Reconnexion...'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="user-info">
          <span>Connecté en tant que <strong>{username}</strong></span>
          <span className={`connection-dot ${socketConnected ? 'connected' : 'disconnected'}`}></span>
        </div>
        <h2>Utilisateurs ({Object.keys(users).filter(user => user !== username).length})</h2>
        <ul className="user-list">
          {Object.keys(users).filter(user => user !== username).length === 0 ? (
            <li className="no-users">Aucun autre utilisateur connecté</li>
          ) : (
            Object.keys(users).filter(user => user !== username).map(user => (
              <li
                key={user}
                className={selectedUser === user ? 'selected' : ''}
                onClick={() => setSelectedUser(user)}
              >
                {user}
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="chat">
        <div className="chat-header">
          {selectedUser ? `Conversation avec ${selectedUser}` : 'Sélectionnez un utilisateur pour discuter'}
        </div>
        
        <div className="messages">
          {messages
            .filter(msg => (msg.from === selectedUser && msg.to === username) || 
                         (msg.from === username && msg.to === selectedUser))
            .map((msg, index) => (
              <div key={index} className={`message ${msg.from === username ? 'outgoing' : 'incoming'}`}>
                <div className="content">{msg.content}</div>
                <div className="timestamp">
                  {typeof msg.timestamp === 'string' 
                    ? new Date(msg.timestamp).toLocaleTimeString() 
                    : (msg.timestamp instanceof Date 
                      ? msg.timestamp.toLocaleTimeString() 
                      : new Date().toLocaleTimeString())}
                </div>
              </div>
            ))
          }
          <div ref={messagesEndRef} />
          
          {messages.filter(msg => (msg.from === selectedUser && msg.to === username) || 
                         (msg.from === username && msg.to === selectedUser)).length === 0 && selectedUser && (
            <div className="empty-chat">
              <p>Aucun message pour le moment. Commencez la conversation !</p>
            </div>
          )}
        </div>
        
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={selectedUser ? "Tapez votre message..." : "Sélectionnez d'abord un utilisateur"}
            disabled={!selectedUser || !socketConnected}
          />
          <button 
            type="submit" 
            disabled={!selectedUser || !inputMessage.trim() || !socketConnected}
          >
            Envoyer
          </button>
        </form>
        
        {!socketConnected && (
          <div className="connection-warning">
            Connexion perdue au serveur. Tentative de reconnexion...
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
