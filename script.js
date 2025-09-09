// 即時実行関数でグローバルスコープの汚染を防ぐ
(() => {
    // DOM要素の取得
    const textInput = document.querySelector('#text-input');
    const voiceSelect = document.querySelector('#voice-select');
    const speakButton = document.querySelector('#speak-button');
    const pauseButton = document.querySelector('#pause-button');
    const resumeButton = document.querySelector('#resume-button');
    const statusMessage = document.querySelector('#status-message');

    // SpeechSynthesis APIのインスタンスを取得
    const synth = window.speechSynthesis;

    // Web Speech APIがサポートされているかチェック
    if (!synth) {
        statusMessage.textContent = "お使いのブラウザは音声合成に対応していません。";
        speakButton.disabled = true;
        pauseButton.disabled = true;
        resumeButton.disabled = true;
        return;
    }

    let voices = [];

    function populateVoiceList() {
        voices = synth.getVoices().sort((a, b) => a.lang.localeCompare(b.lang));
        const previouslySelected = voiceSelect.value;
        voiceSelect.innerHTML = '';

        for (const voice of voices) {
            // 日本語、英語、中国語の音声のみをリストに追加
            if (voice.lang.startsWith('ja') || voice.lang.startsWith('en') || voice.lang.startsWith('zh')) {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                
                option.setAttribute('data-lang', voice.lang);
                option.setAttribute('data-name', voice.name);
                
                voiceSelect.appendChild(option);
            }
        }
        
        // デフォルトで日本語の音声を選択する
        const japaneseVoice = voices.find(voice => voice.lang.startsWith('ja'));
        if (japaneseVoice) {
            // data-name属性を元にデフォルト値を探して設定
            const defaultOption = Array.from(voiceSelect.options).find(opt => opt.getAttribute('data-name') === japaneseVoice.name);
            if(defaultOption) {
                voiceSelect.value = defaultOption.value;
            }
        }

        // もし以前選択していた声があれば、それを再度選択状態にする
        if (previouslySelected) {
            voiceSelect.value = previouslySelected;
        }

        if (voiceSelect.options.length === 0) {
            statusMessage.textContent = "利用可能な日本語、英語、または中国語の音声が見つかりませんでした。";
            speakButton.disabled = true;
        } else {
            statusMessage.textContent = "";
            speakButton.disabled = false;
        }
    }

    // 利用可能な音声リストが変更されたときにリストを更新
    // getVoices()は非同期で読み込まれるため、このイベントは必須
    synth.onvoiceschanged = populateVoiceList;
    populateVoiceList();


    function speak() {
        if (synth.speaking) {
            console.error('すでに読み上げ中です。');
            return;
        }
        if (textInput.value !== '') {
            const utterThis = new SpeechSynthesisUtterance(textInput.value);
            
            // 選択されているoption要素から 'data-name' 属性を取得
            const selectedOption = voiceSelect.selectedOptions[0];
            const selectedOptionName = selectedOption.getAttribute('data-name');
            const selectedVoice = voices.find(voice => voice.name === selectedOptionName);
            
            if (selectedVoice) {
                utterThis.voice = selectedVoice;
            }

            utterThis.onstart = () => {
                statusMessage.textContent = '読み上げ中...';
            };

            utterThis.onend = () => {
                statusMessage.textContent = '読み上げが完了しました。';
                setTimeout(() => { statusMessage.textContent = ''; }, 3000);
            };

            utterThis.onerror = (event) => {
                statusMessage.textContent = `エラーが発生しました: ${event.error}`;
            };

            synth.speak(utterThis);
        }
    }

    speakButton.addEventListener('click', speak);

    pauseButton.addEventListener('click', () => {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            statusMessage.textContent = '一時停止中';
        }
    });

    resumeButton.addEventListener('click', () => {
        if (synth.paused) {
            synth.resume();
            statusMessage.textContent = '読み上げ中...';
        }
    });

    // 読み上げ中にページを離れようとした場合に、読み上げをキャンセルする
    window.addEventListener('beforeunload', () => {
        if (synth.speaking) {
            synth.cancel();
        }
    });

})();