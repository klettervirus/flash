// === KONSTANTEN ===
const SYLLABLE_DECAY = 0.8;
const DEFAULT_WORDS = ["Haus","Sonne","Blume","Katze","Hund","Baum","Tisch","Stuhl","Buch","Auto","Fenster","Garten","Regen","Wolke","Stern","Vogel","Fisch","Pferd","Apfel","Birne","Erdbeere","Banane","Orange","Tomate","Gurke","Blumentopf","Regenbogen","Schmetterling","Spielplatz","Fahrrad","Computer","Telefon","Tasche","Schere","Klebstoff","Freundschaft","Geburtstag","Weihnachten","Ostern","Ferien","Schwimmbad","Turnhalle","Klassenzimmer","Pausenhof","Bibliothek","Abenteuer","Geschichte","Märchen","Dinosaurier","Roboter"];
const ANTI_RATEN = ["deine","deiner","deines","Hund","Hunde","Buch","Bücher","Hand","Hände","der","die","das","den","denen","des","dies","dessen","denn","Daten","davon"];
const SINGULAR_PLURAL = ["Schiffe","Schiff","Hosen","Hose","Garten","Lieder","Lied","Tische","Tisch","Pflanzen","Pflanze","Papiere","Papier","Namen","Name","Schwestern","Schwester","Zahl","Zahlen","Tüten","Tüte","Häuser","Haus","Taschen","Tasche","Sätze","Satz","Platz","Plätze","Schüsseln","Schüssel","Kreise","Kreis","Wiese","Wiesen","Schuhe","Schuh","Kinder","Kind","Köpfe","Kopf","Männer","Mann","Haare","Haar"];

const MOTIVATIONAL_QUOTES = [
    "Du bist ein Leseprofi! 📚",
    "Wow, du wirst immer schneller! 🚀",
    "Fantastisch gelesen! ⭐",
    "Du rockst das Training! 🎸",
    "Weiter so, Champion! 🏆",
    "Deine Augen sind super schnell! 👀",
    "Genial gemacht! 🌟",
    "Du bist der absolute Blitzleser! ⚡"
];

const ACHIEVEMENTS = {
    first_session: {name: "Erste Schritte", emoji: "👣", desc: "Erste Session abgeschlossen"},
    speed_demon: {name: "Geschwindigkeitsteufel", emoji: "😈", desc: "Unter 100ms erreicht"},
    unicorn_master: {name: "Einhorn-Meister", emoji: "🦄", desc: "Einhorn-Level erreicht"},
    perfect_ten: {name: "Perfekte 10", emoji: "💯", desc: "10 Wörter in Folge richtig"},
    century: {name: "Jahrhundert", emoji: "💯", desc: "100 Wörter gesamt trainiert"},
    streak_week: {name: "Wochenstreak", emoji: "🔥", desc: "7 Tage hintereinander trainiert"},
    accuracy_king: {name: "Genauigkeitskönig", emoji: "👑", desc: "100% in einer Session"}
};
// === STATE ===
let state = {
    screen: 'start',
    settings: {
        baseDuration: 250,
        shuffle: true,
        repeatWords: false,
        adaptiveSpeed: true,
        adaptiveThreshold: 2,
        adaptiveStep: 10,
        requireTyping: false,
        soundEnabled: true,
        vibrationEnabled: true,
        fontSize: 'normal',
        overrideSpeed: false
    },
    lists: [
        {id:'default',name:'Standard-Wortliste',words:DEFAULT_WORDS,isDefault:true,active:true},
        {id:'anti-raten',name:'Anti Raten',words:ANTI_RATEN,isDefault:false,active:false},
        {id:'singular-plural',name:'Singular/Plural',words:SINGULAR_PLURAL,isDefault:false,active:false}
    ],
    activeListId: 'default',
    showListMgr: false,
    settingsTab: 'lists',
    newListName: '',
    session: null,
    idx: 0,
    countdown: null,
    showWord: false,
    showBtns: false,
    paused: false,
    results: [],
    history: JSON.parse(localStorage.getItem('blitzlesen-history')||'[]'),
    consCorrect: 0,
    consWrong: 0,
    curDur: parseInt(localStorage.getItem('blitzlesen-last-speed')) || 250,
    typed: '',
    feedback: null,
    correctWordToShow: null,
    totalWordsEver: parseInt(localStorage.getItem('blitzlesen-total-words')) || 0,
    achievements: JSON.parse(localStorage.getItem('blitzlesen-achievements')||'[]'),
    streak: 0,
    xp: parseInt(localStorage.getItem('blitzlesen-xp')) || 0,
    showStats: false,
    newAchievements: []
};

const saved = localStorage.getItem('blitzlesen-wordlists');
if(saved) {
    state.lists = JSON.parse(saved);
    state.lists.forEach(l => {
        if(l.active === undefined) l.active = l.isDefault;
    });
}
const savedActive = localStorage.getItem('blitzlesen-active-list');
if(savedActive) state.activeListId = savedActive;
// === HILFSFUNKTIONEN ===
const calcTime = (syl, base) => base * 5 * (1 - Math.pow(SYLLABLE_DECAY, syl));

