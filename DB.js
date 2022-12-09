
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require("./config.js");

const { Sequelize, DataTypes, Op } = require('@sequelize/core');

const mysql = new Sequelize( DB_NAME, DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

const beatmapset_data = mysql.define ('beatmap_data', {
    
    beatmap_id: { type: DataTypes.BIGINT,  unique: true },
    beatmapset_id: { type: DataTypes.BIGINT, defaultValue: 0},

    star_taiko_local: { type: DataTypes.FLOAT,  defaultValue: 0 },
    star_taiko_lazer: { type: DataTypes.FLOAT,  defaultValue: 0 },

    artist: { type: DataTypes.STRING, defaultValue: ''},
    title: { type: DataTypes.STRING, defaultValue: ''},
    creator: { type: DataTypes.STRING, defaultValue: ''},
    difficulty: { type: DataTypes.STRING, defaultValue: ''},

    gamemode: { type: DataTypes.STRING, defaultValue: 'std'},
});




async function prepareDB (){
    try {
        console.log(`База данных`,`Подготовка..`)
        console.time('db')
        const mysql_checkdb = require('mysql2/promise');
        const connection = await mysql_checkdb.createConnection(`mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);

    } catch (e){
        console.timeEnd('db')
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error('Нет доступа к базе');
        } else {
            throw new Error(`ошибка базы: ${e}`);
        }
    }
    await mysql.sync({ logging: ''})
    console.log(`База данных`,`Подготовка завершена`)
    console.timeEnd('db');
}

async function MYSQL_SAVE( MysqlModel, keys, values){

    function MYSQL_MERGE_KEYS_VALUES ( keys, values ){
        return Object.assign({}, keys, values);
    }

    function upsert(Model, condition, values) {
        return Model
            .findOne({ where: condition, logging: '' })
            .then(function(obj) {
                try{
                    // update
                    if(obj)
                        return obj.update(values, {logging: ''});
                    // insert
                    return Model.create(values, {logging: ''});
                } catch (e){
                    if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                        throw new Error('Нет доступа к базе');
                    } else {
                        throw new Error(`ошибка базы: ${e}`);
                    }
                }
            })
    }

    if (keys !== 0){
        values = MYSQL_MERGE_KEYS_VALUES(keys, values)
    }
    try {
        if (typeof values.length !== 'undefined' && values.length>0){
            return await MysqlModel.bulkCreate(values, {logging: ''})
        } else {
            return upsert(MysqlModel, keys, values );
        }
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }       
}

async function MYSQL_GET_ONE(MysqlModel, condition){
    try {
        var res = await MysqlModel.findOne({ where: condition , logging: ''});
        if (res == null){
            return false;
        } else {
            return res.dataValues;
        }
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }
}


async function MYSQL_GET_ALL(MysqlModel, condition = {}){
    try{
        return await MysqlModel.findAll ({
            where: condition, logging: ''
        });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}


async function MYSQL_DELETE(MysqlModel, condition){    
    try{
        return await MysqlModel.destroy({
            where: condition, logging: ''
        });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }   
}

function MYSQL_GET_ALL_RESULTS_TO_ARRAY(mysqldata){
    var res = [];
    if (mysqldata.length>0){
        for (let data of mysqldata){
            res.push(data.dataValues);
        }
    }
    return res;
}


function GET_VALUES_FROM_OBJECT_BY_KEY (arrayobject, valuekey){
    var res = [];
    for (let data of arrayobject){
        res.push(data[valuekey]);
    }
    return res;
}

module.exports = {
    prepareDB: prepareDB,
    MYSQL_SAVE: MYSQL_SAVE,
    MYSQL_GET_ONE: MYSQL_GET_ONE,
    MYSQL_DELETE: MYSQL_DELETE,
    MYSQL_GET_ALL: MYSQL_GET_ALL,

    MYSQL_GET_ALL_RESULTS_TO_ARRAY: MYSQL_GET_ALL_RESULTS_TO_ARRAY,
    GET_VALUES_FROM_OBJECT_BY_KEY: GET_VALUES_FROM_OBJECT_BY_KEY,

    beatmapset_data: beatmapset_data,

}