const { init_osu, get_beatmap_info } = require('./check_map.js');

const { prepareDB, MYSQL_GET_ONE, MYSQL_SAVE , beatmapset_data, MYSQL_DELETE } = require('./DB.js');
const { init_osu_db, get_beatmaps_by_mode_and_star } = require('./osu_db.js');
const { beatmap_modes } = require("./consts.js");
const  fs = require('fs');
const { buff2int } = require('./osu_reader_functions.js');

const farming_maps_json = 'farming_maps.json';
const new_connection_db = 'new_collection.db';
var farming_maps;

var skip = true;

async function get_laser_stars(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 0, 10);
    for (let beatmap_local of beatmaps_local){
        
        /*if (skip == true && beatmap_local.artist.toLowerCase().startsWith('na')){
            skip = false;
        }
        if (skip == true){
            continue
        }*/

        if (beatmap_modes[beatmap_local.gamemode] !== 'taiko' || 
            Number(beatmap_local.beatmapsetID) == 4294967295||
            Number(beatmap_local.beatmapsetID) <= 0){
                console.log('beatmapset id undefined or equal zero');
                console.log('delete', beatmap_local.beatmapID, beatmap_local.artist, beatmap_local.title)
                try{
                    await MYSQL_DELETE(beatmapset_data,  {beatmap_id: beatmap_local.beatmapID})
                } catch (e){
                    console.log(e)
                }
            continue;
        }

        //console.log('существует ли карта в базе ', beatmap_local.beatmapsetID)
        let stored_beatmap_data = await MYSQL_GET_ONE(beatmapset_data, {beatmapset_id: beatmap_local.beatmapsetID});

        //if( stored_beatmap_data.ranked == 0 ){
           /* console.log('delete', beatmap_local.beatmapID, beatmap_local.artist, beatmap_local.title)
            try{
                await MYSQL_DELETE(beatmapset_data,  {beatmap_id: beatmap_local.beatmapID})
            } catch (e){
                console.log(e)
            }*/
        //continue;
        //}

        if (!stored_beatmap_data){
            console.log('получаем информацию с банчо о ',beatmap_local.beatmapsetID)
            var bancho_beatmapset;

            do {
                bancho_beatmapset = await new Promise (async (res, rej)=>{
                    try{
                        let beatmap_response = await get_beatmap_info(beatmap_local.beatmapsetID);
                
                        if (typeof beatmap_response !== 'object'){
                            console.log(beatmap_response)

                            res(false)

                        } else {
                            res (beatmap_response)
                        }
                    } catch (e){
                        console.log(e);
                        res(false)
                    }
                });
            } while ((!bancho_beatmapset || typeof bancho_beatmapset !== 'object' ));
          
            if (bancho_beatmapset.id){
                for (let bancho_beatmap of bancho_beatmapset.beatmaps){
                    let beatmap_savedata = {
                        beatmapID: bancho_beatmap.id,
                        beatmapsetID: bancho_beatmapset.id,
                        gamemode: beatmap_modes[bancho_beatmap.mode_int],
                        artist: bancho_beatmapset.artist,
                        title: bancho_beatmapset.title,
                        creator: bancho_beatmapset.creator,
                        difficulty: bancho_beatmap.version,
                        star_taiko_lazer: bancho_beatmap.difficulty_rating,
                        ranked: bancho_beatmap.ranked,
                        md5: bancho_beatmap.checksum
                    }
                    
                   // if (beatmap_savedata.ranked <= 0){
                        //console.log('delete', beatmap_savedata.beatmapID, beatmap_savedata.artist, beatmap_savedata.title)
                        /*try{
                            await MYSQL_DELETE(beatmapset_data,  {beatmap_id: beatmap_local.beatmapID})
                        } catch (e){
                            console.log(e)
                        }*/
                       // continue;
                    //}
                    
                    /*if (!beatmap_modes[bancho_beatmap.mode_int].startsWith('taiko')){
                        console.log('delete', beatmap_savedata.beatmapID, beatmap_savedata.artist, beatmap_savedata.title)
                        try{
                            await MYSQL_DELETE(beatmapset_data,  {beatmap_id: beatmap_local.beatmapID})
                        } catch (e){
                            console.log(e)
                        }
                        continue;
                    }*/

                    console.log('saving', beatmap_savedata.beatmapID, beatmap_savedata.artist, beatmap_savedata.title)

                    await MYSQL_SAVE(beatmapset_data, 
                        {beatmapset_id: beatmap_savedata.beatmapsetID, beatmap_id: beatmap_savedata.beatmapID}, 
                        beatmap_savedata);

                }
            } else {
                console.log('карты не существует', bancho_beatmapset.id, beatmap_local.beatmapsetID)
                console.log('delete', beatmap_local.beatmapsetID )
                await MYSQL_DELETE(beatmapset_data,  {beatmapset_id: beatmap_local.beatmapsetID})
            }

        } else {
            //process.stdout.write (beatmap_local.beatmapsetID+' ')
           // console.log('скип карты ', beatmap_local.beatmapsetID)
        }
    }
    console.log('Закончено')
}

