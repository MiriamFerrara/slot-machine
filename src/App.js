import React, { useState, useEffect, useCallback, useRef } from 'react';

import './App.css';
import logo from './image/logo-slot-trasp.png';

// Dati dei simboli disponibili nella slot machine, con premi e rarità
const symbolData = {
  '🍒': { name: 'Ciliegia', prize: 10, rarity: 'Molto comune' },
  '🍋': { name: 'Limone', prize: 20, rarity: 'Comune' },
  '🍉': { name: 'Anguria', prize: 40, rarity: 'Comune' },
  '⭐':  { name: 'Stella', prize: 50, rarity: 'Medio' },
  '🔔': { name: 'Campana', prize: 100, rarity: 'Raro' },
  '7️⃣': { name: 'Numero 7', prize: 300, rarity: 'Molto raro' },
  '💎': { name: 'Diamante', prize: 500, rarity: 'Estremamente raro' },
};

const symbols = Object.keys(symbolData); // Estrae tutti i simboli come array di stringhe

function App() {
  // Stati principali dell'applicazione
  const [balance, setBalance] = useState(200); // Saldo attuale del giocatore
  const [defaultSettings, setDefaultSettings] = useState({ // Impostazioni predefinite del gioco
    balance: 200,
    mode: 'random',
    cost: 10,
  });
  const [gameMode, setGameMode] = useState('random'); // Modalità di gioco corrente ('random', 'win', 'lose')
  const [spinCost, setSpinCost] = useState(10); // Costo per ogni giro del rullo
  const [reelSymbols, setReelSymbols] = useState(['🍒', '🍋', '🍉']); // Simboli attualmente visualizzati sui rulli
  const [spinning, setSpinning] = useState(false); // Indica se i rulli stanno girando
  const [winMessage, setWinMessage] = useState(''); // Messaggio di vincita/perdita visualizzato all'utente
  const [randomSpinCount, setRandomSpinCount] = useState(0); // Contatore per la modalità casuale (1 vincita ogni 3 spin)
  const [costMessage, setCostMessage] = useState(''); // Messaggio temporaneo che mostra il costo dello spin

  // Stato per gestire quale schermata è attualmente visualizzata: 'detailedStart', 'simpleStart', 'game'
  const [currentScreen, setCurrentScreen] = useState('detailedStart');

  // Riferimenti per elementi DOM o funzioni
  const slotRef = useRef(null); // Riferimento al contenitore della slot
  const handleSpinRef = useRef(null);

  // Effetto per ricaricare il saldo a 200€ se scende a zero o meno
  useEffect(() => {
    if (balance <= 0) {
      setBalance(200);
    }
  }, [balance]);

  // Funzione per rimuovere tutte le monete dal DOM
  const clearCoins = useCallback(() => {
    const existingCoins = document.querySelectorAll('.coin-body');
    existingCoins.forEach(coin => coin.remove());
  }, []);

  // Funzione principale per far girare i rulli della slot
  const handleSpin = useCallback(() => {
    if (spinning || balance < spinCost) {
      return;
    }

    clearCoins();

    setSpinning(true);
    setBalance(prev => prev - spinCost);
    setCostMessage(`-${spinCost}€`);
    setTimeout(() => setCostMessage(''), 1000);
    setWinMessage('');

    let finalSymbols = [symbols[0], symbols[0], symbols[0]];

    if (gameMode === 'win') {
      const rarest = symbols[symbols.length - 1];
      finalSymbols = [rarest, rarest, rarest];
    } else if (gameMode === 'lose') {
      let shuffled = [...symbols].sort(() => 0.5 - Math.random());
      while (shuffled[0] === shuffled[1] || shuffled[1] === shuffled[2] || shuffled[0] === shuffled[2]) {
        shuffled = [...symbols].sort(() => 0.5 - Math.random());
      }
      finalSymbols = [shuffled[0], shuffled[1], shuffled[2]];
    } else { // Modalità 'random'
      if (randomSpinCount % 3 === 0) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        finalSymbols = [symbol, symbol, symbol];
      } else {
        let shuffled = [...symbols].sort(() => 0.5 - Math.random());
        while (shuffled[0] === shuffled[1] || shuffled[1] === shuffled[2] || shuffled[0] === shuffled[2]) {
          shuffled = [...symbols].sort(() => 0.5 - Math.random());
        }
        finalSymbols = [shuffled[0], shuffled[1], shuffled[2]];
      }
      setRandomSpinCount(prev => prev + 1);
    }

    let frame = 0;
    const interval = setInterval(() => {
      setReelSymbols([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      frame++;
      if (frame > 10) {
        clearInterval(interval);
        setReelSymbols(finalSymbols);

        if (finalSymbols.every(sym => sym === finalSymbols[0])) {
          const prize = symbolData[finalSymbols[0]].prize;
          setBalance(prev => prev + prize);
          setWinMessage(`Hai vinto! +${prize}€`);
          triggerCoinRainBody();
        } else {
          clearCoins();
        }

        setSpinning(false);
      }
    }, 100);
  }, [spinning, balance, spinCost, gameMode, randomSpinCount, clearCoins]);

  // Sincronizza la funzione handleSpin con il suo riferimento useRef
  useEffect(() => {
    handleSpinRef.current = handleSpin;
  }, [handleSpin]);

  // Gestore per passare dalla schermata dettagliata a quella semplificata (dopo aver cliccato 'Inizia')
  const handleStart = useCallback(() => {
    setBalance(parseInt(defaultSettings.balance));
    setGameMode(defaultSettings.mode);
    setSpinCost(parseInt(defaultSettings.cost));
    setCurrentScreen('simpleStart');
  }, [defaultSettings]);

  // Gestore per passare dalla schermata semplificata al gioco slot (dopo aver cliccato 'START')
  const handleActualGameStart = useCallback(() => {
    setCurrentScreen('game');

    let shuffled = [...symbols].sort(() => 0.5 - Math.random());
    while (shuffled[0] === shuffled[1] || shuffled[1] === shuffled[2] || shuffled[0] === shuffled[2]) {
      shuffled = [...symbols].sort(() => 0.5 - Math.random());
    }
    setReelSymbols([shuffled[0], shuffled[1], shuffled[2]]);
  }, []);

  // Gestore per tornare alla schermata iniziale dettagliata e resettare lo stato del gioco
  const handleReset = useCallback(() => {
    setCurrentScreen('detailedStart');
    setBalance(200);
    setSpinCost(10);
    setGameMode('random');
    setWinMessage('');
    setRandomSpinCount(0);
    setDefaultSettings({
      balance: 200,
      mode: 'random',
      cost: 10,
    });
    clearCoins();
  }, [clearCoins]);

  // Gestore per ricominciare la partita con le impostazioni predefinite (senza cambiare schermata)
  const handleRestart = useCallback(() => {
    setBalance(200);
    setSpinCost(10);
    setGameMode('random');
    setWinMessage('');
    setRandomSpinCount(0);

    let shuffled = [...symbols].sort(() => 0.5 - Math.random());
    while (shuffled[0] === shuffled[1] || shuffled[1] === shuffled[2] || shuffled[0] === shuffled[2]) {
      shuffled = [...symbols].sort(() => 0.5 - Math.random());
    }
    setReelSymbols([shuffled[0], shuffled[1], shuffled[2]]);
    clearCoins();
  }, [clearCoins]);

  // Funzione per creare la cascata di monete
  const triggerCoinRainBody = () => {
    for (let i = 0; i < 180; i++) {
      const coin = document.createElement('div');
      coin.className = 'coin-body';

      const size = Math.random() * 15 + 25;
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      coin.style.top = `-${size}px`;

      coin.style.left = `${Math.random() * 100}vw`;

      const animationDuration = Math.random() * 2 + 2;
      const animationDelay = Math.random() * 1.5;
      coin.style.animationDuration = `${animationDuration}s`;
      coin.style.animationDelay = `${animationDelay}s`;

      document.body.appendChild(coin);

      setTimeout(() => {
        if (coin.parentNode) {
            coin.remove();
        }
      }, (animationDuration + animationDelay) * 1000 + 1000);
    }
  };

  // EFFETTO PER CAMBIARE LO SFONDO DEL BODY IN BASE ALLA SCHERMATA
  useEffect(() => {
    document.body.classList.remove('body-detailed-start-bg', 'body-simple-start-bg', 'body-game-bg');

    if (currentScreen === 'detailedStart') {
      document.body.classList.add('body-detailed-start-bg');
    } else if (currentScreen === 'simpleStart') {
      document.body.classList.add('body-simple-start-bg');
    } else if (currentScreen === 'game') {
      document.body.classList.add('body-game-bg');
    }

    return () => {
      document.body.classList.remove('body-detailed-start-bg', 'body-simple-start-bg', 'body-game-bg');
    };
  }, [currentScreen]);

  // Effetto per gestire gli eventi della tastiera (Enter, Spacebar, R)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === ' ') {
        event.preventDefault();
      }

      if (currentScreen === 'detailedStart') {
        if (event.key === 'Enter' || event.key === ' ') {
          handleStart();
        }
      } else if (currentScreen === 'simpleStart') {
        if (event.key === 'Enter' || event.key === ' ') {
          handleActualGameStart();
        }
      } else if (currentScreen === 'game') {
        if (event.key === 'Enter' || event.key === ' ') {
          if (handleSpinRef.current) {
            handleSpinRef.current();
          }
        } else if (event.key === 'r' || event.key === 'R') {
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentScreen, handleStart, handleActualGameStart, handleSpin, handleRestart]);

  // --- Logica di Rendering Condizionale per le Tre Schermate ---
  if (currentScreen === 'detailedStart') {
    return (
      <div className="App">
        {/* Sezione Leggenda e Come funziona */}
        <div className="legend">
          <div className="how-to-play">
            <h3>📘 Come funziona il gioco</h3>
            <h4>1. Vuoi iniziare subito?</h4>
            <p style={{ marginTop: '4px', marginBottom: '4px' }}>
              Premi <strong>“Inizia”</strong> senza modificare nulla. Verranno usate le impostazioni predefinite:
            </p>
            <ul>
              <li>💰 Saldo iniziale: <strong>€200</strong></li>
              <li>🎲 Modalità: <strong>casuale</strong> (una vincita ogni due giocate)</li>
              <li>🎯 Costo per giocata: <strong>€10</strong> ogni volta che preme “SPIN”</li>
            </ul>

            <h4><strong>Cosa succede dopo:</strong></h4>
            <ul>
              <li>▶ Premi <strong>“SPIN”</strong> per far partire il rullo.</li>
              <li>🏆 Se escono 3 simboli uguali, vinci l’importo corrispondente (vedi legenda).</li>
              <li>🎰 In modalità casuale, ogni terza giocata è vincente.</li>
              <li>💹 Il saldo si aggiorna automaticamente dopo ogni giocata.</li>
              <li>🔄 Se il saldo arriva a €0, viene ricaricato automaticamente a €200.</li>
            </ul>

            <h4>2. Prima di iniziare vuoi impostare i parametri manualmente?</h4>
            <ul>
              <li><strong>Saldo iniziale:</strong> è il budget iniziale. Sale se vinci, scende se perdi.</li>
              <li><strong>Modalità:</strong>
                <ul>
                  <li>🏅 <strong>Vincente:</strong> vinci sempre.</li>
                  <li>💀 <strong>Perdente:</strong> perdi sempre.</li>
                  <li>⚖️ <strong>Casuale:</strong> ogni terza giocata è vincente.</li>
                </ul>
              </li>
              <li><strong>Costo per giocata:</strong> quanto spendi ogni volta che premi “SPIN” (es: €10).</li>
            </ul>

            <h4>3. Durante il gioco puoi usare:</h4>
            <ul>
              <li><strong>🔁 Indietro:</strong> torna alla schermata iniziale per impostare tutto da capo.</li>
              <li><strong>♻️ Ricaricare Conto:</strong> ripristina i valori predefiniti (saldo €200, modalità casuale, costo €10) senza uscire dalla slot.</li>
              <li><strong>⌨️ Tasti rapidi:</strong> Puoi usare <strong>"Invio"</strong> o <strong>"Spazio"</strong> per avviare il gioco o per fare lo spin, e <strong>"R"</strong> per ricomincia la partita.</li>
            </ul>
          </div>
          <h3>Legenda Vincite</h3>
          <table>
            <thead>
              <tr>
                <th>Simbolo</th>
                <th>Nome</th>
                <th>Vincita (€)</th>
                <th>Rarità</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => (
                <tr key={sym}>
                  <td>{sym}</td>
                  <td>{symbolData[sym].name}</td>
                  <td>{symbolData[sym].prize}€</td>
                  <td>{symbolData[sym].rarity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box delle impostazioni iniziali */}
        <div className="setup-box">
          <h2>Impostazioni iniziali</h2>
          <label>Saldo iniziale (€):
            <input
              type="number"
              value={defaultSettings.balance}
              onChange={(e) =>
                setDefaultSettings({ ...defaultSettings, balance: e.target.value })
              }
            />
          </label>
          <label>Modalità:
            <select
              value={defaultSettings.mode}
              onChange={(e) =>
                setDefaultSettings({ ...defaultSettings, mode: e.target.value })
              }
            >
              <option value="random">Casuale</option>
              <option value="win">Vincente</option>
              <option value="lose">Perdente</option>
            </select>
          </label>
          <label>Costo giocata (€):
            <input
              type="number"
              min="1"
              max="200"
              value={defaultSettings.cost}
              onChange={(e) =>
                setDefaultSettings({ ...defaultSettings, cost: e.target.value })
              }
            />
          </label>
          <button onClick={handleStart}>Inizia</button>
        </div>
      </div>
    );
  } else if (currentScreen === 'simpleStart') {
    return (
      <div className="App simple-start-screen">
        <div className="start-content">
          <img src={logo} alt="Slot Machine Logo" className="start-logo" />
         <h1 className="start-message">Inizia un'altra partita!</h1>
          <button
            className="glow-on-hover"
            onClick={handleActualGameStart}
          >
            START
          </button>
        </div>
      </div>
    );
  } else { // currentScreen === 'game'
    return (
      <div className="game-screen-container">
        <div className="App"> {/* Ho rimosso lo spazio extra qui */}
          <div className="slot-container" ref={slotRef}>
            <img src={logo} alt="logo" className="logo" />
            <div className="message">
              <div className="balance-row">
                <span>Saldo: {balance}€</span>
                <span className={`cost-message ${costMessage ? 'show' : ''}`}>
                  {costMessage || '\u00A0'}
                </span>
              </div>
              <span className={`win-message ${winMessage ? 'show' : ''}`}>
                {winMessage || '\u00A0'}
              </span>
            </div>

            <div className="slot">
              {reelSymbols.map((symbol, idx) => (
                <div key={idx} className="reel-box">{symbol}</div>
              ))}
            </div>

            <button className="spin-btn" onClick={handleSpin} disabled={spinning}>
              <strong>SPIN</strong>
            </button>
          </div>

          <div className="controls">
            <button onClick={handleReset}>Indietro</button>
            <button onClick={handleRestart}>Ricaricare Conto</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;