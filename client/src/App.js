import React from 'react';
import './App.css';
import Chat from './components/Chat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ShieldTalk</h1>
        <p>Messagerie sécurisée avec chiffrement de bout en bout</p>
      </header>
      <main>
        <Chat />
      </main>
      <footer>
        <p>ShieldTalk &copy; {new Date().getFullYear()} - Tous les messages sont chiffrés E2EE</p>
      </footer>
    </div>
  );
}

export default App;
