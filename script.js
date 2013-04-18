$(document).ready(function(){
    $('div.yui-content div#line embed').remove();
    $('div.yui-content div#line').prepend('<div><div id="highchart"></div><div id="export"><ul><li><a href="" id="show_csv">csvで表示</a></li><li><a href="" id="label_mngr">ラベル</a></li></ul></div></div>');
    $('div.yui-content div#line').prepend('<div id="labelEditor" style="display:none" class="ui-widget-content ui-corner-all"><div id="innerLabelEditor"></div><a href="" id="updateLabel">更新</a></div>');


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
                zoomType: 'x',
                height:600
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
                },
                min:0
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
                layout: 'horizontal',
                //凡例の横位置
                align: 'center',
                //凡例の縦位置
                verticalAlign: 'bottom',
                x: 0,
                y: 0,
                borderWidth: 0
            },
            //グラフデータの設定
            series: ctx.data,

            plotOptions: {
                series: {
                    events: {
                        legendItemClick: function(event) {
                            ctx.visibleUpdated && ctx.visibleUpdated(event.target.userOptions.key, event.target.visible);
                        }
                    }
                }
            }
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
        this.table = table;

        // private methods
        function parse(){
            var firstTh = table.find("tr th").get(0),
                trs = table.find("tr"), series = [], categories = [];
            $(firstTh).html('<input type="checkbox" checked>');
            trs.each(function(){
                var tr = $(this), key, line = [], is_header = false;
                tr.children().each(function(){
                    var cell = $(this);
                    if(cell.is(opt.key)){
                        key = cell.text();
                        tr.attr('data-key',key);
                        cell.html('<input type="checkbox" data-key="'+key+'" checked><span>'+key+'</span>');
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
            table.on('click','tr[data-trtype="data"] input[type=checkbox]',function(e){
                var chkbox = $(e.currentTarget);
                chkbox.prop('checked', chkbox.prop('checked'));

                var chkboxes = table.find('tr[data-trtype="data"] input[type=checkbox]:checked');

                // if all is checked, check all-checkbox.
                var checked = chkboxes.length == _this.series.length;
                table.find('tr[data-trtype="header"] input[type=checkbox]').prop('checked', checked);

                opt.checked.call(_this,chkbox.attr('data-key'),chkbox.prop('checked'));
            });
            table.on('click','tr[data-trtype="header"] input[type=checkbox]',function(e){
                var chkbox = $(e.currentTarget),
                    checked = this.checked;
                table.find('tr input[type=checkbox]').prop('checked', checked);
                opt.checkedAll && opt.checkedAll.call(_this,checked);
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
        },
        updateChecked:function(key, checked){
            var table = this.table;
                tr = table.find('tr[data-key="'+checked+'"]').get(0),
                chkbox = tr.find('input[type=checkbox]').get(0);
            chkbox.attr('checked',checked);
          
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
        },
        checkedAll:function(checked){
            var method = checked ? 'show' : 'hide';
            for(var i in chart.series){
                setTimeout(function(i,checked){
                    checked ? chart.series[i].show() : chart.series[i].hide();
                },0,i,checked);
            }
        }
    });

    // convert from raw key data to label
    label_info && t.setLabels(label_info.labels);

    // Render chart
    var chart = renderChart({
        render_to:'highchart',
        x_text:'Date',
        y_text:'Calls',
        categories:t.categories,
        data:t.series,
        visibleUpdated:function(key,visible){
            t.updateChecked.call(t,key,visible);
        }
    });

    function bindUI(){
        $('a#label_mngr').on('click',function(e){
            var elm = $('#labelEditor'),
                editor = elm.find('div#innerLabelEditor'),
                html = '';

            editor.html(html);
            elm.toggle('slide',{},500);

            e.stopImmediatePropagation();
            e.preventDefault();
        });
        $('a#show_csv').on('click',function(e){
            opened = window.open('about:blank');
            var doc = opened.document;
            doc.writeln('"key","label","'+t.categories.join('","')+'"<br>');
            for(var i in t.series){
                doc.writeln('"'+t.series[i].key+'","'+t.series[i].name+'","'+t.series[i].data.join('","')+'"<br>');
            }
            e.stopImmediatePropagation();
            e.preventDefault();
        });
        $('a#updateLabel').on('click',function(e){
            e.stopImmediatePropagation();
            e.preventDefault();
        });
    }

    bindUI();
});
