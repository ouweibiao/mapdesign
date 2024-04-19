<template>
    <div>
        <div id="map"></div>
    </div>
</template>

<script setup lang="ts">

import { onMounted } from 'vue'

import signal from '../data/signal/signal0.json'
const BMapGL = window.BMapGL;

function init_map() {//地图的初始化
    var map = new BMapGL.Map('map'); // 创建Map实例
    map.centerAndZoom(new BMapGL.Point(114.080444, 22.550486), 18); // 初始化地图,设置中心点坐标和地图级别
    map.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放
    return map;
}

function extractNumberFromPath(path) {//提取字符串中的数字
    // TODO: 提取数字的逻辑，可以使用正则表达式或其他方法
    const regex = /[0-9]+/;
    const matches = path.match(regex);
    return matches ? matches[0] : '';
}
function change(number){//将路灯的状态数字改成字符串
    var status;
    switch (number) {
        case 0:
            status = '黄灯';
            break;
        case 1:
            status = '0、2号道路允许左转'
            break;
        case 2:
            status = '0、2号道路允许直行'
            break;
        case 3:
            status = '1、3号道路允许左转'
            break;
        case 4:
            status = '1、3号道路允许直行'
            break;
        case 5:
            status = '0号路口允许所有转向'
            break;
        case 6:
            status = '1号路口允许所有转向'
            break;
        case 7:
            status = '2号路口允许所有转向'
            break;
        case 8:
            status = '3号路口允许所有转向'
            break;

        default:
            status = '状态错误';
            break;
    }
    return status;
}
function loadTraffic(map,points, num, begintime, timetotal) {//创建交通灯图标
    var _overlay = new BMapGL.GroundPoint(points, {//在地图上生成交通灯的点
        scale: 1,
        // rotation: data.properties.angle || 0,
        anchor: new BMapGL.Size(0, 0),
        offset: new BMapGL.Size(0, 0),
        level: 18,
        type: 'image',
        size: new BMapGL.Size(15, 6),
        // url: 'https://mapopen-pub-jsapigl.bj.bcebos.com/demoimg/carpoint.png',
        url: 'https://img1.baidu.com/it/u=1528233516,3646415495&fm=253&fmt=auto&app=138&f=JPEG?w=50&h=261',
        opacity: 1
    });
    // _overlay.properties = data.properties;
    _overlay.on('click', function (e) {
        // console.log('click', e);
        // console.log("被点击了");
        var endtime = new Date();
        
        var k = Math.ceil((endtime - begintime) / 1000);   //代表第几秒
        k = (k <= timetotal.length) ? k : timetotal.length - 1;
        console.log(`第${k}秒`);
        // 创建图文信息窗口
        var opts = {
            width: 300,     // 信息窗口宽度
            height: 100,     // 信息窗口高度
            title: `交通灯${num+1}`, // 信息窗口标题
            message: "交通灯的具体信息"
        }
        var status = change(timetotal[k][num]);//当前存储交通灯的状态
        var status1;//下个不同的状态
        
        for(var i=k;i< timetotal.length;i++){
            if(timetotal[i][num]!=timetotal[k][num]){
               status1 = change(timetotal[i][num]);
               k = i - k;
               break;
            }
        }
        if(status1 == null){
            status1 = "无下一状态";
        }
        var string = "位置(" + points.lng + "," + points.lat + ")<br>当前状态:" + status + '<br>距下一状态('+status1+'):'+'<strong>'+k+'秒</strong>';
        var infoWindow = new BMapGL.InfoWindow(string, opts);  // 创建信息窗口对象 
        map.openInfoWindow(infoWindow, points); //开启信息窗口

    });
    _overlay.on('mousemove', function (e) {
        // console.log('mousemove', e);
        this.setScale(1 * 1.5);

    });
    _overlay.on('mouseout', function (e) {
        // console.log('mouseout', e);
        this.setScale(1 * 1);

    });
    map.addOverlay(_overlay);

}

onMounted(() => {
    var map = init_map();//地图的初始化
    console.log("signal为");
    console.log(signal);
    console.log("--------------------------------------------------------");
  

    var start = 0, end = 10;
    var len = signal.length;    
    var times = Math.ceil(len / 10);//向上取整，表示坐标转换需要调用API接口的次数

    var datas=[];  //用于存储转换后的坐标点
    //   坐标转换完之后的回调函数
    var translateCallback = function (data) {
        console.log(data);
        var i = start,j=0;
        for(i;i<end && j<10;i++,j++){
            datas[i] = data.points[j];
        }
        if(data.status!=0){//状态码不为0，则为转换失败
            console.log("坐标转换错误",data);
        }
        // var print = data.status == 0 ? data : "坐标转换错误";
        // console.log(print);
        times--;
        if(times > 0){//还没转换完
            start = end;
            end = (end+10)>len ? len :end+10;
           TransGPS();  //递归调用
        }
        else{
        console.log("坐标转换完毕");

          var timetotal = [];    //存储所有交通灯在0~999秒的状态
          var promises = [];
            const modules = import.meta.glob('../data/log/time*.json');
            for (const path in modules) {
                const promise = modules[path]().then((mod) => {
                    var count = extractNumberFromPath(path);
                    timetotal[count] = mod.default[mod.default.length - 2];  //只读取timex.json中的倒数第二个数组，添加到timetotal中
                });
                promises.push(promise);
            }
            //通过将每个异步操作返回的 Promise 存储在 promises 数组中，并使用 Promise.all() 方法等待所有的异步操作完成，
            Promise.all(promises).then(() => {
                var begintime = new Date(); //开始时间，用于后面  点击交通灯读取状态  可以知道是哪一秒
                // console.log("timetotal=",timetotal);
                for (var i = 0; i < datas.length; i++) {
                    loadTraffic(map,datas[i], i,begintime,timetotal);
                }
            });
        }


    }


    //转换坐标的函数
    function TransGPS() {
        var convertor = new BMapGL.Convertor();
        var temp = signal.slice(start, end).map(([x, y]) => new BMapGL.Point(x, y));                   
        convertor.translate(temp, COORDINATES_WGS84, COORDINATES_BD09, translateCallback)
    }
    setTimeout(TransGPS, 1000);


 






})



</script>

<style>
#map {
    overflow: hidden;
    height: 90vh;
    width: 100vw;
}

#btns {
    z-index: 999;
    position: fixed;
    bottom: 3.5rem;
    margin-left: 2.5rem;
    padding-left: 0;
    border-radius: .25rem;
    display: flex;
    box-shadow: 0 2px 6px 0 rgba(27, 142, 236, 0.5);
    text-align: center;
}

#btns li {
    border-right: 1px solid #d2d2d2;
    padding: 10px 10px;
    height: 100%;
    background-color: #fff;
    cursor: pointer;
    color: #3a79b5;
}
</style>
