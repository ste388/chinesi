const admin = require('firebase-admin');

// 1. Inizializza Firebase con il segreto di GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// 2. Configurazione EmailJS
const EMAILJS_SERVICE_ID = "service_t1rovq9"; 
const EMAILJS_TEMPLATE_ID = "template_zw8by5a"; 
const EMAILJS_PUBLIC_KEY = "vHtINp_1fBRodY8Pp"; 
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; 

async function sendEmail(socio) {
    const data = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
            to_email: socio.email,
            to_name: socio.nome + ' ' + socio.cognome,
            data_scadenza: formatDateIT(socio.scadenzaCertificato)
        }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
    }
}

function formatDateIT(dateStr) {
    if (!dateStr) return 'N/D';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}

function getDateStatus(dateString) {
    if (!dateString) return { status: 'expired', days: 0 };
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateString); target.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', days: diffDays };
    if (diffDays <= 30) return { status: 'expiring', days: diffDays };
    return { status: 'active', days: diffDays };
}

async function run() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('soci').get();
        let count = 0;

        for (const doc of snapshot.docs) {
            const socio = { id: doc.id, ...doc.data() };
            
            // FILTRO: Salta se l'abbonamento è scaduto, se manca l'email o se è già stata inviata oggi
            const subStat = getDateStatus(socio.scadenzaAbbonamento);
            if (subStat.status === 'expired') continue;
            if (!socio.email || socio.dataInvioAvvisoCertificato) continue;

            const medStat = getDateStatus(socio.scadenzaCertificato);
            if (medStat.status === 'expiring' && medStat.days <= 30 && medStat.days >= 0) {
                console.log(`Invio mail a: ${socio.cognome} ${socio.nome} (${socio.email})`);
                await sendEmail(socio);
                await db.collection('soci').doc(socio.id).update({ dataInvioAvvisoCertificato: todayStr });
                count++;
            }
        }
        console.log(`Finito! Email automatiche inviate: ${count}`);
        process.exit(0);
    } catch (error) {
        console.error("Errore script:", error);
        process.exit(1);
    }
}

run();