async function set_local_stars(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 0, 10);
    for (let beatmap_local of beatmaps_local){
        if (!beatmap_local.SRs.taiko || beatmap_local.SRs.taiko.length == 0) {
            continue
        }
        try{
             //console.log('существует ли карта в базе ', beatmap_local.beatmapsetID)
            let stored_beatmap_data = await MYSQL_GET_ONE(beatmapset_data, {beatmap_id: beatmap_local.beatmapID});
            
            if (stored_beatmap_data == false){
                console.log(' S карты нет в базе', beatmap_local.beatmapID);
                continue;
            }
            if (stored_beatmap_data.star_taiko_local !== 0 ){
                console.log(' S у карты уже записан local star', beatmap_local.beatmapID);
                continue;
            }

            await MYSQL_SAVE(beatmapset_data, 
                {beatmapset_id: beatmap_local.beatmapsetID, beatmap_id: beatmap_local.beatmapID}, 
                {star_taiko_local: Number((Math.floor(beatmap_local.SRs.taiko[0].starrating_double*100)/100).toFixed(2)) });
            
        } catch (e){
            console.log(e);
        }
    }
    console.log('Закончено')
}

/*
async function set_local_difficulty(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 0, 10);
    for (let beatmap_local of beatmaps_local){
        if (!beatmap_local.SRs.taiko || beatmap_local.SRs.taiko.length == 0) {
            continue
        }
        if (beatmap_modes[beatmap_local.gamemode] == 'taiko'){
            await MYSQL_SAVE(beatmapset_data, 
                {beatmap_id: beatmap_local.beatmapID }, 
                {difficulty: beatmap_local.difficulty });
        }
    }
    console.log('Закончено')
}*/

async function recalculate_farming_maps(start_star = 0, end_star = 10){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', start_star, end_star);

    let farming_beatmaps = [];

    for (let beatmap_local of beatmaps_local){
        if (typeof beatmap_local.SRs.taiko === 'undefined' || 
            beatmap_local.SRs.taiko.length == 0) {
            continue;
        }

        let mysql_data = await MYSQL_GET_ONE(beatmapset_data, {beatmap_id: Number(beatmap_local.beatmapID)});
        if (mysql_data == null){
            continue;
        }

        if (mysql_data.star_taiko_local >= start_star && 
            mysql_data.star_taiko_local <= end_star){
            
            if (mysql_data.star_taiko_local > 0 && mysql_data.star_taiko_lazer >0 ){
                farming_beatmaps.push({
                    beatmap_star_local: mysql_data.star_taiko_local,
                    star_difference: Number((mysql_data.star_taiko_lazer - mysql_data.star_taiko_local).toFixed(2)),
                    beatmap_data: mysql_data
                });
            }
        }
    }

    fs.writeFileSync(farming_maps_json, JSON.stringify(farming_beatmaps));

    console.log('Закончено')
}

function read_farming_maps(stars_min = 0, stars_max = 10, strength_min = -99, strength_max = 99){
    var finded_maps = farming_maps.filter(val=> {
        return val.beatmap_data.ranked == 1 && val.beatmap_star_local >= stars_min && val.beatmap_star_local <= stars_max &&
            val.star_difference >= strength_min && val.star_difference <= strength_max
    });
    return finded_maps;

    if (finded_maps.length>0){
        for (let map of finded_maps){
            console.log(map.beatmap_data.artist, map.beatmap_data.title)
            console.log(map.beatmap_data.star_taiko_local,'->', map.beatmap_data.star_taiko_lazer)
            console.log(`https://osu.ppy.sh/beatmapsets/${map.beatmap_data.beatmapset_id}#taiko/${map.beatmap_data.beatmap_id}`)
            console.log(`direct: osu://b/${map.beatmap_data.beatmap_id}`);
        }
    }
    
}

