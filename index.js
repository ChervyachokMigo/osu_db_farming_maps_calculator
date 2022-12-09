const { init_osu, get_beatmap_info } = require('./check_map.js');

const { prepareDB, MYSQL_GET_ONE, MYSQL_SAVE , beatmapset_data } = require('./DB.js');
const { init_osu_db, get_beatmaps_by_mode_and_star } = require('./osu_db.js');
const { beatmap_modes } = require("./consts.js");
const  fs = require('fs');

async function get_laser_stars(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 4, 10);
    for (let beatmap_local of beatmaps_local){
        console.log('существует ли карта в базе ', beatmap_local.beatmapsetID)
        let stored_beatmap_data = await MYSQL_GET_ONE(beatmapset_data, {beatmapset_id: Number(beatmap_local.beatmapsetID)});
        if (stored_beatmap_data == false){
            console.log('получаем информацию с банчо о ',beatmap_local.beatmapsetID)
            let bancho_beatmapset = await get_beatmap_info(beatmap_local.beatmapsetID);
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
                        star_taiko_lazer: bancho_beatmap.difficulty_rating
                    }
                    console.log('saving',beatmap_savedata)
                    await MYSQL_SAVE(beatmapset_data, 
                        {beatmapset_id: beatmap_savedata.beatmapsetID, beatmap_id: beatmap_savedata.beatmapID}, 
                        beatmap_savedata);

                }
            } else {
                console.log('карты не существует', bancho_beatmapset.id)
            }

        } else {
            console.log('скип карты ', beatmap_local.beatmapsetID)
        }
    }
    console.log('Закончено')
}

async function set_local_stars(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 4, 10);
    for (let beatmap_local of beatmaps_local){
        if (!beatmap_local.SRs.taiko || beatmap_local.SRs.taiko.length == 0) {
            continue
        }
        try{
        await MYSQL_SAVE(beatmapset_data, 
            {beatmapset_id: beatmap_local.beatmapsetID, beatmap_id: beatmap_local.beatmapID}, 
            {star_taiko_local: Number((Math.floor(beatmap_local.SRs.taiko[0].starrating_double*100)/100).toFixed(2)) });
        } catch (e){
            console.log(e);
        }
    }
    console.log('Закончено')
}

async function set_local_difficulty(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 4, 10);
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
}

async function compare_stars(){
    let beatmaps_local = get_beatmaps_by_mode_and_star('taiko', 4, 10);
    //let random_id = Math.trunc(Math.random()*beatmaps_local.length);
    let farming_beatmaps = {};
    for (let i = 4; i<=10; i++){
        farming_beatmaps[i.toString()] = {standart: [], fiveteen: [], thirty: [], more: [], lowstar: []};
    }
    for (let beatmap_local of beatmaps_local){
        if (!beatmap_local.SRs.taiko || beatmap_local.SRs.taiko.length == 0) {
            continue
        }
        let mysql_data = await MYSQL_GET_ONE(beatmapset_data, {beatmap_id: Number(beatmap_local.beatmapID)});
        console.log(Math.trunc(mysql_data.star_taiko_local).toString())
        if (mysql_data !== null && Math.trunc(mysql_data.star_taiko_local)>=4 && Math.trunc(mysql_data.star_taiko_local)<=10){
            if (mysql_data.star_taiko_local <= mysql_data.star_taiko_lazer){
                if (mysql_data.star_taiko_local + 0.15 < mysql_data.star_taiko_lazer){
                    if (mysql_data.star_taiko_local + 0.30 < mysql_data.star_taiko_lazer){
                        if (mysql_data.star_taiko_local + 0.60 < mysql_data.star_taiko_lazer){
                            farming_beatmaps[Math.trunc(mysql_data.star_taiko_local).toString()].more.push(mysql_data);
                        } else {
                            farming_beatmaps[Math.trunc(mysql_data.star_taiko_local).toString()].thirty.push(mysql_data);
                        }
                    } else {
                        farming_beatmaps[Math.trunc(mysql_data.star_taiko_local).toString()].fiveteen.push(mysql_data);
                    }
                } else {
                    farming_beatmaps[Math.trunc(mysql_data.star_taiko_local).toString()].standart.push(mysql_data);
                }
            } else {
                farming_beatmaps[Math.trunc(mysql_data.star_taiko_local).toString()].lowstar.push(mysql_data);
            }
        }
    }
    fs.writeFileSync('farming_maps.json', JSON.stringify(farming_beatmaps));
   // console.log(beatmaps_local, random_id)
    //let mysql_data = await MYSQL_GET_ONE(beatmapset_data, {beatmap_id: Number(beatmaps_local[random_id].beatmapID)});
    console.log('Закончено')
}

async function read_farming_maps(stars, strength){
    var farming_maps = JSON.parse(fs.readFileSync('farming_maps.json'));
    for (let map of farming_maps[stars.toString()][strength]){
        console.log(map.artist, map.title)
        console.log(map.star_taiko_local,'->', map.star_taiko_lazer)
        console.log(`https://osu.ppy.sh/beatmapsets/${map.beatmapset_id}#taiko/${map.beatmap_id}`)
    }
    
}

async function initialize(){
    await prepareDB();
    await init_osu_db();

   // await init_osu();

    //await set_local_difficulty();

    //await get_laser_stars();

    //await set_local_stars();

    //await compare_stars();

    await read_farming_maps(4, 'thirty')
}

initialize ();

