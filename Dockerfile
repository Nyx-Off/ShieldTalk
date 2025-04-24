FROM node:16

# Configuration du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code
COPY . .

# Construction du frontend
WORKDIR /app/client
RUN npm install
RUN npm run build

# Retour au répertoire racine
WORKDIR /app

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
