$(document).ready(function(){
    function LabelApi(){
    }
    LabelApi.prototype._exec = function(url, method, params){
        var resObj = {}, 
            res = $.ajax({
                url: url,
                async: false,
                type: method || 'get',
                data: params,
                contentType: 'application/json'
            }).responseText;
        try {
            resObj = JSON.parse(res);
        }catch(e){
        }
        return resObj;
    };
    LabelApi.prototype.getAll = function(){
        return LabelApi.prototype._exec("/v1/graph/1/label");
    };
    LabelApi.prototype.put = function(graph_id, key, value){
        var put_data = {};
        put_data[key] = value;
        return LabelApi.prototype._exec("/v1/graph/"+(graph_id||'1')+"/label/"+key,'put',JSON.stringify(put_data));
    };

    $.LabelApi = LabelApi;
});
