const fs = require('fs');
const md5File = require('md5-file');
const { beatmap_modes } = require("./consts.js");

function readBeatmap(beatmapPath) {
    function getPropery(data) {
        var res = data.split(':');
        res.shift();
        return res.join(':').trim();
    }

    let beatmap_text = fs.readFileSync(beatmapPath, { encoding: 'utf-8' });
    beatmap_text = beatmap_text.split("\n");
    var beatmap_info = {};

    beatmap_info.md5_hash = md5File.sync(beatmapPath);

    for (let beatmap_row of beatmap_text) {
        if (beatmap_row.toLowerCase().trim().startsWith("artist:") == true) {
            beatmap_info.artist = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("title:") == true) {
            beatmap_info.title = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("creator:") == true) {
            beatmap_info.creator = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("version:") == true) {
            beatmap_info.difficulty = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("beatmapid") == true) {
            beatmap_info.beatmapID = getPropery(beatmap_row);
            beatmap_info.id = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("beatmapsetid") == true) {
            beatmap_info.beatmapsetID = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("mode") == true) {
            beatmap_info.gamemode = beatmap_modes[Number(getPropery(beatmap_row))];
        }

    }
    if (!beatmap_info.gamemode) {
        beatmap_info.gamemode = beatmap_modes[0];
    }
    return beatmap_info;
}
exports.readBeatmap = readBeatmap;
