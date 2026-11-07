
const intro = document.getElementById("intro");
const countdown = document.getElementById("countdown");
const countNumber = document.getElementById("countNumber");
const celebration = document.getElementById("celebration");

const fireCanvas = document.getElementById("fireworks");
const starCanvas = document.getElementById("stars");

const ctx = fireCanvas.getContext("2d");
const starCtx = starCanvas.getContext("2d");

let fireworks = [];
let particles = [];
let stars = [];
let audioCtx;
let musicTimer;
let animationStarted = false;

// --------------------------------
// CANVAS SETUP
// --------------------------------

function resize() {
    fireCanvas.width = starCanvas.width = window.innerWidth;
    fireCanvas.height = starCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// --------------------------------
// AUDIO SYSTEM
// --------------------------------

function startAudio() {
    const AudioContext = window.AudioContext ||
                         window.webkitAudioContext;

    if (!AudioContext) return;

    audioCtx = new AudioContext();

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Ambient musical notes
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63];
    let noteIndex = 0;

    musicTimer = setInterval(() => {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.value = notes[noteIndex];

        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.035, audioCtx.currentTime + 0.15
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001, audioCtx.currentTime + 1.5
        );

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);

        noteIndex = (noteIndex + 1) % notes.length;
    }, 750);
}

// Firecracker pop sound
function crackerSound() {
    if (!audioCtx) return;

    const duration = 0.22;
    const buffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * duration,
        audioCtx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) *
                  Math.pow(1 - i / data.length, 5);
    }

    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 4500;

    gain.gain.value = 0.7;

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
}

// Firework launch sound
function launchSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
        800, audioCtx.currentTime + 0.35
    );

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001, audioCtx.currentTime + 0.35
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

// --------------------------------
// STAR SKY
// --------------------------------

function createStars() {
    stars = [];

    for (let i = 0; i < 130; i++) {
        stars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.8,
            alpha: Math.random(),
            speed: Math.random() * 0.015
        });
    }
}

function drawStars() {
    starCtx.clearRect(
        0, 0, starCanvas.width, starCanvas.height
    );

    stars.forEach(star => {
        star.alpha += star.speed;

        if (star.alpha > 1 || star.alpha < 0.15) {
            star.speed *= -1;
        }

        starCtx.fillStyle =
            `rgba(255,220,150,${star.alpha})`;

        starCtx.beginPath();
        starCtx.arc(
            star.x, star.y, star.size, 0, Math.PI * 2
        );
        starCtx.fill();
    });

    requestAnimationFrame(drawStars);
}

createStars();
drawStars();

// --------------------------------
// FIREWORKS ENGINE
// --------------------------------

class Firework {
    constructor(x, y) {
        this.x = x;
        this.y = window.innerHeight;
        this.targetY = y;

        this.speed = 7 + Math.random() * 4;
        this.exploded = false;

        this.hue = Math.random() * 360;
    }

    update() {
        if (this.y > this.targetY) {
            this.y -= this.speed;
        } else {
            this.exploded = true;
            this.explode();
            crackerSound();
        }
    }

    explode() {
        const amount = 65 + Math.floor(Math.random() * 55);

        for (let i = 0; i < amount; i++) {
            const angle = Math.PI * 2 * i / amount;
            const speed = Math.random() * 5 + 1.5;

            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                decay: Math.random() * 0.012 + 0.008,
                radius: Math.random() * 2.5 + 1,
                hue: this.hue
            });
        }

        // Additional golden sparkles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - .5) * 7,
                vy: (Math.random() - .5) * 7,
                alpha: 1,
                decay: 0.025,
                radius: 1.5,
                hue: 45
            });
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue},100%,70%)`;
        ctx.fill();
    }
}

function launchFirework() {
    if (!animationStarted) return;

    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight * 0.55 + 40;

    fireworks.push(new Firework(x, y));
    launchSound();
}

function animateFireworks() {
    ctx.clearRect(
        0, 0, fireCanvas.width, fireCanvas.height
    );

    fireworks.forEach((fw, index) => {
        fw.update();
        fw.draw();

        if (fw.exploded) {
            fireworks.splice(index, 1);
        }
    });

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.035;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.alpha -= p.decay;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        ctx.fillStyle =
            `hsla(${p.hue},100%,65%,${Math.max(0,p.alpha)})`;

        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${p.hue},100%,60%)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.alpha <= 0) {
            particles.splice(index, 1);
        }
    });

    requestAnimationFrame(animateFireworks);
}

animateFireworks();

// --------------------------------
// MAGICAL COUNTDOWN
// --------------------------------

function startCountdown() {
    let number = 3;

    countdown.classList.remove("hidden");
    countNumber.textContent = number;

    const timer = setInterval(() => {
        number--;

        if (number > 0) {
            countNumber.textContent = number;

            // Restart countdown animation
            countNumber.style.animation = "none";
            void countNumber.offsetWidth;
            countNumber.style.animation = "countPop .9s";
        } else {
            clearInterval(timer);

            countNumber.textContent = "✨";

            setTimeout(() => {
                countdown.classList.add("hidden");
                startCelebration();
            }, 650);
        }
    }, 1000);
}

// --------------------------------
// MAIN CELEBRATION
// --------------------------------

function startCelebration() {
    celebration.classList.remove("hidden");
    animationStarted = true;

    // Fireworks begin
    let count = 0;

    const grandShow = setInterval(() => {
        launchFirework();

        if (count % 3 === 0) {
            setTimeout(launchFirework, 250);
            setTimeout(launchFirework, 550);
        }

        count++;

        if (count >= 30) {
            clearInterval(grandShow);
        }
    }, 350);

    // Continuous occasional fireworks
    setInterval(() => {
        if (animationStarted) {
            launchFirework();
        }
    }, 2400);

    typeWish();
}

// --------------------------------
// TYPEWRITER WISH
// --------------------------------

const message =
    "May this beautiful festival fill your home with " +
    "endless happiness, your heart with unconditional love, " +
    "and your life with success and prosperity. " +
    "May every darkness disappear and every dream " +
    "find its way towards the light. " +
    "Wishing you and your family a spectacular, " +
    "joyful and blessed Diwali!";

function typeWish() {
    const element = document.getElementById("wishMessage");
    element.textContent = "";

    let index = 0;

    function write() {
        if (index < message.length) {
            element.textContent += message.charAt(index);
            index++;

            setTimeout(write, 35);
        }
    }

    setTimeout(write, 3000);
}

// --------------------------------
// BUTTON EVENTS
// --------------------------------

document.getElementById("magicButton")
    .addEventListener("click", () => {

        startAudio();

        intro.style.opacity = "0";

        setTimeout(() => {
            intro.classList.add("hidden");
            startCountdown();
        }, 1300);
    });

// Replay the entire experience
document.getElementById("replayButton")
    .addEventListener("click", () => {
        window.location.reload();
    });

// --------------------------------
// INTERACTIVE GOLDEN SPARKLES
// --------------------------------

document.addEventListener("pointerdown", event => {
    if (!animationStarted) return;

    const x = event.clientX;
    const y = event.clientY;

    for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.025,
            radius: Math.random() * 3,
            hue: 35 + Math.random() * 30
        });
    }
});
