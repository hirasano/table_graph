$(document).ready(function(){

    /**
     * ChartTable class
     */
    var ChartTable = function(table, opt){
        var _this = this, table = table;
        this.series = [];
        this.categories = [];
        this.keyCells = {};
        this.table = table;
        this.opt = opt;
        this.labelApi = new $.LabelApi();

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
                        cell.addClass('view');
                        cell.html('<div class="tdframe"><input type="checkbox" id="__key-'+key+'" data-key="'+key+'" checked><div class="view"><a href="#" class="label link">'+key+'</a></div><div class="edit"><input type="text"></div></div>');
                        _this.keyCells[key] = {cell:cell,key:key};
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

        function updateLabel(td, key, val){
            var key = $(td.find('input[type=checkbox]:first')).attr('data-key'),
                val = $(td.find('input[type=text]:first')).prop('value'),
                series = _this.chart.series;
            for(var i in series){
                if(series[i].userOptions.key == key){
                    series[i].userOptions.name = val;
                    series[i].update(series[i].userOptions, true);
                }
            }
            _this.labelApi.put('1', key, val);
            $(td.find('a.label:first')).text(val);
            updateTd(td,false);
        }
        function updateTd(td, edit){
            var rmClass = edit ? 'view' : 'edit',
                addClass = edit ? 'edit' : 'view';
            td.removeClass(rmClass);
            td.addClass(addClass);
        }

        function bind(){
            table.on('click','tr[data-trtype="data"] input[type=checkbox]', function(e){
                var chkbox = $(e.currentTarget);
                chkbox.prop('checked', chkbox.prop('checked'));

                var chkboxes = table.find('tr[data-trtype="data"] input[type=checkbox]:checked');

                // if all is checked, check all-checkbox.
                var checked = chkboxes.length == _this.series.length;
                table.find('tr[data-trtype="header"] input[type=checkbox]').prop('checked', checked);

                var key = chkbox.attr('data-key'),
                    checked = chkbox.prop('checked'),
                    method = checked ? 'show' : 'hide';
                for(var i in _this.chart.series){
                    var series = _this.chart.series[i];
                    if(series.userOptions.key == key){
                        if(checked && !series.visible){
                            series.show();
                        } else if(!checked && series.visible){
                            series.hide();
                        }
                        break;
                    }
                }
            });
            table.on('click','tr[data-trtype="header"] input[type=checkbox]', function(e){
                var chkbox = $(e.currentTarget),
                    checked = this.checked,
                    chart = _this.chart;
                table.find('tr input[type=checkbox]').prop('checked', checked);
                var method = checked ? 'show' : 'hide';
                for(var i in chart.series){
                    setTimeout(function(i,checked){
                        checked ? chart.series[i].show() : chart.series[i].hide();
                    },0,i,checked);
                }
            });
            table.on('click','div.view a',function(e){
                e.stopImmediatePropagation();
                e.preventDefault();

                var td = $(e.currentTarget).parents('td');
                updateTd(td,true);

                var textInput = td.find('input[type=text]:first');
                textInput.focus();
                textInput.unbind('keydown');
                textInput.keydown(function(e){
                    switch(e.keyCode){
                        case 13:
                            updateLabel($(e.currentTarget).parents('td'));
                            break;
                        case 27:
                            updateTd($(e.currentTarget).parents('td'),false);
                            break;
                    }
                });
            });
            table.on('click','div.edit a',function(e){
                e.stopImmediatePropagation();
                e.preventDefault();

                updateLabel($(e.currentTarget).parents('td'));
            });
        }

        parse();
        bind();
    };
    ChartTable.prototype = {
        setLabels:function(label_info){
            var keyCells = this.keyCells;
            for(var i in keyCells){
                var label = $(keyCells[i].cell.find('a.label:first')),
                    key = keyCells[i].key;
                label_info[key] && label.text(label_info[key]);
            }
            var series = this.series;
            for(var i in series){
                var key = series[i].name;
                label_info[key] && (series[i].name = label_info[key]);
            }
        },
        updateChecked:function(key, checked){
            var table = this.table;
                tr = table.find('tr[data-key="'+checked+'"]:first'),
                chkbox = tr.find('input[type=checkbox]:first');
            chkbox.attr('checked',checked);
          
        },
        renderChart:function(ctx){
            var _this = this,
                opt = _this.opt;
            _this.chart = new Highcharts.Chart({
                chart: {
                    type: ctx && ctx.type || opt && opt.type,
                    //グラフ表示させるdivをidで設定
                    renderTo: ctx && ctx.render_to || opt && opt.render_to,
                    zoomType: 'x',
                    height:600
                },
                //グラフのタイトルを設定
                title: {
                    text:  ctx && ctx.title || opt && opt.title
                },
                //x軸のタイトルを設定
                xAxis: {
                    title: {
                        text: ctx && ctx.x_text || opt && opt.x_text
                    },
                    //x軸に表示するデータを設定
                    categories:_this.categories,
                    //小数点刻みにしない
                    //allowDecimals: false
                },
                //y軸の設定
                yAxis: {
                    title: {
                        //タイトル名の設定
                        text: ctx && ctx.y_text || opt && opt.y_text,
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
                series: _this.series,
                plotOptions: {
                    series: {
                        events: {
                            legendItemClick: function(event) {
                                _this.updateChecked.call(_this,key,visible);
                            }
                        }
                    }
                }
            });
            return _this.chart;
        }
    };
    $.ChartTable = ChartTable;
});
