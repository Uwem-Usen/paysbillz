const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function fixDB() {
    const db = await open({
        filename: './paysbillz.db',
        driver: sqlite3.Database
    });

    // Check and add missing columns to transactions table
    try {
        await db.exec('ALTER TABLE transactions ADD COLUMN description TEXT');
        console.log('✅ Added description column');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ description column already exists');
        } else {
            console.log('⚠️ Could not add description:', e.message);
        }
    }

    try {
        await db.exec('ALTER TABLE transactions ADD COLUMN reference TEXT');
        console.log('✅ Added reference column');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ reference column already exists');
        } else {
            console.log('⚠️ Could not add reference:', e.message);
        }
    }

    try {
        await db.exec('ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT "pending"');
        console.log('✅ Added status column');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ status column already exists');
        } else {
            console.log('⚠️ Could not add status:', e.message);
        }
    }

    // Check current table structure
    const tableInfo = await db.all('PRAGMA table_info(transactions)');
    console.log('\n📋 Transactions table columns:');
    tableInfo.forEach(col => {
        console.log('   - ' + col.name + ' (' + col.type + ')');
    });

    await db.close();
    console.log('✅ Database fix complete!');
}

fixDB();
