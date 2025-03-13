const fs = require("fs");
const axios = require("axios");
const { ethers } = require("ethers");
const FormData = require("form-data");

const REFERRAL_FILE = "reff.txt";
const WALLET_FILE = "wallets.txt";
let referralCodes = fs.existsSync(REFERRAL_FILE) ? fs.readFileSync(REFERRAL_FILE, "utf8").split("\n").map(code => code.trim()) : [];

async function processAccount() {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    const seedPhrase = wallet.mnemonic.phrase;

    console.log("🔑 Private Key:", privateKey);
    console.log("🏠 Address:", address);
    console.log("🌱 Seed Phrase:", seedPhrase);

    fs.appendFileSync(WALLET_FILE, `${address} | ${privateKey} | ${seedPhrase}\n`, "utf8");

    const message = `Welcome to AGNTxp! Click \"Sign\" to log in and verify ownership of your wallet address.`;

    try {
        const signature = await wallet.signMessage(message);
        console.log("✍️ Signature:", signature);

        const response = await axios.post("https://iagent-xp.iagentpro.com/register", {
            walletAddress: address,
            signature: signature
        });

        if (response.data.token) {
            console.log("✅ Berhasil daftar!");
            console.log("🔑 Token: ", response.data.token);
            const token = response.data.token;
            await submitReferral(token);
            await uploadProfile(token);
            await generateIdentity(token);
            await shareIdentity(token);
            await checkUserInfo(token);
            return token;
        }
    } catch (error) {
        console.error("❌ Error daftar:", error.response?.data || error.message);
    }
    return null;
}

async function submitReferral(token) {
    for (const code of referralCodes) {
        try {
            const response = await axios.post("https://iagent-xp.iagentpro.com/validate-referal", { referralCode: code }, { headers: { Authorization: `Bearer ${token}` } });
            console.log(`✅ Referral ${code} berhasil diklaim!`, response.data);
        } catch (error) {
            console.error(`❌ Gagal klaim referral ${code}:`, error.response?.data || error.message);
        }
    }
}

async function uploadProfile(token) {
    try {
        const imagePath = "avatar.png";
        if (!fs.existsSync(imagePath)) {
            console.log("⚠️ Gambar avatar.png tidak ditemukan! Lewati upload profile.");
            return null;
        }

        const formData = new FormData();
        formData.append("profilePicture", fs.createReadStream(imagePath));

        const response = await axios.post("https://iagent-xp.iagentpro.com/agent-identity/upload", formData, {
            headers: { Authorization: `Bearer ${token}`, ...formData.getHeaders() }
        });

        console.log("📤 Response Upload Profile:", response.data);

        if (response.data?.data?.profile_picture_url) {
            console.log("✅ Profil berhasil di-upload! URL:", response.data.data.profile_picture_url);
            return response.data.data.profile_picture_url;
        } else {
            console.log("❌ Tidak menemukan URL gambar dalam response!");
        }
    } catch (error) {
        console.error("❌ Gagal upload profil:", error.response?.data || error.message);
    }
    return null;
}

async function generateIdentity(token) {
    try {
        const response = await axios.post("https://iagent-xp.iagentpro.com/agent-identity/generate", {}, { headers: { Authorization: `Bearer ${token}` } });
        console.log("✅ Identitas berhasil dibuat!", response.data);
    } catch (error) {
        console.error("❌ Gagal generate identitas:", error.response?.data || error.message);
    }
}

async function shareIdentity(token) {
    try {
        const response = await axios.post("https://iagent-xp.iagentpro.com/agent-identity/share", {}, { headers: { Authorization: `Bearer ${token}` } });
        console.log("✅ Identitas berhasil dibagikan!", response.data);
    } catch (error) {
        console.error("❌ Gagal share identitas:", error.response?.data || error.message);
    }
}

async function checkUserInfo(token) {
    try {
        const response = await axios.get("https://iagent-xp.iagentpro.com/get-user-info", {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("📊 User Info:", response.data);
    } catch (error) {
        console.error("❌ Gagal cek user info:", error.response?.data || error.message);
    }
}

async function runBatch() {
    while (true) {
        for (let i = 0; i < 1000; i++) {
            console.log(`🚀 Memproses akun ke-${i + 1}`);
            const token = await processAccount();
            if (token) {
                console.log(`✅ Akun ke-${i + 1} berhasil dibuat dan diproses!`);
            } else {
                console.log(`❌ Gagal membuat akun ke-${i + 1}`);
            }
        }
        console.log("🕒 Menunggu 12 jam sebelum mengulang...");
        await new Promise(resolve => setTimeout(resolve, 12 * 60 * 60 * 1000)); // 12 jam
    }
}

runBatch();
