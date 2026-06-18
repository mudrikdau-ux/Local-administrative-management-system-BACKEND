const bcrypt = require('bcryptjs');

const password = 'mudy@2005'; 

bcrypt.hash(password, 12, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
});