function get_random_beatmap(stars_min = 0, stars_max = 10, strength_min = -99, strength_max = 99){
    var finded_maps = farming_maps.filter(val=> {
        return val.beatmap_star_local > stars_min && val.beatmap_star_local < stars_max &&
            val.star_difference > strength_min && val.star_difference < strength_max
    });
    if (finded_maps.length>0){
        return finded_maps[Math.trunc(Math.random()*finded_maps.length)];
    } else {
        return false;
    }
}


function load_farming_maps(){
    console.log("load farming maps...");
    farming_maps = JSON.parse(fs.readFileSync(farming_maps_json));
}

async function recalculate_db(){
    await prepareDB();
    await init_osu_db();

    await init_osu();   //connect to peppy

    await get_laser_stars();

    await set_local_stars();

    await recalculate_farming_maps(0, 10);
}

async function initialize(){
    load_farming_maps();
    //read_farming_maps(4.3, 5.2, 0.2); //test
}

async function create_taiko_collections_example(){
    if (!fs.existsSync(farming_maps_json)){
        await recalculate_db();
    }
    load_farming_maps();
    const maps = {
        'taiko_maps_useless':   read_farming_maps(0, 10, -10, -0.2),
        'taiko_maps_low':       read_farming_maps(0, 10, -0.2, 0),
        'taiko_maps_middle':    read_farming_maps(0, 10, 0, 0.2),
        'taiko_maps_farm_1':    read_farming_maps(0, 10, 0.2, 0.4),
        'taiko_maps_farm_2':    read_farming_maps(0, 10, 0.4, 0.6),
        'taiko_maps_farm_extra': read_farming_maps(0, 10, 0.6, 10)
    };

    create_collections_with_stream(maps, new_connection_db);

}

function create_collections_with_stream(maps, filepath){

    var maps_keys = Object.keys(maps);

    var stream = fs.createWriteStream(filepath, 'binary');

    writeUInt32LE(stream, 0x20230108);
    writeUInt32LE(stream, maps_keys.length );

    for (let i = 0; i < maps_keys.length ; i++){
        console.log(maps[maps_keys[i]])
        //write uleb string name of collection
        stream.write( 
            getBufferFromULEB128String( 
                maps_keys[i]
            )
        );
        
        //write count of maps
        writeUInt32LE(stream, maps[maps_keys[i]].length);
        
        //write maps md5 strings
        for (let m in maps[maps_keys[i]]){
            stream.write(getBufferFromULEB128String(maps[maps_keys[i]][m].beatmap_data.md5));
        }
    }

    stream.close();

    console.log('collection created successfully');

}

function writeUInt32LE(stream, value){
    var buf = Buffer.alloc(4);
    buf.writeUInt32LE(value)
    stream.write(buf);
}

function getBufferFromULEB128String(text){
    cursor_offset += 2 + text.length;
    let buf = Buffer.alloc(2 + text.length);
    buf.writeUint8(11, 0);    
    buf.writeUint8(encodeSignedLeb128FromInt32(text.length)[0], 1);
    buf.write(text, 2 ,'utf8')
    return buf;
}

var cursor_offset = 0;

const encodeSignedLeb128FromInt32 = (value) => {
    value |= 0;
    const result = [];
    while (true) {
      const byte_ = value & 0x7f;
      value >>= 7;
      if (
        (value === 0 && (byte_ & 0x40) === 0) ||
        (value === -1 && (byte_ & 0x40) !== 0)
      ) {
        result.push(byte_);
        return result;
      }
      result.push(byte_ | 0x80);
    }
};


create_taiko_collections_example();

exports.taiko_farming_maps_initialize = initialize;
exports.taiko_read_farming_maps = read_farming_maps;
exports.taiko_farming_maps_recalculate_db = recalculate_db;
exports.taiko_farming_maps_get_random_beatmap = get_random_beatmap;