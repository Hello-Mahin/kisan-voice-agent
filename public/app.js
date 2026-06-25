/* ==========================================================================
   KisanSathi - Client Logic
   Manages SpeechRecognition (hi-IN), SpeechSynthesis, UI states,
   and structured offline fallback when server/API is unavailable.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const micBtn = document.getElementById('mic-btn');
    const voiceSection = document.querySelector('.voice-section');
    const actionHeading = document.getElementById('action-heading');
    const actionSubtext = document.getElementById('action-subtext');
    const micStatusText = document.getElementById('mic-status-text');
    const transcriptDisplay = document.getElementById('transcript-display');
    const responseDisplay = document.getElementById('response-display');
    const speakAgainBtn = document.getElementById('speak-again-btn');
    const stopSpeakBtn = document.getElementById('stop-speak-btn');
    const modeBadge = document.getElementById('mode-badge');
    const modeText = document.getElementById('mode-text');
    const toastContainer = document.getElementById('toast-container');
    const queryTextInput = document.getElementById('query-text-input');
    const sendQueryBtn = document.getElementById('send-query-btn');
    const sendBtnText = document.getElementById('send-btn-text');

    // Bilingual Toggle Elements & State
    const langHiBtn = document.getElementById('lang-hi');
    const langEnBtn = document.getElementById('lang-en');
    let currentLang = 'hi'; // Default language is Hindi

    const translations = {
        hi: {
            headerTitle: "किसानसाथी",
            headerSubtitle: "KisanSathi • आपका कृषि मित्र",
            actionHeadingIdle: "बात करने के लिए बटन दबाकर रखें",
            actionSubtextIdle: "अपनी समस्या हिंदी में बताएं (जैसे: \"गेहूं की पत्तियां पीली पड़ रही हैं\")",
            actionHeadingRecording: "मैं सुन रहा हूँ... बोलिए",
            actionSubtextRecording: "बोलना समाप्त करने के लिए बटन को छोड़ दें",
            micStatusIdle: "दबाकर रखें (Hold to Speak)",
            micStatusRecording: "सुन रहा हूँ...",
            transcriptHeader: "आपने कहा (What you said)",
            transcriptPlaceholder: "आपका बोला हुआ वाक्य यहाँ दिखाई देगा...",
            responseHeader: "कृषि मित्र की सलाह (AI Advice)",
            responseDefault: "यहाँ आपके प्रश्नों का सटीक उत्तर मिलेगा। फसल रोग निदान या कृषि योजनाओं की जानकारी के लिए माइक्रोफोन बटन दबाकर प्रश्न पूछें।",
            responseWaiting: "प्रतिक्रिया तैयार की जा रही है, कृपया प्रतीक्षा करें...",
            speakBtnText: "सुनें",
            stopBtnText: "रोकें",
            guideHeader: "आप इस तरह के सवाल पूछ सकते हैं",
            footerText: "© 2026 किसानसाथी • भारतीय किसानों के लिए एक डिजिटल साथी",
            modeOnline: "ऑनलाइन",
            modeOffline: "ऑफलाइन",
            micErrorTitle: "माइक्रोफोन एरर",
            micErrorText: "कृपया माइक्रोफोन इस्तेमाल करने की अनुमति दें।",
            browserErrorTitle: "ब्राउज़र सपोर्ट एरर",
            browserErrorText: "यह ब्राउज़र स्पीच रिकग्निशन सपोर्ट नहीं करता। कृपया गूगल क्रोम का उपयोग करें।",
            noSpeechError: "कृपया कुछ और कहें, मैं सुन नहीं पाया।",
            debugModeTitle: "डीबग मोड",
            debugUrlText: "URL पैरामीटर द्वारा ऑफलाइन मोड सक्रिय किया गया।",
            debugEnvText: "सर्वर पर्यावरण द्वारा ऑफलाइन मोड सक्रिय किया गया।",
            offlineModeTitle: "ऑफलाइन मोड",
            apiKeyMissingText: "Gemini API की कुंजी सर्वर पर सेट नहीं है। स्थानीय डेटाबेस का उपयोग किया जा रहा है।",
            connErrorTitle: "कनेक्शन एरर",
            connErrorText: "सर्वर से उत्तर प्राप्त नहीं हुआ। स्थानीय डेटाबेस का उपयोग किया जा रहा है।",
            networkErrorTitle: "नेटवर्क एरर",
            networkErrorText: "सर्वर कनेक्ट करने में असमर्थ। ऑफलाइन निर्देशिका सक्रिय की गई।",
            textInputPlaceholder: "अपना सवाल लिखें...",
            sendBtnText: "पूछें"
        },
        en: {
            headerTitle: "KisanSathi",
            headerSubtitle: "KisanSathi • Your Agricultural Friend",
            actionHeadingIdle: "Hold the button to speak",
            actionSubtextIdle: "State your problem in English (e.g. \"Wheat leaves are turning yellow\")",
            actionHeadingRecording: "I'm listening... Speak now",
            actionSubtextRecording: "Release the button to stop speaking",
            micStatusIdle: "Hold to Speak",
            micStatusRecording: "Listening...",
            transcriptHeader: "What you said",
            transcriptPlaceholder: "Your spoken words will appear here...",
            responseHeader: "AI Advice",
            responseDefault: "Get accurate answers to your questions here. Hold the microphone button to ask about crop diseases or government schemes.",
            responseWaiting: "Preparing response, please wait...",
            speakBtnText: "Listen",
            stopBtnText: "Stop",
            guideHeader: "You can ask questions like this",
            footerText: "© 2026 KisanSathi • A digital companion for Indian farmers",
            modeOnline: "Online",
            modeOffline: "Offline",
            micErrorTitle: "Microphone Error",
            micErrorText: "Please grant permission to use the microphone.",
            browserErrorTitle: "Browser Support Error",
            browserErrorText: "This browser does not support Speech Recognition. Please use Google Chrome.",
            noSpeechError: "Please say something, I couldn't hear you.",
            debugModeTitle: "Debug Mode",
            debugUrlText: "Offline mode activated by URL parameter.",
            debugEnvText: "Offline mode activated by server environment.",
            offlineModeTitle: "Offline Mode",
            apiKeyMissingText: "Gemini API key is not configured on the server. Using local database.",
            connErrorTitle: "Connection Error",
            connErrorText: "No response from server. Using local database.",
            networkErrorTitle: "Network Error",
            networkErrorText: "Unable to connect to server. Offline directory activated.",
            textInputPlaceholder: "Type your question...",
            sendBtnText: "Ask"
        }
    };

    const guidePrompts = {
        hi: [
            { tag: "फसल रोग", class: "crop", query: "गेहूं में पीला रस्ट का इलाज क्या है?" },
            { tag: "खरपतवार", class: "crop", query: "धान की नर्सरी में खरपतवार कैसे रोकें?" },
            { tag: "सरकारी योजना", class: "scheme", query: "पीएम किसान योजना की पात्रता और लाभ क्या हैं?" },
            { tag: "मशीनरी लोन", class: "scheme", query: "मुझे ट्रैक्टर खरीदने के लिए क्या सरकारी सब्सिडी मिलेगी?" }
        ],
        en: [
            { tag: "Crop Disease", class: "crop", query: "What is the treatment for yellow rust in wheat?" },
            { tag: "Weed Control", class: "crop", query: "How to prevent weeds in paddy nursery?" },
            { tag: "Govt Scheme", class: "scheme", query: "What are the eligibility and benefits of PM Kisan scheme?" },
            { tag: "Machinery Loan", class: "scheme", query: "What government subsidy will I get to buy a tractor?" }
        ]
    };

    // Speech Recognition & Synthesis Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    const synth = window.speechSynthesis;
    let hindiVoice = null;
    let englishVoice = null;
    let isRecording = false;
    let finalTranscript = '';
    let lastResponseText = '';
    let activeSpeechTimeout = null;

    // Function to dynamically update UI language
    function updateLanguageUI() {
        const t = translations[currentLang];
        
        // Update simple texts
        document.getElementById('header-title').textContent = t.headerTitle;
        document.getElementById('header-subtitle').textContent = t.headerSubtitle;
        
        if (!isRecording) {
            actionHeading.textContent = t.actionHeadingIdle;
            actionSubtext.textContent = t.actionSubtextIdle;
            micStatusText.textContent = t.micStatusIdle;
        } else {
            actionHeading.textContent = t.actionHeadingRecording;
            actionSubtext.textContent = t.actionSubtextRecording;
            micStatusText.textContent = t.micStatusRecording;
        }
        
        document.getElementById('transcript-header').textContent = t.transcriptHeader;
        transcriptDisplay.placeholder = t.transcriptPlaceholder;
        document.getElementById('response-header').textContent = t.responseHeader;
        
        // Default text update only if nothing has been spoken/processed yet
        if (!lastResponseText) {
            responseDisplay.textContent = t.responseDefault;
        }
        
        document.getElementById('speak-btn-text').textContent = t.speakBtnText;
        document.getElementById('stop-btn-text').textContent = t.stopBtnText;
        document.getElementById('guide-header').textContent = t.guideHeader;
        document.getElementById('footer-text').textContent = t.footerText;
        
        // Update text input alternative elements
        if (queryTextInput) {
            queryTextInput.placeholder = t.textInputPlaceholder;
        }
        if (sendBtnText) {
            sendBtnText.textContent = t.sendBtnText;
        }
        
        // Update mode badge text
        const isOnline = modeBadge.classList.contains('online');
        modeText.textContent = isOnline ? t.modeOnline : t.modeOffline;
        
        // Update guide prompts
        const guideContainer = document.getElementById('guide-grid-container');
        if (guideContainer) {
            guideContainer.innerHTML = '';
            guidePrompts[currentLang].forEach((item) => {
                const guideItem = document.createElement('div');
                guideItem.className = 'guide-item';
                const escapedQuery = item.query.replace(/'/g, "\\'");
                guideItem.setAttribute('onclick', `populateExample('${escapedQuery}')`);
                
                guideItem.innerHTML = `
                    <span class="guide-tag ${item.class}">${item.tag}</span>
                    <p class="guide-query">"${item.query}"</p>
                `;
                guideContainer.appendChild(guideItem);
            });
        }
    }

    // Toggle click listeners
    langHiBtn.addEventListener('click', () => {
        if (currentLang !== 'hi') {
            currentLang = 'hi';
            langHiBtn.classList.add('active');
            langEnBtn.classList.remove('active');
            updateLanguageUI();
            
            if (recognition) {
                recognition.lang = 'hi-IN';
            }
            
            synth.cancel();
            resetPlaybackButton();
        }
    });

    langEnBtn.addEventListener('click', () => {
        if (currentLang !== 'en') {
            currentLang = 'en';
            langEnBtn.classList.add('active');
            langHiBtn.classList.remove('active');
            updateLanguageUI();
            
            if (recognition) {
                recognition.lang = 'en-IN';
            }
            
            synth.cancel();
            resetPlaybackButton();
        }
    });

    // Call initially to render default guide prompts and UI text
    updateLanguageUI();

    // Initialize Speech Recognition
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = true; // Keep listening while button is held

        // Handle speech recognition events
        recognition.onstart = () => {
            isRecording = true;
            finalTranscript = '';
            transcriptDisplay.value = '';
            voiceSection.classList.add('active-recording');
            
            const t = translations[currentLang];
            actionHeading.textContent = t.actionHeadingRecording;
            actionSubtext.textContent = t.actionSubtextRecording;
            micStatusText.textContent = t.micStatusRecording;
            
            synth.cancel(); // Stop any reading if user talks
            if (activeSpeechTimeout) {
                clearTimeout(activeSpeechTimeout);
                activeSpeechTimeout = null;
            }
            updatePlaybackButtons(false);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            // Show real-time transcript
            transcriptDisplay.value = finalTranscript || interimTranscript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            const t = translations[currentLang];
            if (event.error === 'not-allowed') {
                showToast(t.micErrorTitle, t.micErrorText, "error");
            }
            stopRecordingState();
        };

        recognition.onend = () => {
            stopRecordingState();
            const speechText = transcriptDisplay.value.trim();
            if (speechText.length > 2) {
                processFarmerQuery(speechText);
            } else if (speechText.length > 0) {
                const t = translations[currentLang];
                responseDisplay.textContent = t.noSpeechError;
                speakResponse(t.noSpeechError);
            }
        };
    } else {
        const t = translations[currentLang];
        showToast(t.browserErrorTitle, t.browserErrorText, "error");
        micStatusText.textContent = "Speech support not available";
        micBtn.disabled = true;
    }

    // Set Voice for Speech Synthesis (Look for Hindi & English voices)
    function loadVoices() {
        const voices = synth.getVoices();
        hindiVoice = voices.find(voice => voice.lang.includes('hi') || voice.lang.includes('hi-IN'));
        englishVoice = voices.find(voice => voice.lang.includes('en') || voice.lang.includes('en-IN') || voice.lang.includes('en-US'));
    }
    
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    // Helper: Reset recording UI
    function stopRecordingState() {
        isRecording = false;
        voiceSection.classList.remove('active-recording');
        const t = translations[currentLang];
        actionHeading.textContent = t.actionHeadingIdle;
        actionSubtext.textContent = t.actionSubtextIdle;
        micStatusText.textContent = t.micStatusIdle;
    }

    // Hold-to-Speak handlers for desktop (mouse) and mobile (touch)
    micBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startListening();
    });

    window.addEventListener('mouseup', () => {
        if (isRecording) {
            stopListening();
        }
    });

    micBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startListening();
    });

    window.addEventListener('touchend', () => {
        if (isRecording) {
            stopListening();
        }
    });

    function startListening() {
        if (recognition && !isRecording) {
            try {
                recognition.start();
            } catch (err) {
                console.error(err);
            }
        }
    }

    function stopListening() {
        if (recognition && isRecording) {
            try {
                recognition.stop();
            } catch (err) {
                console.error(err);
            }
        }
    }

    // --------------------------------------------------------
    // Local Fallback Database & Logic (Structured Offline Mode)
    // --------------------------------------------------------
    
    const categoryKeywords = {
        pest: ["कीड़ा", "कीड़े", "कीट", "माहू", "दीमक", "इल्ली", "सूंडी", "चेपा", "हॉपर", "छेदक", "मक्खी", "तेला", "caterpillar", "pest", "borer"],
        disease: ["रोग", "बीमारी", "बीमारियां", "रस्ट", "झुलसा", "फफूंद", "मोज़ेक", "ब्लास्ट", "धब्बा", "disease", "rust", "blight", "virus"]
    };

    const localCropsDb = {
        "wheat": {
            names: ["गेहूं", "गेहू", "गेंहू", "wheat"],
            cropName: {
                hi: "गेहूं (Wheat)",
                en: "Wheat"
            },
            disease: {
                hi: "**गेहूं रोग निदान (पीला रस्ट):**\nगेहूं में पीला रस्ट (Yellow Rust) एक फफूंद जनित बीमारी है।\n**बचाव व उपचार:**\n- खेत में जल निकासी उत्तम रखें और नाइट्रोजन युक्त खाद का असंतुलित उपयोग न करें।\n- जैविक उपचार: 10 लीटर पानी में 250 मिलीलीटर खट्टी लस्सी (छाछ) मिलाकर छिड़काव करें।\n- रासायनिक उपचार: प्रोपिकोनाजोल (Propiconazole 25% EC) की 200 मिलीलीटर मात्रा को 200 लीटर पानी में मिलाकर प्रति एकड़ छिड़काव करें।",
                en: "**Wheat Disease Diagnosis (Yellow Rust):**\nYellow Rust in wheat is a fungal disease.\n**Prevention & Treatment:**\n- Maintain proper drainage in the field and avoid unbalanced use of nitrogen fertilizers.\n- Organic Treatment: Mix 250 ml of sour buttermilk in 10 liters of water and spray.\n- Chemical Treatment: Mix 200 ml of Propiconazole 25% EC in 200 liters of water and spray per acre."
            },
            pest: {
                hi: "**गेहूं कीट नियंत्रण (दीमक व चेपा):**\nगेहूं में दीमक (Termites) और चेपा/माहू (Aphids) प्रमुख कीट हैं।\n**बचाव व उपचार:**\n- दीमक के लिए बुवाई से पहले बीजोपचार करें या क्लोरपायरीफॉस का छिड़काव करें।\n- जैविक उपचार के लिए खेत में नीम की खली डालें और नीम तेल का छिड़काव करें।\n- सिंचाई नियमित अंतराल पर करें, जिससे दीमक का प्रकोप कम होता है।",
                en: "**Wheat Pest Control (Termites & Aphids):**\nTermites and Aphids are major pests in wheat.\n**Prevention & Treatment:**\n- For termites, perform seed treatment before sowing or spray Chlorpyriphos.\n- For organic treatment, apply neem cake in the field and spray neem oil.\n- Irrigate at regular intervals to reduce termite infestation."
            }
        },
        "paddy": {
            names: ["धान", "चावल", "paddy", "rice"],
            cropName: {
                hi: "धान (Paddy/Rice)",
                en: "Paddy/Rice"
            },
            disease: {
                hi: "**धान रोग निदान (झुलसा व ब्लास्ट):**\nधान में जीवाणु झुलसा (Bacterial Leaf Blight) और ब्लास्ट रोग प्रमुख बीमारियां हैं।\n**बचाव व उपचार:**\n- संतुलित मात्रा में नाइट्रोजन डालें और पोटाश का प्रयोग बढ़ाएं।\n- फफूंद जनित ब्लास्ट के लिए ट्राइसाइक्लाजोल (Tricyclazole) 120 ग्राम प्रति एकड़ की दर से छिड़काव करें।\n- जैविक रूप से नीम के तेल या स्यूडोमोनास फ्लोरेसेंस का छिड़काव करें।",
                en: "**Paddy Disease Diagnosis (Blight & Blast):**\nBacterial Leaf Blight and Blast are major diseases in paddy.\n**Prevention & Treatment:**\n- Apply balanced nitrogen and increase potash usage.\n- For fungal blast, spray Tricyclazole at 120g per acre.\n- Organically, spray neem oil or Pseudomonas fluorescens."
            },
            pest: {
                hi: "**धान कीट नियंत्रण (तना छेदक व हॉपर):**\nधान में तना छेदक (Stem Borer) और भूरा प्लांट हॉपर (BPH) प्रमुख कीट हैं।\n**बचाव व उपचार:**\n- तना छेदक के लिए फेरोमोन ट्रैप (Pheromone Traps) लगाएं।\n- रासायनिक नियंत्रण के लिए कारतप हाइड्रोक्लोराइड (Cartap Hydrochloride) या क्लोरेंट्रानिलिप्रोल (Chlorantraniliprole) का उपयोग करें।",
                en: "**Paddy Pest Control (Stem Borer & Hopper):**\nStem Borer and Brown Plant Hopper (BPH) are major pests in paddy.\n**Prevention & Treatment:**\n- Install pheromone traps for stem borer.\n- For chemical control, use Cartap Hydrochloride or Chlorantraniliprole."
            }
        },
        "potato": {
            names: ["आलू", "potato"],
            cropName: {
                hi: "आलू (Potato)",
                en: "Potato"
            },
            disease: {
                hi: "**आलू रोग निदान (झुलसा रोग):**\nआलू में अगेती और पछेती झुलसा (Early & Late Blight) रोग मुख्य समस्या है।\n**बचाव व उपचार:**\n- पछेती झुलसा ठंडे और नम मौसम में तेजी से फैलता है।\n- बचाव के लिए मैंकोजेब (Mancozeb) 2 gram प्रति लीटर पानी का छिड़काव करें।\n- यदि लक्षण दिखें तो मेटलैक्सिल+मैंकोजेब 2.5 gram प्रति लीटर पानी का छिड़काव करें।",
                en: "**Potato Disease Diagnosis (Blight):**\nEarly and Late Blight are the main disease problems in potato.\n**Prevention & Treatment:**\n- Late blight spreads rapidly in cold and humid weather.\n- To prevent, spray Mancozeb at 2g per liter of water.\n- If symptoms appear, spray Metalaxyl + Mancozeb at 2.5g per liter of water."
            },
            pest: {
                hi: "**आलू कीट नियंत्रण (माहू व कंद शलभ):**\nआलू में माहू (Aphids) और कंद शलभ (Potato Tuber Moth) प्रमुख कीट हैं।\n**बचाव व उपचार:**\n- फसल पर नीम तेल का नियमित छिड़काव करें।\n- कंद शलभ के लिए मिट्टी को अच्छी तरह चढ़ाएं ताकि आलू कंद खुले न रहें।",
                en: "**Potato Pest Control (Aphids & Tuber Moth):**\nAphids and Potato Tuber Moth are major pests in potato.\n**Prevention & Treatment:**\n- Regularly spray neem oil on the crop.\n- Earth up the soil well for tuber moth so that potato tubers are not exposed."
            }
        },
        "tomato": {
            names: ["टमाटर", "tomato"],
            cropName: {
                hi: "टमाटर (Tomato)",
                en: "Tomato"
            },
            disease: {
                hi: "**टमाटर रोग निदान (मोज़ेक व झुलसा):**\nटमाटर में पत्ती लपेटक मोज़ेक वायरस (Leaf Curl Virus) और अगेती झुलसा बीमारी मुख्य है।\n**बचाव व उपचार:**\n- मोज़ेक वायरस सफेद मक्खी द्वारा फैलता है, इसलिए पीले चिपचिपे कार्ड (Yellow Sticky Traps) लगाएं।\n- झुलसा रोग के लिए कॉपर ऑक्सीक्लोराइड 3 gram प्रति लीटर का छिड़काव करें।",
                en: "**Tomato Disease Diagnosis (Mosaic & Blight):**\nLeaf Curl Mosaic Virus and Early Blight are the main diseases in tomato.\n**Prevention & Treatment:**\n- Mosaic virus is spread by whiteflies, so install Yellow Sticky Traps.\n- For blight, spray Copper Oxychloride at 3g per liter."
            },
            pest: {
                hi: "**टमाटर कीट नियंत्रण (फल छेदक):**\nटमाटर में फल छेदक (Fruit Borer) और सूंडी (Caterpillar) प्रमुख कीट हैं।\n**बचाव व उपचार:**\n- फल छेदक कीट के लिए फेरोमोन ट्रैप लगाएं और गेंदा फूल को जाल फसल के रूप में लगाएं।\n- रासायनिक उपाय के लिए स्पिनोसैड (Spinosad 45% SC) 0.3 मिली प्रति लीटर का छिड़काव करें।",
                en: "**Tomato Pest Control (Fruit Borer & Caterpillar):**\nFruit Borer and Caterpillar are major pests in tomato.\n**Prevention & Treatment:**\n- Install pheromone traps for fruit borer and plant marigold as a trap crop.\n- For chemical remedy, spray Spinosad 45% SC at 0.3 ml per liter."
            }
        }
    };

    const localSchemesDb = [
        {
            name: {
                hi: "PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)",
                en: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)"
            },
            keywords: {
                hi: ["पीएम किसान", "किसान सम्मान", "किस्त", "₹6000", "सालाना", "पैसा", "मदद", "सहायता"],
                en: ["pm kisan", "installment", "6000", "yearly", "money", "help", "support", "financial assistance"]
            },
            details: {
                hi: "**योजना: PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)**\n- **पात्रता:** सभी छोटे और सीमांत किसान जिनके पास खेती योग्य भूमि है।\n- **लाभ:** किसानों को प्रति वर्ष ₹6,000 की वित्तीय सहायता दी जाती है। यह राशि ₹2,000 की तीन किस्तों में सीधे बैंक खाते में भेजी जाती है।\n- **आवेदन:** pmkisan.gov.in पोर्टल पर जाकर या नजदीकी कॉमन सर्विस सेंटर (CSC) पर आधार कार्ड, बैंक खाता और भूमि खतौनी जमा कर पंजीकरण करें।",
                en: "**Scheme: PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**\n- **Eligibility:** All small and marginal landholding farmer families with cultivable land in their names.\n- **Benefits:** Financial assistance of ₹6,000 per year, paid in three equal installments of ₹2,000 directly into the bank accounts of farmers.\n- **How to Apply:** Visit pmkisan.gov.in or your nearest Common Service Center (CSC) with your Aadhaar card, bank account, and land revenue documents."
            }
        },
        {
            name: {
                hi: "Kisan Credit Card (किसान क्रेडिट कार्ड - KCC)",
                en: "Kisan Credit Card (KCC)"
            },
            keywords: {
                hi: ["लोन", "कर्ज", "उधार", "क्रेडिट कार्ड", "केसीसी", "ऋण", "बैंक", "पैसा"],
                en: ["loan", "debt", "borrow", "credit card", "kcc", "interest", "bank", "credit"]
            },
            details: {
                hi: "**योजना: Kisan Credit Card (KCC)**\n- **पात्रता:** सभी किसान, काश्तकार, पट्टेदार और स्वयं सहायता समूह।\n- **लाभ:** फसल उत्पादन व कृषि उपकरणों के लिए बहुत कम ब्याज दर (समय पर भुगतान करने पर 4% प्रभावी ब्याज) पर ₹3 लाख तक का आसान ऋण उपलब्ध है।\n- **प्रक्रिया:** अपने नजदीकी राष्ट्रीयकृत या सहकारी बैंक शाखा में जाकर आधार कार्ड, पैन कार्ड, भूमि खतौनी और बैंक पासबुक के साथ आवेदन करें।",
                en: "**Scheme: Kisan Credit Card (KCC)**\n- **Eligibility:** All farmers, tenant farmers, sharecroppers, and Self-Help Groups (SHGs).\n- **Benefits:** Easy access to agricultural credit up to ₹3 lakhs at low interest rates (effectively 4% with timely repayment).\n- **Process:** Visit your nearest nationalized or cooperative bank branch with your Aadhaar card, PAN card, land revenue documents, and bank passbook."
            }
        },
        {
            name: {
                hi: "PMFBY (प्रधानमंत्री फसल बीमा योजना)",
                en: "PMFBY (Pradhan Mantri Fasal Bima Yojana)"
            },
            keywords: {
                hi: ["बीमा", "फसल नुकसान", "नुकसान", "मुआवजा", "आपदा", "बाढ़", "सूखा", "खराब", "बर्बाद"],
                en: ["insurance", "crop loss", "damage", "compensation", "disaster", "flood", "drought", "ruined", "pmfby"]
            },
            details: {
                hi: "**योजना: PMFBY (प्रधानमंत्री फसल बीमा योजना)**\n- **लाभ:** सूखा, बाढ़ या कीटों से फसल नष्ट होने पर वित्तीय मुआवजा मिलता है। खरीफ के लिए 2% और रबी के लिए 1.5% का न्यूनतम प्रीमियम देना होता है।\n- **नुकसान की सूचना:** फसल खराब होने के 72 घंटों के भीतर टोल-फ्री नंबर या फसल बीमा ऐप द्वारा बैंक या बीमा कंपनी को सूचित करना अनिवार्य है।",
                en: "**Scheme: PMFBY (Pradhan Mantri Fasal Bima Yojana)**\n- **Benefits:** Financial security against crop loss due to natural calamities like drought, flood, or pests. Farmers pay a low premium of 2% for Kharif and 1.5% for Rabi crops.\n- **Loss Intimation:** It is mandatory to report crop loss within 72 hours of damage via the toll-free number or Crop Insurance App to the bank or insurance company."
            }
        },
        {
            name: {
                hi: "PMKSY (प्रधानमंत्री कृषि सिंचाई योजना)",
                en: "PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)"
            },
            keywords: {
                hi: ["सिंचाई", "पानी", "ड्रिप", "टपक", "फव्वारा", "कुआं", "पाइप"],
                en: ["irrigation", "water", "drip", "sprinkler", "well", "pipe", "pmksy", "watering"]
            },
            details: {
                hi: "**योजना: PMKSY (प्रधानमंत्री कृषि सिंचाई योजना - हर खेत को पानी)**\n- **लाभ:** खेतों में ड्रिप (टपक) या स्प्रिंकलर (फव्वारा) सिंचाई प्रणाली लगाने के लिए लघु व सीमांत किसानों को 70% से 80% तक की भारी सरकारी सब्सिडी दी जाती है।\n- **आवेदन:** जिला कृषि/उद्यान विभाग में या राज्य के सिंचाई पोर्टल पर ऑनलाइन आवेदन करें।",
                en: "**Scheme: PMKSY (Pradhan Mantri Krishi Sinchayee Yojana - Water for Every Field)**\n- **Benefits:** Provides 70% to 80% subsidy to small and marginal farmers for installing water-saving drip or sprinkler irrigation systems.\n- **How to Apply:** Apply online on your state's irrigation portal or visit the district agriculture/horticulture department."
            }
        },
        {
            name: {
                hi: "SMAM (कृषि यंत्रीकरण पर उप-मिशन)",
                en: "SMAM (Sub-Mission on Agricultural Mechanization)"
            },
            keywords: {
                hi: ["ट्रैक्टर", "मशीन", "औजार", "उपकरण", "रोटावेटर", "कल्टीवेटर", "यंत्र"],
                en: ["tractor", "machine", "tools", "equipment", "rotavator", "cultivator", "machinery", "smam"]
            },
            details: {
                hi: "**योजना: SMAM (कृषि यंत्रीकरण उप-मिशन)**\n- **लाभ:** ट्रैक्टर, रोटावेटर, कल्टीवेटर और बुवाई मशीन आदि कृषि यंत्र खरीदने के लिए किसानों को 40% से 80% तक की सब्सिडी मिलती है।\n- **आवेदन:** राज्य के प्रत्यक्ष लाभ अंतरण (DBT) कृषि पोर्टल पर ऑनलाइन आवेदन करें।",
                en: "**Scheme: SMAM (Sub-Mission on Agricultural Mechanization)**\n- **Benefits:** Offers 40% to 80% subsidy to farmers for purchasing agricultural tools and machinery like tractors, rotavators, cultivators, and seed drills.\n- **How to Apply:** Apply online on your state's Direct Benefit Transfer (DBT) agriculture portal."
            }
        },
        {
            name: {
                hi: "Soil Health Card (मृदा स्वास्थ्य कार्ड)",
                en: "Soil Health Card"
            },
            keywords: {
                hi: ["मिट्टी", "जांच", "कार्ड", "मृदा", "उर्वरक", "यूरिया", "खाद"],
                en: ["soil", "test", "card", "health", "fertilizer", "urea", "manure"]
            },
            details: {
                hi: "**योजना: Soil Health Card (मृदा स्वास्थ्य कार्ड योजना)**\n- **लाभ:** खेत की मिट्टी का रासायनिक परीक्षण कर 12 पोषक तत्वों की स्थिति बताई जाती है और उर्वरकों की सही मात्रा उपयोग करने की मुफ्त रिपोर्ट मिलती है।\n- **संपर्क:** नमूना लेकर नजदीकी कृषि विस्तार अधिकारी या कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
                en: "**Scheme: Soil Health Card Scheme**\n- **Benefits:** Tests soil samples and provides a report on 12 essential soil parameters. Recommends the exact dosage of fertilizers and organic manure needed.\n- **Contact:** Collect a soil sample and contact your local agricultural extension officer or Krishi Vigyan Kendra (KVK)."
            }
        }
    ];

    function handleLocalFallback(query) {
        console.log("Triggering structured client-side fallback matching for:", query);
        setModeBadgeOnline(false); // Update UI badge to offline mode
        
        const cleanQuery = query.toLowerCase();
        
        // 1. Detect Category Intents in Query
        let hasPestQuery = false;
        let hasDiseaseQuery = false;
        
        for (const kw of categoryKeywords.pest) {
            if (cleanQuery.includes(kw)) {
                hasPestQuery = true;
                break;
            }
        }
        for (const kw of categoryKeywords.disease) {
            if (cleanQuery.includes(kw)) {
                hasDiseaseQuery = true;
                break;
            }
        }
        
        // 2. Identify Matched Crops
        const matchedCrops = [];
        for (const cropKey in localCropsDb) {
            const crop = localCropsDb[cropKey];
            for (const name of crop.names) {
                if (cleanQuery.includes(name)) {
                    matchedCrops.push(cropKey);
                    break;
                }
            }
        }
        
        // 3. Process Crop Diagnostic Advice
        const matchedAdviceBlocks = [];
        if (matchedCrops.length > 0) {
            for (const cropKey of matchedCrops) {
                const crop = localCropsDb[cropKey];
                
                // If query is specifically about pest OR disease, load only that.
                // If it mentions both or neither, load both for completeness.
                if (hasPestQuery && !hasDiseaseQuery) {
                    matchedAdviceBlocks.push(crop.pest[currentLang]);
                } else if (hasDiseaseQuery && !hasPestQuery) {
                    matchedAdviceBlocks.push(crop.disease[currentLang]);
                } else {
                    // Load both
                    const cropLabel = crop.cropName[currentLang];
                    const diseaseInfo = crop.disease[currentLang];
                    const pestInfo = crop.pest[currentLang];
                    if (currentLang === 'hi') {
                        matchedAdviceBlocks.push(`**फसल: ${cropLabel}**\n\n${diseaseInfo}\n\n${pestInfo}`);
                    } else {
                        matchedAdviceBlocks.push(`**Crop: ${cropLabel}**\n\n${diseaseInfo}\n\n${pestInfo}`);
                    }
                }
            }
        }
        
        // 4. Identify Matched Schemes
        const matchedSchemes = [];
        for (const scheme of localSchemesDb) {
            let matched = false;
            const allKeywords = [...scheme.keywords.hi, ...scheme.keywords.en];
            for (const kw of allKeywords) {
                if (cleanQuery.includes(kw)) {
                    matched = true;
                    break;
                }
            }
            if (matched) {
                matchedSchemes.push(scheme.details[currentLang]);
            }
        }
        
        // 5. Consolidate Matched Blocks
        let replyText = "";
        
        if (matchedAdviceBlocks.length > 0 && matchedSchemes.length > 0) {
            const cropSection = matchedAdviceBlocks.join("\n\n---\n\n");
            const schemeSection = matchedSchemes.join("\n\n---\n\n");
            if (currentLang === 'hi') {
                replyText = `किसानसाथी (ऑफलाइन मोड):\nआपके द्वारा पूछे गए फसल निदान और सरकारी योजनाओं की जानकारी नीचे दी गई है:\n\n${cropSection}\n\n[PAUSE]\n\n${schemeSection}`;
            } else {
                replyText = `KisanSathi (Offline Mode):\nHere is the information about crop diagnosis and government schemes you asked for:\n\n${cropSection}\n\n[PAUSE]\n\n${schemeSection}`;
            }
        } else if (matchedAdviceBlocks.length > 0) {
            const cropSection = matchedAdviceBlocks.join("\n\n---\n\n");
            if (currentLang === 'hi') {
                replyText = `किसानसाथी (ऑफलाइन मोड):\nफसल स्वास्थ्य निदान की जानकारी:\n\n${cropSection}`;
            } else {
                replyText = `KisanSathi (Offline Mode):\nCrop health diagnosis information:\n\n${cropSection}`;
            }
        } else if (matchedSchemes.length > 0) {
            const schemeSection = matchedSchemes.join("\n\n---\n\n");
            if (currentLang === 'hi') {
                replyText = `किसानसाथी (ऑफलाइन मोड):\nसरकारी योजनाओं की जानकारी:\n\n${schemeSection}`;
            } else {
                replyText = `KisanSathi (Offline Mode):\nGovernment schemes information:\n\n${schemeSection}`;
            }
        } else {
            // 6. True Fallback Message
            if (currentLang === 'hi') {
                replyText = "नमस्ते! मुझे आपके सवाल का सटीक जवाब किसानसाथी ऑफलाइन निर्देशिका में नहीं मिला।\n\nकृपया अपने सवाल को छोटा करें, अथवा मुख्य फसलों (गेहूं, धान, आलू, टमाटर) या योजनाओं (पीएम किसान, फसल बीमा, केसीसी लोन) के स्पष्ट नाम के साथ दोबारा पूछें। अथवा इंटरनेट कनेक्शन चालू होने पर पुनः प्रयास करें।";
            } else {
                replyText = "Hello! I could not find a precise answer to your question in the KisanSathi offline directory.\n\nPlease simplify your question or ask again using clear names of major crops (wheat, paddy, potato, tomato) or schemes (PM Kisan, crop insurance, KCC loan). Alternatively, please try again when your internet connection is active.";
            }
        }
        
        // Render response in UI and speak
        renderResponse(replyText);
        speakResponse(replyText);
    }

    // --------------------------------------------------------
    // Backend API Interaction
    // --------------------------------------------------------
    async function processFarmerQuery(queryText) {
        const t = translations[currentLang];
        responseDisplay.textContent = t.responseWaiting;
        updatePlaybackButtons(false);

        // Check for client-side URL debug parameter (?offline=true or ?force_offline=true)
        const urlParams = new URLSearchParams(window.location.search);
        const clientForceOffline = urlParams.get('offline') === 'true' || urlParams.get('force_offline') === 'true';

        if (clientForceOffline) {
            console.log('[Debug] URL parameter forced offline mode.');
            showToast(t.debugModeTitle, t.debugUrlText, "warning");
            handleLocalFallback(queryText);
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: queryText, lang: currentLang })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error("Server API returned error status:", response.status, errData);
                
                if (errData.error === 'FORCE_OFFLINE_MODE_ACTIVE') {
                    showToast(t.debugModeTitle, t.debugEnvText, "warning");
                } else if (errData.error === 'API_KEY_NOT_CONFIGURED') {
                    showToast(t.offlineModeTitle, t.apiKeyMissingText, "warning");
                } else {
                    showToast(t.connErrorTitle, t.connErrorText, "warning");
                }
                
                handleLocalFallback(queryText);
                return;
            }

            const data = await response.json();
            
            if (data.reply) {
                setModeBadgeOnline(true);
                renderResponse(data.reply);
                speakResponse(data.reply);
            } else {
                console.warn("Invalid empty reply from API server.");
                handleLocalFallback(queryText);
            }

        } catch (error) {
            console.error("Failed to connect to backend api:", error);
            showToast(t.networkErrorTitle, t.networkErrorText, "warning");
            handleLocalFallback(queryText);
        }
    }

    // --------------------------------------------------------
    // UI Rendering & Speech Playback Helper Functions
    // --------------------------------------------------------
    
    function renderResponse(markdownText) {
        lastResponseText = markdownText;
        
        // Remove [PAUSE] tag from the visual HTML content
        let cleanMarkdown = markdownText.replace(/\[PAUSE\]/g, '');
        
        // Convert simple markdown elements like **bold** and \n to HTML
        let htmlText = cleanMarkdown
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*?)$/gm, '<li>$1</li>');
            
        // Wrap <li> elements in <ul>
        if (htmlText.includes('<li>')) {
            htmlText = htmlText.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
        }
        
        responseDisplay.innerHTML = htmlText;
        updatePlaybackButtons(true);
    }

    function speakResponse(text) {
        // Stop current speech and cancel pending timeouts first
        synth.cancel();
        if (activeSpeechTimeout) {
            clearTimeout(activeSpeechTimeout);
            activeSpeechTimeout = null;
        }

        if (!text) return;

        // Clean text of markdown characters before speaking
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/[-#•]/g, '')
            .replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML tags if any

        // Check if there is a pause marker between sections
        if (cleanText.includes('[PAUSE]')) {
            const parts = cleanText.split('[PAUSE]');
            speakPartsInQueue(parts, 0);
        } else {
            speakUtteranceText(cleanText);
        }
    }

    function speakUtteranceText(text, callback) {
        if (!text.trim()) {
            if (callback) callback();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text.trim());
        
        const voice = currentLang === 'hi' ? hindiVoice : englishVoice;
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.85; // Slower rate (0.85) for clarity
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            speakAgainBtn.classList.add('active-playing');
            speakAgainBtn.innerHTML = `<i class="fa-solid fa-volume-high text-green"></i> ${currentLang === 'hi' ? 'बोल रहा हूँ...' : 'Speaking...'}`;
        };

        utterance.onend = () => {
            if (callback) {
                // Pause for 1.2 seconds between sections
                activeSpeechTimeout = setTimeout(callback, 1200);
            } else {
                resetPlaybackButton();
            }
        };

        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            if (callback) callback();
            else resetPlaybackButton();
        };

        synth.speak(utterance);
    }

    function speakPartsInQueue(parts, index) {
        if (index >= parts.length) {
            resetPlaybackButton();
            return;
        }
        speakUtteranceText(parts[index], () => {
            speakPartsInQueue(parts, index + 1);
        });
    }

    function resetPlaybackButton() {
        speakAgainBtn.classList.remove('active-playing');
        const t = translations[currentLang];
        speakAgainBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> ${t.speakBtnText}`;
    }

    function updatePlaybackButtons(enable) {
        if (enable) {
            speakAgainBtn.disabled = false;
            stopSpeakBtn.disabled = false;
        } else {
            speakAgainBtn.disabled = true;
            stopSpeakBtn.disabled = true;
        }
    }

    function setModeBadgeOnline(isOnline) {
        const t = translations[currentLang];
        if (isOnline) {
            modeBadge.className = "badge online";
            modeText.textContent = t.modeOnline;
        } else {
            modeBadge.className = "badge offline";
            modeText.textContent = t.modeOffline;
        }
    }

    // Playback Listeners
    speakAgainBtn.addEventListener('click', () => {
        if (lastResponseText) {
            speakResponse(lastResponseText);
        }
    });

    stopSpeakBtn.addEventListener('click', () => {
        synth.cancel();
        if (activeSpeechTimeout) {
            clearTimeout(activeSpeechTimeout);
            activeSpeechTimeout = null;
        }
        resetPlaybackButton();
    });

    // Toast Notification System
    function showToast(title, message, type = "info") {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = "fa-circle-info warning";
        if (type === "error") iconClass = "fa-circle-exclamation error";
        if (type === "success") iconClass = "fa-circle-check success";
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 50);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    }

    // Submit text query alternative
    function submitTextQuery() {
        if (!queryTextInput) return;
        const text = queryTextInput.value.trim();
        
        if (text.length === 0) {
            const container = queryTextInput.parentElement;
            if (container) {
                container.classList.add('input-error');
                setTimeout(() => {
                    container.classList.remove('input-error');
                }, 500);
            }
            return;
        }
        
        transcriptDisplay.value = text;
        queryTextInput.value = '';
        
        // Stop any active SpeechSynthesis
        synth.cancel();
        if (activeSpeechTimeout) {
            clearTimeout(activeSpeechTimeout);
            activeSpeechTimeout = null;
        }
        resetPlaybackButton();
        
        processFarmerQuery(text);
    }

    if (sendQueryBtn) {
        sendQueryBtn.addEventListener('click', submitTextQuery);
    }
    if (queryTextInput) {
        queryTextInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitTextQuery();
            }
        });
    }

    // Global reference for example clicks in HTML
    window.populateExample = (text) => {
        transcriptDisplay.value = text;
        processFarmerQuery(text);
    };
});