const getTier = d => {
    const range = (min, max) => {
        const third = Math.ceil((max - min) / 3);
        if(d <= min + third) return '👑👑👑';
        if(d <= min + 2*third) return '👑👑';
        return '👑';
    };
    
    if(d < 20) d = 20;
    if(d >= 20 && d <= 49) return {n:'Einhorn',e:'🦄',c:'from-pink-400 via-purple-400 to-blue-400',l:'LEGENDÄR!',cr:range(20,49)};
    if(d >= 50 && d <= 100) return {n:'Gepard',e:'🐆',c:'from-yellow-400 to-orange-500',l:'Blitzschnell!',cr:range(50,100)};
    if(d >= 101 && d <= 150) return {n:'Hase',e:'🐰',c:'from-green-400 to-emerald-500',l:'Super schnell!',cr:range(101,150)};
    if(d >= 151 && d <= 200) return {n:'Pferd',e:'🐴',c:'from-blue-400 to-cyan-500',l:'Schnell!',cr:range(151,200)};
    if(d >= 201 && d <= 250) return {n:'Fuchs',e:'🦊',c:'from-orange-400 to-red-500',l:'Flink!',cr:range(201,250)};
    if(d >= 251 && d <= 300) return {n:'Katze',e:'🐈',c:'from-purple-400 to-pink-500',l:'Geschickt!',cr:range(251,300)};
    if(d >= 301 && d <= 350) return {n:'Eichhörnchen',e:'🐿️',c:'from-amber-400 to-orange-400',l:'Munter!',cr:range(301,350)};
    if(d >= 351 && d <= 400) return {n:'Igel',e:'🦔',c:'from-yellow-300 to-amber-400',l:'Gemütlich',cr:range(351,400)};
    if(d >= 401 && d <= 450) return {n:'Ente',e:'🦆',c:'from-blue-300 to-teal-400',l:'Entspannt',cr:range(401,450)};
    return {n:'Pinguin',e:'🐧',c:'from-gray-300 to-slate-400',l:'Start!',cr:''};
};

const countSyl = w => {
    const v = w.toLowerCase().replace(/[^a-zäöüß]/g,'').match(/[aeiouäöüy]+/g);
    return v ? v.length : 1;
};

const procWords = wl => wl.map(w => ({text:w, syllables:countSyl(w)}));

const shuffle = a => {
    const s = [...a];
    for(let i=s.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [s[i],s[j]] = [s[j],s[i]];
    }
    return s;
};

const parse = t => t.split('\n').map(w=>w.trim()).filter(w=>w.length>0);
const getActive = () => state.lists.find(l=>l.id===state.activeListId)||state.lists[0];
const getActiveLists = () => state.lists.filter(l=>l.active);

