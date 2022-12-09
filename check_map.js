const { v2, auth, tools, v1 } = require ('osu-api-extended');

const { OSU_LOGIN, OSU_PASSWORD, osu_api_error_restart_ms } = require('./config.js');

module.exports = {
    v2: function (){
        return v2;
    },

    init_osu: async function (){     
        var token = await auth.login_lazer(OSU_LOGIN, OSU_PASSWORD);
        if (typeof token.access_token === 'undefined'){
            await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
            throw new Error('osu not auth. restart');
        }
    },

    get_beatmap_info: async function(beatmapsetid){
        try{
            return await v2.beatmap.set(beatmapsetid).catch(reason=> { return reason; });
        }
        catch (e){
            console.log(e);
            await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
            throw new Error('error beatmap');
        }
    },
}
