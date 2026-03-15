// BrownNoise → LPF(400) → RHPF → output

let audioContexts = [];
let crackleInterval = null;

function startAudio() {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioContexts.push(audioCtx);
    audioCtx.resume();

    var bufferSize = 10 * audioCtx.sampleRate,
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
    output = noiseBuffer.getChannelData(0);

    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }

    brownNoise = audioCtx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.start(0);

    // lpf first 

    var lpf = audioCtx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 400;
    brownNoise.connect(lpf);

    // lpf second 

    noiseBuffer2 = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
    output2 = noiseBuffer2.getChannelData(0);

    var lastOut2 = 0;
    for (var i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
    
        output2[i] = (lastOut2 + (0.02 * brown)) / 1.02;
        lastOut2 = output2[i];
        output2[i] *= 3.5;
    }

    brownNoise2 = audioCtx.createBufferSource();
    brownNoise2.buffer = noiseBuffer2;
    brownNoise2.loop = true;
    brownNoise2.start();

    var modLPF = audioCtx.createBiquadFilter();
    modLPF.type = "lowpass";
    modLPF.frequency.value = 14;
    brownNoise2.connect(modLPF);

    var modGain = audioCtx.createGain();
    modGain.gain.value = 400; // * 400
    modLPF.connect(modGain);

    var offset = audioCtx.createConstantSource();
    offset.offset.value = 500; // + 500
    offset.start();

    //rhpf 

    var rhpf = audioCtx.createBiquadFilter();
    rhpf.type = "highpass";
    rhpf.Q.value = 1 / 0.03;   // approximate RQ
    // rhpf.Q.value = 5;  

    modGain.connect(rhpf.frequency);
    offset.connect(rhpf.frequency);

    //output 

    var outGain = audioCtx.createGain();
    outGain.gain.value = 0.1;
    // outGain.gain.value = 0.2;


    lpf.connect(rhpf);
    rhpf.connect(outGain);
    outGain.connect(audioCtx.destination);

}

function startFire() {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioContexts.push(audioCtx);
    audioCtx.resume();

    var bufferSize = 2 * audioCtx.sampleRate;
    var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var output = noiseBuffer.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    function createNoiseSource() {
        var src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        src.start();
        return src;
    }

    var hissNoise = createNoiseSource();

    var hissFilter = audioCtx.createBiquadFilter();
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 1000;

    var hissGain = audioCtx.createGain();
    hissGain.gain.setValueAtTime(0, audioCtx.currentTime);
    hissGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    hissNoise.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(audioCtx.destination);

    function makeCrackle() {

        var crackleNoise = createNoiseSource();

        var crackleFilter = audioCtx.createBiquadFilter();
        crackleFilter.type = "bandpass";
        crackleFilter.frequency.value = 3000;

        var crackleGain = audioCtx.createGain();
        crackleGain.gain.value = 0;

        crackleNoise.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(audioCtx.destination);
        var now = audioCtx.currentTime;

        crackleGain.gain.setValueAtTime(0, now);
        crackleGain.gain.linearRampToValueAtTime(0.8, now + 0.005);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        crackleNoise.stop(now + 0.2);
    }

    crackleInterval = setInterval(function() {
    if (Math.random() < 0.4) {
        makeCrackle();
    }
    }, 200);

}

function stopAudio() {

    if (crackleInterval) {
        clearInterval(crackleInterval);
    }

    audioContexts.forEach(ctx => ctx.close());
    audioContexts = [];

}






