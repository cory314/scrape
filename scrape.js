const pool = require('./index.js');
const Axios = require('axios');
const { response } = require('express');
const zipcodes = [];
let counter = 1403;
let offset = 0;
let apicalls = 0;
pool.connect().then((client) => {
    client.query(`CREATE TABLE IF NOT EXISTS locations (
id SERIAL PRIMARY KEY,
name VARCHAR(200) NOT NULL,
zipcode varchar(11) NOT NULL
)`)
        .then((res) => {
            console.log("restaurants table created");
            client.release();
        }).catch((err) => {
            client.release();
        })
})

pool.connect().then((client) => {
    client.query('SELECT zipcode FROM zipcodes ORDER BY id ASC')
        .then((res) => {
            for (let i = 0; i < res.rows.length; i++) {
                zipcodes.push(res.rows[i].zipcode);
            }
            client.release();
        })
        .then(() => {
            function myLoop() {
                setTimeout(() => {
                    let query = `https://api.yelp.com/v3/businesses/search?term=restaurant&location=${zipcodes[counter]}&limit=50&offset=${offset}`;
                    apicalls++;
                    console.log('apicalls: ', apicalls);
                    console.log('counter: ', counter);
                    console.log('offset: ', offset);
                    console.log('zipcode: ', zipcodes[counter]);
                    Axios.get(query, { headers: { Authorization: 'Bearer RPWVWz5MP7UvE9fGAme8BZPquVIynzI9Yy1o91dD7vrxmQgbk8qcpzuIIOeSTTOEdnc7cOIF4QIedAHk-N55B4QQz-8DpAvb16es9kZRg0ofIgLSaicyPc9agC71YnYx' } })
                        .then((res) => {
                            let names = [];
                            let zips = [];
                            for (let j = 0; j < res.data.businesses.length; j++) {
                                let name = res.data.businesses[j].name.replace(/'/g, "")
                                names.push(name);
                                zips.push(res.data.businesses[j].location.zip_code || zipcodes[counter]);

                            }
                            if (offset + 50 < res.data.total) {
                                offset = offset + 50
                                if (offset === 1000) { offset = 0; counter++ }
                            }
                            else {
                                offset = 0;
                                counter++;
                            }
                            if (names.length > 0) {
                            pool.connect().then((client) => {
                                let query = `insert into locations (name, zipcode) values(unnest(ARRAY${JSON.stringify(names).replace(/"/g, "'")}), unnest(ARRAY${JSON.stringify(zips).replace(/"/g, "'")}))`;
                                client.query(query)
                                    .then((response) => {
                                        client.release();
                                    }).catch((err) => {
                                        console.log(err);
                                        client.release();
                                    })
                            })
                        }
                        }).catch((err) => {
                            console.log('minor error encounter');
                            
                        })
                    if (apicalls < 4900) {
                        myLoop();
                    }
                }, 500);

            }
            myLoop();

        })


})
/* 
pool.connect().then((client) => {
    client.query('SELECT zipcode FROM zipcodes')
        .then(async (res) => {
            console.log(res.rows);
            let zipcodes = JSON.parse(JSON.stringify(res.rows));
            let offset = 0;
            for (let i = 0; i < 10; i++) {
                let zip = zipcodes[i].zipcode;
                await Axios.get(`https://api.yelp.com/v3/businesses/search?term=restaurant&location=${zipcodes[i].zipcode}&limit=50&offset=${offset}`
                    , { headers: { Authorization: 'Bearer WBeI05J5NDdNo7u-yCm8XyX7Gclo3HCzO1lK74eVjpcOYGba3p2dkaWedJsQhRaq5eOKWmUK1QN_vj-zi6IBm09Hm7ql0d-P6YcIMvbL13-mf-RQcCsEKr2TYHTxYnYx' } })
                    .then((res) => {
                        for (let j = 0; j < response.data.businesses.length; j++) {
                            let name = res.data.businesses[j].name;
                            let zipcode = res.data.businesses[j].location.zip_code;
                            pool.connect().then((client) => {
                                client.query(`insert into locations (name, zipcode) values ('${name}', ${zipcode})`)

                                    .then((response) => {
                                        client.release();
                                    }).catch((err) => {
                                        console.log('error line 46', err)
                                        client.release();
                                    })
                            })
                        }
                        if (offset < res.total) { offset = offset + 50; } else {
                            offset = 0;
                        }
                    }
                    )
                    .catch((err) => { console.log("error line 55", err) });
            }
        }).catch((err) => {
            console.log('error line 58');
            client.release();
        })

})


 */