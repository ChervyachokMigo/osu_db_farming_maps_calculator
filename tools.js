function formatAddZero(t, symbols = 1) {
    var numberZeroed = t.toString();
    var numberLength = t.toString().length;
    if (numberZeroed.length < symbols) {
        for (var i = 0; i < symbols - numberLength; i++) {
            numberZeroed = `0${numberZeroed}`;
        }
    }
    return numberZeroed;
}

function get_date_string(date){
    return `${date.getFullYear()}-${formatAddZero(date.getMonth()+1, 2)}-${formatAddZero(date.getDate(), 2)}`;
}

function escapeString (text){
    return text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, '');
}

function GET_VALUES_FROM_OBJECT_BY_KEY (arrayobject, valuekey){
    var res = [];
    for (let data of arrayobject){
        res.push(data[valuekey]);
    }
    return res;
}

function get_versions_but_fruits (beatmapobject, valuekey){
    var res = [];
    for (let data of beatmapobject){
        if (data.mode_int !== 2){
            res.push(data[valuekey]);
        }
    }
    return res;
}

exports.GET_VALUES_FROM_OBJECT_BY_KEY = GET_VALUES_FROM_OBJECT_BY_KEY;
exports.get_versions_but_fruits = get_versions_but_fruits;
exports.escapeString = escapeString;
exports.get_date_string = get_date_string;
exports.formatAddZero = formatAddZero;
