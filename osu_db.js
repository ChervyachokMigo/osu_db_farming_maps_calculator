const fs = require('fs');

const osufile = require('./osu_reader_functions.js');

const { osuPath } = require('./config.js');

const osu_db_JSON_filename = 'osudb_data.json';

const { beatmap_modes } = require("./consts.js");

var osu_db = {
    beatmaps: {},
    isloaded: false,
    osu_version: 0,
};

function isLoaded(){
    return osu_db.isloaded;
}

async function init (){
    console.log('Инициализация osu_db');
    if(beatmaps_load()){
        console.log('Загружена osu_db');
        osu_db.isloaded = true;
        return true;
    } else {
        console.log('osu_db не обнаружена, будет спаршен osu.db...');
        if (await startParsingDB()){
            console.log('Парсинг завершен. Сохранение...');
            if (beatmaps_save()){
                console.log('Сохранена osu_db');
                osu_db.isloaded = true;
                return true;
            } else {
                console.log('Не удалось сохранить osu_db');
                return false;
            }
        } else {
            console.log('Не удалось спарсить osu.db');
            return false;
        }
    }
}

async function startParsingDB(){
    try{        
        await osufile.openFile(`${osuPath}\\osu!.db`);

        osu_db.osu_version = await osufile.getInt();
        
        osu_db.folder_count = await osufile.skipInt();

        osu_db.isAccountUnlocked = await osufile.skipBool();
        osu_db.AccountUnlockedDate = await osufile.skipDate();

        osu_db.playername = await osufile.skipString();

        osu_db.number_beatmaps = await osufile.getInt();

        osu_db.beatmaps = [];
        for (let i = 0; i < osu_db.number_beatmaps; i++){

            let beatmap = await parsingBeatmapData();
            if (beatmap.gamemode == 1){
                osu_db.beatmaps.push (beatmap);
            }

            if (i%150==0){
                console.log('Парсинг osu.db: ', Math.trunc ( i / osu_db.number_beatmaps * 1000 ) / 10, '%');
            }
        }

        osu_db.userPermissions = await osufile.skipInt();

        await osufile.closeFile();

        return true;
    } catch (e){
        console.log(e);
        return false;
    }
}

async function parsingBeatmapData(){
    var beatmap = {};

    if (osu_db.osu_version<20191106)
        beatmap.beatmap_size = await osufile.skipInt();

    beatmap.artist = await osufile.getString();

    beatmap.artist_unicode = await osufile.skipString();

    beatmap.title = await osufile.getString();

    beatmap.title_unicode = await osufile.skipString();

    beatmap.creator = await osufile.getString();
    beatmap.difficulty = await osufile.getString();

    beatmap.audio_filename = await osufile.skipString();
    
    beatmap.beatmap_md5 = await osufile.getString();
    beatmap.osu_filename = await osufile.getString();

    beatmap.ranked_status = await osufile.getByte();

    beatmap.number_hitcircles = await osufile.skipShort();
    beatmap.number_sliders = await osufile.skipShort();
    beatmap.number_spinners = await osufile.skipShort();

    beatmap.mod_date = await osufile.skipLong();

    if (osu_db.osu_version<20140609){
        beatmap.AR = await osufile.skipByte();
        beatmap.CS = await osufile.skipByte();
        beatmap.HP = await osufile.skipByte();
        beatmap.OD = await osufile.skipByte();
    } else {
        beatmap.AR = await osufile.skipSingle();
        beatmap.CS = await osufile.skipSingle();
        beatmap.HP = await osufile.skipSingle();
        beatmap.OD = await osufile.skipSingle();
    }
    beatmap.slider_velocity = await osufile.skipDouble();

    if (osu_db.osu_version>=20140609){
        let std = await osufile.skipIntDoublePair();
        let taiko = await osufile.getIntDoublePair();
        let ctb = await osufile.skipIntDoublePair();
        let mania = await osufile.skipIntDoublePair();
        beatmap.SRs = {
            taiko
        }
    }

    beatmap.draintime = await osufile.skipInt();
    beatmap.totaltime = await osufile.skipInt();
    beatmap.previewtime = await osufile.skipInt();

    beatmap.timingpoints = await osufile.skipTimingPoints2();

    beatmap.beatmapID = await osufile.getInt();
    beatmap.beatmapsetID = await osufile.getInt();
    beatmap.threadID = await osufile.skipInt();

    beatmap.gradeAchievedStd = await osufile.skipByte();
    beatmap.gradeAchievedTaiko = await osufile.skipByte();
    beatmap.gradeAchievedCTB = await osufile.skipByte();
    beatmap.gradeAchievedMania = await osufile.skipByte();

    beatmap.localoffset = await osufile.skipShort();

    beatmap.stackLaniecy = await osufile.skipSingle();

    beatmap.gamemode = await osufile.getByte();

    beatmap.songSource = await osufile.skipString();
    beatmap.songTags = await osufile.skipString();

    beatmap.onlineoffset = await osufile.skipShort();

    beatmap.fontTitle = await osufile.skipString();

    beatmap.isUnplayed = await osufile.skipBool();

    beatmap.lastPlayedTime = await osufile.skipLong();

    beatmap.isOSZ2 = await osufile.skipBool();

    beatmap.folderName = await osufile.getString();

    beatmap.lastCheckedRepositoryTime = await osufile.skipLong();

    beatmap.isIgnoreHitSounds = await osufile.skipBool();
    beatmap.isIgnoreSkin = await osufile.skipBool();
    beatmap.isDisableStoryboard = await osufile.skipBool();
    beatmap.isDisableVideo = await osufile.skipBool();
    beatmap.isVisualOverride = await osufile.skipBool();

    if (osu_db.osu_version<20140609)
        beatmap.unknownvalue = await osufile.skipShort();
    
    beatmap.mod_time = await osufile.skipInt();
    beatmap.maniaScroll = await osufile.skipByte();
    //console.log(beatmap);
    return beatmap;
}

