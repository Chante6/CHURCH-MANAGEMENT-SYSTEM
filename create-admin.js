
const db = require('./db');
const bcrypt = require('bcryptjs');
const readline = require('readline/promises');

async function createAdmin() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS total FROM users'
        );

        if (Number(rows[0].total) > 0) {
            console.log('A user already exists. Admin creation stopped.');
            return;
        }

        const username = await rl.question('Choose admin username: ');
        const password = await rl.question('Choose admin password: ');

        if (!username.trim() || password.length < 8) {
            console.log('Username is required and password must be at least 8 characters.');
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username.trim(), passwordHash, 'Admin']
        );

        console.log('Administrator account created successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
        await db.end();
    }
}

createAdmin();
