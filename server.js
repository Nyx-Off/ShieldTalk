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

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({ status: 'Serveur ShieldTalk opérationnel' });
});

// Servir l'application React pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Gestion des websockets
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté', socket.id);
  
  // Enregistrement d'un nouvel utilisateur
  socket.on('register_user', (data) => {
    console.log('Enregistrement utilisateur:', data.username);
    
    const { username, publicKey } = data;
    
    // Stockage des infos utilisateur
    users[username] = {
      socketId: socket.id,
      publicKey: publicKey
    };
    
    // Associer le socket à un username
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
    
    console.log(`Utilisateur enregistré: ${username}`);
  });
  
  // Transmission des messages
  socket.on('message', (data) => {
    console.log(`Message de ${data.from} à ${data.to}`);
    console.log('Contenu du message (chiffré):', data.content?.substring(0, 20) + '...');
    
    // Vérifier si le destinataire existe
    if (!users[data.to]) {
      console.log(`Utilisateur destinataire ${data.to} non trouvé`);
      return;
    }
    
    // Transmettre le message uniquement au destinataire
    const targetSocketId = users[data.to]?.socketId;
    if (targetSocketId) {
      console.log(`Envoi du message à ${data.to} (socketId: ${targetSocketId})`);
      io.to(targetSocketId).emit('message', data);
    } else {
      console.log(`SocketId non trouvé pour ${data.to}`);
    }
    
    // Réfléchir le message à l'expéditeur pour confirmation
    console.log(`Réflexion du message à l'expéditeur ${data.from}`);
    socket.emit('message', data);
  });
  
  // Déconnexion
  socket.on('disconnect', () => {
    if (socket.username && users[socket.username]) {
      delete users[socket.username];
      io.emit('user_left', socket.username);
      console.log(`Utilisateur déconnecté: ${socket.username}`);
    } else {
      console.log('Un utilisateur anonyme s\'est déconnecté');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
