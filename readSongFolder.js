const fs = require('fs');
const path = require('path');
const { readBeatmap } = require("./readBeatmap");

const colors = require('colors');

async function readSongFolder(folder_osusongs, folderpath) {
    var absolute_folder_path = folder_osusongs + '/' + folderpath;

    var beatmap_files = fs.readdirSync(absolute_folder_path, { encoding: 'utf-8' });

    var beatmaps_data = [];

    if (beatmap_files.length > 0) {
        for (let filename of beatmap_files) {
            if (path.extname(filename).toLowerCase() === '.osu') {

                let beatmap_info = readBeatmap(`${absolute_folder_path}/${filename}`);

                if (beatmap_info.beatmapsetID || beatmap_info.beatmapsetID > 0) {
                    beatmap_info.localfolder = folderpath;
                    beatmaps_data.push(beatmap_info);
                }
            }
        }
        if (beatmaps_data.length > 0) {
            console.log(' * найдено ', beatmapset.beatmap.length, 'карт');
            return beatmapset;
        }
    }
    console.log(' * папка пуста'.yellow, absolute_folder_path);
    return undefined;
}

exports.readSongFolder = readSongFolder;
