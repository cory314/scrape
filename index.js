const { Pool } = require('pg');


const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ubuntu',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'extraranch'
});

pool.on('error', (err, client) => {
  console.log(err);
  process.exit(-1)
})



module.exports = pool;