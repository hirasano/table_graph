$(document).ready(function(){
    $('div.yui-content div#line embed').remove();
    $('div.yui-content div#line').prepend('<div><div id="highchart"></div><div id="export"><ul><li><a href="" id="show_csv">csvで表示</a></li></ul></div></div>');


    /**
     * エクステンションに埋め込まれたcssファイルを読み込み
     * manifest.jsonの設定が必要
     */
    var jq_css_url = chrome.extension.getURL("jquery-ui.css"),
        page_css_url = chrome.extension.getURL("page.css");
    $('body').prepend('<link href="'+jq_css_url+'" type="text/css" rel="stylesheet">');
    $('body').prepend('<link href="'+page_css_url+'" type="text/css" rel="stylesheet">');

    var labelApi = new $.LabelApi(),
        label_info = labelApi.getAll();

    // Get Chart Data
    var t = new $.ChartTable($('table'),{
        key:"td.numlist_b",
        value:"td.numlist",
        headerKey:"th.numlist_r",
        render_to:'highchart',
        x_text:'Date',
        y_text:'Calls'
    });

    // convert from raw key data to label
    label_info && t.setLabels(label_info);

    // Render chart
    t.renderChart();

    // csvファイル出力用リンククリックイベントハンドラ
    function bindUI(){
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
    }

    bindUI();
});
