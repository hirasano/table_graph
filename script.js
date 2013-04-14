$(document).ready(function(){
    $('body').prepend('<div id="chart"></div><div id="export"><ul><li><a href="" id="show_csv">csvで表示</a></li><li><a href="" id="label_mngr">ラベル</a></li></ul></div>');
    $('body').prepend('<div id="labelEditor" style="display:none" class="ui-widget-content ui-corner-all"></div>');


    /**
     * エクステンションに埋め込まれたcssファイルを読み込み
     * manifest.jsonの設定が必要
     */
    var jq_css_url = chrome.extension.getURL("jquery-ui.css"),
        page_css_url = chrome.extension.getURL("page.css");
    $('body').prepend('<link href="'+jq_css_url+'" type="text/css" rel="stylesheet">');
    $('body').prepend('<link href="'+page_css_url+'" type="text/css" rel="stylesheet">');

    function renderChart(ctx){
        return new Highcharts.Chart({
            chart: {
                type: ctx.type,
                //グラフ表示させるdivをidで設定
                renderTo: ctx.render_to,
                //グラフ右側のマージンを設定
                marginRight: 140,
                //グラフ左側のマージンを設定
                marginBottom: 40
            },
            //グラフのタイトルを設定
            title: {
                text:  ctx.title
            },
            //x軸のタイトルを設定
            xAxis: {
                title: {
                    text: ctx.x_text
                },
                //x軸に表示するデータを設定
                categories:ctx.categories,
                //小数点刻みにしない
                //allowDecimals: false
            },
            //y軸の設定
            yAxis: {
                title: {
                    //タイトル名の設定
                    text: ctx.y_text,
                    style: {
                       //タイトルの色を設定
                       color: '#4572A7',
                    }
                }
            },
            tooltip: {
                useHTML:true,
                formatter: function() {
                    return "<span>"+this.series.name+":"+this.y+"</span>";
                }
            },
            //凡例の設定
            legend: {
                //凡例が縦に並ぶ
                layout: 'vertical',
                //凡例の横位置
                align: 'right',
                //凡例の縦位置
                verticalAlign: 'top',
                x: -10,
                y: 100,
                borderWidth: 0
            },
            //グラフデータの設定
            series: ctx.data
        });
    }

    /**
     * ChartTable class
     */
    var ChartTable = function(table, opt){
        var _this = this, table = table, opt = opt;
        this.series = [];
        this.categories = [];
        this.keyCells = {};

        // private methods
        function parse(){
            var trs = table.find("tr"), series = [], categories = [];
            trs.each(function(){
                var tr = $(this), key, line = [], is_header = false;
                tr.children().each(function(){
                    var cell = $(this);
                    if(cell.is(opt.key)){
                        key = cell.text();
                        tr.attr('data-key',key);
                        cell.html('<input type="checkbox" checked><span data-key="'+key+'">'+key+'</span>');
                        _this.keyCells[key] = cell;
                    } else if(cell.is(opt.value)){
                        line.push(parseInt(cell.text()));
                    } else if(cell.is(opt.headerKey)){
                        line.push(cell.text());
                        is_header = true;
                    }
                });
                is_header ? categories = line : series.push({key:key, name:key, data:line});
                is_header ? tr.attr('data-trtype', 'header') : tr.attr('data-trtype', 'data');
            });
            _this.series = series;
            _this.categories = categories;
        }

        function bind(){
            table.on('click','tr input[type=checkbox]',function(e){
                var tr = $(e.currentTarget).closest('tr');
                if(tr.attr('data-trtype') == 'data' && opt.checked){
                    var chkbox = $(e.currentTarget);
                    console.log(chkbox.attr('checked'));
                    chkbox.attr('checked') ? chkbox.attr('checked',false) : chkbox.attr('checked',true);
                    opt.checked.call(_this,tr.attr('data-key'),chkbox.attr('checked'));
                } 
            });
        }

        parse();
        bind();
    };
    ChartTable.prototype = {
        setLabels:function(label_info){
            var keyCells = this.keyCells;
            for(var i in keyCells){
                var span = $(keyCells[i].find('span').get(0)),
                    key = span.attr('data-key');
                label_info[key] && span.text(label_info[key]);
            }
            var series = this.series;
            for(var i in series){
                var key = series[i].name;
                label_info[key] && (series[i].name = label_info[key]);
            }
        }
    };

    /**
     * Business logic
     */
    // Get Label Data
    var label_info,
        label_data = $.ajax({
        url: "/sample.json",
        async: false
    }).responseText;
    try {
        label_info = JSON.parse(label_data);
    }catch(e){
    }

    // Get Chart Data
    var t = new ChartTable($('table'),{
        key:"td.numlist_b",
        value:"td.numlist",
        headerKey:"th.numlist_r",
        checked:function(key,checked){
            var method = checked ? 'show' : 'hide';
            for(var i in chart.series){
                var series = chart.series[i];
                if(series.userOptions.key == key){
                    if(checked && !series.visible){
                        series.show();
                    } else if(!checked && series.visible){
                        series.hide();
                    }
                    return;
                }
            }
        }
    });

    // convert from raw key data to label
    label_info && t.setLabels(label_info.labels);

    var chart = renderChart({
        render_to:'chart',
        x_text:'Date',
        y_text:'Calls',
        categories:t.categories,
        data:t.series
    });

    function bindUI(){
        $('a#label_mngr').on('click',function(e){
            var elm = $('#labelEditor');
            elm.html('<span>hello world</span>');
            elm.toggle('slide',{},500);

            e.stopImmediatePropagation();
            e.preventDefault();
        });
    }

    bindUI();
});