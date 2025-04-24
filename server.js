const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Routes de base
app.get('/', (req, res) => {
  res.send('Serveur ShieldTalk opérationnel');
});

// Gestion des websockets
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté', socket.id);
  
  socket.on('message', (data) => {
    // Ici nous transmettons simplement le message chiffré
    console.log('Message reçu', data);
    io.emit('message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