function calculateStreak() {
    const history = JSON.parse(localStorage.getItem('blitzlesen-history')||'[]');
    if(history.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().setHours(0,0,0,0);
    const dates = [...new Set(history.map(s => new Date(s.date).setHours(0,0,0,0)))].sort((a,b) => b-a);
    
    for(let i = 0; i < dates.length; i++) {
        const dayDiff = Math.floor((today - dates[i]) / (1000*60*60*24));
        if(dayDiff === i) streak++;
        else break;
    }
    return streak;
}

state.streak = calculateStreak();

function playSound(type) {
    if(!state.settings.soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if(type === 'correct') {
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else if(type === 'wrong') {
        osc.frequency.value = 200;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    } else if(type === 'achievement') {
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

function vibrate(pattern) {
    if(state.settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

function spawnConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for(let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

function checkAchievements() {
    const newAchievements = [];
    
    if(state.history.length === 1 && !state.achievements.includes('first_session')) {
        newAchievements.push('first_session');
    }
    
    if(state.curDur < 100 && !state.achievements.includes('speed_demon')) {
        newAchievements.push('speed_demon');
    }
    
    if(state.curDur < 50 && !state.achievements.includes('unicorn_master')) {
        newAchievements.push('unicorn_master');
    }
    
    if(state.consCorrect >= 10 && !state.achievements.includes('perfect_ten')) {
        newAchievements.push('perfect_ten');
    }
    
    if(state.totalWordsEver >= 100 && !state.achievements.includes('century')) {
        newAchievements.push('century');
    }
    
    if(state.streak >= 7 && !state.achievements.includes('streak_week')) {
        newAchievements.push('streak_week');
    }
    
    const latest = state.history[0];
    if(latest && latest.accuracy === 100 && !state.achievements.includes('accuracy_king')) {
        newAchievements.push('accuracy_king');
    }
    
    if(newAchievements.length > 0) {
        state.achievements.push(...newAchievements);
        localStorage.setItem('blitzlesen-achievements', JSON.stringify(state.achievements));
        playSound('achievement');
        vibrate([200, 100, 200]);
        return newAchievements;
    }
    return [];
}
// === SESSION FUNKTIONEN ===
function startSession() {
    const activeLists = getActiveLists();
    if(activeLists.length === 0) {
        alert('Bitte mindestens eine Liste aktivieren!');
        return;
    }
    
    const allWords = activeLists.flatMap(list => list.words);
    if(allWords.length === 0) {
        alert('Die aktiven Listen enthalten keine Wörter!');
        return;
    }
    
    const processedWords = procWords(allWords);
    const words = state.settings.shuffle ? shuffle(processedWords) : processedWords;
    
    const startSpeed = state.settings.overrideSpeed ? state.settings.baseDuration : state.curDur;
    state.curDur = startSpeed;
    
    state.session = {
        words, 
        startTime: new Date().toISOString(), 
        initialBaseDuration: startSpeed, 
        listName: activeLists.map(l => l.name).join(', '),
        isEndless: state.settings.repeatWords
    };
    state.idx = 0;
    state.results = [];
    state.consCorrect = 0;
    state.consWrong = 0;
    state.screen = 'training';
    state.paused = false;
    render();
    startCountdown();
}

function startCountdown() {
    state.countdown = 3;
    state.showWord = false;
    state.showBtns = false;
    state.feedback = null;
    render();
    runCountdown();
}

function runCountdown() {
    if(state.paused) return;
    if(state.countdown > 0) {
        setTimeout(() => {
            state.countdown--;
            render();
            runCountdown();
        }, 700);
    } else {
        showCurrentWord();
    }
}

function showCurrentWord() {
    state.countdown = null;
    state.showWord = true;
    state.typed = '';
    render();
    const word = state.session.words[state.idx];
    const displayTime = calcTime(word.syllables, state.curDur);
    setTimeout(() => {
        if(!state.paused && state.screen === 'training') {
            state.showWord = false;
            state.showBtns = true;
            render();
        }
    }, displayTime);
}

function handleAnswer(correct) {
    playSound(correct ? 'correct' : 'wrong');
    vibrate(correct ? [50] : [100, 50, 100]);
    
    state.results.push({
        word: state.session.words[state.idx].text, 
        correct, 
        baseDuration: state.curDur, 
        syllables: state.session.words[state.idx].syllables
    });
    
    const oldTier = getTier(state.curDur).n;
    
    if(state.settings.adaptiveSpeed) {
        if(correct) {
            state.consCorrect++;
            state.consWrong = 0;
            if(state.consCorrect >= state.settings.adaptiveThreshold && state.curDur > 20) {
                const delta = state.curDur < 120 ? state.settings.adaptiveStep * 0.5 : state.settings.adaptiveStep;
                state.curDur = Math.max(20, state.curDur - delta);
                state.consCorrect = 0;
            }
        } else {
            state.consWrong++;
            state.consCorrect = 0;
            if(state.consWrong >= state.settings.adaptiveThreshold && state.curDur < 500) {
                const delta = state.curDur < 120 ? state.settings.adaptiveStep * 0.5 : state.settings.adaptiveStep;
                state.curDur = Math.min(500, state.curDur + delta);
                state.consWrong = 0;
            }
        }
    }
    
    const newTier = getTier(state.curDur).n;
    const hasTierUpgrade = oldTier !== newTier;
    
    if(state.idx < state.session.words.length - 1) {
        state.idx++;
        state.showBtns = false;
        render();
        
        if(hasTierUpgrade) {
            showTierUpgrade(oldTier, newTier);
            setTimeout(() => startCountdown(), 3500);
        } else {
            startCountdown();
        }
    } else if(state.session.isEndless) {
        // Zurück zum Anfang - Endlos-Modus
        state.idx = 0;
        if(state.settings.shuffle) {
            state.session.words = shuffle(state.session.words);
        }
        state.showBtns = false;
        render();
        
        if(hasTierUpgrade) {
            showTierUpgrade(oldTier, newTier);
            setTimeout(() => startCountdown(), 3500);
        } else {
            startCountdown();
        }
    } else {
        finishSession();
    }
}

function showTierUpgrade(oldTier, newTier) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 slide-in';
    overlay.innerHTML = `
        <div class="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <div class="text-6xl mb-4 animate-bounce">${getTier(state.curDur).e}</div>
            <h2 class="text-4xl font-bold text-indigo-600 mb-2">Level Up!</h2>
            <p class="text-xl text-gray-700">Von ${oldTier} zu ${newTier}!</p>
            <div class="text-5xl mt-4 crown-shine">${getTier(state.curDur).cr}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    spawnConfetti();
    playSound('achievement');
    vibrate([200, 100, 200, 100, 200]);
    setTimeout(() => overlay.remove(), 3000);
}

function handleTypedSubmit() {
    const correctWord = state.session.words[state.idx].text;
    const userWord = state.typed.trim();
    const isCorrect = userWord === correctWord;
    state.feedback = isCorrect ? 'correct' : 'wrong';
    
    if(!isCorrect) {
        state.correctWordToShow = correctWord;
    }
    
    render();
    setTimeout(() => {
        state.feedback = null;
        state.correctWordToShow = null;
        handleAnswer(isCorrect);
    }, 2000);
}

function finishSession() {
    const correct = state.results.filter(r=>r.correct).length;
    const total = state.results.length;
    const accuracy = Math.round((correct/total)*100);
    
    state.totalWordsEver += total;
    localStorage.setItem('blitzlesen-total-words', state.totalWordsEver);
    
    const xpGained = correct * 10 + (accuracy === 100 ? 50 : 0);
    state.xp += xpGained;
    localStorage.setItem('blitzlesen-xp', state.xp);
    
    localStorage.setItem('blitzlesen-last-speed', state.curDur);
    
    const bySyllables = {};
    state.results.forEach(result => {
        const syllables = result.syllables;
        if(!bySyllables[syllables]) bySyllables[syllables] = {total:0, correct:0};
        bySyllables[syllables].total++;
        if(result.correct) bySyllables[syllables].correct++;
    });
    
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        totalWords: total,
        correctWords: correct,
        accuracy,
        initialBaseDuration: state.session.initialBaseDuration,
        finalBaseDuration: state.curDur,
        listName: state.session.listName,
        bySyllables,
        xpGained
    };
    
    state.history.unshift(session);
    localStorage.setItem('blitzlesen-history', JSON.stringify(state.history));
    
    state.streak = calculateStreak();
    
    const newAchievements = checkAchievements();
    
    state.screen = 'results';
    state.newAchievements = newAchievements;
    render();
    
    if(accuracy === 100) {
        setTimeout(() => spawnConfetti(), 500);
    }
}

function togglePause() {
    state.paused = !state.paused;
    if(!state.paused && state.countdown !== null) runCountdown();
    else if(!state.paused && state.showWord) showCurrentWord();
    render();
}

function confirmEnd() {
    if(state.results.length === 0) {
        if(confirm('Noch keine Wörter bewertet. Wirklich beenden?')) {
            state.screen = 'start';
            render();
        }
    } else {
        finishSession();
    }
}

function exportCSV() {
    const csv = [
        ['Datum', 'Liste', 'Gesamt', 'Richtig', 'Genauigkeit', 'Start-Dauer', 'End-Dauer', 'XP'],
        ...state.history.map(s => [
            new Date(s.date).toLocaleString('de-DE'),
            s.listName || 'Standard',
            s.totalWords,
            s.correctWords,
            s.accuracy + '%',
            s.initialBaseDuration + 'ms',
            (s.finalBaseDuration || s.initialBaseDuration) + 'ms',
            s.xpGained || 0
        ])
    ].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'blitzlesen-verlauf.csv';
    link.click();
}

// === WORTLISTEN-VERWALTUNG ===
function createList() {
    if(!state.newListName.trim()) return;
    const newList = {
        id: Date.now().toString(),
        name: state.newListName,
        words: [],
        isDefault: false,
        active: true
    };
    state.lists.push(newList);
    state.activeListId = newList.id;
    state.newListName = '';
    state.showListMgr = false;
    localStorage.setItem('blitzlesen-wordlists', JSON.stringify(state.lists));
    localStorage.setItem('blitzlesen-active-list', newList.id);
    render();
}

function deleteList(listId) {
    if(state.lists.find(l => l.id === listId)?.isDefault) return;
    state.lists = state.lists.filter(list => list.id !== listId);
    if(state.activeListId === listId) {
        state.activeListId = 'default';
        localStorage.setItem('blitzlesen-active-list', 'default');
    }
    localStorage.setItem('blitzlesen-wordlists', JSON.stringify(state.lists));
    render();
}

function switchList(listId) {
    state.activeListId = listId;
    localStorage.setItem('blitzlesen-active-list', listId);
    render();
}

function toggleListActive(listId) {
    const list = state.lists.find(l => l.id === listId);
    if(list) {
        list.active = !list.active;
        localStorage.setItem('blitzlesen-wordlists', JSON.stringify(state.lists));
        render();
    }
}

function handleCSVUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const words = text.split(/[\n,;]/).map(w => w.trim()).filter(w => w.length > 0);
        const activeList = state.lists.find(list => list.id === state.activeListId);
        if(activeList) {
            activeList.words = words;
            localStorage.setItem('blitzlesen-wordlists', JSON.stringify(state.lists));
            render();
        }
    };
    reader.readAsText(file);
}

// === KEYBOARD & SWIPE ===
document.addEventListener('keydown', (e) => {
    if(state.screen === 'training' && state.showBtns && !state.settings.requireTyping) {
        if(e.key === ' ' || e.key === 'y' || e.key === 'Y') {
            e.preventDefault();
            handleAnswer(true);
        } else if(e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            handleAnswer(false);
        }
    }
});

let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
    if(state.screen === 'training' && state.showBtns && !state.settings.requireTyping) {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        if(Math.abs(diff) > 100) {
            if(diff > 0) handleAnswer(true);
            else handleAnswer(false);
        }
    }
});
// === RENDER FUNKTIONEN ===
function render() {
    const app = document.getElementById('app');
    const screens = {
        start: renderStart, 
        settings: renderSettings, 
        training: renderTraining, 
        results: renderResults, 
        history: renderHistory
    };
    app.innerHTML = `<div class="min-h-screen flex items-center justify-center p-4"><div class="w-full max-w-2xl">${screens[state.screen]()}</div></div>`;
    attachEvents();
}

function renderStart() {
    const tier = getTier(state.curDur);
    const level = Math.floor(state.xp / 100) + 1;
    const xpInLevel = state.xp % 100;
    const totalCorrect = state.history.reduce((sum, s) => sum + s.correctWords, 0);
    
    return `
<div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
    <div class="text-center mb-6">
        <h1 class="text-4xl md:text-5xl font-bold text-indigo-600 mb-3">⚡ Blitzlesen</h1>
        <p class="text-gray-600 text-lg">Trainiere deine Lesekraft</p>
    </div>
    
    <div class="bg-gradient-to-r ${tier.c} rounded-2xl p-6 mb-6 text-white text-center">
        <div class="text-5xl mb-2">${tier.e}</div>
        <div class="font-bold text-2xl mb-1">${tier.n} ${tier.cr}</div>
        <div class="text-sm opacity-90">${tier.l} • ${state.curDur}ms</div>
        <div class="mt-3 text-sm">Level ${level} • ${state.xp} XP</div>
        <div class="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
            <div class="bg-white h-2 rounded-full transition-all" style="width: ${xpInLevel}%"></div>
        </div>
    </div>
    
    ${state.streak > 0 ? `<div class="bg-orange-100 border-2 border-orange-300 rounded-xl p-4 mb-6 text-center">
        <div class="text-3xl mb-1">🔥</div>
        <div class="font-bold text-orange-600">${state.streak} Tage Streak!</div>
    </div>` : ''}
    
    <div class="grid grid-cols-3 gap-3 mb-6 text-center">
        <div class="bg-indigo-50 rounded-xl p-3">
            <div class="text-2xl font-bold text-indigo-600">${state.history.length}</div>
            <div class="text-xs text-gray-600">Sessions</div>
        </div>
        <div class="bg-green-50 rounded-xl p-3">
            <div class="text-2xl font-bold text-green-600">${totalCorrect}</div>
            <div class="text-xs text-gray-600">Wörter</div>
        </div>
        <div class="bg-purple-50 rounded-xl p-3">
            <div class="text-2xl font-bold text-purple-600">${state.achievements.length}</div>
            <div class="text-xs text-gray-600">Erfolge</div>
        </div>
    </div>
    
    ${state.achievements.length > 0 ? `<div class="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
        <div class="font-bold text-gray-800 mb-2 text-center">🏆 Erfolge</div>
        <div class="flex flex-wrap gap-2 justify-center">
            ${state.achievements.map(a => `<div class="text-3xl" title="${ACHIEVEMENTS[a]?.name || a}">${ACHIEVEMENTS[a]?.emoji || '🏅'}</div>`).join('')}
        </div>
    </div>` : ''}
    
    <div class="space-y-4">
        <button onclick="startSession()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg shadow-lg">
            ▶ Training starten
        </button>
        <button onclick="toSettings()" class="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-semibold py-4 px-6 rounded-xl transition-all text-lg hover:bg-indigo-50">
            ⚙️ Einstellungen
        </button>
        ${state.history.length > 0 ? `<button onclick="toHistory()" class="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-semibold py-4 px-6 rounded-xl transition-all text-lg hover:bg-indigo-50">
            📊 Verlauf (${state.history.length})
        </button>` : ''}
    </div>
</div>`;
}

function renderSettings() {
    const activeListsCount = getActiveLists().length;
    
    return `
<div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto">
    <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Einstellungen</h2>
    
    <div class="flex gap-2 mb-6 border-b-2 border-gray-200">
        <button onclick="switchSettingsTab('lists')" 
                class="flex-1 py-3 px-4 font-semibold transition-all ${state.settingsTab==='lists'?'text-indigo-600 border-b-4 border-indigo-600':'text-gray-500 hover:text-gray-700'}">
            📚 Wortlisten (${activeListsCount})
        </button>
        <button onclick="switchSettingsTab('advanced')" 
                class="flex-1 py-3 px-4 font-semibold transition-all ${state.settingsTab==='advanced'?'text-indigo-600 border-b-4 border-indigo-600':'text-gray-500 hover:text-gray-700'}">
            ⚙️ Erweitert
        </button>
    </div>
    
    ${state.settingsTab === 'lists' ? renderListsTab() : renderAdvancedTab()}
    
    <div class="flex gap-3 mt-8">
        <button onclick="toStart()" class="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all">
            Abbrechen
        </button>
        <button onclick="startSession()" class="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Los geht's!
        </button>
    </div>
</div>`;
}

function renderListsTab() {
    return `
    <div class="space-y-6">
        <div class="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-gray-800">Aktive Listen</h4>
                <button onclick="state.showListMgr=!state.showListMgr;render()" 
                        class="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg transition-all">
                    ${state.showListMgr ? 'Schließen' : '+ Neue Liste'}
                </button>
            </div>
            
            <div class="space-y-2 max-h-64 overflow-y-auto">
                ${state.lists.map(l => `
                    <div class="bg-white rounded-lg p-3 flex items-center gap-3">
                        <button onclick="toggleListActive('${l.id}')" 
                                class="w-12 h-7 rounded-full transition-all ${l.active?'bg-green-500':'bg-gray-300'}">
                            <div class="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${l.active?'translate-x-6':'translate-x-1'}"></div>
                        </button>
                        <button onclick="switchList('${l.id}')" 
                                class="flex-1 text-left font-semibold ${state.activeListId===l.id?'text-indigo-600':'text-gray-700'} hover:text-indigo-500 transition-colors">
                            ${l.name} (${l.words.length})
                        </button>
                        ${!l.isDefault?`<button onclick="if(confirm('Liste wirklich löschen?'))deleteList('${l.id}')" 
                                class="text-red-500 hover:text-red-700 text-sm px-2 transition-colors">🗑️</button>`:''}
                    </div>
                `).join('')}
            </div>
            
            ${state.showListMgr?`
                <div class="mt-4 pt-4 border-t-2 border-indigo-200">
                    <div class="flex gap-2">
                        <input type="text" id="newListName" placeholder="Name für neue Liste..." 
                               value="${state.newListName}"
                               class="flex-1 px-3 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors">
                        <button onclick="createList()" 
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                            Erstellen
                        </button>
                    </div>
                </div>
            `:''}
        </div>
        
        <div>
            <div class="flex items-center justify-between mb-3">
                <label class="font-semibold text-gray-700">
                    ✏️ ${getActive().name} bearbeiten
                </label>
                <button onclick="uploadCSV()" 
                        class="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-all">
                    📤 CSV Import
                </button>
            </div>
            <textarea id="wordArea" 
                      class="w-full h-48 p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-sm transition-colors"
                      placeholder="Ein Wort pro Zeile...">${getActive().words.join('\n')}</textarea>
            <p class="text-xs text-gray-500 mt-1">${getActive().words.length} Wörter</p>
        </div>
        
        <div class="space-y-4 bg-gray-50 rounded-xl p-4">
            <h4 class="font-bold text-gray-800">Listen-Einstellungen</h4>
            
            <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                    <span class="font-semibold text-gray-700 block">🔀 Wörter mischen</span>
                    <span class="text-xs text-gray-500">Zufällige Reihenfolge</span>
                </div>
                <button onclick="toggleSetting('shuffle')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.shuffle?'bg-indigo-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.shuffle?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                    <span class="font-semibold text-gray-700 block">🔁 Endlos-Modus</span>
                    <span class="text-xs text-gray-500">Liste immer wiederholen</span>
                </div>
                <button onclick="toggleSetting('repeatWords')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.repeatWords?'bg-purple-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.repeatWords?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                    <span class="font-semibold text-gray-700 block">⌨️ Wort eintippen</span>
                    <span class="text-xs text-gray-500">Statt Ja/Nein-Buttons</span>
                </div>
                <button onclick="toggleSetting('requireTyping')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.requireTyping?'bg-purple-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.requireTyping?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            <div class="p-3 bg-white rounded-lg" id="overrideSpeedContainer">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <span class="font-semibold text-gray-700 block">🚀 Startgeschwindigkeit überschreiben</span>
                        <span class="text-xs text-gray-500">Ignoriert erspielte Geschwindigkeit (${state.curDur}ms)</span>
                    </div>
                    <button onclick="toggleSetting('overrideSpeed')" 
                            class="w-14 h-8 rounded-full transition-all ${state.settings.overrideSpeed?'bg-red-600':'bg-gray-300'}">
                        <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.overrideSpeed?'translate-x-7':'translate-x-1'}"></div>
                    </button>
                </div>
                ${state.settings.overrideSpeed?`
                    <div id="overrideSpeedSlider">
                        <label class="block text-gray-700 font-semibold mb-2" id="speedLabel">
                            Startgeschwindigkeit: <span class="text-red-600">${state.settings.baseDuration}ms</span>
                        </label>
                        <input type="range" min="20" max="500" step="10" value="${state.settings.baseDuration}" 
                               id="baseDurationSlider" 
                               class="w-full h-3 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600">
                    </div>
                `:''}
            </div>
        </div>
    </div>`;
}

function renderAdvancedTab() {
    return `
    <div class="space-y-6">
        <div class="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <span class="font-semibold text-gray-700 block">⚡ Adaptive Geschwindigkeit</span>
                    <span class="text-sm text-gray-500">${state.settings.adaptiveThreshold} richtig → -${state.settings.adaptiveStep}ms</span>
                </div>
                <button onclick="toggleSetting('adaptiveSpeed')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.adaptiveSpeed?'bg-green-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.adaptiveSpeed?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            ${state.settings.adaptiveSpeed?`
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            Nach X Wörtern: <span class="text-green-600">${state.settings.adaptiveThreshold}</span>
                        </label>
                        <input type="range" min="2" max="10" step="1" value="${state.settings.adaptiveThreshold}" 
                               id="thresholdSlider" 
                               class="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            Delta: <span class="text-green-600">±${state.settings.adaptiveStep}ms</span>
                            <span class="text-xs text-gray-500">(bei <120ms halbiert)</span>
                        </label>
                        <input type="range" min="5" max="50" step="5" value="${state.settings.adaptiveStep}" 
                               id="stepSlider" 
                               class="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600">
                    </div>
                </div>
            `:''}
        </div>
        
        <div class="space-y-3">
            <h4 class="font-bold text-gray-800">🔊 Feedback & Anzeige</h4>
            
            <div class="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <span class="font-semibold text-gray-700">🔊 Sound-Effekte</span>
                <button onclick="toggleSetting('soundEnabled')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.soundEnabled?'bg-blue-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.soundEnabled?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                <span class="font-semibold text-gray-700">📳 Vibration</span>
                <button onclick="toggleSetting('vibrationEnabled')" 
                        class="w-14 h-8 rounded-full transition-all ${state.settings.vibrationEnabled?'bg-pink-600':'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${state.settings.vibrationEnabled?'translate-x-7':'translate-x-1'}"></div>
                </button>
            </div>
            
            <div>
                <label class="block text-gray-700 font-semibold mb-3">📏 Schriftgröße</label>
                <div class="grid grid-cols-3 gap-2">
                    <button onclick="setFontSize('small')" 
                            class="py-2 px-4 rounded-lg font-semibold transition-all ${state.settings.fontSize==='small'?'bg-indigo-600 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                        Klein
                    </button>
                    <button onclick="setFontSize('normal')" 
                            class="py-2 px-4 rounded-lg font-semibold transition-all ${state.settings.fontSize==='normal'?'bg-indigo-600 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                        Normal
                    </button>
                    <button onclick="setFontSize('large')" 
                            class="py-2 px-4 rounded-lg font-semibold transition-all ${state.settings.fontSize==='large'?'bg-indigo-600 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                        Groß
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function switchSettingsTab(tab) {
    state.settingsTab = tab;
    render();
}
function renderTraining() {
    const tier = getTier(state.curDur);
    const fontSizeClass = state.settings.fontSize === 'small' ? 'text-4xl md:text-5xl' : 
                          state.settings.fontSize === 'large' ? 'text-5xl md:text-7xl' : 
                          'text-5xl md:text-7xl';
    
    let content = '';
    if(state.countdown !== null && state.countdown > 0) {
        content = `<div class="text-9xl font-bold text-indigo-600 animate-pulse">${state.countdown}</div>`;
    } else if(state.showWord) {
        content = `<div class="${fontSizeClass} font-bold text-gray-800 text-center break-words px-4">${state.session.words[state.idx].text}</div>`;
    } else if(state.showBtns) {
        if(state.feedback) {
            content = `<div class="flex flex-col items-center py-12 ${state.feedback==='correct'?'text-green-600':'text-red-600'}">
                <div class="text-9xl mb-4">${state.feedback==='correct'?'👍':'👎'}</div>
                <div class="text-3xl font-bold">${state.feedback==='correct'?'Richtig!':'Falsch!'}</div>
                ${state.correctWordToShow ? `<div class="text-2xl text-gray-700 mt-4">Korrekt war: <span class="font-bold text-indigo-600">${state.correctWordToShow}</span></div>` : ''}
            </div>`;
        } else if(!state.settings.requireTyping) {
            const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
            content = `<div class="w-full max-w-md space-y-4">
                <p class="text-center text-gray-600 text-lg mb-3">Hast du das Wort erkannt?</p>
                <div class="mb-6">
                    <div class="text-center text-gray-500 text-sm mb-2">Wort nochmal anzeigen:</div>
                    <div class="group relative bg-gradient-to-br from-gray-400 to-gray-500 hover:from-white hover:to-gray-50 border-2 border-dashed border-gray-600 rounded-xl p-6 cursor-help transition-all">
                        <div class="text-3xl md:text-4xl font-bold text-center">
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">${state.session.words[state.idx].text}</span>
                            <span class="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300 text-gray-600 text-base">???</span>
                        </div>
                    </div>
                </div>
                <button onclick="handleAnswer(true)" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-8 rounded-xl text-2xl shadow-lg transition-all">
                    ✓ Ja
                </button>
                <button onclick="handleAnswer(false)" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-8 rounded-xl text-2xl shadow-lg transition-all">
                    ✗ Nein
                </button>
                <p class="text-center text-gray-500 text-sm mt-4">${quote}</p>
                <p class="text-center text-gray-400 text-xs">Tipp: Space = Ja, N = Nein oder wischen</p>
            </div>`;
        } else {
            content = `<div class="w-full max-w-md space-y-4">
                <p class="text-center text-gray-600 text-lg mb-3">Welches Wort hast du gesehen?</p>
                <input type="text" id="wordInput" 
                       class="w-full text-2xl text-center p-4 border-4 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors" 
                       placeholder="Wort eingeben..." autocomplete="off">
                <button onclick="checkTyped()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-8 rounded-xl text-2xl shadow-lg transition-all">
                    Prüfen
                </button>
            </div>`;
        }
    }
    
    const wordCount = state.session.isEndless ? `Wort ${state.idx + 1} (Endlos-Modus ∞)` : `Wort ${state.idx + 1} von ${state.session.words.length}`;
    
    return `
<div class="bg-white rounded-3xl shadow-2xl overflow-hidden">
    <div class="bg-gradient-to-r ${tier.c} p-4 text-white">
        <div class="flex items-center justify-center gap-3">
            <span class="text-4xl">${tier.e}</span>
            <div class="text-center">
                <div class="font-bold text-lg">${tier.n}</div>
                <div class="text-sm opacity-90">${tier.l} • ${state.curDur}ms</div>
            </div>
            <span class="text-4xl">${tier.e}</span>
        </div>
        ${tier.cr ? `<div class="text-center text-3xl mt-2 crown-shine">${tier.cr}</div>` : ''}
    </div>
    
    <div class="min-h-[500px] flex items-center justify-center p-8">
        ${content}
    </div>
    
    <div class="bg-gray-50 border-t-2 border-gray-200 p-4">
        <div class="flex gap-2 mb-2">
            <button onclick="toSettings()" class="bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-600 transition-all">
                ⚙️
            </button>
            <button onclick="togglePause()" class="flex-1 bg-yellow-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-all">
                ${state.paused?'▶ Fortsetzen':'⏸ Pause'}
            </button>
            <button onclick="confirmEnd()" class="flex-1 bg-red-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-600 transition-all">
                ⏹ Beenden
            </button>
        </div>
        <div class="text-center text-sm text-gray-600">
            ${wordCount}
        </div>
        ${state.settings.adaptiveSpeed?`<div class="text-xs text-gray-600 text-center mt-1">
            Richtig: ${state.consCorrect}/${state.settings.adaptiveThreshold} | Falsch: ${state.consWrong}/${state.settings.adaptiveThreshold}
            ${state.consCorrect>0 && state.consCorrect<state.settings.adaptiveThreshold?` • Noch ${state.settings.adaptiveThreshold-state.consCorrect} bis schneller! 🎯`:''}
        </div>`:''}
    </div>
</div>`;
}

function renderResults() {
    const latest = state.history[0];
    const tier1 = getTier(latest.initialBaseDuration);
    const tier2 = getTier(latest.finalBaseDuration);
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    
    return `
<div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
    <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">🎯 Geschafft!</h2>
    <p class="text-center text-gray-600 mb-6">${quote}</p>
    
    <div class="text-center mb-6">
        <div class="text-7xl font-bold text-indigo-600 mb-4">${latest.accuracy}%</div>
        <p class="text-xl text-gray-700">${latest.correctWords} von ${latest.totalWords} Wörtern richtig</p>
        <div class="text-green-600 font-bold text-lg mt-2">+${latest.xpGained} XP</div>
        
        ${latest.initialBaseDuration!==latest.finalBaseDuration?`<div class="mt-4 inline-block">
            <div class="bg-gradient-to-r ${tier2.c} text-white px-6 py-3 rounded-full font-bold shadow-lg">
                <span class="text-2xl mr-2">${tier1.e}</span>${tier1.n} ${tier1.cr}
                <span class="mx-2">→</span>
                <span class="text-2xl mr-2">${tier2.e}</span>${tier2.n} ${tier2.cr}
            </div>
        </div>`:`<div class="mt-4 inline-block">
            <div class="bg-gradient-to-r ${tier2.c} text-white px-6 py-3 rounded-full font-bold shadow-lg">
                <span class="text-2xl mr-2">${tier2.e}</span>${tier2.n} ${tier2.cr}
            </div>
        </div>`}
        
        <p class="text-gray-500 mt-3">Liste: ${latest.listName}<br/>${latest.initialBaseDuration}ms → ${latest.finalBaseDuration}ms</p>
    </div>
    
    ${state.newAchievements && state.newAchievements.length > 0 ? `<div class="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">🎉 Neue Erfolge freigeschaltet!</h3>
        <div class="space-y-3">
            ${state.newAchievements.map(a => `<div class="bg-white rounded-xl p-4 flex items-center gap-4">
                <div class="text-4xl">${ACHIEVEMENTS[a]?.emoji || '🏅'}</div>
                <div>
                    <div class="font-bold text-gray-800">${ACHIEVEMENTS[a]?.name || a}</div>
                    <div class="text-sm text-gray-600">${ACHIEVEMENTS[a]?.desc || ''}</div>
                </div>
            </div>`).join('')}
        </div>
    </div>` : ''}
    
    ${latest.bySyllables && Object.keys(latest.bySyllables).length?`<div class="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
        <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">📊 Nach Silbenzahl</h3>
        <div class="space-y-3">
            ${Object.keys(latest.bySyllables).sort((a,b)=>a-b).map(s=>{
                const d = latest.bySyllables[s];
                const p = Math.round((d.correct/d.total)*100);
                return `<div class="bg-white rounded-xl p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold text-gray-700">${s} Silbe${s>1?'n':''}</span>
                        <span class="text-2xl font-bold text-indigo-600">${p}%</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all" style="width:${p}%"></div>
                        </div>
                        <span class="text-sm text-gray-600 min-w-[60px] text-right">${d.correct}/${d.total}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`:''}
    
    <div class="space-y-3">
        <button onclick="startSession()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-lg shadow-lg transition-all">
            🔄 Neues Training
        </button>
        <button onclick="toHistory()" class="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-semibold py-4 px-6 rounded-xl text-lg hover:bg-indigo-50 transition-all">
            📊 Verlauf ansehen
        </button>
        <button onclick="toStart()" class="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl text-lg hover:bg-gray-50 transition-all">
            🏠 Zurück zum Start
        </button>
    </div>
</div>`;
}
function renderHistory() {
    if(state.history.length === 0) {
        return `
<div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
    <div class="text-6xl mb-4">📊</div>
    <h2 class="text-3xl font-bold text-gray-800 mb-4">Noch keine Sessions</h2>
    <p class="text-gray-600 mb-6">Starte dein erstes Training, um deinen Fortschritt zu sehen!</p>
    <button onclick="toStart()" class="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all">
        Zurück
    </button>
</div>`;
    }
    
    const avgAccuracy = Math.round(state.history.reduce((sum, s) => sum + s.accuracy, 0) / state.history.length);
    const bestAccuracy = Math.max(...state.history.map(s => s.accuracy));
    const fastestSpeed = Math.min(...state.history.map(s => s.finalBaseDuration || s.initialBaseDuration));
    
    return `
<div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto">
    <h2 class="text-3xl font-bold text-gray-800 mb-6">📊 Trainings-Verlauf</h2>
    
    <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-blue-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">${avgAccuracy}%</div>
            <div class="text-xs text-gray-600">Ø Genauigkeit</div>
        </div>
        <div class="bg-green-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-green-600">${bestAccuracy}%</div>
            <div class="text-xs text-gray-600">Beste Session</div>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">${fastestSpeed}ms</div>
            <div class="text-xs text-gray-600">Schnellste</div>
        </div>
    </div>
    
    <div class="mb-6 bg-gray-50 rounded-xl p-4">
        <h3 class="font-bold text-gray-800 mb-3 text-center">Geschwindigkeitsentwicklung</h3>
        <canvas id="speedChart"></canvas>
    </div>
    
    <div class="space-y-3 mb-6 max-h-96 overflow-y-auto">
        ${state.history.map((s, idx)=>{
            const tier = getTier(s.finalBaseDuration || s.initialBaseDuration);
            const date = new Date(s.date);
            const isToday = date.toDateString() === new Date().toDateString();
            return `<div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-lg text-indigo-600">${s.accuracy}%</p>
                            <span class="text-2xl">${tier.e}</span>
                        </div>
                        <p class="text-sm text-gray-600">${s.correctWords}/${s.totalWords} Wörter • ${s.xpGained || 0} XP</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">${isToday ? '🔥 Heute' : date.toLocaleDateString('de-DE')}</p>
                        <p class="text-xs text-gray-500">${date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-600">
                    <span>${s.listName||'Standard'}</span>
                    <span>${s.initialBaseDuration}ms → ${s.finalBaseDuration||s.initialBaseDuration}ms</span>
                </div>
            </div>`;
        }).join('')}
    </div>
    
    <div class="flex gap-3">
        <button onclick="toStart()" class="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all">
            Zurück
        </button>
        <button onclick="exportCSV()" class="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-700 transition-all">
            📥 CSV Export
        </button>
    </div>
</div>`;
}

// === EVENT HANDLING ===
function attachEvents() {
    const bd = document.getElementById('baseDurationSlider');
    if(bd) {
        bd.addEventListener('input', e => {
            state.settings.baseDuration = parseInt(e.target.value);
            const label = document.getElementById('speedLabel');
            if(label) {
                label.innerHTML = `Startgeschwindigkeit: <span class="text-red-600">${state.settings.baseDuration}ms</span>`;
            }
        });
    }
    
    const th = document.getElementById('thresholdSlider');
    if(th) th.addEventListener('input', e => {
        state.settings.adaptiveThreshold = parseInt(e.target.value);
        render();
    });
    
    const st = document.getElementById('stepSlider');
    if(st) st.addEventListener('input', e => {
        state.settings.adaptiveStep = parseInt(e.target.value);
        render();
    });
    
    const wa = document.getElementById('wordArea');
    if(wa) wa.addEventListener('input', e => {
        const al = state.lists.find(l=>l.id===state.activeListId);
        if(al) {
            al.words = parse(e.target.value);
            localStorage.setItem('blitzlesen-wordlists',JSON.stringify(state.lists));
        }
    });
    
    const nln = document.getElementById('newListName');
    if(nln) {
        nln.addEventListener('input', e => {
            state.newListName = e.target.value;
        });
        nln.addEventListener('keypress', e => {
            if(e.key === 'Enter') {
                e.preventDefault();
                createList();
            }
        });
    }
    
    const wi = document.getElementById('wordInput');
    if(wi) {
        wi.addEventListener('input', e => state.typed = e.target.value);
        wi.addEventListener('keypress', e => {
            if(e.key==='Enter') checkTyped();
        });
        wi.focus();
    }
    
    const csv = document.getElementById('csvUpload');
    if(csv) csv.addEventListener('change', handleCSVUpload);
    
    if(state.screen === 'history' && state.history.length > 0) {
        setTimeout(() => renderSpeedChart(), 100);
    }
}

function renderSpeedChart() {
    const canvas = document.getElementById('speedChart');
    if(!canvas) return;
    
    const chartData = state.history.slice(0, 20).reverse();
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map((s, i) => {
                const date = new Date(s.date);
                return date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'});
            }),
            datasets: [{
                label: 'Geschwindigkeit (ms)',
                data: chartData.map(s => s.finalBaseDuration || s.initialBaseDuration),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {display: false},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}ms - ${getTier(context.parsed.y).n}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    reverse: true,
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Schneller →'
                    }
                }
            }
        }
    });
}

// === GLOBALE FUNKTIONEN ===
function toggleSetting(key) {
    state.settings[key] = !state.settings[key];
    render();
}

function setFontSize(size) {
    state.settings.fontSize = size;
    render();
}

function toStart() {
    state.screen = 'start';
    render();
}

function toSettings() {
    state.screen = 'settings';
    render();
}

function toHistory() {
    state.screen = 'history';
    render();
}

function checkTyped() {
    handleTypedSubmit();
}

function toggleListMgr() {
    state.showListMgr = !state.showListMgr;
    render();
}

function uploadCSV() {
    document.getElementById('csvUpload').click();
}

// Initial render
render();