function beatmaps_save(){
    try{
        fs.writeFileSync(osu_db_JSON_filename, JSON.stringify(osu_db.beatmaps), {encoding: 'utf-8'});
        return true;
    } catch (e){
        console.log(e);
        return false;
    }
}

function beatmaps_load(){
    try{
        osu_db.beatmaps = JSON.parse(fs.readFileSync(osu_db_JSON_filename, {encoding: 'utf-8'}));
        return true;
    } catch (e){
        if (e.code === 'ENOENT'){
            return false;
        }
        console.log(e);
        return false;
    }
}


function add_new_beatmaps(beatmaps){
    console.log('Добавление новых '+beatmaps.length+' карт в osu_db')
    for (let beatmap of beatmaps){
        osu_db.beatmaps.push (beatmap);
    }
    console.log('Пересохранение osu_db..');
    beatmaps_save();
    console.log('Пересохранено osu_db');
}

function find_beatmap_by_md5(beatmap_md5){
    let beatmap = (osu_db.beatmaps.filter(val=>val.beatmap_md5 === beatmap_md5)).shift();
    if (typeof beatmap !== 'undefined'){
        return beatmap;
    } else {
        return false;
    }
}

function find_beatmapset_by_id(beatmapset_id){
    let beatmap = osu_db.beatmaps.filter(val=>val.beatmapsetID === beatmapset_id);
    if (typeof beatmap !== 'undefined'){
        return beatmap;
    } else {
        return false;
    }
}

function get_beatmaps_by_mode_and_star(mode, star_min, star_max){
    let beatmaps = osu_db.beatmaps.filter(val=>{
        if (!val.SRs.taiko || val.SRs.taiko.length == 0) {
            return false
        }
        let sr_taiko = val.SRs.taiko[0].starrating_double;
        return beatmap_modes[val.gamemode] === mode && sr_taiko > star_min && sr_taiko < star_max;
    });
    return beatmaps;
}

module.exports = {
    init_osu_db: init,

    add_new_beatmaps: add_new_beatmaps,

    find_beatmap_by_md5: find_beatmap_by_md5,

    osu_db_isLoaded: isLoaded,

    find_beatmapset_by_id: find_beatmapset_by_id,

    get_beatmaps_by_mode_and_star: get_beatmaps_by_mode_and_star
};