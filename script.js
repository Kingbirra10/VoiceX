document.addEventListener("DOMContentLoaded", function () {
    const firebaseConfig = {
        apiKey: "AIzaSyApB6S9bKjmPb-_STg9vEGaCU2GRoxhzpw",
        authDomain: "voice-x-266cf.firebaseapp.com",
        projectId: "voice-x-266cf",
        storageBucket: "voice-x-266cf.firebasestorage.app",
        messagingSenderId: "161056489530",
        appId: "1:161056489530:web:8dddfe58d6b209c36e3503",
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userInfo = document.getElementById('userInfo');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const authSection = document.getElementById('authSection');
    const recordingSection = document.getElementById('recordingSection');
    const languageButton = document.getElementById('languageButton');
    const languageButtonText = document.getElementById('languageButtonText');
    const languageDropdown = document.getElementById('languageDropdown');

    const recordButton = document.getElementById('recordButton');
    const recordButtonText = document.getElementById('recordButtonText');
    const stopButton = document.getElementById('stopButton');
    const stopButtonText = document.getElementById('stopButtonText');
    const output = document.getElementById('output');
    const timeline = document.getElementById('timeline');
    const timer = document.getElementById('timer');
    const secondsDisplay = document.getElementById('seconds');
    const logoButton = document.getElementById('logoButton'); // Nueva constante para el logo

    let isRecording = false;
    let recognition;
    let fullText = '';
    let timeoutId;
    let intervalId;
    const maxDuration = 20000; // 20 segundos

    const translations = {
        zh: {
            welcomeText: "开始说话！",
            welcome: "欢迎",
            login: "用谷歌登录",
            logout: "退出登录",
            record: "录制",
            stop: "停止",
            copy: "复制",
            retry: "重新录制",
            goToX: "分享到 X",
            noVoiceDetected: "未检测到声音。",
            contact: "联系我们"
        },
        hi: {
            welcomeText: "बोलना शुरू करें!",
            welcome: "स्वागत",
            login: "Google के साथ लॉगिन करें",
            logout: "लॉगआउट",
            record: "रिकॉर्ड",
            stop: "रोकें",
            copy: "कॉपी करें",
            retry: "फिर से रिकॉर्ड करें",
            goToX: "X पर साझा करें",
            noVoiceDetected: "कोई आवाज़ नहीं पाई गई।",
            contact: "संपर्क करें" 
        },
        es: {
            welcomeText: "¡Empieza a Hablar!",
            welcome: "Bienvenido",
            login: "Iniciar sesión con Google",
            logout: "Cerrar sesión",
            record: "Grabar",
            stop: "Detener",
            copy: "Copiar",
            retry: "Volver a grabar",
            goToX: "Trasladar a X",
            noVoiceDetected: "No se detectó voz.",
            contact: "Contacto" 
        },
        fr: {
            welcomeText: "Commencez à parler !",
            welcome: "Bienvenue",
            login: "Se connecter avec Google",
            logout: "Se déconnecter",
            record: "Enregistrer",
            stop: "Arrêter",
            copy: "Copier",
            retry: "Réenregistrer",
            goToX: "Partager sur X",
            noVoiceDetected: "Aucune voix détectée.",
            contact: "Contactez-nous"
        },
        en: {
            welcomeText: "Start Speaking!",
            welcome: "Welcome",
            login: "Sign in with Google",
            logout: "Log out",
            record: "Record",
            stop: "Stop",
            copy: "Copy",
            retry: "Record again",
            goToX: "Move to X",
            noVoiceDetected: "No voice detected.",
            contact: "Contact"
        }
    };

    let currentLanguage = localStorage.getItem('language') || 'es';
    updateLanguage();

    languageButton.addEventListener('click', () => {
        languageDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!languageButton.contains(event.target) && !languageDropdown.contains(event.target)) {
            languageDropdown.classList.remove('show');
        }
    });

    languageDropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.dropdown-item');
        if (item) {
            const lang = item.getAttribute('data-lang');
            currentLanguage = lang;
            localStorage.setItem('language', currentLanguage);
            updateLanguage();
            languageDropdown.classList.remove('show');
            languageButtonText.textContent = getLanguageFlag(lang) + ' ' + lang.toUpperCase();
        }
    });

    function getLanguageFlag(lang) {
        const flags = {
            zh: '🇨🇳',
            hi: '🇮🇳',
            es: '🇪🇸',
            fr: '🇫🇷',
            en: '🇬🇧'
        };
        return flags[lang] || '';
    }

    function updateLanguage() {
        document.getElementById('welcomeText').textContent = translations[currentLanguage].welcomeText;
        loginButton.textContent = translations[currentLanguage].login;
        logoutButton.textContent = translations[currentLanguage].logout;
        recordButtonText.textContent = translations[currentLanguage].record;
        stopButtonText.textContent = translations[currentLanguage].stop;

        const user = firebase.auth().currentUser;
        if (user) {
            userName.textContent = `${translations[currentLanguage].welcome}, ${user.displayName}`;
        } else {
            userName.textContent = `${translations[currentLanguage].welcome}, Invitado`;
        }

        const retryButton = document.querySelector('.button-style:not(#goToXButton)');
        if (retryButton) retryButton.textContent = translations[currentLanguage].retry;

        const goToXButton = document.getElementById('goToXButton');
        if (goToXButton) goToXButton.textContent = translations[currentLanguage].goToX;

        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach(button => {
            button.textContent = translations[currentLanguage].copy;
        });

        const noVoiceMessage = output.querySelector('p');
        if (noVoiceMessage && noVoiceMessage.textContent === translations[currentLanguage === 'es' ? 'en' : 'es'].noVoiceDetected) {
            noVoiceMessage.textContent = translations[currentLanguage].noVoiceDetected;
        }

        const buttonContainer = document.querySelector('.button-container');
        if (buttonContainer) {
            buttonContainer.style.display = 'none';
            setTimeout(() => {
                buttonContainer.style.display = 'flex';
            }, 0);
        }

        languageButtonText.textContent = getLanguageFlag(currentLanguage) + ' ' + currentLanguage.toUpperCase();
        const contactLink = document.getElementById('contactLink');
        if (contactLink) {
            contactLink.textContent = translations[currentLanguage].contact;
        }
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userPhoto.src = user.photoURL || 'images/default-user.png';
            userName.textContent = `${translations[currentLanguage].welcome}, ${user.displayName}`;
            loginButton.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            recordingSection.classList.remove('hidden');
        } else {
            userPhoto.src = 'images/default-user.png';
            userName.textContent = `${translations[currentLanguage].welcome}, Invitado`;
            loginButton.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            recordingSection.classList.remove('hidden');
            output.classList.add('hidden');
        }
        updateLanguage();
    });

    loginButton.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(error => {
            alert(currentLanguage === 'es' ? 'Error al iniciar sesión.' : 'Error signing in.');
        });
    });

    logoutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            alert(currentLanguage === 'es' ? 'Sesión cerrada.' : 'Signed out.');
        }).catch(error => {
            alert(currentLanguage === 'es' ? 'Error al cerrar sesión.' : 'Error signing out.');
        });
    });

    recordButton.addEventListener('click', () => {
        console.log("Botón Grabar clickeado, iniciando startRecording...");
        startRecording();
    });

    stopButton.addEventListener('click', () => {
        console.log("Botón Detener clickeado, iniciando stopRecording...");
        stopRecording();
    });

    // Añadimos el evento para el logo como botón de "Volver atrás"
    logoButton.addEventListener('click', (event) => {
        event.preventDefault(); // Evita el comportamiento predeterminado del enlace
        resetPage();
    });

    async function startRecording() {
        console.log("Intentando iniciar grabación...");
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("Usuario no autenticado, mostrando alerta.");
            alert(currentLanguage === 'es' ? 'Debes iniciar sesión para grabar.' : 'You must sign in to record.');
            return;
        }
        console.log("Usuario autenticado, procediendo con la grabación.");

        if (intervalId) {
            clearInterval(intervalId);
            console.log("Intervalo anterior limpiado.");
        }

        isRecording = true;
        fullText = '';
        recordButton.classList.add('hidden');
        stopButton.classList.remove('hidden');
        console.log("Botones actualizados: Grabar oculto, Detener visible.");

        timeline.classList.remove('hidden');
        timeline.classList.add('show');
        timer.classList.remove('hidden');
        timer.classList.add('show');
        console.log("Línea de tiempo y temporizador mostrados.");

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        console.log("Objeto SpeechRecognition creado:", recognition);

        recognition.lang = currentLanguage === 'es' ? 'es-ES' : 
                         currentLanguage === 'zh' ? 'zh-CN' : 
                         currentLanguage === 'hi' ? 'hi-IN' : 
                         currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;
        console.log("Configuración de reconocimiento aplicada:", { lang: recognition.lang, continuous: recognition.continuous, interimResults: recognition.interimResults });

        recognition.onresult = (event) => {
            console.log("Evento de reconocimiento recibido:", event);
            fullText += ' ' + Array.from(event.results).map(result => result[0].transcript).join(' ');
            console.log("Texto acumulado:", fullText);
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz:", event.error);
            stopRecording();
        };

        recognition.onstart = () => {
            console.log("Reconocimiento de voz iniciado.");
        };

        recognition.onend = () => {
            console.log("Reconocimiento de voz terminado.");
            if (isRecording) {
                stopRecording();
            }
        };

        try {
            recognition.start();
            console.log("Inicio de reconocimiento de voz solicitado.");
        } catch (error) {
            console.error("Error al iniciar el reconocimiento de voz:", error);
            stopRecording();
        }

        timeoutId = setTimeout(stopRecording, maxDuration);
        console.log("Temporizador de 20 segundos configurado.");

        let startTime = Date.now();
        let seconds = 20; // Comienza en 20 segundos
        secondsDisplay.textContent = seconds;
        intervalId = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000; // Tiempo transcurrido en segundos
            seconds = Math.max(20 - Math.floor(elapsed), 0); // Decrementa desde 20 hasta 0
            const width = ((20 - seconds) / 20) * 100; // Proporción de 0 a 100% (aumenta conforme disminuye el tiempo)
            if (seconds <= 0) {
                clearInterval(intervalId);
                console.log("Temporizador alcanzado 0, deteniendo.");
                stopRecording();
            } else {
                timeline.style.setProperty('--width', width + '%');
                secondsDisplay.textContent = seconds;
                console.log("Temporizador actualizado:", seconds);
            }
        }, 1000);
        console.log("Intervalo de progreso iniciado.");
    }

    function stopRecording() {
        if (!isRecording) {
            console.log("No se está grabando, stopRecording ignorado.");
            return;
        }
        console.log("Deteniendo el reconocimiento de voz...");
        if (intervalId) {
            clearInterval(intervalId);
            console.log("Intervalo limpiado al detener.");
        }
        if (recognition) {
            recognition.stop();
        }
        isRecording = false;
        recordButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
        clearTimeout(timeoutId);

        timeline.classList.remove('show');
        timeline.classList.add('hidden');
        timer.classList.remove('show');
        timer.classList.add('hidden');

        setTimeout(() => {
            console.log("Texto crudo transcrito:", fullText);

            let processedText = fullText.trim();
            console.log("Texto después de trim:", processedText);

            const words = processedText.split(/\s+/);
            let result = [];
            let i = 0;

            while (i < words.length) {
                if (words[i].toLowerCase() === 'hashtag' && i + 1 < words.length) {
                    let hashtagContent = '';
                    i++;
                    while (i < words.length && words[i].toLowerCase() !== 'hashtag') {
                        hashtagContent += words[i];
                        i++;
                    }
                    if (result.length > 0) {
                        result.push(' #' + hashtagContent);
                    } else {
                        result.push('#' + hashtagContent);
                    }
                } else {
                    result.push(words[i]);
                    i++;
                }
            }

            processedText = result.join(' ');
            console.log("Texto después de procesar hashtags:", processedText);

            if (processedText) {
                console.log("Mostrando resultado con texto:", processedText);
                showResult(processedText);
            } else {
                console.log("No se detectó texto, mostrando mensaje de error.");
                output.innerHTML = `<p>${translations[currentLanguage].noVoiceDetected}</p>`;
                output.classList.remove('hidden');
            }
        }, 500);
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.width = '100%';
        const newHeight = (textarea.scrollHeight + 20) + 'px';
        textarea.style.height = newHeight;
        console.log("Ajustando altura del textarea a:", newHeight, "con texto:", textarea.value);
    }

    function showResult(text) {
        console.log("Texto completo recibido en showResult:", text);
        output.innerHTML = '';

        let textBlock = document.createElement('div');
        textBlock.classList.add('text-block');

        let textArea = document.createElement('textarea');
        textArea.classList.add('editable-text');
        textArea.value = text;

        let copyTextButton = document.createElement('button');
        copyTextButton.textContent = translations[currentLanguage].copy;
        copyTextButton.classList.add('copy-button');
        copyTextButton.addEventListener('click', () => {
            navigator.clipboard.writeText(textArea.value);
            alert(currentLanguage === 'es' ? '¡Texto copiado!' : 'Text copied!');
        });

        textBlock.appendChild(textArea);
        textBlock.appendChild(copyTextButton);

        let goToXButton = document.createElement('a');
        goToXButton.textContent = translations[currentLanguage].goToX;
        goToXButton.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(textArea.value);
        goToXButton.target = '_blank';
        goToXButton.classList.add('button-style');
        goToXButton.id = 'goToXButton';

        let retryButton = document.createElement('button');
        retryButton.textContent = translations[currentLanguage].retry;
        retryButton.classList.add('button-style');
        retryButton.addEventListener('click', resetPage);

        let buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        buttonContainer.appendChild(goToXButton);
        buttonContainer.appendChild(retryButton);

        output.appendChild(textBlock);
        output.appendChild(buttonContainer);
        output.classList.remove('hidden');

        setTimeout(() => {
            autoResizeTextarea(textArea);
            textArea.addEventListener('input', () => autoResizeTextarea(textArea));
        }, 0);
    }

    function resetPage() {
        console.log("Reiniciando página...");
        output.classList.add('hidden'); // Oculta el output
        fullText = ''; // Limpia el texto grabado
        isRecording = false; // Asegura que no se esté grabando
        recordButton.classList.remove('hidden'); // Muestra el botón "Grabar"
        stopButton.classList.add('hidden'); // Oculta el botón "Detener"
        if (intervalId) {
            clearInterval(intervalId);
            console.log("Intervalo limpiado al reiniciar.");
        }
        clearTimeout(timeoutId); // Limpia cualquier temporizador activo
        secondsDisplay.textContent = '20'; // Reinicia el contador a 20
        timeline.style.setProperty('--width', '0%'); // Reinicia la línea de tiempo
        timeline.classList.remove('show'); // Oculta la línea de tiempo
        timeline.classList.add('hidden');
        timer.classList.remove('show'); // Oculta el temporizador
        timer.classList.add('hidden');
    }
});