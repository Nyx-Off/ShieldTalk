const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'client/build')));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Stockage en mémoire des utilisateurs et de leurs clés publiques
const users = {};
// Map des socket IDs aux noms d'utilisateurs
const socketToUser = {};

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({ status: 'Serveur ShieldTalk opérationnel' });
});

// Servir l'application React pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Afficher les utilisateurs actifs
const logActiveUsers = () => {
  console.log('======= UTILISATEURS ACTIFS =======');
  Object.entries(users).forEach(([username, userData]) => {
    console.log(`${username}: Socket ID = ${userData.socketId}`);
  });
  console.log('===================================');
};

// Exportation pour commande externe
exports.getUsers = () => {
  return users;
};

// Gestion des websockets
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté', socket.id);
  
  // Enregistrement d'un nouvel utilisateur
  socket.on('register_user', (data) => {
    console.log('Enregistrement utilisateur:', data.username, 'avec socketId:', socket.id);
    
    const { username, publicKey } = data;
    
    // Si cet utilisateur existait déjà, nettoyons l'ancienne entrée
    if (users[username] && users[username].socketId !== socket.id) {
      const oldSocketId = users[username].socketId;
      console.log(`Utilisateur ${username} existait déjà avec socketId ${oldSocketId}, mise à jour vers ${socket.id}`);
      
      // Suppression de l'ancienne association socket-utilisateur
      if (socketToUser[oldSocketId] === username) {
        delete socketToUser[oldSocketId];
      }
    }
    
    // Stockage des infos utilisateur
    users[username] = {
      socketId: socket.id,
      publicKey: publicKey
    };
    
    // Associer le socket ID à un nom d'utilisateur
    socketToUser[socket.id] = username;
    
    // Associer le socket à un username (pour Socket.IO)
    socket.username = username;
    
    // Informer les autres utilisateurs
    socket.broadcast.emit('user_joined', { username, publicKey });
    
    // Envoyer la liste des utilisateurs au nouvel arrivant
    const userList = {};
    for (const [name, userData] of Object.entries(users)) {
      userList[name] = {
        publicKey: userData.publicKey
      };
    }
    
    console.log('Liste des utilisateurs:', Object.keys(userList));
    socket.emit('user_list', userList);
    
    logActiveUsers();
  });
  
  // Transmission des messages
  socket.on('message', (data) => {
    console.log(`Message de ${data.from} à ${data.to}`);
    console.log('Contenu du message (chiffré):', data.content?.substring(0, 30) + '...');
    
    // Vérifier si le destinataire existe
    if (!users[data.to]) {
      console.log(`Utilisateur destinataire ${data.to} non trouvé`);
      return;
    }
    
    // Transmettre le message uniquement au destinataire
    const targetSocketId = users[data.to]?.socketId;
    if (targetSocketId) {
      console.log(`Envoi du message à ${data.to} (socketId: ${targetSocketId})`);
      
      // Diffuser le message en direct au destinataire
      io.to(targetSocketId).emit('message', {
        from: data.from,
        to: data.to,
        content: data.content,
        timestamp: data.timestamp
      });
      
      console.log(`Message envoyé au socket ${targetSocketId}`);
    } else {
      console.log(`SocketId non trouvé pour ${data.to}`);
    }
    
    // Réfléchir le message à l'expéditeur pour confirmation
    console.log(`Réflexion du message à l'expéditeur ${data.from} (socketId: ${socket.id})`);
    socket.emit('message', {
      from: data.from,
      to: data.to,
      content: data.content,
      localContent: data.localContent,
      timestamp: data.timestamp
    });
  });
  
  // Déconnexion
  socket.on('disconnect', () => {
    const username = socketToUser[socket.id];
    
    if (username) {
      console.log(`Utilisateur déconnecté: ${username} (socketId: ${socket.id})`);
      
      // Supprimer l'utilisateur
      delete users[username];
      delete socketToUser[socket.id];
      
      // Notifier les autres utilisateurs
      io.emit('user_left', username);
      
      logActiveUsers();
    } else {
      console.log(`Socket déconnecté sans utilisateur associé: ${socket.id}`);
    }
  });
  
  // Ping pour garder la connexion active
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
