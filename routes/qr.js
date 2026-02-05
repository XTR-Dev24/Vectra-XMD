const { 
    giftedId,
    removeFile
} = require('../gift');
const QRCode = require('qrcode');
const express = require('express');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns');
const {
    default: giftedConnect,
    useMultiFileAuthState,
    Browsers,
    delay,
    downloadContentFromMessage, 
    generateWAMessageFromContent, 
    normalizeMessageContent,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const sessionDir = path.join(__dirname, "session");


router.get('/', async (req, res) => {
    const id = giftedId();
    let responseSent = false;
    let sessionCleanedUp = false;

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            await removeFile(path.join(sessionDir, id));
            sessionCleanedUp = true;
        }
    }

    async function GIFTED_QR_CODE() {
        const { version } = await fetchLatestBaileysVersion();
        console.log(version);
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));
        try {
            let Gifted = giftedConnect({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            Gifted.ev.on('creds.update', saveCreds);
            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                
                if (qr && !responseSent) {
                    const qrImage = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.send(`
                   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Scanner | XTR Softwares</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-blue: #0066ff;
            --accent-cyan: #00d4ff;
            --dark-bg: #0a0a1a;
            --card-bg: rgba(10, 20, 40, 0.95);
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--dark-bg);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        /* Minimal background effect */
        .bg-glow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(0, 102, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 50%);
            z-index: -1;
        }
        
        .container {
            width: 100%;
            max-width: 500px;
            background: var(--card-bg);
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            border: 1px solid rgba(0, 102, 255, 0.2);
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(0, 102, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--accent-cyan);
            margin-bottom: 5px;
        }
        
        .title {
            font-size: 20px;
            color: var(--text-primary);
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .subtitle {
            color: var(--text-secondary);
            font-size: 14px;
            line-height: 1.5;
        }
        
        .qr-wrapper {
            margin: 30px 0;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            display: inline-block;
            position: relative;
            border: 1px solid rgba(0, 212, 255, 0.2);
        }
        
        .qr-code {
            width: 250px;
            height: 250px;
            border-radius: 12px;
            display: block;
            transition: transform 0.3s ease;
        }
        
        .qr-code:hover {
            transform: scale(1.02);
        }
        
        .scan-line {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            height: 3px;
            background: linear-gradient(90deg, 
                transparent, 
                var(--accent-cyan), 
                transparent);
            animation: scan 2s ease-in-out infinite;
            border-radius: 3px;
        }
        
        @keyframes scan {
            0% { top: 20px; }
            50% { top: 270px; }
            100% { top: 20px; }
        }
        
        .timer {
            color: var(--accent-cyan);
            font-size: 14px;
            font-weight: 500;
            margin-top: 15px;
        }
        
        .instruction {
            background: rgba(0, 102, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            margin-top: 30px;
            text-align: left;
            border-left: 3px solid var(--accent-cyan);
        }
        
        .instruction h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: var(--accent-cyan);
        }
        
        .instruction ul {
            list-style: none;
            padding-left: 5px;
        }
        
        .instruction li {
            color: var(--text-secondary);
            font-size: 14px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .instruction li:before {
            content: "•";
            color: var(--accent-cyan);
            position: absolute;
            left: 0;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-secondary);
            font-size: 12px;
        }
        
        .creator {
            color: var(--accent-cyan);
            font-weight: 500;
            margin-top: 5px;
        }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--primary-blue);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 102, 255, 0.3);
        }
        
        .refresh-btn:hover {
            background: var(--accent-cyan);
            transform: rotate(90deg);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
                max-width: 95%;
            }
            
            .qr-code {
                width: 220px;
                height: 220px;
            }
            
            .refresh-btn {
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
            }
        }
        
        @media (max-width: 400px) {
            .qr-code {
                width: 200px;
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    
    <main class="container">
        <header class="header">
            <div class="logo">Vectra</div>
            <h1 class="title">WhatsApp QR Scanner</h1>
            <p class="subtitle">Scan this code with WhatsApp to link your device</p>
        </header>
        
        <div class="qr-wrapper">
            <img src="${qrImage}" alt="QR Code" class="qr-code">
            <div class="scan-line"></div>
        </div>
        
        <div class="timer" id="timer">Code refreshes in 60 seconds</div>
        
        <div class="instruction">
            <h3>How to scan:</h3>
            <ul>
                <li>Open WhatsApp on your phone</li>
                <li>Tap Settings → Linked Devices</li>
                <li>Point your camera at this QR code</li>
            </ul>
        </div>
        
        <footer class="footer">
            <div>Advanced QR Scanner</div>
            <div class="creator">Powered by Frank & The XTR Software developers</div>
        </footer>
    </main>
    
    <button class="refresh-btn" onclick="window.location.reload()">
        <i class="fas fa-sync-alt"></i>
    </button>
    
    <script>
        // Countdown timer
        let timeLeft = 60;
        const timerElement = document.getElementById('timer');
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `Code refreshes in ${timeLeft} seconds`;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                window.location.reload();
            }
        }, 1000);
        
        // Auto-refresh after 60 seconds
        setTimeout(() => {
            window.location.reload();
        }, 60000);
        
        // QR code click to enlarge
        const qrCode = document.querySelector('.qr-code');
        qrCode.addEventListener('click', function() {
            if (this.style.width === '100%') {
                this.style.width = '250px';
                this.style.height = '250px';
                this.style.position = 'static';
                this.style.zIndex = '1';
            } else {
                this.style.width = '100%';
                this.style.height = '100%';
                this.style.position = 'fixed';
                this.style.top = '0';
                this.style.left = '0';
                this.style.zIndex = '1000';
                this.style.backgroundColor = 'rgba(10, 10, 26, 0.95)';
                this.style.padding = '40px';
            }
        });
    </script>
</body>
</html>
                        `);
                        responseSent = true;
                    }
                }

                if (connection === "open") {
                    // Removed the group invite code
                    await delay(5000); // Reduced delay since we're not joining groups

                    let sessionData = null;
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    while (attempts < maxAttempts && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) {
                                    sessionData = data;
                                    break;
                                }
                            }
                            await delay(2000);
                            attempts++;
                        } catch (readError) {
                            console.error("Read error:", readError);
                            await delay(2000);
                            attempts++;
                        }
                    }

                    if (!sessionData) {
                        await cleanUpSession();
                        return;
                    }

                    try {
                        let compressedData = zlib.gzipSync(sessionData);
                        let b64data = compressedData.toString('base64');
                        const Sess = await sendButtons(Gifted, Gifted.user.id, {
            title: '',
            text: 'Buddy~' + b64data,
            footer: `> *Made By XTR Developers*`,
            buttons: [
                { 
                    name: 'cta_copy', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: 'Copy Session', 
                        copy_code: 'Buddy~' + b64data 
                    }) 
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Visit Bot Repo',
                        url: 'https://github.com/carl24tech/Buddy-XTR'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Join WaChannel',
                        url: 'https://whatsapp.com/channel/002b3hlgX5kg7G0nFggl0Y'
                    })
                }
            ]
        });

                        await delay(2000);
                        await Gifted.ws.close();
                    } catch (sendError) {
                        console.error("Error sending session:", sendError);
                    } finally {
                        await cleanUpSession();
                    }
                    
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    GIFTED_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Main error:", err);
            if (!responseSent) {
                res.status(500).json({ code: "QR Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
        }
    }

    try {
        await GIFTED_QR_CODE();
    } catch (finalError) {
        console.error("Final error:", finalError);
        await cleanUpSession();
        if (!responseSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
