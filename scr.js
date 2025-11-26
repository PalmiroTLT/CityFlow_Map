const crypto = require('crypto');

// Вставьте ваш приватный ключ из web-push
const privateKeyBase64 = 'KIjd0Y28O4MSGAO_Bxi8UcjTa4qfOJehu-iCZkHj1lo';

// Конвертируем base64url в buffer
const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

// Создаём PKCS#8 PEM
const keyObject = crypto.createPrivateKey({
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8'
});

const pemKey = keyObject.export({
    type: 'pkcs8',
    format: 'pem'
});

console.log('VAPID_PRIVATE_KEY (PEM format):');
console.log(pemKey);